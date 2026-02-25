import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { GlobalStateProvider, useGlobalState } from './context/GlobalStateContext';
import { ThemeProvider } from './context/ThemeContext';
import StateManager from './components/StateManager';
import './components/StateManager.css';
import ThemeToggle from './components/ThemeToggle';
import Sidebar from './components/Sidebar';
import './components/Sidebar.css';
import HomePage from './pages/HomePage';
import ResumeUploadPage from './pages/ResumeUploadPage';
import ResumeOptimizePage from './pages/ResumeOptimizePage';
import JobDeliveryPage from './pages/JobDeliveryPage';
import InterviewCoachPage from './pages/InterviewCoachPage';
import DashboardPage from './pages/DashboardPage';
import './App.css';

function AppContent() {
  const { user, loading, actions } = useGlobalState();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
        <span className="ml-3">加载中...</span>
      </div>
    );
  }

  return (
    <Router>
      <div className="App min-h-screen">
        <div className="background-grid"></div>
        
        <ThemeToggle />
        
        <Sidebar 
          user={user} 
          onLogout={actions.logout}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <StateManager>
            <Routes>
              <Route 
                path="/" 
                element={<HomePage user={user} onLogin={actions.login} />} 
              />
              <Route 
                path="/resume/upload" 
                element={<ResumeUploadPage user={user} />} 
              />
              <Route 
                path="/resume/optimize" 
                element={<ResumeOptimizePage user={user} />} 
              />
              <Route 
                path="/job/delivery" 
                element={<JobDeliveryPage user={user} />} 
              />
              <Route 
                path="/interview/coach" 
                element={<InterviewCoachPage user={user} />} 
              />
              <Route 
                path="/dashboard" 
                element={<DashboardPage user={user} />} 
              />
            </Routes>
          </StateManager>
        </main>

        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </div>
    </Router>
  );
}

function App() {
  return (
    <GlobalStateProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </GlobalStateProvider>
  );
}

export default App;
