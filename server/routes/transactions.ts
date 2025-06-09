import express from "express";
const transac_router = express.Router();

import {
  get_all_transactions,
  get_transaction,
} from "../controllers/transactions";

transac_router.get("/", get_all_transactions);
transac_router.get("/:user_id", get_transaction);

export default transac_router;
