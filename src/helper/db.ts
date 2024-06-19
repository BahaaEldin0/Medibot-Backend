import { Chat, Chat_id, User, User_id, json } from "./schema";
import { MongoClient, MongoServerError, ObjectId } from "mongodb";
import { generateToken, getDate, getDateEpoch, hashPassword } from "./utility";
import dotenv from "dotenv";
dotenv.config();
const mongoUrl = process.env.MONGOLINK as string;
// const mongoUrl = process.env.MONGOLINKREMOTE as string;
const dbName = process.env.DBNAME as string;

const mongoClient = new MongoClient(mongoUrl);
let db = mongoClient.db(dbName);

const usersCollection = db.collection("users");
const chatsCollection = db.collection("chats");

let usersCache: json = {};

export let tokens: json = { "66450ba1ac7fe06226cc86be": "981e3c18bcd0a257795471f155f5b805" };

export async function createIndexes() {
  await usersCollection.createIndex("email", { unique: true });
  await chatsCollection.createIndex("sender_id");
}

export async function cache() {
  await cacheUsers();
}
///////////////////////////////////////////////////////////////////////////////////////////

//okie
export async function login({ email, password }: { email: string; password: string }) {
  const query = { email: email, password: hashPassword(password) };
  let user = await usersCollection.findOne<User_id>(query);
  
  if (user != null) {
    user.token = generateToken();
    await usersCollection.updateOne({ _id: user._id }, { $set: { token: user.token } });
    tokens[user._id.toString()] = user.token;
    return {
      _id: user._id,
      name: user.name,
      token: user.token,
    };
  }
  
  return [401, "Wrong credentials"];
}

//okie
export async function registerUser(user: User) {
  try {
    let userResult = await usersCollection.insertOne(user);
    return userResult.acknowledged;
  } catch (error) {
    if (error instanceof MongoServerError) {
      if (error.code == 11000) {
        return [406, "User exists."];
      }
    }
    return [500, "DB error."];
  }
}

export async function deleteUser(user_id: string) {
  try {
    let userResult = await usersCollection.deleteOne({ _id: new ObjectId(user_id) });
    return userResult.acknowledged && userResult.deletedCount == 1;
  } catch (error) {
    return [500, "DB error."];
  }
}

export async function boardUserId(user_id: string) {
  try {
    let userResult = (await usersCollection.findOne({ _id: new ObjectId(user_id) })) as User_id;
    if (userResult != null) {
      return userResult.board_id;
    }
    return null;
  } catch (error) {
    return [500, "DB error."];
  }
}

export async function userToken(_id: string) {
  let user = (await usersCollection.findOne({ _id: new ObjectId(_id) })) as User_id;
  return user.token;
}

async function cacheUsers() {
  let users = (await usersCollection.find().toArray()) as User_id[];

  for (const user of users) {  
    usersCache[user._id.toString()] = user;
  }
}

///////////////////////////////////////////////////////////////////////////////////////////

export async function getUserChats(_id: string) {
  let chats = (await chatsCollection.find({ sender_id: new ObjectId(_id) }).toArray()) as Chat_id[];
  let output: json[] = [];
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

export async function getUserChat(sender_id: string, chat_id: string) {
  let chat = (await chatsCollection.findOne({
    sender_id: new ObjectId(sender_id),
    _id: new ObjectId(chat_id),
  })) as Chat_id;
  if (chat != null) {
    return chat.messages;
  }
  return null;
}

export async function boardUserChatId(user_id: string) {
  try {
    let userResult = (await chatsCollection.findOne({
      sender_id: new ObjectId(user_id),
    })) as Chat_id;
    if (userResult != null) {
      return userResult.boardChatId;
    }
    return null;
  } catch (error) {
    return [500, "DB error."];
  }
}

export async function createChat(_id: string, title: string, boardChatId: string) {
  const chat: Chat = {
    messages: [],
    summary: "",
    sender_id: new ObjectId(_id),
    title: title,
    boardChatId: boardChatId,
  };
  try {
    let result = await chatsCollection.insertOne(chat);
    return result.insertedId;
  } catch (error) {
    if (error instanceof MongoServerError) {
      if (error.code == 11000) {
        return [406, "User exists."];
      }
    }
    return [500, "DB error."];
  }
}

export async function deleteChat(sender_id: string, chat_id: string) {
  const query = { sender_id: new ObjectId(sender_id), _id: new ObjectId(chat_id) };
  try {
    let result = await chatsCollection.deleteOne(query);
    return result.deletedCount == 1;
  } catch (error) {
    return [500, "DB error."];
  }
}

export async function addMessage(sender_id: string, chat_id: string, message: string) {
  let sender = sender_id == "logisti" ? 1 : 0;
  const query = { sender_id: new ObjectId(sender_id), _id: new ObjectId(chat_id) };
  try {
    const result = await chatsCollection.updateOne(query, {
      $push: { messages: [sender, message] },
    });
    return result.acknowledged && result.modifiedCount == 1;
  } catch (error) {
    return [500, "DB error."];
  }
}

setInterval(async () => await cache(), 60 * 1000);
