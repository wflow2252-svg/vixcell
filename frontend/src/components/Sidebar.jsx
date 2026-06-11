import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'لوحة التحكم', icon: 'dashboard', engLabel: 'Dashboard' },
    { path: '/projects', label: 'المشاريع', icon: 'folder', engLabel: 'Projects' },
    { path: '/tasks', label: 'المهام', icon: 'task_alt', engLabel: 'Tasks' },
  ];

  return (
    <aside style={styles.aside}>
      <div style={styles.brandContainer}>
        <Link to="/" style={styles.brandLink}>
          <img src="/logo.png" alt="VIXCELL" style={styles.logo} onError={(e) => { e.target.style.display = 'none'; }} />
          <span style={styles.brandText}>VIXCELL</span>
        </Link>
      </div>

      <nav style={styles.nav}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className="vx-sidebar-link"
              style={{
                ...styles.link,
                ...(isActive ? styles.activeLink : {}),
              }}
            >
              <span 
                className="material-symbols-rounded" 
                style={{ 
                  ...styles.icon,
                  ...(isActive ? styles.activeIcon : {})
                }}
              >
                {item.icon}
              </span>
              <div style={styles.labelContainer}>
                <span style={styles.label}>{item.label}</span>
                <span style={styles.subLabel}>{item.engLabel}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div style={styles.footer}>
        <span style={styles.version}>vixcell-os v1.0.0</span>
      </div>
    </aside>
  );
};

const styles = {
  aside: {
    width: '260px',
    backgroundColor: '#131316',
    borderRight: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    direction: 'rtl',
    fontFamily: "'Cairo', 'Outfit', sans-serif",
  },
  brandContainer: {
    padding: '24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  brandLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    textDecoration: 'none',
  },
  logo: {
    height: '28px',
    objectFit: 'contain',
  },
  brandText: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#c8a35c',
    letterSpacing: '0.05em',
  },
  nav: {
    flex: 1,
    padding: '20px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '12px 16px',
    borderRadius: '12px',
    textDecoration: 'none',
    color: '#a8a8b3',
    transition: 'all 0.25s ease',
  },
  activeLink: {
    backgroundColor: 'rgba(200, 163, 92, 0.12)',
    color: '#c8a35c',
  },
  icon: {
    fontSize: '22px',
    color: '#6b6b75',
    transition: 'all 0.25s ease',
  },
  activeIcon: {
    color: '#c8a35c',
  },
  labelContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    lineHeight: '1.2',
  },
  subLabel: {
    fontSize: '10px',
    color: '#6b6b75',
    fontWeight: '400',
  },
  footer: {
    padding: '20px 24px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  },
  version: {
    fontSize: '11px',
    color: '#6b6b75',
  }
};

export default Sidebar;