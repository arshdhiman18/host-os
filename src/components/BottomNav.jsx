import React, { useState } from 'react';
import { LayoutDashboard, Users, IndianRupee, Home, CreditCard, CalendarDays, MoreHorizontal } from 'lucide-react';

const mainTabs = [
  { id: 'overview', label: 'Home', icon: LayoutDashboard },
  { id: 'guests', label: 'Guests', icon: Users },
  { id: 'earnings', label: 'Earnings', icon: IndianRupee },
  { id: 'properties', label: 'Properties', icon: Home },
];

const moreTabs = [
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'billing', label: 'Billing', icon: CreditCard },
];

export default function BottomNav({ activeTab, onTabChange }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const isMoreActive = moreTabs.some(t => t.id === activeTab);

  const handleTabChange = (id) => {
    onTabChange(id);
    setMoreOpen(false);
  };

  return (
    <>
      {/* More drawer backdrop */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.2)' }}
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* More drawer — slides up above bottom nav */}
      <div
        className="fixed left-0 right-0 z-50 bg-white border-t border-gray-100 rounded-t-2xl shadow-lg md:hidden transition-transform duration-250 ease-out"
        style={{
          bottom: 'var(--bottom-nav-height)',
          transform: moreOpen ? 'translateY(0)' : 'translateY(110%)',
        }}
      >
        <div className="px-4 pt-3 pb-4 grid grid-cols-2 gap-2">
          {moreTabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => handleTabChange(id)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all"
                style={isActive
                  ? { background: 'var(--color-primary-light)', color: 'var(--color-primary)' }
                  : { background: '#F9FAFB', color: '#6B7280' }
                }
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom nav bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 md:hidden"
        style={{ height: 'var(--bottom-nav-height)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center h-full max-w-lg mx-auto">
          {mainTabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => { setMoreOpen(false); onTabChange(id); }}
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
                  className="font-semibold transition-colors"
                  style={{ color: isActive ? 'var(--color-primary)' : '#9CA3AF', fontSize: '10px' }}
                >
                  {label}
                </span>
              </button>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(v => !v)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-colors"
            aria-label="More"
          >
            <div
              className="p-1.5 rounded-xl transition-all duration-200"
              style={isMoreActive || moreOpen ? { background: 'var(--color-primary-light)' } : {}}
            >
              <MoreHorizontal
                size={22}
                strokeWidth={isMoreActive || moreOpen ? 2.5 : 1.8}
                style={{ color: isMoreActive || moreOpen ? 'var(--color-primary)' : '#9CA3AF' }}
              />
            </div>
            <span
              className="font-semibold transition-colors"
              style={{ color: isMoreActive || moreOpen ? 'var(--color-primary)' : '#9CA3AF', fontSize: '10px' }}
            >
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
