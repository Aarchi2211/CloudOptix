const DEFAULTS = {
  idleUsageThreshold: 5,
  overProvisionRatio: 0.3,
  lowUsageThreshold: 5,
  longRunningHours: 24,
  highCostThreshold: 100,
  costSpikeRatio: 1.5,
  serviceCostShareThreshold: 0.4,
};

const SEVERITY_ORDER = {
  critical: 0,
  warning: 1,
  info: 2,
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toTimestamp = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
};

const formatCurrencyValue = (value) => Number(toNumber(value).toFixed(2));
const formatUsageValue = (value) => Number(toNumber(value).toFixed(2));
const formatDurationHours = (hours) => Number(toNumber(hours).toFixed(2));

const buildAlert = ({
  type,
  severity,
  message,
  resource,
  service,
  cost,
  usageAmount,
  region,
  provider,
  duration,
  date,
  extra = {},
}) => ({
  id: `${type}-${service || 'unknown-service'}-${resource || 'unknown-resource'}-${date || Date.now()}`,
  type,
  severity,
  message,
  resource: resource || 'Unknown Resource',
  service: service || 'Unknown Service',
  cost: cost == null ? null : formatCurrencyValue(cost),
  usageAmount: usageAmount == null ? null : formatUsageValue(usageAmount),
  region: region || 'Unknown Region',
  provider: provider || 'UNKNOWN',
  duration: duration == null ? null : `${formatDurationHours(duration)} hours`,
  timestamp: new Date().toISOString(),
  date: date || null,
  ...extra,
});

const groupBy = (items, keyBuilder) => {
  const map = new Map();

  items.forEach((item) => {
    const key = keyBuilder(item);
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(item);
  });

  return map;
};

const getUsageDate = (record) => {
  if (record.usageDate) {
    return record.usageDate;
  }

  if (record.usageStartTime) {
    return record.usageStartTime.slice(0, 10);
  }

  if (record.date) {
    const timestamp = toTimestamp(record.date);
    return timestamp ? new Date(timestamp).toISOString().slice(0, 10) : null;
  }

  return null;
};

const normalizeRecord = (record) => ({
  serviceName: record.serviceName || record.service_name || record.service || 'Unknown Service',
  resourceName: record.resourceName || record.resource_name || record.resource || 'Unknown Resource',
  usageAmount: toNumber(record.usageAmount ?? record.usage_amount ?? record.usage),
  cost: toNumber(record.cost),
  usageStartTime: record.usageStartTime || record.usage_start_time || record.date || null,
  usageEndTime: record.usageEndTime || record.usage_end_time || null,
  region: record.region || 'Unknown Region',
  provider: record.provider || 'UNKNOWN',
  usageDate: getUsageDate(record),
});

export function detectIdleResources(data, options = {}) {
  const settings = { ...DEFAULTS, ...options };

  return data.reduce((alerts, item) => {
    if (item.cost > 0 && item.usageAmount <= settings.idleUsageThreshold) {
      alerts.push(
        buildAlert({
          type: 'Idle Resource',
          severity: 'warning',
          message: 'Resource is incurring cost but has little or no usage.',
          resource: item.resourceName,
          service: item.serviceName,
          cost: item.cost,
          usageAmount: item.usageAmount,
          region: item.region,
          provider: item.provider,
          date: item.usageDate,
        }),
      );
    }

    return alerts;
  }, []);
}

export function detectOverProvision(data, options = {}) {
  const settings = { ...DEFAULTS, ...options };
  const serviceGroups = groupBy(data, (item) => item.serviceName);
  const alerts = [];

  serviceGroups.forEach((records, serviceName) => {
    const averageUsage = records.reduce((sum, item) => sum + item.usageAmount, 0) / (records.length || 1);
    const threshold = averageUsage * settings.overProvisionRatio;

    records.forEach((item) => {
      if (averageUsage > 0 && item.usageAmount > 0 && item.usageAmount < threshold) {
        alerts.push(
          buildAlert({
            type: 'Over-Provisioned',
            severity: 'warning',
            message: 'Resource capacity is underutilized compared to average service usage.',
            resource: item.resourceName,
            service: serviceName,
            cost: item.cost,
            usageAmount: item.usageAmount,
            region: item.region,
            provider: item.provider,
            date: item.usageDate,
            extra: {
              averageServiceUsage: formatUsageValue(averageUsage),
            },
          }),
        );
      }
    });
  });

  return alerts;
}

export function detectLongRunning(data, options = {}) {
  const settings = { ...DEFAULTS, ...options };

  return data.reduce((alerts, item) => {
    const start = toTimestamp(item.usageStartTime);
    const end = toTimestamp(item.usageEndTime);

    if (!start || !end || end <= start) {
      return alerts;
    }

    const durationHours = (end - start) / (1000 * 60 * 60);

    if (durationHours > settings.longRunningHours && item.usageAmount <= settings.lowUsageThreshold) {
      alerts.push(
        buildAlert({
          type: 'Long Running Instance',
          severity: 'critical',
          message: 'Instance running for long duration with low usage.',
          resource: item.resourceName,
          service: item.serviceName,
          cost: item.cost,
          usageAmount: item.usageAmount,
          region: item.region,
          provider: item.provider,
          duration: durationHours,
          date: item.usageDate,
        }),
      );
    }

    return alerts;
  }, []);
}

export function detectCostSpikes(data, options = {}) {
  const settings = { ...DEFAULTS, ...options };
  const alerts = [];

  data.forEach((item) => {
    if (item.cost > settings.highCostThreshold) {
      alerts.push(
        buildAlert({
          type: 'Cost Spike',
          severity: 'critical',
          message: 'Resource cost exceeded the configured daily threshold.',
          resource: item.resourceName,
          service: item.serviceName,
          cost: item.cost,
          usageAmount: item.usageAmount,
          region: item.region,
          provider: item.provider,
          date: item.usageDate,
        }),
      );
    }
  });

  const resourceGroups = groupBy(data, (item) => item.resourceName);

  resourceGroups.forEach((records) => {
    const sorted = [...records].sort((left, right) => (left.usageDate || '').localeCompare(right.usageDate || ''));

    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1];
      const current = sorted[index];

      if (previous.cost > 0 && current.cost > previous.cost * settings.costSpikeRatio) {
        alerts.push(
          buildAlert({
            type: 'Cost Spike',
            severity: 'critical',
            message: 'Unusual increase in cost detected compared to the previous billing period.',
            resource: current.resourceName,
            service: current.serviceName,
            cost: current.cost,
            usageAmount: current.usageAmount,
            region: current.region,
            provider: current.provider,
            date: current.usageDate,
            extra: {
              previousCost: formatCurrencyValue(previous.cost),
              previousDate: previous.usageDate,
            },
          }),
        );
      }
    }
  });

  const totalCost = data.reduce((sum, item) => sum + item.cost, 0);
  const serviceGroups = groupBy(data, (item) => item.serviceName);

  serviceGroups.forEach((records, serviceName) => {
    const serviceCost = records.reduce((sum, item) => sum + item.cost, 0);
    const share = totalCost > 0 ? serviceCost / totalCost : 0;

    if (share > settings.serviceCostShareThreshold) {
      alerts.push(
        buildAlert({
          type: 'Service Cost Leak',
          severity: 'warning',
          message: 'Service is consuming a disproportionately large share of total cloud spend.',
          resource: serviceName,
          service: serviceName,
          cost: serviceCost,
          region: records[0]?.region,
          provider: records[0]?.provider,
          date: records[0]?.usageDate,
          extra: {
            costShare: Number((share * 100).toFixed(2)),
          },
        }),
      );
    }
  });

  return alerts;
}

const dedupeAlerts = (alerts) => {
  const seen = new Map();

  alerts.forEach((alert) => {
    if (!seen.has(alert.id)) {
      seen.set(alert.id, alert);
    }
  });

  return Array.from(seen.values());
};

export function detectCostLeaks(data, options = {}) {
  const normalizedData = Array.isArray(data)
    ? data
        .map(normalizeRecord)
        .filter((item) => item.serviceName && item.resourceName)
    : [];

  const alerts = dedupeAlerts([
    ...detectIdleResources(normalizedData, options),
    ...detectOverProvision(normalizedData, options),
    ...detectLongRunning(normalizedData, options),
    ...detectCostSpikes(normalizedData, options),
  ]);

  return alerts.sort((left, right) => {
    const severityRank = (SEVERITY_ORDER[left.severity] ?? 99) - (SEVERITY_ORDER[right.severity] ?? 99);
    if (severityRank !== 0) {
      return severityRank;
    }

    return toNumber(right.cost) - toNumber(left.cost);
  });
}
