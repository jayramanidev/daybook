import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Trash2, Check, Clock, Bell } from 'lucide-react';
import { Task } from '../types/task';
import {
  formatDayName,
  formatShortDate,
  epochDayToIso,
  isoToEpochDay,
  minuteOfDayToTimeString,
  timeStringToMinuteOfDay,
  formatMinuteOfDay,
} from '../utils/date';

interface AddEditSheetProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit: Task | null;
  currentEpochDay: number;
  todayEpoch: number;
  onSave: (taskData: {
    id?: string;
    title: string;
    note: string | null;
    dayEpoch: number;
    reminderMinuteOfDay: number | null;
  }) => void;
  onDelete?: (id: string) => void;
}

export const AddEditSheet: React.FC<AddEditSheetProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  currentEpochDay,
  todayEpoch,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [selectedEpoch, setSelectedEpoch] = useState<number>(currentEpochDay);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [reminderMinute, setReminderMinute] = useState<number | null>(null);
  const [showCustomTime, setShowCustomTime] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        setTitle(taskToEdit.title);
        setNote(taskToEdit.note || '');
        setSelectedEpoch(taskToEdit.dayEpoch);
        setReminderMinute(taskToEdit.reminderMinuteOfDay ?? null);
        setShowCustomTime(false);
      } else {
        setTitle('');
        setNote('');
        setSelectedEpoch(currentEpochDay);
        setReminderMinute(null);
        setShowCustomTime(false);
      }
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, taskToEdit, currentEpochDay]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    onSave({
      id: taskToEdit?.id,
      title: trimmedTitle,
      note: note.trim() || null,
      dayEpoch: selectedEpoch,
      reminderMinuteOfDay: reminderMinute,
    });
    onClose();
  };

  const isToday = selectedEpoch === todayEpoch;
  const isTomorrow = selectedEpoch === todayEpoch + 1;

  // Preset reminder times
  const timePresets = [
    { label: '9:00 AM', minute: 9 * 60 },
    { label: '12:00 PM', minute: 12 * 60 },
    { label: '3:00 PM', minute: 15 * 60 },
    { label: '6:00 PM', minute: 18 * 60 },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/45 backdrop-blur-[2px] cursor-pointer"
        />

        {/* Bottom Sheet Container */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative w-full max-w-lg bg-[var(--color-df-surface)] rounded-t-[32px] border-t border-[var(--color-df-ink-soft)]/20 shadow-2xl p-6 z-10 max-h-[90vh] overflow-y-auto"
        >
          {/* Top handle bar */}
          <div className="w-10 h-1.5 bg-[var(--color-df-ink-soft)]/20 rounded-full mx-auto mb-4" />

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-xl font-bold text-[var(--color-df-ink)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {taskToEdit ? 'Edit task' : 'New task'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-df-ink-soft)] hover:bg-[var(--color-df-surface-deep)] transition-colors cursor-pointer"
              aria-label="Close sheet"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title Field */}
            <div>
              <input
                ref={titleInputRef}
                type="text"
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What do you need to do?"
                className="w-full text-lg font-medium bg-transparent text-[var(--color-df-ink)] placeholder-[var(--color-df-ink-soft)]/60 border-b border-[var(--color-df-ink-soft)]/20 pb-2 outline-none focus:border-[var(--color-df-primary)] transition-colors"
                style={{ fontFamily: 'var(--font-body)' }}
              />
            </div>

            {/* Note Field */}
            <div>
              <textarea
                rows={3}
                maxLength={2000}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a secondary note (optional)..."
                className="w-full text-sm font-normal bg-[var(--color-df-surface-deep)]/40 text-[var(--color-df-ink)] placeholder-[var(--color-df-ink-soft)]/60 rounded-xl p-3 outline-none focus:ring-1 focus:ring-[var(--color-df-primary)] transition-all resize-none"
                style={{ fontFamily: 'var(--font-body)' }}
              />
            </div>

            {/* Day Selector */}
            <div className="pt-1">
              <label className="text-xs font-semibold text-[var(--color-df-ink-soft)] block mb-2">
                Plan for
              </label>
              <div className="flex items-center flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEpoch(todayEpoch);
                    setShowDatePicker(false);
                  }}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    isToday
                      ? 'bg-[var(--color-df-primary)] text-white'
                      : 'bg-[var(--color-df-surface-deep)] text-[var(--color-df-ink)] hover:opacity-80'
                  }`}
                >
                  Today ({formatShortDate(todayEpoch)})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedEpoch(todayEpoch + 1);
                    setShowDatePicker(false);
                  }}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    isTomorrow
                      ? 'bg-[var(--color-df-tomorrow)] text-white'
                      : 'bg-[var(--color-df-surface-deep)] text-[var(--color-df-ink)] hover:opacity-80'
                  }`}
                >
                  Tomorrow ({formatShortDate(todayEpoch + 1)})
                </button>

                <button
                  type="button"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                    !isToday && !isTomorrow
                      ? 'bg-[var(--color-df-ink)] text-white'
                      : 'bg-[var(--color-df-surface-deep)] text-[var(--color-df-ink)] hover:opacity-80'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {!isToday && !isTomorrow ? formatShortDate(selectedEpoch) : 'Pick date'}
                  </span>
                </button>
              </div>

              {/* Native Date Picker input if toggled */}
              {showDatePicker && (
                <div className="mt-2.5">
                  <input
                    type="date"
                    value={epochDayToIso(selectedEpoch)}
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelectedEpoch(isoToEpochDay(e.target.value));
                      }
                    }}
                    className="px-3 py-1.5 bg-[var(--color-df-surface-deep)] text-[var(--color-df-ink)] rounded-xl text-xs font-medium outline-none"
                  />
                </div>
              )}
            </div>

            {/* Reminder Time Picker Section */}
            <div className="pt-2 border-t border-[var(--color-df-ink-soft)]/10">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-[var(--color-df-ink-soft)] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[var(--color-df-primary)]" />
                  <span>Reminder time</span>
                  {reminderMinute !== null && (
                    <span className="font-bold text-[var(--color-df-primary)]">
                      · {formatMinuteOfDay(reminderMinute)}
                    </span>
                  )}
                </label>

                {reminderMinute !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setReminderMinute(null);
                      setShowCustomTime(false);
                    }}
                    className="text-[11px] font-semibold text-[var(--color-df-danger)] hover:underline cursor-pointer"
                  >
                    Clear time
                  </button>
                )}
              </div>

              {/* Quick time preset chips */}
              <div className="flex items-center flex-wrap gap-2">
                {timePresets.map(({ label, minute }) => {
                  const isSelected = reminderMinute === minute;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        setReminderMinute(minute);
                        setShowCustomTime(false);
                      }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--color-df-primary)] text-white shadow-sm'
                          : 'bg-[var(--color-df-surface-deep)] text-[var(--color-df-ink)] hover:opacity-85'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setShowCustomTime(!showCustomTime)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-xl flex items-center gap-1 transition-all cursor-pointer ${
                    showCustomTime || (reminderMinute !== null && !timePresets.some(p => p.minute === reminderMinute))
                      ? 'bg-[var(--color-df-ink)] text-white'
                      : 'bg-[var(--color-df-surface-deep)] text-[var(--color-df-ink)] hover:opacity-85'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Custom</span>
                </button>
              </div>

              {/* Custom Native Time Input */}
              {showCustomTime && (
                <div className="mt-2.5 flex items-center gap-2">
                  <input
                    type="time"
                    value={reminderMinute !== null ? minuteOfDayToTimeString(reminderMinute) : ''}
                    onChange={(e) => {
                      const val = timeStringToMinuteOfDay(e.target.value);
                      setReminderMinute(val);
                    }}
                    className="px-3 py-1.5 bg-[var(--color-df-surface-deep)] text-[var(--color-df-ink)] rounded-xl text-xs font-medium outline-none"
                  />
                  <span className="text-xs text-[var(--color-df-ink-soft)]">
                    {reminderMinute !== null ? formatMinuteOfDay(reminderMinute) : 'Select a time'}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-4 flex items-center justify-between gap-3">
              {taskToEdit && onDelete ? (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(taskToEdit.id);
                    onClose();
                  }}
                  className="px-4 py-2.5 text-sm font-medium text-[var(--color-df-danger)] hover:bg-[var(--color-df-danger)]/10 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-sm font-medium text-[var(--color-df-ink-soft)] hover:bg-[var(--color-df-surface-deep)] rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!title.trim()}
                  className="px-6 py-2.5 text-sm font-semibold bg-[var(--color-df-primary)] text-white rounded-xl hover:opacity-95 active:scale-95 transition-all disabled:opacity-40 cursor-pointer shadow-sm"
                >
                  {taskToEdit ? 'Save changes' : 'Save task'}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

