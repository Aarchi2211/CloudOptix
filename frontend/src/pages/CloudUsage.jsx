import { useState } from 'react';
import './CloudUsage.css';

export default function CloudUsage() {
  const [resources, setResources] = useState([
    {
      id: 1,
      name: 'EC2-Instance-01',
      type: 'Compute',
      cpu: 65,
      storage: 250,
      bandwidth: 1250,
      cost: '$450.50',
      status: 'Active',
      region: 'us-east-1'
    },
    {
      id: 2,
      name: 'RDS-Database',
      type: 'Database',
      cpu: 32,
      storage: 500,
      bandwidth: 850,
      cost: '$320.75',
      status: 'Active',
      region: 'us-east-1'
    },
    {
      id: 3,
      name: 'S3-Bucket-Main',
      type: 'Storage',
      cpu: 5,
      storage: 1500,
      bandwidth: 2100,
      cost: '$85.30',
      status: 'Active',
      region: 'us-west-2'
    },
    {
      id: 4,
      name: 'Lambda-Function-01',
      type: 'Compute',
      cpu: 10,
      storage: 100,
      bandwidth: 450,
      cost: '$12.50',
      status: 'Active',
      region: 'us-east-1'
    },
    {
      id: 5,
      name: 'EBS-Volume-Old',
      type: 'Storage',
      cpu: 0,
      storage: 800,
      bandwidth: 0,
      cost: '$95.20',
      status: 'Idle',
      region: 'eu-west-1'
    },
    {
      id: 6,
      name: 'CloudFront-CDN',
      type: 'Networking',
      cpu: 2,
      storage: 50,
      bandwidth: 5200,
      cost: '$280.45',
      status: 'Active',
      region: 'Global'
    },
    {
      id: 7,
      name: 'EC2-Instance-02',
      type: 'Compute',
      cpu: 8,
      storage: 100,
      bandwidth: 300,
      cost: '$125.80',
      status: 'Idle',
      region: 'ap-south-1'
    },
    {
      id: 8,
      name: 'Backup-Storage',
      type: 'Storage',
      cpu: 0,
      storage: 2000,
      bandwidth: 100,
      cost: '$150.90',
      status: 'Active',
      region: 'us-west-1'
    },
  ]);

  const [sortBy, setSortBy] = useState('name');
  const [filterStatus, setFilterStatus] = useState('All');

  // File upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadError, setUploadError] = useState('');

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['.csv', '.xlsx', '.xls'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validTypes.includes(fileExtension)) {
      setUploadError('Invalid file type. Please upload CSV or Excel files only.');
      setTimeout(() => setUploadError(''), 5000);
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds 10MB limit.');
      setTimeout(() => setUploadError(''), 5000);
      return;
    }

    setIsUploading(true);
    setUploadError('');
    setUploadMessage('');

        try {
          const formData = new FormData();
          formData.append('file', file);
          // Add your API call here if needed
          setUploadMessage('File uploaded successfully');
        } catch (error) {
          setUploadError('Failed to upload file: ' + error.message);
        } finally {
          setIsUploading(false);
        }
      };
    
      return (
        <div className="cloud-usage">
          <h1>Cloud Usage Dashboard</h1>
        </div>
      );
    }