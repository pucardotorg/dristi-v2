"use client";

import { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface ToolbarButton {
  cmd: string;
  title: string;
  label: React.ReactNode;
}

type ToolbarItem = ToolbarButton | "sep";

const TOOLBAR: ToolbarItem[] = [
  { cmd: "bold",  title: "Bold",   label: <b>B</b> },
  { cmd: "italic", title: "Italic", label: <i>I</i> },
  "sep",
  {
    cmd: "insertOrderedList",
    title: "Numbered list",
    label: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" />
        <path d="M4 6h1v4" /><path d="M4 10h2" /><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
      </svg>
    ),
  },
  {
    cmd: "insertUnorderedList",
    title: "Bullet list",
    label: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  "sep",
  {
    cmd: "justifyLeft",
    title: "Align left",
    label: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="15" y2="12" /><line x1="3" y1="18" x2="18" y2="18" />
      </svg>
    ),
  },
];

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write here",
  minHeight = 120,
  className,
}: RichTextEditorProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el || isInternalUpdate.current) return;
    if (el.innerHTML !== value) el.innerHTML = value;
  }, [value]);

  const handleInput = useCallback(() => {
    const el = bodyRef.current;
    if (!el) return;
    isInternalUpdate.current = true;
    onChange(el.innerHTML);
    requestAnimationFrame(() => { isInternalUpdate.current = false; });
  }, [onChange]);

  const exec = useCallback((cmd: string) => {
    bodyRef.current?.focus();
    document.execCommand(cmd, false);
  }, []);

  return (
    <div className={cn("border border-input rounded-md bg-muted/40 dark:bg-input/30 overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2.5 py-2 border-b border-input bg-slate-50 dark:bg-slate-900/50">
        {TOOLBAR.map((item, i) =>
          item === "sep" ? (
            <div key={i} className="w-px h-[18px] bg-slate-200 dark:bg-slate-700 mx-1" />
          ) : (
            <button
              key={item.cmd}
              type="button"
              title={item.title}
              onMouseDown={(e) => { e.preventDefault(); exec(item.cmd); }}
              className="w-8 h-8 rounded border-0 bg-transparent inline-flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 font-bold text-sm [&_svg]:w-4 [&_svg]:h-4"
            >
              {item.label}
            </button>
          )
        )}
      </div>
      {/* Editable body */}
      <div
        ref={bodyRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={handleInput}
        className="px-4 py-3.5 text-sm text-slate-900 dark:text-slate-100 font-body leading-relaxed outline-none focus:bg-white dark:focus:bg-slate-900 [&_p:not(:last-child)]:mb-3 empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 dark:empty:before:text-slate-600 empty:before:pointer-events-none"
        style={{ minHeight }}
      />
    </div>
  );
}
