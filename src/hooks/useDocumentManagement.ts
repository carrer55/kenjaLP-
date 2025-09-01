import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Tables, TablesInsert } from '../types/supabase';

type Attachment = Tables<'attachments'>;
type Application = Tables<'applications'>;
type Profile = Tables<'profiles'>;

export interface DocumentWithDetails extends Attachment {
  application?: Application;
  uploaded_by_profile?: Profile;
}

export interface CreateDocumentData {
  application_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  description?: string;
  category: string;
}

export interface UseDocumentManagementReturn {
  documents: DocumentWithDetails[];
  isLoading: boolean;
  error: string | null;
  createDocument: (data: CreateDocumentData) => Promise<{ success: boolean; error?: string }>;
  updateDocument: (id: string, data: Partial<Attachment>) => Promise<{ success: boolean; error?: string }>;
  deleteDocument: (id: string) => Promise<{ success: boolean; error?: string }>;
  getDocumentById: (id: string) => Promise<DocumentWithDetails | null>;
  searchDocuments: (filters: {
    searchTerm?: string;
    category?: string;
    applicationId?: string;
    dateRange?: { start: string; end: string };
  }) => Promise<void>;
  refreshDocuments: () => Promise<void>;
}

export function useDocumentManagement(): UseDocumentManagementReturn {
  const [documents, setDocuments] = useState<DocumentWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: documentsData, error: documentsError } = await supabase
        .from('attachments')
        .select(`
          *,
          application:applications(*),
          uploaded_by_profile:profiles!attachments_uploaded_by_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (documentsError) {
        throw new Error(`文書データの取得に失敗しました: ${documentsError.message}`);
      }

      setDocuments(documentsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      console.error('文書データの読み込みエラー:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createDocument = async (data: CreateDocumentData): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null);

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('ユーザーが認証されていません');
      }

      const { data: document, error: documentError } = await supabase
        .from('attachments')
        .insert({
          application_id: data.application_id,
          file_name: data.file_name,
          file_path: data.file_path,
          file_size: data.file_size,
          file_type: data.file_type,
          description: data.description,
          category: data.category,
          uploaded_by: user.user.id
        })
        .select()
        .single();

      if (documentError) {
        throw new Error(`文書の作成に失敗しました: ${documentError.message}`);
      }

      await loadDocuments();
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました';
      setError(errorMessage);
      console.error('文書作成エラー:', err);
      return { success: false, error: errorMessage };
    }
  };

  const updateDocument = async (id: string, data: Partial<Attachment>): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null);

      const { error } = await supabase
        .from('attachments')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw new Error(`文書の更新に失敗しました: ${error.message}`);
      }

      await loadDocuments();
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました';
      setError(errorMessage);
      console.error('文書更新エラー:', err);
      return { success: false, error: errorMessage };
    }
  };

  const deleteDocument = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null);

      // 文書のファイルパスを取得
      const { data: document, error: fetchError } = await supabase
        .from('attachments')
        .select('file_path, category')
        .eq('id', id)
        .single();

      if (fetchError) {
        throw new Error(`文書データの取得に失敗しました: ${fetchError.message}`);
      }

      // Supabase Storageからファイルを削除
      const bucketName = document.category === 'receipt' ? 'receipts' : 'documents';
      const { error: storageError } = await supabase.storage
        .from(bucketName)
        .remove([document.file_path]);

      if (storageError) {
        console.warn('Storageからのファイル削除に失敗しました:', storageError);
      }

      // データベースから文書レコードを削除
      const { error: deleteError } = await supabase
        .from('attachments')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw new Error(`文書の削除に失敗しました: ${deleteError.message}`);
      }

      await loadDocuments();
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました';
      setError(errorMessage);
      console.error('文書削除エラー:', err);
      return { success: false, error: errorMessage };
    }
  };

  const getDocumentById = async (id: string): Promise<DocumentWithDetails | null> => {
    try {
      const { data, error } = await supabase
        .from('attachments')
        .select(`
          *,
          application:applications(*),
          uploaded_by_profile:profiles!attachments_uploaded_by_fkey(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(`文書データの取得に失敗しました: ${error.message}`);
      }

      return data;
    } catch (err) {
      console.error('文書データ取得エラー:', err);
      return null;
    }
  };

  const searchDocuments = async (filters: {
    searchTerm?: string;
    category?: string;
    applicationId?: string;
    dateRange?: { start: string; end: string };
  }) => {
    try {
      setIsLoading(true);
      setError(null);

      let query = supabase
        .from('attachments')
        .select(`
          *,
          application:applications(*),
          uploaded_by_profile:profiles!attachments_uploaded_by_fkey(*)
        `);

      // 検索条件を適用
      if (filters.searchTerm) {
        query = query.or(`file_name.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.applicationId) {
        query = query.eq('application_id', filters.applicationId);
      }

      if (filters.dateRange?.start && filters.dateRange?.end) {
        query = query.gte('created_at', filters.dateRange.start).lte('created_at', filters.dateRange.end);
      }

      const { data: documentsData, error: documentsError } = await query
        .order('created_at', { ascending: false });

      if (documentsError) {
        throw new Error(`文書データの検索に失敗しました: ${documentsError.message}`);
      }

      setDocuments(documentsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      console.error('文書データの検索エラー:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshDocuments = async () => {
    await loadDocuments();
  };

  return {
    documents,
    isLoading,
    error,
    createDocument,
    updateDocument,
    deleteDocument,
    getDocumentById,
    searchDocuments,
    refreshDocuments
  };
}
