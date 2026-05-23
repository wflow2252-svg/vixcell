import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="glass-panel-dark mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <span className="text-2xl font-bold text-white">Vixcell Dashboard</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/" className="glass-button hover:glass-button px-4 py-2 rounded-lg text-sm font-medium text-white">Dashboard</Link>
            <Link to="/projects" className="glass-button hover:glass-button px-4 py-2 rounded-lg text-sm font-medium text-white">Projects</Link>
            <Link to="/tasks" className="glass-button hover:glass-button px-4 py-2 rounded-lg text-sm font-medium text-white">Tasks</Link>
            {/* User profile placeholder */}
            <div className="relative">
              <span className="text-white">Welcome, Admin</span>
              <div className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-lg rounded-lg border border-white/20 p-4 hidden">
                <p className="mb-2">Settings</p>
                <p className="mb-2">Logout</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;