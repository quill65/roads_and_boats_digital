/**
 * Learning & Refs Dropdown Sub-Menu
 * Groups Player Aid, Interactive Tutorial, and Game Rules under a single header menu.
 */

import React, { useEffect, useRef, useState } from 'react';

interface LearningRefsMenuProps {
  onOpenPlayerAid: () => void;
  onOpenTutorial: () => void;
  onOpenGameRules?: () => void;
  variant?: 'hud' | 'lobby';
}

export const LearningRefsMenu: React.FC<LearningRefsMenuProps> = ({
  onOpenPlayerAid,
  onOpenTutorial,
  onOpenGameRules,
  variant = 'hud',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 240;
      const spaceRight = window.innerWidth - rect.left;
      const spaceLeft = rect.right;
      // Align left edge of dropdown with button if enough room on right; otherwise align right edge
      if (spaceRight >= menuWidth + 12) {
        setAlignRight(false);
      } else if (spaceLeft >= menuWidth + 12) {
        setAlignRight(true);
      } else {
        setAlignRight(rect.left > window.innerWidth / 2);
      }
    }
    setIsOpen(prev => !prev);
  };

  const triggerClass =
    variant === 'lobby'
      ? `px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold rounded-lg border transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow ${
          isOpen
            ? 'text-slate-950 bg-amber-400 border-amber-300'
            : 'text-amber-300 hover:text-white bg-slate-900 border-amber-600/60 hover:bg-slate-800'
        }`
      : `px-2 sm:px-2.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold rounded-lg border transition-colors whitespace-nowrap flex items-center gap-1 ${
          isOpen
            ? 'text-slate-950 bg-amber-400 border-amber-300 shadow'
            : 'text-amber-300 hover:text-white bg-slate-900 border-amber-600/60 hover:bg-slate-800'
        }`;

  return (
    <div ref={containerRef} className="relative inline-block shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={triggerClass}
        title="Learning & References: Player Aid, Tutorial, and Game Rules"
      >
        <span>📚</span>
        <span>Learning &amp; Refs</span>
        <span
          className={`text-[10px] leading-none transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Learning & Refs"
          className={`absolute top-full mt-1.5 z-50 w-60 max-w-[calc(100vw-1rem)] py-1.5 rounded-xl bg-slate-900/98 backdrop-blur-md border border-amber-500/45 shadow-2xl ${
            alignRight ? 'right-0' : 'left-0'
          }`}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onOpenPlayerAid();
            }}
            className="w-full px-3 py-2 text-left hover:bg-slate-800/90 transition-colors flex items-start gap-2.5 group"
          >
            <span className="text-base leading-none mt-0.5 shrink-0">📋</span>
            <span className="min-w-0">
              <span className="block text-xs font-bold text-amber-200 group-hover:text-white">
                Player Aid
              </span>
              <span className="block text-[10px] text-slate-400 leading-snug">
                Buildings, Vehicles &amp; Tech Tree
              </span>
            </span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onOpenTutorial();
            }}
            className="w-full px-3 py-2 text-left hover:bg-slate-800/90 transition-colors flex items-start gap-2.5 group"
          >
            <span className="text-base leading-none mt-0.5 shrink-0">🎓</span>
            <span className="min-w-0">
              <span className="block text-xs font-bold text-amber-300 group-hover:text-white">
                Tutorial
              </span>
              <span className="block text-[10px] text-slate-400 leading-snug">
                Interactive Step-by-Step Guide
              </span>
            </span>
          </button>

          {onOpenGameRules && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                onOpenGameRules();
              }}
              className="w-full px-3 py-2 text-left hover:bg-slate-800/90 transition-colors flex items-start gap-2.5 group"
            >
              <span className="text-base leading-none mt-0.5 shrink-0">📖</span>
              <span className="min-w-0">
                <span className="block text-xs font-bold text-slate-200 group-hover:text-white">
                  Game Rules
                </span>
                <span className="block text-[10px] text-slate-400 leading-snug">
                  Official Rulebook &amp; Almanac
                </span>
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
