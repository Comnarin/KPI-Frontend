import useSWR from 'swr';
import { api } from '@/shared/api';
import { SalarySettings } from '@/shared/types';

export function useSalarySettings() {
  const { data, error, isLoading, mutate } = useSWR<SalarySettings>('/salary-settings', (url: string) => api.get<SalarySettings>(url));

  const updateSalarySettings = async (settings: SalarySettings) => {
    await api.put('/salary-settings', settings as unknown as Record<string, unknown>);
    mutate(settings, false); // Optimistic UI update
  };

  return {
    salarySettings: data,
    isLoading,
    error,
    updateSalarySettings,
  };
}
