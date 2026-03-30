const express = require("express");
const router = express.Router();
const Usage = require("./models/Usage");
const Alert = require("./models/Alert");

const buildFallbackAlerts = (records) => {
  const alerts = [];

  records.forEach((item) => {
    if (Number(item.cost) > 100) {
      alerts.push({
        title: "High Cost",
        severity: "high",
        resource: item.resource,
        message: `${item.service || 'Service'} crossed the configured cost threshold.`,
        dateTime: item.date || new Date().toISOString(),
      });
    }
  });

  return alerts;
};

router.post("/upload", async (req, res) => {
  const payload = req.body;
  const records = Array.isArray(payload) ? payload : Array.isArray(payload.records) ? payload.records : [];
  const uploadedAlerts = Array.isArray(payload?.alerts) ? payload.alerts : [];

  if (records.length > 0) {
    await Usage.insertMany(records);
  }

  const alertsToStore = uploadedAlerts.length > 0 ? uploadedAlerts : buildFallbackAlerts(records);

  await Alert.deleteMany({});

  if (alertsToStore.length > 0) {
    await Alert.insertMany(alertsToStore);
  }

  res.json({
    message: "Data stored successfully",
    storedRecords: records.length,
    storedAlerts: alertsToStore.length,
  });
});

router.get("/alerts", async (req, res) => {
  const alerts = await Alert.find().sort({ dateTime: -1, _id: -1 });
  res.json(alerts);
});

router.get("/usage", async (req, res) => {
  const usage = await Usage.find();
  res.json(usage);
});

module.exports = router;
