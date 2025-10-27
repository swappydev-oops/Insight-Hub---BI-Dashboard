import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  restoredFileName: string | null;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, restoredFileName }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  }, [onFileUpload]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 text-center">
      {restoredFileName && (
        <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-[#f9fafb]">Welcome Back!</h3>
          <p className="text-gray-700 dark:text-[#d1d5db] mt-1">
            Your dashboard for <span className="font-bold text-gray-900 dark:text-[#f9fafb]">{restoredFileName}</span> has been restored.
            Please upload the file again to view your charts.
          </p>
        </div>
      )}
      <div 
        onDragEnter={handleDrag} 
        onDragLeave={handleDrag} 
        onDragOver={handleDrag} 
        onDrop={handleDrop}
        className={`p-12 border-2 border-dashed rounded-lg transition-colors ${isDragging ? 'border-primary bg-gray-100 dark:bg-[#1f2937]' : 'border-gray-300 dark:border-[#374151] hover:border-primary'}`}
      >
        <input type="file" id="file-upload" className="hidden" accept=".xlsx, .csv" onChange={handleChange} />
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="flex flex-col items-center justify-center">
            <UploadIcon />
            <p className="mt-4 text-lg font-semibold text-gray-900 dark:text-[#f9fafb]">
              Drag & drop your file here
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-[#d1d5db]">
              or click to browse
            </p>
             <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Supports .xlsx and .csv files
            </p>
          </div>
        </label>
      </div>
    </div>
  );
};

export default FileUpload;