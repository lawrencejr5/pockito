"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const transac_router = express_1.default.Router();
const transactions_1 = require("../controllers/transactions");
const auth_1 = __importDefault(require("../middlewares/auth"));
transac_router.use(auth_1.default);
transac_router.get("/", transactions_1.get_all_transactions);
transac_router.get("/:id", transactions_1.get_transaction);
transac_router.get("/user/summary", transactions_1.get_transaction_summary);
transac_router.get("/user/data", transactions_1.get_user_transactions);
transac_router.post("/", transactions_1.create_transaction);
transac_router.patch("/:id", transactions_1.update_transaction);
transac_router.delete("/:id", transactions_1.delete_transaction);
exports.default = transac_router;
