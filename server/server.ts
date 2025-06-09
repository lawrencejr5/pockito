import express from "express";
const app = express();

import dotenv from "dotenv";
dotenv.config();

import not_found from "./middlewares/not_found";
import connect_db from "./config/connect_db";

import user_router from "./routes/users";
import transac_router from "./routes/transactions";

import cors from "cors";

app.use(cors());
app.use(express.json());

app.use("/api/v1/users", user_router);
app.use("/api/v1/transactions", transac_router);

app.use(not_found);

const PORT = process.env.PORT || "5001";
const DB = process.env.MONGO_URI as string;

const start_server = async (): Promise<void> => {
  try {
    await connect_db(DB);
    app.listen(PORT, () => console.log(`App listening on port ${PORT}`));
  } catch (error) {
    console.log(error);
  }
};
start_server();
