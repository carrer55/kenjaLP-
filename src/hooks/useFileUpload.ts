import { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { TablesInsert } from '../types/supabase';
import { 
  uploadFile as storageUploadFile, 
  uploadMultipleFiles as storageUploadMultipleFiles, 
  deleteFile as storageDeleteFile, 
  validateFile,
  type FileUploadOptions,
  type UploadedFile 
} from '../lib/storage';

interface UseFileUploadReturn {
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  uploadFile: (file: File, options: FileUploadOptions) => Promise<UploadedFile>;
  uploadMultipleFiles: (files: File[], options: FileUploadOptions) => Promise<UploadedFile[]>;
  deleteFile: (filePath: string, bucket: 'receipts' | 'documents') => Promise<void>;
  getFileUrl: (filePath: string, bucket: 'receipts' | 'documents') => string;
}

export function useFileUpload(): UseFileUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (
    file: File, 
    options: FileUploadOptions
  ): Promise<UploadedFile> => {
    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(0);

      // 新しいStorageユーティリティを使用
      const result = await storageUploadFile(file, options);
      
      setUploadProgress(100);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ファイルアップロード中にエラーが発生しました';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const uploadMultipleFiles = async (
    files: File[], 
    options: FileUploadOptions
  ): Promise<UploadedFile[]> => {
    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(0);

      // 新しいStorageユーティリティを使用
      const results = await storageUploadMultipleFiles(files, options);
      
      setUploadProgress(100);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '複数ファイルアップロード中にエラーが発生しました';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const deleteFile = async (filePath: string, bucket: 'receipts' | 'documents'): Promise<void> => {
    try {
      setError(null);
      await storageDeleteFile(filePath, bucket);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ファイル削除中にエラーが発生しました';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const getFileUrl = (filePath: string, bucket: 'receipts' | 'documents'): string => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  };

  return {
    isUploading,
    uploadProgress,
    error,
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    getFileUrl
  };
}
