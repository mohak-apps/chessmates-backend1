const mongoose = require("mongoose");
require("dotenv").config();

const DB_URL = process.env.DB_URL;

const connectDB = async () => {
  mongoose
    .connect(DB_URL)
    .then(() => {
      console.log("Mongo DB is connected");
    })
    .catch((err: any) => {
      console.log("Error in Mongo DB connection", err);
    });
};

export default connectDB;
