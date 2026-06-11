import React, { useEffect, useState } from 'react';
import { getProjectById, updateProject, deleteProject, getTasks } from '../utils/api';
import { useNavigate, useParams } from 'react-router-dom';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    clientName: '',
    status: 'active',
    startDate: '',
    endDate: '',
    budget: '',
    description: ''
  });
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const [projectResponse, tasksResponse] = await Promise.all([
          getProjectById(id),
          getTasks({ projectId: id })
        ]);
        setProject(projectResponse.data);
        setTasks(tasksResponse.data.tasks);
        // Populate form data for editing
        setFormData({
          name: projectResponse.data.name,
          clientName: projectResponse.data.clientName,
          status: projectResponse.data.status,
          startDate: projectResponse.data.startDate,
          endDate: projectResponse.data.endDate || '',
          budget: projectResponse.data.budget || '',
          description: projectResponse.data.description || ''
        });
      } catch (err) {
        setError(err.message || 'Failed to fetch project');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProject(id, formData);
      setEditing(false);
      // Update project state
      setProject(prev => ({ ...prev, ...formData, endDate: formData.endDate || null }));
    } catch (err) {
      setError(err.message || 'Failed to update project');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا المشروع نهائياً؟')) {
      try {
        await deleteProject(id);
        navigate('/projects');
      } catch (err) {
        setError(err.message || 'Failed to delete project');
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

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorCard}>
          <span className="material-symbols-rounded" style={styles.errorIcon}>error</span>
          <h2 style={styles.errorTitle}>خطأ في تحميل بيانات المشروع</h2>
          <p style={styles.errorText}>{error}</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={styles.errorContainer}>
        <p style={{ color: '#6b6b75' }}>المشروع المطلوب غير موجود.</p>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.headerSection}>
        <div style={styles.titleArea}>
          <button onClick={() => navigate('/projects')} style={styles.backBtn}>
            <span className="material-symbols-rounded">arrow_forward</span>
            <span>العودة للمشاريع</span>
          </button>
          <h2 style={styles.pageTitle}>{project.name}</h2>
        </div>
        <div style={styles.headerActions}>
          <button
            onClick={() => setEditing(!editing)}
            className="glass-button"
            style={{
              ...styles.editBtn,
              borderColor: editing ? 'var(--gold)' : 'rgba(255,255,255,0.08)',
              backgroundColor: editing ? 'var(--gold-dim)' : 'transparent',
              color: editing ? 'var(--gold)' : '#e8e8ed'
            }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>
              {editing ? 'close' : 'edit'}
            </span>
            <span>{editing ? 'إلغاء التعديل' : 'تعديل المشروع'}</span>
          </button>
          <button
            onClick={handleDelete}
            className="glass-button"
            style={styles.deleteBtn}
          >
            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>delete</span>
            <span>حذف المشروع</span>
          </button>
        </div>
      </div>

      {/* Edit Form (if editing is active) */}
      {editing && (
        <div className="glass-panel fade-in" style={styles.formCard}>
          <h3 style={styles.formTitle}>تعديل بيانات المشروع</h3>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formRow}>
              <div style={styles.formField}>
                <label style={styles.label}>اسم المشروع *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formField}>
                <label style={styles.label}>اسم العميل *</label>
                <input
                  type="text"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
              </div>
            </div>
            
            <div style={styles.formRow}>
              <div style={styles.formField}>
                <label style={styles.label}>الحالة *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  style={styles.select}
                >
                  <option value="active">نشط (Active)</option>
                  <option value="on hold">قيد الانتظار (On Hold)</option>
                  <option value="completed">مكتمل (Completed)</option>
                  <option value="cancelled">ملغي (Cancelled)</option>
                </select>
              </div>
              <div style={styles.formField}>
                <label style={styles.label}>تاريخ البدء *</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formField}>
                <label style={styles.label}>تاريخ الانتهاء</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.formField}>
                <label style={styles.label}>الميزانية ($)</label>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.formFieldFull}>
              <label style={styles.label}>الوصف وتفاصيل المشروع</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                style={styles.textarea}
              />
            </div>

            <div style={styles.formActions}>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="glass-button"
                style={styles.cancelFormBtn}
              >
                إلغاء
              </button>
              <button type="submit" className="glass-button" style={styles.submitBtn}>
                حفظ التعديلات
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Project Info Cards */}
      <div style={styles.infoGrid}>
        <div className="glass-panel" style={styles.infoCard}>
          <span style={styles.infoLabel}>العميل</span>
          <p style={styles.infoValue}>{project.clientName}</p>
        </div>
        <div className="glass-panel" style={styles.infoCard}>
          <span style={styles.infoLabel}>حالة المشروع</span>
          <div style={{ marginTop: '8px' }}>
            <span className={`status-badge status-${project.status.toLowerCase().replace(' ', '-')}`}>
              {project.status === 'active' ? 'نشط' :
               project.status === 'on hold' ? 'قيد الانتظار' :
               project.status === 'completed' ? 'مكتمل' :
               project.status === 'cancelled' ? 'ملغي' : project.status}
            </span>
          </div>
        </div>
        <div className="glass-panel" style={styles.infoCard}>
          <span style={styles.infoLabel}>الميزانية</span>
          <p style={styles.infoValue}>
            {project.budget ? `$${Number(project.budget).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}` : '—'}
          </p>
        </div>
      </div>

      {/* Project Details */}
      <div className="glass-panel" style={styles.detailsCard}>
        <h3 style={styles.sectionTitle}>تفاصيل المشروع</h3>
        <div style={styles.detailsGrid}>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>تاريخ البدء</span>
            <p style={styles.detailValue}>{project.startDate}</p>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>تاريخ الانتهاء المتوقع</span>
            <p style={styles.detailValue}>{project.endDate || '—'}</p>
          </div>
          <div style={styles.detailItemFull}>
            <span style={styles.detailLabel}>الوصف</span>
            <p style={styles.descriptionText}>{project.description || 'لا يوجد وصف مضاف.'}</p>
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="glass-panel" style={styles.tasksCard}>
        <div style={styles.tasksHeader}>
          <h3 style={styles.sectionTitle}>مهام المشروع ({tasks.length})</h3>
          <button 
            onClick={() => navigate(`/tasks?projectId=${id}`)}
            className="glass-button"
            style={styles.tasksAllBtn}
          >
            عرض جميع مهام المشروع
          </button>
        </div>
        
        {tasks.length === 0 ? (
          <div style={styles.emptyState}>
            <span className="material-symbols-rounded" style={styles.emptyIcon}>task</span>
            <p>لا توجد مهام مضافة للمشروع حالياً.</p>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>عنوان المهمة</th>
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
                        style={styles.viewTaskBtn}
                      >
                        عرض
                      </button>
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
  headerSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '16px',
  },
  titleArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    alignItems: 'flex-start',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'none',
    border: 'none',
    color: '#a8a8b3',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    fontFamily: 'Cairo, sans-serif',
    padding: 0,
  },
  pageTitle: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#e8e8ed',
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
  },
  editBtn: {
    padding: '10px 18px',
    borderRadius: '10px',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  deleteBtn: {
    padding: '10px 18px',
    borderRadius: '10px',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(239, 68, 68, 0.1) !important',
    borderColor: 'rgba(239, 68, 68, 0.3) !important',
    color: '#ef4444 !important',
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
  cancelFormBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '13px',
  },
  submitBtn: {
    padding: '10px 24px',
    borderRadius: '8px',
    fontSize: '13px',
    backgroundColor: 'var(--gold) !important',
    color: '#000 !important',
    border: 'none !important',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
  },
  infoCard: {
    padding: '20px 24px',
  },
  infoLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#a8a8b3',
  },
  infoValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#e8e8ed',
    margin: '8px 0 0',
  },
  detailsCard: {
    padding: '24px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#e8e8ed',
    margin: '0 0 20px',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  detailItemFull: {
    gridColumn: '1 / -1',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    borderTop: '1px solid rgba(255,255,255,0.04)',
    paddingTop: '16px',
    marginTop: '8px',
  },
  detailLabel: {
    fontSize: '12px',
    color: '#6b6b75',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: '14px',
    color: '#e8e8ed',
    fontWeight: '600',
    margin: 0,
  },
  descriptionText: {
    fontSize: '14px',
    color: '#a8a8b3',
    lineHeight: '1.7',
    margin: 0,
    whiteSpace: 'pre-wrap',
  },
  tasksCard: {
    padding: '24px 0',
  },
  tasksHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 24px',
    marginBottom: '20px',
  },
  tasksAllBtn: {
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '12px',
  },
  tableWrapper: {
    overflowX: 'auto',
    width: '100%',
  },
  viewTaskBtn: {
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '12px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#6b6b75',
  },
  emptyIcon: {
    fontSize: '40px',
    color: '#6b6b75',
    marginBottom: '10px',
  }
};

export default ProjectDetail;