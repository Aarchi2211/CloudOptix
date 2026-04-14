import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAlerts } from '../utils/api';
import { useUsageRecords } from '../hooks/useUsageRecords';
import { ALERTS_UPDATED_EVENT } from '../utils/cloudEvents';
import './Dashboard.css';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const CHART_BLUE  = '#2563eb';
const CHART_AMBER = '#f59e0b';
const CHART_NAVY  = '#1e3a8a';
const CHART_SKY   = '#38bdf8';
const CHART_INDIGO= '#6366f1';
const CHART_TEAL  = '#0d9488';

// Blue→yellow theme palette for multi-series / pie slices
const REGION_COLORS = ['#2563eb','#f59e0b','#1d4ed8','#fbbf24','#3b82f6','#d97706'];

const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: '1px solid #fde68a',
  boxShadow: '0 4px 16px rgba(37,99,235,.12)',
  fontSize: 13,
};

const pageStyles = `
:root{--primary-blue:#2563eb;--primary-blue-deep:#1d4ed8;--accent-yellow:#f59e0b;--accent-yellow-soft:#fbbf24;--success-green:#16a34a;--danger-red:#dc2626;--text-strong:#0f172a;--text-muted:#64748b;--surface-card:rgba(255,255,255,.92)}
.dashboard-container{min-height:100vh;padding:36px 20px 56px;background:background:
    radial-gradient(circle at 20% 18%, rgba(255, 255, 255, 0.18), transparent 24%),
    radial-gradient(circle at 78% 22%, rgba(255, 255, 255, 0.14), transparent 20%),
    linear-gradient(180deg, #0f3b8f 0%, #1666c5 48%, #64bbff 100%);}
.dashboard-shell{max-width:1280px;margin:0 auto}
.dashboard-card,.dashboard-empty{background:var(--surface-card);border:1px solid rgba(148,163,184,.16);border-radius:16px;box-shadow:0 18px 40px rgba(15,23,42,.08)}
.dashboard-header{display:grid;grid-template-columns:1fr;gap:18px;margin-bottom:22px}
.dashboard-hero,.dashboard-side,.summary-card,.chart-card,.insight-card,.alerts-section{padding:22px}
.dashboard-badge,.insight-pill,.alert-severity{display:inline-flex;align-items:center;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
.dashboard-badge{padding:7px 16px 7px 10px;background:linear-gradient(135deg,#1e3a8a,#2563eb);color:#fff;border:none;gap:8px;box-shadow:0 4px 14px rgba(37,99,235,.35)}
.dashboard-badge::before{content:'';display:inline-block;width:7px;height:7px;border-radius:50%;background:#f59e0b;box-shadow:0 0 0 2px rgba(245,158,11,.35);flex-shrink:0}
.dashboard-hero h1{margin:16px 0 10px;font-size:clamp(2rem,3vw,3rem);line-height:1.05;color:var(--text-strong)}
.dashboard-hero p,.dashboard-side p,.chart-card p,.insight-card p,.alerts-empty p,.dashboard-empty p{margin:0;color:var(--text-muted);line-height:1.6}
.dashboard-meta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:22px}
.dashboard-meta-item{padding:14px;border-radius:14px;background:linear-gradient(180deg,#ffffff,#f8fbff);border:1px solid rgba(226,232,240,.95);box-shadow:inset 0 1px 0 rgba(245,158,11,.08)}
.dashboard-meta-item span,.summary-card span,.chart-card span,.insight-card span,.alerts-section span,.dashboard-empty span,.alert-time{display:block;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted)}
.dashboard-meta-item strong,.summary-card strong,.insight-card strong{display:block;margin-top:8px;color:var(--text-strong)}
.dashboard-side{display:flex;flex-direction:column;justify-content:space-between;gap:16px}
.dashboard-side h2,.chart-card h2,.alerts-section h2{margin:0;color:var(--text-strong);font-size:1.05rem;position:relative;padding-bottom:10px}
.dashboard-side h2::after,.chart-card h2::after,.alerts-section h2::after{content:'';position:absolute;left:0;bottom:0;width:42px;height:3px;border-radius:999px;background:linear-gradient(90deg,var(--primary-blue),var(--accent-yellow))}
.dashboard-pills{display:flex;gap:10px;flex-wrap:wrap}
.insight-pill{padding:9px 12px;background:linear-gradient(135deg,rgba(37,99,235,.08),rgba(251,191,36,.14));color:var(--primary-blue-deep);border:1px solid rgba(245,158,11,.14)}
.summary-grid,.chart-grid,.insights-grid,.dashboard-bottom{display:grid;gap:18px}
.summary-grid{grid-template-columns:repeat(4,minmax(0,1fr));margin-bottom:22px}
.summary-card{display:flex;gap:16px;align-items:flex-start;transition:transform .18s ease,box-shadow .18s ease}
.summary-card:hover{transform:translateY(-2px);box-shadow:0 22px 44px rgba(15,23,42,.11)}
.summary-icon{width:52px;height:52px;border-radius:16px;display:grid;place-items:center;font-size:24px;font-weight:800;color:var(--primary-blue-deep);background:linear-gradient(135deg,#dbeafe,#fde68a);box-shadow:inset 0 1px 0 rgba(255,255,255,.65)}
.summary-card strong{font-size:clamp(1.35rem,2vw,2rem)}
.summary-card:nth-child(1) strong,.insight-card:first-child strong,.insight-card:nth-child(2) strong{color:var(--accent-yellow)}
.summary-note{margin-top:10px;color:var(--primary-blue-deep);font-size:13px;font-weight:600}
.trend-text{margin-top:6px;font-size:12px;color:var(--text-muted)}
.chart-grid{grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:auto auto;margin-bottom:22px}
.chart-head,.alerts-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:16px}
.chart-area{height:280px}
.chart-legend{display:flex;gap:14px;flex-wrap:wrap;margin-top:10px}
.chart-legend-item{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--text-muted)}
.chart-legend-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
.insights-grid{grid-template-columns:repeat(3,minmax(0,1fr));margin-bottom:22px}
.insight-card strong{font-size:1.1rem}
.insight-card{}
.dashboard-bottom{display:block}
.btn-view-all{padding:7px 16px;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(37,99,235,.25);transition:transform .15s ease,box-shadow .15s ease}
.btn-view-all:hover{transform:translateY(-1px);box-shadow:0 6px 16px rgba(37,99,235,.32)}
.alerts-list{display:flex;flex-direction:column;gap:14px}
.alert-item{display:flex;align-items:flex-start;gap:14px;padding:16px;border-radius:14px;background:linear-gradient(180deg,#ffffff,#f8fbff);border:1px solid #e2e8f0;transition:box-shadow .18s ease,border-color .18s ease}
.alert-item:hover{box-shadow:0 14px 28px rgba(15,23,42,.08);border-color:rgba(245,158,11,.18)}
.alert-dot{width:12px;height:12px;border-radius:50%;margin-top:6px;flex-shrink:0;background:#94a3b8}
.alert-item.high .alert-dot,.alert-item.critical .alert-dot{background:var(--danger-red)}
.alert-item.medium .alert-dot,.alert-item.warning .alert-dot{background:var(--accent-yellow)}
.alert-item.low .alert-dot,.alert-item.info .alert-dot{background:var(--primary-blue)}
.alert-main{flex:1}
.alert-row{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:8px}
.alert-row h4{margin:0;color:var(--text-strong);font-size:14px}
.alert-severity{padding:6px 10px;background:#eff6ff;color:#1d4ed8}
.alert-severity.high,.alert-severity.critical{background:#fee2e2;color:#b91c1c}
.alert-severity.medium,.alert-severity.warning{background:#fef3c7;color:#b45309;box-shadow:inset 0 0 0 1px rgba(245,158,11,.18)}
.alert-severity.low,.alert-severity.info{background:#dbeafe;color:#1d4ed8}
.alert-resource{margin:0;color:#475569;font-size:13px}
.alert-actions{display:flex;flex-direction:column;align-items:flex-end;gap:10px}
.btn-small{padding:8px 14px;background:linear-gradient(135deg,var(--primary-blue),var(--primary-blue-deep));color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 12px 22px rgba(37,99,235,.18);transition:transform .16s ease,box-shadow .16s ease}
.btn-small:hover{transform:translateY(-1px);box-shadow:0 14px 24px rgba(37,99,235,.18),0 0 0 3px rgba(245,158,11,.2)}
.alerts-empty,.dashboard-empty{text-align:center}
.alerts-empty{padding:16px 0 4px}
.dashboard-empty{padding:42px 24px}
.dashboard-empty-icon{width:72px;height:72px;margin:0 auto 18px;border-radius:24px;display:grid;place-items:center;background:linear-gradient(135deg,#dbeafe,#fde68a);color:var(--primary-blue-deep);font-weight:900;letter-spacing:.08em}
@media (max-width:1100px){.dashboard-header,.chart-grid,.dashboard-bottom{grid-template-columns:1fr}.summary-grid,.insights-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:768px){.dashboard-container{padding:20px 12px 36px}.dashboard-card,.dashboard-empty{border-radius:14px}.dashboard-meta,.summary-grid,.insights-grid{grid-template-columns:1fr}.chart-head,.alerts-head,.alert-row,.alert-item{flex-direction:column;align-items:stretch}.chart-area{height:280px}.alert-actions{align-items:flex-start}}
`;

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatMetric = (value = 0) =>
  new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatDayLabel = (value) => {
  if (!value) {
    return 'Unknown';
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatDateTime = (value) => {
  if (!value) {
    return 'Unknown time';
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getRecordCost = (record = {}) => toNumber(record.cost);
const getRecordUsage = (record = {}) => toNumber(record.usageAmount ?? record.usage_amount ?? record.usage);
const getRecordService = (record = {}) => record.serviceName || record.service_name || record.service || 'Unknown Service';
const getRecordResource = (record = {}) => record.resourceName || record.resource_name || record.resource || 'Unknown Resource';
const getRecordStart = (record = {}) =>
  record.usageStartTime || record.usage_start_time || record.usageDate || record.usage_start || record.date || null;

const getDateKey = (value) => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString().slice(0, 10);
};

const getMonthKey = (value) => {
  const date = getDateKey(value);
  return date ? date.slice(0, 7) : null;
};

const getResolvedAlertRatio = (alerts = []) => {
  if (!alerts.length) {
    return 0;
  }

  const resolved = alerts.filter((alert) => alert.status === 'read').length;
  return resolved / alerts.length;
};

const getMonthOverMonthImprovement = (monthlyCost = []) => {
  if (monthlyCost.length < 2) {
    return 0;
  }

  const latest = monthlyCost[monthlyCost.length - 1].cost;
  const previous = monthlyCost[monthlyCost.length - 2].cost;

  if (previous <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(1, (previous - latest) / previous));
};

const calculateEfficiencyScore = (alerts = [], monthlyCost = []) => {
  const improvement = getMonthOverMonthImprovement(monthlyCost);
  const resolvedRatio = getResolvedAlertRatio(alerts);
  const baseScore = alerts.length === 0 ? 70 : 40 + resolvedRatio * 40;
  const score = baseScore + improvement * 30;
  return Math.round(Math.min(Math.max(score, 0), 100));
};

export const calculateTotals = (data = [], alerts = []) => {
  let totalCloudCost = 0;
  let activeResources = 0;
  let idleResources = 0;

  data.forEach((record) => {
    const usage = getRecordUsage(record);
    totalCloudCost += getRecordCost(record);
    if (usage > 0.01) {
      activeResources += 1;
    } else {
      idleResources += 1;
    }
  });

  return {
    totalCloudCost,
    activeResources,
    idleResources,
    costLeaksDetected: alerts.length,
  };
};

export const getMonthlyCost = (data = []) => {
  const map = new Map();
  data.forEach((record) => {
    const month = getMonthKey(getRecordStart(record));
    if (!month) {
      return;
    }
    const current = map.get(month) ?? { month, cost: 0 };
    current.cost += getRecordCost(record);
    map.set(month, current);
  });

  return Array.from(map.values())
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((entry) => ({
      month: entry.month,
      cost: Number(entry.cost.toFixed(2)),
    }));
};

export const getServiceCost = (data = []) => {
  const map = new Map();
  data.forEach((record) => {
    const service = getRecordService(record);
    const current = map.get(service) ?? { service, cost: 0 };
    current.cost += getRecordCost(record);
    map.set(service, current);
  });

  return Array.from(map.values())
    .map((entry) => ({
      service: entry.service,
      cost: Number(entry.cost.toFixed(2)),
    }))
    .sort((a, b) => b.cost - a.cost);
};

// Daily cost + usage aggregation
export const getDailyData = (data = []) => {
  const map = new Map();
  data.forEach((record) => {
    const day = getDateKey(getRecordStart(record));
    if (!day) return;
    const entry = map.get(day) ?? { day, cost: 0, usage: 0 };
    entry.cost  += getRecordCost(record);
    entry.usage += getRecordUsage(record);
    map.set(day, entry);
  });
  return Array.from(map.values())
    .sort((a, b) => a.day.localeCompare(b.day))
    .slice(-30) // last 30 days
    .map((e) => ({ day: e.day, cost: Number(e.cost.toFixed(2)), usage: Number(e.usage.toFixed(2)) }));
};

// Monthly usage aggregation (for monthly cost+usage chart)
export const getMonthlyData = (data = []) => {
  const map = new Map();
  data.forEach((record) => {
    const month = getMonthKey(getRecordStart(record));
    if (!month) return;
    const entry = map.get(month) ?? { month, cost: 0, usage: 0 };
    entry.cost  += getRecordCost(record);
    entry.usage += getRecordUsage(record);
    map.set(month, entry);
  });
  return Array.from(map.values())
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((e) => ({ month: e.month, cost: Number(e.cost.toFixed(2)), usage: Number(e.usage.toFixed(2)) }));
};

// Region cost aggregation (uses region / location / zone field)
export const getRegionCost = (data = []) => {
  const map = new Map();
  data.forEach((record) => {
    const region =
      record.region || record.location || record.zone ||
      record.resourceLocation || record.resource_location || 'Unknown';
    const entry = map.get(region) ?? { region, cost: 0 };
    entry.cost += getRecordCost(record);
    map.set(region, entry);
  });
  return Array.from(map.values())
    .map((e) => ({ region: e.region, cost: Number(e.cost.toFixed(2)) }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 8);
};

const getInsights = (data = []) => {
  const serviceMap = new Map();
  const resourceMap = new Map();
  const dayMap = new Map();

  data.forEach((record) => {
    const service = getRecordService(record);
    const resource = getRecordResource(record);
    const date = getDateKey(getRecordStart(record));
    const cost = getRecordCost(record);
    const usage = getRecordUsage(record);

    serviceMap.set(service, (serviceMap.get(service) ?? 0) + cost);

    const resourceEntry = resourceMap.get(resource) ?? { resource, cost: 0, service };
    resourceEntry.cost += cost;
    resourceMap.set(resource, resourceEntry);

    if (date) {
      const dayEntry = dayMap.get(date) ?? { date, usage: 0, cost: 0 };
      dayEntry.usage += usage;
      dayEntry.cost += cost;
      dayMap.set(date, dayEntry);
    }
  });

  const highestCostService = Array.from(serviceMap.entries())
    .map(([service, cost]) => ({ service, cost: Number(cost.toFixed(2)) }))
    .sort((a, b) => b.cost - a.cost)[0] ?? null;

  const mostExpensiveResource = Array.from(resourceMap.values())
    .map((entry) => ({ ...entry, cost: Number(entry.cost.toFixed(2)) }))
    .sort((a, b) => b.cost - a.cost)[0] ?? null;

  const peakUsageDay = Array.from(dayMap.values())
    .map((entry) => ({ ...entry, usage: Number(entry.usage.toFixed(2)), cost: Number(entry.cost.toFixed(2)) }))
    .sort((a, b) => b.usage - a.usage)[0] ?? null;

  return { highestCostService, mostExpensiveResource, peakUsageDay };
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { records, loading: recordsLoading, error: recordsError } = useUsageRecords();
  const [alerts, setAlerts] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadAlerts = async () => {
      if (mounted) {
        setAlertsLoading(true);
      }

      try {
        const data = await fetchAlerts();
        if (mounted) {
          const normalized = Array.isArray(data) ? data : [];
          const sorted = normalized
            .slice()
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          setAlerts(sorted.slice(0, 5));
        }
      } catch {
        if (mounted) {
          setAlerts([]);
        }
      } finally {
        if (mounted) {
          setAlertsLoading(false);
        }
      }
    };

    const handleAlertsUpdated = () => {
      loadAlerts();
    };

    loadAlerts();
    window.addEventListener(ALERTS_UPDATED_EVENT, handleAlertsUpdated);

    return () => {
      mounted = false;
      window.removeEventListener(ALERTS_UPDATED_EVENT, handleAlertsUpdated);
    };
  }, []);

  const totals = useMemo(() => calculateTotals(records, alerts), [records, alerts]);
  const monthlyCost = useMemo(() => getMonthlyCost(records), [records]);
  const monthlyData = useMemo(() => getMonthlyData(records), [records]);
  const dailyData   = useMemo(() => getDailyData(records), [records]);
  const serviceCost = useMemo(() => getServiceCost(records).slice(0, 5), [records]);
  const regionCost  = useMemo(() => getRegionCost(records), [records]);
  const insights = useMemo(() => getInsights(records), [records]);
  const efficiencyScore = useMemo(() => calculateEfficiencyScore(alerts, monthlyCost), [alerts, monthlyCost]);
  const monthlyImprovement = useMemo(() => getMonthOverMonthImprovement(monthlyCost), [monthlyCost]);

  const summaryCards = useMemo(
    () => [
      {
        label: 'Cloud Efficiency Score',
        value: `${efficiencyScore}%`,
        note: 'Score improves as alerts are resolved and monthly spend stabilizes.',
        trend: monthlyImprovement > 0 ? `MoM improvement ${formatMetric(monthlyImprovement * 100)}%` : 'Resolve alerts to boost efficiency',
        icon: '★',
      },
      {
        label: 'Total Cloud Cost',
        value: formatCurrency(totals.totalCloudCost),
        note: `${monthlyCost.length} billing month(s) tracked`,
        trend: monthlyCost.length > 1 ? `Latest month: ${monthlyCost[monthlyCost.length - 1].month}` : 'Upload more history for monthly trends',
        icon: '$',
      },
      {
        label: 'Active Resources',
        value: formatMetric(totals.activeResources),
        note: 'Resources with billable usage activity',
        trend: records.length ? `${Math.round((totals.activeResources / records.length) * 100)}% of uploaded rows are active` : 'No data available',
        icon: 'A',
      },
      {
        label: 'Idle Resources',
        value: formatMetric(totals.idleResources),
        note: 'Usage equals zero or near-zero',
        trend: totals.idleResources ? 'Review for optimization opportunities' : 'No idle resources detected in current data',
        icon: 'I',
      },
    ],
    [alerts, monthlyCost, records.length, totals],
  );

  const handleViewAlert = (alert) => {
    navigate('/alerts', { state: { selectedAlert: alert } });
  };

  const hasData = records.length > 0;

  return (
    <div className="dashboard-container">
      <style>{pageStyles}</style>

      <div className="dashboard-shell">
        <header className="dashboard-header">
          <section className="dashboard-card dashboard-hero">
            <div className="dashboard-badge">Cloud Analytics Overview</div>
            <h1>Dynamic visibility into your cloud cost, usage, and risk signals.</h1>
            <p>
              The dashboard now reflects uploaded billing CSV data in near real time, turning normalized records into
              executive summaries, cost trends, service breakdowns, and recent operational alerts.
            </p>

            <div className="dashboard-meta">
              <div className="dashboard-meta-item">
                <span>Records Loaded</span>
                <strong>{formatMetric(records.length)}</strong>
              </div>
              <div className="dashboard-meta-item">
                <span>Tracked Services</span>
                <strong>{formatMetric(serviceCost.length || getServiceCost(records).length)}</strong>
              </div>
              <div className="dashboard-meta-item">
                <span>Latest Alert</span>
                <strong>{alerts[0] ? formatDateTime(alerts[0].createdAt) : 'No alerts yet'}</strong>
              </div>
            </div>
          </section>


        </header>

        {recordsLoading ? (
          <section className="dashboard-empty">
            <div className="dashboard-empty-icon">...</div>
            <span>Loading Data</span>
            <h2>Fetching usage records from the backend</h2>
            <p>Your dashboard will populate as soon as the latest MongoDB-backed usage data is loaded.</p>
          </section>
        ) : recordsError ? (
          <section className="dashboard-empty">
            <div className="dashboard-empty-icon">!</div>
            <span>Data Error</span>
            <h2>Usage data could not be loaded</h2>
            <p>{recordsError}</p>
          </section>
        ) : !hasData ? (
          <section className="dashboard-empty">
            <div className="dashboard-empty-icon">CSV</div>
            <span>No Data Available</span>
            <h2>Upload cloud billing data to activate this dashboard</h2>
            <p>The dashboard will automatically populate once records are uploaded through the existing Cloud Usage flow.</p>
          </section>
        ) : (
          <>
            <section className="summary-grid">
              {summaryCards.map((card) => (
                <article key={card.label} className="dashboard-card summary-card">
                  <div className="summary-icon">{card.icon}</div>
                  <div>
                    <span>{card.label}</span>
                    <strong>{card.value}</strong>
                    <div className="summary-note">{card.note}</div>
                    <div className="trend-text">{card.trend}</div>
                  </div>
                </article>
              ))}
            </section>

            <section className="chart-grid">

              {/* ── Chart 1: Daily Cost & Usage ── */}
              <article className="dashboard-card chart-card">
                <div className="chart-head">
                  <div>
                    <span>Daily Trend</span>
                    <h2>Daily cost &amp; usage</h2>
                  </div>
                </div>
                <div className="chart-area">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                      <defs>
                        <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor={CHART_BLUE}  stopOpacity={0.15}/>
                          <stop offset="100%" stopColor={CHART_BLUE}  stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
                      <XAxis dataKey="day" stroke="#94a3b8" tick={{ fontSize: 11 }}
                        tickFormatter={(v) => { const d = new Date(v); return isNaN(d) ? v : d.toLocaleDateString('en-US',{month:'short',day:'numeric'}); }} />
                      <YAxis yAxisId="cost"  stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} width={52} />
                      <YAxis yAxisId="usage" stroke="#94a3b8" tick={{ fontSize: 11 }} orientation="right" width={44} />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        formatter={(val, name) => name === 'Cost' ? [formatCurrency(val), 'Cost'] : [formatMetric(val), 'Usage']}
                        labelFormatter={(v) => { const d = new Date(v); return isNaN(d) ? v : d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); }}
                      />
                      <Line yAxisId="cost"  type="monotone" dataKey="cost"  name="Cost"
                        stroke={CHART_BLUE}  strokeWidth={2.5}
                        dot={{ r: 3, fill: '#fff', stroke: CHART_BLUE,  strokeWidth: 2 }}
                        activeDot={{ r: 5, fill: CHART_AMBER, stroke: CHART_BLUE, strokeWidth: 2 }} />
                      <Line yAxisId="usage" type="monotone" dataKey="usage" name="Usage"
                        stroke={CHART_AMBER} strokeWidth={2} strokeDasharray="5 3"
                        dot={{ r: 3, fill: '#fff', stroke: CHART_AMBER, strokeWidth: 2 }}
                        activeDot={{ r: 5, fill: CHART_BLUE, stroke: CHART_AMBER, strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="chart-legend">
                  <span className="chart-legend-item"><span className="chart-legend-dot" style={{background:CHART_BLUE}} />Cost ($)</span>
                  <span className="chart-legend-item"><span className="chart-legend-dot" style={{background:CHART_AMBER}} />Usage (units)</span>
                </div>
              </article>

              {/* ── Chart 2: Monthly Cost & Usage ── */}
              <article className="dashboard-card chart-card">
                <div className="chart-head">
                  <div>
                    <span>Monthly Trend</span>
                    <h2>Monthly cost &amp; usage</h2>
                  </div>
                </div>
                <div className="chart-area">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                      <defs>
                        <linearGradient id="barBlue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor={CHART_BLUE}  stopOpacity={1}/>
                          <stop offset="100%" stopColor={CHART_NAVY}  stopOpacity={0.8}/>
                        </linearGradient>
                        <linearGradient id="barAmber" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor={CHART_AMBER} stopOpacity={1}/>
                          <stop offset="100%" stopColor="#d97706"      stopOpacity={0.8}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
                      <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 11 }}
                        tickFormatter={(v) => { const [y,m] = v.split('-'); return new Date(+y,+m-1,1).toLocaleDateString('en-US',{month:'short',year:'2-digit'}); }} />
                      <YAxis yAxisId="cost"  stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} width={52} />
                      <YAxis yAxisId="usage" stroke="#94a3b8" tick={{ fontSize: 11 }} orientation="right" width={44} />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        formatter={(val, name) => name === 'Cost' ? [formatCurrency(val), 'Cost'] : [formatMetric(val), 'Usage']}
                        labelFormatter={(v) => { const [y,m] = v.split('-'); return new Date(+y,+m-1,1).toLocaleDateString('en-US',{month:'long',year:'numeric'}); }}
                      />
                      <Bar yAxisId="cost"  dataKey="cost"  name="Cost"  fill="url(#barBlue)"  radius={[4,4,0,0]} maxBarSize={32} />
                      <Bar yAxisId="usage" dataKey="usage" name="Usage" fill="url(#barAmber)" radius={[4,4,0,0]} maxBarSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="chart-legend">
                  <span className="chart-legend-item"><span className="chart-legend-dot" style={{background:CHART_BLUE}} />Cost ($)</span>
                  <span className="chart-legend-item"><span className="chart-legend-dot" style={{background:CHART_AMBER}} />Usage (units)</span>
                </div>
              </article>

              {/* ── Chart 3: Top 5 Services by Cost ── */}
              <article className="dashboard-card chart-card">
                <div className="chart-head">
                  <div>
                    <span>Service Breakdown</span>
                    <h2>Top 5 services by cost</h2>
                  </div>
                </div>
                <div className="chart-area">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={serviceCost} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 0 }}>
                      <defs>
                        <linearGradient id="svcGrad" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%"   stopColor={CHART_BLUE}  stopOpacity={1}/>
                          <stop offset="100%" stopColor={CHART_AMBER} stopOpacity={0.9}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
                      <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                      <YAxis type="category" dataKey="service" width={110} stroke="#94a3b8" tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [formatCurrency(v), 'Cost']} />
                      <Bar dataKey="cost" name="Cost" fill="url(#svcGrad)" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>

              {/* ── Chart 4: Interactive Region Cost View ── */}
              <article className="dashboard-card chart-card">
                <div className="chart-head">
                  <div>
                    <span>Region Analysis</span>
                    <h2>Cost by region</h2>
                  </div>
                </div>
                <div className="chart-area">
                  <ResponsiveContainer width="100%" height="100%">
                    {regionCost.length > 0 ? (
                      <PieChart>
                        <defs>
                          {REGION_COLORS.map((c, i) => (
                            <radialGradient key={i} id={`rg${i}`} cx="50%" cy="50%" r="50%">
                              <stop offset="0%"   stopColor={c} stopOpacity={0.9}/>
                              <stop offset="100%" stopColor={c} stopOpacity={0.65}/>
                            </radialGradient>
                          ))}
                        </defs>
                        <Pie
                          data={regionCost}
                          dataKey="cost"
                          nameKey="region"
                          cx="50%" cy="50%"
                          innerRadius="38%"
                          outerRadius="68%"
                          paddingAngle={3}
                          stroke="none"
                        >
                          {regionCost.map((_, i) => (
                            <Cell key={i} fill={`url(#rg${i % REGION_COLORS.length})`} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, name) => [formatCurrency(v), name]} />
                        <Legend
                          iconType="circle"
                          iconSize={9}
                          formatter={(value) => <span style={{ fontSize: 12, color: '#475569' }}>{value}</span>}
                        />
                      </PieChart>
                    ) : (
                      <BarChart data={[]} margin={{ left: 8 }}>
                        <XAxis stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
                {regionCost.length === 0 && (
                  <p style={{ textAlign:'center', color:'#94a3b8', fontSize:13, marginTop:8 }}>
                    No region field found in uploaded data
                  </p>
                )}
              </article>

            </section>

            <section className="insights-grid">
              <article className="dashboard-card insight-card">
                <span>Highest Cost Service</span>
                <strong>{insights.highestCostService?.service || 'N/A'}</strong>
                <p>{insights.highestCostService ? formatCurrency(insights.highestCostService.cost) : 'No service data available yet.'}</p>
              </article>

              <article className="dashboard-card insight-card">
                <span>Most Expensive Resource</span>
                <strong>{insights.mostExpensiveResource?.resource || 'N/A'}</strong>
                <p>
                  {insights.mostExpensiveResource
                    ? `${formatCurrency(insights.mostExpensiveResource.cost)} in ${insights.mostExpensiveResource.service}`
                    : 'No resource data available yet.'}
                </p>
              </article>

              <article className="dashboard-card insight-card">
                <span>Peak Usage Day</span>
                <strong>{insights.peakUsageDay ? formatDayLabel(insights.peakUsageDay.date) : 'N/A'}</strong>
                <p>
                  {insights.peakUsageDay
                    ? `${formatMetric(insights.peakUsageDay.usage)} usage units and ${formatCurrency(insights.peakUsageDay.cost)} cost`
                    : 'No daily usage data available yet.'}
                </p>
              </article>
            </section>

            <article className="dashboard-card alerts-section">
                <div className="alerts-head">
                  <div>
                    <span>Recent Alerts</span>
                    <h2>Latest 5 alert events</h2>
                  </div>
                  <button className="btn-view-all" onClick={() => navigate('/alerts')}>View all →</button>
                </div>

                {alertsLoading ? (
                  <div className="alerts-empty">
                    <p>Loading alerts...</p>
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="alerts-empty">
                    <p>No recent alerts available.</p>
                  </div>
                ) : (
                  <div className="alerts-list">
                    {alerts.map((alert, index) => (
                      <div key={alert._id || alert.alertKey || index} className={`alert-item ${alert.severity || 'info'}`}>
                        <div className="alert-dot"></div>

                        <div className="alert-main">
                          <div className="alert-row">
                            <h4>{alert.title || 'Alert'}</h4>
                            <div className={`alert-severity ${alert.severity || 'info'}`}>{alert.severity || 'info'}</div>
                          </div>
                          <p className="alert-resource">{alert.resource || 'Unknown resource'}</p>
                          <div className="alert-time">{formatDateTime(alert.createdAt)}</div>
                        </div>

                        <div className="alert-actions">
                          <button className="btn-small" onClick={() => handleViewAlert(alert)}>
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>
          </>
        )}
      </div>
    </div>
  );
}
