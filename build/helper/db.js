"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addMessage = exports.deleteChat = exports.createChat = exports.boardUserChatId = exports.getUserChat = exports.getUserChats = exports.userToken = exports.boardUserId = exports.deleteUser = exports.registerUser = exports.login = exports.cache = exports.createIndexes = exports.tokens = void 0;
const mongodb_1 = require("mongodb");
const utility_1 = require("./utility");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongoUrl = process.env.MONGOLINK;
// const mongoUrl = process.env.MONGOLINKREMOTE as string;
const dbName = process.env.DBNAME;
const mongoClient = new mongodb_1.MongoClient(mongoUrl);
let db = mongoClient.db(dbName);
const usersCollection = db.collection("users");
const chatsCollection = db.collection("chats");
let usersCache = {};
exports.tokens = { "66450ba1ac7fe06226cc86be": "981e3c18bcd0a257795471f155f5b805" };
async function createIndexes() {
    await usersCollection.createIndex("email", { unique: true });
    await chatsCollection.createIndex("sender_id");
}
exports.createIndexes = createIndexes;
async function cache() {
    await cacheUsers();
}
exports.cache = cache;
///////////////////////////////////////////////////////////////////////////////////////////
//okie
async function login({ email, password }) {
    const query = { email: email, password: (0, utility_1.hashPassword)(password) };
    let user = await usersCollection.findOne(query);
    if (user != null) {
        user.token = (0, utility_1.generateToken)();
        await usersCollection.updateOne({ _id: user._id }, { $set: { token: user.token } });
        exports.tokens[user._id.toString()] = user.token;
        return {
            _id: user._id,
            name: user.name,
            token: user.token,
        };
    }
    return [401, "Wrong credentials"];
}
exports.login = login;
//okie
async function registerUser(user) {
    try {
        let userResult = await usersCollection.insertOne(user);
        return userResult.acknowledged;
    }
    catch (error) {
        if (error instanceof mongodb_1.MongoServerError) {
            if (error.code == 11000) {
                return [406, "User exists."];
            }
        }
        return [500, "DB error."];
    }
}
exports.registerUser = registerUser;
async function deleteUser(user_id) {
    try {
        let userResult = await usersCollection.deleteOne({ _id: new mongodb_1.ObjectId(user_id) });
        return userResult.acknowledged && userResult.deletedCount == 1;
    }
    catch (error) {
        return [500, "DB error."];
    }
}
exports.deleteUser = deleteUser;
async function boardUserId(user_id) {
    try {
        let userResult = (await usersCollection.findOne({ _id: new mongodb_1.ObjectId(user_id) }));
        if (userResult != null) {
            return userResult.board_id;
        }
        return null;
    }
    catch (error) {
        return [500, "DB error."];
    }
}
exports.boardUserId = boardUserId;
async function userToken(_id) {
    let user = (await usersCollection.findOne({ _id: new mongodb_1.ObjectId(_id) }));
    return user.token;
}
exports.userToken = userToken;
async function cacheUsers() {
    let users = (await usersCollection.find().toArray());
    for (const user of users) {
        usersCache[user._id.toString()] = user;
    }
}
///////////////////////////////////////////////////////////////////////////////////////////
async function getUserChats(_id) {
    let chats = (await chatsCollection.find({ sender_id: new mongodb_1.ObjectId(_id) }).toArray());
    let output = [];
    for (const chat of chats) {
        output.push({
            _id: chat._id,
            sender_id: chat.sender_id,
            title: chat.title,
            last_message: chat.messages.at(-1) ?? [],
        });
    }
    return output;
}
exports.getUserChats = getUserChats;
async function getUserChat(sender_id, chat_id) {
    let chat = (await chatsCollection.findOne({
        sender_id: new mongodb_1.ObjectId(sender_id),
        _id: new mongodb_1.ObjectId(chat_id),
    }));
    if (chat != null) {
        return chat.messages;
    }
    return null;
}
exports.getUserChat = getUserChat;
async function boardUserChatId(user_id) {
    try {
        let userResult = (await chatsCollection.findOne({
            sender_id: new mongodb_1.ObjectId(user_id),
        }));
        if (userResult != null) {
            return userResult.boardChatId;
        }
        return null;
    }
    catch (error) {
        return [500, "DB error."];
    }
}
exports.boardUserChatId = boardUserChatId;
async function createChat(_id, title, boardChatId) {
    const chat = {
        messages: [],
        summary: "",
        sender_id: new mongodb_1.ObjectId(_id),
        title: title,
        boardChatId: boardChatId,
    };
    try {
        let result = await chatsCollection.insertOne(chat);
        return result.insertedId;
    }
    catch (error) {
        if (error instanceof mongodb_1.MongoServerError) {
            if (error.code == 11000) {
                return [406, "User exists."];
            }
        }
        return [500, "DB error."];
    }
}
exports.createChat = createChat;
async function deleteChat(sender_id, chat_id) {
    const query = { sender_id: new mongodb_1.ObjectId(sender_id), _id: new mongodb_1.ObjectId(chat_id) };
    try {
        let result = await chatsCollection.deleteOne(query);
        return result.deletedCount == 1;
    }
    catch (error) {
        return [500, "DB error."];
    }
}
exports.deleteChat = deleteChat;
async function addMessage(sender_id, chat_id, message) {
    let sender = sender_id == "logisti" ? 1 : 0;
    const query = { sender_id: new mongodb_1.ObjectId(sender_id), _id: new mongodb_1.ObjectId(chat_id) };
    try {
        const result = await chatsCollection.updateOne(query, {
            $push: { messages: [sender, message] },
        });
        return result.acknowledged && result.modifiedCount == 1;
    }
    catch (error) {
        return [500, "DB error."];
    }
}
exports.addMessage = addMessage;
setInterval(async () => await cache(), 60 * 1000);
