const { json } = require("express");
const { CrudModel } = require("../model/crud.model");

const handleRecord = async (req, res) => {
  try {
    const body = req.body;
    if (!body.Subject || !body.AttendedClasses || !body.TotalClasses || !body.Criteria) {
      return res
        .status(400)
        .json({ message: "All fields are required", status: "failed" });
    }

    const recordAdd = await CrudModel.insertOne(body);

    if (recordAdd) {
      return res.status(201).json({
        message: "Record added successfully",
        status: "success",
        id: recordAdd._id,
      });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message, status: "failed" });
  }
};

const handleGetRecord = async (req, res) => {
  try {
    const records = await CrudModel.find({});
    return res.status(200).json({
      message: "Records fetched successfully",
      status: "success",
      records: records,
      totalCount: records.length,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message, status: "failed" });
  }
};

const handleDeleteRecord = async (req, res) => {
  try {
    const body = req.body;
    const deleted = await CrudModel.deleteOne({ _id: body.Id });
    if (deleted.acknowledged) {
      return res.json({
        message: "Record deleted successfully",
        status: "success",
      });
    }
  } catch (err) {
    return res.status(400).json({ message: err.message, status: "failed" });
  }
};

const handleUpdateRecord = async (req, res) => {
  try {
    const body = req.body;
    const updated = await CrudModel.updateOne(
      { _id: body?._id },
      { $set: body }
    );
    console.log(updated);
    if (updated.acknowledged) {
      return res.json({
        message: "Record Updated Successfully",
        status: "success",
      });
    }
  } catch (err) {
    return res.status(400).json({ message: err.message, status: "failed" });
  }
};

module.exports = {
  handleRecord,
  handleGetRecord,
  handleDeleteRecord,
  handleUpdateRecord,
};
