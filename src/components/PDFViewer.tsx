import { useState, useEffect, useCallback } from "react";
import { X, ZoomIn, ZoomOut, Maximize, Minimize, FileText } from "lucide-react";
import { motion } from "framer-motion";

interface PDFViewerProps {
  pdfData: string; // base64
  paperTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PDFViewer({ pdfData, paperTitle, isOpen, onClose }: PDFViewerProps) {
  const [scale, setScale] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setScale(100);
      setIsFullscreen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose, isFullscreen]);

  if (!isOpen) return null;

  const pdfUrl = `data:application/pdf;base64,${pdfData}#zoom=${scale}`;

  const zoomIn = useCallback(() => setScale((s) => Math.min(s + 25, 300)), []);
  const zoomOut = useCallback(() => setScale((s) => Math.max(s - 25, 25)), []);
  const resetZoom = useCallback(() => setScale(100), []);

  const toolbar = (
    <div className="shrink-0 flex items-center justify-between px-4 py-2.5 bg-[#16213e] border-b border-[#0f3460]">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-[#0f3460] text-[#e8e8e8] transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-[#0f3460] shrink-0" />
        <FileText className="w-4 h-4 text-[#4293a7] shrink-0" />
        <span className="text-xs font-medium text-[#e8e8e8] truncate max-w-[300px]">
          {paperTitle}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Zoom controls */}
        <div className="flex items-center gap-1 bg-[#0f3460] rounded-lg px-2 py-1">
          <button
            onClick={zoomOut}
            className="p-1 rounded hover:bg-[#1a3a6b] text-[#e8e8e8] transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetZoom}
            className="text-[11px] text-[#e8e8e8] font-medium w-12 text-center hover:underline"
            title="Reset zoom"
          >
            {scale}%
          </button>
          <button
            onClick={zoomIn}
            className="p-1 rounded hover:bg-[#1a3a6b] text-[#e8e8e8] transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-px h-5 bg-[#0f3460]" />

        {/* Fullscreen toggle */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-1.5 rounded-lg hover:bg-[#0f3460] text-[#e8e8e8] transition-colors"
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? (
            <Minimize className="w-4 h-4" />
          ) : (
            <Maximize className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );

  const pdfFrame = (
    <div className="flex-1 overflow-auto bg-[#0f0f23]">
      <iframe
        src={pdfUrl}
        title={paperTitle}
        className="w-full h-full border-0"
        style={{ backgroundColor: "#0f0f23" }}
      />
    </div>
  );

  if (isFullscreen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-[#1a1a2e] flex flex-col"
      >
        {toolbar}
        {pdfFrame}
      </motion.div>
    );
  }

  // Default: overlay panel
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-4 z-[90] rounded-2xl overflow-hidden shadow-2xl flex flex-col bg-[#1a1a2e]"
    >
      {/* Click outside to close */}
      <div
        className="fixed -inset-4 bg-black/40 -z-10"
        onClick={onClose}
      />
      {toolbar}
      {pdfFrame}
    </motion.div>
  );
}

// Inline PDF viewer for split-view
export function PDFInlineViewer({
  pdfData,
  paperTitle,
}: {
  pdfData: string;
  paperTitle: string;
}) {
  const [scale, setScale] = useState(100);
  const pdfUrl = `data:application/pdf;base64,${pdfData}#zoom=${scale}`;

  return (
    <div className="flex flex-col h-full bg-[#1a1a2e]">
      <div className="shrink-0 flex items-center justify-between px-3 py-2 bg-[#16213e] border-b border-[#0f3460]">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-3.5 h-3.5 text-[#4293a7] shrink-0" />
          <span className="text-[11px] font-medium text-[#e8e8e8] truncate">{paperTitle}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setScale((s) => Math.max(s - 25, 25))} className="p-1 rounded hover:bg-[#0f3460] text-[#e8e8e8]">
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className="text-[10px] text-[#e8e8e8] w-8 text-center">{scale}%</span>
          <button onClick={() => setScale((s) => Math.min(s + 25, 300))} className="p-1 rounded hover:bg-[#0f3460] text-[#e8e8e8]">
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <iframe
          src={pdfUrl}
          title={paperTitle}
          className="w-full h-full border-0"
          style={{ backgroundColor: "#0f0f23" }}
        />
      </div>
    </div>
  );
}

interface PDFUploadButtonProps {
  onUpload: (file: File) => void;
}

export function PDFUploadButton({ onUpload }: PDFUploadButtonProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      onUpload(file);
    }
  };

  return (
    <label
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed cursor-pointer transition-all text-xs font-medium ${
        isDragging
          ? "border-[#4293a7] bg-[#4293a7]/10 text-[#4293a7]"
          : "border-[#eaeaea] text-[#5e6a6e] hover:border-[#4293a7]/50 hover:text-[#4293a7]"
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type === "application/pdf") onUpload(file);
      }}
    >
      <FileText className="w-3.5 h-3.5" />
      Upload PDF
      <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
    </label>
  );
}
