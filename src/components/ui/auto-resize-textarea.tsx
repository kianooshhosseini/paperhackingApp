import * as React from "react";
import { cn } from "@/lib/utils";

interface AutoResizeTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number;
  maxRows?: number;
}

function AutoResizeTextarea({
  className,
  minRows = 3,
  maxRows = 20,
  onChange,
  value,
  defaultValue,
  ...props
}: AutoResizeTextareaProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const resize = React.useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    // Reset to auto so scrollHeight is accurate
    el.style.height = "auto";
    // Calculate line height
    const lineHeight = parseInt(getComputedStyle(el).lineHeight) || 20;
    const minHeight = minRows * lineHeight;
    const maxHeight = maxRows * lineHeight;
    const scrollHeight = el.scrollHeight;
    el.style.height = `${Math.max(minHeight, Math.min(scrollHeight, maxHeight))}px`;
    el.style.overflowY = scrollHeight > maxHeight ? "auto" : "hidden";
  }, [minRows, maxRows]);

  // Resize on value changes (controlled)
  React.useEffect(() => {
    resize();
  }, [value, resize]);

  // Resize on mount for defaultValue (uncontrolled)
  React.useEffect(() => {
    resize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resize on window resize
  React.useEffect(() => {
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [resize]);

  return (
    <textarea
      ref={textareaRef}
      data-slot="auto-resize-textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-hidden",
        className
      )}
      onChange={(e) => {
        resize();
        onChange?.(e);
      }}
      value={value}
      defaultValue={defaultValue}
      rows={minRows}
      {...props}
    />
  );
}

export { AutoResizeTextarea };
