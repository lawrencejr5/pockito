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
exports.delete_transaction = exports.update_transaction = exports.create_transaction = exports.get_transaction_summary = exports.get_transaction = exports.get_user_transactions = exports.get_all_transactions = void 0;
const transactions_1 = __importDefault(require("../models/transactions"));
// Get all transactions
const get_all_transactions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transactions = yield transactions_1.default.find({}).sort({ createdAt: -1 });
        res.status(200).json(transactions);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Internal server error" });
    }
});
exports.get_all_transactions = get_all_transactions;
// Get all user transactions
const get_user_transactions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.user_id);
        if (!userId) {
            res.status(400).json({ msg: "User not authenticated" });
            return;
        }
        const transactions = yield transactions_1.default.find({ user_id: userId }).sort({
            createdAt: -1,
        });
        res.status(200).json(transactions);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Internal server error" });
    }
});
exports.get_user_transactions = get_user_transactions;
// Get a single transaction by id
const get_transaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const transaction = yield transactions_1.default.findById(id);
        if (!transaction) {
            res.status(404).json({ msg: "Transaction not found" });
            return;
        }
        res.status(200).json(transaction);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Internal server error" });
    }
});
exports.get_transaction = get_transaction;
// Get transaction summary per user
const get_transaction_summary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.user_id);
        if (!userId) {
            res.status(400).json({ msg: "User not authenticated" });
            return;
        }
        const transactions = yield transactions_1.default.find({ user_id: userId });
        let income = 0;
        let expense = 0;
        transactions.forEach((tx) => {
            if (tx.type === "credit") {
                income += tx.amount;
            }
            else if (tx.type === "debit") {
                expense += tx.amount;
            }
        });
        const balance = income - expense;
        res
            .status(200)
            .json({ user: userId, summary: { income, expense, balance } });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Internal server error" });
    }
});
exports.get_transaction_summary = get_transaction_summary;
// Create a transaction
const create_transaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { title, type, category, amount } = req.body;
        const user_id = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.userId) || req.body.user_id;
        if (!user_id) {
            res.status(400).json({ msg: "User id is required" });
            return;
        }
        const transaction = yield transactions_1.default.create({
            user_id,
            title,
            type,
            category,
            amount,
        });
        res.status(201).json({
            msg: "Transaction created successfully",
            transaction,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Internal server error" });
    }
});
exports.create_transaction = create_transaction;
// Update a transaction by id
const update_transaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const updatedTransaction = yield transactions_1.default.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!updatedTransaction) {
            res.status(404).json({ msg: "Transaction not found" });
            return;
        }
        res.status(200).json({
            msg: "Transaction updated successfully",
            transaction: updatedTransaction,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Internal server error" });
    }
});
exports.update_transaction = update_transaction;
// Delete a transaction by id
const delete_transaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const deletedTransaction = yield transactions_1.default.findByIdAndDelete(id);
        if (!deletedTransaction) {
            res.status(404).json({ msg: "Transaction not found" });
            return;
        }
        res.status(200).json({
            msg: "Transaction deleted successfully",
            transaction: deletedTransaction,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Internal server error" });
    }
});
exports.delete_transaction = delete_transaction;
