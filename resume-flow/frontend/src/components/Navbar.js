import React from 'react';
import { Link } from 'react-router-dom';
import { User, LogOut, Menu, X } from 'lucide-react';

const Navbar = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-bold text-lg">RF</span>
            </div>
            <span className="text-white text-xl font-bold">ResumeFlow</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-white hover:text-blue-200 transition-colors">
              首页
            </Link>
            {user && (
              <>
                <Link to="/dashboard" className="text-white hover:text-blue-200 transition-colors">
                  仪表板
                </Link>
                <Link to="/resume/upload" className="text-white hover:text-blue-200 transition-colors">
                  简历上传
                </Link>
                <Link to="/resume/optimize" className="text-white hover:text-blue-200 transition-colors">
                  简历优化
                </Link>
                <Link to="/job/delivery" className="text-white hover:text-blue-200 transition-colors">
                  职位投递
                </Link>
                <Link to="/interview/coach" className="text-white hover:text-blue-200 transition-colors">
                  面试教练
                </Link>
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 text-white">
                  <User size={20} />
                  <span>{user.name}</span>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center space-x-1 text-white hover:text-blue-200 transition-colors"
                >
                  <LogOut size={16} />
                  <span>退出</span>
                </button>
              </div>
            ) : (
              <Link
                to="/?login=true"
                className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                登录
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-white hover:text-blue-200 transition-colors"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-blue-400">
            <div className="flex flex-col space-y-4">
              <Link
                to="/"
                className="text-white hover:text-blue-200 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                首页
              </Link>
              {user && (
                <>
                  <Link
                    to="/dashboard"
                    className="text-white hover:text-blue-200 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    仪表板
                  </Link>
                  <Link
                    to="/resume/upload"
                    className="text-white hover:text-blue-200 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    简历上传
                  </Link>
                  <Link
                    to="/resume/optimize"
                    className="text-white hover:text-blue-200 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    简历优化
                  </Link>
                  <Link
                    to="/job/delivery"
                    className="text-white hover:text-blue-200 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    职位投递
                  </Link>
                  <Link
                    to="/interview/coach"
                    className="text-white hover:text-blue-200 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    面试教练
                  </Link>
                  <button
                    onClick={() => {
                      onLogout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center space-x-1 text-white hover:text-blue-200 transition-colors"
                  >
                    <LogOut size={16} />
                    <span>退出</span>
                  </button>
                </>
              )}
              {!user && (
                <Link
                  to="/?login=true"
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  登录
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;