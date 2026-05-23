'use strict';
const { Project, Task } = require('../models');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create sample projects
    const projects = await Project.bulkCreate([
      {
        name: 'Website Redesign',
        clientName: 'ABC Corp',
        status: 'active',
        startDate: '2026-05-01',
        endDate: '2026-06-30',
        budget: 15000,
        description: 'Complete redesign of corporate website with modern UI/UX principles'
      },
      {
        name: 'Mobile App Development',
        clientName: 'XYZ Startup',
        status: 'in progress',
        startDate: '2026-04-15',
        endDate: '2026-08-15',
        budget: 75000,
        description: 'Cross-platform mobile application for iOS and Android'
      },
      {
        name: 'API Integration',
        clientName: 'DEF Enterprises',
        status: 'completed',
        startDate: '2026-03-01',
        endDate: '2026-04-30',
        budget: 25000,
        description: 'Integration of third-party payment gateway and shipping APIs'
      },
      {
        name: 'Dashboard MVP',
        clientName: 'Vixcell Internal',
        status: 'active',
        startDate: '2026-05-10',
        endDate: '2026-06-10',
        budget: 5000,
        description: 'Minimum viable product for internal project management dashboard'
      }
    ]);

    // Create sample tasks for each project
    const tasks = [
      // Website Redesign tasks
      {
        title: 'Design Landing Page',
        description: 'Create high-fidelity mockups for the homepage',
        status: 'in progress',
        priority: 'high',
        dueDate: '2026-05-25',
        projectId: projects[0].id
      },
      {
        title: 'Implement Responsive Navbar',
        description: 'Develop navigation component that works on all device sizes',
        status: 'todo',
        priority: 'medium',
        dueDate: '2026-05-28',
        projectId: projects[0].id
      },
      {
        title: 'Optimize Image Loading',
        description: 'Implement lazy loading and WebP format for better performance',
        status: 'review',
        priority: 'medium',
        dueDate: '2026-05-30',
        projectId: projects[0].id
      },
      
      // Mobile App Development tasks
      {
        title: 'Setup React Native Project',
        description: 'Initialize project with TypeScript and navigation',
        status: 'done',
        priority: 'high',
        dueDate: '2026-04-20',
        projectId: projects[1].id
      },
      {
        title: 'Implement Authentication Flow',
        description: 'Create login, signup, and password reset screens',
        status: 'in progress',
        priority: 'high',
        dueDate: '2026-05-28',
        projectId: projects[1].id
      },
      {
        title: 'Integrate REST API',
        description: 'Connect to backend services for data fetching',
        status: 'todo',
        priority: 'medium',
        dueDate: '2026-06-10',
        projectId: projects[1].id
      },
      
      // API Integration tasks
      {
        title: 'Payment Gateway Integration',
        description: 'Integrate Stripe for payment processing',
        status: 'done',
        priority: 'high',
        dueDate: '2026-04-15',
        projectId: projects[2].id
      },
      {
        title: 'Shipping API Integration',
        description: 'Connect to FedEx and UPS APIs for rate calculation',
        status: 'done',
        priority: 'medium',
        dueDate: '2026-04-22',
        projectId: projects[2].id
      },
      {
        title: 'Security Audit',
        description: 'Perform penetration testing and vulnerability assessment',
        status: 'done',
        priority: 'high',
        dueDate: '2026-04-25',
        projectId: projects[2].id
      },
      
      // Dashboard MVP tasks
      {
        title: 'Design Database Schema',
        description: 'Create ER diagram for projects and tasks entities',
        status: 'done',
        priority: 'high',
        dueDate: '2026-05-12',
        projectId: projects[3].id
      },
      {
        title: 'Setup Backend API',
        description: 'Create Express server with Sequelize ORM',
        status: 'done',
        priority: 'high',
        dueDate: '2026-05-15',
        projectId: projects[3].id
      },
      {
        title: 'Create Frontend Dashboard',
        description: 'Build React interface with Tailwind CSS and Charts',
        status: 'in progress',
        priority: 'high',
        dueDate: '2026-05-25',
        projectId: projects[3].id
      }
    ];

    await Task.bulkCreate(tasks);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Tasks', null, {});
    await queryInterface.bulkDelete('Projects', null, {});
  }
};