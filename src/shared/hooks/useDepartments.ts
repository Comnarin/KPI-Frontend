import useSWR from 'swr';
import { api } from '@/shared/api';
import { DepartmentRecord } from '@/shared/types';

export interface UseDepartmentsOptions {
  q?: string;
}

export function useDepartments(options?: UseDepartmentsOptions) {
  const params = new URLSearchParams();
  if (options?.q) params.append('q', options.q);
  const qStr = params.toString();
  const url = qStr ? `/departments?${qStr}` : '/departments';

  const { data, error, isLoading, mutate } = useSWR<DepartmentRecord[]>(url, (url: string) => api.get<DepartmentRecord[]>(url));

  const createDepartment = async (dept: Omit<DepartmentRecord, 'id'>) => {
    await api.post('/departments', dept);
    mutate();
  };

  const updateDepartment = async (dept: DepartmentRecord) => {
    await api.put(`/departments/${dept.id}`, dept);
    mutate();
  };

  const deleteDepartment = async (id: string) => {
    await api.delete(`/departments/${id}`);
    mutate();
  };

  return {
    departments: data || [],
    isLoading,
    error,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  };
}
