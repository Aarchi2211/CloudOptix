const DEFAULT_COST_THRESHOLD = 100;

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeUsageRecord = (record) => {
  const dateValue = record.date || record.usageDate || record.usage_start_time || record.usageStartTime || record.dateTime;
  const usageStartTime = record.usageStartTime || record.usage_start_time || dateValue;
  const usageEndTime = record.usageEndTime || record.usage_end_time || null;

  return {
    resource: String(record.resource || record.service || record.resourceName || record.serviceName || 'Unknown Resource'),
    service: record.service || record.serviceName || record.service_name || null,
    usage: toNumber(record.usage ?? record.usageAmount ?? record.usage_amount),
    cost: toNumber(record.cost ?? record.costAmount ?? record.totalCost),
    date: dateValue ? new Date(dateValue) : new Date(),
    ...(record.region ? { region: record.region } : {}),
    ...(record.provider ? { provider: record.provider } : {}),
    ...(usageStartTime ? { usageStartTime: new Date(usageStartTime) } : {}),
    ...(usageEndTime ? { usageEndTime: new Date(usageEndTime) } : {}),
  };
};

const buildAlert = ({ title, message, severity, resource, type, cost, usage, date }) => ({
  title,
  message,
  severity,
  resource,
  status: 'unread',
  createdAt: new Date(),
  currentCost: cost,
  usage,
  type,
  dateTime: date || new Date(),
});

const generateAlertsFromUsageRecords = (records = []) => {
  const alerts = [];

  records.forEach((rawRecord) => {
    const record = normalizeUsageRecord(rawRecord);
    const { usage, cost, resource, date } = record;
    const resourceLabel = resource || 'Unknown Resource';
    const detectionDate = date || new Date();

    if (usage < 10 && cost > 0) {
      alerts.push(
        buildAlert({
          title: 'Idle Resource Detected',
          message: `The resource ${resourceLabel} has very low usage (${usage}%) while still incurring cost. Consider rightsizing or terminating idle capacity.`,
          severity: 'medium',
          resource: resourceLabel,
          type: 'idle_resource',
          cost,
          usage,
          date: detectionDate,
        }),
      );
    }

    if (usage < 30 && cost > DEFAULT_COST_THRESHOLD) {
      alerts.push(
        buildAlert({
          title: 'Over-Provisioned Resource',
          message: `The resource ${resourceLabel} has low utilization (${usage}%) but high spend ($${cost.toFixed(2)}). Review scaling and reservation settings.`,
          severity: 'high',
          resource: resourceLabel,
          type: 'over_provisioned',
          cost,
          usage,
          date: detectionDate,
        }),
      );
    }

    if (usage > 85) {
      alerts.push(
        buildAlert({
          title: 'High Usage Resource',
          message: `The resource ${resourceLabel} is highly utilized (${usage}%), which may require capacity planning or performance scaling.`,
          severity: 'high',
          resource: resourceLabel,
          type: 'high_usage',
          cost,
          usage,
          date: detectionDate,
        }),
      );
    }

    if (cost > DEFAULT_COST_THRESHOLD) {
      alerts.push(
        buildAlert({
          title: 'High Cost Resource',
          message: `The resource ${resourceLabel} has crossed the cost threshold with $${cost.toFixed(2)} in spend. Investigate billing and optimization opportunities.`,
          severity: 'critical',
          resource: resourceLabel,
          type: 'high_cost',
          cost,
          usage,
          date: detectionDate,
        }),
      );
    }
  });

  const uniqueMap = new Map();
  alerts.forEach((alert) => {
    const dateKey = new Date(alert.dateTime || alert.createdAt).toISOString().slice(0, 10);
    const key = `${alert.type}-${alert.resource}-${dateKey}`;

    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, alert);
    }
  });

  return Array.from(uniqueMap.values()).sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
};

module.exports = {
  normalizeUsageRecord,
  generateAlertsFromUsageRecords,
};
