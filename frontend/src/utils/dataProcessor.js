const FIELD_ALIASES = {
  serviceName: [
    'service_name',
    'service',
    'product',
    'product_name',
    'meter_category',
    'metercategory',
    'service description',
    'service_description',
  ],
  usageAmount: [
    'usage_amount',
    'usage',
    'usage_quantity',
    'usagequantity',
    'quantity',
    'consumed_quantity',
    'consumedquantity',
  ],
  cost: [
    'cost',
    'amount',
    'pretaxcost',
    'pre_tax_cost',
    'unblended_cost',
    'blended_cost',
    'extended_cost',
    'effective_cost',
  ],
  usageStartTime: [
    'usage_start_time',
    'usage_start',
    'usage_start_date',
    'usagestartdate',
    'start_time',
    'date',
    'usage_date',
  ],
  usageEndTime: [
    'usage_end_time',
    'usage_end',
    'usage_end_date',
    'usageenddate',
    'end_time',
  ],
  region: [
    'region',
    'location',
    'resource_location',
    'service_region',
  ],
  accountId: [
    'project_id',
    'project',
    'account_id',
    'account',
    'subscription_id',
    'subscription',
    'tenant_id',
  ],
  resourceName: [
    'resource_name',
    'resource',
    'resource_id',
    'resourceid',
    'instance_id',
    'instance',
  ],
  provider: [
    'cloud_provider',
    'provider',
    'vendor',
  ],
};

const SPIKE_THRESHOLD = 1.5;
const MAX_TOP_RESULTS = 5;

const normalizeHeader = (value = '') =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/^\ufeff/, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const cleanupValue = (value) => {
  if (value == null) {
    return '';
  }

  return value.toString().trim();
};

const toNumber = (value) => {
  if (value == null || value === '') {
    return null;
  }

  const cleaned = value
    .toString()
    .trim()
    .replace(/,/g, '')
    .replace(/\$/g, '')
    .replace(/₹/g, '')
    .replace(/€/g, '')
    .replace(/^\((.*)\)$/, '-$1');

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const toIsoDate = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
};

const getDateKey = (isoDate) => (isoDate ? isoDate.slice(0, 10) : null);

const getMonthKey = (isoDate) => (isoDate ? isoDate.slice(0, 7) : null);

const formatNumber = (value) => Number(value.toFixed(2));

const parseCsvLine = (line) => {
  const columns = [];
  let current = '';
  let quoteOpen = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"') {
      if (quoteOpen && nextCharacter === '"') {
        current += '"';
        index += 1;
      } else {
        quoteOpen = !quoteOpen;
      }
      continue;
    }

    if (character === ',' && !quoteOpen) {
      columns.push(current);
      current = '';
      continue;
    }

    current += character;
  }

  columns.push(current);
  return columns.map(cleanupValue);
};

export const parseCsvToJson = (csvText = '') => {
  const sanitized = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

  if (!sanitized) {
    return [];
  }

  const lines = sanitized.split('\n').filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);

  return lines.slice(1).map((line, rowIndex) => {
    const values = parseCsvLine(line);
    const row = { __rowNumber: rowIndex + 2 };

    headers.forEach((header, columnIndex) => {
      row[header || `column_${columnIndex + 1}`] = cleanupValue(values[columnIndex] ?? '');
    });

    return row;
  });
};

const resolveFieldValue = (row, aliases) => {
  for (const alias of aliases) {
    const key = normalizeHeader(alias);
    if (row[key] !== undefined && row[key] !== '') {
      return row[key];
    }
  }

  return '';
};

const inferProvider = (row) => {
  const explicitProvider = cleanupValue(resolveFieldValue(row, FIELD_ALIASES.provider));
  const combinedText = Object.values(row).join(' ').toLowerCase();

  if (explicitProvider) {
    return explicitProvider.toUpperCase();
  }

  if (combinedText.includes('amazon') || combinedText.includes('aws') || combinedText.includes('ec2') || combinedText.includes('s3')) {
    return 'AWS';
  }

  if (combinedText.includes('google') || combinedText.includes('gcp') || combinedText.includes('compute engine') || combinedText.includes('cloud storage')) {
    return 'GCP';
  }

  if (combinedText.includes('azure') || combinedText.includes('virtual machines') || combinedText.includes('blob storage')) {
    return 'AZURE';
  }

  return 'UNKNOWN';
};

export const normalizeBillingRow = (row) => {
  const usageStartTime = toIsoDate(resolveFieldValue(row, FIELD_ALIASES.usageStartTime));
  const usageEndTime = toIsoDate(resolveFieldValue(row, FIELD_ALIASES.usageEndTime));
  const cost = toNumber(resolveFieldValue(row, FIELD_ALIASES.cost));
  const usageAmount = toNumber(resolveFieldValue(row, FIELD_ALIASES.usageAmount));
  const serviceName = cleanupValue(resolveFieldValue(row, FIELD_ALIASES.serviceName)) || 'Unknown Service';
  const resourceName = cleanupValue(resolveFieldValue(row, FIELD_ALIASES.resourceName)) || 'Unknown Resource';
  const accountId = cleanupValue(resolveFieldValue(row, FIELD_ALIASES.accountId)) || 'Unknown Account';
  const region = cleanupValue(resolveFieldValue(row, FIELD_ALIASES.region)) || 'Unknown Region';
  const provider = inferProvider(row);
  const usageDate = getDateKey(usageStartTime);

  return {
    rawRowNumber: row.__rowNumber ?? null,
    provider,
    serviceName,
    usageAmount: usageAmount ?? 0,
    cost: cost ?? 0,
    usageStartTime,
    usageEndTime,
    usageDate,
    usageMonth: getMonthKey(usageStartTime),
    region,
    accountId,
    resourceName,
    isValid: Boolean(usageStartTime),
  };
};

const updateAggregate = (map, key, seed) => {
  if (!key) {
    return null;
  }

  if (!map.has(key)) {
    map.set(key, seed());
  }

  return map.get(key);
};

const sortByCostDesc = (left, right) => right.totalCost - left.totalCost;
const sortByUsageDesc = (left, right) => right.totalUsage - left.totalUsage;

export const buildCloudAnalytics = (rows = []) => {
  const normalizedRows = [];
  const invalidRows = [];
  const dailyMap = new Map();
  const monthlyMap = new Map();
  const serviceMap = new Map();
  const resourceMap = new Map();
  const serviceDailyMap = new Map();
  const providerCounts = new Map();

  rows.forEach((row) => {
    const normalized = normalizeBillingRow(row);

    if (!normalized.isValid) {
      invalidRows.push({
        rowNumber: normalized.rawRowNumber,
        reason: 'Invalid or missing usage_start_time',
      });
      return;
    }

    normalizedRows.push(normalized);
    providerCounts.set(normalized.provider, (providerCounts.get(normalized.provider) ?? 0) + 1);

    const daily = updateAggregate(dailyMap, normalized.usageDate, () => ({
      date: normalized.usageDate,
      totalCost: 0,
      totalUsage: 0,
    }));
    daily.totalCost += normalized.cost;
    daily.totalUsage += normalized.usageAmount;

    const monthly = updateAggregate(monthlyMap, normalized.usageMonth, () => ({
      month: normalized.usageMonth,
      totalCost: 0,
      totalUsage: 0,
    }));
    monthly.totalCost += normalized.cost;
    monthly.totalUsage += normalized.usageAmount;

    const service = updateAggregate(serviceMap, normalized.serviceName, () => ({
      service: normalized.serviceName,
      provider: normalized.provider,
      totalCost: 0,
      totalUsage: 0,
    }));
    service.totalCost += normalized.cost;
    service.totalUsage += normalized.usageAmount;

    const resource = updateAggregate(resourceMap, normalized.resourceName, () => ({
      resource: normalized.resourceName,
      service: normalized.serviceName,
      provider: normalized.provider,
      totalUsage: 0,
      totalCost: 0,
    }));
    resource.totalUsage += normalized.usageAmount;
    resource.totalCost += normalized.cost;

    const serviceDayKey = `${normalized.serviceName}__${normalized.usageDate}`;
    const serviceDay = updateAggregate(serviceDailyMap, serviceDayKey, () => ({
      service: normalized.serviceName,
      date: normalized.usageDate,
      totalCost: 0,
      totalUsage: 0,
    }));
    serviceDay.totalCost += normalized.cost;
    serviceDay.totalUsage += normalized.usageAmount;
  });

  const dailyUsage = Array.from(dailyMap.values())
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((item) => ({
      ...item,
      totalCost: formatNumber(item.totalCost),
      totalUsage: formatNumber(item.totalUsage),
    }));

  const monthlyUsage = Array.from(monthlyMap.values())
    .sort((left, right) => left.month.localeCompare(right.month))
    .map((item) => ({
      ...item,
      totalCost: formatNumber(item.totalCost),
      totalUsage: formatNumber(item.totalUsage),
    }));

  const serviceUsage = Array.from(serviceMap.values())
    .map((item) => ({
      ...item,
      totalCost: formatNumber(item.totalCost),
      totalUsage: formatNumber(item.totalUsage),
    }))
    .sort(sortByCostDesc);

  const topServices = serviceUsage.slice(0, MAX_TOP_RESULTS);

  const topResources = Array.from(resourceMap.values())
    .map((item) => ({
      ...item,
      totalCost: formatNumber(item.totalCost),
      totalUsage: formatNumber(item.totalUsage),
    }))
    .sort(sortByUsageDesc)
    .slice(0, MAX_TOP_RESULTS);

  const anomalies = [];

  for (let index = 1; index < dailyUsage.length; index += 1) {
    const previousDay = dailyUsage[index - 1];
    const currentDay = dailyUsage[index];

    if (previousDay.totalCost > 0 && currentDay.totalCost > previousDay.totalCost * SPIKE_THRESHOLD) {
      anomalies.push({
        type: 'daily_cost_spike',
        date: currentDay.date,
        previousDate: previousDay.date,
        currentCost: currentDay.totalCost,
        previousCost: previousDay.totalCost,
        message: `Daily cost increased by more than 150% vs previous day.`,
      });
    }
  }

  const serviceDailySeries = Array.from(serviceDailyMap.values()).sort((left, right) => {
    if (left.service === right.service) {
      return left.date.localeCompare(right.date);
    }

    return left.service.localeCompare(right.service);
  });

  for (let index = 1; index < serviceDailySeries.length; index += 1) {
    const previousEntry = serviceDailySeries[index - 1];
    const currentEntry = serviceDailySeries[index];

    if (previousEntry.service !== currentEntry.service) {
      continue;
    }

    if (previousEntry.totalCost > 0 && currentEntry.totalCost > previousEntry.totalCost * SPIKE_THRESHOLD) {
      anomalies.push({
        type: 'service_cost_spike',
        service: currentEntry.service,
        date: currentEntry.date,
        previousDate: previousEntry.date,
        currentCost: formatNumber(currentEntry.totalCost),
        previousCost: formatNumber(previousEntry.totalCost),
        message: `${currentEntry.service} cost spiked by more than 150% vs previous day.`,
      });
    }
  }

  return {
    records: normalizedRows,
    dailyUsage,
    monthlyUsage,
    serviceUsage,
    anomalies,
    topServices,
    topResources,
    metadata: {
      totalRows: rows.length,
      validRows: normalizedRows.length,
      invalidRows: invalidRows.length,
      providers: Array.from(providerCounts.entries()).map(([provider, count]) => ({ provider, count })),
      invalidRowDetails: invalidRows.slice(0, 20),
    },
  };
};

export const processBillingCsv = (csvText = '') => {
  const parsedRows = parseCsvToJson(csvText);
  return buildCloudAnalytics(parsedRows);
};
