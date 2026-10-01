import React from 'react';
import { ChevronDown, ChevronRight, ArrowRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  count: number;
  actionText?: string;
  onAction?: () => void;
  isCollapsible?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  isCarriedOver?: boolean;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  count,
  actionText,
  onAction,
  isCollapsible = false,
  isExpanded = true,
  onToggleExpand,
  isCarriedOver = false,
}) => {
  return (
    <div className="flex items-center justify-between pt-4 pb-2 select-none">
      <div
        onClick={isCollapsible ? onToggleExpand : undefined}
        className={`flex items-center gap-1.5 ${isCollapsible ? 'cursor-pointer hover:opacity-80' : ''}`}
      >
        <h2
          className="text-lg font-semibold text-[var(--color-df-ink)] flex items-center gap-1.5"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <span>{title}</span>
          <span className="text-xs font-medium text-[var(--color-df-ink-soft)] px-1.5 py-0.5 rounded-full bg-[var(--color-df-surface-deep)]/70">
            {count}
          </span>
        </h2>

        {isCollapsible && (
          <div className="text-[var(--color-df-ink-soft)] ml-0.5">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
        )}
      </div>

      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
            isCarriedOver
              ? 'text-[var(--color-df-primary)] hover:bg-[var(--color-df-surface-deep)]'
              : 'text-[var(--color-df-ink-soft)] hover:text-[var(--color-df-ink)]'
          }`}
        >
          <span>{actionText}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
