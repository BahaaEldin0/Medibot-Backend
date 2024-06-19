import * as crypto from "crypto";
import Joi from "joi";
import { ObjectId } from "mongodb";
import dotenv from "dotenv";
dotenv.config();
const TokenLength = Number(process.env.TOKENLENGTH);
const Salt = Number(process.env.SALT);

//okie
export function hashPassword(password: string): string {
  let hashedPassword = crypto
    .createHmac("sha256", password + Salt)
    .digest()
    .toString("hex");
  return hashedPassword;
}

//okie
export function generateToken() {
  return crypto.randomBytes(TokenLength).toString("hex");
}

//okie
export function checkPassword({
  requestPassword,
  hashedPassword,
}: {
  requestPassword: string;
  hashedPassword: string;
}): boolean {
  requestPassword = crypto
    .createHmac("sha256", requestPassword + Salt)
    .digest()
    .toString("hex");
  return requestPassword === hashedPassword;
}

export function isValidEmail(email: string): boolean {
  return /.+@.+\..+/.test(email);
}

//okie
export function isInt(text: string): Boolean {
  return /^\d+$/.test(text);
}

//okie
export function isValidObjectId(id: string) {
  if (ObjectId.isValid(id)) {
    if (new ObjectId(id).toString() === id) return true;
  }
  return false;
}

//okie
export function getDate(fullDate = false) {
  let date = new Date().toLocaleString("en-za", { timeZone: "Africa/Cairo" });
  if (fullDate) {
    return date;
  }

  return date.split(",")[0].replaceAll("/", "-");
}

//okie
export function getDateEpoch() {
  let date = new Date(getDate()).getTime();
  return Math.floor(date / 1000);
}

export function isValidDateString(date: string) {
  let splittedDate = date.split("-");
  if (
    splittedDate.length !== 3 ||
    splittedDate[0].length !== 4 ||
    splittedDate[1].length !== 2 ||
    splittedDate[2].length !== 2 ||
    !isInt(splittedDate[0]) ||
    !isInt(splittedDate[1]) ||
    !isInt(splittedDate[2])
  ) {
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

export function isValidDateNumber(date: number) {
  let dateString = date.toString();
  if (typeof date !== "number" || !isInt(dateString) || dateString.length != 10) {
    return false;
  }
  return date > 1577829600 && date < 4102437600;
}

export function isValidDate(date: string | number) {
  if (typeof date === "string") {
    return isValidDateString(date);
  } else if (typeof date === "number") {
    return isValidDateNumber(date);
  }
  return false;
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function joiObjectIdChecker(value: any, helper: any) {
  if (isValidObjectId(value)) return value;
  return helper.message("Not a valid ObjectId");
}
export function joiEmailChecker(value: any, helper: any) {
  if (isValidEmail(value)) return value;
  return helper.message("Not a valid Email");
}

export const jObjectId = Joi.string().trim().custom(joiObjectIdChecker);
export const jEmail = Joi.string().trim().custom(joiEmailChecker);
export const jString = Joi.string().trim();
export const jNumber = Joi.number();
