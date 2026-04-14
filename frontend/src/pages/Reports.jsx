import { useMemo, useState } from 'react';
import { useUsageRecords } from '../hooks/useUsageRecords';
import './Reports.css';
import html2pdf from 'html2pdf.js';
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

const CHART_BLUE = '#2563eb';
const CHART_AMBER = '#f59e0b';
const CHART_COLORS = ['#2563eb', '#f59e0b', '#38bdf8', '#60a5fa', '#fbbf24', '#1d4ed8'];

const pageStyles = `
:root{--primary-blue:#2563eb;--primary-blue-deep:#1d4ed8;--accent-yellow:#f59e0b;--accent-yellow-soft:#fbbf24;--success-green:#16a34a;--danger-red:#dc2626;--text-strong:#0f172a;--text-muted:#64748b;--surface-card:rgba(255,255,255,.9)}
.reports-container{min-height:100vh;padding:36px 20px 56px;background:
    radial-gradient(circle at 20% 18%, rgba(255, 255, 255, 0.18), transparent 24%),
    radial-gradient(circle at 78% 22%, rgba(255, 255, 255, 0.14), transparent 20%),
    linear-gradient(180deg, #0f3b8f 0%, #1666c5 48%, #64bbff 100%);}
.reports-shell{max-width:1280px;margin:0 auto}
.reports-card,.reports-empty{background:var(--surface-card);border:1px solid rgba(148,163,184,.16);border-radius:16px;box-shadow:0 18px 40px rgba(15,23,42,.08)}
.reports-hero{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(280px,.95fr);gap:18px;margin-bottom:22px}
.reports-hero-main,.reports-hero-side,.reports-panel,.reports-stat,.reports-insight,.reports-table-card{padding:22px}
.reports-eyebrow,.reports-pill{display:inline-flex;align-items:center;padding:8px 12px;border-radius:999px;background:linear-gradient(135deg,rgba(37,99,235,.08),rgba(245,158,11,.14));color:var(--primary-blue-deep);font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;border:1px solid rgba(245,158,11,.16)}
.reports-hero-main h1{margin:16px 0 10px;font-size:clamp(2rem,3vw,3rem);line-height:1.05;color:var(--text-strong)}
.reports-hero-main p,.reports-panel p,.reports-table-card p,.reports-empty p{margin:0;color:var(--text-muted);line-height:1.6}
.reports-hero-meta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:22px}
.reports-meta{padding:14px;border-radius:14px;background:linear-gradient(180deg,#ffffff,#f8fbff);border:1px solid rgba(226,232,240,.95)}
.reports-label,.reports-panel span,.reports-table-card span,.reports-stat span,.reports-insight span,.reports-meta span,.reports-table th{display:block;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted)}
.reports-meta strong,.reports-stat strong,.reports-insight strong{display:block;margin-top:8px;color:var(--text-strong)}
.reports-hero-side{display:flex;flex-direction:column;justify-content:space-between;gap:18px}
.reports-hero-side h2,.reports-panel h2,.reports-table-card h2{margin:0;color:var(--text-strong);font-size:1.05rem;position:relative;padding-bottom:10px}
.reports-hero-side h2::after,.reports-panel h2::after,.reports-table-card h2::after{content:'';position:absolute;left:0;bottom:0;width:42px;height:3px;border-radius:999px;background:linear-gradient(90deg,var(--primary-blue),var(--accent-yellow))}
.reports-actions{display:grid;gap:12px}
.reports-btn{border:none;border-radius:14px;padding:13px 16px;font-size:14px;font-weight:700;cursor:pointer}
.reports-btn.primary{background:linear-gradient(135deg,var(--primary-blue),#38bdf8);color:#fff;box-shadow:0 14px 24px rgba(15,98,254,.22)}
.reports-btn.primary:hover{box-shadow:0 14px 24px rgba(15,98,254,.22),0 0 0 3px rgba(245,158,11,.18)}
.reports-btn.secondary{background:linear-gradient(135deg,#fff7dd,#fde68a);color:#92400e;border:1px solid rgba(245,158,11,.28)}
.reports-btn.secondary:hover{box-shadow:0 0 0 3px rgba(245,158,11,.16)}
.reports-toolbar{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:22px}
.reports-simulation{display:grid;gap:16px;margin-bottom:22px}
.reports-simulation-summary{display:flex;flex-wrap:wrap;gap:12px;align-items:center}
.reports-simulation-summary span{display:inline-flex;padding:10px 14px;border-radius:12px;background:linear-gradient(135deg,#eff6ff,#fef3c7);color:#0f3f82;font-size:13px;font-weight:700}
.reports-simulation-label{font-size:14px;color:#334155;line-height:1.4}
.reports-pill-row{display:flex;gap:10px;flex-wrap:wrap}
.reports-segmented{display:inline-flex;padding:4px;border-radius:999px;background:linear-gradient(180deg,#eff6ff,#e2e8f0);border:1px solid rgba(245,158,11,.14)}
.reports-segmented button{border:none;background:transparent;color:#0f3f82;font-weight:700;padding:9px 16px;border-radius:999px;cursor:pointer}
.reports-segmented .active{background:linear-gradient(135deg,var(--primary-blue),var(--accent-yellow));color:#fff}
.reports-stats,.reports-insights,.reports-charts{display:grid;gap:18px}
.reports-stats{grid-template-columns:repeat(4,minmax(0,1fr));margin-bottom:22px}
.reports-stat{transition:transform .18s ease,box-shadow .18s ease}
.reports-stat:hover{transform:translateY(-2px);box-shadow:0 22px 44px rgba(15,23,42,.11)}
.reports-stat strong{font-size:clamp(1.35rem,2vw,2rem)}
.reports-stat:first-child strong,.reports-insight strong,.reports-table td:last-child{color:var(--accent-yellow)}
.reports-note{margin-top:10px;color:var(--primary-blue-deep);font-size:13px;font-weight:600}
.reports-charts{grid-template-columns:repeat(2,minmax(0,1fr));margin-bottom:22px}
.reports-panel-head,.reports-table-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:16px}
.reports-panel-chart{height:320px}
.reports-insights{grid-template-columns:repeat(3,minmax(0,1fr));margin-bottom:22px}
.reports-insight{}
.reports-insight-text{margin-top:8px;color:#475569;line-height:1.5}
.reports-bottom{display:grid;grid-template-columns:1fr;gap:18px}
.reports-table-full{width:100%}
.reports-table-badge{display:inline-flex;align-items:center;padding:6px 14px;border-radius:999px;background:linear-gradient(135deg,#dbeafe,#fde68a);color:#1d4ed8;font-size:13px;font-weight:700;white-space:nowrap}
.rcr-grid{display:flex;flex-direction:column;width:100%;font-family:"Inter",system-ui,sans-serif}
.rcr-header,.rcr-row{display:grid;grid-template-columns:0.5fr 2fr 1fr 1fr 1fr 1fr 1.5fr;align-items:center}
.rcr-header{background:#f8fafc;border-radius:10px 10px 0 0;border-bottom:2px solid #e2e8f0;padding:10px 16px}
.rcr-header span{font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#64748b;white-space:nowrap}
.rcr-row{padding:13px 16px;border-bottom:1px solid #f1f5f9;transition:background .12s ease}
.rcr-row:last-child{border-bottom:none}
.rcr-row:hover{background:#f1f5f9}
.rcr-index{font-size:13px;font-weight:600;color:#94a3b8}
.rcr-resource{font-size:14px;font-weight:600;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:8px}
.rcr-service-tag{display:inline-block;padding:3px 10px;border-radius:999px;background:#eff6ff;color:#1d4ed8;font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.rcr-region{font-size:13px;color:#64748b}
.rcr-usage{font-size:13px;color:#475569}
.rcr-cost{font-size:14px;font-weight:700;color:#0f172a}
.rcr-share{display:flex;align-items:center;gap:8px}
.rcr-bar-track{flex:1;height:6px;border-radius:999px;background:#e2e8f0;overflow:hidden;min-width:40px}
.rcr-bar-fill{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#2563eb,#f59e0b);transition:width .35s ease}
.rcr-pct{font-size:12px;font-weight:600;color:#64748b;white-space:nowrap;min-width:30px}
.reports-empty{padding:42px 24px;text-align:center}
.reports-empty h2{margin:0 0 10px;color:var(--text-strong)}
.reports-empty-icon{width:72px;height:72px;margin:0 auto 18px;border-radius:24px;display:grid;place-items:center;background:linear-gradient(135deg,#dbeafe,#fde68a);color:var(--primary-blue-deep);font-weight:900;letter-spacing:.08em}
@media (max-width:1100px){.reports-hero,.reports-charts,.reports-bottom{grid-template-columns:1fr}.reports-stats,.reports-insights{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:768px){.reports-container{padding:20px 12px 36px}.reports-card,.reports-empty{border-radius:14px}.reports-hero-meta,.reports-stats,.reports-insights{grid-template-columns:1fr}.reports-toolbar,.reports-panel-head,.reports-table-head{flex-direction:column;align-items:stretch}.reports-segmented{width:100%}.reports-segmented button{flex:1}.reports-panel-chart{height:280px}}
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

const formatCompact = (value = 0) =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(value) || 0);

const formatDateLabel = (value, options = { month: 'short', day: 'numeric' }) => {
  if (!value) {
    return 'Unknown';
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('en-US', options);
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getRecordCost = (record = {}) => toNumber(record.cost);
const getRecordUsage = (record = {}) => toNumber(record.usageAmount ?? record.usage_amount ?? record.usage);
const getRecordService = (record = {}) => record.serviceName || record.service_name || record.service || 'Unknown Service';
const getRecordResource = (record = {}) => record.resourceName || record.resource_name || record.resource || 'Unknown Resource';
const getRecordRegion = (record = {}) => record.region || 'Unknown Region';
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

export const getDailyUsage = (data = []) => {
  const map = new Map();
  data.forEach((record) => {
    const date = getDateKey(getRecordStart(record));
    if (!date) {
      return;
    }
    const current = map.get(date) ?? { date, cost: 0, usage: 0 };
    current.cost += getRecordCost(record);
    current.usage += getRecordUsage(record);
    map.set(date, current);
  });
  return Array.from(map.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => ({
      ...entry,
      cost: Number(entry.cost.toFixed(2)),
      usage: Number(entry.usage.toFixed(2)),
      label: formatDateLabel(entry.date),
    }));
};

export const getMonthlyUsage = (data = []) => {
  const map = new Map();
  data.forEach((record) => {
    const month = getMonthKey(getRecordStart(record));
    if (!month) {
      return;
    }
    const current = map.get(month) ?? { month, cost: 0, usage: 0 };
    current.cost += getRecordCost(record);
    current.usage += getRecordUsage(record);
    map.set(month, current);
  });
  return Array.from(map.values())
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((entry) => ({
      ...entry,
      cost: Number(entry.cost.toFixed(2)),
      usage: Number(entry.usage.toFixed(2)),
    }));
};

export const getServiceUsage = (data = []) => {
  const map = new Map();
  data.forEach((record) => {
    const service = getRecordService(record);
    const current = map.get(service) ?? { service, cost: 0, usage: 0, resources: new Set() };
    current.cost += getRecordCost(record);
    current.usage += getRecordUsage(record);
    current.resources.add(getRecordResource(record));
    map.set(service, current);
  });
  return Array.from(map.values())
    .map((entry) => ({
      service: entry.service,
      cost: Number(entry.cost.toFixed(2)),
      usage: Number(entry.usage.toFixed(2)),
      resourceCount: entry.resources.size,
    }))
    .sort((a, b) => b.cost - a.cost);
};

const getSimulationData = (serviceUsage = [], scenario = 'none') => {
  return serviceUsage.map((entry) => {
    const current = entry.cost;
    let projected = current;

    // S3 → Glacier: reduce S3/storage costs by 60%
    if (scenario === 's3-glacier' && /s3|storage|bucket/i.test(entry.service)) {
      projected = current * 0.40;
    }

    // Weekend Dev Shutdown: reduce EC2/RDS costs by 28% (2 of 7 days off)
    if (scenario === 'weekend-dev-servers' && /ec2|rds|compute|instance|database/i.test(entry.service)) {
      projected = current * 0.72;
    }

    return {
      service: entry.service,
      current: Number(current.toFixed(2)),
      projected: Number(Math.max(projected, 0).toFixed(2)),
    };
  });
};

const getTopResources = (data = []) => {
  const map = new Map();
  data.forEach((record) => {
    const resource = getRecordResource(record);
    const current = map.get(resource) ?? {
      resource,
      service: getRecordService(record),
      region: getRecordRegion(record),
      cost: 0,
      usage: 0,
    };
    current.cost += getRecordCost(record);
    current.usage += getRecordUsage(record);
    map.set(resource, current);
  });
  return Array.from(map.values())
    .map((entry) => ({
      ...entry,
      cost: Number(entry.cost.toFixed(2)),
      usage: Number(entry.usage.toFixed(2)),
    }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 5);
};

const getInsights = (records = [], dailyUsage = [], serviceUsage = []) => {
  const resourceMap = new Map();
  records.forEach((record) => {
    const resource = getRecordResource(record);
    const current = resourceMap.get(resource) ?? {
      resource,
      usage: 0,
      service: getRecordService(record),
    };
    current.usage += getRecordUsage(record);
    resourceMap.set(resource, current);
  });

  return {
    highestCostService: serviceUsage[0] ?? null,
    highestCostDay: [...dailyUsage].sort((a, b) => b.cost - a.cost)[0] ?? null,
    mostUsedResource: Array.from(resourceMap.values()).sort((a, b) => b.usage - a.usage)[0] ?? null,
  };
};

export default function Reports() {
  const { records, loading, error } = useUsageRecords();
  const [serviceMetric, setServiceMetric] = useState('cost');
  const [simulationScenario, setSimulationScenario] = useState('none');

  const dailyUsage = useMemo(() => getDailyUsage(records), [records]);
  const monthlyUsage = useMemo(() => getMonthlyUsage(records), [records]);
  const serviceUsage = useMemo(() => getServiceUsage(records), [records]);
  const simulationData = useMemo(
    () => getSimulationData(serviceUsage, simulationScenario),
    [serviceUsage, simulationScenario],
  );
  const topResources = useMemo(() => getTopResources(records), [records]);
  const insights = useMemo(() => getInsights(records, dailyUsage, serviceUsage), [records, dailyUsage, serviceUsage]);

  const summary = useMemo(() => {
    const services = new Set();
    const resources = new Set();
    let totalCost = 0;
    let totalUsage = 0;

    records.forEach((record) => {
      services.add(getRecordService(record));
      resources.add(getRecordResource(record));
      totalCost += getRecordCost(record);
      totalUsage += getRecordUsage(record);
    });

    return {
      totalCost,
      totalUsage,
      totalResources: resources.size,
      totalServices: services.size,
    };
  }, [records]);

  const serviceChartData = useMemo(
    () =>
      serviceUsage.slice(0, 6).map((entry) => ({
        ...entry,
        value: serviceMetric === 'cost' ? entry.cost : entry.usage,
      })),
    [serviceMetric, serviceUsage],
  );

  const simulationTotal = useMemo(() => {
    const current = simulationData.reduce((sum, item) => sum + item.current, 0);
    const projected = simulationData.reduce((sum, item) => sum + item.projected, 0);
    return {
      current: Number(current.toFixed(2)),
      projected: Number(projected.toFixed(2)),
      savings: Number((current - projected).toFixed(2)),
    };
  }, [simulationData]);

  const handleDownloadPDF = () => {
    const element = document.querySelector('.reports-shell');
    const options = {
      margin: 0.5,
      filename: `cloud-analytics-report-${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
    };
    html2pdf().set(options).from(element).save();
  };

  const handleDownloadCSV = () => {
    const rows = [
      ['Cloud Analytics Report'],
      ['Generated Date', new Date().toLocaleDateString()],
      ['Records Processed', records.length],
      [],
      ['Summary'],
      ['Total Cost', summary.totalCost.toFixed(2)],
      ['Total Usage', summary.totalUsage.toFixed(2)],
      ['Total Resources', summary.totalResources],
      ['Total Services', summary.totalServices],
      [],
      ['Daily Usage'],
      ['Date', 'Cost', 'Usage'],
      ...dailyUsage.map((entry) => [entry.date, entry.cost, entry.usage]),
      [],
      ['Monthly Usage'],
      ['Month', 'Cost', 'Usage'],
      ...monthlyUsage.map((entry) => [entry.month, entry.cost, entry.usage]),
      [],
      ['Service Usage'],
      ['Service', 'Cost', 'Usage', 'Resources'],
      ...serviceUsage.map((entry) => [entry.service, entry.cost, entry.usage, entry.resourceCount]),
    ];

    const csv = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cloud-analytics-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const isEmpty = records.length === 0;

  return (
    <div className="reports-container">
      <style>{pageStyles}</style>

      <div className="reports-shell">
        <section className="reports-hero">
          <div className="reports-card reports-hero-main">
            <div className="reports-eyebrow">Cloud FinOps Reports</div>
            <h1>Professional cloud analytics built from your uploaded billing CSV.</h1>
            <p>
              This page now converts raw billing rows into daily trends, monthly spend rollups, service-level analysis,
              top costly resources, and quick insights in a modern SaaS report layout.
            </p>

            <div className="reports-hero-meta">
              <div className="reports-meta">
                <span>Data Source</span>
                <strong>{isEmpty ? 'Waiting for upload' : 'Uploaded billing records'}</strong>
              </div>
              <div className="reports-meta">
                <span>Latest Day</span>
                <strong>{dailyUsage.length ? formatDateLabel(dailyUsage[dailyUsage.length - 1].date) : 'No data yet'}</strong>
              </div>
              <div className="reports-meta">
                <span>Coverage</span>
                <strong>{monthlyUsage.length ? `${monthlyUsage.length} month(s)` : 'No coverage yet'}</strong>
              </div>
            </div>
          </div>

          <aside className="reports-card reports-hero-side">
            <div>
              <h2>Export and monitor</h2>
              <p>Reports uses the same uploaded dataset stored by Cloud Usage, so your analytics stay in sync automatically.</p>
            </div>

            <div className="reports-actions">
              <button className="reports-btn primary" type="button" onClick={handleDownloadCSV}>
                Download Analytics CSV
              </button>
              <button className="reports-btn secondary" type="button" onClick={handleDownloadPDF}>
                Export PDF
              </button>
            </div>
          </aside>
        </section>

        {loading ? (
          <section className="reports-empty">
            <div className="reports-empty-icon">...</div>
            <h2>Loading billing records</h2>
            <p>Reports is fetching usage data from the backend.</p>
          </section>
        ) : error ? (
          <section className="reports-empty">
            <div className="reports-empty-icon">!</div>
            <h2>Usage data could not be loaded</h2>
            <p>{error}</p>
          </section>
        ) : isEmpty ? (
          <section className="reports-empty">
            <div className="reports-empty-icon">CSV</div>
            <h2>No billing records available yet</h2>
            <p>Upload a cloud billing CSV from the Cloud Usage page and this reports dashboard will populate automatically.</p>
          </section>
        ) : (
          <>
            {/* ── Toolbar ── */}
            <section className="reports-toolbar">
              <div className="rpt-toolbar-left">
                <div className="rpt-stat-pill">
                  <span className="rpt-stat-pill-val">{formatMetric(records.length)}</span>
                  <span className="rpt-stat-pill-lbl">Rows</span>
                </div>
                <div className="rpt-stat-pill">
                  <span className="rpt-stat-pill-val">{dailyUsage.length}</span>
                  <span className="rpt-stat-pill-lbl">Daily pts</span>
                </div>
                <div className="rpt-stat-pill">
                  <span className="rpt-stat-pill-val">{monthlyUsage.length}</span>
                  <span className="rpt-stat-pill-lbl">Months</span>
                </div>
              </div>

              <div className="rpt-tabs" role="tablist" aria-label="Service metric">
                {[
                  { key: 'cost',  label: 'Cost View' },
                  { key: 'usage', label: 'Usage View' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    role="tab"
                    type="button"
                    aria-selected={serviceMetric === tab.key}
                    className={`rpt-tab${serviceMetric === tab.key ? ' rpt-tab--active' : ''}`}
                    onClick={() => setServiceMetric(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </section>

            {/* ── What-If Simulation ── */}
            <section className="rpt-sim-card reports-card">

              {/* header */}
              <div className="rpt-sim-header">
                <div>
                  <p className="rpt-sim-eyebrow">What-If Simulations</p>
                  <h2 className="rpt-sim-title">Projected vs Current cost planning</h2>
                  <p className="rpt-sim-desc">
                    Select a scenario to model how infrastructure policy changes reduce your monthly bill.
                  </p>
                </div>
              </div>

              {/* scenario tabs */}
              <div className="rpt-sim-tabs" role="tablist" aria-label="Simulation scenario">
                {[
                  {
                    key: 'none',
                    label: 'Current (Actual)',
                    icon: '📊',
                    desc: 'No changes applied — baseline spend.',
                  },
                  {
                    key: 's3-glacier',
                    label: 'S3 → Glacier Transition',
                    icon: '🧊',
                    desc: 'Move infrequently accessed S3 data to Glacier. Reduces S3 costs by 60%.',
                  },
                  {
                    key: 'weekend-dev-servers',
                    label: 'Weekend Dev Shutdown',
                    icon: '🌙',
                    desc: 'Shut down EC2 & RDS dev instances on weekends (2/7 days). Saves 28%.',
                  },
                ].map((s) => (
                  <button
                    key={s.key}
                    role="tab"
                    type="button"
                    aria-selected={simulationScenario === s.key}
                    className={`rpt-sim-tab${simulationScenario === s.key ? ' rpt-sim-tab--active' : ''}`}
                    onClick={() => setSimulationScenario(s.key)}
                  >
                    <span className="rpt-sim-tab-icon">{s.icon}</span>
                    <span className="rpt-sim-tab-label">{s.label}</span>
                    <span className="rpt-sim-tab-desc">{s.desc}</span>
                  </button>
                ))}
              </div>

              {/* impact summary + chart */}
              <div className="rpt-sim-body">

                {/* Impact Summary card */}
                <div className={`rpt-sim-impact${simulationScenario !== 'none' && simulationTotal.savings > 0 ? ' rpt-sim-impact--saving' : ''}`}>
                  <p className="rpt-sim-impact-label">
                    {simulationScenario === 'none' ? 'Current Monthly Bill' : 'Potential Savings'}
                  </p>

                  <p className="rpt-sim-impact-value">
                    {simulationScenario === 'none'
                      ? formatCurrency(simulationTotal.current)
                      : formatCurrency(simulationTotal.savings)}
                  </p>

                  {simulationScenario !== 'none' && (
                    <p className="rpt-sim-impact-compare">
                      Projected monthly bill:{' '}
                      <strong>{formatCurrency(simulationTotal.projected)}</strong>
                      {' '}
                      <span className="rpt-sim-impact-vs">
                        vs {formatCurrency(simulationTotal.current)} current
                      </span>
                    </p>
                  )}

                  {simulationScenario !== 'none' && simulationTotal.savings > 0 && (
                    <p className="rpt-sim-impact-pct">
                      ↓ {((simulationTotal.savings / simulationTotal.current) * 100).toFixed(1)}% reduction
                    </p>
                  )}

                  {simulationScenario !== 'none' && simulationTotal.savings === 0 && (
                    <p className="rpt-sim-impact-none">
                      No matching services found in your data for this scenario.
                    </p>
                  )}
                </div>

                {/* Bar chart */}
                <div className="rpt-sim-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={simulationData.slice(0, 6)}
                      margin={{ top: 8, right: 16, left: 0, bottom: 32 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="service"
                        stroke="#94a3b8"
                        tick={{ fontSize: 11 }}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} width={58} />
                      <Tooltip
                        formatter={(v) => [formatCurrency(v)]}
                        contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13 }}
                      />
                      <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="current"   name="Current Cost"   fill={CHART_BLUE}  radius={[4,4,0,0]} maxBarSize={36} />
                      <Bar dataKey="projected" name="Projected Cost" fill={CHART_AMBER} radius={[4,4,0,0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

              </div>
            </section>

            <section className="reports-stats">
              <article className="reports-card reports-stat">
                <span>Total Cost</span>
                <strong>{formatCurrency(summary.totalCost)}</strong>
                <div className="reports-note">Complete spend across uploaded billing rows</div>
              </article>
              <article className="reports-card reports-stat">
                <span>Total Usage</span>
                <strong>{formatCompact(summary.totalUsage)}</strong>
                <div className="reports-note">Aggregated usage units from the report</div>
              </article>
              <article className="reports-card reports-stat">
                <span>Total Resources</span>
                <strong>{formatMetric(summary.totalResources)}</strong>
                <div className="reports-note">Unique resource names identified</div>
              </article>
              <article className="reports-card reports-stat">
                <span>Total Services</span>
                <strong>{formatMetric(summary.totalServices)}</strong>
                <div className="reports-note">Distinct cloud services in the upload</div>
              </article>
            </section>

            <section className="reports-charts">
              <article className="reports-card reports-panel">
                <div className="reports-panel-head">
                  <div>
                    <span>Daily Usage Report</span>
                    <h2>Cost and usage trend by day</h2>
                    <p>Grouped directly from each record&apos;s usage start date.</p>
                  </div>
                </div>
                <div className="reports-panel-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyUsage}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
                      <XAxis dataKey="label" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip
                        formatter={(value, name) => (name === 'cost' ? formatCurrency(value) : formatMetric(value))}
                        labelFormatter={(label, payload) => payload?.[0]?.payload?.date || label}
                        contentStyle={{ borderRadius: 14, borderColor: '#f59e0b' }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="cost"
                        name="Daily Cost"
                        stroke={CHART_BLUE}
                        strokeWidth={3}
                        dot={{ r: 3, fill: CHART_AMBER, stroke: CHART_BLUE, strokeWidth: 1.5 }}
                      />
                      <Line type="monotone" dataKey="usage" name="Daily Usage" stroke={CHART_AMBER} strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="reports-card reports-panel">
                <div className="reports-panel-head">
                  <div>
                    <span>Monthly Report</span>
                    <h2>Total cost by month</h2>
                    <p>Month-level rollup formatted as `YYYY-MM` for budget tracking.</p>
                  </div>
                </div>
                <div className="reports-panel-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyUsage}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
                      <XAxis dataKey="month" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: 14, borderColor: '#f59e0b' }} />
                      <Bar dataKey="cost" name="Monthly Cost" radius={[10, 10, 0, 0]} fill={CHART_AMBER} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="reports-card reports-panel">
                <div className="reports-panel-head">
                  <div>
                    <span>Service-Wise Analysis</span>
                    <h2>{serviceMetric === 'cost' ? 'Top services by cost' : 'Top services by usage'}</h2>
                    <p>See which services dominate your billing footprint.</p>
                  </div>
                </div>
                <div className="reports-panel-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={serviceChartData}
                        dataKey="value"
                        nameKey="service"
                        cx="50%"
                        cy="50%"
                        outerRadius={105}
                        innerRadius={52}
                        paddingAngle={3}
                        label={({ service, percent }) => `${service} ${(percent * 100).toFixed(0)}%`}
                      >
                        {serviceChartData.map((entry, index) => (
                          <Cell key={entry.service} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => (serviceMetric === 'cost' ? formatCurrency(value) : formatMetric(value))}
                        contentStyle={{ borderRadius: 14, borderColor: '#f59e0b' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="reports-card reports-panel">
                <div className="reports-panel-head">
                  <div>
                    <span>Service Benchmark</span>
                    <h2>{serviceMetric === 'cost' ? 'Service cost leaderboard' : 'Service usage leaderboard'}</h2>
                    <p>Quick comparison across the highest-impact services.</p>
                  </div>
                </div>
                <div className="reports-panel-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={serviceChartData} layout="vertical" margin={{ left: 28 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
                      <XAxis type="number" stroke="#64748b" />
                      <YAxis type="category" dataKey="service" width={130} stroke="#64748b" />
                      <Tooltip
                        formatter={(value) => (serviceMetric === 'cost' ? formatCurrency(value) : formatMetric(value))}
                        contentStyle={{ borderRadius: 14, borderColor: '#f59e0b' }}
                      />
                      <Bar dataKey="value" name={serviceMetric === 'cost' ? 'Service Cost' : 'Service Usage'} radius={[0, 10, 10, 0]} fill={serviceMetric === 'cost' ? CHART_BLUE : CHART_AMBER} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>

            </section>

            <section className="reports-insights">
              <article className="reports-card reports-insight">
                <span>Highest Cost Service</span>
                <strong>{insights.highestCostService?.service || 'N/A'}</strong>
                <div className="reports-insight-text">
                  {insights.highestCostService
                    ? `${formatCurrency(insights.highestCostService.cost)} total across ${insights.highestCostService.resourceCount} resource(s).`
                    : 'Upload data to generate service insights.'}
                </div>
              </article>
              <article className="reports-card reports-insight">
                <span>Highest Cost Day</span>
                <strong>{insights.highestCostDay ? formatDateLabel(insights.highestCostDay.date) : 'N/A'}</strong>
                <div className="reports-insight-text">
                  {insights.highestCostDay
                    ? `${formatCurrency(insights.highestCostDay.cost)} spend with ${formatMetric(insights.highestCostDay.usage)} usage units.`
                    : 'Upload data to reveal daily peaks.'}
                </div>
              </article>
              <article className="reports-card reports-insight">
                <span>Most Used Resource</span>
                <strong>{insights.mostUsedResource?.resource || 'N/A'}</strong>
                <div className="reports-insight-text">
                  {insights.mostUsedResource
                    ? `${formatMetric(insights.mostUsedResource.usage)} usage units in ${insights.mostUsedResource.service}.`
                    : 'Upload data to reveal resource hotspots.'}
                </div>
              </article>
            </section>

                        <section className="reports-bottom">
              <article className="reports-card reports-table-card reports-table-full">
                <div className="reports-table-head">
                  <div>
                    <span>Top Costly Resources</span>
                    <h2>Top 5 resources by spend</h2>
                  </div>
                  <div className="reports-table-badge">
                    {formatCurrency(topResources.reduce((s, r) => s + r.cost, 0))} total
                  </div>
                </div>
                <div className="rcr-grid">
                  {/* Header row */}
                  <div className="rcr-header">
                    <span>#</span>
                    <span>Resource</span>
                    <span>Service</span>
                    <span>Region</span>
                    <span>Usage</span>
                    <span>Cost</span>
                    <span>Share</span>
                  </div>
                  {/* Data rows */}
                  {topResources.map((resource, index) => {
                    const totalCost = topResources.reduce((s, r) => s + r.cost, 0);
                    const share = totalCost > 0 ? (resource.cost / totalCost) * 100 : 0;
                    return (
                      <div className="rcr-row" key={`${resource.resource}-${resource.service}`}>
                        <span className="rcr-index">{index + 1}</span>
                        <span className="rcr-resource">{resource.resource}</span>
                        <span className="rcr-service-tag">{resource.service}</span>
                        <span className="rcr-region">{resource.region}</span>
                        <span className="rcr-usage">{formatMetric(resource.usage)}</span>
                        <span className="rcr-cost">{formatCurrency(resource.cost)}</span>
                        <span className="rcr-share">
                          <span className="rcr-bar-track">
                            <span className="rcr-bar-fill" style={{width:`${Math.min(share,100).toFixed(1)}%`}} />
                          </span>
                          <span className="rcr-pct">{share.toFixed(0)}%</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </article>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
