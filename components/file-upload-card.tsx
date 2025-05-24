"use client";

import { useState } from "react";
import { Upload, File, X } from "lucide-react";

export function FileUploadCard() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    console.log('Dropped files:', files);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    console.log('Selected files:', files);
    setUploadedFiles(prev => [...prev, ...files]);
    // Reset the input value so the same file can be selected again
    e.target.value = '';
  };

  const triggerFileSelect = () => {
    document.getElementById('file-upload-main')?.click();
  };

  const removeFile = (indexToRemove: number) => {
    setUploadedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex w-full flex-col rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-black">
      
      {/* Header Section */}
      <div className="flex w-full flex-col rounded-lg p-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-medium text-slate-900 dark:text-slate-100">
            File Management
          </h2>
          <p className="text-sm font-normal text-slate-900/60 dark:text-slate-100/60">
            Upload and manage your files with our new design philosophy
          </p>
        </div>
      </div>
      
      {/* Divider */}
      <div className="flex w-full px-6">
        <div className="w-full border-b border-slate-200 dark:border-slate-800" />
      </div>
      
      {/* Main Content Area - Entire area is drag & drop */}
      <div className="relative mx-auto flex w-full flex-col items-center p-6">
        <label 
          htmlFor="file-upload-main"
          className={`relative flex w-full flex-col items-center justify-center gap-6 overflow-hidden rounded-lg border px-6 py-24 cursor-pointer transition-all duration-200 group ${
            isDragging 
              ? 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
              : 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          
          {/* Content */}
          <div className="z-10 flex max-w-[460px] flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-900/20 bg-white hover:border-slate-900/40 dark:border-slate-100/20 dark:bg-slate-950 dark:hover:border-slate-100/40 transition-all duration-200 group-hover:scale-105 group-hover:shadow-lg">
              <Upload className="h-8 w-8 stroke-[1.5px] text-slate-900/60 dark:text-slate-100/60" />
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <p className="text-base font-medium text-slate-900 dark:text-slate-100">
                Upload Your Files
              </p>
              <p className="text-center text-base font-normal text-slate-900/60 dark:text-slate-100/60">
                Experience the new design philosophy we&apos;re adopting throughout the app
              </p>
              <span className="select-none items-center rounded-full bg-blue-500/5 px-3 py-1 text-xs font-medium tracking-tight text-blue-700 ring-1 ring-inset ring-blue-600/20 backdrop-blur-md dark:bg-blue-900/40 dark:text-blue-100 flex">
                ✨ Drag & Drop Enabled
              </span>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={triggerFileSelect}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-slate-900 text-slate-50 hover:bg-slate-900/90 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-100/90 h-10 px-4 py-2"
              >
                <File className="mr-2 h-4 w-4" />
                Upload
              </button>
              <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 h-10 px-4 py-2">
                Recent Files
              </button>
            </div>
          </div>
          
          {/* Hidden File Input */}
          <input 
            id="file-upload-main" 
            type="file" 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
            multiple
            accept=".png,.jpg,.jpeg,.pdf"
            onChange={handleFileSelect}
          />
          
          {/* Background Grid Pattern */}
          <div 
            className="absolute h-full w-full opacity-40 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(148, 163, 184, 0.3) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(148, 163, 184, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: '24px 24px'
            }}
          />
          
          {/* Bottom Gradient Overlay */}
          <div className="absolute bottom-0 h-full w-full bg-gradient-to-t from-white to-transparent dark:from-slate-900 pointer-events-none" />
          
          {/* Drag Overlay - Shows when dragging */}
          {isDragging && (
            <div className="absolute inset-0 bg-blue-500/10 border-2 border-blue-400 border-dashed rounded-lg pointer-events-none" />
          )}
        </label>

        {/* Uploaded Files Display */}
        {uploadedFiles.length > 0 && (
          <div className="w-full mt-6">
            <div className="flex items-center gap-2 mb-4">
              <File className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Uploaded Files ({uploadedFiles.length})
              </h3>
            </div>
            
            <div className="space-y-3">
              {uploadedFiles.map((file, index) => (
                <div 
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white dark:bg-slate-700 flex-shrink-0">
                      <File className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => removeFile(index)}
                    className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex-shrink-0"
                  >
                    <X className="h-4 w-4 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" />
                  </button>
                </div>
              ))}
            </div>
            
            {/* Clear All Button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setUploadedFiles([])}
                className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                Clear All Files
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 