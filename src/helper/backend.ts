import { WebSocketJson, json } from "./schema";
import WebSocket from "ws";
import { Response, Request, NextFunction } from "express";
import * as db from "./db";
import * as utility from "./utility";
import Joi from "joi";

export let usersWs: WebSocketJson = [];

//okie

///////////////////////////////////////////////////////////////////////////////////////////

// export async function Backend(req: Request, res: Response) {
//   const body = req.body;

//   if (Object.keys(body).length == 0) {
//     res.status(400).send({ error: "Empty Body" });
//     return;
//   }
//   const checkingResult = utility.checkParameter({
//     body: body,
//     objectIds: ["userId","campaignId"],
//     numbers: ["quantity", "plate"],
//     strings: ["type"],
//   });

//   if (validationResult.error === undefined) {
//     let result = await db.addMeal(body);
//     console.log(result);
//     res.send(result);
//   } else {
//     console.log(JSON.stringify(validationResult.error.message));
// res.status(400).send({ error: validationResult.error.message });
//   }
// }

///////////////////////////////////////////////////////////////////////////////////////////

export async function notify(message: string) {
  for (const socket in usersWs) {
    if (usersWs[socket].readyState !== WebSocket.CLOSED) {
      usersWs[socket].send(message);
    }
  }
}

async function ping() {
  for (const socket in usersWs) {
    if (usersWs[socket].readyState !== WebSocket.CLOSED) {
      usersWs[socket].ping();
    } else {
      delete usersWs[socket];
    }
  }
}

setInterval(async () => await ping(), 60 * 1000);
