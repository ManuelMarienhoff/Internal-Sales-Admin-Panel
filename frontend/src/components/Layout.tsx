import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import pwcLogo from '../assets/pwc_logo.png';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/products', label: 'Services' },
    { path: '/customers', label: 'Clients' },
    { path: '/orders', label: 'Engagements' },
  ];

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-300 flex flex-col">
        {/* Logo/Title */}
        <div className="pl-6 pt-6 pb-2 border-b border-gray-300">
          <Link to="/" className="block">
            <img 
              src={pwcLogo} 
              alt="PwC" 
              style={{ width: '130px', height: 'auto' }}
              className="hover:opacity-80 transition-opacity"
            />
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-8">
          <div className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-6 py-3 text-base font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-pwc-orange text-pwc-black'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-gray-300 text-sm text-gray-500">
          <p>© 2026 PwC</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-white">
        {children}
      </main>
    </div>
  );
};

export default Layout;
