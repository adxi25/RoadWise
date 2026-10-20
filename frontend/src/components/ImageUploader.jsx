import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, AlertCircle, Check, FileCheck } from 'lucide-react';

export default function ImageUploader({
  selectedFile,
  setSelectedFile,
  previewUrl,
  setPreviewUrl,
  imageMeta,
  setImageMeta,
  error,
  setError,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const processFile = (file) => {
    setError(null);
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError("Supported formats: JPG, JPEG, PNG, or WebP.");
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setImageMeta(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > 20) {
      setError(`File size (${sizeMb.toFixed(1)} MB) exceeds the 20 MB limit.`);
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setImageMeta(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Revoke previous object URL if one exists to avoid memory leaks
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    const img = new Image();
    img.onload = () => {
      setImageMeta({
        name: file.name,
        sizeMb: sizeMb.toFixed(2),
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = () => {
      setError("Failed to decode the selected image. Please try a different road photograph.");
      setSelectedFile(null);
      URL.revokeObjectURL(url);
      setPreviewUrl(null);
      setImageMeta(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    img.src = url;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
    // Clear input value so selecting the same file again triggers onChange
    e.target.value = '';
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setImageMeta(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-[#141D20] uppercase tracking-wider font-mono flex items-center space-x-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-[#114B44]" />
          <span>Road Surface Imagery</span>
          <span className="text-rose-600 font-mono text-xs">*</span>
        </label>
        {selectedFile && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-xs text-[#505E63] hover:text-rose-700 font-mono flex items-center space-x-1 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Remove</span>
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={handleFileChange}
        className="hidden"
        id="road-image-input"
      />

      {/* Drop Surface / Preview */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !previewUrl && fileInputRef.current?.click()}
        tabIndex={0}
        role="button"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!previewUrl) fileInputRef.current?.click();
          }
        }}
        className={`relative rounded-lg border transition-all overflow-hidden flex flex-col items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-[#114B44] ${
          isDragging
            ? 'border-[#114B44] bg-[#EBF4F2]'
            : previewUrl
            ? 'border-[#DFE3E1] bg-[#F8F7F4] p-3'
            : 'border-dashed border-[#CCDCD8] hover:border-[#114B44] bg-[#F8F7F4] hover:bg-[#F3F1EC] p-6'
        }`}
      >
        {previewUrl ? (
          <div className="w-full space-y-2.5">
            <div className="relative w-full max-h-[260px] rounded bg-[#141D20] overflow-hidden flex items-center justify-center border border-[#DFE3E1]">
              <img
                src={previewUrl}
                alt="Selected road inspection"
                className="max-h-[260px] w-full object-contain"
              />
              <div className="absolute top-2 right-2 bg-white/95 border border-[#DFE3E1] px-2 py-0.5 rounded text-[10px] font-mono text-[#114B44] font-bold flex items-center space-x-1 shadow-xs">
                <Check className="w-3 h-3 text-[#114B44]" />
                <span>Ready for Analysis</span>
              </div>
            </div>

            {imageMeta && (
              <div className="px-3 py-2 rounded bg-white border border-[#DFE3E1] text-xs font-mono flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center space-x-1.5 truncate max-w-[200px]" title={imageMeta.name}>
                  <FileCheck className="w-3.5 h-3.5 text-[#114B44] flex-shrink-0" />
                  <span className="truncate text-[#141D20] font-semibold">{imageMeta.name}</span>
                </div>
                <span className="text-[#505E63] text-[11px] whitespace-nowrap">
                  {imageMeta.width}×{imageMeta.height} px ({imageMeta.sizeMb} MB)
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[#114B44] hover:text-[#0D3833] underline font-bold text-xs ml-auto"
                >
                  Change
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-10 h-10 rounded-lg bg-white border border-[#DFE3E1] text-[#114B44] flex items-center justify-center shadow-2xs">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#141D20]">
                Drop road photo here or <span className="text-[#114B44] underline font-bold">browse</span>
              </p>
              <p className="text-[11px] text-[#505E63] font-mono mt-0.5">
                Supports JPG, PNG, or WebP up to 20 MB
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-2.5 rounded bg-[#FEF2F2] border border-[#FECDD3] text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span className="leading-tight">{error}</span>
        </div>
      )}

      {/* Compact Photo Quality Warning */}
      <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
        <p className="leading-relaxed">
          <strong>For better detection results:</strong> Upload a clear, well-lit photo with road damage fully visible and in focus.
        </p>
      </div>
    </div>
  );
}
