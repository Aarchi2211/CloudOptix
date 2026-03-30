import { useEffect, useMemo, useState } from 'react';
import './Alerts.css';

const ALERTS_UPDATED_EVENT = 'cloud-alerts-updated';
const ALERTS_UPDATED_STORAGE_KEY = 'cloud-alerts-last-updated';

const formatCurrency = (value) => {
  if (value == null || Number.isNaN(Number(value))) {
    return 'N/A';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number(value));
};

const formatDate = (value) => {
  if (!value) {
    return 'Unknown date';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
};

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadAlerts = async () => {
      if (mounted) {
        setLoading(true);
      }

      try {
        const response = await fetch('http://localhost:5000/api/alerts');
        const data = await response.json();

        if (mounted) {
          setAlerts(Array.isArray(data) ? data : []);
        }
      } catch {
        if (mounted) {
          setAlerts([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    const handleAlertsUpdated = () => {
      loadAlerts();
    };

    const handleStorage = (event) => {
      if (event.key === ALERTS_UPDATED_STORAGE_KEY) {
        loadAlerts();
      }
    };

    loadAlerts();
    window.addEventListener(ALERTS_UPDATED_EVENT, handleAlertsUpdated);
    window.addEventListener('storage', handleStorage);

    return () => {
      mounted = false;
      window.removeEventListener(ALERTS_UPDATED_EVENT, handleAlertsUpdated);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
      const query = searchTerm.trim().toLowerCase();
      const haystack = [alert.title, alert.message, alert.resource, alert.type].join(' ').toLowerCase();
      const matchesSearch = !query || haystack.includes(query);

      return matchesSeverity && matchesSearch;
    });
  }, [alerts, searchTerm, severityFilter]);

  const stats = useMemo(() => {
    const high = alerts.filter((alert) => alert.severity === 'high').length;
    const medium = alerts.filter((alert) => alert.severity === 'medium').length;

    return {
      total: alerts.length,
      high,
      medium,
    };
  }, [alerts]);

  return (
    <div className="alerts-container">
      <div className="alerts-header">
        <h1>Alerts</h1>
        <p>Alerts now refresh from the latest uploaded billing file anomalies and backend cost rules.</p>
      </div>

      <div className="alert-stats">
        <div className="stat-card">
          <span className="stat-label">Total Alerts</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-card warning">
          <span className="stat-label">High Severity</span>
          <span className="stat-value">{stats.high}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Medium Severity</span>
          <span className="stat-value">{stats.medium}</span>
        </div>
      </div>

      <div className="alert-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by service, resource, or alert type"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div className="filter-group">
          <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)}>
            <option value="all">All Severities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="no-alerts">
          <h2>Loading alerts...</h2>
          <p>Pulling the latest alert set from the backend.</p>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="no-alerts">
          <div className="no-alerts-icon">OK</div>
          <h2>No Alerts Found</h2>
          <p>Upload a billing CSV with a cost spike or clear the current filters to see alert history.</p>
        </div>
      ) : (
        <div className="alerts-list">
          {filteredAlerts.map((alert, index) => (
            <div key={alert._id || alert.alertKey || index} className={`alert-item ${alert.severity || 'medium'}`}>
              <div className="alert-indicator"></div>

              <div className="alert-main-content">
                <div className="alert-header-row">
                  <h3 className="alert-title">{alert.title || 'Alert'}</h3>
                  <span className={`severity-badge ${alert.severity || 'medium'}`}>{alert.severity || 'medium'}</span>
                </div>

                <p className="alert-message">{alert.message}</p>

                <div className="alert-meta">
                  <span className="meta-item">
                    <strong>Resource:</strong> {alert.resource || 'N/A'}
                  </span>
                  <span className="meta-item">
                    <strong>Current Cost:</strong> {formatCurrency(alert.currentCost)}
                  </span>
                  <span className="meta-item">
                    <strong>Previous Cost:</strong> {formatCurrency(alert.previousCost)}
                  </span>
                  <span className="meta-item time">
                    <strong>Detected:</strong> {formatDate(alert.dateTime)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
