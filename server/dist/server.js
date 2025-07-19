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
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const not_found_1 = __importDefault(require("./middlewares/not_found"));
const connect_db_1 = __importDefault(require("./config/connect_db"));
const users_1 = __importDefault(require("./routes/users"));
const transactions_1 = __importDefault(require("./routes/transactions"));
const cors_1 = __importDefault(require("cors"));
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/api/v1/users", users_1.default);
app.use("/api/v1/transactions", transactions_1.default);
app.use(not_found_1.default);
const PORT = process.env.PORT || "5001";
const DB = process.env.MONGO_URI;
const start_server = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, connect_db_1.default)(DB);
        app.listen(PORT, () => console.log(`App listening on port ${PORT}`));
    }
    catch (error) {
        console.log(error);
    }
});
start_server();
