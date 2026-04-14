import { useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell,
  Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { processBillingCsv } from '../utils/dataProcessor';
import { uploadUsageRecords } from '../utils/api';
import { dispatchAlertsUpdated, dispatchUsageUpdated } from '../utils/cloudEvents';
import './CloudUsage.css';

// ─── Theme constants ──────────────────────────────────────────────────────────
const BLUE        = '#2563eb';
const AMBER       = '#f59e0b';
const NAVY        = '#1e3a8a';
const REGION_COLORS = ['#2563eb','#f59e0b','#1d4ed8','#fbbf24','#3b82f6','#d97706'];
const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: '1px solid #fde68a',
  boxShadow: '0 4px 16px rgba(37,99,235,.12)',
  fontSize: 13,
};

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);

const formatMetric = (value = 0) =>
  new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(value);

export default function CloudUsage() {
  const [analytics, setAnalytics] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('');

  const handleFileUpload = async (file) => {
    if (!file) {
      return;
    }

    setIsUploading(true);
    setMessage('');
    setError('');
    setFileName(file.name);

    try {
      const csvText = await file.text();
      const processedAnalytics = processBillingCsv(csvText);

      if (processedAnalytics.records.length === 0) {
        setAnalytics(null);
        setError('No valid billing rows were found. Check the CSV headers and date columns.');
        return;
      }

      setAnalytics(processedAnalytics);

      const records = processedAnalytics.records.map((record) => ({
        date: record.usageDate,
        usageDate: record.usageDate,
        usageStartTime: record.usageStartTime,
        usageEndTime: record.usageEndTime,
        service: record.serviceName,
        serviceName: record.serviceName,
        cost: record.cost,
        usage: record.usageAmount,
        usageAmount: record.usageAmount,
        resource: record.resourceName,
        resourceName: record.resourceName,
        region: record.region,
        provider: record.provider,
      }));

      try {
        await uploadUsageRecords(records);
        dispatchUsageUpdated(records);
        dispatchAlertsUpdated();
        setMessage(
          `Processed ${processedAnalytics.metadata.validRows} valid rows from ${file.name}. Usage data and alerts were synced successfully.`,
        );
      } catch (uploadError) {
        setError(uploadError.message || 'Usage upload failed. Please try again.');
      }
    } catch {
      setAnalytics(null);
      setError('The CSV could not be processed. Please upload a valid billing export.');
    } finally {
      setIsUploading(false);
    }
  };

  const stats = analytics
    ? [
        {
          label: 'Valid Rows',
          value: formatMetric(analytics.metadata.validRows),
        },
        {
          label: 'Invalid Rows',
          value: formatMetric(analytics.metadata.invalidRows),
        },
        {
          label: 'Anomalies',
          value: formatMetric(analytics.anomalies.length),
        },
        {
          label: 'Top Daily Cost',
          value: formatCurrency(
            Math.max(...analytics.dailyUsage.map((entry) => entry.totalCost), 0),
          ),
        },
      ]
    : [];

  const previewRecords = analytics?.records.slice(0, 8) ?? [];

  const regionData = useMemo(() => {
    if (!analytics) {
      return [];
    }

    const map = new Map();

    analytics.records.forEach((record) => {
      const region = record.region || 'Unknown Region';
      const current = map.get(region) ?? { name: region, cost: 0, resources: new Map(), serviceCount: 0 };
      current.cost += record.cost;
      current.serviceCount += 1;
      current.resources.set(record.resourceName || record.resource || 'Unknown', true);
      map.set(region, current);
    });

    return Array.from(map.values())
      .map((entry) => ({
        name: entry.name,
        cost: Number(entry.cost.toFixed(2)),
        count: entry.serviceCount,
        resources: Array.from(entry.resources.keys()).slice(0, 6),
      }))
      .sort((a, b) => b.cost - a.cost);
  }, [analytics]);

  const activeRegion = useMemo(() => {
    if (!regionData.length) {
      return null;
    }

    return regionData.find((region) => region.name === selectedRegion) ?? regionData[0];
  }, [regionData, selectedRegion]);



  return (
    <div className="cloud-page">
      <section className="hero">
        <div className="hero-content">
          <h1>Cloud Usage Analytics</h1>
          <p>Upload AWS, Azure, or GCP billing CSVs and turn raw line items into cost trends, usage summaries, and anomaly signals.</p>

          <div className="upload-box">
            <p className="upload-label">Upload your cloud billing CSV</p>
            <label className="upload-trigger" htmlFor="cloud-billing-upload">
              <span className="upload-trigger-title">{isUploading ? 'Processing file...' : 'Choose CSV file'}</span>
              <span className="upload-trigger-subtitle">
                {fileName ? `Selected: ${fileName}` : 'Supports generic AWS, Azure, and GCP billing exports'}
              </span>
            </label>
            <input
              id="cloud-billing-upload"
              className="upload-input"
              type="file"
              accept=".csv"
              onChange={(event) => handleFileUpload(event.target.files?.[0])}
            />
          </div>
        </div>

        <div className="hero-clouds" aria-hidden="true">
          <div className="hero-cloud cloud-back cloud-left">
            <span className="cloud-puff puff-1"></span>
            <span className="cloud-puff puff-2"></span>
            <span className="cloud-puff puff-3"></span>
            <span className="cloud-puff puff-4"></span>
          </div>
          <div className="hero-cloud cloud-mid cloud-center-left">
            <span className="cloud-puff puff-1"></span>
            <span className="cloud-puff puff-2"></span>
            <span className="cloud-puff puff-3"></span>
            <span className="cloud-puff puff-4"></span>
          </div>
          <div className="hero-cloud cloud-front cloud-center">
            <span className="cloud-puff puff-1"></span>
            <span className="cloud-puff puff-2"></span>
            <span className="cloud-puff puff-3"></span>
            <span className="cloud-puff puff-4"></span>
            <span className="cloud-puff puff-5"></span>
          </div>
          <div className="hero-cloud cloud-mid cloud-center-right">
            <span className="cloud-puff puff-1"></span>
            <span className="cloud-puff puff-2"></span>
            <span className="cloud-puff puff-3"></span>
            <span className="cloud-puff puff-4"></span>
          </div>
          <div className="hero-cloud cloud-back cloud-right">
            <span className="cloud-puff puff-1"></span>
            <span className="cloud-puff puff-2"></span>
            <span className="cloud-puff puff-3"></span>
            <span className="cloud-puff puff-4"></span>
          </div>
        </div>
      </section>

      <div className="cloud-divider" aria-hidden="true"></div>

      {message && <p className="success-msg">{message}</p>}
      {error && <p className="error-msg">{error}</p>}

      {analytics && (
        <>
          <section className="analytics-shell">
            <div className="stats-grid">
              {stats.map((stat) => (
                <article className="stat-card" key={stat.label}>
                  <p>{stat.label}</p>
                  <h3>{stat.value}</h3>
                </article>
              ))}
            </div>

            <div className="provider-strip">
              {analytics.metadata.providers.map((provider) => (
                <span className="provider-pill" key={provider.provider}>
                  {provider.provider}: {provider.count}
                </span>
              ))}
            </div>
          </section>

          <section className="cu-chart-grid">

            {/* ── Chart 1: Daily Cost & Usage ── */}
            <div className="cu-chart-card">
              <div className="cu-chart-head">
                <span className="cu-eyebrow">Daily Trend</span>
                <h2>Daily cost &amp; usage</h2>
              </div>
              <div className="cu-chart-area">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={analytics.dailyUsage.map(e => ({ date: e.date, cost: e.totalCost, usage: e.totalUsage }))}
                    margin={{ left: 0, right: 8, top: 4, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
                    <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }}
                      tickFormatter={(v) => { const d = new Date(v); return isNaN(d) ? v : d.toLocaleDateString('en-US',{month:'short',day:'numeric'}); }} />
                    <YAxis yAxisId="cost"  stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} width={52} />
                    <YAxis yAxisId="usage" stroke="#94a3b8" tick={{ fontSize: 11 }} orientation="right" width={44} />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(val, name) => name === 'Cost' ? [formatCurrency(val),'Cost'] : [formatMetric(val),'Usage']}
                      labelFormatter={(v) => { const d = new Date(v); return isNaN(d) ? v : d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); }}
                    />
                    <Line yAxisId="cost"  type="monotone" dataKey="cost"  name="Cost"
                      stroke={BLUE}  strokeWidth={2.5}
                      dot={{ r:3, fill:'#fff', stroke:BLUE,  strokeWidth:2 }}
                      activeDot={{ r:5, fill:AMBER, stroke:BLUE, strokeWidth:2 }} />
                    <Line yAxisId="usage" type="monotone" dataKey="usage" name="Usage"
                      stroke={AMBER} strokeWidth={2} strokeDasharray="5 3"
                      dot={{ r:3, fill:'#fff', stroke:AMBER, strokeWidth:2 }}
                      activeDot={{ r:5, fill:BLUE, stroke:AMBER, strokeWidth:2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="cu-legend">
                <span className="cu-legend-item"><span className="cu-legend-dot" style={{background:BLUE}} />Cost ($)</span>
                <span className="cu-legend-item"><span className="cu-legend-dot" style={{background:AMBER}} />Usage (units)</span>
              </div>
            </div>

            {/* ── Chart 2: Monthly Cost & Usage ── */}
            <div className="cu-chart-card">
              <div className="cu-chart-head">
                <span className="cu-eyebrow">Monthly Trend</span>
                <h2>Monthly cost &amp; usage</h2>
              </div>
              <div className="cu-chart-area">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.monthlyUsage.map(e => ({ month: e.month, cost: e.totalCost, usage: e.totalUsage }))}
                    margin={{ left: 0, right: 8, top: 4, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="cuBarBlue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={BLUE}  stopOpacity={1}/>
                        <stop offset="100%" stopColor={NAVY}  stopOpacity={0.8}/>
                      </linearGradient>
                      <linearGradient id="cuBarAmber" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={AMBER} stopOpacity={1}/>
                        <stop offset="100%" stopColor="#d97706" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
                    <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 11 }}
                      tickFormatter={(v) => { const [y,m] = v.split('-'); return new Date(+y,+m-1,1).toLocaleDateString('en-US',{month:'short',year:'2-digit'}); }} />
                    <YAxis yAxisId="cost"  stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} width={52} />
                    <YAxis yAxisId="usage" stroke="#94a3b8" tick={{ fontSize: 11 }} orientation="right" width={44} />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(val, name) => name === 'Cost' ? [formatCurrency(val),'Cost'] : [formatMetric(val),'Usage']}
                      labelFormatter={(v) => { const [y,m] = v.split('-'); return new Date(+y,+m-1,1).toLocaleDateString('en-US',{month:'long',year:'numeric'}); }}
                    />
                    <Bar yAxisId="cost"  dataKey="cost"  name="Cost"  fill="url(#cuBarBlue)"  radius={[4,4,0,0]} maxBarSize={32} />
                    <Bar yAxisId="usage" dataKey="usage" name="Usage" fill="url(#cuBarAmber)" radius={[4,4,0,0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="cu-legend">
                <span className="cu-legend-item"><span className="cu-legend-dot" style={{background:BLUE}} />Cost ($)</span>
                <span className="cu-legend-item"><span className="cu-legend-dot" style={{background:AMBER}} />Usage (units)</span>
              </div>
            </div>

            {/* ── Chart 3: Top 5 Services by Cost ── */}
            <div className="cu-chart-card">
              <div className="cu-chart-head">
                <span className="cu-eyebrow">Service Breakdown</span>
                <h2>Top 5 services by cost</h2>
              </div>
              <div className="cu-chart-area">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analytics.topServices.slice(0,5).map(e => ({ service: e.service, cost: e.totalCost }))}
                    layout="vertical"
                    margin={{ left: 8, right: 16, top: 4, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="cuSvcGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%"   stopColor={BLUE}  stopOpacity={1}/>
                        <stop offset="100%" stopColor={AMBER} stopOpacity={0.9}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
                    <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                    <YAxis type="category" dataKey="service" width={110} stroke="#94a3b8" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [formatCurrency(v),'Cost']} />
                    <Bar dataKey="cost" name="Cost" fill="url(#cuSvcGrad)" radius={[0,6,6,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ── Chart 4: Interactive Region Cost View ── */}
            <div className="cu-chart-card">
              <div className="cu-chart-head">
                <span className="cu-eyebrow">Region Analysis</span>
                <h2>Cost by region</h2>
                {activeRegion && (
                  <span className="cu-region-total">{formatCurrency(activeRegion.cost)}</span>
                )}
              </div>
              <div className="cu-chart-area">
                <ResponsiveContainer width="100%" height="100%">
                  {regionData.length > 0 ? (
                    <PieChart>
                      <defs>
                        {REGION_COLORS.map((c, i) => (
                          <radialGradient key={i} id={`cureg${i}`} cx="50%" cy="50%" r="50%">
                            <stop offset="0%"   stopColor={c} stopOpacity={0.9}/>
                            <stop offset="100%" stopColor={c} stopOpacity={0.65}/>
                          </radialGradient>
                        ))}
                      </defs>
                      <Pie
                        data={regionData}
                        dataKey="cost"
                        nameKey="name"
                        cx="50%" cy="50%"
                        innerRadius="35%"
                        outerRadius="65%"
                        paddingAngle={3}
                        stroke="none"
                        onClick={(entry) => setSelectedRegion(entry.name)}
                      >
                        {regionData.map((_, i) => (
                          <Cell key={i} fill={`url(#cureg${i % REGION_COLORS.length})`} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, name) => [formatCurrency(v), name]} />
                      <Legend
                        iconType="circle" iconSize={9}
                        formatter={(value) => <span style={{ fontSize:12, color:'#475569' }}>{value}</span>}
                      />
                    </PieChart>
                  ) : (
                    <PieChart><Pie data={[]} dataKey="cost" /></PieChart>
                  )}
                </ResponsiveContainer>
              </div>
              {activeRegion && (
                <div className="cu-region-detail">
                  <strong>{activeRegion.name}</strong>
                  <span>{activeRegion.count} resource(s)</span>
                  {activeRegion.resources?.length > 0 && (
                    <ul>{activeRegion.resources.map(r => <li key={r}>{r}</li>)}</ul>
                  )}
                </div>
              )}
              {regionData.length === 0 && (
                <p className="cu-chart-empty">No region field found in uploaded data</p>
              )}
            </div>

          </section>

          <section className="table-section">
            <h2>Normalized Billing Preview</h2>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Service</th>
                  <th>Resource</th>
                  <th>Provider</th>
                  <th>Usage</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                {previewRecords.map((record) => (
                  <tr key={`${record.rawRowNumber}-${record.resourceName}`}>
                    <td>{record.usageDate}</td>
                    <td>{record.serviceName}</td>
                    <td>{record.resourceName}</td>
                    <td>{record.provider}</td>
                    <td>{formatMetric(record.usageAmount)}</td>
                    <td>{formatCurrency(record.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}
