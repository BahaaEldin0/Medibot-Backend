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
exports.jNumber = exports.jString = exports.jEmail = exports.jObjectId = exports.joiEmailChecker = exports.joiObjectIdChecker = exports.delay = exports.isValidDate = exports.isValidDateNumber = exports.isValidDateString = exports.getDateEpoch = exports.getDate = exports.isValidObjectId = exports.isInt = exports.isValidEmail = exports.checkPassword = exports.generateToken = exports.hashPassword = void 0;
const crypto = __importStar(require("crypto"));
const joi_1 = __importDefault(require("joi"));
const mongodb_1 = require("mongodb");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const TokenLength = Number(process.env.TOKENLENGTH);
const Salt = Number(process.env.SALT);
//okie
function hashPassword(password) {
    let hashedPassword = crypto
        .createHmac("sha256", password + Salt)
        .digest()
        .toString("hex");
    return hashedPassword;
}
exports.hashPassword = hashPassword;
//okie
function generateToken() {
    return crypto.randomBytes(TokenLength).toString("hex");
}
exports.generateToken = generateToken;
//okie
function checkPassword({ requestPassword, hashedPassword, }) {
    requestPassword = crypto
        .createHmac("sha256", requestPassword + Salt)
        .digest()
        .toString("hex");
    return requestPassword === hashedPassword;
}
exports.checkPassword = checkPassword;
function isValidEmail(email) {
    return /.+@.+\..+/.test(email);
}
exports.isValidEmail = isValidEmail;
//okie
function isInt(text) {
    return /^\d+$/.test(text);
}
exports.isInt = isInt;
//okie
function isValidObjectId(id) {
    if (mongodb_1.ObjectId.isValid(id)) {
        if (new mongodb_1.ObjectId(id).toString() === id)
            return true;
    }
    return false;
}
exports.isValidObjectId = isValidObjectId;
//okie
function getDate(fullDate = false) {
    let date = new Date().toLocaleString("en-za", { timeZone: "Africa/Cairo" });
    if (fullDate) {
        return date;
    }
    return date.split(",")[0].replaceAll("/", "-");
}
exports.getDate = getDate;
//okie
function getDateEpoch() {
    let date = new Date(getDate()).getTime();
    return Math.floor(date / 1000);
}
exports.getDateEpoch = getDateEpoch;
function isValidDateString(date) {
    let splittedDate = date.split("-");
    if (splittedDate.length !== 3 ||
        splittedDate[0].length !== 4 ||
        splittedDate[1].length !== 2 ||
        splittedDate[2].length !== 2 ||
        !isInt(splittedDate[0]) ||
        !isInt(splittedDate[1]) ||
        !isInt(splittedDate[2])) {
        return false;
    }
    let dateNumber = splittedDate.map((x) => Number(x));
    let year = dateNumber[0];
    let month = dateNumber[1];
    let day = dateNumber[2];
    if (year < 2020 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
        return false;
    }
    return true;
}
exports.isValidDateString = isValidDateString;
function isValidDateNumber(date) {
    let dateString = date.toString();
    if (typeof date !== "number" || !isInt(dateString) || dateString.length != 10) {
        return false;
    }
    return date > 1577829600 && date < 4102437600;
}
exports.isValidDateNumber = isValidDateNumber;
function isValidDate(date) {
    if (typeof date === "string") {
        return isValidDateString(date);
    }
    else if (typeof date === "number") {
        return isValidDateNumber(date);
    }
    return false;
}
exports.isValidDate = isValidDate;
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
exports.delay = delay;
function joiObjectIdChecker(value, helper) {
    if (isValidObjectId(value))
        return value;
    return helper.message("Not a valid ObjectId");
}
exports.joiObjectIdChecker = joiObjectIdChecker;
function joiEmailChecker(value, helper) {
    if (isValidEmail(value))
        return value;
    return helper.message("Not a valid Email");
}
exports.joiEmailChecker = joiEmailChecker;
exports.jObjectId = joi_1.default.string().trim().custom(joiObjectIdChecker);
exports.jEmail = joi_1.default.string().trim().custom(joiEmailChecker);
exports.jString = joi_1.default.string().trim();
exports.jNumber = joi_1.default.number();
