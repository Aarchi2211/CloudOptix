const CloudUsage = require("../models/CloudUsage");
const Alert = require("../models/Alert");
const { normalizeUsageRecord, generateAlertsFromUsageRecords } = require("../utils/costLeakDetector");

// Simple in-memory cache — invalidated on every upload
let usageCache = null;
let usageCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000;
const invalidateCache = () => { usageCache = null; usageCacheTime = 0; };

const uploadUsage = async (req, res) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : req.body.records;
    if (!Array.isArray(payload) || payload.length === 0)
      return res.status(400).json({ error: "No usage records were provided." });

    const normalizedRecords = payload
      .map(normalizeUsageRecord)
      .filter((r) => r.resource && r.date);

    if (normalizedRecords.length === 0)
      return res.status(400).json({ error: "No valid usage records were found in the upload." });

    await Promise.all([CloudUsage.deleteMany({}), Alert.deleteMany({})]);
    await CloudUsage.insertMany(normalizedRecords);
    invalidateCache();

    const alerts = generateAlertsFromUsageRecords(normalizedRecords);
    if (alerts.length > 0) await Alert.insertMany(alerts);

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

const getUsage = async (req, res) => {
  try {
    const now = Date.now();
    if (usageCache && now - usageCacheTime < CACHE_TTL_MS) return res.json(usageCache);

    const limit = Math.min(parseInt(req.query.limit) || 5000, 10000);
    const usage = await CloudUsage.find()
      .sort({ date: 1 })
      .limit(limit)
      .select("resource usage cost date service region provider usageStartTime usageEndTime")
      .lean();

    usageCache = usage;
    usageCacheTime = now;
    return res.json(usage);
  } catch (error) {
    console.error("Get usage error:", error);
    return res.status(500).json({ error: "Failed to fetch usage data." });
  }
};

module.exports = { uploadUsage, getUsage };
