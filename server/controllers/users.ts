import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/users";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

export const register_user = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username, email, password } = req.body;
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ msg: "User already exists" });
      return;
    }
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    // Save the new user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });
    // Create a token
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );
    res.status(201).json({
      msg: "User registered successfully",
      userId: user._id,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};

export const login_user = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { user, password } = req.body;
    // Find the user by matching either the email or username field
    const user_account = await User.findOne({
      $or: [{ email: user }, { username: user }],
    });
    if (!user_account) {
      res.status(400).json({ msg: "Invalid credentials" });
      return;
    }
    // Compare the provided password with the hashed password
    const isMatch = await bcrypt.compare(password, user_account.password);
    if (!isMatch) {
      res.status(400).json({ msg: "Invalid credentials" });
      return;
    }
    // Create a token
    const token = jwt.sign(
      { userId: user_account._id.toString(), email: user_account.email },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );
    res.status(200).json({
      msg: "User logged in successfully",
      userId: user_account._id,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};

// Get all users
export const get_all_users = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const users = await User.find({});
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};

// Get a single user by id
export const get_user = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ msg: "User not found" });
      return;
    }
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};

// Update a user by id
export const update_user = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updatedUser = await User.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!updatedUser) {
      res.status(404).json({ msg: "User not found" });
      return;
    }
    res.status(200).json({
      msg: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};

// Delete a user by id
export const delete_user = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      res.status(404).json({ msg: "User not found" });
      return;
    }
    res.status(200).json({
      msg: "User deleted successfully",
      user: deletedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
};
