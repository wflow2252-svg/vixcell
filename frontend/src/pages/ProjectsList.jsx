import React, { useEffect, useState } from 'react';
import { getProjects, createProject, updateProject, deleteProject } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const ProjectsList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    clientName: '',
    status: 'active',
    startDate: '',
    endDate: '',
    budget: '',
    description: ''
  });
  const [editingId, setEditingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await getProjects();
      setProjects(response.data.projects);
    } catch (err) {
      setError(err.message || 'Failed to fetch projects');
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
        await updateProject(editingId, formData);
        setEditingId(null);
      } else {
        await createProject(formData);
      }
      setFormData({
        name: '',
        clientName: '',
        status: 'active',
        startDate: '',
        endDate: '',
        budget: '',
        description: ''
      });
      setShowForm(false);
      await fetchProjects();
    } catch (err) {
      setError(err.message || 'Failed to save project');
    }
  };

  const handleEdit = (project) => {
    setEditingId(project.id);
    setFormData({
      name: project.name,
      clientName: project.clientName,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate || '',
      budget: project.budget || '',
      description: project.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا المشروع؟')) {
      try {
        await deleteProject(id);
        await fetchProjects();
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

  return (
    <div style={styles.wrapper}>
      {error && (
        <div style={styles.errorBanner}>
          <span className="material-symbols-rounded">warning</span>
          <span>{error}</span>
        </div>
      )}

      <div style={styles.headerSection}>
        <h2 style={styles.pageTitle}>قائمة المشاريع ({projects.length})</h2>
        <button 
          onClick={() => {
            if (showForm && !editingId) {
              setShowForm(false);
            } else {
              setEditingId(null);
              setFormData({
                name: '',
                clientName: '',
                status: 'active',
                startDate: '',
                endDate: '',
                budget: '',
                description: ''
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
          <span>{showForm && !editingId ? 'إغلاق النموذج' : 'مشروع جديد'}</span>
        </button>
      </div>

      {/* Project Form (Toggled via button) */}
      {showForm && (
        <div className="glass-panel fade-in" style={styles.formCard}>
          <h3 style={styles.formTitle}>
            {editingId ? 'تعديل بيانات المشروع' : 'إنشاء مشروع جديد'}
          </h3>
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
                  placeholder="مثال: موقع فيكسل الجديد"
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
                  placeholder="مثال: شركة فيكسل للتقنية"
                  style={styles.input}
                />
              </div>
            </div>
            
            <div style={styles.formRow}>
              <div style={styles.formField}>
                <label style={styles.label}>حالة المشروع *</label>
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
                <label style={styles.label}>تاريخ الانتهاء المتوقع</label>
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
                  placeholder="مثال: 5000"
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
                placeholder="تفاصيل ونطاق العمل الخاص بالمشروع..."
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
                {editingId ? 'تحديث المشروع' : 'إنشاء المشروع'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects Table */}
      <div className="glass-panel" style={styles.tableCard}>
        {projects.length === 0 ? (
          <div style={styles.emptyState}>
            <span className="material-symbols-rounded" style={styles.emptyIcon}>folder_off</span>
            <p>لا توجد مشاريع مضافة حالياً.</p>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>اسم المشروع</th>
                  <th>العميل</th>
                  <th>الحالة</th>
                  <th>تاريخ البدء</th>
                  <th>تاريخ الانتهاء</th>
                  <th>الميزانية</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id} className="fade-in">
                    <td style={{ fontWeight: '600' }}>{project.name}</td>
                    <td>{project.clientName}</td>
                    <td>
                      <span className={`status-badge status-${project.status.toLowerCase().replace(' ', '-')}`}>
                        {project.status === 'active' ? 'نشط' :
                         project.status === 'on hold' ? 'قيد الانتظار' :
                         project.status === 'completed' ? 'مكتمل' :
                         project.status === 'cancelled' ? 'ملغي' : project.status}
                      </span>
                    </td>
                    <td>{project.startDate}</td>
                    <td>{project.endDate || '—'}</td>
                    <td style={{ fontWeight: '500' }}>
                      {project.budget ? `$${Number(project.budget).toLocaleString()}` : '—'}
                    </td>
                    <td>
                      <div style={styles.rowActions}>
                        <button
                          onClick={() => handleEdit(project)}
                          className="glass-button"
                          style={styles.editBtn}
                          title="تعديل"
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>edit</span>
                        </button>
                        <button
                          onClick={() => navigate(`/projects/${project.id}`)}
                          className="glass-button"
                          style={styles.viewBtn}
                          title="عرض التفاصيل"
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>visibility</span>
                        </button>
                        <button
                          onClick={() => handleDelete(project.id)}
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
  viewBtn: {
    padding: '6px',
    borderRadius: '6px',
    backgroundColor: 'rgba(26, 115, 232, 0.1) !important',
    color: '#1a73e8 !important',
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

export default ProjectsList;