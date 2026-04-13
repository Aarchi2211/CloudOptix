const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    resource: { type: String, required: true, trim: true },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["read", "unread"],
      default: "unread",
    },
    createdAt: { type: Date, default: Date.now },
    currentCost: { type: Number, default: null },
    previousCost: { type: Number, default: null },
    usage: { type: Number, default: null },
    type: { type: String, default: null },
    dateTime: { type: Date, default: null },
  },
  {
    versionKey: false,
  },
);

module.exports = mongoose.model("Alert", alertSchema);
