const mongoose = require("mongoose");

const crudSchema = new mongoose.Schema(
  {
    Subject: { type: String, required: true },
    AttendedClasses: { type: Number, required: true },
    TotalClasses: { type: Number, required: true },
    Criteria: { type: Number, default: 75 },
  },
  { timestamps: true }
);

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

const CrudModel = mongoose.model("CrudRecord", crudSchema);
const UserModel = mongoose.model("User", UserSchema);

module.exports = { CrudModel, UserModel };
