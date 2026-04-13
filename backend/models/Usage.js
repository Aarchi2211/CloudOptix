const mongoose = require("mongoose");
const cloudUsageSchema = new mongoose.Schema({
  resource: { type: String, required: true },
  usage: { type: Number, required: true, default: 0 },
  cost: { type: Number, required: true, default: 0 },
  date: { type: Date, required: true, default: Date.now },
  service: { type: String },
  region: { type: String },
});
module.exports = mongoose.model("CloudUsage", cloudUsageSchema);
