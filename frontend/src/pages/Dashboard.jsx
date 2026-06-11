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
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorCard}>
          <span className="material-symbols-rounded" style={styles.errorIcon}>error</span>
          <h2 style={styles.errorTitle}>حدث خطأ أثناء تحميل لوحة التحكم</h2>
          <p style={styles.errorText}>{error}</p>
        </div>
      </div>
    );
  }

  const pieData = [
    { name: 'نشط', value: projectStats?.activeProjects || 0 },
    { name: 'مكتمل', value: projectStats?.completedProjects || 0 },
    { name: 'قيد الانتظار', value: (projectStats?.totalProjects || 0) - ((projectStats?.activeProjects || 0) + (projectStats?.completedProjects || 0)) },
  ];

  const COLORS = ['#34a853', '#c8a35c', '#f59e0b'];

  const barData = [
    { name: 'قيد الانتظار', 'todo': taskStats?.todoTasks || 0 },
    { name: 'جاري العمل', 'in progress': taskStats?.inProgressTasks || 0 },
    { name: 'مراجعة', 'review': taskStats?.reviewTasks || 0 },
    { name: 'مكتمل', 'done': taskStats?.doneTasks || 0 }
  ];

  return (
    <div style={styles.wrapper}>
      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        {/* Total Projects */}
        <div className="glass-panel" style={styles.statCard}>
          <div style={styles.statCardHeader}>
            <div>
              <span style={styles.statLabel}>إجمالي المشاريع</span>
              <h3 style={styles.statValue}>{projectStats?.totalProjects || 0}</h3>
            </div>
            <div style={{ ...styles.statIconContainer, color: '#c8a35c', backgroundColor: 'rgba(200, 163, 92, 0.12)' }}>
              <span className="material-symbols-rounded">folder_open</span>
            </div>
          </div>
        </div>
        
        {/* Active Projects */}
        <div className="glass-panel" style={styles.statCard}>
          <div style={styles.statCardHeader}>
            <div>
              <span style={styles.statLabel}>المشاريع النشطة</span>
              <h3 style={styles.statValue}>{projectStats?.activeProjects || 0}</h3>
            </div>
            <div style={{ ...styles.statIconContainer, color: '#34a853', backgroundColor: 'rgba(52, 168, 83, 0.12)' }}>
              <span className="material-symbols-rounded">play_arrow</span>
            </div>
          </div>
        </div>
        
        {/* Completed Projects */}
        <div className="glass-panel" style={styles.statCard}>
          <div style={styles.statCardHeader}>
            <div>
              <span style={styles.statLabel}>المشاريع المكتملة</span>
              <h3 style={styles.statValue}>{projectStats?.completedProjects || 0}</h3>
            </div>
            <div style={{ ...styles.statIconContainer, color: '#1a73e8', backgroundColor: 'rgba(26, 115, 232, 0.12)' }}>
              <span className="material-symbols-rounded">check_circle</span>
            </div>
          </div>
        </div>
        
        {/* Average Budget */}
        <div className="glass-panel" style={styles.statCard}>
          <div style={styles.statCardHeader}>
            <div>
              <span style={styles.statLabel}>متوسط الميزانية</span>
              <h3 style={styles.statValue}>
                ${projectStats?.averageBudget ? Number(projectStats.averageBudget).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0}) : '0'}
              </h3>
            </div>
            <div style={{ ...styles.statIconContainer, color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.12)' }}>
              <span className="material-symbols-rounded">payments</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div style={styles.chartsGrid}>
        {/* Project Status Chart */}
        <div className="glass-panel" style={styles.chartCard}>
          <h3 style={styles.chartTitle}>توزيع حالة المشاريع</h3>
          <div style={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={styles.tooltipStyle}
                  itemStyle={{ color: '#e8e8ed' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(value) => <span style={{ color: '#a8a8b3', fontSize: '12px' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Status Chart */}
        <div className="glass-panel" style={styles.chartCard}>
          <h3 style={styles.chartTitle}>توزيع حالة المهام</h3>
          <div style={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={barData}
                margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#a8a8b3', fontSize: '11px' }} />
                <YAxis tick={{ fill: '#a8a8b3', fontSize: '11px' }} />
                <Tooltip 
                  contentStyle={styles.tooltipStyle}
                  itemStyle={{ color: '#e8e8ed' }}
                />
                <Legend 
                  iconType="rect"
                  formatter={(value) => {
                    if (value === 'todo') return <span style={{ color: '#a8a8b3', fontSize: '12px' }}>قيد الانتظار</span>;
                    if (value === 'in progress') return <span style={{ color: '#a8a8b3', fontSize: '12px' }}>جاري العمل</span>;
                    if (value === 'review') return <span style={{ color: '#a8a8b3', fontSize: '12px' }}>مراجعة</span>;
                    if (value === 'done') return <span style={{ color: '#a8a8b3', fontSize: '12px' }}>مكتمل</span>;
                    return value;
                  }}
                />
                <Bar dataKey="todo" name="todo" fill="#6b6b75" radius={[4, 4, 0, 0]} />
                <Bar dataKey="in progress" name="in progress" fill="#1a73e8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="review" name="review" fill="#a855f7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="done" name="done" fill="#34a853" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="glass-panel" style={styles.tableCard}>
        <div style={styles.tableHeaderSection}>
          <h3 style={styles.tableTitle}>المهام الأخيرة</h3>
          <button 
            onClick={() => window.location.href = '/tasks'}
            className="glass-button"
            style={styles.viewAllButton}
          >
            عرض جميع المهام
          </button>
        </div>
        <div style={styles.tableWrapper}>
          <table className="data-table">
            <thead>
              <tr>
                <th>عنوان المهمة</th>
                <th>المشروع</th>
                <th>الحالة</th>
                <th>الأهمية</th>
                <th>تاريخ الاستحقاق</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {recentTasks.length === 0 ? (
                <tr>
                  <td colSpan="6" style={styles.emptyCell}>
                    لا توجد مهام حالية.
                  </td>
                </tr>
              ) : (
                recentTasks.map((task) => (
                  <tr key={task.id} className="fade-in">
                    <td style={{ fontWeight: '600' }}>{task.title}</td>
                    <td>{task.project?.name || '—'}</td>
                    <td>
                      <span className={`status-badge task-status-${task.status.toLowerCase().replace(' ', '-')}`}>
                        {task.status === 'todo' ? 'قيد الانتظار' :
                         task.status === 'in progress' ? 'جاري العمل' :
                         task.status === 'review' ? 'مراجعة' :
                         task.status === 'done' ? 'مكتمل' : task.status}
                      </span>
                    </td>
                    <td>
                      <span className={`priority-badge priority-${task.priority.toLowerCase()}`}>
                        {task.priority === 'low' ? 'منخفضة' :
                         task.priority === 'medium' ? 'متوسطة' :
                         task.priority === 'high' ? 'عالية' : task.priority}
                      </span>
                    </td>
                    <td>{task.dueDate || '—'}</td>
                    <td>
                      <button
                        onClick={() => window.location.href = `/tasks/${task.id}`}
                        className="glass-button"
                        style={styles.actionButton}
                      >
                        عرض
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

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    fontFamily: "'Cairo', 'Outfit', sans-serif",
  },
  loadingContainer: {
    display: 'flex',
    height: '60vh',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: '3px solid rgba(255, 255, 255, 0.05)',
    borderTopColor: '#c8a35c',
    animation: 'spin 1s linear infinite',
  },
  errorContainer: {
    display: 'flex',
    height: '60vh',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    padding: '32px',
    borderRadius: '16px',
    textAlign: 'center',
    maxWidth: '400px',
  },
  errorIcon: {
    fontSize: '48px',
    color: '#ef4444',
    marginBottom: '16px',
  },
  errorTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#e8e8ed',
    marginBottom: '8px',
  },
  errorText: {
    fontSize: '14px',
    color: '#a8a8b3',
    margin: 0,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
  },
  statCard: {
    padding: '24px',
  },
  statCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#a8a8b3',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#e8e8ed',
    margin: '4px 0 0',
  },
  statIconContainer: {
    width: '46px',
    height: '46px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px',
  },
  chartCard: {
    padding: '24px',
  },
  chartTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#e8e8ed',
    marginBottom: '20px',
  },
  chartContainer: {
    minHeight: '260px',
    width: '100%',
  },
  tooltipStyle: {
    backgroundColor: '#131316',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    fontFamily: 'Cairo, sans-serif',
    direction: 'rtl',
  },
  tableCard: {
    padding: '24px',
  },
  tableHeaderSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  tableTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#e8e8ed',
    margin: 0,
  },
  viewAllButton: {
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '12px',
  },
  tableWrapper: {
    overflowX: 'auto',
    width: '100%',
  },
  emptyCell: {
    textAlign: 'center',
    padding: '40px',
    color: '#6b6b75',
  },
  actionButton: {
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '12px',
  }
};

export default Dashboard;