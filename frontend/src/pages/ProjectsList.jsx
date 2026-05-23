import React, { useEffect, useState } from 'react';
import { getProjects, createProject, updateProject, deleteProject } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const ProjectsList = () => {
  const [projects, setProjects] = useState([]);
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
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
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

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Projects Management</h1>
        <button 
          onClick={() => {
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
          }}
          className="glass-button hover:glass-button px-4 py-2 rounded-lg text-sm font-medium text-white"
        >
          New Project
        </button>
      </div>

      {/* Project Form */}
      <div className="glass-panel p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">{editingId ? 'Edit Project' : 'Create New Project'}</h2>
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
              onClick={() => {
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
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 text-sm transition-colors"
            >
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white font-medium text-sm transition-colors">
              {editingId ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>

      {/* Projects Table */}
      <div className="glass-panel p-6">
        <h2 className="text-xl font-semibold mb-4">Projects List</h2>
        {projects.length === 0 ? (
          <p className="text-white/50 text-center py-8">No projects found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full whitespace-nowrap">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Budget</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id} className="fade-in">
                    <td className="py-4">{project.name}</td>
                    <td className="py-4">{project.clientName}</td>
                    <td>
                      <span className={`status-badge status-${project.status.toLowerCase().replace(' ', '-')}`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="py-4">{project.startDate}</td>
                    <td className="py-4">{project.endDate || 'N/A'}</td>
                    <td className="py-4">${project.budget ? Number(project.budget).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : 'N/A'}</td>
                    <td className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(project)}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-white/70 text-sm transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-white/70 text-sm transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => navigate(`/projects/${project.id}`)}
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

export default ProjectsList;