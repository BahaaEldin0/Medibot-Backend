import Joi, { number, string } from "joi";
import { ObjectId } from "mongodb";
import { WebSocket } from "ws";
import { jEmail, jString } from "./utility";
export type json = { [key: string]: any };

export type WebSocketJson = WebSocket[];

export interface User {
  board_id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  subscription: string;
  token: string;
  role: { company: boolean; user: boolean; delivery: boolean };
}

export interface User_id extends User {
  _id: ObjectId;
  verified: boolean;
}

export const User = Joi.object({
  name: jString.required(),
  email: jEmail.required(),
  phone: jString.required(),
  password: jString.required(),
  subscription: jString.required(),
  role: Joi.object({
    company: Joi.bool().invalid(false),
    user: Joi.bool().invalid(false),
    delivery: Joi.bool().invalid(false),
  })
    .required()
    .min(1)
    .max(1),
});

export interface Chat {
  sender_id: ObjectId;
  boardChatId: string;
  title: string;
  summary: string;
  messages: [number, string][];
}

export interface Chat_id extends Chat {
  _id: ObjectId;
}
