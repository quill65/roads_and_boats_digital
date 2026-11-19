/**
 * Private Per-Player Map Notes Overlay
 * Renders persistent text notes pinned to arbitrary board world coordinates (x, y),
 * supports drag-to-reposition, click-to-edit/delete, and Note Placement Mode.
 */

import React, { useEffect, useRef, useState } from 'react';
import { MapNote, MapNoteColor } from '../../game/types';

interface ViewTransform {
  x: number;
  y: number;
  scale: number;
}

interface MapNotesLayerProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  viewTransform: ViewTransform;
  notes: MapNote[];
  showNotes: boolean;
  noteMode: boolean;
  disabled?: boolean;
  isRoadMode?: boolean;
  onExitNoteMode?: () => void;
  onCreateNote: (input: {
    x: number;
    y: number;
    text: string;
    color: MapNoteColor;
  }) => Promise<boolean> | void;
  onUpdateNote: (
    noteId: string,
    patch: { text?: string; x?: number; y?: number; color?: MapNoteColor }
  ) => Promise<boolean> | void;
  onDeleteNote: (noteId: string) => Promise<boolean> | void;
}

const COLOR_STYLES: Record<
  MapNoteColor,
  {
    card: string;
    pin: string;
    swatch: string;
    label: string;
  }
> = {
  amber: {
    card: 'bg-amber-950/92 border-amber-400/75 text-amber-50 shadow-amber-950/60',
    pin: 'bg-amber-400 border-amber-950',
    swatch: 'bg-amber-400',
    label: 'Amber',
  },
  sky: {
    card: 'bg-sky-950/92 border-sky-400/75 text-sky-50 shadow-sky-950/60',
    pin: 'bg-sky-400 border-sky-950',
    swatch: 'bg-sky-400',
    label: 'Sky',
  },
  emerald: {
    card: 'bg-emerald-950/92 border-emerald-400/75 text-emerald-50 shadow-emerald-950/60',
    pin: 'bg-emerald-400 border-emerald-950',
    swatch: 'bg-emerald-400',
    label: 'Emerald',
  },
  rose: {
    card: 'bg-rose-950/92 border-rose-400/75 text-rose-50 shadow-rose-950/60',
    pin: 'bg-rose-400 border-rose-950',
    swatch: 'bg-rose-400',
    label: 'Rose',
  },
};

const COLOR_LIST: MapNoteColor[] = ['amber', 'sky', 'emerald', 'rose'];

type EditorState =
  | { mode: 'create'; x: number; y: number }
  | { mode: 'edit'; note: MapNote };

export const MapNotesLayer: React.FC<MapNotesLayerProps> = ({
  containerRef,
  viewTransform,
  notes,
  showNotes,
  noteMode,
  disabled = false,
  isRoadMode = false,
  onExitNoteMode,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
}) => {
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [draftText, setDraftText] = useState('');
  const [draftColor, setDraftColor] = useState<MapNoteColor>('amber');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live drag preview for repositioning an existing note
  const [dragPreview, setDragPreview] = useState<{
    noteId: string;
    x: number;
    y: number;
  } | null>(null);

  const placementTapRef = useRef<{ x: number; y: number } | null>(null);
  const viewTransformRef = useRef(viewTransform);
  viewTransformRef.current = viewTransform;

  // Close editor if notes become disabled or the edited note was deleted externally
  useEffect(() => {
    if (disabled) {
      setEditor(null);
      return;
    }
    if (editor?.mode === 'edit' && !notes.some(n => n.id === editor.note.id)) {
      setEditor(null);
    }
  }, [disabled, notes, editor]);

  // Escape key closes active editor or exits note placement mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (editor) {
        setEditor(null);
      } else if (noteMode && onExitNoteMode) {
        onExitNoteMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, noteMode, onExitNoteMode]);

  const openCreateEditorAtClient = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const vt = viewTransformRef.current;
    const worldX = (clientX - rect.left - vt.x) / vt.scale;
    const worldY = (clientY - rect.top - vt.y) / vt.scale;
    setEditor({ mode: 'create', x: worldX, y: worldY });
    setDraftText('');
  };

  const openEditEditor = (note: MapNote) => {
    setEditor({ mode: 'edit', note });
    setDraftText(note.text);
    setDraftColor(note.color);
  };

  const handleSaveEditor = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!editor || isSubmitting) return;
    const trimmed = draftText.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      if (editor.mode === 'create') {
        const ok = await onCreateNote({
          x: editor.x,
          y: editor.y,
          text: trimmed,
          color: draftColor,
        });
        if (ok !== false) {
          setEditor(null);
          setDraftText('');
        }
      } else {
        const ok = await onUpdateNote(editor.note.id, {
          text: trimmed,
          color: draftColor,
        });
        if (ok !== false) {
          setEditor(null);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCurrent = async () => {
    if (!editor || editor.mode !== 'edit' || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const ok = await onDeleteNote(editor.note.id);
      if (ok !== false) {
        setEditor(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const startNotePointerInteraction = (
    note: MapNote,
    startClientX: number,
    startClientY: number
  ) => {
    if (disabled || isRoadMode) return;

    const origX = note.x;
    const origY = note.y;
    let dragged = false;
    let latestX = origX;
    let latestY = origY;

    const handleMove = (clientX: number, clientY: number) => {
      const dx = clientX - startClientX;
      const dy = clientY - startClientY;
      if (!dragged && Math.hypot(dx, dy) > 5) {
        dragged = true;
      }
      if (dragged) {
        const scale = viewTransformRef.current.scale || 1;
        latestX = origX + dx / scale;
        latestY = origY + dy / scale;
        setDragPreview({ noteId: note.id, x: latestX, y: latestY });
      }
    };

    const onMouseMove = (ev: MouseEvent) => handleMove(ev.clientX, ev.clientY);
    const onTouchMove = (ev: TouchEvent) => {
      if (ev.touches.length === 1) {
        ev.preventDefault();
        handleMove(ev.touches[0].clientX, ev.touches[0].clientY);
      }
    };

    const cleanup = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };

    const onEnd = () => {
      cleanup();
      setDragPreview(null);
      if (dragged) {
        onUpdateNote(note.id, { x: latestX, y: latestY });
      } else {
        openEditEditor(note);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
  };

  if (disabled) return null;

  const cardScale = Math.min(Math.max(viewTransform.scale, 0.72), 1.12);

  // Compute clamped viewport coordinates for active editor popover
  let editorScreenPos: { left: number; top: number } | null = null;
  if (editor) {
    const worldX = editor.mode === 'create' ? editor.x : editor.note.x;
    const worldY = editor.mode === 'create' ? editor.y : editor.note.y;
    const rawX = worldX * viewTransform.scale + viewTransform.x;
    const rawY = worldY * viewTransform.scale + viewTransform.y;
    const rect = containerRef.current?.getBoundingClientRect();
    const viewW = rect?.width || window.innerWidth;
    const viewH = rect?.height || window.innerHeight;
    const popW = Math.min(288, viewW - 24);
    const popH = 225;
    const left = Math.min(Math.max(rawX - popW / 2, 12), Math.max(12, viewW - popW - 12));
    const preferAbove = rawY - popH - 18 >= 86;
    const top = preferAbove
      ? rawY - popH - 18
      : Math.min(Math.max(rawY + 14, 86), Math.max(86, viewH - popH - 16));
    editorScreenPos = { left, top };
  }

  return (
    <>
      {/* Click-capture layer for Note Placement Mode (allows pan/zoom to bubble to HexBoard container) */}
      {noteMode && !editor && (
        <div
          aria-label="Tap anywhere on the map to place a private note"
          className="absolute inset-0 z-10 cursor-crosshair"
          onMouseDown={e => {
            if (e.button === 0) {
              placementTapRef.current = { x: e.clientX, y: e.clientY };
            }
          }}
          onMouseUp={e => {
            const start = placementTapRef.current;
            placementTapRef.current = null;
            if (!start || e.button !== 0) return;
            if (Math.hypot(e.clientX - start.x, e.clientY - start.y) <= 6) {
              openCreateEditorAtClient(e.clientX, e.clientY);
            }
          }}
          onTouchStart={e => {
            if (e.touches.length === 1) {
              placementTapRef.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
              };
            } else {
              placementTapRef.current = null;
            }
          }}
          onTouchEnd={e => {
            const start = placementTapRef.current;
            placementTapRef.current = null;
            if (!start || e.changedTouches.length !== 1) return;
            const t = e.changedTouches[0];
            if (Math.hypot(t.clientX - start.x, t.clientY - start.y) <= 10) {
              openCreateEditorAtClient(t.clientX, t.clientY);
            }
          }}
        />
      )}

      {/* Existing Private Notes Layer */}
      {showNotes && (
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
          {notes.map(note => {
            const isDraggingThis = dragPreview?.noteId === note.id;
            const wx = isDraggingThis ? dragPreview.x : note.x;
            const wy = isDraggingThis ? dragPreview.y : note.y;
            const sx = wx * viewTransform.scale + viewTransform.x;
            const sy = wy * viewTransform.scale + viewTransform.y;
            const style = COLOR_STYLES[note.color] || COLOR_STYLES.amber;
            const isBeingEdited = editor?.mode === 'edit' && editor.note.id === note.id;

            return (
              <div
                key={note.id}
                style={{
                  left: `${sx}px`,
                  top: `${sy}px`,
                  transform: `translate(-50%, -100%) scale(${cardScale})`,
                  transformOrigin: '50% 100%',
                }}
                onMouseDown={e => {
                  if (e.button !== 0 || isRoadMode) return;
                  e.stopPropagation();
                  startNotePointerInteraction(note, e.clientX, e.clientY);
                }}
                onTouchStart={e => {
                  if (e.touches.length !== 1 || isRoadMode) return;
                  e.stopPropagation();
                  startNotePointerInteraction(note, e.touches[0].clientX, e.touches[0].clientY);
                }}
                className={`absolute flex flex-col items-center select-none ${
                  isRoadMode
                    ? 'pointer-events-none opacity-55'
                    : isDraggingThis
                    ? 'pointer-events-auto cursor-grabbing z-30 opacity-95'
                    : 'pointer-events-auto cursor-pointer hover:brightness-110 z-10'
                }`}
                title="Private note (only visible to you) — Click to edit or delete, drag to move"
              >
                <div
                  className={`max-w-[180px] min-w-[68px] px-2 py-1 rounded-lg border backdrop-blur-sm shadow-lg text-[11px] leading-snug font-medium whitespace-pre-wrap break-words ${
                    style.card
                  } ${isBeingEdited ? 'ring-2 ring-white/80' : ''}`}
                >
                  <div className="flex items-start gap-1">
                    <span className="text-[10px] opacity-80 shrink-0 leading-snug" aria-hidden="true">
                      📝
                    </span>
                    <span className="min-w-0 flex-1">{note.text}</span>
                  </div>
                </div>
                {/* Pin stem & anchor dot locked to exact world (x, y) */}
                <div className={`w-0.5 h-2 ${style.swatch} opacity-80`} />
                <div className={`w-2.5 h-2.5 rounded-full border-2 shadow ${style.pin}`} />
              </div>
            );
          })}

          {/* Pin marker preview while composing a new note */}
          {editor?.mode === 'create' && (
            <div
              style={{
                left: `${editor.x * viewTransform.scale + viewTransform.x}px`,
                top: `${editor.y * viewTransform.scale + viewTransform.y}px`,
                transform: 'translate(-50%, -50%)',
              }}
              className="absolute pointer-events-none z-20"
            >
              <span
                className={`block w-3.5 h-3.5 rounded-full border-2 border-white shadow-lg animate-pulse ${
                  COLOR_STYLES[draftColor].swatch
                }`}
              />
            </div>
          )}
        </div>
      )}

      {/* Floating Inline Editor Popover (Create or Edit Note) */}
      {editor && editorScreenPos && (
        <div
          style={{
            left: `${editorScreenPos.left}px`,
            top: `${editorScreenPos.top}px`,
          }}
          onMouseDown={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
          onWheel={e => e.stopPropagation()}
          className="absolute z-40 w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-slate-900/98 backdrop-blur-md border border-amber-500/50 shadow-2xl overflow-hidden select-text"
        >
          <div className="px-3.5 py-2 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm shrink-0">📝</span>
              <span className="text-xs font-bold text-amber-200 truncate">
                {editor.mode === 'create' ? 'Add Map Note' : 'Edit Map Note'}
              </span>
              <span
                className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0"
                title="Private planning note — hidden from all other players"
              >
                🔒 Private
              </span>
            </div>
            <button
              type="button"
              onClick={() => setEditor(null)}
              aria-label="Close Note Editor"
              className="w-6 h-6 rounded text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center text-xs shrink-0"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSaveEditor} className="p-3 space-y-2.5">
            <textarea
              value={draftText}
              onChange={e => setDraftText(e.target.value)}
              onKeyDown={e => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveEditor();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  setEditor(null);
                }
              }}
              rows={3}
              maxLength={240}
              autoFocus
              disabled={isSubmitting}
              placeholder="Write a planning note (e.g. Sawmill R3, bridge here, route stone north)..."
              className="w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-700 focus:border-amber-400 focus:outline-none text-xs text-white placeholder:text-slate-500 resize-none leading-snug"
            />

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {COLOR_LIST.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setDraftColor(c)}
                    aria-label={`${COLOR_STYLES[c].label} note color`}
                    title={COLOR_STYLES[c].label}
                    className={`w-5 h-5 rounded-full ${COLOR_STYLES[c].swatch} transition-transform ${
                      draftColor === c
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110'
                        : 'opacity-65 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                {draftText.length}/240
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
              {editor.mode === 'edit' ? (
                <button
                  type="button"
                  onClick={handleDeleteCurrent}
                  disabled={isSubmitting}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-700 border border-rose-800/70 transition-colors disabled:opacity-50"
                >
                  🗑️ Delete
                </button>
              ) : (
                <span className="text-[10px] text-slate-500">Drag note to move later</span>
              )}

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setEditor(null)}
                  disabled={isSubmitting}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !draftText.trim()}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-extrabold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors shadow disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
