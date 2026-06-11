import React, { useEffect, useState } from 'react';
import { getTasks, createTask, updateTask, deleteTask, getProjects } from '../utils/api';
import { useNavigate, useSearchParams } from 'react-router-dom';

const TasksList = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  const [searchParams] = useSearchParams();
  const filterProjectId = searchParams.get('projectId');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    dueDate: '',
    projectId: filterProjectId || ''
  });
  
  const [editingId, setEditingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [filterProjectId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = filterProjectId ? { projectId: filterProjectId } : {};
      const [tasksResponse, projectsResponse] = await Promise.all([
        getTasks(params),
        getProjects()
      ]);
      setTasks(tasksResponse.data.tasks);
      setProjects(projectsResponse.data.projects);
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateTask(editingId, formData);
        setEditingId(null);
      } else {
        await createTask(formData);
      }
      setFormData({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        dueDate: '',
        projectId: filterProjectId || ''
      });
      setShowForm(false);
      // Refresh tasks
      const params = filterProjectId ? { projectId: filterProjectId } : {};
      const response = await getTasks(params);
      setTasks(response.data.tasks);
    } catch (err) {
      setError(err.message || 'Failed to save task');
    }
  };

  const handleEdit = (task) => {
    setEditingId(task.id);
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate || '',
      projectId: task.projectId
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذه المهمة؟')) {
      try {
        await deleteTask(id);
        // Refresh tasks
        const params = filterProjectId ? { projectId: filterProjectId } : {};
        const response = await getTasks(params);
        setTasks(response.data.tasks);
      } catch (err) {
        setError(err.message || 'Failed to delete task');
      }
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
      </div>
    );
  }

  // Get active project name if filtered
  const activeFilterProjectName = filterProjectId 
    ? projects.find(p => String(p.id) === String(filterProjectId))?.name 
    : null;

  return (
    <div style={styles.wrapper}>
      {error && (
        <div style={styles.errorBanner}>
          <span className="material-symbols-rounded">warning</span>
          <span>{error}</span>
        </div>
      )}

      <div style={styles.headerSection}>
        <div>
          {filterProjectId && (
            <button onClick={() => navigate('/tasks')} style={styles.clearFilterBtn}>
              <span className="material-symbols-rounded">close</span>
              <span>عرض جميع المهام (إلغاء التصفية)</span>
            </button>
          )}
          <h2 style={styles.pageTitle}>
            {activeFilterProjectName 
              ? `مهام مشروع: ${activeFilterProjectName} (${tasks.length})` 
              : `قائمة المهام (${tasks.length})`}
          </h2>
        </div>
        <button 
          onClick={() => {
            if (showForm && !editingId) {
              setShowForm(false);
            } else {
              setEditingId(null);
              setFormData({
                title: '',
                description: '',
                status: 'todo',
                priority: 'medium',
                dueDate: '',
                projectId: filterProjectId || ''
              });
              setShowForm(true);
            }
          }}
          className="glass-button"
          style={{
            ...styles.newButton,
            backgroundColor: showForm && !editingId ? 'rgba(239, 68, 68, 0.15)' : 'var(--gold-dim)',
            borderColor: showForm && !editingId ? '#ef4444' : 'var(--gold)',
            color: showForm && !editingId ? '#ef4444' : 'var(--gold)'
          }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>
            {showForm && !editingId ? 'close' : 'add'}
          </span>
          <span>{showForm && !editingId ? 'إغلاق النموذج' : 'مهمة جديدة'}</span>
        </button>
      </div>

      {/* Task Form */}
      {showForm && (
        <div className="glass-panel fade-in" style={styles.formCard}>
          <h3 style={styles.formTitle}>
            {editingId ? 'تعديل بيانات المهمة' : 'إنشاء مهمة جديدة'}
          </h3>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formRow}>
              <div style={styles.formField}>
                <label style={styles.label}>عنوان المهمة *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="مثال: تصميم واجهة المستخدم"
                  style={styles.input}
                />
              </div>
              <div style={styles.formField}>
                <label style={styles.label}>المشروع المرتبط *</label>
                <select
                  name="projectId"
                  value={formData.projectId}
                  onChange={handleChange}
                  required
                  style={styles.select}
                >
                  <option value="">اختار المشروع</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div style={styles.formRow}>
              <div style={styles.formField}>
                <label style={styles.label}>حالة المهمة *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  style={styles.select}
                >
                  <option value="todo">قيد الانتظار (To Do)</option>
                  <option value="in progress">جاري العمل (In Progress)</option>
                  <option value="review">مراجعة (Review)</option>
                  <option value="done">مكتمل (Done)</option>
                </select>
              </div>
              <div style={styles.formField}>
                <label style={styles.label}>الأهمية / الأولية *</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  style={styles.select}
                >
                  <option value="low">منخفضة (Low)</option>
                  <option value="medium">متوسطة (Medium)</option>
                  <option value="high">عالية (High)</option>
                </select>
              </div>
            </div>

            <div style={styles.formField}>
              <label style={styles.label}>تاريخ الاستحقاق</label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            <div style={styles.formFieldFull}>
              <label style={styles.label}>الوصف وتفاصيل المهمة</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                placeholder="تفاصيل ونقاط العمل الخاصة بالمهمة..."
                style={styles.textarea}
              />
            </div>

            <div style={styles.formActions}>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="glass-button"
                style={styles.cancelButton}
              >
                إلغاء
              </button>
              <button type="submit" className="glass-button" style={styles.submitButton}>
                {editingId ? 'تحديث المهمة' : 'إنشاء المهمة'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tasks Table */}
      <div className="glass-panel" style={styles.tableCard}>
        {tasks.length === 0 ? (
          <div style={styles.emptyState}>
            <span className="material-symbols-rounded" style={styles.emptyIcon}>playlist_add_check</span>
            <p>لا توجد مهام مضافة حالياً.</p>
          </div>
        ) : (
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
                {tasks.map((task) => (
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
                      <div style={styles.rowActions}>
                        <button
                          onClick={() => handleEdit(task)}
                          className="glass-button"
                          style={styles.editBtn}
                          title="تعديل"
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="glass-button"
                          style={styles.deleteBtn}
                          title="حذف"
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
    padding: '12px 20px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
  },
  headerSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearFilterBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'none',
    border: 'none',
    color: '#c8a35c',
    cursor: 'pointer',
    fontSize: '11px',
    fontFamily: 'Cairo, sans-serif',
    padding: '0 0 6px 0',
    fontWeight: '600',
  },
  pageTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#e8e8ed',
    margin: 0,
  },
  newButton: {
    padding: '10px 18px',
    borderRadius: '10px',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  formCard: {
    padding: '24px',
  },
  formTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#c8a35c',
    marginBottom: '20px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    paddingBottom: '10px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  formField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formFieldFull: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#a8a8b3',
  },
  input: {
    width: '100%',
  },
  select: {
    width: '100%',
  },
  textarea: {
    width: '100%',
    resize: 'vertical',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '10px',
  },
  cancelButton: {
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '13px',
  },
  submitButton: {
    padding: '10px 24px',
    borderRadius: '8px',
    fontSize: '13px',
    backgroundColor: 'var(--gold) !important',
    color: '#000 !important',
    border: 'none !important',
  },
  tableCard: {
    padding: '16px 0',
  },
  tableWrapper: {
    overflowX: 'auto',
    width: '100%',
  },
  rowActions: {
    display: 'flex',
    gap: '8px',
  },
  editBtn: {
    padding: '6px',
    borderRadius: '6px',
  },
  deleteBtn: {
    padding: '6px',
    borderRadius: '6px',
    backgroundColor: 'rgba(239, 68, 68, 0.1) !important',
    color: '#ef4444 !important',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#6b6b75',
  },
  emptyIcon: {
    fontSize: '44px',
    color: '#6b6b75',
    marginBottom: '12px',
  }
};

export default TasksList;