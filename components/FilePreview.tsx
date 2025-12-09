import React from 'react';
import { X } from 'lucide-react';
import { DocumentFile } from '../types';

interface Props {
  file: DocumentFile;
  onClose: () => void;
}

export const FilePreview: React.FC<Props> = ({ file, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 no-print">
      <div className="relative bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-bold text-lg truncate">{file.name}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition">
            <X size={24} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 bg-slate-50 flex items-center justify-center">
          {file.type.includes('image') ? (
            <img src={file.previewUrl} alt={file.name} className="max-w-full max-h-full object-contain shadow-lg" />
          ) : (
            <iframe src={file.previewUrl} className="w-full h-[600px] shadow-lg border" title="PDF Preview"></iframe>
          )}
        </div>
      </div>
    </div>
  );
};