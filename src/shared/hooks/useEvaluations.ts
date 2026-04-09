import useSWR from 'swr';
import { api } from '@/shared/api';
import { KPIEvaluation } from '@/shared/types';

export interface UseEvaluationsOptions {
  q?: string;
  department?: string;
  period?: string;
}

export function useEvaluations(options?: UseEvaluationsOptions) {
  const params = new URLSearchParams();
  if (options?.q) params.append('q', options.q);
  if (options?.department) params.append('departmentId', options.department);
  if (options?.period) params.append('period', options.period);
  const qStr = params.toString();
  const url = qStr ? `/evaluations?${qStr}` : '/evaluations';
  const { data, error, isLoading, mutate } = useSWR<KPIEvaluation[]>(url, (url: string) => api.get<KPIEvaluation[]>(url));

  const addEvaluation = async (evalData: Omit<KPIEvaluation, 'id'>) => {
    await api.post('/evaluations', evalData);
    mutate();
  };

  const deleteEvaluation = async (id: string) => {
    await api.delete(`/evaluations/${id}`);
    mutate();
  };

  return {
    evaluations: data || [],
    isLoading,
    error,
    addEvaluation,
    deleteEvaluation,
  };
}
