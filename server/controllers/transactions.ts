import { Request, Response } from "express";
import Transac from "../models/transactions";

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

// Get all user transactions
export const get_user_transactions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId || req.body?.user_id;
    if (!userId) {
      res.status(400).json({ msg: "User not authenticated" });
      return;
    }
    const transactions = await Transac.find({ user_id: userId });
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

// Get transaction summary per user
export const get_transaction_summary = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId || req.body?.user_id;
    if (!userId) {
      res.status(400).json({ msg: "User not authenticated" });
      return;
    }
    const transactions = await Transac.find({ user_id: userId });
    let income = 0;
    let expense = 0;
    transactions.forEach((tx) => {
      if (tx.type === "credit") {
        income += tx.amount;
      } else if (tx.type === "debit") {
        expense += tx.amount;
      }
    });
    const balance = income - expense;
    res
      .status(200)
      .json({ user: userId, summary: { income, expense, balance } });
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
    const { title, type, category, amount } = req.body;

    const user_id = req.user?.userId || req.body.user_id;
    if (!user_id) {
      res.status(400).json({ msg: "User id is required" });
      return;
    }
    const transaction = await Transac.create({
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
