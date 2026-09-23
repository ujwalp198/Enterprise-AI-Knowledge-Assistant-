import { useState, useRef } from 'react';
import { uploadDocument } from '../services/document.service';

interface FileUploaderProps {
  onUploadSuccess: () => void;
}

export default function FileUploader({ onUploadSuccess }: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are supported');
      return;
    }
    setError('');
    setUploading(true);
    try {
      await uploadDocument(file);
      onUploadSuccess();
    } catch (error) {
      const err = error as any;
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleChange}
          className="hidden"
        />
        {uploading ? (
          <p className="text-gray-500">Uploading and processing...</p>
        ) : (
          <p className="text-gray-500">Drag & drop a PDF here, or click to select</p>
        )}
      </div>
      {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
    </div>
  );
}
