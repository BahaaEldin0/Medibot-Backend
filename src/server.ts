import cors from "cors";
import WebSocket from "ws";
import dotenv from "dotenv";
import express from "express";

import * as utility from "./helper/utility";
import * as db from "./helper/db";
import { auth } from "./routes/authRouter";
import { authorize_express, authorize } from "./backend/authBackend";
import * as backend from "./helper/backend";
import { chat } from "./routes/chatRoutes";
import { chatBackend } from "./backend/chatBackend";

dotenv.config();


const PORT = process.env.PORT || "5000";
const HOST = '0.0.0.0';
const app = express();
const wss = new WebSocket.Server({ noServer: true, path: "/ws" });

app.use(express.json());
app.use(cors());

app.use("/auth", auth);

app.get("/health/", async (req, res) => {
  res.send(`Server is running: ${Date.now()}`);
});

app.use((req, res, next) => {
  authorize_express(req, res, next);
});

app.use("/chat", chat);

app.all("*", (req, res) => {
  res.sendStatus(404);
});

const server = app.listen(PORT, HOST, async () => {
  await db.createIndexes();
  await db.cache();
  console.log("Running:" + HOST + PORT);
  console.log(utility.getDate(true));
});

server.on("upgrade", (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, async (ws) => {
    if (await authorize(req.headers)) {
      wss.emit("connection", ws, req);
    } else {
      ws.close(1008);
      socket.destroy();
    }
  });
});

wss.on("connection", (ws, req) => {
  backend.usersWs.push(ws);
  ws.on("message", async (data, isBinary) => {
    await chatBackend(ws, data);
  });
});
