import { useState } from 'react';
import './CloudUsage.css';

export default function CloudUsage() {
  const [resources, setResources] = useState([]);
  const [message, setMessage] = useState('');

  const handleFileUpload = (file) => {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target.result;
      const rows = text.split('\n').slice(1);

      const data = rows.map(row => {
        const cols = row.split(',');

        return {
          resource: cols[0],
          usage: Number(cols[1]),
          cost: Number(cols[2])
        };
      }).filter(item => item.resource);

      setResources(data);
      setMessage("✅ File uploaded successfully!");
    };

    reader.readAsText(file);
  };

  return (
    <div className="cloud-page">

      {/* 🌩 HERO SECTION */}
      <section className="hero">
        <h1>Cloud Usage Analytics</h1>
        <p>
          Monitor your cloud infrastructure, detect cost leaks, and optimize usage efficiently.
        </p>

        <div className="upload-box">
          <input 
            type="file" 
            accept=".csv"
            onChange={(e) => handleFileUpload(e.target.files[0])}
          />
          <p>Upload your cloud billing CSV</p>
        </div>
        {/* 🌈 Animated Sky Background */}
<div className="sky-bg"></div>

{/* ☁ SVG Clouds Layer */}
<div className="svg-clouds">
  <img src="/cloud.svg" className="cloud-svg cloud1" alt="cloud" />
  <img src="/cloud.svg" className="cloud-svg cloud2" alt="cloud" />
  <img src="/cloud.svg" className="cloud-svg cloud3" alt="cloud" />
</div>
      </section>

    {/* ☁ Cloud Divider */}
<div className="cloud-divider">
  <div className="cloud-shape"></div>
</div>

      {/* 📊 FEATURES SECTION */}
      <section className="features">
        <div className="feature-card">
          <h3>⚡ High Performance</h3>
          <p>Track high usage resources instantly.</p>
        </div>

        <div className="feature-card">
          <h3>☁ Smart Monitoring</h3>
          <p>Real-time insights on cloud usage.</p>
        </div>

        <div className="feature-card">
          <h3>🔒 Secure Analysis</h3>
          <p>Your data stays safe and private.</p>
        </div>
      </section>

      {/* 📊 TABLE */}
      {resources.length > 0 && (
        <section className="table-section">
          <h2>Usage Report</h2>

          <table>
            <thead>
              <tr>
                <th>Resource</th>
                <th>Usage (%)</th>
                <th>Cost ($)</th>
              </tr>
            </thead>

            <tbody>
              {resources.map((r, i) => (
                <tr key={i}>
                  <td>{r.resource}</td>
                  <td>{r.usage}%</td>
                  <td>${r.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {message && <p className="success-msg">{message}</p>}
    </div>
  );
}