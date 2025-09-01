import { supabase } from './supabase';

// ファイルアップロードの設定
export const STORAGE_CONFIG = {
  receipts: {
    bucket: 'receipts',
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    folder: 'receipts'
  },
  documents: {
    bucket: 'documents',
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif'
    ],
    folder: 'documents'
  }
};

// ファイルアップロード用のインターフェース
export interface FileUploadOptions {
  bucket: 'receipts' | 'documents';
  userId: string;
  applicationId?: string;
  fileName?: string;
  folder?: string;
}

export interface UploadedFile {
  path: string;
  url: string;
  size: number;
  type: string;
  name: string;
}

// ファイルの検証
export function validateFile(file: File, bucket: 'receipts' | 'documents'): { isValid: boolean; error?: string } {
  const config = STORAGE_CONFIG[bucket];
  
  // ファイルサイズのチェック
  if (file.size > config.maxSize) {
    return {
      isValid: false,
      error: `ファイルサイズが大きすぎます。最大${config.maxSize / (1024 * 1024)}MBまでです。`
    };
  }
  
  // ファイルタイプのチェック
  if (!config.allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `サポートされていないファイルタイプです。許可されているタイプ: ${config.allowedTypes.join(', ')}`
    };
  }
  
  return { isValid: true };
}

// ファイルパスの生成
export function generateFilePath(options: FileUploadOptions, file: File): string {
  const { bucket, userId, applicationId, folder } = options;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = options.fileName || `${timestamp}_${file.name}`;
  
  if (applicationId) {
    return `${bucket}/${userId}/${applicationId}/${fileName}`;
  }
  
  if (folder) {
    return `${bucket}/${userId}/${folder}/${fileName}`;
  }
  
  return `${bucket}/${userId}/${fileName}`;
}

// ファイルのアップロード
export async function uploadFile(
  file: File, 
  options: FileUploadOptions
): Promise<UploadedFile> {
  try {
    // ファイルの検証
    const validation = validateFile(file, options.bucket);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    
    // ファイルパスの生成
    const filePath = generateFilePath(options, file);
    
    // ファイルのアップロード
    const { data, error } = await supabase.storage
      .from(options.bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      throw new Error(`アップロードエラー: ${error.message}`);
    }
    
    // アップロードされたファイルのURLを取得
    const { data: urlData } = supabase.storage
      .from(options.bucket)
      .getPublicUrl(filePath);
    
    return {
      path: filePath,
      url: urlData.publicUrl,
      size: file.size,
      type: file.type,
      name: file.name
    };
  } catch (error) {
    console.error('ファイルアップロードエラー:', error);
    throw error;
  }
}

// 複数ファイルのアップロード
export async function uploadMultipleFiles(
  files: File[], 
  options: FileUploadOptions
): Promise<UploadedFile[]> {
  const uploadPromises = files.map(file => uploadFile(file, options));
  return Promise.all(uploadPromises);
}

// ファイルの削除
export async function deleteFile(
  filePath: string, 
  bucket: 'receipts' | 'documents'
): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);
    
    if (error) {
      throw new Error(`削除エラー: ${error.message}`);
    }
  } catch (error) {
    console.error('ファイル削除エラー:', error);
    throw error;
  }
}

// ファイルのダウンロード
export async function downloadFile(
  filePath: string, 
  bucket: 'receipts' | 'documents'
): Promise<Blob> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(filePath);
    
    if (error) {
      throw new Error(`ダウンロードエラー: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('ファイルダウンロードエラー:', error);
    throw error;
  }
}

// ファイルの一覧取得
export async function listFiles(
  bucket: 'receipts' | 'documents',
  folder?: string
): Promise<string[]> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder || '');
    
    if (error) {
      throw new Error(`ファイル一覧取得エラー: ${error.message}`);
    }
    
    return data.map(item => item.name);
  } catch (error) {
    console.error('ファイル一覧取得エラー:', error);
    throw error;
  }
}

// ファイルの存在確認
export async function fileExists(
  filePath: string, 
  bucket: 'receipts' | 'documents'
): Promise<boolean> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(filePath.split('/').slice(0, -1).join('/'));
    
    if (error) {
      return false;
    }
    
    const fileName = filePath.split('/').pop();
    return data.some(item => item.name === fileName);
  } catch (error) {
    return false;
  }
}

// ファイルのメタデータ取得
export async function getFileMetadata(
  filePath: string, 
  bucket: 'receipts' | 'documents'
): Promise<{ size: number; type: string; lastModified: string } | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(filePath.split('/').slice(0, -1).join('/'));
    
    if (error) {
      return null;
    }
    
    const fileName = filePath.split('/').pop();
    const file = data.find(item => item.name === fileName);
    
    if (!file) {
      return null;
    }
    
    return {
      size: file.metadata?.size || 0,
      type: file.metadata?.mimetype || '',
      lastModified: file.updated_at || ''
    };
  } catch (error) {
    return null;
  }
}

// 一時的なダウンロードURLの生成（署名付きURL）
export async function createSignedUrl(
  filePath: string, 
  bucket: 'receipts' | 'documents',
  expiresIn: number = 3600 // 1時間
): Promise<string> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);
    
    if (error) {
      throw new Error(`署名付きURL生成エラー: ${error.message}`);
    }
    
    return data.signedUrl;
  } catch (error) {
    console.error('署名付きURL生成エラー:', error);
    throw error;
  }
}

// ファイルのコピー
export async function copyFile(
  sourcePath: string,
  targetPath: string,
  bucket: 'receipts' | 'documents'
): Promise<void> {
  try {
    // まずファイルをダウンロード
    const fileBlob = await downloadFile(sourcePath, bucket);
    
    // 新しいパスにアップロード
    const { error } = await supabase.storage
      .from(bucket)
      .upload(targetPath, fileBlob, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      throw new Error(`コピーエラー: ${error.message}`);
    }
  } catch (error) {
    console.error('ファイルコピーエラー:', error);
    throw error;
  }
}

// ファイルの移動（コピーして削除）
export async function moveFile(
  sourcePath: string,
  targetPath: string,
  bucket: 'receipts' | 'documents'
): Promise<void> {
  try {
    // ファイルをコピー
    await copyFile(sourcePath, targetPath, bucket);
    
    // 元のファイルを削除
    await deleteFile(sourcePath, bucket);
  } catch (error) {
    console.error('ファイル移動エラー:', error);
    throw error;
  }
}
