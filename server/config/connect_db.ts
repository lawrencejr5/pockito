import mongoose from "mongoose";

const connect_db = async (url: string) => {
  return mongoose.connect(url, { dbName: "pockito" });
};

export default connect_db;
