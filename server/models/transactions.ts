import mongoose, { Schema } from "mongoose";

const transac_schema = new mongoose.Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      default: 0,
      required: true,
    },
  },
  { timestamps: true }
);

const Transac = mongoose.model("Transactions", transac_schema);
export default Transac;
