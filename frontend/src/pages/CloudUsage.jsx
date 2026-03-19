import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import './CloudUsage.css';

const STORAGE_KEY = 'cloudUsageResources';

const defaultResources = [
  {
    id: 1,
    name: 'EC2-Instance-01',
    service: 'EC2',
    type: 'Compute',
    usagePct: 65,
    cost: 450.5,
    status: 'Active',
    region: 'us-east-1',
  },
  {
    id: 2,
    name: 'RDS-Database',
    service: 'RDS',
    type: 'Database',
    usagePct: 32,
    cost: 320.75,
    status: 'Active',
    region: 'us-east-1',
  },
  {
    id: 3,
    name: 'S3-Bucket-Main',
    service: 'S3',
    type: 'Storage',
    usagePct: 5,
    cost: 85.3,
    status: 'Idle',
    region: 'us-west-2',
  },
  {
    id: 4,
    name: 'Lambda-Function-01',
    service: 'Lambda',
    type: 'Compute',
    usagePct: 10,
    cost: 12.5,
    status: 'Idle',
    region: 'us-east-1',
  },
  {
    id: 5,
    name: 'EBS-Volume-Old',
    service: 'EBS',
    type: 'Storage',
    usagePct: 8,
    cost: 95.2,
    status: 'Idle',
    region: 'eu-west-1',
  },
  {
    id: 6,
    name: 'CloudFront-CDN',
    service: 'CloudFront',
    type: 'Networking',
    usagePct: 2,
    cost: 280.45,
    status: 'Active',
    region: 'Global',
  },
  {
    id: 7,
    name: 'EC2-Instance-02',
    service: 'EC2',
    type: 'Compute',
    usagePct: 8,
    cost: 125.8,
    status: 'Idle',
    region: 'ap-south-1',
  },
  {
    id: 8,
    name: 'Backup-Storage',
    service: 'S3',
    type: 'Storage',
    usagePct: 15,
    cost: 150.9,
    status: 'Idle',
    region: 'us-west-1',
  },
];

const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];

function parseCSV(text) {
  const rows = text
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (rows.length < 2) return [];

  const headings = rows[0]
    .split(',')
    .map((item) => item.trim().replace(/(^["']|["']$)/g, '').toLowerCase());

  const mappedRows = rows.slice(1).map((rowLine, index) => {
    const values = rowLine
      .split(',')
      .map((item) => item.trim().replace(/(^["']|["']$)/g, ''));

    if (values.length !== headings.length) return null;

    const row = {};
    headings.forEach((key, i) => {
      row[key] = values[i];
    });

    const service = row.service || row['productname'] || row['product'] || 'Unknown';
    const name = row.resource || row['resourceid'] || `${service}-${index + 1}`;
    const region = row.region || row['availabilityzone'] || 'Unknown';
    const status = row.status || 'Active';
    const usagePct = parseFloat(row.usagepercent || row.usage || row['usageamount'] || 0);

    const costRaw = parseFloat(
      row.cost || row.unblendedcost || row['unblended cost'] || row['lineitem/amount'] || '0'
    );

    return {
      id: Date.now() + index,
      name,
      service,
      type: row.type || row['servicetype'] || service,
      usagePct: Number.isNaN(usagePct) ? 0 : usagePct,
      cost: Number.isNaN(costRaw) ? 0 : costRaw,
      status:
        status.toLowerCase() === 'idle' || usagePct < 20
          ? 'Idle'
          : usagePct > 80
          ? 'High'
          : 'Active',
      region,
    };
  });

  return mappedRows.filter(Boolean);
}

export default function CloudUsage() {
  const [resources, setResources] = useState(defaultResources);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadError, setUploadError] = useState('');

  const [filterRegion, setFilterRegion] = useState('All');
  const [filterService, setFilterService] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setResources(parsed);
      } catch (e) {
        console.warn('Invalid saved resources in localStorage', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resources));
  }, [resources]);

  const uniqueRegions = useMemo(() => ['All', ...new Set(resources.map((r) => r.region))], [resources]);
  const uniqueServices = useMemo(() => ['All', ...new Set(resources.map((r) => r.service))], [resources]);

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      if (filterRegion !== 'All' && resource.region !== filterRegion) return false;
      if (filterService !== 'All' && resource.service !== filterService) return false;
      if (filterStatus !== 'All' && resource.status !== filterStatus) return false;
      return true;
    });
  }, [resources, filterRegion, filterService, filterStatus]);

  const totalCost = useMemo(() => resources.reduce((sum, r) => sum + (r.cost || 0), 0), [resources]);
  const activeCount = useMemo(
    () => resources.filter((r) => r.status === 'Active').length,
    [resources]
  );
  const idleCount = useMemo(
    () => resources.filter((r) => r.status === 'Idle').length,
    [resources]
  );
  const highUsageCount = useMemo(
    () => resources.filter((r) => r.usagePct >= 80).length,
    [resources]
  );
  const estimatedWaste = useMemo(
    () =>
      resources
        .filter((r) => r.status === 'Idle' || r.usagePct < 20)
        .reduce((sum, r) => sum + (r.cost || 0), 0),
    [resources]
  );

  const costByService = useMemo(() => {
    const map = {};
    resources.forEach((r) => {
      if (!map[r.service]) map[r.service] = 0;
      map[r.service] += r.cost || 0;
    });
    return Object.entries(map).map(([service, cost]) => ({ service, cost }));
  }, [resources]);

  const serviceDistribution = useMemo(() => {
    const countMap = {};
    resources.forEach((r) => {
      if (!countMap[r.service]) countMap[r.service] = 0;
      countMap[r.service] += 1;
    });

    return Object.entries(countMap).map(([service, value]) => ({ service, value }));
  }, [resources]);

  const identifyLeaks = useMemo(() => {
    const idle = resources.filter((r) => r.status === 'Idle' || r.usagePct < 20);
    const overutilized = resources.filter((r) => r.usagePct > 80);
    const unusedStorage = resources.filter((r) => r.type.toLowerCase().includes('storage') && r.usagePct < 20);
    return { idle, overutilized, unusedStorage };
  }, [resources]);

  const clearRequiredFields = (row) => {
    return (
      row.name &&
      row.service &&
      row.region &&
      typeof row.usagePct === 'number' &&
      typeof row.cost === 'number'
    );
  };

  const onFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setUploadError('');
    setUploadMessage('');
  };

  const onUpload = async () => {
    if (!selectedFile) {
      setUploadError('Please choose a billing report file first.');
      return;
    }

    const allowed = ['csv', 'xlsx', 'xls'];
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) {
      setUploadError('Invalid file type. Please use CSV or Excel.');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    setUploadMessage('');

    try {
      if (ext === 'csv') {
        const text = await selectedFile.text();
        const parsed = parseCSV(text);
        const validRows = parsed.filter(clearRequiredFields);

        if (validRows.length === 0) {
          setUploadError('No valid records found in CSV. Please check header format.');
          return;
        }

        setResources((prev) => {
          const merged = [...validRows];
          return merged;
        });

        setUploadMessage(
          `Upload successful: ${validRows.length} resources imported. Analysis triggered.`
        );
      } else {
        setUploadError('Excel parsing is not supported yet in this demo. Please use CSV.');
      }
    } catch (error) {
      setUploadError('Upload failed: ' + (error.message || error.toString()));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="cloudusage-container">
      <div className="cloudusage-header">
        <h1>Cloud Usage Dashboard</h1>
        <p>Monitor and optimize your cloud resources</p>
      </div>

      <section className="upload-section">
        <div className="upload-container">
          <div className="upload-box">
            <div className="upload-icon">📁</div>
            <label className={`upload-label ${isUploading ? 'uploading' : ''}`}>
              <strong>Upload billing report (CSV / Excel)</strong>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={onFileChange}
                disabled={isUploading}
                style={{ display: 'none' }}
              />
            </label>
            <p>{selectedFile ? selectedFile.name : 'No file selected'}</p>
            <p className="file-types">Allowed: CSV, XLSX, XLS (max 10MB)</p>
            <button className="upload-btn" onClick={onUpload} disabled={isUploading}>
              {isUploading ? 'Processing...' : 'Upload and Analyze'}
            </button>
            {uploadMessage && <div className="upload-message success">{uploadMessage}</div>}
            {uploadError && <div className="upload-message error">{uploadError}</div>}
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="stat-card">
          <div className="stat-label">Total Cost</div>
          <div className="stat-value">${totalCost.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Resources</div>
          <div className="stat-value active">{activeCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Idle Resources</div>
          <div className="stat-value idle">{idleCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">High Usage Resources</div>
          <div className="stat-value">{highUsageCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Estimated Waste</div>
          <div className="stat-value">${estimatedWaste.toFixed(2)}</div>
        </div>
      </section>

      <section className="controls-section">
        <div className="control-group">
          <label>Region</label>
          <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)}>
            {uniqueRegions.map((region) => (
              <option value={region} key={region}>
                {region}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Service</label>
          <select value={filterService} onChange={(e) => setFilterService(e.target.value)}>
            {uniqueServices.map((service) => (
              <option value={service} key={service}>
                {service}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Status</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            {['All', 'Active', 'Idle', 'High'].map((status) => (
              <option value={status} key={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="resources-section">
        <div className="table-wrapper">
          <table className="resources-table">
            <thead>
              <tr>
                <th>Resource Name</th>
                <th>Service Type</th>
                <th>Region</th>
                <th>Usage %</th>
                <th>Cost $</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredResources.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-resources">
                    No resources match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredResources.map((resource) => (
                  <tr
                    key={resource.id}
                    className={
                      resource.status === 'Active'
                        ? 'status-active'
                        : resource.status === 'Idle'
                        ? 'status-idle'
                        : ''
                    }
                  >
                    <td className="name-cell">{resource.name}</td>
                    <td>{resource.service}</td>
                    <td>{resource.region}</td>
                    <td>{resource.usagePct}%</td>
                    <td>${(resource.cost || 0).toFixed(2)}</td>
                    <td>
                      <span className={`status-badge ${resource.status.toLowerCase()}`}>
                        {resource.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="stats-section">
        <div className="stat-card" style={{ minHeight: '280px' }}>
          <div className="stat-label">Cost per Service</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={costByService} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="service" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Bar dataKey="cost" fill="#2563EB" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="stat-card" style={{ minHeight: '280px' }}>
          <div className="stat-label">Service Distribution</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={serviceDistribution}
                dataKey="value"
                nameKey="service"
                label={({ service, percent }) => `${service}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
              >
                {serviceDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="stats-section">
        <div className="stat-card">
          <div className="stat-label">Idle Resources</div>
          <div className="stat-value idle">{identifyLeaks.idle.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Overutilized Resources</div>
          <div className="stat-value">{identifyLeaks.overutilized.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Unused Storage Resources</div>
          <div className="stat-value">{identifyLeaks.unusedStorage.length}</div>
        </div>
      </section>

      <section className="stats-section">
        <div className="stat-card" style={{ gridColumn: '1 / -1' }}>
          <div className="stat-label">Viva Answer</div>
          <p>
            This module allows users to upload cloud billing reports, which are then parsed and used for cost analysis and anomaly detection.
            It identifies idle resources, overutilized resources, and possible cost leaks. Filters allow slicing by region, service and status.
          </p>
        </div>
      </section>
    </div>
  );
}
