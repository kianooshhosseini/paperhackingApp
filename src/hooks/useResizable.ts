import { useState, useCallback, useRef, useEffect } from "react";

export function useResizable(
  initialSize: number,
  minSize: number,
  maxSize: number,
  axis: "x" | "y"
) {
  const [size, setSize] = useState(initialSize);
  const isDragging = useRef(false);

  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
    document.body.style.cursor = axis === "x" ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";
  }, [axis]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const newSize =
        axis === "x"
          ? Math.max(minSize, Math.min(maxSize, e.clientX))
          : Math.max(minSize, Math.min(maxSize, e.clientY));
      setSize(newSize);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [minSize, maxSize, axis]);

  return { size, handleMouseDown, isDragging: isDragging.current };
}
