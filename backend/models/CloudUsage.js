const mongoose = require("mongoose");

const cloudUsageSchema = new mongoose.Schema(
  {
    resource:       { type: String, required: true, trim: true },
    usage:          { type: Number, required: true, default: 0 },
    cost:           { type: Number, required: true, default: 0 },
    date:           { type: Date,   required: true, default: Date.now, index: true },
    service:        { type: String, default: null, index: true },
    region:         { type: String, default: null },
    provider:       { type: String, default: null },
    usageStartTime: { type: Date,   default: null },
    usageEndTime:   { type: Date,   default: null },
  },
  { versionKey: false },
);

cloudUsageSchema.index({ date: 1, service: 1 });

module.exports = mongoose.model("CloudUsage", cloudUsageSchema);
