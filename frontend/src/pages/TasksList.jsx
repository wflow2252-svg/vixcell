import React, { useEffect, useState } from 'react';
import { getTasks, createTask, updateTask, deleteTask, getProjects } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const TasksList = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    dueDate: '',
    projectId: ''
  });
  const [editingId, setEditingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [tasksResponse, projectsResponse] = await Promise.all([
          getTasks(),
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

    fetchData();
  }, []);

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
        projectId: ''
      });
      // Refresh tasks
      const response = await getTasks();
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
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(id);
        // Refresh tasks
        const response = await getTasks();
        setTasks(response.data.tasks);
      } catch (err) {
        setError(err.message || 'Failed to delete task');
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
        <h1 className="text-2xl font-bold">Tasks Management</h1>
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({
              title: '',
              description: '',
              status: 'todo',
              priority: 'medium',
              dueDate: '',
              projectId: ''
            });
          }}
          className="glass-button hover:glass-button px-4 py-2 rounded-lg text-sm font-medium text-white"
        >
          New Task
        </button>
      </div>

      {/* Task Form */}
      <div className="glass-panel p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">{editingId ? 'Edit Task' : 'Create New Task'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">Task Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">Project</label>
              <select
                name="projectId"
                value={formData.projectId}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
              >
                <option value="">Select Project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
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
                <option value="todo">To Do</option>
                <option value="in progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-1">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">Due Date</label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white"
            />
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
                  title: '',
                  description: '',
                  status: 'todo',
                  priority: 'medium',
                  dueDate: '',
                  projectId: ''
                });
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 text-sm transition-colors"
            >
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white font-medium text-sm transition-colors">
              {editingId ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>

      {/* Tasks Table */}
      <div className="glass-panel p-6">
        <h2 className="text-xl font-semibold mb-4">Tasks List</h2>
        {tasks.length === 0 ? (
          <p className="text-white/50 text-center py-8">No tasks found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full whitespace-nowrap">
              <thead>
                <tr>
                  <th>Task Title</th>
                  <th>Project</th>
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
                        onClick={() => handleEdit(task)}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-white/70 text-sm transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-white/70 text-sm transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => navigate(`/tasks/${task.id}`)}
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

export default TasksList;