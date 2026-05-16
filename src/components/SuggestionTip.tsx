import * as React from 'react'
import { useState, useRef, useEffect, useCallback } from 'react'

type Props = {
  suggestion: string
  onApply: (value: string) => void
}

const SuggestionTip = ({ suggestion, onApply }: Props) => {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  const reposition = useCallback(() => {
    const popover = popoverRef.current;
    const trigger = triggerRef.current;
    if (!popover || !trigger) return;

    const triggerRect = trigger.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();

    let top = -(popoverRect.height + 8);
    let left = 0;

    if (triggerRect.top + top < 0) {
      top = triggerRect.height + 8;
    }

    if (triggerRect.left + left + popoverRect.width > window.innerWidth) {
      left = window.innerWidth - triggerRect.left - popoverRect.width - 4;
    }

    popover.style.top = top + 'px';
    popover.style.left = left + 'px';
  }, []);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(reposition);

    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, reposition]);

  return (
    <span className="suggestion-anchor">
      <span
        ref={triggerRef}
        className="suggestion-indicator"
        onClick={() => setOpen(!open)}
        title="AI suggestion available"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z" />
        </svg>
      </span>
      {open && (
        <div ref={popoverRef} className="suggestion-popover">
          <pre
            className="suggestion-value"
            onClick={() => onApply(suggestion)}
            title="Click to apply"
          >{suggestion}</pre>
        </div>
      )}
    </span>
  );
};

export default SuggestionTip;
