/**
 * Board Camera Pan, Zoom, Touch Pinch & Auto-Centering Hook
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { HexOrientation, HexTile } from '../../game/types';
import { hexToPixel } from '../../game/hexMath';

export function useBoardViewport(
  containerRef: React.RefObject<HTMLDivElement | null>,
  gameId: string,
  hexes: Record<string, HexTile>,
  hexRadius: number,
  orientation: HexOrientation = 'pointy'
) {
  const [viewTransform, setViewTransform] = useState({ x: 500, y: 380, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const touchStartDistRef = useRef<number | null>(null);
  const touchStartTransformRef = useRef({ x: 0, y: 0, scale: 1 });
  const touchStartMidRef = useRef({ x: 0, y: 0 });
  const lastTapRef = useRef<number>(0);

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
    const availW = w < 640 ? Math.max(w - 32, 240) : Math.max(w - 120, 320);
    const availH = h < 640 ? Math.max(h - 170, 220) : Math.max(h - 210, 260);
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
      setIsPanning(true);
      setDragStart({ x: e.clientX - viewTransform.x, y: e.clientY - viewTransform.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setViewTransform(prev => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    }));
  };

  const handleMouseUp = () => {
    setIsPanning(false);
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
    const now = Date.now();
    if (e.touches.length === 1 && now - lastTapRef.current < 300) {
      const rect = containerRef.current?.getBoundingClientRect();
      const tx = e.touches[0].clientX - (rect?.left || 0);
      const ty = e.touches[0].clientY - (rect?.top || 0);

      setViewTransform(prev => {
        const targetScale = prev.scale > 1.2 ? 1.0 : 1.6;
        const newX = tx - ((tx - prev.x) / prev.scale) * targetScale;
        const newY = ty - ((ty - prev.y) / prev.scale) * targetScale;
        return { x: newX, y: newY, scale: targetScale };
      });
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;

    if (e.touches.length === 1) {
      setIsPanning(true);
      setDragStart({
        x: e.touches[0].clientX - viewTransform.x,
        y: e.touches[0].clientY - viewTransform.y,
      });
    } else if (e.touches.length >= 2) {
      setIsPanning(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
      touchStartTransformRef.current = { ...viewTransform };

      const rect = containerRef.current?.getBoundingClientRect();
      touchStartMidRef.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2 - (rect?.left || 0),
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2 - (rect?.top || 0),
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isPanning) {
      setViewTransform(prev => ({
        ...prev,
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
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

  const handleTouchEnd = () => {
    setIsPanning(false);
    touchStartDistRef.current = null;
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
  };
}
