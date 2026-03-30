import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function Dashboard() {

  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/alerts")
      .then(res => res.json())
      .then(data => setAlerts(data.slice(0, 5))); // latest 5
  }, []);

  const handleViewAlert = (alert) => {
    navigate("/alerts", { state: { selectedAlert: alert } });
  };

  const monthlyData = [
    { month: 'Jan', cost: 2400 },
    { month: 'Feb', cost: 1398 },
    { month: 'Mar', cost: 9800 },
    { month: 'Apr', cost: 3908 },
    { month: 'May', cost: 4800 },
  ];

  return (
    <div className="dashboard-container">

      <header className="dashboard-header">
        <h1>Cloud Cost Dashboard</h1>
        <p>Monitor your cloud infrastructure and costs</p>
      </header>

      {/* Charts */}
      <section className="charts-section">
        <div className="chart-container">
          <h2>Monthly Cost</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="cost" stroke="#667eea" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Alerts */}
      <section className="alerts-section">
        <h2>Recent Alerts</h2>

        {alerts.map((alert, index) => (
          <div key={index} className={`alert-item ${alert.severity}`}>
            <div className="alert-content">
              <h4>{alert.title}</h4>
              <p>{alert.resource}</p>
            </div>

            <button
              className="btn-small"
              onClick={() => handleViewAlert(alert)}
            >
              View
            </button>
          </div>
        ))}
      </section>

    </div>
  );
}