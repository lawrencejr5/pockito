import express from "express";
const transac_router = express.Router();

import {
  get_all_transactions,
  get_transaction,
  create_transaction,
  update_transaction,
  delete_transaction,
} from "../controllers/transactions";

import auth from "../middlewares/auth";
transac_router.use(auth);

transac_router.get("/", get_all_transactions);
transac_router.get("/:id", get_transaction);
transac_router.post("/", create_transaction);
transac_router.patch("/:id", update_transaction);
transac_router.delete("/:id", delete_transaction);

export default transac_router;
