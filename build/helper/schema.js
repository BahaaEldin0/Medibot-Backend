"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const joi_1 = __importDefault(require("joi"));
const utility_1 = require("./utility");
exports.User = joi_1.default.object({
    name: utility_1.jString.required(),
    email: utility_1.jEmail.required(),
    phone: utility_1.jString.required(),
    password: utility_1.jString.required(),
    subscription: utility_1.jString.required(),
    role: joi_1.default.object({
        company: joi_1.default.bool().invalid(false),
        user: joi_1.default.bool().invalid(false),
        delivery: joi_1.default.bool().invalid(false),
    })
        .required()
        .min(1)
        .max(1),
});
