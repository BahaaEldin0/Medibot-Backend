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
exports.auth = void 0;
const express_1 = require("express");
const backend = __importStar(require("../backend/authBackend"));
exports.auth = (0, express_1.Router)();
/*
Request:
{
  name: String
  email: Valid Email
  phone: String
  password: String
  subscription: String
  role: { // send only one
    company: bool,
    user: bool,
    delivery: bool,
  }
}

Response:
 - Code 200 user is registered successfully { status: true }
 - Code 400 if your request body is missing something
 - Code 500 Db error or server error
 - Code 406 User exist
*/
exports.auth.post("/register/user", async (req, res) => {
    await backend.registerUserBackend(req, res);
});
/*
Request:
{
  email: Valid Email
  password: String
}

Response:
 - Code 200 user is registered successfully  {token: token, _id: _id, name: name }
 - Code 400 if your request body is missing something
 - Code 500 Db error or server error
 - Code 401 Wrong credentials
*/
exports.auth.post("/login/user", async (req, res) => {
    await backend.loginUserBackend(req, res);
});
/*
Headers:
_id
token

Response:
 - Code 200 user is deleted successfully { status: true }
 - Code 400 if your request header is missing something
 - Code 500 Db error or server error
 - Code 403 Wrong credentials
*/
exports.auth.use((req, res, next) => {
    backend.authorize_express(req, res, next);
});
exports.auth.delete("/delete/user", async (req, res) => {
    await backend.deleteUserBackend(req, res);
});
