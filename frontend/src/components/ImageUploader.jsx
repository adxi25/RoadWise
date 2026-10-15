import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, AlertCircle, Check } from 'lucide-react';

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
      return;
    }

    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > 20) {
      setError(`File size (${sizeMb.toFixed(1)} MB) exceeds the 20 MB limit.`);
      return;
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
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center space-x-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
          <span>Road Inspection Image</span>
          <span className="text-rose-400 font-mono text-[11px]">*</span>
        </label>
        {selectedFile && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-xs text-slate-400 hover:text-rose-400 font-mono flex items-center space-x-1 transition-colors"
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
      />

      {/* Drop Surface / Preview */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !previewUrl && fileInputRef.current?.click()}
        className={`relative rounded-xl border transition-colors overflow-hidden flex flex-col items-center justify-center cursor-pointer ${
          isDragging
            ? 'border-cyan-500 bg-cyan-950/20'
            : previewUrl
            ? 'border-slate-800 bg-slate-950 p-2.5'
            : 'border-dashed border-slate-700/80 hover:border-slate-600 bg-slate-900/50 hover:bg-slate-900/80 p-6'
        }`}
      >
        {previewUrl ? (
          <div className="w-full space-y-2">
            <div className="relative w-full max-h-[260px] rounded-lg overflow-hidden bg-black flex items-center justify-center border border-slate-800">
              <img
                src={previewUrl}
                alt="Selected road"
                className="max-h-[260px] w-full object-contain rounded"
              />
              <div className="absolute top-2 right-2 bg-slate-900/90 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 flex items-center space-x-1">
                <Check className="w-3 h-3" />
                <span>Ready</span>
              </div>
            </div>

            {imageMeta && (
              <div className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-mono flex items-center justify-between gap-2">
                <span className="truncate max-w-[180px]" title={imageMeta.name}>
                  {imageMeta.name}
                </span>
                <span className="text-slate-400 text-[10px]">
                  {imageMeta.width}×{imageMeta.height} ({imageMeta.sizeMb} MB)
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-cyan-400 hover:text-cyan-300 underline text-[11px] ml-auto"
                >
                  Change
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-2.5">
            <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 text-cyan-400 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-200">
                Drag and drop road photo or <span className="text-cyan-400 underline">browse</span>
              </p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                JPG, PNG, WebP up to 20 MB
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
