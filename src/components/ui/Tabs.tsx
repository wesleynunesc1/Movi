import React from 'react';
import { cn } from '@/lib/utils/cn';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: 'underline' | 'pills';
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
  variant = 'underline',
}) => {
  if (variant === 'pills') {
    return (
      <div className={cn('inline-flex p-1 bg-surface-secondary rounded-xl border border-border/80 gap-1', className)}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all select-none',
                isActive
                  ? 'bg-white text-movi-graphite shadow-subtle'
                  : 'text-text-secondary hover:text-movi-graphite hover:bg-white/50'
              )}
            >
              {tab.icon && <span className="w-3.5 h-3.5">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-border text-text-secondary">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('flex border-b border-border gap-6 overflow-x-auto no-scrollbar', className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-2 pb-3 text-sm font-semibold transition-all relative whitespace-nowrap select-none',
              isActive
                ? 'text-movi-graphite'
                : 'text-text-secondary hover:text-movi-graphite'
            )}
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-secondary text-text-secondary font-normal">
                {tab.badge}
              </span>
            )}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-movi-yellow rounded-t-full" />
            )}
          </button>
        );
      })}
    </div>
  );
};
