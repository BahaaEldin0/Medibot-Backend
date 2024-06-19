"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notify = exports.usersWs = void 0;
const ws_1 = __importDefault(require("ws"));
exports.usersWs = [];
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
async function notify(message) {
    for (const socket in exports.usersWs) {
        if (exports.usersWs[socket].readyState !== ws_1.default.CLOSED) {
            exports.usersWs[socket].send(message);
        }
    }
}
exports.notify = notify;
async function ping() {
    for (const socket in exports.usersWs) {
        if (exports.usersWs[socket].readyState !== ws_1.default.CLOSED) {
            exports.usersWs[socket].ping();
        }
        else {
            delete exports.usersWs[socket];
        }
    }
}
setInterval(async () => await ping(), 60 * 1000);
