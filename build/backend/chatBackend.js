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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatBackend = exports.deleteChatBackend = exports.createChatBackend = exports.getUserChatBackend = exports.getUserChatsBackend = void 0;
const utility = __importStar(require("../helper/utility"));
const db = __importStar(require("../helper/db"));
const joi_1 = __importDefault(require("joi"));
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const ADMINTOKEN = process.env.ADMINTOKEN;
const AGENTSURL = process.env.AGENTSURL;
const SUPPORTBOARDURL = process.env.SUPPORTBOARDURL;
async function getUserChatsBackend(req, res) {
    const _id = req.headers._id;
    const chats = await db.getUserChats(_id);
    res.send(chats);
}
exports.getUserChatsBackend = getUserChatsBackend;
async function getUserChatBackend(req, res) {
    const chat_id = req.params.chat_id;
    const _id = req.headers._id;
    const validationResult = utility.jObjectId.validate(chat_id);
    if (validationResult.error === undefined) {
        const result = await db.getUserChat(_id, chat_id);
        if (result != null) {
            res.send(result);
        }
        else {
            res.sendStatus(404);
        }
    }
    else {
        console.log(JSON.stringify(validationResult.error.message));
        res.status(400).send({ error: validationResult.error.message });
    }
}
exports.getUserChatBackend = getUserChatBackend;
async function createChatBackend(req, res) {
    const body = req.body;
    const schema = joi_1.default.object({ title: utility.jString.required() });
    const validationResult = schema.validate(body);
    if (validationResult.error === undefined) {
        const _id = req.headers._id;
        const title = req.body.title;
        const board_id = await db.boardUserId(_id);
        let boardChatId = "";
        try {
            let board = await axios_1.default.postForm(SUPPORTBOARDURL + "", {
                function: "new-conversation",
                token: ADMINTOKEN,
                user_id: board_id,
                title: title,
                agent_id: 23, //Agent ID in Support Board
            });
            boardChatId = board.data.response.details.id;
        }
        catch (error) {
            console.log(error);
        }
        const chat_id = await db.createChat(_id, title, boardChatId);
        if (!Array.isArray(chat_id) && chat_id) {
            res.send(chat_id);
        }
        else if (!chat_id) {
            res.status(500).send({ error: "Could not create a chat." });
        }
        else {
            res.status(chat_id[0]).send({ error: chat_id[1] });
        }
    }
    else {
        console.log(JSON.stringify(validationResult.error.message));
        res.status(400).send({ error: validationResult.error.message });
    }
}
exports.createChatBackend = createChatBackend;
async function deleteChatBackend(req, res) {
    const chat_id = req.params.chat_id;
    const validationResult = utility.jObjectId.validate(chat_id);
    if (validationResult.error === undefined) {
        const sender_id = req.headers._id;
        const result = await db.deleteChat(sender_id, chat_id);
        if (!Array.isArray(result)) {
            res.send({ status: result });
        }
        else {
            res.status(result[0]).send({ error: result[1] });
        }
    }
    else {
        console.log(JSON.stringify(validationResult.error.message));
        res.status(400).send({ error: validationResult.error.message });
    }
}
exports.deleteChatBackend = deleteChatBackend;
async function chatBackend(ws, message) {
    const schema = joi_1.default.object({
        message: utility.jString.required(),
        sender_id: utility.jObjectId.required(),
        chat_id: utility.jObjectId.required(),
    });
    try {
        const body = JSON.parse(message.toString());
        const validationResult = schema.validate(body);
        if (validationResult.error === undefined) {
            const sender_id = body.sender_id;
            const chat_id = body.chat_id;
            const message = body.message;
            const board_id = await db.boardUserId(sender_id);
            const boardChat_id = await db.boardUserChatId(sender_id);
            const result = await db.addMessage(sender_id, chat_id, "USER: " + message);
            if (!Array.isArray(result)) {
                let userm = await axios_1.default.postForm(SUPPORTBOARDURL + "", {
                    function: "send-message",
                    token: ADMINTOKEN,
                    user_id: board_id,
                    conversation_id: boardChat_id,
                    message: message,
                });
                // console.log(userm.data);
                let response = "";
                let complete_chat = await db.getUserChat(sender_id, chat_id);
                try {
                    console.log("Sending message to bot");
                    const botResponse = await axios_1.default.post("http://medibot-llm-docker.icyflower-27afbae0.uaenorth.azurecontainerapps.io/chat", {
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
                        await db.addMessage(sender_id, chat_id, "Agent: " + response);
                    }
                    let botm = await axios_1.default.postForm(SUPPORTBOARDURL + "", {
                        function: "send-message",
                        token: ADMINTOKEN,
                        user_id: 23, //Agent ID in Support Board
                        conversation_id: boardChat_id,
                        message: response,
                    });
                    console.log(botm.data);
                }
                catch (error) {
                    console.log(error);
                }
                ws.send(JSON.stringify({ response: response }));
            }
            else {
                ws.send(JSON.stringify({ error: result[1] }));
            }
        }
        else {
            console.log(JSON.stringify(validationResult.error.message));
            ws.send(JSON.stringify({ error: "Invalid message" }));
        }
    }
    catch (error) {
        console.log(error);
        ws.send(JSON.stringify({ error: "Invalid message json" }));
    }
}
exports.chatBackend = chatBackend;
