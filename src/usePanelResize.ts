import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';

const KEY = 'tandem.previewWidth';
const DEFAULT_WIDTH = 400;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function usePanelResize() {
 const containerRef = useRef<HTMLElement>(null);
 const [preferredWidth, setPreferredWidth] = useState(() => {
  try { const saved = Number(localStorage.getItem(KEY)); return Number.isFinite(saved) && saved >= 300 ? saved : DEFAULT_WIDTH; }
  catch { return DEFAULT_WIDTH; }
 });
 const preferredRef = useRef(preferredWidth);
 const [size, setSize] = useState({ container: 0, viewport: window.innerWidth });
 const [resizing, setResizing] = useState(false);
 const drag = useRef<{ x: number; width: number } | null>(null);
 useEffect(() => {
  const element = containerRef.current;
  if (!element) return;
  const measure = () => setSize({ container: element.clientWidth, viewport: window.innerWidth });
  const observer = new ResizeObserver(measure);
  observer.observe(element); window.addEventListener('resize', measure); measure();
  return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
 }, []);
 const max = size.viewport > 1000 ? Math.max(300, size.container - 420) : Math.max(300, size.viewport - 32);
 const width = Math.round(clamp(preferredWidth, 300, max));
 const update = (next: number) => { const bounded = Math.round(clamp(next, 300, max)); preferredRef.current = bounded; setPreferredWidth(bounded); };
 const save = () => { try { localStorage.setItem(KEY, String(preferredRef.current)); } catch { /* Storage may be disabled. Resizing still works. */ } };
 const finish = () => { if (drag.current) { drag.current = null; setResizing(false); save(); } };
 const reset = () => { update(DEFAULT_WIDTH); save(); };
 return {
  containerRef, width, resizing,
  handleProps: {
   role: 'separator', tabIndex: 0,
   'aria-label': 'Resize preview pane', 'aria-orientation': 'vertical' as const,
   'aria-valuemin': 300, 'aria-valuemax': Math.round(max), 'aria-valuenow': width,
   'aria-valuetext': `${width} pixels`, 'aria-controls': 'workspace-panel',
   title: 'Drag to resize · Double-click to reset · Arrow keys to adjust',
   onDoubleClick: reset,
   onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault(); event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, width }; setResizing(true);
   },
   onPointerMove: (event: PointerEvent<HTMLDivElement>) => { if (drag.current) update(drag.current.width + drag.current.x - event.clientX); },
   onPointerUp: (event: PointerEvent<HTMLDivElement>) => { finish(); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); },
   onPointerCancel: finish, onLostPointerCapture: finish,
   onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
    const step = event.shiftKey ? 48 : 16;
    const next = event.key === 'ArrowLeft' ? width + step : event.key === 'ArrowRight' ? width - step : event.key === 'Home' ? 300 : event.key === 'End' ? max : event.key === 'Enter' ? DEFAULT_WIDTH : null;
    if (next !== null) { event.preventDefault(); update(next); save(); }
   }
  }
 };
}
