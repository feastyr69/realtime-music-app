const express = require("express");
const router = express.Router();
const {createRoom} = require("../services/chatService");
const {
  handleRecord,
  handleGetRecord,
  handleDeleteRecord,
  handleUpdateRecord,
} = require("../controller/crud.controller");

router.post("/addrecord", handleRecord);
router.get("/getrecord", handleGetRecord);
router.post("/deleterecord", handleDeleteRecord);
router.put("/updaterecord", handleUpdateRecord);

router.get("/create", createRoom);

module.exports = router;
