import { Request, Response } from "express";

import Transac from "../models/transactions";

export const get_all_transactions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    res.status(201).json({ msg: "success" });
  } catch (error) {
    res.status(500).json({ msg: "internal server error" });
    console.log(error);
  }
};

export const get_transaction = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    res.status(201).json({ msg: "success" });
  } catch (error) {
    res.status(500).json({ msg: "internal server error" });
    console.log(error);
  }
};
