import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => {
  return (
    <aside className="glass-panel-dark w-64 border-r border-white/20">
      <div className="px-4 pt-5 pb-3">
        <Link to="/" className="flex items-center space-x-3 mb-5">
          <span className="text-xl font-bold text-white">Vixcell</span>
        </Link>
        <nav className="space-y-1">
          <Link
            to="/"
            className="flex items-center px-3 py-2 rounded-md text-sm font-medium 
                       hover:bg-white/10 hover:bg-opacity-10 transition-colors"
          >
            <span className="flex-shrink-0">📊</span>
            <span className="ml-3 whitespace-nowrap">Dashboard</span>
          </Link>
          <Link
            to="/projects"
            className="flex items-center px-3 py-2 rounded-md text-sm font-medium 
                       hover:bg-white/10 hover:bg-opacity-10 transition-colors"
          >
            <span className="flex-shrink-0">📁</span>
            <span className="ml-3 whitespace-nowrap">Projects</span>
          </Link>
          <Link
            to="/tasks"
            className="flex items-center px-3 py-2 rounded-md text-sm font-medium 
                       hover:bg-white/10 hover:bg-opacity-10 transition-colors"
          >
            <span className="flex-shrink-0">✅</span>
            <span className="ml-3 whitespace-nowrap">Tasks</span>
          </Link>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;