/**
 * Board Camera Pan, Zoom, Touch Pinch & Auto-Centering Hook
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { HexOrientation, HexTile } from '../../game/types';
import { hexToPixel } from '../../game/hexMath';

const MOUSE_DRAG_THRESHOLD_PX = 5;
const TOUCH_DRAG_THRESHOLD_PX = 10;

export function useBoardViewport(
  containerRef: React.RefObject<HTMLDivElement | null>,
  gameId: string,
  hexes: Record<string, HexTile>,
  hexRadius: number,
  orientation: HexOrientation = 'pointy'
) {
  const [viewTransform, setViewTransform] = useState({ x: 500, y: 380, scale: 1 });
  const viewTransformRef = useRef(viewTransform);
  viewTransformRef.current = viewTransform;

  const isMouseDownRef = useRef(false);
  const isTouchActiveRef = useRef(false);
  const didPanRef = useRef(false);
  const suppressClickRef = useRef(false);
  const suppressTimerRef = useRef<number | null>(null);

  const pointerStartClientRef = useRef({ x: 0, y: 0 });
  const pointerOriginTransformRef = useRef({ x: 0, y: 0 });

  const touchStartDistRef = useRef<number | null>(null);
  const touchStartTransformRef = useRef({ x: 0, y: 0, scale: 1 });
  const touchStartMidRef = useRef({ x: 0, y: 0 });

  const scheduleClearSuppressClick = () => {
    if (suppressTimerRef.current !== null) {
      window.clearTimeout(suppressTimerRef.current);
    }
    suppressTimerRef.current = window.setTimeout(() => {
      suppressClickRef.current = false;
      suppressTimerRef.current = null;
    }, 120);
  };

  useEffect(() => {
    return () => {
      if (suppressTimerRef.current !== null) {
        window.clearTimeout(suppressTimerRef.current);
      }
    };
  }, []);

  const fitBoardToView = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    const w = rect?.width || 1000;
    const h = rect?.height || 760;
    const hexList = Object.values(hexes);
    if (hexList.length === 0) {
      setViewTransform({ x: w / 2, y: h / 2, scale: 1 });
      return;
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    hexList.forEach(hex => {
      const p = hexToPixel(hex.q, hex.r, hexRadius, orientation);
      minX = Math.min(minX, p.x - hexRadius);
      maxX = Math.max(maxX, p.x + hexRadius);
      minY = Math.min(minY, p.y - hexRadius);
      maxY = Math.max(maxY, p.y + hexRadius);
    });

    const boardW = Math.max(maxX - minX, hexRadius * 2);
    const boardH = Math.max(maxY - minY, hexRadius * 2);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const availW = w < 640 ? Math.max(w - 24, 240) : Math.max(w - 120, 320);
    const availH = h < 640 ? Math.max(h - 150, 220) : Math.max(h - 210, 260);
    const fitScale = Math.min(Math.max(Math.min(availW / boardW, availH / boardH), 0.45), 1.15);

    setViewTransform({
      x: w / 2 - centerX * fitScale,
      y: h / 2 - 12 - centerY * fitScale,
      scale: fitScale,
    });
  }, [containerRef, hexes, hexRadius, orientation]);

  useEffect(() => {
    fitBoardToView();
  }, [gameId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const panDelta = 60;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          setViewTransform(prev => ({ ...prev, y: prev.y + panDelta }));
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          setViewTransform(prev => ({ ...prev, y: prev.y - panDelta }));
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          setViewTransform(prev => ({ ...prev, x: prev.x + panDelta }));
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          setViewTransform(prev => ({ ...prev, x: prev.x - panDelta }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) {
      isMouseDownRef.current = true;
      didPanRef.current = false;
      suppressClickRef.current = false;
      pointerStartClientRef.current = { x: e.clientX, y: e.clientY };
      pointerOriginTransformRef.current = {
        x: viewTransformRef.current.x,
        y: viewTransformRef.current.y,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current) return;
    const dx = e.clientX - pointerStartClientRef.current.x;
    const dy = e.clientY - pointerStartClientRef.current.y;
    if (!didPanRef.current) {
      if (Math.hypot(dx, dy) < MOUSE_DRAG_THRESHOLD_PX) return;
      didPanRef.current = true;
    }
    setViewTransform(prev => ({
      ...prev,
      x: pointerOriginTransformRef.current.x + dx,
      y: pointerOriginTransformRef.current.y + dy,
    }));
  };

  const handleMouseUp = () => {
    if (isMouseDownRef.current && didPanRef.current) {
      suppressClickRef.current = true;
      scheduleClearSuppressClick();
    }
    isMouseDownRef.current = false;
    didPanRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;

    setViewTransform(prev => {
      const newScale = Math.min(Math.max(prev.scale * zoomFactor, 0.35), 2.8);
      const newX = mouseX - ((mouseX - prev.x) / prev.scale) * newScale;
      const newY = mouseY - ((mouseY - prev.y) / prev.scale) * newScale;
      return { x: newX, y: newY, scale: newScale };
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isTouchActiveRef.current = true;
      didPanRef.current = false;
      suppressClickRef.current = false;
      touchStartDistRef.current = null;
      pointerStartClientRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      pointerOriginTransformRef.current = {
        x: viewTransformRef.current.x,
        y: viewTransformRef.current.y,
      };
    } else if (e.touches.length >= 2) {
      isTouchActiveRef.current = false;
      didPanRef.current = true;
      suppressClickRef.current = true;
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist || 1;
      touchStartTransformRef.current = { ...viewTransformRef.current };

      const rect = containerRef.current?.getBoundingClientRect();
      touchStartMidRef.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2 - (rect?.left || 0),
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2 - (rect?.top || 0),
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isTouchActiveRef.current) {
      const dx = e.touches[0].clientX - pointerStartClientRef.current.x;
      const dy = e.touches[0].clientY - pointerStartClientRef.current.y;
      if (!didPanRef.current) {
        if (Math.hypot(dx, dy) < TOUCH_DRAG_THRESHOLD_PX) return;
        didPanRef.current = true;
      }
      setViewTransform(prev => ({
        ...prev,
        x: pointerOriginTransformRef.current.x + dx,
        y: pointerOriginTransformRef.current.y + dy,
      }));
    } else if (e.touches.length >= 2 && touchStartDistRef.current) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = currentDist / touchStartDistRef.current;
      const initial = touchStartTransformRef.current;

      const rect = containerRef.current?.getBoundingClientRect();
      const currentMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - (rect?.left || 0);
      const currentMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - (rect?.top || 0);

      const newScale = Math.min(Math.max(initial.scale * factor, 0.35), 2.8);
      const newX = currentMidX - ((touchStartMidRef.current.x - initial.x) / initial.scale) * newScale;
      const newY = currentMidY - ((touchStartMidRef.current.y - initial.y) / initial.scale) * newScale;

      setViewTransform({ x: newX, y: newY, scale: newScale });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      if (didPanRef.current) {
        suppressClickRef.current = true;
        scheduleClearSuppressClick();
      }
      isTouchActiveRef.current = false;
      didPanRef.current = false;
      touchStartDistRef.current = null;
    }
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (suppressClickRef.current) {
      e.stopPropagation();
      e.preventDefault();
      suppressClickRef.current = false;
    }
  };

  return {
    viewTransform,
    fitBoardToView,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleClickCapture,
  };
}
