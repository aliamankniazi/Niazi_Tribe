'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  CloudArrowUpIcon, 
  XMarkIcon, 
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useMediaStore } from '@/stores/mediaStore';
import toast from 'react-hot-toast';

interface MediaUploadProps {
  personId?: string;
  onUploadComplete?: (mediaIds: string[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  acceptedTypes?: string[];
  className?: string;
}

interface UploadProgress {
  [key: string]: {
    progress: number;
    status: 'uploading' | 'success' | 'error';
    error?: string;
  };
}

const DEFAULT_ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/avi',
  'video/mov',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function MediaUpload({
  personId,
  onUploadComplete,
  maxFiles = 10,
  maxFileSize = MAX_FILE_SIZE,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  className = ''
}: MediaUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const [previewUrls, setPreviewUrls] = useState<{ [key: string]: string }>({});
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadMedia } = useMediaStore();

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return PhotoIcon;
    if (fileType.startsWith('video/')) return VideoCameraIcon;
    if (fileType.startsWith('audio/')) return MusicalNoteIcon;
    return DocumentIcon;
  };

  const getFilePreview = useCallback((file: File) => {
    const fileId = `${file.name}-${file.size}-${file.lastModified}`;
    
    if (previewUrls[fileId]) {
      return previewUrls[fileId];
    }

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrls(prev => ({ ...prev, [fileId]: url }));
      return url;
    }
    
    return null;
  }, [previewUrls]);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, errors }) => {
        errors.forEach((error: any) => {
          switch (error.code) {
            case 'file-too-large':
              toast.error(`${file.name} is too large. Maximum size is ${maxFileSize / (1024 * 1024)}MB`);
              break;
            case 'file-invalid-type':
              toast.error(`${file.name} is not a supported file type`);
              break;
            case 'too-many-files':
              toast.error(`Too many files. Maximum is ${maxFiles} files`);
              break;
            default:
              toast.error(`Error with ${file.name}: ${error.message}`);
          }
        });
      });
    }

    // Add accepted files
    if (acceptedFiles.length > 0) {
      const newFiles = acceptedFiles.slice(0, maxFiles - files.length);
      setFiles(prev => [...prev, ...newFiles]);
      
      // Initialize upload progress
      const newProgress: UploadProgress = {};
      newFiles.forEach(file => {
        const fileId = `${file.name}-${file.size}-${file.lastModified}`;
        newProgress[fileId] = { progress: 0, status: 'uploading' };
      });
      setUploadProgress(prev => ({ ...prev, ...newProgress }));
      
      toast.success(`${newFiles.length} file(s) added for upload`);
    }
  }, [files, maxFiles, maxFileSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as any),
    maxFiles,
    maxSize: maxFileSize,
    multiple: true
  });

  const removeFile = (fileToRemove: File) => {
    const fileId = `${fileToRemove.name}-${fileToRemove.size}-${fileToRemove.lastModified}`;
    
    setFiles(prev => prev.filter(file => file !== fileToRemove));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
    
    // Clean up preview URL
    if (previewUrls[fileId]) {
      URL.revokeObjectURL(previewUrls[fileId]);
      setPreviewUrls(prev => {
        const newUrls = { ...prev };
        delete newUrls[fileId];
        return newUrls;
      });
    }
  };

  const uploadFiles = async () => {
    if (files.length === 0) {
      toast.error('No files to upload');
      return;
    }

    setIsUploading(true);
    const uploadedMediaIds: string[] = [];

    try {
      for (const file of files) {
        const fileId = `${file.name}-${file.size}-${file.lastModified}`;
        
        try {
          // Create form data
          const formData = new FormData();
          formData.append('file', file);
          if (personId) {
            formData.append('personId', personId);
          }
          formData.append('title', file.name);
          formData.append('description', `Uploaded on ${new Date().toLocaleDateString()}`);

          // Upload with progress tracking
          const media = await uploadMedia(formData, (progress) => {
            setUploadProgress(prev => ({
              ...prev,
              [fileId]: { progress, status: 'uploading' }
            }));
          });

          uploadedMediaIds.push(media.id);
          
          setUploadProgress(prev => ({
            ...prev,
            [fileId]: { progress: 100, status: 'success' }
          }));

        } catch (error: any) {
          setUploadProgress(prev => ({
            ...prev,
            [fileId]: { 
              progress: 0, 
              status: 'error',
              error: error.message || 'Upload failed'
            }
          }));
          toast.error(`Failed to upload ${file.name}: ${error.message}`);
        }
      }

      // Call completion callback
      if (onUploadComplete && uploadedMediaIds.length > 0) {
        onUploadComplete(uploadedMediaIds);
      }

      // Clear successful uploads
      const successfulUploads = files.filter(file => {
        const fileId = `${file.name}-${file.size}-${file.lastModified}`;
        return uploadProgress[fileId]?.status === 'success';
      });
      
      if (successfulUploads.length > 0) {
        setFiles(prev => prev.filter(file => !successfulUploads.includes(file)));
        toast.success(`Successfully uploaded ${successfulUploads.length} file(s)`);
      }

    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 cursor-pointer
          ${isDragActive 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
          }
        `}
      >
        <input {...getInputProps()} ref={fileInputRef} />
        
        <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        
        <div className="text-sm text-gray-600">
          {isDragActive ? (
            <p className="text-primary-600 font-medium">Drop files here...</p>
          ) : (
            <div>
              <p className="font-medium">
                Drag and drop files here, or{' '}
                <button 
                  type="button" 
                  className="text-primary-600 hover:text-primary-700 font-medium"
                  onClick={() => fileInputRef.current?.click()}
                >
                  browse
                </button>
              </p>
              <p className="mt-1 text-gray-500">
                Support for images, videos, audio, and documents
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Maximum {maxFiles} files, {formatFileSize(maxFileSize)} each
              </p>
            </div>
          )}
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Files to upload ({files.length})
          </h3>
          
          <div className="space-y-3">
            {files.map((file) => {
              const fileId = `${file.name}-${file.size}-${file.lastModified}`;
              const progress = uploadProgress[fileId];
              const FileIcon = getFileIcon(file.type);
              const previewUrl = getFilePreview(file);
              
              return (
                <div key={fileId} className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200">
                  {/* File preview/icon */}
                  <div className="flex-shrink-0">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt={file.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <FileIcon className="w-6 h-6 text-gray-500" />
                      </div>
                    )}
                  </div>

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)} • {file.type}
                    </p>
                    
                    {/* Progress bar */}
                    {progress && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">
                            {progress.status === 'uploading' && 'Uploading...'}
                            {progress.status === 'success' && 'Upload complete'}
                            {progress.status === 'error' && 'Upload failed'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {progress.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              progress.status === 'success' 
                                ? 'bg-green-600' 
                                : progress.status === 'error'
                                ? 'bg-red-600'
                                : 'bg-primary-600'
                            }`}
                            style={{ width: `${progress.progress}%` }}
                          />
                        </div>
                        {progress.error && (
                          <p className="text-xs text-red-600 mt-1">{progress.error}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex items-center space-x-2">
                    {previewUrl && (
                      <button
                        onClick={() => window.open(previewUrl, '_blank')}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Preview"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => removeFile(file)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Remove"
                      disabled={isUploading}
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Upload button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={uploadFiles}
              disabled={isUploading || files.length === 0}
              className="btn btn-primary"
            >
              {isUploading ? (
                <div className="flex items-center">
                  <div className="loading-spinner mr-2"></div>
                  Uploading...
                </div>
              ) : (
                `Upload ${files.length} file${files.length !== 1 ? 's' : ''}`
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 