"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.update_user_password = exports.delete_user = exports.update_user = exports.get_user = exports.get_all_users = exports.login_user = exports.register_user = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const users_1 = __importDefault(require("../models/users"));
const transactions_1 = __importDefault(require("../models/transactions")); // Add this import at the top
const JWT_SECRET = process.env.JWT_SECRET || "default_secret";
const register_user = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, password } = req.body;
        // Check if user already exists
        const existingUser = yield users_1.default.findOne({ email: email.trim() });
        if (existingUser) {
            res.status(400).json({ success: false, msg: "User already exists" });
            return;
        }
        // Hash the password
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
        // Save the new user
        const user = yield users_1.default.create({
            username: username.trim(),
            email: email.trim(),
            password: hashedPassword,
        });
        // Create a token
        const token = jsonwebtoken_1.default.sign({ userId: user._id.toString(), email: user.email }, JWT_SECRET, {
            expiresIn: "7d",
        });
        res.status(201).json({
            success: true,
            msg: "User registered successfully",
            userId: user._id,
            token,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Internal server error" });
    }
});
exports.register_user = register_user;
const login_user = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { user, password } = req.body;
        // Find the user by matching either the email or username field
        const user_account = yield users_1.default.findOne({
            $or: [{ email: user.trim() }, { username: user.trim() }],
        });
        if (!user_account) {
            res.status(400).json({ success: false, msg: "Invalid credentials" });
            return;
        }
        // Compare the provided password with the hashed password
        const isMatch = yield bcryptjs_1.default.compare(password, user_account.password);
        if (!isMatch) {
            res.status(400).json({ msg: "Invalid credentials" });
            return;
        }
        // Create a token
        const token = jsonwebtoken_1.default.sign({ userId: user_account._id.toString(), email: user_account.email }, JWT_SECRET, {
            expiresIn: "7d",
        });
        res.status(200).json({
            msg: "User logged in successfully",
            userId: user_account._id,
            token,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Internal server error" });
    }
});
exports.login_user = login_user;
// Get all users
const get_all_users = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield users_1.default.find({});
        res.status(200).json(users);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: true, msg: "Internal server error" });
    }
});
exports.get_all_users = get_all_users;
// Get a single user by id
const get_user = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = yield users_1.default.findById(id);
        if (!user) {
            res.status(404).json({ msg: "User not found" });
            return;
        }
        res.status(200).json(user);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Internal server error" });
    }
});
exports.get_user = get_user;
// Update a user by id
const update_user = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const id = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.user_id);
        const updatedUser = yield users_1.default.findByIdAndUpdate(id, req.body, {
            new: true,
        });
        if (!updatedUser) {
            res.status(404).json({ msg: "User not found" });
            return;
        }
        res.status(200).json({
            msg: "User updated successfully",
            user: updatedUser,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Internal server error" });
    }
});
exports.update_user = update_user;
// Delete a user by id
const delete_user = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const id = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.user_id);
        const deletedUser = yield users_1.default.findByIdAndDelete(id);
        if (!deletedUser) {
            res.status(404).json({ msg: "User not found" });
            return;
        }
        // Delete all transactions related to the user
        yield transactions_1.default.deleteMany({ user_id: id });
        res.status(200).json({
            msg: "User deleted successfully",
            user: id,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Internal server error" });
    }
});
exports.delete_user = delete_user;
const update_user_password = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const id = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.user_id);
        const { oldPassword, newPassword, confirmPassword } = req.body;
        if (!oldPassword || !newPassword || !confirmPassword) {
            res.status(400).json({ msg: "Input required fields" });
            return;
        }
        const user = yield users_1.default.findById(id);
        if (!user) {
            res.status(404).json({ msg: "User not found" });
            return;
        }
        // Check if old password matches
        const isMatch = yield bcryptjs_1.default.compare(oldPassword, user.password);
        if (!isMatch) {
            res.status(400).json({ msg: "Old password is incorrect" });
            return;
        }
        // Hash new password and update
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(newPassword, salt);
        user.password = hashedPassword;
        yield user.save();
        res.status(200).json({ msg: "Password updated successfully" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Internal server error" });
    }
});
exports.update_user_password = update_user_password;
