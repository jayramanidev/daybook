import React, { useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { formatDayName, formatShortDate } from '../utils/date';

interface DayPagerProps {
  currentEpochDay: number;
  todayEpoch: number;
  onChangeDay: (epochDay: number) => void;
  tasksCountMap: Record<number, { open: number; done: number }>;
}

export const DayPager: React.FC<DayPagerProps> = ({
  currentEpochDay,
  todayEpoch,
  onChangeDay,
  tasksCountMap,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate range: 7 days before today to 14 days after today
  const daysRange = React.useMemo(() => {
    const list: number[] = [];
    for (let offset = -7; offset <= 21; offset++) {
      list.push(todayEpoch + offset);
    }
    return list;
  }, [todayEpoch]);

  // Auto-scroll selected day into view in the horizontal carousel
  useEffect(() => {
    if (scrollRef.current) {
      const activeEl = scrollRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentEpochDay]);

  const isToday = currentEpochDay === todayEpoch;

  // Geometry for circular progress ring (r=7, C=43.98)
  const ringRadius = 7;
  const ringCircumference = 2 * Math.PI * ringRadius;

  return (
    <div className="pt-2 pb-1 select-none">
      {/* Top micro-navigation row */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onChangeDay(currentEpochDay - 1)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--color-df-ink-soft)] hover:bg-[var(--color-df-surface-deep)] transition-colors cursor-pointer"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onChangeDay(currentEpochDay + 1)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--color-df-ink-soft)] hover:bg-[var(--color-df-surface-deep)] transition-colors cursor-pointer"
            aria-label="Next day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Jump to Today indicator */}
        {!isToday && (
          <button
            type="button"
            onClick={() => onChangeDay(todayEpoch)}
            className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--color-df-primary)]/10 text-[var(--color-df-primary)] hover:bg-[var(--color-df-primary)]/20 transition-all flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Back to Today</span>
          </button>
        )}
      </div>

      {/* Horizontal Day Chips carousel */}
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth"
        style={{ scrollbarWidth: 'none' }}
      >
        {daysRange.map((epoch) => {
          const isSelected = epoch === currentEpochDay;
          const isCurrentToday = epoch === todayEpoch;
          const dayName =
            epoch === todayEpoch
              ? 'Today'
              : epoch === todayEpoch + 1
              ? 'Tomorrow'
              : formatDayName(epoch, todayEpoch).slice(0, 3);
          const shortDate = formatShortDate(epoch);
          const counts = tasksCountMap[epoch] || { open: 0, done: 0 };
          const totalTasks = counts.open + counts.done;
          const hasTasks = totalTasks > 0;
          const ratio = hasTasks ? counts.done / totalTasks : 0;
          const percentage = Math.round(ratio * 100);
          const isAllDone = hasTasks && counts.open === 0;

          // Compute stroke dash offset for circular progress ring
          const strokeDashoffset = ringCircumference - ratio * ringCircumference;

          return (
            <button
              key={epoch}
              data-active={isSelected}
              type="button"
              onClick={() => onChangeDay(epoch)}
              title={
                hasTasks
                  ? `${counts.done} of ${totalTasks} tasks completed (${percentage}%)`
                  : 'No tasks planned'
              }
              className={`flex flex-col items-center justify-center min-w-[58px] py-2 px-2 rounded-2xl transition-all cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-[var(--color-df-ink)] text-white shadow-sm scale-105'
                  : 'bg-[var(--color-df-surface)] text-[var(--color-df-ink-soft)] hover:bg-[var(--color-df-surface-deep)]'
              }`}
            >
              {/* Day Name */}
              <span
                className={`text-[11px] font-semibold uppercase tracking-wider ${
                  isSelected
                    ? 'text-white/80'
                    : isCurrentToday
                    ? 'text-[var(--color-df-primary)]'
                    : 'text-[var(--color-df-ink-soft)]'
                }`}
              >
                {dayName}
              </span>

              {/* Day Number */}
              <span
                className={`text-[14px] font-bold ${
                  isSelected ? 'text-white' : 'text-[var(--color-df-ink)]'
                }`}
              >
                {shortDate.split(' ')[0]}
              </span>

              {/* Circular Progress Ring Indicator */}
              <div className="mt-1 flex items-center justify-center relative w-5 h-5">
                {hasTasks ? (
                  <svg className="w-5 h-5 -rotate-90 transform" viewBox="0 0 20 20">
                    {/* Background track circle */}
                    <circle
                      cx="10"
                      cy="10"
                      r={ringRadius}
                      stroke={
                        isSelected ? 'rgba(255, 255, 255, 0.25)' : 'var(--color-df-ink-soft)'
                      }
                      strokeWidth="2"
                      strokeOpacity={isSelected ? 0.3 : 0.2}
                      fill="transparent"
                    />

                    {/* Progress arc */}
                    <circle
                      cx="10"
                      cy="10"
                      r={ringRadius}
                      stroke={
                        isAllDone
                          ? isSelected
                            ? 'var(--color-df-done)'
                            : 'var(--color-df-done)'
                          : isSelected
                          ? 'var(--color-df-tomorrow)'
                          : 'var(--color-df-primary)'
                      }
                      strokeWidth="2.2"
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-300 ease-out"
                    />

                    {/* Center tick if 100% completed */}
                    {isAllDone && (
                      <path
                        d="M 7 10 L 9 12 L 13 8"
                        stroke={isSelected ? 'var(--color-df-done)' : 'var(--color-df-done)'}
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="transparent"
                        className="rotate-90 origin-center"
                      />
                    )}
                  </svg>
                ) : (
                  /* Empty state micro ring */
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected ? 'bg-white/20' : 'bg-[var(--color-df-ink-soft)]/25'
                    }`}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
