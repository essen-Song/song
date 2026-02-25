import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import ResumeUploadPage from './pages/ResumeUploadPage';
import ResumeOptimizePage from './pages/ResumeOptimizePage';
import JobDeliveryPage from './pages/JobDeliveryPage';
import InterviewCoachPage from './pages/InterviewCoachPage';
import DashboardPage from './pages/DashboardPage';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟用户登录状态检查
    const checkUser = () => {
      const userId = localStorage.getItem('userId');
      if (userId) {
        setUser({ id: userId, name: '用户' });
      }
      setLoading(false);
    };

    checkUser();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('userId', userData.id);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('userId');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
        <span className="ml-3 text-gray-600">加载中...</span>
      </div>
    );
  }

  return (
    <Router>
      <div className="App min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={handleLogout} />
        
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route 
              path="/" 
              element={<HomePage user={user} onLogin={handleLogin} />} 
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

export default App;