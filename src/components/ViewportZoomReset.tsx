'use client';

import { useEffect } from 'react';

export function ViewportZoomReset() {
  useEffect(() => {
    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) return;
        const original = viewport.getAttribute('content') ?? '';
        viewport.setAttribute('content', original + ', maximum-scale=1');
        setTimeout(() => {
          viewport.setAttribute('content', original);
        }, 100);
      }
    };
    document.addEventListener('focusout', handleFocusOut);
    return () => document.removeEventListener('focusout', handleFocusOut);
  }, []);
  return null;
}
