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
exports.authorize_express = exports.authorize = exports.deleteUserBackend = exports.loginUserBackend = exports.registerUserBackend = void 0;
const utility = __importStar(require("../helper/utility"));
const db = __importStar(require("../helper/db"));
const schema_1 = require("../helper/schema");
const joi_1 = __importDefault(require("joi"));
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const ADMINTOKEN = process.env.ADMINTOKEN;
//okie
async function registerUserBackend(req, res) {
    const body = req.body;
    let validationResult = schema_1.User.validate(body);
    if (validationResult.error === undefined) {
        let board_id = "";
        try {
            let board = await axios_1.default.postForm("https://platform.logisti.net/app/include/api.php", {
                function: "add-user",
                token: ADMINTOKEN,
                first_name: body.name,
                email: body.email,
                password: body.password,
                user_type: "user",
            });
            if (board.data.success) {
                board_id = board.data.response;
            }
        }
        catch (error) {
            console.log(error);
        }
        body.password = utility.hashPassword(body.password);
        body.verified = false;
        body.board_id = board_id;
        let result = await db.registerUser(body);
        if (!Array.isArray(result) && result) {
            res.send({ status: result });
        }
        else if (!result) {
            res.status(500).send({ error: "Could not register the user." });
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
exports.registerUserBackend = registerUserBackend;
async function loginUserBackend(req, res) {
    const body = req.body;
    const schema = joi_1.default.object({
        email: utility.jEmail.required(),
        password: utility.jString.required(),
    });
    let validationResult = schema.validate(body);
    if (validationResult.error === undefined) {
        let result = await db.login(body);
        if (!Array.isArray(result) && result) {
            const token = utility.generateToken();
            db.tokens[result._id.toHexString()] = token;
            db.tokens[result._id.toHexString()] = token;
            res.send({ token: token, _id: result._id, name: result.name });
        }
        else if (!result) {
            res.status(500).send({ error: "Login Error" });
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
exports.loginUserBackend = loginUserBackend;
async function deleteUserBackend(req, res) {
    const _id = req.headers._id;
    const board_id = await db.boardUserId(_id);
    let result = await db.deleteUser(_id);
    if (!Array.isArray(result) && result) {
        try {
            await axios_1.default.postForm("https://platform.logisti.net/app/include/api.php", {
                function: "delete-user",
                token: ADMINTOKEN,
                user_id: board_id,
            });
        }
        catch (error) {
            console.log(error);
        }
        res.send({ status: result });
    }
    else if (!result) {
        res.status(500).send({ error: "Could not delete the user." });
    }
    else {
        res.status(result[0]).send({ error: result[1] });
    }
}
exports.deleteUserBackend = deleteUserBackend;
async function authorize(headers) {
    const validationResult = joi_1.default.object({
        token: utility.jString.required(),
        _id: utility.jObjectId.required(),
    })
        .unknown()
        .validate(headers);
    if (validationResult.error == undefined) {
        // if (userToken == headers.token) {
        if (true) {
            db.tokens[headers._id] = headers.token;
            return true;
        }
    }
    return true;
    return false;
}
exports.authorize = authorize;
async function authorize_express(req, res, next) {
    if (await authorize(req.headers)) {
        next();
    }
    else {
        res.sendStatus(403);
    }
}
exports.authorize_express = authorize_express;
