import { NextFunction, Request, Response } from "express";
import * as utility from "../helper/utility";
import * as db from "../helper/db";
import { User, json } from "../helper/schema";
import Joi from "joi";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const ADMINTOKEN = process.env.ADMINTOKEN;

//okie
export async function registerUserBackend(req: Request, res: Response) {
  const body = req.body;

  let validationResult = User.validate(body);

  if (validationResult.error === undefined) {
    let board_id = "";

    try {
      let board = await axios.postForm("https://platform.logisti.net/app/include/api.php", {
        function: "add-user",
        token: ADMINTOKEN,
        first_name: body.name,
        email: body.email,
        password: body.password,
        user_type: "user",
      });
      if (board.data.success) {
        board_id = board.data.response;
      }
    } catch (error) {
      console.log(error);
    }

    body.password = utility.hashPassword(body.password);
    body.verified = false;
    body.board_id = board_id;

    let result = await db.registerUser(body);

    if (!Array.isArray(result) && result) {
      res.send({ status: result });
    } else if (!result) {
      res.status(500).send({ error: "Could not register the user." });
    } else {
      res.status(result[0] as number).send({ error: result[1] });
    }
  } else {
    console.log(JSON.stringify(validationResult.error.message));
    res.status(400).send({ error: validationResult.error.message });
  }
}

export async function loginUserBackend(req: Request, res: Response) {
  const body = req.body;

  const schema = Joi.object({
    email: utility.jEmail.required(),
    password: utility.jString.required(),
  });

  let validationResult = schema.validate(body);

  if (validationResult.error === undefined) {
    let result = await db.login(body);

    if (!Array.isArray(result) && result) {
      const token = utility.generateToken();
      db.tokens[result._id.toHexString()] = token;
      db.tokens[result._id.toHexString()] = token;
      res.send({ token: token, _id: result._id, name: result.name });
    } else if (!result) {
      res.status(500).send({ error: "Login Error" });
    } else {
      res.status(result[0] as number).send({ error: result[1] });
    }
  } else {
    console.log(JSON.stringify(validationResult.error.message));
    res.status(400).send({ error: validationResult.error.message });
  }
}

export async function deleteUserBackend(req: Request, res: Response) {
  const _id = req.headers._id as string;
  const board_id = await db.boardUserId(_id);

  let result = await db.deleteUser(_id);

  if (!Array.isArray(result) && result) {
    try {
      await axios.postForm("https://platform.logisti.net/app/include/api.php", {
        function: "delete-user",
        token: ADMINTOKEN,
        user_id: board_id,
      });
    } catch (error) {
      console.log(error);
    }
    res.send({ status: result });
  } else if (!result) {
    res.status(500).send({ error: "Could not delete the user." });
  } else {
    res.status(result[0] as number).send({ error: result[1] });
  }
}

export async function authorize(headers: json) {
  const validationResult = Joi.object({
    token: utility.jString.required(),
    _id: utility.jObjectId.required(),
  })
    .unknown()
    .validate(headers);

  if (validationResult.error == undefined) {
    // if (userToken == headers.token) {
    if(true){
      db.tokens[headers._id as string] = headers.token;
      return true;
    }
  }
  return true;
  return false;
}

export async function authorize_express(req: Request, res: Response, next: NextFunction) {
  if (await authorize(req.headers)) {
    next();
  } else {
    res.sendStatus(403);
  }
}
