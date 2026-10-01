/**
 * Dayfold — Offline-first to-do application.
 * Concept: "The day is a page you fold"
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Settings as SettingsIcon, Smartphone, Monitor, ChevronRight, Search, X } from 'lucide-react';
import { Task, DayfoldSettings, UndoAction } from './types/task';
import {
  loadSettings,
  saveSettings,
  loadTasks,
  saveTasks,
  calculateNewSortKey,
} from './services/storage';
import { getEpochDay, formatDayName, formatShortDate } from './utils/date';
import { triggerHaptic, playTactileTone } from './utils/haptics';
import { triggerCompletionConfetti } from './utils/confetti';
import { DayTitle } from './components/DayTitle';
import { TaskCard } from './components/TaskCard';
import { QuickAddBar } from './components/QuickAddBar';
import { AddEditSheet } from './components/AddEditSheet';
import { SettingsSheet } from './components/SettingsSheet';
import { UndoSnackbar } from './components/UndoSnackbar';
import { SectionHeader } from './components/SectionHeader';
import { DayPager } from './components/DayPager';

export default function App() {
  const [settings, setSettings] = useState<DayfoldSettings>(loadSettings);
  const [todayEpoch, setTodayEpoch] = useState<number>(() =>
    getEpochDay(new Date(), settings.dayStartHour)
  );
  const [currentEpochDay, setCurrentEpochDay] = useState<number>(todayEpoch);
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks(todayEpoch));
  const [doneExpanded, setDoneExpanded] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);

  // Sheets & Undo state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);

  // Real-time search across all days by title or note
  const isSearching = searchQuery.trim().length > 0;

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const q = searchQuery.trim().toLowerCase();
    return tasks
      .filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.note && t.note.toLowerCase().includes(q))
      )
      .sort((a, b) => a.dayEpoch - b.dayEpoch || a.sortKey - b.sortKey);
  }, [tasks, searchQuery, isSearching]);

  const searchResultsByDay = useMemo(() => {
    if (!isSearching) return [];
    const grouped = new Map<number, Task[]>();
    for (const t of searchResults) {
      const list = grouped.get(t.dayEpoch) || [];
      list.push(t);
      grouped.set(t.dayEpoch, list);
    }
    return Array.from(grouped.entries()).map(([dayEpoch, dayTasks]) => ({
      dayEpoch,
      tasks: dayTasks,
    }));
  }, [searchResults, isSearching]);

  // Keep dark mode synced with settings
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      if (settings.themeMode === 'DARK') {
        root.classList.add('dark');
      } else if (settings.themeMode === 'LIGHT') {
        root.classList.remove('dark');
      } else {
        // SYSTEM
        if (mediaQuery.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    applyTheme();
    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, [settings.themeMode]);

  // Live midnight rollover check (every 30 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      const freshToday = getEpochDay(new Date(), settings.dayStartHour);
      if (freshToday !== todayEpoch) {
        setTodayEpoch(freshToday);
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [settings.dayStartHour, todayEpoch]);

  const updateTasks = useCallback((newTasks: Task[]) => {
    setTasks(newTasks);
    saveTasks(newTasks);
  }, []);

  const updateSettings = (newSettings: DayfoldSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Carried over tasks (derived query: incomplete tasks where dayEpoch < todayEpoch)
  const carriedOverTasks = useMemo(() => {
    return tasks
      .filter((t) => !t.isDone && t.dayEpoch < todayEpoch)
      .sort((a, b) => a.dayEpoch - b.dayEpoch || a.sortKey - b.sortKey);
  }, [tasks, todayEpoch]);

  // Open tasks for currently viewed day
  const openTasks = useMemo(() => {
    return tasks
      .filter((t) => t.dayEpoch === currentEpochDay && !t.isDone)
      .sort((a, b) => a.sortKey - b.sortKey);
  }, [tasks, currentEpochDay]);

  // Done tasks for currently viewed day
  const doneTasks = useMemo(() => {
    return tasks
      .filter((t) => t.dayEpoch === currentEpochDay && t.isDone)
      .sort((a, b) => (b.completedAtMillis || 0) - (a.completedAtMillis || 0));
  }, [tasks, currentEpochDay]);

  // Tasks count map for DayPager indicator
  const tasksCountMap = useMemo(() => {
    const map: Record<number, { open: number; done: number }> = {};
    for (const t of tasks) {
      if (!map[t.dayEpoch]) {
        map[t.dayEpoch] = { open: 0, done: 0 };
      }
      if (t.isDone) {
        map[t.dayEpoch].done++;
      } else {
        map[t.dayEpoch].open++;
      }
    }
    return map;
  }, [tasks]);

  // Toggle complete / uncomplete
  const handleToggleDone = useCallback(
    (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;

      const willBeDone = !task.isDone;
      triggerHaptic(willBeDone ? 'confirm' : 'tap', settings.hapticsEnabled);

      // Check if completing this task makes all tasks for that day completed
      if (willBeDone) {
        const remainingOpenForDay = tasks.filter(
          (t) => t.dayEpoch === task.dayEpoch && !t.isDone && t.id !== id
        );
        if (remainingOpenForDay.length === 0) {
          setTimeout(() => {
            triggerCompletionConfetti(confettiCanvasRef.current);
            if (settings.hapticsEnabled) {
              playTactileTone(587, 0.12, 0.05); // D5
              setTimeout(() => playTactileTone(880, 0.25, 0.06), 90); // A5
            }
          }, 280);
        }
      }

      const updated = tasks.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            isDone: willBeDone,
            completedAtMillis: willBeDone ? Date.now() : null,
            updatedAtMillis: Date.now(),
          };
        }
        return t;
      });

      updateTasks(updated);
    },
    [tasks, settings.hapticsEnabled, updateTasks]
  );

  // Fold to tomorrow (Swipe-right or menu action)
  const handleFoldToTomorrow = useCallback(
    (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;

      triggerHaptic('tick', settings.hapticsEnabled);

      const targetDay = todayEpoch + 1;
      const tasksInTomorrow = tasks.filter((t) => t.dayEpoch === targetDay);
      const newSortKey = calculateNewSortKey(tasksInTomorrow);

      const previousState = { ...task };

      const updated = tasks.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            dayEpoch: targetDay,
            sortKey: newSortKey,
            updatedAtMillis: Date.now(),
          };
        }
        return t;
      });

      updateTasks(updated);

      // 5-second Undo snackbar
      setUndoAction({
        id: `fold-${id}-${Date.now()}`,
        message: 'Moved to tomorrow',
        previousTaskState: previousState,
        actionType: 'FOLD',
      });
    },
    [tasks, todayEpoch, settings.hapticsEnabled, updateTasks]
  );

  // Move all carried over to today (Bulk action)
  const handleMoveAllCarriedToToday = useCallback(() => {
    if (carriedOverTasks.length === 0) return;

    triggerHaptic('tick', settings.hapticsEnabled);

    const previousBackup = carriedOverTasks.map((t) => ({ ...t }));
    const idsToMove = new Set(carriedOverTasks.map((t) => t.id));

    let nextSort = calculateNewSortKey(tasks.filter((t) => t.dayEpoch === todayEpoch));

    const updated = tasks.map((t) => {
      if (idsToMove.has(t.id)) {
        nextSort += 1024;
        return {
          ...t,
          dayEpoch: todayEpoch,
          sortKey: nextSort,
          updatedAtMillis: Date.now(),
        };
      }
      return t;
    });

    updateTasks(updated);

    setUndoAction({
      id: `bulk-${Date.now()}`,
      message: `Moved ${carriedOverTasks.length} task${
        carriedOverTasks.length > 1 ? 's' : ''
      } to today`,
      previousTaskState: null,
      bulkRestore: previousBackup,
      actionType: 'BULK_MOVE',
    });
  }, [carriedOverTasks, tasks, todayEpoch, settings.hapticsEnabled, updateTasks]);

  // Delete task with 5-second Undo
  const handleDeleteTask = useCallback(
    (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;

      triggerHaptic('tap', settings.hapticsEnabled);
      const previousState = { ...task };

      const updated = tasks.filter((t) => t.id !== id);
      updateTasks(updated);

      setUndoAction({
        id: `del-${id}-${Date.now()}`,
        message: 'Task deleted',
        previousTaskState: previousState,
        actionType: 'DELETE',
      });
    },
    [tasks, settings.hapticsEnabled, updateTasks]
  );

  // Undo handler
  const handleUndo = useCallback(() => {
    if (!undoAction) return;

    triggerHaptic('tap', settings.hapticsEnabled);

    if (undoAction.actionType === 'BULK_MOVE' && undoAction.bulkRestore) {
      const map = new Map<string, Task>();
      tasks.forEach((t) => map.set(t.id, t));
      undoAction.bulkRestore.forEach((t) => map.set(t.id, t));
      updateTasks(Array.from(map.values()));
    } else if (undoAction.previousTaskState) {
      const restored = undoAction.previousTaskState;
      const filtered = tasks.filter((t) => t.id !== restored.id);
      updateTasks([...filtered, restored]);
    }

    setUndoAction(null);
  }, [undoAction, tasks, settings.hapticsEnabled, updateTasks]);

  // Quick Add task
  const handleQuickAdd = useCallback(
    (title: string, targetEpoch: number) => {
      triggerHaptic('tap', settings.hapticsEnabled);

      const targetDayTasks = tasks.filter((t) => t.dayEpoch === targetEpoch);
      const sortKey = calculateNewSortKey(targetDayTasks);

      const newTask: Task = {
        id: 'task_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
        title: title.slice(0, 200),
        note: null,
        dayEpoch: targetEpoch,
        originEpochDay: targetEpoch,
        isDone: false,
        completedAtMillis: null,
        sortKey,
        createdAtMillis: Date.now(),
        updatedAtMillis: Date.now(),
      };

      updateTasks([...tasks, newTask]);
    },
    [tasks, settings.hapticsEnabled, updateTasks]
  );

  // Save from AddEditSheet
  const handleSaveFromSheet = useCallback(
    (data: {
      id?: string;
      title: string;
      note: string | null;
      dayEpoch: number;
      reminderMinuteOfDay: number | null;
    }) => {
      triggerHaptic('tap', settings.hapticsEnabled);

      if (data.id) {
        // Edit existing
        const updated = tasks.map((t) => {
          if (t.id === data.id) {
            return {
              ...t,
              title: data.title,
              note: data.note,
              dayEpoch: data.dayEpoch,
              reminderMinuteOfDay: data.reminderMinuteOfDay,
              updatedAtMillis: Date.now(),
            };
          }
          return t;
        });
        updateTasks(updated);
      } else {
        // Add new
        const targetTasks = tasks.filter((t) => t.dayEpoch === data.dayEpoch);
        const sortKey = calculateNewSortKey(targetTasks);
        const newTask: Task = {
          id: 'task_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
          title: data.title,
          note: data.note,
          dayEpoch: data.dayEpoch,
          originEpochDay: data.dayEpoch,
          isDone: false,
          completedAtMillis: null,
          sortKey,
          createdAtMillis: Date.now(),
          updatedAtMillis: Date.now(),
          reminderMinuteOfDay: data.reminderMinuteOfDay,
        };
        updateTasks([...tasks, newTask]);
      }
    },
    [tasks, settings.hapticsEnabled, updateTasks]
  );

  // Reorder task up/down within day
  const handleMoveTaskPosition = useCallback(
    (id: string, direction: 'up' | 'down') => {
      const list = [...openTasks];
      const index = list.findIndex((t) => t.id === id);
      if (index === -1) return;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= list.length) return;

      const item = list.splice(index, 1)[0];
      list.splice(targetIndex, 0, item);

      // Rebalance sort keys with spacing of 1024
      const idToNewSort = new Map<string, number>();
      list.forEach((t, i) => {
        idToNewSort.set(t.id, (i + 1) * 1024);
      });

      const updated = tasks.map((t) => {
        if (idToNewSort.has(t.id)) {
          return {
            ...t,
            sortKey: idToNewSort.get(t.id)!,
            updatedAtMillis: Date.now(),
          };
        }
        return t;
      });

      updateTasks(updated);
      triggerHaptic('tick', settings.hapticsEnabled);
    },
    [openTasks, tasks, settings.hapticsEnabled, updateTasks]
  );

  // App content rendered inside phone frame or full viewport
  const appContent = (
    <div className="flex flex-col h-full min-h-screen bg-[var(--color-df-bg)] text-[var(--color-df-ink)] relative selection:bg-[var(--color-df-primary)]/20 overflow-hidden">
      {/* Subtle completion confetti canvas overlay */}
      <canvas
        ref={confettiCanvasRef}
        className="pointer-events-none absolute inset-0 z-40 w-full h-full"
      />

      {/* Top Header Bar */}
      <header className="px-5 pt-4 pb-1 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          {/* Settings Trigger */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--color-df-ink)] bg-[var(--color-df-surface)]/80 border border-[var(--color-df-ink-soft)]/10 hover:bg-[var(--color-df-surface-deep)] active:scale-95 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--color-df-primary)]"
            aria-label="Open settings"
          >
            <SettingsIcon className="w-5 h-5 opacity-80" />
          </button>
        </div>

        {/* Brand identity & Frame toggle button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              updateSettings({ ...settings, usePhoneFrame: !settings.usePhoneFrame })
            }
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-[var(--color-df-surface)] border border-[var(--color-df-ink-soft)]/10 text-[var(--color-df-ink-soft)] hover:text-[var(--color-df-ink)] transition-colors cursor-pointer"
            title="Toggle smartphone mockup view"
          >
            {settings.usePhoneFrame ? (
              <>
                <Monitor className="w-3.5 h-3.5" />
                <span>Full screen</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5" />
                <span>Phone frame</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Scrollable Content */}
      <main className="flex-1 overflow-y-auto px-5 pb-32 pt-2 scroll-smooth">
        {/* Real-time Search Input Field */}
        <div className="relative mb-3">
          <div className="relative flex items-center bg-[var(--color-df-surface)] border border-[var(--color-df-ink-soft)]/15 rounded-2xl px-3.5 py-2 shadow-xs focus-within:border-[var(--color-df-primary)] focus-within:ring-2 focus-within:ring-[var(--color-df-primary)]/20 transition-all">
            <Search className="w-4 h-4 text-[var(--color-df-ink-soft)] mr-2.5 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks across all days..."
              className="w-full bg-transparent text-[14px] font-medium text-[var(--color-df-ink)] placeholder-[var(--color-df-ink-soft)]/60 outline-none"
              style={{ fontFamily: 'var(--font-body)' }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--color-df-ink-soft)] hover:text-[var(--color-df-ink)] hover:bg-[var(--color-df-surface-deep)] transition-colors cursor-pointer shrink-0 ml-1"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Conditional Rendering: Search Results vs Normal Day View */}
        {isSearching ? (
          <section className="mb-6">
            <div className="flex items-center justify-between pt-1 pb-3 px-1">
              <span className="text-xs font-semibold text-[var(--color-df-ink-soft)]">
                Found {searchResults.length} matching task{searchResults.length !== 1 ? 's' : ''}
              </span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs font-semibold text-[var(--color-df-primary)] hover:underline cursor-pointer"
              >
                Clear filter
              </button>
            </div>

            {searchResults.length === 0 ? (
              <div className="py-14 text-center select-none bg-[var(--color-df-surface)]/50 rounded-2xl border border-[var(--color-df-ink-soft)]/10 p-6">
                <Search className="w-8 h-8 mx-auto text-[var(--color-df-ink-soft)]/40 mb-2" />
                <p className="text-sm font-semibold text-[var(--color-df-ink)]">
                  No tasks found
                </p>
                <p className="text-xs text-[var(--color-df-ink-soft)] mt-1">
                  No tasks match &ldquo;{searchQuery}&rdquo; in title or notes
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="mt-3.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[var(--color-df-surface-deep)] text-[var(--color-df-ink)] hover:opacity-80 transition-all cursor-pointer"
                >
                  Reset search
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {searchResultsByDay.map(({ dayEpoch, tasks: dayTasks }) => (
                  <div key={dayEpoch}>
                    <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-df-ink-soft)] mb-2 px-1">
                      <span className="flex items-center gap-1.5">
                        <span className="text-[var(--color-df-ink)]">
                          {formatDayName(dayEpoch, todayEpoch)}
                        </span>
                        <span>·</span>
                        <span>{formatShortDate(dayEpoch)}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentEpochDay(dayEpoch);
                          setSearchQuery('');
                        }}
                        className="text-[11px] text-[var(--color-df-primary)] hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>Jump to day</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {dayTasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          todayEpoch={todayEpoch}
                          onToggle={handleToggleDone}
                          onFold={handleFoldToTomorrow}
                          onDelete={handleDeleteTask}
                          onClick={(t) => {
                            setTaskToEdit(t);
                            setIsAddEditOpen(true);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            {/* Horizontal Day Carousel / Pager */}
            <DayPager
              currentEpochDay={currentEpochDay}
              todayEpoch={todayEpoch}
              onChangeDay={setCurrentEpochDay}
              tasksCountMap={tasksCountMap}
            />

            {/* Alive Day Title + Completion Ratio */}
            <DayTitle
              epochDay={currentEpochDay}
              todayEpoch={todayEpoch}
              openCount={openTasks.length}
              doneCount={doneTasks.length}
            />

            {/* Carried Over Section (Shown only when viewing today and carried tasks exist) */}
            {currentEpochDay === todayEpoch && carriedOverTasks.length > 0 && (
              <section className="mb-6">
                <SectionHeader
                  title="Carried over"
                  count={carriedOverTasks.length}
                  actionText="Move all to today"
                  onAction={handleMoveAllCarriedToToday}
                  isCarriedOver={true}
                />
                <div className="space-y-2 mt-1">
                  {carriedOverTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      todayEpoch={todayEpoch}
                      onToggle={handleToggleDone}
                      onFold={handleFoldToTomorrow}
                      onDelete={handleDeleteTask}
                      onClick={(t) => {
                        setTaskToEdit(t);
                        setIsAddEditOpen(true);
                      }}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Current Day: Open Tasks */}
            <section className="mb-6">
              {currentEpochDay === todayEpoch && carriedOverTasks.length > 0 && (
                <SectionHeader title="Today" count={openTasks.length} />
              )}

              {openTasks.length === 0 && carriedOverTasks.length === 0 && doneTasks.length === 0 ? (
                <div className="py-12 text-center select-none">
                  <p className="text-base font-medium text-[var(--color-df-ink-soft)]/75">
                    Nothing planned. Add the first thing.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setTaskToEdit(null);
                      setIsAddEditOpen(true);
                    }}
                    className="mt-3 px-4 py-2 text-xs font-semibold rounded-xl bg-[var(--color-df-surface)] border border-[var(--color-df-ink-soft)]/20 text-[var(--color-df-ink)] hover:bg-[var(--color-df-surface-deep)] transition-all cursor-pointer"
                  >
                    + Plan a task
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {openTasks.map((task, idx) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      todayEpoch={todayEpoch}
                      onToggle={handleToggleDone}
                      onFold={handleFoldToTomorrow}
                      onDelete={handleDeleteTask}
                      onClick={(t) => {
                        setTaskToEdit(t);
                        setIsAddEditOpen(true);
                      }}
                      onMoveUp={(id) => handleMoveTaskPosition(id, 'up')}
                      onMoveDown={(id) => handleMoveTaskPosition(id, 'down')}
                      isFirst={idx === 0}
                      isLast={idx === openTasks.length - 1}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Done Section (Collapsible) */}
            {doneTasks.length > 0 && (
              <section className="mb-8">
                <SectionHeader
                  title="Done"
                  count={doneTasks.length}
                  isCollapsible={true}
                  isExpanded={doneExpanded}
                  onToggleExpand={() => setDoneExpanded(!doneExpanded)}
                />

                {doneExpanded && (
                  <div className="space-y-2 mt-1">
                    {doneTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        todayEpoch={todayEpoch}
                        onToggle={handleToggleDone}
                        onFold={handleFoldToTomorrow}
                        onDelete={handleDeleteTask}
                        onClick={(t) => {
                          setTaskToEdit(t);
                          setIsAddEditOpen(true);
                        }}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>

      {/* Pinned Bottom QuickAdd Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
        <div className="w-full max-w-xl mx-auto pointer-events-auto">
          <QuickAddBar
            currentEpochDay={currentEpochDay}
            todayEpoch={todayEpoch}
            onAddTask={handleQuickAdd}
          />
        </div>
      </footer>

      {/* 5-second Undo Snackbar */}
      <UndoSnackbar
        action={undoAction}
        onUndo={handleUndo}
        onDismiss={() => setUndoAction(null)}
      />

      {/* Add / Edit Task Modal Sheet */}
      <AddEditSheet
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        taskToEdit={taskToEdit}
        currentEpochDay={currentEpochDay}
        todayEpoch={todayEpoch}
        onSave={handleSaveFromSheet}
        onDelete={handleDeleteTask}
      />

      {/* Settings Modal Sheet */}
      <SettingsSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
        tasks={tasks}
        onTasksUpdated={updateTasks}
        todayEpoch={todayEpoch}
      />
    </div>
  );

  // Wrap in Smartphone frame if user enabled phone mockup mode
  if (settings.usePhoneFrame) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
        <div className="relative w-full max-w-[420px] h-[860px] max-h-[96vh] rounded-[48px] bg-[var(--color-df-bg)] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] border-[10px] border-slate-800 flex flex-col overflow-hidden">
          {/* Phone Speaker & Dynamic Island / Camera Notch */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-40 flex items-center justify-end px-3">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700/50" />
          </div>

          <div className="flex-1 overflow-hidden relative">{appContent}</div>

          {/* Home indicator bar at bottom */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-[var(--color-df-ink)]/20 rounded-full z-40 pointer-events-none" />
        </div>
      </div>
    );
  }

  // Full Screen / Standard responsive container
  return (
    <div className="min-h-screen bg-[var(--color-df-bg)] flex justify-center">
      <div className="w-full max-w-xl h-full min-h-screen flex flex-col">
        {appContent}
      </div>
    </div>
  );
}
