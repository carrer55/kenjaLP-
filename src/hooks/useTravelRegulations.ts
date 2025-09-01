import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Tables, TablesInsert } from '../types/supabase';

type TravelRegulation = Tables<'travel_regulations'>;
type PositionAllowance = Tables<'positions_allowances'>;
type Company = Tables<'companies'>;
type Department = Tables<'departments'>;

export interface RegulationWithAllowances extends TravelRegulation {
  company?: Company;
  department?: Department;
  positions_allowances?: PositionAllowance[];
}

export interface CreateRegulationData {
  company_id: string;
  department_id: string;
  regulation_name: string;
  version: string;
  effective_date: string;
  domestic_daily_allowance: number;
  domestic_accommodation_limit: number;
  domestic_transportation_limit: number;
  overseas_daily_allowance: number;
  overseas_accommodation_limit: number;
  overseas_transportation_limit: number;
  overseas_preparation_fee: number;
  distance_threshold: number;
  description?: string;
  positions_allowances: Omit<PositionAllowance, 'id' | 'regulation_id' | 'created_at' | 'updated_at'>[];
}

export interface UseTravelRegulationsReturn {
  regulations: RegulationWithAllowances[];
  isLoading: boolean;
  error: string | null;
  createRegulation: (data: CreateRegulationData) => Promise<{ success: boolean; error?: string }>;
  updateRegulation: (id: string, data: Partial<TravelRegulation>) => Promise<{ success: boolean; error?: string }>;
  deleteRegulation: (id: string) => Promise<{ success: boolean; error?: string }>;
  getRegulationById: (id: string) => Promise<RegulationWithAllowances | null>;
  refreshRegulations: () => Promise<void>;
}

export function useTravelRegulations(): UseTravelRegulationsReturn {
  const [regulations, setRegulations] = useState<RegulationWithAllowances[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRegulations();
  }, []);

  const loadRegulations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: regulationsData, error: regulationsError } = await supabase
        .from('travel_regulations')
        .select(`
          *,
          company:companies(*),
          department:departments(*),
          positions_allowances(*)
        `)
        .order('created_at', { ascending: false });

      if (regulationsError) {
        throw new Error(`旅費規程の取得に失敗しました: ${regulationsError.message}`);
      }

      setRegulations(regulationsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      console.error('旅費規程の読み込みエラー:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createRegulation = async (data: CreateRegulationData): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null);

      // 旅費規程を作成
      const { data: regulation, error: regulationError } = await supabase
        .from('travel_regulations')
        .insert({
          company_id: data.company_id,
          department_id: data.department_id,
          regulation_name: data.regulation_name,
          version: data.version,
          effective_date: data.effective_date,
          domestic_daily_allowance: data.domestic_daily_allowance,
          domestic_accommodation_limit: data.domestic_accommodation_limit,
          domestic_transportation_limit: data.domestic_transportation_limit,
          overseas_daily_allowance: data.overseas_daily_allowance,
          overseas_accommodation_limit: data.overseas_accommodation_limit,
          overseas_transportation_limit: data.overseas_transportation_limit,
          overseas_preparation_fee: data.overseas_preparation_fee,
          distance_threshold: data.distance_threshold,
          description: data.description,
          status: 'active'
        })
        .select()
        .single();

      if (regulationError) {
        throw new Error(`旅費規程の作成に失敗しました: ${regulationError.message}`);
      }

      // 役職別手当を作成
      if (data.positions_allowances.length > 0) {
        const allowancesWithRegulationId = data.positions_allowances.map(allowance => ({
          ...allowance,
          regulation_id: regulation.id
        }));

        const { error: allowancesError } = await supabase
          .from('positions_allowances')
          .insert(allowancesWithRegulationId);

        if (allowancesError) {
          throw new Error(`役職別手当の作成に失敗しました: ${allowancesError.message}`);
        }
      }

      await loadRegulations();
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました';
      setError(errorMessage);
      console.error('旅費規程作成エラー:', err);
      return { success: false, error: errorMessage };
    }
  };

  const updateRegulation = async (id: string, data: Partial<TravelRegulation>): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null);

      const { error } = await supabase
        .from('travel_regulations')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw new Error(`旅費規程の更新に失敗しました: ${error.message}`);
      }

      await loadRegulations();
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました';
      setError(errorMessage);
      console.error('旅費規程更新エラー:', err);
      return { success: false, error: errorMessage };
    }
  };

  const deleteRegulation = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null);

      // 関連する役職別手当を削除
      const { error: allowancesError } = await supabase
        .from('positions_allowances')
        .delete()
        .eq('regulation_id', id);

      if (allowancesError) {
        throw new Error(`役職別手当の削除に失敗しました: ${allowancesError.message}`);
      }

      // 旅費規程を削除
      const { error: regulationError } = await supabase
        .from('travel_regulations')
        .delete()
        .eq('id', id);

      if (regulationError) {
        throw new Error(`旅費規程の削除に失敗しました: ${regulationError.message}`);
      }

      await loadRegulations();
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '不明なエラーが発生しました';
      setError(errorMessage);
      console.error('旅費規程削除エラー:', err);
      return { success: false, error: errorMessage };
    }
  };

  const getRegulationById = async (id: string): Promise<RegulationWithAllowances | null> => {
    try {
      const { data, error } = await supabase
        .from('travel_regulations')
        .select(`
          *,
          company:companies(*),
          department:departments(*),
          positions_allowances(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(`旅費規程の取得に失敗しました: ${error.message}`);
      }

      return data;
    } catch (err) {
      console.error('旅費規程取得エラー:', err);
      return null;
    }
  };

  const refreshRegulations = async () => {
    await loadRegulations();
  };

  return {
    regulations,
    isLoading,
    error,
    createRegulation,
    updateRegulation,
    deleteRegulation,
    getRegulationById,
    refreshRegulations
  };
}
