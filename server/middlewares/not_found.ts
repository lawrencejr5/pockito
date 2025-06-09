import express, { Request, Response } from "express";

const not_found = async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(404).json({ msg: "Route not found" });
  } catch (error) {
    res.status(500).json({ msg: "An error occured" });
  }
};

export default not_found;
