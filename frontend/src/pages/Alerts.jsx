import { useEffect, useMemo, useState } from 'react';
import { deleteAlertById, fetchAlerts, updateAlertStatus } from '../utils/api';
import { ALERTS_UPDATED_EVENT, dispatchAlertsUpdated } from '../utils/cloudEvents';
import './Alerts.css';

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

const generateAiOptimizerAdvice = (alert) => {
  const resource = alert.resource || 'resource';
  const message = alert.message || '';
  const current = Number(alert.currentCost) || 0;
  const previous = Number(alert.previousCost) || 0;
  const regionMatch = resource.match(/([a-z]{2}-[a-z]+-\d)/i) || message.match(/([a-z]{2}-[a-z]+-\d)/i);
  const region = regionMatch ? regionMatch[1] : 'us-east-1';
  const costDelta = current - previous;
  const monthlySavings = costDelta > 0 ? Math.max(Math.round(costDelta * 0.7), 15) : 20;
  const hasIdle = /idle|unused|underutilized|stopped/i.test(message);
  const hasSpike = /spike|unexpected|burst|surge/i.test(message);
  const isEC2 = /ec2/i.test(resource) || /ec2/i.test(message);
  const isRDS = /rds|db\./i.test(resource) || /database/i.test(message);
  const isS3 = /s3|storage/i.test(resource) || /bucket/i.test(message);

  const instanceType = isEC2 ? 'T3.micro' : isRDS ? 'db.t3.small' : isS3 ? 'Standard-IA' : 'smaller tier';
  const targetPhrase = isEC2 ? `This EC2 instance in ${region}` : isRDS ? `This database instance in ${region}` : `This resource`;
  const actionPhrase = hasIdle
    ? `switching to a ${instanceType} instance`
    : hasSpike
      ? 'right-sizing usage and reviewing idle capacity'
      : `reviewing the configuration and usage pattern of ${resource}`;

  const costSentence = costDelta > 10
    ? ` would save you about ${formatCurrency(monthlySavings)}/month without affecting performance.`
    : ` can help trim some wasted spend and keep performance stable.`;

  return `${targetPhrase} has been flagged because ${message.toLowerCase()}. We recommend ${actionPhrase}${costSentence}`;
};

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeAlertId, setActiveAlertId] = useState('');
  const [aiResponses, setAiResponses] = useState({});
  const [aiLoadingId, setAiLoadingId] = useState('');

  const handleAskAiOptimizer = async (alert) => {
    setAiLoadingId(alert._id);

    try {
      const advice = generateAiOptimizerAdvice(alert);
      setAiResponses((current) => ({
        ...current,
        [alert._id]: advice,
      }));
    } finally {
      setAiLoadingId('');
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadAlerts = async () => {
      if (mounted) {
        setLoading(true);
        setError('');
      }

      try {
        const data = await fetchAlerts();

        if (mounted) {
          setAlerts(Array.isArray(data) ? data : []);
        }
      } catch (loadError) {
        if (mounted) {
          setAlerts([]);
          setError(loadError.message || 'Failed to load alerts.');
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

    loadAlerts();
    window.addEventListener(ALERTS_UPDATED_EVENT, handleAlertsUpdated);

    return () => {
      mounted = false;
      window.removeEventListener(ALERTS_UPDATED_EVENT, handleAlertsUpdated);
    };
  }, []);

  const handleStatusChange = async (alertId, status) => {
    try {
      setActiveAlertId(alertId);
      const updatedAlert = await updateAlertStatus(alertId, status);
      setAlerts((currentAlerts) =>
        currentAlerts.map((alert) => (alert._id === alertId ? updatedAlert : alert)),
      );
      dispatchAlertsUpdated();
    } catch (statusError) {
      setError(statusError.message || 'Failed to update alert status.');
    } finally {
      setActiveAlertId('');
    }
  };

  const handleDelete = async (alertId) => {
    try {
      setActiveAlertId(alertId);
      await deleteAlertById(alertId);
      setAlerts((currentAlerts) => currentAlerts.filter((alert) => alert._id !== alertId));
      dispatchAlertsUpdated();
    } catch (deleteError) {
      setError(deleteError.message || 'Failed to delete alert.');
    } finally {
      setActiveAlertId('');
    }
  };

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
      unread: alerts.filter((alert) => alert.status === 'unread').length,
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
        <div className="stat-card">
          <span className="stat-label">Unread Alerts</span>
          <span className="stat-value">{stats.unread}</span>
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
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {error ? (
        <div className="no-alerts">
          <h2>Unable to load alerts</h2>
          <p>{error}</p>
        </div>
      ) : null}

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
            <div
              key={alert._id || index}
              className={`alert-item ${alert.severity || 'medium'} ${alert.status || 'unread'}`}
            >
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
                    <strong>Detected:</strong> {formatDate(alert.createdAt)}
                  </span>
                </div>

                <div className="alert-expanded">
                  <div className="action-section">
                    <h4>Alert Status</h4>
                    <p>Keep the alert list current by marking items as read or removing resolved items.</p>
                  </div>

                  <div className="alert-actions">
                    <button
                      type="button"
                      className={`btn-action ${alert.status === 'read' ? 'mark-unread' : 'mark-read'}`}
                      onClick={() => handleStatusChange(alert._id, alert.status === 'read' ? 'unread' : 'read')}
                      disabled={activeAlertId === alert._id}
                    >
                      {activeAlertId === alert._id
                        ? 'Updating...'
                        : alert.status === 'read'
                          ? 'Mark as Unread'
                          : 'Mark as Read'}
                    </button>
                    <button
                      type="button"
                      className="btn-action ai-advisor"
                      onClick={() => handleAskAiOptimizer(alert)}
                      disabled={aiLoadingId === alert._id}
                    >
                      {aiLoadingId === alert._id ? 'Thinking...' : 'Ask AI Optimizer'}
                    </button>
                    <button
                      type="button"
                      className="btn-action dismiss"
                      onClick={() => handleDelete(alert._id)}
                      disabled={activeAlertId === alert._id}
                    >
                      {activeAlertId === alert._id ? 'Working...' : 'Delete Alert'}
                    </button>
                  </div>

                  {aiResponses[alert._id] ? (
                    <div className="ai-advisor-panel">
                      <div className="ai-advisor-header">AI Optimizer</div>
                      <p>{aiResponses[alert._id]}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
