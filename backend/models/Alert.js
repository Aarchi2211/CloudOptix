const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
  title: String,
  severity: String,
  resource: String,
  message: String,
  dateTime: String
});

module.exports = mongoose.model("Alert", alertSchema);