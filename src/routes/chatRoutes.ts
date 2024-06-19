import { Router } from "express";
import * as backend from "../backend/chatBackend";

export const chat = Router();

/* 
Headers:
_id
token

Response:
 - Code 200 
    {
      _id: Chat _id,
      sender_id: Sender id,
      title: Chat title,
      last_message: Last message in a chat,
    }
 - Code 400 if your request is missing something
 - Code 403 Wrong credentials 
*/

chat.get("/chats", async (req, res) => {
  await backend.getUserChatsBackend(req, res);
});

/* 
Headers:
_id
token

Prams:
/chat_id

Response:
 - Code 200 returns Array of messages [sender,message] if sender = 0 then it is user, 1 is the bot
 - Code 400 if your request is missing something
 - Code 404 Not found
 - Code 403 Wrong credentials 
*/

chat.get("/:chat_id", async (req, res) => {
  await backend.getUserChatBackend(req, res);
});

/* 
Headers:
_id
token

body:
{
  title:string
}

Response:
 - Code 200 chat id is returned as string
 - Code 400 if your request is missing something
 - Code 500 can't create chat or server error
 - Code 403 Wrong credentials 
*/

chat.post("/createchat", async (req, res) => {
  await backend.createChatBackend(req, res);
});

/* 
Headers:
_id
token

Prams:
/chat_id

Response:
 - Code 200 returns { status: true } if chat is deleted
 - Code 400 if your request is missing something
 - Code 403 Wrong credentials 
*/

chat.delete("/:chat_id", async (req, res) => {
  await backend.deleteChatBackend(req, res);
});
