import { useState, useEffect } from 'react';
import './Alerts.css';

export default function Alerts() {

  const [alerts, setAlerts] = useState([]);

  // ✅ LOAD ALERTS
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("alerts")) || [];
    setAlerts(stored);
  }, []);

  // ✅ UPDATE WHEN CHANGED
  useEffect(() => {
    const update = () => {
      const stored = JSON.parse(localStorage.getItem("alerts")) || [];
      setAlerts(stored);
    };

    window.addEventListener("alertsUpdated", update);

    return () => window.removeEventListener("alertsUpdated", update);
  }, []);

  return (
    <div className="alerts-container">

      <h1>Alerts</h1>

      {alerts.length === 0 ? (
        <p>No Alerts Found</p>
      ) : (
        alerts.map(alert => (
          <div key={alert.id} className={`alert-item ${alert.severity}`}>
            <h3>{alert.title}</h3>
            <p>{alert.message}</p>
            <small>{alert.resource}</small>
          </div>
        ))
      )}

    </div>
  );
}