import React, { useEffect, useState } from 'react';
import { getProjectStats, getTaskStats, getTasks } from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const [projectStats, setProjectStats] = useState(null);
  const [taskStats, setTaskStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [projectResponse, taskResponse, tasksResponse] = await Promise.all([
          getProjectStats(),
          getTaskStats(),
          getTasks({ limit: 5, page: 1 }) // Fetch 5 most recent tasks
        ]);
        setProjectStats(projectResponse.data);
        setTaskStats(taskResponse.data);
        setRecentTasks(tasksResponse.data.tasks);
      } catch (err) {
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full border-4 border-t-white border-b-white h-12 w-12"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-red-500 text-center p-6">
          <h2 className="text-xl font-bold mb-4">Error Loading Dashboard</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Projects */}
        <div className="glass-panel p-6 fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-white/70">Total Projects</h3>
              <p className="mt-1 text-2xl font-bold text-white">{projectStats?.totalProjects || 0}</p>
            </div>
            <div className="p-3 bg-white/10 rounded-lg">
              <svg className="h-5 w-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18M3 12h18M3 17h18" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Active Projects */}
        <div className="glass-panel p-6 fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-white/70">Active Projects</h3>
              <p className="mt-1 text-2xl font-bold text-white">{projectStats?.activeProjects || 0}</p>
            </div>
            <div className="p-3 bg-white/10 rounded-lg">
              <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Completed Projects */}
        <div className="glass-panel p-6 fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-white/70">Completed Projects</h3>
              <p className="mt-1 text-2xl font-bold text-white">{projectStats?.completedProjects || 0}</p>
            </div>
            <div className="p-3 bg-white/10 rounded-lg">
              <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Average Budget */}
        <div className="glass-panel p-6 fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-white/70">Average Budget</h3>
              <p className="mt-1 text-2xl font-bold text-white">${projectStats?.averageBudget ? Number(projectStats.averageBudget).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'}</p>
            </div>
            <div className="p-3 bg-white/10 rounded-lg">
              <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4-4-1.79-4-4-4zm0 10c-4.41 0-8-3.59-8-8s3.59-8 8-8-3.59 8-8 8z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Chart */}
        <div className="glass-panel p-6 fade-in">
          <h3 className="mb-4 text-xl font-semibold text-white">Project Status Distribution</h3>
          <div className="chart-container">
            {!projectStats ? (
              <p className="text-center text-white/50">Loading chart data...</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Active', value: projectStats.activeProjects || 0, fill: '#22c55e' },
                      { name: 'Completed', value: projectStats.completedProjects || 0, fill: '#3b82f6' },
                      { name: 'On Hold', value: (projectStats.totalProjects || 0) - ((projectStats.activeProjects || 0) + (projectStats.completedProjects || 0)), fill: '#f59e0b' },
                      { name: 'Cancelled', value: 0, fill: '#ef4444' } // Assuming we don't have cancelled in stats for simplicity
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                  >
                    {[
                      { name: 'Active', fill: '#22c55e' },
                      { name: 'Completed', fill: '#3b82f6' },
                      { name: 'On Hold', fill: '#f59e0b' },
                      { name: 'Cancelled', fill: '#ef4444' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Task Status Chart */}
        <div className="glass-panel p-6 fade-in">
          <h3 className="mb-4 text-xl font-semibold text-white">Task Status Distribution</h3>
          <div className="chart-container">
            {!taskStats ? (
              <p className="text-center text-white/50">Loading chart data...</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { name: 'To Do', todo: taskStats.todoTasks || 0 },
                    { name: 'In Progress', 'in progress': taskStats.inProgressTasks || 0 },
                    { name: 'Review', review: taskStats.reviewTasks || 0 },
                    { name: 'Done', done: taskStats.doneTasks || 0 }
                  ]}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="todo" label="To Do" fill="#6b7280" />
                  <Bar dataKey="in progress" label="In Progress" fill="#3b82f6" />
                  <Bar dataKey="review" label="Review" fill="#a855f7" />
                  <Bar dataKey="done" label="Done" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="glass-panel p-6 fade-in">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white">Recent Tasks</h3>
          <button 
            onClick={() => window.location.href = '/tasks'}
            className="glass-button hover:glass-button px-4 py-2 rounded-lg text-sm font-medium text-white"
          >
            View All Tasks
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table w-full whitespace-nowrap">
            <thead>
              <tr>
                <th className="w-20">Task Title</th>
                <th className="w-20">Project</th>
                <th className="w-16">Status</th>
                <th className="w-16">Priority</th>
                <th className="w-20">Due Date</th>
                <th className="w-16">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentTasks.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-4 text-center text-white/50">
                    No recent tasks found.
                  </td>
                </tr>
              ) : (
                recentTasks.map((task) => (
                  <tr key={task.id} className="fade-in">
                    <td className="py-4">{task.title}</td>
                    <td className="py-4">{task.project?.name || 'N/A'}</td>
                    <td>
                      <span className={`status-badge task-status-${task.status.toLowerCase().replace(' ', '-')}`}>
                        {task.status}
                      </span>
                    </td>
                    <td>
                      <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-4">{task.dueDate || 'N/A'}</td>
                    <td className="flex space-x-2">
                      <button
                        onClick={() => window.location.href = `/tasks/${task.id}`}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-white/70 text-sm transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;