import useSWR from 'swr';
import { api } from '@/shared/api';
import { TenantPeriod } from '@/shared/types';
import { useAppStore } from '@/shared/stores/useAppStore';

const fetcher = (url: string) => api.get<TenantPeriod[]>(url);

export function usePeriods() {
  const { user } = useAppStore();
  const tenantId = user?.tenantId;

  const { data: periods = [], error, isLoading, mutate } = useSWR<TenantPeriod[]>(
    tenantId ? '/periods' : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const activePeriod = periods.find(p => p.isActive);

  const createPeriod = async (payload: { label: string; startDate?: string; endDate?: string }) => {
    const res = await api.post<TenantPeriod>('/periods', payload);
    await mutate();
    return res;
  };

  const updatePeriod = async (id: string, payload: { label: string; startDate?: string; endDate?: string }) => {
    const res = await api.put<TenantPeriod>(`/periods/${id}`, payload);
    await mutate();
    return res;
  };

  const deletePeriod = async (id: string) => {
    await api.delete(`/periods/${id}`);
    await mutate();
  };

  const setActivePeriod = async (id: string) => {
    await api.put(`/periods/${id}/active`, {});
    await mutate();
  };

  return {
    periods,
    activePeriod,
    isLoading,
    isError: error,
    createPeriod,
    updatePeriod,
    deletePeriod,
    setActivePeriod,
  };
}
