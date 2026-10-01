import { Task, DayfoldSettings, BackupDto, ImportResult } from '../types/task';
import { getEpochDay, epochDayToIso, isoToEpochDay } from '../utils/date';

const TASKS_STORAGE_KEY = 'dayfold_tasks_v1';
const SETTINGS_STORAGE_KEY = 'dayfold_settings_v1';

export const DEFAULT_SETTINGS: DayfoldSettings = {
  themeMode: 'SYSTEM',
  hapticsEnabled: true,
  dayStartHour: 0,
  onboarded: true,
  usePhoneFrame: false,
};

export function loadSettings(): DayfoldSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: DayfoldSettings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to localStorage', e);
  }
}

export function generateInitialTasks(todayEpoch: number): Task[] {
  const now = Date.now();
  return [
    {
      id: 'init-task-carried',
      title: 'Renew domain registration',
      note: 'Transfer DNS settings to Cloudflare',
      dayEpoch: todayEpoch - 2, // 2 days overdue
      originEpochDay: todayEpoch - 2,
      isDone: false,
      completedAtMillis: null,
      sortKey: 1024,
      createdAtMillis: now - 172800000,
      updatedAtMillis: now - 172800000,
    },
    {
      id: 'init-task-1',
      title: 'Send invoice to client',
      note: 'Include Net-30 payment instructions',
      dayEpoch: todayEpoch,
      originEpochDay: todayEpoch,
      isDone: false,
      completedAtMillis: null,
      sortKey: 1024,
      createdAtMillis: now - 3600000,
      updatedAtMillis: now - 3600000,
      reminderMinuteOfDay: 9 * 60, // 9:00 AM
    },
    {
      id: 'init-task-2',
      title: 'Review PRD and export schemas',
      note: null,
      dayEpoch: todayEpoch,
      originEpochDay: todayEpoch,
      isDone: false,
      completedAtMillis: null,
      sortKey: 2048,
      createdAtMillis: now - 2400000,
      updatedAtMillis: now - 2400000,
    },
    {
      id: 'init-task-done',
      title: 'Push build to production',
      note: 'Verified with all tests passing',
      dayEpoch: todayEpoch,
      originEpochDay: todayEpoch,
      isDone: true,
      completedAtMillis: now - 1800000,
      sortKey: 3072,
      createdAtMillis: now - 7200000,
      updatedAtMillis: now - 1800000,
    },
  ];
}

export function loadTasks(todayEpoch: number): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) {
      const initial = generateInitialTasks(todayEpoch);
      saveTasks(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return generateInitialTasks(todayEpoch);
    }
    return parsed;
  } catch {
    return generateInitialTasks(todayEpoch);
  }
}

export function saveTasks(tasks: Task[]) {
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Failed to save tasks to localStorage', e);
  }
}

export function calculateNewSortKey(tasksInDay: Task[]): number {
  if (tasksInDay.length === 0) return 1024;
  const max = Math.max(...tasksInDay.map(t => t.sortKey || 0));
  return max + 1024;
}

export function exportBackupJson(tasks: Task[]): string {
  const backup: BackupDto = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    tasks: tasks.map(t => ({
      id: t.id,
      title: t.title,
      note: t.note,
      day: epochDayToIso(t.dayEpoch),
      originDay: epochDayToIso(t.originEpochDay),
      isDone: t.isDone,
      completedAt: t.completedAtMillis ? new Date(t.completedAtMillis).toISOString() : null,
      sortKey: t.sortKey,
      reminderMinuteOfDay: t.reminderMinuteOfDay ?? null,
    })),
  };
  return JSON.stringify(backup, null, 2);
}

export function importBackupJson(jsonString: string, currentTasks: Task[]): { newTasks: Task[]; result: ImportResult } {
  try {
    const parsed = JSON.parse(jsonString) as BackupDto;
    if (!parsed || parsed.schemaVersion !== 1 || !Array.isArray(parsed.tasks)) {
      return {
        newTasks: currentTasks,
        result: { added: 0, updated: 0, skipped: 0, error: "That file isn't a Dayfold backup. Choose a different file." },
      };
    }

    const taskMap = new Map<string, Task>();
    currentTasks.forEach(t => taskMap.set(t.id, t));

    let added = 0;
    let updated = 0;
    let skipped = 0;

    for (const item of parsed.tasks) {
      if (!item.id || !item.title || !item.day) {
        skipped++;
        continue;
      }

      const dayEpoch = isoToEpochDay(item.day);
      const originEpochDay = item.originDay ? isoToEpochDay(item.originDay) : dayEpoch;
      const completedAtMillis = item.completedAt ? new Date(item.completedAt).getTime() : null;

      const existing = taskMap.get(item.id);
      const taskObj: Task = {
        id: item.id,
        title: item.title.trim().slice(0, 200),
        note: item.note ? item.note.slice(0, 2000) : null,
        dayEpoch,
        originEpochDay,
        isDone: Boolean(item.isDone),
        completedAtMillis,
        sortKey: typeof item.sortKey === 'number' ? item.sortKey : 1024,
        createdAtMillis: existing ? existing.createdAtMillis : Date.now(),
        updatedAtMillis: Date.now(),
        reminderMinuteOfDay: typeof item.reminderMinuteOfDay === 'number' ? item.reminderMinuteOfDay : null,
      };

      if (existing) {
        updated++;
      } else {
        added++;
      }
      taskMap.set(item.id, taskObj);
    }

    const merged = Array.from(taskMap.values());
    saveTasks(merged);
    return {
      newTasks: merged,
      result: { added, updated, skipped },
    };
  } catch {
    return {
      newTasks: currentTasks,
      result: { added: 0, updated: 0, skipped: 0, error: 'Failed to read backup file. Please check file format.' },
    };
  }
}
