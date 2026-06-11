import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ProjectsList from './pages/ProjectsList';
import ProjectDetail from './pages/ProjectDetail';
import TasksList from './pages/TasksList';

function App() {
  return (
    <Router>
      <div style={styles.appWrapper}>
        <Sidebar />
        <div style={styles.mainWrapper}>
          <Header />
          <main style={styles.mainContent}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/projects" element={<ProjectsList />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/tasks" element={<TasksList />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

const styles = {
  appWrapper: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#0c0c0e',
    color: '#e8e8ed',
    overflow: 'hidden',
    direction: 'rtl',
    fontFamily: "'Cairo', 'Outfit', sans-serif",
  },
  mainWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  mainContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
    backgroundColor: '#0c0c0e',
  }
};

export default App;