const CloudUsage = require("../models/CloudUsage");
const Alert = require("../models/Alert");
const {
  normalizeUsageRecord,
  generateAlertsFromUsageRecords,
} = require("../utils/costLeakDetector");

const uploadUsage = async (req, res) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : req.body.records;

    if (!Array.isArray(payload) || payload.length === 0) {
      return res.status(400).json({ error: "No usage records were provided." });
    }

    const normalizedRecords = payload
      .map(normalizeUsageRecord)
      .filter((record) => record.resource && record.date);

    if (normalizedRecords.length === 0) {
      return res.status(400).json({ error: "No valid usage records were found in the upload." });
    }

    await Promise.all([CloudUsage.deleteMany({}), Alert.deleteMany({})]);
    await CloudUsage.insertMany(normalizedRecords);

    const alerts = generateAlertsFromUsageRecords(normalizedRecords);
    if (alerts.length > 0) {
      await Alert.insertMany(alerts);
    }

    return res.status(201).json({
      message: "Usage data uploaded successfully.",
      recordsStored: normalizedRecords.length,
      alertsGenerated: alerts.length,
    });
  } catch (error) {
    console.error("Upload usage error:", error);
    return res.status(500).json({ error: "Failed to upload usage data." });
  }
};

const getUsage = async (_req, res) => {
  try {
    const usage = await CloudUsage.find().sort({ date: 1 }).lean();
    return res.json(usage);
  } catch (error) {
    console.error("Get usage error:", error);
    return res.status(500).json({ error: "Failed to fetch usage data." });
  }
};

module.exports = {
  uploadUsage,
  getUsage,
};
