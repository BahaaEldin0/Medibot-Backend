import { Router } from "express";
import * as backend from "../backend/authBackend";

export const auth = Router();

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

auth.post("/register/user", async (req, res) => {
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

auth.post("/login/user", async (req, res) => {
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

auth.use((req, res, next) => {
  backend.authorize_express(req, res, next);
});

auth.delete("/delete/user", async (req, res) => {
  await backend.deleteUserBackend(req, res);
});
