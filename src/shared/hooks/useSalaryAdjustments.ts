import useSWR from 'swr';
import { api } from '@/shared/api';
import { SalaryAdjustment } from '@/shared/types';

export function useSalaryAdjustments() {
  const { data, error, isLoading, mutate } = useSWR<SalaryAdjustment[]>(
    '/salary-adjustments',
    (url: string) => api.get<SalaryAdjustment[]>(url)
  );

  const addAdjustment = async (adj: Partial<SalaryAdjustment>) => {
    try {
      const res = await api.post<SalaryAdjustment>('/salary-adjustments', adj);
      if (data) {
        mutate([res, ...data], false);
      }
      return res;
    } catch (err) {
      console.error('Failed to add salary adjustment', err);
      throw err;
    }
  };

  return {
    adjustments: data || [],
    isLoading,
    error,
    addAdjustment,
    refresh: mutate,
  };
}
