import { useState } from 'react';
import Chart from '../components/Chart';
import { processBillingCsv } from '../utils/dataProcessor';
import './CloudUsage.css';

const ALERTS_UPDATED_EVENT = 'cloud-alerts-updated';
const ALERTS_UPDATED_STORAGE_KEY = 'cloud-alerts-last-updated';
const USAGE_DATA_UPDATED_EVENT = 'cloud-usage-data-updated';
const USAGE_DATA_STORAGE_KEY = 'cloud-usage-records';

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

const buildUploadAlerts = (analytics) =>
  analytics.anomalies.map((anomaly, index) => ({
    title: anomaly.type === 'daily_cost_spike' ? 'Daily Cost Spike' : 'Service Cost Spike',
    severity: 'high',
    resource: anomaly.service || 'Overall Billing',
    message: anomaly.message,
    dateTime: anomaly.date || new Date().toISOString(),
    previousDate: anomaly.previousDate || '',
    currentCost: anomaly.currentCost ?? null,
    previousCost: anomaly.previousCost ?? null,
    type: anomaly.type,
    alertKey: `${anomaly.type}-${anomaly.date}-${anomaly.service || 'overall'}-${index}`,
  }));

const notifyAlertsUpdated = () => {
  const timestamp = new Date().toISOString();
  localStorage.setItem(ALERTS_UPDATED_STORAGE_KEY, timestamp);
  window.dispatchEvent(new CustomEvent(ALERTS_UPDATED_EVENT, { detail: { updatedAt: timestamp } }));
};

const persistUsageData = (records) => {
  const payload = {
    updatedAt: new Date().toISOString(),
    records,
  };

  localStorage.setItem(USAGE_DATA_STORAGE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent(USAGE_DATA_UPDATED_EVENT, { detail: payload }));
};

export default function CloudUsage() {
  const [analytics, setAnalytics] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

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
      persistUsageData(processedAnalytics.records);

      const records = processedAnalytics.records.map((record) => ({
        date: record.usageDate,
        service: record.serviceName,
        cost: record.cost,
        usage: record.usageAmount,
        resource: record.resourceName,
      }));

      const alerts = buildUploadAlerts(processedAnalytics);

      try {
        await fetch('http://localhost:5000/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ records, alerts }),
        });

        notifyAlertsUpdated();
        setMessage(
          `Processed ${processedAnalytics.metadata.validRows} valid rows from ${file.name}. Alerts updated from uploaded anomalies.`,
        );
      } catch {
        setMessage(
          `Processed ${processedAnalytics.metadata.validRows} valid rows locally. Backend sync failed, so alerts page may not reflect this upload yet.`,
        );
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

          <section className="charts-grid">
            <div className="chart-panel">
              <Chart
                title="Daily Cost and Usage"
                data={analytics.dailyUsage.map((entry) => ({
                  date: entry.date,
                  totalCost: entry.totalCost,
                  totalUsage: entry.totalUsage,
                }))}
                type="line"
                labels={{
                  xAxis: 'date',
                  xAxisLabel: 'Date',
                  yAxisLabel: 'Usage / Cost',
                  dataKeys: ['totalCost', 'totalUsage'],
                }}
                colors={['#0f62fe', '#16a34a']}
              />
            </div>

            <div className="chart-panel">
              <Chart
                title="Monthly Cost and Usage"
                data={analytics.monthlyUsage.map((entry) => ({
                  month: entry.month,
                  totalCost: entry.totalCost,
                  totalUsage: entry.totalUsage,
                }))}
                type="bar"
                labels={{
                  xAxis: 'month',
                  xAxisLabel: 'Month',
                  yAxisLabel: 'Usage / Cost',
                  dataKeys: ['totalCost', 'totalUsage'],
                }}
                colors={['#f59e0b', '#06b6d4']}
              />
            </div>

            <div className="chart-panel">
              <Chart
                title="Top 5 Services by Cost"
                data={analytics.topServices.map((entry) => ({
                  service: entry.service,
                  totalCost: entry.totalCost,
                }))}
                type="bar"
                labels={{
                  xAxis: 'service',
                  xAxisLabel: 'Service',
                  yAxisLabel: 'Cost',
                  dataKeys: ['totalCost'],
                }}
                colors={['#ef4444']}
              />
            </div>
          </section>

          <section className="insight-grid">
            <article className="insight-card">
              <h2>Service-Wise Usage</h2>
              <table>
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Provider</th>
                    <th>Total Usage</th>
                    <th>Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.serviceUsage.slice(0, 8).map((service) => (
                    <tr key={service.service}>
                      <td>{service.service}</td>
                      <td>{service.provider}</td>
                      <td>{formatMetric(service.totalUsage)}</td>
                      <td>{formatCurrency(service.totalCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>

            <article className="insight-card">
              <h2>Detected Anomalies</h2>
              {analytics.anomalies.length === 0 ? (
                <p className="empty-state">No spikes matched the current anomaly rules.</p>
              ) : (
                <div className="anomaly-list">
                  {analytics.anomalies.slice(0, 8).map((anomaly, index) => (
                    <div className="anomaly-item" key={`${anomaly.type}-${anomaly.date}-${index}`}>
                      <strong>{anomaly.type === 'daily_cost_spike' ? 'Daily Cost Spike' : 'Service Spike'}</strong>
                      <span>{anomaly.message}</span>
                      <span>
                        {anomaly.previousDate} to {anomaly.date}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="insight-card insight-card-table">
              <h2>Top Costly Resources</h2>
              <table>
                <thead>
                  <tr>
                    <th>Resource</th>
                    <th>Service</th>
                    <th>Usage</th>
                    <th>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topResources.map((resource) => (
                    <tr key={resource.resource}>
                      <td>{resource.resource}</td>
                      <td>{resource.service}</td>
                      <td>{formatMetric(resource.totalUsage)}</td>
                      <td>{formatCurrency(resource.totalCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
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
