import React, { useState } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'motion/react';
import { CornerDownRight, Trash2, GripVertical, Calendar, FileText, MoreHorizontal, Clock } from 'lucide-react';
import { Task } from '../types/task';
import { CheckMark } from './CheckMark';
import { formatMinuteOfDay } from '../utils/date';

interface TaskCardProps {
  task: Task;
  todayEpoch: number;
  onToggle: (id: string) => void;
  onFold: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (task: Task) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  todayEpoch,
  onToggle,
  onFold,
  onDelete,
  onClick,
  onMoveUp,
  onMoveDown,
  isFirst = false,
  isLast = false,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const x = useMotionValue(0);

  // Backdrop opacities & reveals based on drag direction
  const amberOpacity = useTransform(x, [0, 40, 100], [0, 0.4, 1]);
  const poppyOpacity = useTransform(x, [-100, -40, 0], [1, 0.4, 0]);

  // Carried over age calculation
  const isCarriedOver = !task.isDone && task.dayEpoch < todayEpoch;
  const carriedDays = isCarriedOver ? Math.max(1, todayEpoch - task.originEpochDay) : 0;

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 90; // Pixels to trigger action
    if (info.offset.x > threshold) {
      // Swiped right -> Fold to tomorrow
      onFold(task.id);
    } else if (info.offset.x < -threshold) {
      // Swiped left -> Delete
      onDelete(task.id);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[20px] mb-2.5 touch-pan-y select-none group">
      {/* Background reveals on swipe */}
      {/* Right swipe: Amber backdrop (Fold to tomorrow) */}
      <motion.div
        style={{ opacity: amberOpacity }}
        className="absolute inset-0 bg-[var(--color-df-tomorrow)] flex items-center justify-start px-6 rounded-[20px] text-white z-0"
      >
        <div className="flex items-center gap-2 font-medium text-sm tracking-wide">
          <CornerDownRight className="w-5 h-5" />
          <span>Tomorrow</span>
        </div>
      </motion.div>

      {/* Left swipe: Poppy backdrop (Delete) */}
      <motion.div
        style={{ opacity: poppyOpacity }}
        className="absolute inset-0 bg-[var(--color-df-danger)] flex items-center justify-end px-6 rounded-[20px] text-white z-0"
      >
        <div className="flex items-center gap-2 font-medium text-sm tracking-wide">
          <span>Delete</span>
          <Trash2 className="w-5 h-5" />
        </div>
      </motion.div>

      {/* Forefront Card with spring drag physics */}
      <motion.div
        style={{ x }}
        drag={task.isDone ? false : 'x'}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.4}
        onDragEnd={handleDragEnd}
        onClick={() => onClick(task)}
        className={`relative z-10 p-4 rounded-[20px] bg-[var(--color-df-surface)] border border-[var(--color-df-ink-soft)]/10 cursor-pointer transition-colors duration-200 ${
          task.isDone ? 'opacity-60 bg-[var(--color-df-surface-deep)]/40' : 'hover:border-[var(--color-df-ink-soft)]/20'
        }`}
      >
        <div className="flex items-start gap-3.5">
          {/* Checkbox */}
          <div className="pt-0.5 shrink-0">
            <CheckMark checked={task.isDone} onToggle={() => onToggle(task.id)} />
          </div>

          {/* Title & Notes */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="relative">
              <span
                className={`text-[17px] font-medium leading-[1.35] block break-words transition-colors duration-200 ${
                  task.isDone ? 'text-[var(--color-df-ink-soft)]' : 'text-[var(--color-df-ink)]'
                }`}
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {task.title}
              </span>

              {/* Animated strikethrough wipe */}
              {task.isDone && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
                  style={{ originX: 0 }}
                  className="absolute top-[52%] left-0 right-0 h-[1.5px] bg-[var(--color-df-ink-soft)]/60 pointer-events-none"
                />
              )}
            </div>

            {/* Note preview if any */}
            {task.note && (
              <p className="mt-1 text-[13px] text-[var(--color-df-ink-soft)] leading-snug line-clamp-1 flex items-center gap-1.5 opacity-85">
                <FileText className="w-3.5 h-3.5 shrink-0 opacity-70" />
                <span className="truncate">{task.note}</span>
              </p>
            )}
          </div>

          {/* Right badges & accessible quick actions */}
          <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
            {/* Reminder Badge & Notification Dot */}
            {task.reminderMinuteOfDay !== null && task.reminderMinuteOfDay !== undefined && (
              <span
                title={`Reminder set for ${formatMinuteOfDay(task.reminderMinuteOfDay)}`}
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-semibold tracking-tight rounded-md transition-colors ${
                  task.isDone
                    ? 'text-[var(--color-df-ink-soft)] bg-[var(--color-df-surface-deep)]'
                    : 'text-[var(--color-df-primary)] bg-[var(--color-df-primary)]/10'
                }`}
              >
                {!task.isDone && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-df-primary)] shrink-0 animate-pulse" />
                )}
                <Clock className="w-3 h-3 shrink-0" />
                <span>{formatMinuteOfDay(task.reminderMinuteOfDay)}</span>
              </span>
            )}

            {/* Age badge in Poppy if carried over */}
            {isCarriedOver && (
              <span
                title={`Carried over ${carriedDays} day${carriedDays > 1 ? 's' : ''}`}
                className="inline-flex items-center px-1.5 py-0.5 text-[11px] font-semibold tracking-tight text-[var(--color-df-danger)] bg-[var(--color-df-danger)]/10 rounded-md"
              >
                {carriedDays}d
              </span>
            )}

            {/* Reorder / actions menu trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-df-ink-soft)] hover:text-[var(--color-df-ink)] hover:bg-[var(--color-df-surface-deep)]/60 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-df-primary)] cursor-pointer"
                aria-label="Task options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {/* Accessible Dropdown menu */}
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                    }}
                  />
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-9 w-44 bg-[var(--color-df-surface)] rounded-2xl border border-[var(--color-df-ink-soft)]/15 shadow-xl py-1.5 z-40"
                  >
                    {!task.isDone && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          onFold(task.id);
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs font-medium flex items-center gap-2.5 text-[var(--color-df-ink)] hover:bg-[var(--color-df-surface-deep)]/70 transition-colors cursor-pointer"
                      >
                        <CornerDownRight className="w-3.5 h-3.5 text-[var(--color-df-tomorrow)]" />
                        <span>Move to tomorrow</span>
                      </button>
                    )}

                    {onMoveUp && !isFirst && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          onMoveUp(task.id);
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs font-medium flex items-center gap-2.5 text-[var(--color-df-ink)] hover:bg-[var(--color-df-surface-deep)]/70 transition-colors cursor-pointer"
                      >
                        <GripVertical className="w-3.5 h-3.5 text-[var(--color-df-ink-soft)]" />
                        <span>Move up</span>
                      </button>
                    )}

                    {onMoveDown && !isLast && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          onMoveDown(task.id);
                        }}
                        className="w-full px-3.5 py-2 text-left text-xs font-medium flex items-center gap-2.5 text-[var(--color-df-ink)] hover:bg-[var(--color-df-surface-deep)]/70 transition-colors cursor-pointer"
                      >
                        <GripVertical className="w-3.5 h-3.5 text-[var(--color-df-ink-soft)]" />
                        <span>Move down</span>
                      </button>
                    )}

                    <div className="h-px my-1 bg-[var(--color-df-ink-soft)]/10" />

                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onDelete(task.id);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-medium flex items-center gap-2.5 text-[var(--color-df-danger)] hover:bg-[var(--color-df-danger)]/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete task</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
