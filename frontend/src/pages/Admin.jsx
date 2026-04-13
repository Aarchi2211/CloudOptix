import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import './Admin.css';
import { deleteUserById, fetchAlerts, fetchAllUsers, fetchUsageRecords } from '../utils/api';
import { getAuthUser } from '../utils/auth';

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

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
};

export default function Admin() {
  const currentUser = getAuthUser();
  const [users, setUsers] = useState([]);
  const [usageRecords, setUsageRecords] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [deletingUserId, setDeletingUserId] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadAdminData = async () => {
      if (mounted) {
        setLoading(true);
        setError('');
      }

      try {
        const [usersResponse, usageResponse, alertsResponse] = await Promise.all([
          fetchAllUsers(),
          fetchUsageRecords(),
          fetchAlerts(),
        ]);

        if (!mounted) {
          return;
        }

        setUsers(Array.isArray(usersResponse) ? usersResponse : []);
        setUsageRecords(Array.isArray(usageResponse) ? usageResponse : []);
        setAlerts(Array.isArray(alertsResponse) ? alertsResponse : []);
      } catch (loadError) {
        if (mounted) {
          setError(loadError.message || 'Failed to load admin data.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadAdminData();

    return () => {
      mounted = false;
    };
  }, []);

  const handleDeleteUser = async (userId) => {
    setActionError('');

    if (!window.confirm('Delete this user account permanently?')) {
      return;
    }

    try {
      setDeletingUserId(userId);
      await deleteUserById(userId);
      setUsers((currentUsers) => currentUsers.filter((user) => user.id !== userId));
    } catch (deleteError) {
      setActionError(deleteError.message || 'Failed to delete the selected user.');
    } finally {
      setDeletingUserId('');
    }
  };

  const summaryCards = useMemo(() => {
    const totalCost = usageRecords.reduce((sum, record) => sum + (Number(record.cost) || 0), 0);
    const adminCount = users.filter((user) => user.role === 'Admin').length;
    const unreadAlerts = alerts.filter((alert) => alert.status === 'unread').length;

    return [
      { label: 'Platform Users', value: users.length, accent: 'blue' },
      { label: 'Admin Accounts', value: adminCount, accent: 'yellow' },
      { label: 'Uploaded Records', value: usageRecords.length, accent: 'sky' },
      { label: 'Unread Alerts', value: unreadAlerts, accent: 'warning' },
      { label: 'System-Wide Cost', value: formatCurrency(totalCost), accent: 'dark' },
    ];
  }, [alerts, usageRecords, users]);

  const roleBreakdown = useMemo(
    () => [
      { name: 'Users', value: users.filter((user) => user.role === 'User').length },
      { name: 'Admins', value: users.filter((user) => user.role === 'Admin').length },
    ],
    [users],
  );

  const serviceSpend = useMemo(() => {
    const serviceMap = new Map();

    usageRecords.forEach((record) => {
      const service = record.serviceName || record.service || 'Unknown';
      serviceMap.set(service, (serviceMap.get(service) || 0) + (Number(record.cost) || 0));
    });

    return Array.from(serviceMap.entries())
      .map(([service, cost]) => ({ service, cost: Number(cost.toFixed(2)) }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 6);
  }, [usageRecords]);

  const latestUploads = useMemo(
    () =>
      usageRecords
        .slice()
        .sort((a, b) => new Date(b.date || b.usageStartTime || 0) - new Date(a.date || a.usageStartTime || 0))
        .slice(0, 6),
    [usageRecords],
  );

  if (loading) {
    return (
      <div className="admin-page">
        <section className="admin-shell admin-empty-state">
          <span className="eyebrow">Admin Control Center</span>
          <h1>Loading platform data</h1>
          <p>We&apos;re collecting users, billing records, and alerts from MongoDB so the admin console can render.</p>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <section className="admin-shell admin-empty-state">
          <span className="eyebrow">Admin Control Center</span>
          <h1>Admin dashboard unavailable</h1>
          <p>{error}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-shell">
        <section className="admin-hero">
          <div className="hero-copy">
            <span className="eyebrow">Admin Control Center</span>
            <h1>Manage users, monitor billing activity, and keep the platform healthy.</h1>
            <p>
              Signed in as <strong>{currentUser?.name || 'Admin'}</strong>. This panel gives administrators a system-wide
              view of users, uploaded usage records, cost concentration, and alert activity.
            </p>
          </div>

          <div className="hero-side-card">
            <span>System posture</span>
            <strong>{alerts.filter((alert) => ['high', 'critical'].includes(alert.severity)).length} high-priority alerts</strong>
            <p>Track anomalies quickly and keep the cloud cost leakage workflow visible from one place.</p>
          </div>
        </section>

        <section className="admin-summary-grid">
          {summaryCards.map((card) => (
            <article key={card.label} className={`summary-tile ${card.accent}`}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </article>
          ))}
        </section>

        {actionError && <div className="admin-inline-error">{actionError}</div>}

        <section className="admin-content-grid">
          <article className="admin-card users-card">
            <div className="section-heading">
              <div>
                <span>User Management</span>
                <h2>All registered accounts</h2>
              </div>
            </div>

            <div className="table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-pill ${user.role.toLowerCase()}`}>{user.role}</span>
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        <button
                          className="danger-button"
                          disabled={deletingUserId === user.id || currentUser?.id === user.id}
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          {currentUser?.id === user.id ? 'Current Admin' : deletingUserId === user.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="admin-card">
            <div className="section-heading">
              <div>
                <span>Role Distribution</span>
                <h2>Admin vs user access</h2>
              </div>
            </div>

            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={roleBreakdown} dataKey="value" cx="50%" cy="50%" innerRadius={72} outerRadius={102}>
                    <Cell fill="#0ea5e9" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="legend-row">
              {roleBreakdown.map((item) => (
                <div className="legend-item" key={item.name}>
                  <span className={`legend-dot ${item.name === 'Admins' ? 'yellow' : 'blue'}`}></span>
                  {item.name}: {item.value}
                </div>
              ))}
            </div>
          </article>

          <article className="admin-card">
            <div className="section-heading">
              <div>
                <span>System-Wide Data</span>
                <h2>Top services by spend</h2>
              </div>
            </div>

            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={serviceSpend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
                  <XAxis dataKey="service" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="cost" fill="#0ea5e9" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="admin-card">
            <div className="section-heading">
              <div>
                <span>Recent Uploads</span>
                <h2>Latest platform billing rows</h2>
              </div>
            </div>

            <div className="record-list">
              {latestUploads.length === 0 ? (
                <p className="muted-copy">No billing data uploaded yet.</p>
              ) : (
                latestUploads.map((record, index) => (
                  <div className="record-item" key={`${record._id || record.resource || 'record'}-${index}`}>
                    <div>
                      <strong>{record.resource || 'Unknown resource'}</strong>
                      <p>{record.service || record.serviceName || 'Unknown service'}</p>
                    </div>
                    <div className="record-metrics">
                      <span>{formatCurrency(record.cost)}</span>
                      <small>{formatDate(record.date || record.usageStartTime)}</small>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
