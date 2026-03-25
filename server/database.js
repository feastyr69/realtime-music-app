const mongoose = require("mongoose");

const databaseConnection = () => {
  mongoose
    .connect("mongodb://localhost:27017/crud")
    .then(() => {
      console.log("Database connected successfully");
    })
    .catch((err) => {
      console.log("Database connection failed:", err);
    });
};

module.exports = databaseConnection;

