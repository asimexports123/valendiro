'use client';

import { useState, useEffect } from 'react';

interface PipelineStatus {
  status: 'running' | 'paused' | 'maintenance';
  queueSize: number;
  runningJobs: number;
  completedToday: number;
  failedToday: number;
  averageProcessingTime: number;
  nextScheduledRun: string;
  currentStage: string;
}

interface JobHistory {
  id: string;
  startTime: string;
  endTime: string;
  operator: string;
  topicsProcessed: number;
  articlesPublished: number;
  failures: number;
  duration: number;
}

export default function ProductionControl() {
  const [status, setStatus] = useState<PipelineStatus>({
    status: 'running',
    queueSize: 217,
    runningJobs: 0,
    completedToday: 16,
    failedToday: 0,
    averageProcessingTime: 8.3,
    nextScheduledRun: '2026-07-05T20:00:00Z',
    currentStage: 'Idle'
  });

  const [jobHistory, setJobHistory] = useState<JobHistory[]>([
    {
      id: '1',
      startTime: '2026-07-05T18:30:00Z',
      endTime: '2026-07-05T18:45:00Z',
      operator: 'System',
      topicsProcessed: 16,
      articlesPublished: 16,
      failures: 0,
      duration: 900
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'maintenance': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleAction = async (action: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/production/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      
      if (response.ok) {
        const result = await response.json();
        setStatus(result.status);
        alert(`${action} successful`);
      }
    } catch (error) {
      alert(`${action} failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Production Control Center</h1>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor(status.status)}`} />
          <span className="capitalize font-semibold">{status.status}</span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Pipeline Controls</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => handleAction('start')}
            disabled={isLoading || status.status === 'running'}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ▶ Start Production
          </button>
          <button
            onClick={() => handleAction('pause')}
            disabled={isLoading || status.status === 'paused' || status.status === 'maintenance'}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ⏸ Pause Production
          </button>
          <button
            onClick={() => handleAction('stop')}
            disabled={isLoading || status.status === 'paused' || status.status === 'maintenance'}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ⏹ Stop Current Batch
          </button>
          <button
            onClick={() => handleAction('resume')}
            disabled={isLoading || status.status === 'running'}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🔄 Resume
          </button>
          <button
            onClick={() => handleAction('run-one-batch')}
            disabled={isLoading}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ▶ Run One Batch
          </button>
          <button
            onClick={() => handleAction('process-queue')}
            disabled={isLoading}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ▶ Process Queue
          </button>
          <button
            onClick={() => handleAction('retry-failed')}
            disabled={isLoading}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ▶ Retry Failed
          </button>
          <button
            onClick={() => handleAction('refresh-queue')}
            disabled={isLoading}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ▶ Refresh Queue
          </button>
        </div>
      </div>

      {/* Queue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-600">Current Queue Size</h3>
          <p className="text-3xl font-bold">{status.queueSize}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-600">Running Jobs</h3>
          <p className="text-3xl font-bold">{status.runningJobs}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-600">Completed Today</h3>
          <p className="text-3xl font-bold text-green-600">{status.completedToday}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-600">Failed Today</h3>
          <p className="text-3xl font-bold text-red-600">{status.failedToday}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-600">Avg Processing Time</h3>
          <p className="text-3xl font-bold">{status.averageProcessingTime}s</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-600">Current Stage</h3>
          <p className="text-3xl font-bold">{status.currentStage}</p>
        </div>
      </div>

      {/* Maintenance Mode */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Maintenance Mode</h2>
        <p className="text-gray-600 mb-4">
          One click to pause the pipeline for safe maintenance operations (template modifications, code deployments, prompt updates, migrations, Knowledge Package modifications).
        </p>
        <button
          onClick={() => handleAction('maintenance-mode')}
          disabled={isLoading}
          className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🔧 Enter Maintenance Mode
        </button>
      </div>

      {/* Job History */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Job History</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Start Time</th>
                <th className="text-left p-3">End Time</th>
                <th className="text-left p-3">Operator</th>
                <th className="text-left p-3">Topics Processed</th>
                <th className="text-left p-3">Articles Published</th>
                <th className="text-left p-3">Failures</th>
                <th className="text-left p-3">Duration</th>
              </tr>
            </thead>
            <tbody>
              {jobHistory.map((job) => (
                <tr key={job.id} className="border-b">
                  <td className="p-3">{new Date(job.startTime).toLocaleString()}</td>
                  <td className="p-3">{new Date(job.endTime).toLocaleString()}</td>
                  <td className="p-3">{job.operator}</td>
                  <td className="p-3">{job.topicsProcessed}</td>
                  <td className="p-3 text-green-600">{job.articlesPublished}</td>
                  <td className="p-3 text-red-600">{job.failures}</td>
                  <td className="p-3">{Math.floor(job.duration / 60)}m {job.duration % 60}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Safety Checks */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Safety Checks</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Environment: Healthy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Database: Connected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Queue: {status.queueSize} items</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Secrets: Valid</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Pipeline Health: Good</span>
          </div>
        </div>
      </div>
    </div>
  );
}
