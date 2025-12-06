/**
 * Navbar Component
 * Main navigation header
 */

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Search,
  Bell,
  MessageCircle,
  User,
  LogOut,
  Settings,
  RefreshCw,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { useMessages } from '../../hooks/useMessages';
import Avatar from '../common/Avatar';
import Button from '../common/Button';

const Navbar = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const menuRef = useRef(null);

  const { user, logout } = useAuth();
  const { unreadCount: notificationCount, fetchUnreadCount } = useNotifications();
  const { unreadCount: messageCount, fetchUnreadCount: fetchMessageCount } = useMessages();
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch unread counts on mount
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      fetchMessageCount();
    }
  }, [user, fetchUnreadCount, fetchMessageCount]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setShowMobileMenu(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
  };

  const isActive = (path) => location.pathname === path;

  // Navigation items
  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/search', icon: Search, label: 'Search' },
    { 
      path: '/notifications', 
      icon: Bell, 
      label: 'Notifications',
      badge: notificationCount 
    },
    { 
      path: '/messages', 
      icon: MessageCircle, 
      label: 'Messages',
      badge: messageCount 
    }
  ];

  return (
    <nav className="bg-screech-card border-b border-screech-border sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 text-screech-accent font-bold text-xl hover:opacity-80 transition-opacity"
          >
            <span className="text-2xl">🦉</span>
            <span className="hidden sm:inline">Screech</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavItem
                key={item.path}
                {...item}
                isActive={isActive(item.path)}
                onClick={() => navigate(item.path)}
              />
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            {/* Desktop User Menu */}
            <div className="relative hidden md:block" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-screech-border transition-colors"
              >
                <Avatar
                  username={user?.username}
                  color={user?.avatarColor}
                  emoji={user?.clan?.emoji}
                  size="sm"
                />
                <span className="text-sm font-medium text-screech-text max-w-[100px] truncate">
                  {user?.username?.split('#')[0]}
                </span>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="dropdown">
                  <div className="p-3 border-b border-screech-border">
                    <p className="font-semibold text-screech-text truncate">
                      {user?.username}
                    </p>
                    <p className="text-xs text-screech-textMuted flex items-center gap-1">
                      <span>{user?.clan?.emoji}</span>
                      <span>{user?.clan?.name} Clan</span>
                    </p>
                  </div>

                  <div className="py-1">
                    <DropdownItem
                      icon={User}
                      label="Profile"
                      onClick={() => {
                        navigate('/profile');
                        setShowUserMenu(false);
                      }}
                    />
                    <DropdownItem
                      icon={RefreshCw}
                      label="New Identity"
                      onClick={() => {
                        navigate('/settings');
                        setShowUserMenu(false);
                      }}
                    />
                    <DropdownItem
                      icon={Settings}
                      label="Settings"
                      onClick={() => {
                        navigate('/settings');
                        setShowUserMenu(false);
                      }}
                    />
                  </div>

                  <div className="border-t border-screech-border py-1">
                    <DropdownItem
                      icon={LogOut}
                      label="Sign Out"
                      onClick={handleLogout}
                      danger
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 rounded-lg hover:bg-screech-border transition-colors"
            >
              {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-screech-border py-4">
            {/* User Info */}
            <div className="flex items-center gap-3 px-2 pb-4 mb-4 border-b border-screech-border">
              <Avatar
                username={user?.username}
                color={user?.avatarColor}
                emoji={user?.clan?.emoji}
                size="md"
              />
              <div>
                <p className="font-semibold text-screech-text">
                  {user?.username}
                </p>
                <p className="text-xs text-screech-textMuted flex items-center gap-1">
                  <span>{user?.clan?.emoji}</span>
                  <span>{user?.clan?.name} Clan</span>
                </p>
              </div>
            </div>

            {/* Nav Items */}
            <div className="space-y-1">
              {navItems.map((item) => (
                <MobileNavItem
                  key={item.path}
                  {...item}
                  isActive={isActive(item.path)}
                  onClick={() => navigate(item.path)}
                />
              ))}
              
              <MobileNavItem
                icon={User}
                label="Profile"
                onClick={() => navigate('/profile')}
              />
              
              <MobileNavItem
                icon={Settings}
                label="Settings"
                onClick={() => navigate('/settings')}
              />
            </div>

            {/* Logout */}
            <div className="mt-4 pt-4 border-t border-screech-border">
              <Button
                variant="ghost"
                fullWidth
                onClick={handleLogout}
                icon={LogOut}
                className="justify-start text-red-500 hover:text-red-400 hover:bg-red-500/10"
              >
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

/**
 * Desktop Nav Item
 */
const NavItem = ({ path, icon: Icon, label, badge, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center gap-2 px-4 py-2 rounded-xl transition-colors
        ${isActive 
          ? 'bg-screech-accent/10 text-screech-accent' 
          : 'text-screech-textMuted hover:bg-screech-border hover:text-screech-text'
        }
      `}
      title={label}
    >
      <Icon size={20} />
      <span className="text-sm font-medium">{label}</span>
      
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
};

/**
 * Mobile Nav Item
 */
const MobileNavItem = ({ icon: Icon, label, badge, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center justify-between px-3 py-3 rounded-xl transition-colors
        ${isActive 
          ? 'bg-screech-accent/10 text-screech-accent' 
          : 'text-screech-textMuted hover:bg-screech-border hover:text-screech-text'
        }
      `}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} />
        <span className="font-medium">{label}</span>
      </div>
      
      {badge > 0 && (
        <span className="min-w-[24px] h-[24px] flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
};

/**
 * Dropdown Item
 */
const DropdownItem = ({ icon: Icon, label, onClick, danger = false }) => {
  return (
    <button
      onClick={onClick}
      className={`
        dropdown-item
        ${danger ? 'text-red-500 hover:bg-red-500/10' : ''}
      `}
    >
      <Icon size={16} />
      <span>{label}</span>
    </button>
  );
};

export default Navbar;