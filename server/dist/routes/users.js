"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_router = express_1.default.Router();
const users_1 = require("../controllers/users");
const auth_1 = __importDefault(require("../middlewares/auth"));
user_router.post("/register", users_1.register_user);
user_router.post("/login", users_1.login_user);
user_router.get("/", users_1.get_all_users);
user_router.get("/:id", users_1.get_user);
user_router.patch("/", auth_1.default, users_1.update_user);
user_router.patch("/update/password/", auth_1.default, users_1.update_user_password);
user_router.delete("/", auth_1.default, users_1.delete_user);
exports.default = user_router;
