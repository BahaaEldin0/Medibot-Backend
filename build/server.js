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
const cors_1 = __importDefault(require("cors"));
const ws_1 = __importDefault(require("ws"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const utility = __importStar(require("./helper/utility"));
const db = __importStar(require("./helper/db"));
const authRouter_1 = require("./routes/authRouter");
const authBackend_1 = require("./backend/authBackend");
const backend = __importStar(require("./helper/backend"));
const chatRoutes_1 = require("./routes/chatRoutes");
const chatBackend_1 = require("./backend/chatBackend");
dotenv_1.default.config();
const PORT = process.env.PORT || "5000";
const app = (0, express_1.default)();
const wss = new ws_1.default.Server({ noServer: true, path: "/ws" });
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use("/auth", authRouter_1.auth);
app.get("/health/", async (req, res) => {
    res.send(`Server is running: ${Date.now()}`);
});
app.use((req, res, next) => {
    (0, authBackend_1.authorize_express)(req, res, next);
});
app.use("/chat", chatRoutes_1.chat);
app.all("*", (req, res) => {
    res.sendStatus(404);
});
const server = app.listen(5151, async () => {
    await db.createIndexes();
    await db.cache();
    console.log("Running:" + PORT);
    console.log(utility.getDate(true));
});
server.on("upgrade", (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, async (ws) => {
        if (await (0, authBackend_1.authorize)(req.headers)) {
            wss.emit("connection", ws, req);
        }
        else {
            ws.close(1008);
            socket.destroy();
        }
    });
});
wss.on("connection", (ws, req) => {
    backend.usersWs.push(ws);
    ws.on("message", async (data, isBinary) => {
        await (0, chatBackend_1.chatBackend)(ws, data);
    });
});
