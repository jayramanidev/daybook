import React from 'react';
import { motion } from 'motion/react';
import { formatDayName, formatShortDate } from '../utils/date';

interface DayTitleProps {
  epochDay: number;
  todayEpoch: number;
  openCount: number;
  doneCount: number;
}

export const DayTitle: React.FC<DayTitleProps> = ({
  epochDay,
  todayEpoch,
  openCount,
  doneCount,
}) => {
  const isToday = epochDay === todayEpoch;
  const dayName = formatDayName(epochDay, todayEpoch);
  const shortDate = formatShortDate(epochDay);
  const totalTasks = openCount + doneCount;

  // Completion ratio: 0..1
  const ratio = totalTasks === 0 ? 0 : doneCount / totalTasks;
  const isAllClear = totalTasks > 0 && openCount === 0;

  // Bricolage Grotesque variable font width: 100 -> 75
  const fontWidth = isToday ? Math.round(100 - 25 * Math.min(Math.max(ratio, 0), 1)) : 100;
  const fontWeight = isToday ? Math.round(700 - 80 * ratio) : 700;

  // Sub line microcopy from doc 02 §7 & §10:
  let subText = '';
  if (totalTasks === 0) {
    subText = 'Nothing planned. Add the first thing.';
  } else if (isAllClear) {
    subText = `${shortDate} · All clear.`;
  } else {
    subText = `${shortDate} · ${doneCount} of ${totalTasks} done`;
  }

  return (
    <div className="pt-2 pb-5 select-none transition-all duration-300">
      <motion.h1
        className="text-5xl sm:text-6xl font-bold tracking-tight text-[var(--color-df-ink)] leading-[0.95] mb-2"
        style={{
          fontFamily: 'var(--font-display)',
          fontVariationSettings: `'wdth' ${fontWidth}, 'wght' ${fontWeight}`,
          transition: 'font-variation-settings 400ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {dayName}
      </motion.h1>

      <div className="flex items-center gap-2">
        <motion.p
          key={subText}
          initial={{ opacity: 0.8, y: 1 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="text-[15px] font-medium text-[var(--color-df-ink-soft)] leading-snug"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {subText}
        </motion.p>

        {isAllClear && (
          <motion.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-md bg-[var(--color-df-done)]/15 text-[var(--color-df-done)]"
          >
            100%
          </motion.span>
        )}
      </div>
    </div>
  );
};
