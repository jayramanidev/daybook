import React, { useState, useRef, useEffect } from 'react';
import { Plus, ArrowUp, Calendar, CornerDownRight, Mic, MicOff } from 'lucide-react';
import { formatShortDate, formatDayName } from '../utils/date';
import { triggerHaptic } from '../utils/haptics';

interface QuickAddBarProps {
  currentEpochDay: number;
  todayEpoch: number;
  onAddTask: (title: string, targetEpochDay: number) => void;
}

// Check for Web SpeechRecognition API in browser
const SpeechRecognitionAPI =
  typeof window !== 'undefined'
    ? (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).webkitSpeechRecognition
    : null;

export const QuickAddBar: React.FC<QuickAddBarProps> = ({
  currentEpochDay,
  todayEpoch,
  onAddTask,
}) => {
  const [title, setTitle] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Target epoch defaults to viewing day, or today
  const [targetEpoch, setTargetEpoch] = useState<number>(() => {
    return currentEpochDay === todayEpoch + 1 ? todayEpoch + 1 : todayEpoch;
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // When user navigates to tomorrow in pager, gently suggest tomorrow unless they manually chose today
  useEffect(() => {
    if (currentEpochDay === todayEpoch + 1) {
      setTargetEpoch(todayEpoch + 1);
    } else if (currentEpochDay === todayEpoch) {
      setTargetEpoch(todayEpoch);
    }
  }, [currentEpochDay, todayEpoch]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setIsListening(false);
    }

    const trimmed = title.trim();
    if (!trimmed) return;

    onAddTask(trimmed, targetEpoch);
    setTitle('');
    // Keep focus for rapid multi-task capture
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  };

  // Toggle voice-to-text recording
  const toggleSpeechRecognition = () => {
    setSpeechError(null);

    if (!SpeechRecognitionAPI) {
      setSpeechError('Speech recognition is not supported in this browser.');
      setTimeout(() => setSpeechError(null), 3500);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      triggerHaptic('tap');
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = typeof navigator !== 'undefined' ? navigator.language || 'en-US' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        triggerHaptic('confirm');
      };

      recognition.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcript;
          } else {
            interimText += transcript;
          }
        }

        const currentSpeech = (finalText || interimText).trim();
        if (currentSpeech) {
          // Capitalize first letter of voice capture
          const formatted = currentSpeech.charAt(0).toUpperCase() + currentSpeech.slice(1);
          setTitle(formatted);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          setSpeechError(`Voice error: ${event.error}`);
          setTimeout(() => setSpeechError(null), 3000);
        }
        setIsListening(false);
        triggerHaptic('tap');
      };

      recognition.onend = () => {
        setIsListening(false);
        triggerHaptic('tap');
        inputRef.current?.focus();
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to initialize speech recognition:', err);
      setIsListening(false);
      setSpeechError('Could not access microphone.');
      setTimeout(() => setSpeechError(null), 3000);
    }
  };

  const isTargetToday = targetEpoch === todayEpoch;
  const isTargetTomorrow = targetEpoch === todayEpoch + 1;
  const isTargetCustom = !isTargetToday && !isTargetTomorrow;

  // Placeholder and accent colors reflecting the target day
  const targetLabel = isTargetToday ? 'Today' : isTargetTomorrow ? 'Tomorrow' : formatDayName(targetEpoch, todayEpoch);
  const accentColor = isTargetTomorrow
    ? 'var(--color-df-tomorrow)'
    : 'var(--color-df-primary)';

  return (
    <div className="w-full max-w-xl mx-auto px-4 pb-4 pt-1">
      {/* Voice error notice banner if active */}
      {speechError && (
        <div className="mb-2 px-3 py-1.5 rounded-xl bg-[var(--color-df-danger)]/15 border border-[var(--color-df-danger)]/20 text-[var(--color-df-danger)] text-xs font-medium text-center animate-fade-in">
          {speechError}
        </div>
      )}

      {/* Day Target Selector Pill Row - Always fully visible, thumb-friendly */}
      <div className="flex items-center justify-between mb-1.5 px-1 select-none">
        <div className="inline-flex items-center bg-[var(--color-df-surface)]/95 backdrop-blur-md p-1 rounded-full border border-[var(--color-df-ink-soft)]/20 shadow-xs">
          {/* Today Button */}
          <button
            type="button"
            onClick={() => {
              setTargetEpoch(todayEpoch);
              inputRef.current?.focus();
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              isTargetToday
                ? 'bg-[var(--color-df-primary)] text-white shadow-xs'
                : 'text-[var(--color-df-ink-soft)] hover:text-[var(--color-df-ink)] hover:bg-[var(--color-df-surface-deep)]'
            }`}
          >
            <span>Today</span>
            <span className={`text-[10px] font-normal ${isTargetToday ? 'text-white/80' : 'opacity-65'}`}>
              {formatShortDate(todayEpoch)}
            </span>
          </button>

          {/* Tomorrow Button */}
          <button
            type="button"
            onClick={() => {
              setTargetEpoch(todayEpoch + 1);
              inputRef.current?.focus();
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              isTargetTomorrow
                ? 'bg-[var(--color-df-tomorrow)] text-white shadow-xs'
                : 'text-[var(--color-df-ink-soft)] hover:text-[var(--color-df-ink)] hover:bg-[var(--color-df-surface-deep)]'
            }`}
          >
            <span>Tomorrow</span>
            <span className={`text-[10px] font-normal ${isTargetTomorrow ? 'text-white/80' : 'opacity-65'}`}>
              {formatShortDate(todayEpoch + 1)}
            </span>
          </button>

          {/* Current viewing day (if not today and not tomorrow) */}
          {currentEpochDay !== todayEpoch && currentEpochDay !== todayEpoch + 1 && (
            <button
              type="button"
              onClick={() => {
                setTargetEpoch(currentEpochDay);
                inputRef.current?.focus();
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                isTargetCustom && targetEpoch === currentEpochDay
                  ? 'bg-[var(--color-df-ink)] text-white shadow-xs'
                  : 'text-[var(--color-df-ink-soft)] hover:text-[var(--color-df-ink)] hover:bg-[var(--color-df-surface-deep)]'
              }`}
            >
              <span>{formatDayName(currentEpochDay, todayEpoch).slice(0, 3)}</span>
              <span className={`text-[10px] font-normal ${isTargetCustom ? 'text-white/80' : 'opacity-65'}`}>
                {formatShortDate(currentEpochDay)}
              </span>
            </button>
          )}
        </div>

        {/* Listening Indicator or Active Destination */}
        <div className="flex items-center gap-1.5">
          {isListening ? (
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--color-df-danger)] animate-pulse">
              <span className="w-2 h-2 rounded-full bg-[var(--color-df-danger)]" />
              <span>Listening...</span>
            </span>
          ) : (
            <span className="text-[11px] font-medium text-[var(--color-df-ink-soft)] hidden sm:inline-block">
              Adding to <strong className="font-semibold text-[var(--color-df-ink)]">{targetLabel}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Input Pill Bar */}
      <form
        onSubmit={handleSubmit}
        className={`relative flex items-center bg-[var(--color-df-surface)] border rounded-[28px] p-1.5 shadow-md transition-all ${
          isListening
            ? 'border-[var(--color-df-danger)] ring-2 ring-[var(--color-df-danger)]/25'
            : 'border-[var(--color-df-ink-soft)]/20 focus-within:border-[var(--color-df-primary)] focus-within:ring-2 focus-within:ring-[var(--color-df-primary)]/20'
        }`}
      >
        {/* Plus / Direction Icon */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 ml-1 transition-colors"
          style={{ color: isListening ? 'var(--color-df-danger)' : accentColor }}
        >
          {isTargetTomorrow ? <CornerDownRight className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </div>

        {/* Full-width Text Input */}
        <input
          ref={inputRef}
          type="text"
          value={title}
          maxLength={200}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            isListening
              ? 'Listening... speak your task now'
              : `Add task for ${targetLabel}...`
          }
          className="flex-1 bg-transparent px-3 py-2 text-[15px] sm:text-[16px] text-[var(--color-df-ink)] placeholder-[var(--color-df-ink-soft)]/60 outline-none font-medium min-w-0"
          style={{ fontFamily: 'var(--font-body)' }}
        />

        {/* Voice-to-Text Microphone Button */}
        <button
          type="button"
          onClick={toggleSpeechRecognition}
          title={isListening ? 'Stop voice recording' : 'Speak task with voice'}
          aria-label={isListening ? 'Stop voice recording' : 'Start voice recording'}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer mr-1 ${
            isListening
              ? 'bg-[var(--color-df-danger)] text-white shadow-md animate-pulse'
              : 'text-[var(--color-df-ink-soft)] hover:text-[var(--color-df-ink)] hover:bg-[var(--color-df-surface-deep)]'
          }`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Submit Action Button */}
        <button
          type="submit"
          disabled={!title.trim()}
          aria-label={`Save task for ${targetLabel}`}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer ${
            title.trim()
              ? 'text-white active:scale-95 shadow-sm'
              : 'text-[var(--color-df-ink-soft)]/40 hover:text-[var(--color-df-ink-soft)]/70'
          }`}
          style={{
            backgroundColor: title.trim() ? accentColor : 'transparent',
          }}
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};
