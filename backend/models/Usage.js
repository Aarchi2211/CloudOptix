const mongoose = require("mongoose");

const usageSchema = new mongoose.Schema({
  date: String,
  service: String,
  cost: Number,
  usage: Number,
  resource: String
});

module.exports = mongoose.model("Usage", usageSchema);