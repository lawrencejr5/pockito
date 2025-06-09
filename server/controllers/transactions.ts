import { Request, Response } from "express";
import Transac from "../models/transactions";
import auth from "../middlewares/auth";

// Get all transactions
export const get_all_transactions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const transactions = await Transac.find({});
    res.status(200).json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};

// Get a single transaction by id
export const get_transaction = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const transaction = await Transac.findById(id);
    if (!transaction) {
      res.status(404).json({ msg: "Transaction not found" });
      return;
    }
    res.status(200).json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};

// Create a transaction
export const create_transaction = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { title, category, amount } = req.body;
    // Assume the user ID is either in req.user (if using auth) or provided in the body.
    const user_id = req.user?.userId || req.body.user_id;
    if (!user_id) {
      res.status(400).json({ msg: "User id is required" });
      return;
    }
    const transaction = await Transac.create({
      user_id,
      title,
      category,
      amount,
    });
    res.status(201).json({
      msg: "Transaction created successfully",
      transaction,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};

// Update a transaction by id
export const update_transaction = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updatedTransaction = await Transac.findByIdAndUpdate(id, req.body, {
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};

// Delete a transaction by id
export const delete_transaction = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const deletedTransaction = await Transac.findByIdAndDelete(id);
    if (!deletedTransaction) {
      res.status(404).json({ msg: "Transaction not found" });
      return;
    }
    res.status(200).json({
      msg: "Transaction deleted successfully",
      transaction: deletedTransaction,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};
