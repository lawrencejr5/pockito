import express from "express";
const user_router = express.Router();

import { login_user, register_user } from "../controllers/users";

user_router.post("/register", register_user);
user_router.post("/login", login_user);

export default user_router;
