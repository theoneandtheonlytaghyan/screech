/**
 * MainLayout Component
 * Main application layout with navbar, sidebar, and content area
 */

import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import RightPanel from './RightPanel';

const MainLayout = ({
  showSidebar = true,
  showRightPanel = true,
  children
}) => {
  return (
    <div className="min-h-screen bg-screech-dark">
      {/* Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar - Hidden on mobile */}
          {showSidebar && (
            <div className="hidden lg:block w-64 flex-shrink-0">
              <Sidebar />
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0 max-w-2xl mx-auto lg:mx-0">
            {children || <Outlet />}
          </main>

          {/* Right Panel - Hidden on mobile and tablet */}
          {showRightPanel && (
            <div className="hidden xl:block w-80 flex-shrink-0">
              <RightPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Centered Layout
 * For pages that need centered content (auth, settings, etc.)
 */
export const CenteredLayout = ({ children, maxWidth = 'md' }) => {
  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  };

  return (
    <div className="min-h-screen bg-screech-dark">
      <Navbar />
      <div className={`${maxWidths[maxWidth]} mx-auto px-4 py-8`}>
        {children}
      </div>
    </div>
  );
};

/**
 * Full Width Layout
 * For pages that need full width (search results, etc.)
 */
export const FullWidthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-screech-dark">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};

/**
 * Two Column Layout
 * For pages with main content and sidebar
 */
export const TwoColumnLayout = ({
  children,
  sidebar,
  sidebarPosition = 'right'
}) => {
  return (
    <div className="min-h-screen bg-screech-dark">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className={`flex gap-6 ${sidebarPosition === 'left' ? 'flex-row-reverse' : ''}`}>
          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>

          {/* Sidebar */}
          {sidebar && (
            <aside className="hidden lg:block w-80 flex-shrink-0">
              {sidebar}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Messages Layout
 * Special layout for messaging interface
 */
export const MessagesLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-screech-dark flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
};

/**
 * Auth Layout
 * Layout for authentication pages (no navbar)
 */
export const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-screech-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
};

/**
 * Blank Layout
 * Minimal layout with just the content
 */
export const BlankLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-screech-dark">
      {children}
    </div>
  );
};

export default MainLayout;