let app;

try {
  // Try to import the full Express app with database
  app = require('../backend/src/server');
} catch (err) {
  // If database is not available, create a minimal API with mock data
  const express = require('express');
  app = express();
  
  app.use(express.json());
  
  const vixAiRoutes = require('../backend/src/routes/vixAi.routes');
  app.use('/api/vix-ai', vixAiRoutes);
  
  // Mock projects data
  const projects = [
    { id: 1, name: 'Website Redesign', clientName: 'ABC Corp', status: 'active', startDate: '2026-05-01', endDate: '2026-06-30', budget: 15000, description: 'Complete redesign of corporate website' },
    { id: 2, name: 'Mobile App Development', clientName: 'XYZ Startup', status: 'active', startDate: '2026-04-15', endDate: '2026-08-15', budget: 75000, description: 'Cross-platform mobile application' },
    { id: 3, name: 'API Integration', clientName: 'DEF Enterprises', status: 'completed', startDate: '2026-03-01', endDate: '2026-04-30', budget: 25000, description: 'Third-party API integration' },
    { id: 4, name: 'Dashboard MVP', clientName: 'Vixcell Internal', status: 'active', startDate: '2026-05-10', endDate: '2026-06-10', budget: 5000, description: 'Internal project management dashboard' }
  ];
  
  const tasks = [
    { id: 1, title: 'Design Landing Page', status: 'in progress', priority: 'high', dueDate: '2026-05-25', projectId: 1, project: { name: 'Website Redesign' } },
    { id: 2, title: 'Implement Responsive Navbar', status: 'todo', priority: 'medium', dueDate: '2026-05-28', projectId: 1, project: { name: 'Website Redesign' } },
    { id: 3, title: 'Setup React Native Project', status: 'done', priority: 'high', dueDate: '2026-04-20', projectId: 2, project: { name: 'Mobile App Development' } },
    { id: 4, title: 'Implement Authentication Flow', status: 'in progress', priority: 'high', dueDate: '2026-05-28', projectId: 2, project: { name: 'Mobile App Development' } },
    { id: 5, title: 'Payment Gateway Integration', status: 'done', priority: 'high', dueDate: '2026-04-15', projectId: 3, project: { name: 'API Integration' } },
    { id: 6, title: 'Create Frontend Dashboard', status: 'in progress', priority: 'high', dueDate: '2026-05-25', projectId: 4, project: { name: 'Dashboard MVP' } }
  ];
  
  // Projects routes
  app.get('/api/projects', (req, res) => {
    const { status } = req.query;
    let filtered = projects;
    if (status) filtered = projects.filter(p => p.status === status);
    res.json({ projects: filtered, total: filtered.length, page: 1, totalPages: 1 });
  });
  
  app.get('/api/projects/stats', (req, res) => {
    res.json({
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'active').length,
      completedProjects: projects.filter(p => p.status === 'completed').length,
      averageBudget: projects.reduce((sum, p) => sum + p.budget, 0) / projects.length
    });
  });
  
  app.get('/api/projects/:id', (req, res) => {
    const project = projects.find(p => p.id === parseInt(req.params.id));
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ ...project, tasks: tasks.filter(t => t.projectId === parseInt(req.params.id)) });
  });
  
  app.post('/api/projects', (req, res) => {
    const project = { id: projects.length + 1, ...req.body, tasks: [] };
    projects.push(project);
    res.status(201).json(project);
  });
  
  // Tasks routes
  app.get('/api/tasks', (req, res) => {
    const { projectId } = req.query;
    let filtered = tasks;
    if (projectId) filtered = tasks.filter(t => t.projectId === parseInt(projectId));
    res.json({ tasks: filtered, total: filtered.length, page: 1, totalPages: 1 });
  });
  
  app.get('/api/tasks/stats', (req, res) => {
    res.json({
      totalTasks: tasks.length,
      todoTasks: tasks.filter(t => t.status === 'todo').length,
      inProgressTasks: tasks.filter(t => t.status === 'in progress').length,
      reviewTasks: tasks.filter(t => t.status === 'review').length,
      doneTasks: tasks.filter(t => t.status === 'done').length
    });
  });
  
  app.get('/api/tasks/:id', (req, res) => {
    const task = tasks.find(t => t.id === parseInt(req.params.id));
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  });
  
  app.post('/api/tasks', (req, res) => {
    const task = { id: tasks.length + 1, ...req.body };
    tasks.push(task);
    res.status(201).json(task);
  });
  
  // Health check
  app.get('/api/', (req, res) => {
    res.json({ message: 'Vixcell API is running (mock mode)' });
  });
}

module.exports = app;