import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'لوحة التحكم';
    if (path === '/projects') return 'إدارة المشاريع';
    if (path.startsWith('/projects/')) return 'تفاصيل المشروع';
    if (path === '/tasks') return 'إدارة المهام';
    return 'لوحة التحكم';
  };

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <div style={styles.titleSection}>
          <h1 style={styles.title}>{getPageTitle()}</h1>
        </div>
        
        <div style={styles.userSection}>
          <div style={styles.userInfo}>
            <span style={styles.userRole}>مسؤول النظام</span>
            <span style={styles.userName}>أهلاً، حازم</span>
          </div>
          <div style={styles.avatar}>H</div>
        </div>
      </div>
    </header>
  );
};

const styles = {
  header: {
    height: '70px',
    backgroundColor: 'rgba(12, 12, 14, 0.85)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '0 24px',
    direction: 'rtl',
    fontFamily: "'Cairo', 'Outfit', sans-serif",
  },
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  titleSection: {
    display: 'flex',
    alignItems: 'center',
  },
  title: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#e8e8ed',
    margin: 0,
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  userName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#e8e8ed',
    lineHeight: '1.2',
  },
  userRole: {
    fontSize: '10px',
    color: '#6b6b75',
    fontWeight: '500',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: 'rgba(200, 163, 92, 0.15)',
    border: '1px solid rgba(200, 163, 92, 0.3)',
    color: '#c8a35c',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '14px',
  }
};

export default Header;