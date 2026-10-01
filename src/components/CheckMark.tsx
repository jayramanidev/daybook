import React from 'react';
import { motion } from 'motion/react';

interface CheckMarkProps {
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export const CheckMark: React.FC<CheckMarkProps> = ({ checked, onToggle, disabled = false }) => {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className="relative flex items-center justify-center w-11 h-11 -m-2 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-df-primary)] cursor-pointer touch-manipulation group"
      aria-label={checked ? 'Mark task incomplete' : 'Mark task complete'}
    >
      <div className="relative w-7 h-7 flex items-center justify-center">
        {/* Box outline & fill */}
        <motion.div
          className="absolute inset-0 rounded-[8px]"
          animate={{
            backgroundColor: checked ? 'var(--color-df-primary)' : 'transparent',
            borderColor: checked ? 'var(--color-df-primary)' : 'rgba(91, 90, 128, 0.35)',
            borderWidth: checked ? 0 : 2,
            borderRadius: checked ? '10px' : '8px',
          }}
          transition={{
            duration: 0.14,
            ease: [0.4, 0, 0.2, 1],
          }}
        />

        {/* Checkmark SVG stroke draw */}
        <svg
          viewBox="0 0 28 28"
          className="w-7 h-7 absolute inset-0 pointer-events-none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.path
            d="M 7.5 14.8 L 12 19.3 L 20.8 9.5"
            stroke="white"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{
              pathLength: checked ? 1 : 0,
              opacity: checked ? 1 : 0,
            }}
            transition={{
              pathLength: {
                duration: 0.22,
                ease: [0.4, 0, 0.2, 1],
                delay: checked ? 0.05 : 0,
              },
              opacity: {
                duration: 0.1,
              },
            }}
          />
        </svg>
      </div>
    </button>
  );
};
