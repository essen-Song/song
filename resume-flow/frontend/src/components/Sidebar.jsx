import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  LayoutDashboard, 
  Upload, 
  Sparkles, 
  Send, 
  MessageSquare,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Sidebar = ({ user, onLogout, collapsed, onToggle }) => {
  const location = useLocation();
  const { isDark } = useTheme();

  const menuItems = [
    { path: '/', icon: Home, label: '首页', alwaysShow: true },
    { path: '/dashboard', icon: LayoutDashboard, label: '仪表板', requireAuth: true },
    { path: '/resume/upload', icon: Upload, label: '简历解析', requireAuth: true },
    { path: '/resume/optimize', icon: Sparkles, label: 'AI优化', requireAuth: true },
    { path: '/job/delivery', icon: Send, label: '智能投递', requireAuth: true },
    { path: '/interview/coach', icon: MessageSquare, label: '面试教练', requireAuth: true },
  ];

  const filteredItems = menuItems.filter(item => 
    item.alwaysShow || (item.requireAuth && user)
  );

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${isDark ? 'dark' : 'light'}`}>
      <div className="sidebar-header">
        <Link to="/" className="sidebar-brand">
          <div className="brand-icon">
            <Zap size={24} />
          </div>
          {!collapsed && (
            <div className="brand-text">
              <span className="brand-name">ResumeFlow</span>
              <span className="brand-tag">AI Powered</span>
            </div>
          )}
        </Link>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          {!collapsed && <span className="nav-section-title">导航菜单</span>}
          <ul className="nav-menu">
            {filteredItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                  title={collapsed ? item.label : ''}
                >
                  <div className="nav-link-content">
                    <item.icon size={20} className="nav-icon" />
                    {!collapsed && <span className="nav-label">{item.label}</span>}
                  </div>
                  {isActive(item.path) && <div className="active-indicator" />}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="sidebar-footer">
        {user ? (
          <div className="user-panel">
            {!collapsed && (
              <div className="user-info">
                <div className="user-avatar">
                  <User size={18} />
                </div>
                <div className="user-details">
                  <span className="user-name">{user.name}</span>
                  <span className="user-role">用户</span>
                </div>
              </div>
            )}
            <button
              className="logout-btn"
              onClick={onLogout}
              title={collapsed ? '退出登录' : ''}
            >
              <LogOut size={18} />
              {!collapsed && <span>退出登录</span>}
            </button>
          </div>
        ) : (
          <Link to="/?login=true" className="login-btn">
            <User size={18} />
            {!collapsed && <span>登录系统</span>}
          </Link>
        )}
      </div>

      <button className="collapse-btn" onClick={onToggle}>
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </aside>
  );
};

export default Sidebar;
