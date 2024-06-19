import { Request, Response, json } from "express";
import * as utility from "../helper/utility";
import * as db from "../helper/db";
import Joi from "joi";
import axios from "axios";
import WebSocket from "ws";
import dotenv from "dotenv";

dotenv.config();

const ADMINTOKEN = process.env.ADMINTOKEN;
const AGENTSURL = process.env.AGENTSURL;
const SUPPORTBOARDURL = process.env.SUPPORTBOARDURL;
export async function getUserChatsBackend(req: Request, res: Response) {
  const _id = req.headers._id as string;
  const chats = await db.getUserChats(_id);
  res.send(chats);
}

export async function getUserChatBackend(req: Request, res: Response) {
  const chat_id = req.params.chat_id;
  const _id = req.headers._id as string;

  const validationResult = utility.jObjectId.validate(chat_id);

  if (validationResult.error === undefined) {
    const result = await db.getUserChat(_id, chat_id);

    if (result != null) {
      res.send(result);
    } else {
      res.sendStatus(404);
    }
  } else {
    console.log(JSON.stringify(validationResult.error.message));
    res.status(400).send({ error: validationResult.error.message });
  }
}

export async function createChatBackend(req: Request, res: Response) {
  const body = req.body;

  const schema = Joi.object({ title: utility.jString.required() });
  const validationResult = schema.validate(body);

  if (validationResult.error === undefined) {
    const _id = req.headers._id as string;
    const title = req.body.title as string;
    const board_id = await db.boardUserId(_id);

    let boardChatId = "";

    try {
      let board = await axios.postForm(SUPPORTBOARDURL+"", {
        function: "new-conversation",
        token: ADMINTOKEN,
        user_id: board_id,
        title: title,
        agent_id: 23, //Agent ID in Support Board
      });

      boardChatId = board.data.response.details.id;
    } catch (error) {
      console.log(error);
    }

    const chat_id = await db.createChat(_id, title, boardChatId);

    if (!Array.isArray(chat_id) && chat_id) {
      res.send(chat_id);
    } else if (!chat_id) {
      res.status(500).send({ error: "Could not create a chat." });
    } else {
      res.status(chat_id[0] as number).send({ error: chat_id[1] });
    }
  } else {
    console.log(JSON.stringify(validationResult.error.message));
    res.status(400).send({ error: validationResult.error.message });
  }
}

export async function deleteChatBackend(req: Request, res: Response) {
  const chat_id = req.params.chat_id;

  const validationResult = utility.jObjectId.validate(chat_id);

  if (validationResult.error === undefined) {
    const sender_id = req.headers._id as string;
    const result = await db.deleteChat(sender_id, chat_id);

    if (!Array.isArray(result)) {
      res.send({ status: result });
    } else {
      res.status(result[0] as number).send({ error: result[1] });
    }
  } else {
    console.log(JSON.stringify(validationResult.error.message));
    res.status(400).send({ error: validationResult.error.message });
  }
}

export async function chatBackend(ws: WebSocket, message: WebSocket.RawData) {
  const schema = Joi.object({
    message: utility.jString.required(),
    sender_id: utility.jObjectId.required(),
    chat_id: utility.jObjectId.required(),
  });

  try {
    const body = JSON.parse(message.toString());
    const validationResult = schema.validate(body);

    if (validationResult.error === undefined) {
      const sender_id = body.sender_id as string;
      const chat_id = body.chat_id as string;
      const message = body.message as string;
      const board_id = await db.boardUserId(sender_id);
      const boardChat_id = await db.boardUserChatId(sender_id);

      const result = await db.addMessage(sender_id, chat_id, "USER: "+message);
      
      if (!Array.isArray(result)) {
        let userm = await axios.postForm(SUPPORTBOARDURL+"", {
          function: "send-message",
          token: ADMINTOKEN,
          user_id: board_id,
          conversation_id: boardChat_id,
          message: message,
        });
        // console.log(userm.data);

        let response = "";
        let complete_chat = await db.getUserChat(sender_id,chat_id);

        try {
          console.log("Sending message to bot");
          const botResponse = await axios.post("http://medibot-llm-docker.icyflower-27afbae0.uaenorth.azurecontainerapps.io/chat", {
            // TODO change it to logisti chat bot link
            message: message,
            user_name: "User",
            user_id: sender_id,
            conversation_id: chat_id,
            history: complete_chat,
          });
          console.log(botResponse.data);

          if (botResponse.data.state) {
            response = botResponse.data.answer;
            await db.addMessage(sender_id, chat_id, "Agent: "+response);

          }

          let botm = await axios.postForm(SUPPORTBOARDURL+"", {
            function: "send-message",
            token: ADMINTOKEN,
            user_id: 23, //Agent ID in Support Board
            conversation_id: boardChat_id,
            message: response,
          });
          console.log(botm.data);
        } catch (error) {
          console.log(error);
        }

        ws.send(JSON.stringify({ response: response }));
      } else {
        ws.send(JSON.stringify({ error: result[1] }));
      }
    } else {
      console.log(JSON.stringify(validationResult.error.message));
      ws.send(JSON.stringify({ error: "Invalid message" }));
    }
  } catch (error) {
    console.log(error);
    ws.send(JSON.stringify({ error: "Invalid message json" }));
  }
}
