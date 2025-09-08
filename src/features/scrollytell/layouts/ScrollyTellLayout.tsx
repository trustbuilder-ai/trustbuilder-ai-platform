import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ScrollyTellProvider, useScrollyTell } from '../context/ScrollyTellContext';
import './ScrollyTellLayout.css';

const ViewSelector: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentView, setCurrentView } = useScrollyTell();

  const handleViewChange = (view: 'scrollytell' | 'chat' | 'tree') => {
    setCurrentView(view);
    const basePath = '/scrollytell';
    if (view === 'scrollytell') {
      navigate(basePath);
    } else {
      navigate(`${basePath}/${view}`);
    }
  };

  const getActiveClass = (view: string) => {
    const currentPath = location.pathname;
    if (view === 'scrollytell' && currentPath === '/scrollytell') return 'active';
    if (currentPath === `/scrollytell/${view}`) return 'active';
    return '';
  };

  return (
    <div className="view-selector">
      <button 
        className={`view-btn ${getActiveClass('scrollytell')}`}
        onClick={() => handleViewChange('scrollytell')}
        title="ScrollyTell View"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="4" />
          <rect x="3" y="10" width="18" height="4" />
          <rect x="3" y="17" width="18" height="4" />
        </svg>
      </button>
      <button 
        className={`view-btn ${getActiveClass('chat')}`}
        onClick={() => handleViewChange('chat')}
        title="Chat View"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
      <button 
        className={`view-btn ${getActiveClass('tree')}`}
        onClick={() => handleViewChange('tree')}
        title="Tree View"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="5" r="2" />
          <circle cx="7" cy="12" r="2" />
          <circle cx="17" cy="12" r="2" />
          <circle cx="5" cy="19" r="2" />
          <circle cx="9" cy="19" r="2" />
          <circle cx="15" cy="19" r="2" />
          <circle cx="19" cy="19" r="2" />
          <path d="M12 7v3M7 14v3M17 14v3M12 10l-5 2M12 10l5 2M7 17l-2 0M7 17l2 0M17 17l-2 0M17 17l2 0" />
        </svg>
      </button>
    </div>
  );
};

const ScrollyTellHeader: React.FC = () => {
  return (
    <header className="scrollytell-header">
      <div className="header-container">
        <h1 className="header-title">TrustBuilder</h1>
        <ViewSelector />
      </div>
    </header>
  );
};

const ScrollyTellLayoutContent: React.FC = () => {
  return (
    <div className="scrollytell-layout">
      <ScrollyTellHeader />
      <main className="scrollytell-main">
        <Outlet />
      </main>
    </div>
  );
};

const ScrollyTellLayout: React.FC = () => {
  return (
    <ScrollyTellProvider>
      <ScrollyTellLayoutContent />
    </ScrollyTellProvider>
  );
};

export default ScrollyTellLayout;