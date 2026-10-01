export interface Task {
  id: string;
  title: string;
  note: string | null;
  dayEpoch: number; // Days since Jan 1, 1970 UTC
  originEpochDay: number; // Day it was first planned for
  isDone: boolean;
  completedAtMillis: number | null;
  sortKey: number; // Sparse sort key for reordering
  createdAtMillis: number;
  updatedAtMillis: number;
  reminderMinuteOfDay?: number | null;
}

export type ThemeMode = 'SYSTEM' | 'LIGHT' | 'DARK';

export interface DayfoldSettings {
  themeMode: ThemeMode;
  hapticsEnabled: boolean;
  dayStartHour: number; // 0..6
  onboarded: boolean;
  usePhoneFrame: boolean; // Option to view in realistic mobile phone viewport
}

export interface BackupDto {
  schemaVersion: number;
  exportedAt: string;
  tasks: Array<{
    id: string;
    title: string;
    note: string | null;
    day: string; // YYYY-MM-DD
    originDay: string; // YYYY-MM-DD
    isDone: boolean;
    completedAt: string | null;
    sortKey: number;
    reminderMinuteOfDay?: number | null;
  }>;
}

export interface ImportResult {
  added: number;
  updated: number;
  skipped: number;
  error?: string;
}

export interface UndoAction {
  id: string;
  message: string;
  previousTaskState: Task | null;
  bulkRestore?: Task[];
  actionType: 'DELETE' | 'FOLD' | 'BULK_MOVE';
  timeoutId?: number;
}
