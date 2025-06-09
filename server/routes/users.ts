import express from "express";
const user_router = express.Router();

import {
  register_user,
  login_user,
  get_all_users,
  get_user,
  update_user,
  delete_user,
} from "../controllers/users";

user_router.post("/register", register_user);
user_router.post("/login", login_user);
user_router.get("/", get_all_users);
user_router.get("/:id", get_user);
user_router.put("/:id", update_user);
user_router.delete("/:id", delete_user);

export default user_router;
