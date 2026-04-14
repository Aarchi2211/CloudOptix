const Alert = require("../models/Alert");

const getAlerts = async (_req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 }).lean();
    return res.json(alerts);
  } catch (error) {
    console.error("Get alerts error:", error);
    return res.status(500).json({ error: "Failed to fetch alerts." });
  }
};

const updateAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!["read", "unread"].includes(status))
      return res.status(400).json({ error: "Status must be 'read' or 'unread'." });

    const alert = await Alert.findByIdAndUpdate(id, { status }, { new: true });
    if (!alert) return res.status(404).json({ error: "Alert not found." });
    return res.json(alert);
  } catch (error) {
    console.error("Update alert error:", error);
    return res.status(500).json({ error: "Failed to update alert." });
  }
};

const deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Alert.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Alert not found." });
    return res.status(204).send();
  } catch (error) {
    console.error("Delete alert error:", error);
    return res.status(500).json({ error: "Failed to delete alert." });
  }
};

module.exports = { getAlerts, updateAlert, deleteAlert };
