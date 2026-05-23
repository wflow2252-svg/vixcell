'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Task extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Task.belongsTo(models.Project, {
        foreignKey: 'projectId',
        as: 'project'
      });
    }
  }
  Task.init({
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    status: {
      type: DataTypes.ENUM('todo', 'in progress', 'review', 'done'),
      defaultValue: 'todo'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium'
    },
    dueDate: {
      type: DataTypes.DATEONLY
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Projects',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Task',
  });
  return Task;
};