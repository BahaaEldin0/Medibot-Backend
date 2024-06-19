"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chat = void 0;
const express_1 = require("express");
const backend = __importStar(require("../backend/chatBackend"));
exports.chat = (0, express_1.Router)();
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
exports.chat.get("/chats", async (req, res) => {
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
exports.chat.get("/:chat_id", async (req, res) => {
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
exports.chat.post("/createchat", async (req, res) => {
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
exports.chat.delete("/:chat_id", async (req, res) => {
    await backend.deleteChatBackend(req, res);
});
