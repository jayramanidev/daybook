import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Undo2, X } from 'lucide-react';
import { UndoAction } from '../types/task';

interface UndoSnackbarProps {
  action: UndoAction | null;
  onUndo: () => void;
  onDismiss: () => void;
}

export const UndoSnackbar: React.FC<UndoSnackbarProps> = ({
  action,
  onUndo,
  onDismiss,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!action) return;
    setProgress(100);
    const duration = 5000;
    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [action, onDismiss]);

  return (
    <AnimatePresence>
      {action && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-20 left-4 right-4 max-w-sm mx-auto z-40"
        >
          <div className="relative overflow-hidden bg-[var(--color-df-ink)] text-white rounded-2xl shadow-xl border border-white/10 px-4 py-3 flex items-center justify-between gap-3">
            {/* Countdown progress line */}
            <div
              className="absolute bottom-0 left-0 h-[2px] bg-[var(--color-df-primary)] transition-all duration-75"
              style={{ width: `${progress}%` }}
            />

            <span className="text-sm font-medium leading-tight flex-1 text-white/95">
              {action.message}
            </span>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={onUndo}
                className="px-3 py-1.5 bg-[var(--color-df-primary)] text-white text-xs font-semibold rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>

              <button
                type="button"
                onClick={onDismiss}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
