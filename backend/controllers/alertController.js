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

    if (!["read", "unread"].includes(status)) {
      return res.status(400).json({ error: "Status must be either read or unread." });
    }

    const updatedAlert = await Alert.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });

    if (!updatedAlert) {
      return res.status(404).json({ error: "Alert not found." });
    }

    return res.json(updatedAlert);
  } catch (error) {
    console.error("Update alert error:", error);
    return res.status(500).json({ error: "Failed to update alert." });
  }
};

const deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedAlert = await Alert.findByIdAndDelete(id);

    if (!deletedAlert) {
      return res.status(404).json({ error: "Alert not found." });
    }

    return res.json({ message: "Alert deleted successfully." });
  } catch (error) {
    console.error("Delete alert error:", error);
    return res.status(500).json({ error: "Failed to delete alert." });
  }
};

module.exports = {
  getAlerts,
  updateAlert,
  deleteAlert,
};
