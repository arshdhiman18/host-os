import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, IndianRupee, Home } from 'lucide-react';

const tabs = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'guests', label: 'Guests', icon: Users },
  { id: 'earnings', label: 'Earnings', icon: IndianRupee },
  { id: 'properties', label: 'Properties', icon: Home },
];

export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 md:hidden"
      style={{ height: 'var(--bottom-nav-height)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center h-full max-w-lg mx-auto">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-colors"
              aria-label={label}
            >
              <div
                className="p-1.5 rounded-xl transition-all duration-200"
                style={isActive ? { background: 'var(--color-primary-light)' } : {}}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  style={{ color: isActive ? 'var(--color-primary)' : '#9CA3AF' }}
                />
              </div>
              <span
                className="text-xs font-semibold transition-colors"
                style={{ color: isActive ? 'var(--color-primary)' : '#9CA3AF', fontSize: '10px' }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
