import { useEffect, useMemo, useState } from 'react';
import { detectCostLeaks } from '../utils/costLeakDetector';
import './CostLeak.css';

const USAGE_DATA_UPDATED_EVENT = 'cloud-usage-data-updated';
const USAGE_DATA_STORAGE_KEY = 'cloud-usage-records';

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) {
    return 'Unknown';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const loadStoredRecords = () => {
  try {
    const raw = localStorage.getItem(USAGE_DATA_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.records) ? parsed.records : [];
  } catch {
    return [];
  }
};

export default function CostLeak() {
  const [records, setRecords] = useState([]);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedLeakId, setSelectedLeakId] = useState(null);

  useEffect(() => {
    const syncRecords = (nextRecords) => {
      setRecords(Array.isArray(nextRecords) ? nextRecords : loadStoredRecords());
    };

    const handleUsageUpdated = (event) => {
      syncRecords(event.detail?.records);
    };

    const handleStorage = (event) => {
      if (event.key === USAGE_DATA_STORAGE_KEY) {
        syncRecords();
      }
    };

    syncRecords(loadStoredRecords());
    window.addEventListener(USAGE_DATA_UPDATED_EVENT, handleUsageUpdated);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(USAGE_DATA_UPDATED_EVENT, handleUsageUpdated);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const leaks = useMemo(() => detectCostLeaks(records), [records]);

  const filteredLeaks = useMemo(() => {
    return leaks.filter((leak) => severityFilter === 'all' || leak.severity === severityFilter);
  }, [leaks, severityFilter]);

  const totalPotentialSavings = filteredLeaks.reduce((sum, leak) => sum + (Number(leak.cost) || 0), 0);

  const leaksBySeverity = useMemo(
    () => ({
      critical: leaks.filter((leak) => leak.severity === 'critical').length,
      warning: leaks.filter((leak) => leak.severity === 'warning').length,
      info: leaks.filter((leak) => leak.severity === 'info').length,
    }),
    [leaks],
  );

  const leakTypes = useMemo(() => {
    const counts = new Map();
    leaks.forEach((leak) => counts.set(leak.type, (counts.get(leak.type) ?? 0) + 1));
    return Array.from(counts.entries()).map(([type, count]) => ({ type, count }));
  }, [leaks]);

  return (
    <div className="costleak-container">
      <header className="costleak-header">
        <h1>Cost Leak Detection</h1>
        <p>Analyze uploaded AWS, Azure, and GCP billing records to uncover idle resources, over-provisioned services, and wasteful long-running spend.</p>
      </header>

      {records.length === 0 ? (
        <section className="no-leaks empty-shell">
          <div className="no-leaks-icon">Upload</div>
          <h2>No Billing Data Available Yet</h2>
          <p>Upload a cloud billing CSV in Cloud Usage first. This page will immediately transform those records into actionable cost leak alerts.</p>
        </section>
      ) : (
        <>
          <section className="summary-stats">
            <div className="stat-item">
              <span className="stat-title">Total Leaks Detected</span>
              <span className="stat-number">{leaks.length}</span>
            </div>
            <div className="stat-item critical">
              <span className="stat-title">Critical</span>
              <span className="stat-number">{leaksBySeverity.critical}</span>
            </div>
            <div className="stat-item warning">
              <span className="stat-title">Warning</span>
              <span className="stat-number">{leaksBySeverity.warning}</span>
            </div>
            <div className="stat-item info">
              <span className="stat-title">Info</span>
              <span className="stat-number">{leaksBySeverity.info}</span>
            </div>
            <div className="stat-item savings">
              <span className="stat-title">Potential Cost Exposure</span>
              <span className="stat-number">{formatCurrency(totalPotentialSavings)}</span>
            </div>
          </section>

          <section className="filter-section">
            <div className="filter-control">
              <label htmlFor="severity-filter">Filter by Severity</label>
              <select id="severity-filter" value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)}>
                <option value="all">All Alerts</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </div>

            <div className="leak-type-strip">
              {leakTypes.map((item) => (
                <span key={item.type} className="leak-type-pill">
                  {item.type}: {item.count}
                </span>
              ))}
            </div>
          </section>

          <section className="leaks-section">
            <div className="leaks-grid">
              {filteredLeaks.map((leak) => {
                const expanded = selectedLeakId === leak.id;

                return (
                  <article
                    key={leak.id}
                    className={`leak-card ${leak.severity}`}
                    onClick={() => setSelectedLeakId(expanded ? null : leak.id)}
                  >
                    <div className="leak-header-row">
                      <div className="leak-info">
                        <h3>{leak.resource}</h3>
                        <p>{leak.service}</p>
                      </div>
                      <span className={`severity-badge ${leak.severity}`}>{leak.severity}</span>
                    </div>

                    <div className="leak-type-line">{leak.type}</div>
                    <p className="leak-message">{leak.message}</p>

                    <div className="leak-metrics">
                      <div className="metric-chip">
                        <span>Cost</span>
                        <strong>{formatCurrency(leak.cost || 0)}</strong>
                      </div>
                      <div className="metric-chip">
                        <span>Usage</span>
                        <strong>{leak.usageAmount ?? 0}</strong>
                      </div>
                      <div className="metric-chip">
                        <span>Region</span>
                        <strong>{leak.region}</strong>
                      </div>
                    </div>

                    {expanded && (
                      <div className="leak-expanded">
                        <div className="expanded-grid">
                          <div>
                            <span className="expanded-label">Provider</span>
                            <strong>{leak.provider}</strong>
                          </div>
                          <div>
                            <span className="expanded-label">Detected At</span>
                            <strong>{formatDate(leak.timestamp)}</strong>
                          </div>
                          <div>
                            <span className="expanded-label">Billing Date</span>
                            <strong>{leak.date || 'Unknown'}</strong>
                          </div>
                          <div>
                            <span className="expanded-label">Duration</span>
                            <strong>{leak.duration || 'N/A'}</strong>
                          </div>
                        </div>
                      </div>
                    )}

                    {!expanded && <button className="btn-expand">View Details</button>}
                  </article>
                );
              })}
            </div>

            {filteredLeaks.length === 0 && (
              <div className="no-leaks">
                <div className="no-leaks-icon">OK</div>
                <h2>No Cost Leaks Match This Filter</h2>
                <p>Try another severity or upload new billing data with broader service coverage.</p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
