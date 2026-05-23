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
    if (window.confirm('Are you sure you want to delete this project?')) {
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
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full border-4 border-t-white border-b-white h-12 w-12"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-500/20 border border-red-500/50 text-red-500 rounded-lg p-4 mb-6">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-white/50">Project not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setEditing(!editing)}
            className={`glass-button hover:glass-button px-4 py-2 rounded-lg text-sm font-medium text-white ${editing ? 'bg-white/20' : ''}`}
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 text-sm font-medium transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Project Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="glass-panel p-6">
          <h3 className="text-sm font-medium text-white/70 mb-2">Client</h3>
          <p className="text-white text-lg">{project.clientName}</p>
        </div>
        <div className="glass-panel p-6">
          <h3 className="text-sm font-medium text-white/70 mb-2">Status</h3>
          <span className={`status-badge status-${project.status.toLowerCase().replace(' ', '-')}`}>
            {project.status}
          </span>
        </div>
        <div className="glass-panel p-6">
          <h3 className="text-sm font-medium text-white/70 mb-2">Budget</h3>
          <p className="text-white text-lg">${project.budget ? Number(project.budget).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : 'N/A'}</p>
        </div>
      </div>

      {/* Project Details */}
      <div className="glass-panel p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Project Details</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-white/70 mb-1">Start Date</p>
            <p className="text-white">{project.startDate}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-white/70 mb-1">End Date</p>
            <p className="text-white">{project.endDate || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-white/70 mb-1">Description</p>
            <p className="text-white/90 whitespace-pre-line">{project.description || 'No description provided.'}</p>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="glass-panel p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Edit Project</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">Project Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">Client Name</label>
                <input
                  type="text"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                >
                  <option value="active">Active</option>
                  <option value="on hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">Budget ($)</label>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 text-sm transition-colors"
              >
                Cancel
              </button>
              <button type="submit" className="px-6 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white font-medium text-sm transition-colors">
                Update Project
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tasks Section */}
      <div className="glass-panel p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Tasks ({tasks.length})</h2>
          <button 
            onClick={() => {
              // Navigate to tasks page with filter for this project
              navigate(`/tasks?projectId=${id}`);
            }}
            className="glass-button hover:glass-button px-4 py-2 rounded-lg text-sm font-medium text-white"
          >
            View All Tasks
          </button>
        </div>
        {tasks.length === 0 ? (
          <p className="text-white/50 text-center py-8">No tasks found for this project.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full whitespace-nowrap">
              <thead>
                <tr>
                  <th>Task Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id} className="fade-in">
                    <td className="py-4">{task.title}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;