/**
 * Roads & Boats - Interactive Tutorial Drawer
 * Features deep-dive Round 1 walkthrough checklist, tactical guidance,
 * lesson jump navigation, and board preset loader.
 */

import React, { useState } from 'react';
import { TUTORIAL_LESSONS } from '../game/tutorialData';

interface TutorialDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadTutorialMap: (mapId: string) => void;
  originalMatchId?: string | null;
  onReturnToOriginalMatch?: () => void;
}

export const TutorialDrawer: React.FC<TutorialDrawerProps> = ({
  isOpen,
  onClose,
  onLoadTutorialMap,
  originalMatchId,
  onReturnToOriginalMatch,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const currentLesson = TUTORIAL_LESSONS[currentStepIndex];

  if (!isOpen) return null;

  return (
    <div
      className={`fixed top-14 sm:top-16 left-2 sm:left-4 z-40 bg-slate-950/95 backdrop-blur-md border border-amber-500/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-4.5rem)] sm:max-h-[calc(100dvh-5.5rem)] transition-all duration-200 animate-slide-in ${
        isExpanded ? 'w-[680px] max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-2rem)]' : 'w-[420px] max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-2rem)]'
      }`}
    >
      {/* Header */}
      <div className="px-4 sm:px-5 py-3 bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-950 border-b border-amber-900/50 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
          <span className="text-xl shrink-0">🎓</span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h3 className="text-sm font-bold text-amber-200">
                Interactive Tutorial · Lesson {currentStepIndex + 1} of {TUTORIAL_LESSONS.length}
              </h3>
              {currentLesson.round1Focus && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold uppercase bg-amber-400 text-slate-950 shadow-sm animate-pulse shrink-0">
                  CRITICAL
                </span>
              )}
            </div>
            <p className="text-[11px] text-amber-300/80 truncate">{currentLesson.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsExpanded(prev => !prev)}
            className="hidden sm:inline-flex px-2 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-[11px] font-medium transition-colors border border-slate-800"
            title={isExpanded ? 'Collapse Drawer' : 'Expand Drawer'}
          >
            {isExpanded ? '⤢ Compact' : '⤡ Expand'}
          </button>
          <button
            onClick={onClose}
            aria-label="Close Tutorial"
            className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-center text-xs transition-colors shrink-0"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Quick Lesson Selector Pills */}
      <div className="flex items-center gap-1 px-4 py-2 bg-slate-900/80 border-b border-slate-800/80 overflow-x-auto no-scrollbar shrink-0">
        {TUTORIAL_LESSONS.map((lesson, idx) => (
          <button
            key={lesson.id}
            onClick={() => setCurrentStepIndex(idx)}
            className={`px-2.5 py-1 text-[11px] rounded-lg font-semibold shrink-0 transition-colors ${
              currentStepIndex === idx
                ? 'bg-amber-400 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {idx === 1 ? '⭐ Turn 1 Guide' : `${idx + 1}. ${lesson.title.split('. ')[1] || lesson.title}`}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
        {/* Title */}
        <div>
          <h4 className="text-base font-bold text-white font-serif-title leading-snug">
            {currentLesson.title}
          </h4>
        </div>

        {/* Objective Box */}
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-700/50 space-y-1">
          <p className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider">
            Lesson Objective:
          </p>
          <p className="text-slate-100 font-semibold">{currentLesson.objective}</p>
        </div>

        {/* Dedicated Interactive UI Actions Guide */}
        {currentLesson.uiSteps && currentLesson.uiSteps.length > 0 && (
          <div className="space-y-2 p-3.5 rounded-xl bg-slate-900/90 border-2 border-emerald-500/70 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/30 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎮</span>
                <span className="font-extrabold text-emerald-300 uppercase tracking-wide text-xs">
                  Exact UI Button Actions
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/50">
                Click-by-Click Guide
              </span>
            </div>

            <div className="space-y-2 pt-1">
              {currentLesson.uiSteps.map((uiStep, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-start gap-2.5"
                >
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold shrink-0">
                    Step {idx + 1}
                  </span>
                  <div className="text-xs min-w-0">
                    <p className="font-bold text-white">{uiStep.label}</p>
                    <p className="text-slate-300 text-[11px] leading-relaxed mt-0.5">{uiStep.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dedicated Round 1 Opening Checklist */}
        {currentLesson.round1Focus && currentLesson.round1Checklist && (
          <div className="space-y-2 p-3.5 rounded-xl bg-slate-900 border-2 border-amber-400/60 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/30 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">📋</span>
                <span className="font-extrabold text-amber-300 uppercase tracking-wide text-xs">
                  Round 1 Step-by-Step Execution Plan
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Setup: 3 Donkeys · 5 Boards · 1 Stone · 2 Geese</span>
            </div>

            <div className="space-y-2.5 pt-1">
              {currentLesson.round1Checklist.map((item, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="font-bold text-white">{item.step}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[10px] font-semibold">
                      {item.transporter}
                    </span>
                  </div>
                  <p className="text-amber-200/90 font-medium">{item.action}</p>
                  <p className="text-[11px] text-slate-400 italic leading-relaxed">
                    <span className="text-slate-300 font-semibold not-italic">Strategic Rationale: </span>
                    {item.why}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Explanations */}
        <div className="space-y-2 text-slate-300 leading-relaxed">
          {currentLesson.explanation.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        {/* Tactical Advice Box */}
        {currentLesson.tacticalAdvice && currentLesson.tacticalAdvice.length > 0 && (
          <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-800/50 space-y-1.5">
            <p className="text-[10px] font-extrabold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>💡</span>
              <span>Veteran Tactical Advice:</span>
            </p>
            <ul className="space-y-1">
              {currentLesson.tacticalAdvice.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-1.5 text-slate-300 leading-snug">
                  <span className="text-sky-400 mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Key Rules List */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Rulebook Takeaway:
          </p>
          <ul className="space-y-1">
            {currentLesson.keyRules.map((rule, idx) => (
              <li key={idx} className="flex items-start gap-1.5 text-slate-300 leading-snug">
                <span className="text-amber-400 mt-0.5">✓</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="px-4 sm:px-5 py-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <button
          disabled={currentStepIndex === 0}
          onClick={() => setCurrentStepIndex(prev => Math.max(prev - 1, 0))}
          className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
            currentStepIndex === 0
              ? 'text-slate-600 bg-slate-900 cursor-not-allowed'
              : 'text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700'
          }`}
        >
          ← Previous
        </button>

        <div className="flex items-center gap-2">
          {originalMatchId && onReturnToOriginalMatch && (
            <button
              onClick={() => {
                onReturnToOriginalMatch();
                onClose();
              }}
              className="px-3 py-1.5 text-[11px] font-extrabold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all shadow-md flex items-center gap-1.5 animate-pulse"
              title="Return to your main game match"
            >
              <span>↩️</span>
              <span>Return to My Match</span>
            </button>
          )}

          <button
            onClick={() => onLoadTutorialMap(currentLesson.recommendedMap)}
            className="px-3 py-1.5 text-[11px] font-semibold text-amber-300 hover:text-amber-200 bg-amber-950/60 border border-amber-800/60 rounded-lg transition-colors flex items-center gap-1"
            title="Load this lesson's practice board layout (you can return to your game match anytime)"
          >
            <span>🗺️</span>
            <span>Load Practice Board</span>
          </button>
        </div>

        <button
          disabled={currentStepIndex === TUTORIAL_LESSONS.length - 1}
          onClick={() =>
            setCurrentStepIndex(prev => Math.min(prev + 1, TUTORIAL_LESSONS.length - 1))
          }
          className={`px-3 py-1.5 text-xs rounded-lg font-bold transition-colors ${
            currentStepIndex === TUTORIAL_LESSONS.length - 1
              ? 'text-slate-600 bg-slate-900 cursor-not-allowed'
              : 'text-slate-950 bg-amber-400 hover:bg-amber-300 shadow'
          }`}
        >
          Next →
        </button>
      </div>
    </div>
  );
};
