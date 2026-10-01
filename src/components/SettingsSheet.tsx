import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Moon,
  Sun,
  Laptop,
  Vibrate,
  Clock,
  Download,
  Upload,
  RefreshCw,
  Smartphone,
  Info,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { DayfoldSettings, ThemeMode } from '../types/task';
import { exportBackupJson, importBackupJson, generateInitialTasks, saveTasks } from '../services/storage';
import { Task, ImportResult } from '../types/task';

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DayfoldSettings;
  onUpdateSettings: (newSettings: DayfoldSettings) => void;
  tasks: Task[];
  onTasksUpdated: (newTasks: Task[]) => void;
  todayEpoch: number;
}

export const SettingsSheet: React.FC<SettingsSheetProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  tasks,
  onTasksUpdated,
  todayEpoch,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<'success' | 'error' | null>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    const jsonStr = exportBackupJson(tasks);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `dayfold-backup-${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setImportStatus('success');
    setImportNotice('Tasks exported successfully');
    setTimeout(() => setImportNotice(null), 3500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const { newTasks, result } = importBackupJson(content, tasks);
        if (result.error) {
          setImportStatus('error');
          setImportNotice(result.error);
        } else {
          onTasksUpdated(newTasks);
          setImportStatus('success');
          setImportNotice(
            `Imported: ${result.added} added, ${result.updated} updated${
              result.skipped ? `, ${result.skipped} skipped` : ''
            }`
          );
        }
        setTimeout(() => setImportNotice(null), 4500);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleResetSampleData = () => {
    if (confirm('Load sample starter tasks? This will restore initial tasks.')) {
      const initial = generateInitialTasks(todayEpoch);
      saveTasks(initial);
      onTasksUpdated(initial);
      setImportStatus('success');
      setImportNotice('Sample tasks loaded');
      setTimeout(() => setImportNotice(null), 3000);
    }
  };

  const handleClearAll = () => {
    if (confirm('Clear all tasks? You may want to export a backup first.')) {
      saveTasks([]);
      onTasksUpdated([]);
      setImportStatus('success');
      setImportNotice('All tasks cleared');
      setTimeout(() => setImportNotice(null), 3000);
    }
  };

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

        {/* Modal Container */}
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
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2
                className="text-2xl font-bold text-[var(--color-df-ink)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Settings
              </h2>
              <p className="text-xs text-[var(--color-df-ink-soft)] mt-0.5">
                Preferences and local data management
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-df-ink-soft)] hover:bg-[var(--color-df-surface-deep)] transition-colors cursor-pointer"
              aria-label="Close settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Feedback Notice banner if active */}
          {importNotice && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-2xl mb-4 text-xs font-semibold flex items-center gap-2 ${
                importStatus === 'success'
                  ? 'bg-[var(--color-df-done)]/15 text-[var(--color-df-done)]'
                  : 'bg-[var(--color-df-danger)]/15 text-[var(--color-df-danger)]'
              }`}
            >
              {importStatus === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{importNotice}</span>
            </motion.div>
          )}

          <div className="space-y-6">
            {/* Theme section */}
            <div>
              <label className="text-xs font-semibold text-[var(--color-df-ink-soft)] uppercase tracking-wider block mb-2">
                Appearance
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'LIGHT', label: 'Light', icon: Sun },
                    { id: 'DARK', label: 'Dark', icon: Moon },
                    { id: 'SYSTEM', label: 'System', icon: Laptop },
                  ] as const
                ).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, themeMode: id as ThemeMode })}
                    className={`py-2.5 px-3 rounded-2xl flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      settings.themeMode === id
                        ? 'bg-[var(--color-df-ink)] text-white shadow-sm'
                        : 'bg-[var(--color-df-surface-deep)]/60 text-[var(--color-df-ink)] hover:bg-[var(--color-df-surface-deep)]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Display / Frame & Haptics */}
            <div>
              <label className="text-xs font-semibold text-[var(--color-df-ink-soft)] uppercase tracking-wider block mb-2">
                Interaction & Display
              </label>
              <div className="space-y-2">
                {/* Haptics toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--color-df-surface-deep)]/40 border border-[var(--color-df-ink-soft)]/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[var(--color-df-primary)]/10 text-[var(--color-df-primary)] flex items-center justify-center">
                      <Vibrate className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-[var(--color-df-ink)] block">
                        Tactile & Haptic feedback
                      </span>
                      <span className="text-xs text-[var(--color-df-ink-soft)]">
                        Vibrations and micro-clicks on check and fold
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.hapticsEnabled}
                    onChange={(e) =>
                      onUpdateSettings({ ...settings, hapticsEnabled: e.target.checked })
                    }
                    className="w-5 h-5 accent-[var(--color-df-primary)] rounded cursor-pointer"
                  />
                </div>

                {/* Mobile Phone Mockup view toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--color-df-surface-deep)]/40 border border-[var(--color-df-ink-soft)]/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[var(--color-df-tomorrow)]/10 text-[var(--color-df-tomorrow)] flex items-center justify-center">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-[var(--color-df-ink)] block">
                        Phone Frame Preview
                      </span>
                      <span className="text-xs text-[var(--color-df-ink-soft)]">
                        Wrap canvas in an authentic mobile frame
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.usePhoneFrame}
                    onChange={(e) =>
                      onUpdateSettings({ ...settings, usePhoneFrame: e.target.checked })
                    }
                    className="w-5 h-5 accent-[var(--color-df-primary)] rounded cursor-pointer"
                  />
                </div>

                {/* Day Starts At Hour */}
                <div className="p-3.5 rounded-2xl bg-[var(--color-df-surface-deep)]/40 border border-[var(--color-df-ink-soft)]/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[var(--color-df-done)]/10 text-[var(--color-df-done)] flex items-center justify-center">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-[var(--color-df-ink)] block">
                          Day starts at
                        </span>
                        <span className="text-xs text-[var(--color-df-ink-soft)]">
                          Hour when late-night tasks count toward yesterday
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-[var(--color-df-ink)]">
                      {settings.dayStartHour === 0 ? 'Midnight (12 AM)' : `${settings.dayStartHour} AM`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={6}
                    step={1}
                    value={settings.dayStartHour}
                    onChange={(e) =>
                      onUpdateSettings({ ...settings, dayStartHour: Number(e.target.value) })
                    }
                    className="w-full accent-[var(--color-df-primary)] cursor-pointer mt-1"
                  />
                  <div className="flex justify-between text-[10px] text-[var(--color-df-ink-soft)] px-0.5 mt-1">
                    <span>12 AM</span>
                    <span>2 AM</span>
                    <span>4 AM</span>
                    <span>6 AM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Backup & Data */}
            <div>
              <label className="text-xs font-semibold text-[var(--color-df-ink-soft)] uppercase tracking-wider block mb-2">
                Data & Backup (Offline JSON)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleExport}
                  className="py-2.5 px-3 rounded-2xl bg-[var(--color-df-surface-deep)] hover:bg-[var(--color-df-surface-deep)]/80 text-[var(--color-df-ink)] text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[var(--color-df-primary)]" />
                  <span>Export JSON</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-2.5 px-3 rounded-2xl bg-[var(--color-df-surface-deep)] hover:bg-[var(--color-df-surface-deep)]/80 text-[var(--color-df-ink)] text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-[var(--color-df-tomorrow)]" />
                  <span>Import JSON</span>
                </button>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleResetSampleData}
                  className="flex-1 py-2 px-3 text-xs text-[var(--color-df-ink-soft)] hover:text-[var(--color-df-ink)] hover:bg-[var(--color-df-surface-deep)]/50 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reload sample tasks</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearAll}
                  className="py-2 px-3 text-xs text-[var(--color-df-danger)] hover:bg-[var(--color-df-danger)]/10 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear all</span>
                </button>
              </div>
            </div>

            {/* About Dayfold */}
            <div className="pt-2 border-t border-[var(--color-df-ink-soft)]/10 text-xs text-[var(--color-df-ink-soft)] space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-[var(--color-df-ink)]">
                <Info className="w-3.5 h-3.5 text-[var(--color-df-primary)]" />
                <span>About Dayfold v1.0</span>
              </div>
              <p className="leading-relaxed">
                "The day is a page you fold." Fully offline, zero network requests, private on-device storage.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
