'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Project extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Project.hasMany(models.Task, {
        foreignKey: 'projectId',
        as: 'tasks'
      });
    }
  }
  Project.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    clientName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'on hold', 'completed', 'cancelled'),
      defaultValue: 'active'
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATEONLY
    },
    budget: {
      type: DataTypes.DECIMAL(10, 2)
    },
    description: {
      type: DataTypes.TEXT
    }
  }, {
    sequelize,
    modelName: 'Project',
  });
  return Project;
};