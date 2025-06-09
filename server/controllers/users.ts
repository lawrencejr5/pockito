import { Request, Response } from "express";
import bcrypt from "bcryptjs";

import User from "../models/users";

export const register_user = async (
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

export const login_user = async (
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
