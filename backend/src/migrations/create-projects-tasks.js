'use strict';
const { QueryInterface } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Projects', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      clientName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('active', 'on hold', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'active'
      },
      startDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      endDate: {
        type: Sequelize.DATEONLY
      },
      budget: {
        type: Sequelize.DECIMAL(10, 2)
      },
      description: {
        type: Sequelize.TEXT
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
    
    await queryInterface.createTable('Tasks', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT
      },
      status: {
        type: Sequelize.ENUM('todo', 'in progress', 'review', 'done'),
        allowNull: false,
        defaultValue: 'todo'
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high'),
        allowNull: false,
        defaultValue: 'medium'
      },
      dueDate: {
        type: Sequelize.DATEONLY
      },
      projectId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Projects',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Tasks');
    await queryInterface.dropTable('Projects');
  }
};