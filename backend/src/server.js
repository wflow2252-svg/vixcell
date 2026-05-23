const express = require('express');
const cors = require('cors');
require('dotenv').config();
const sequelize = require('./config/database');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Vixcell Dashboard API is running' });
});

// Sync database and start server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync all models
    await sequelize.sync();
    console.log('All models were synchronized successfully.');
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start the server:', error);
  }
};

startServer();

module.exports = app;