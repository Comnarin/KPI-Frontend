import useSWR from 'swr';
import { api } from '@/shared/api';
import { Employee } from '@/shared/types';

export interface UseEmployeesOptions {
  status?: string;
  excludeEvaluatedPeriod?: string;
  evaluatorId?: string;
  search?: string;
}

export function useEmployees(options?: UseEmployeesOptions | string) {
  let queryOptions: UseEmployeesOptions = {};
  if (typeof options === 'string') {
    queryOptions.status = options;
  } else if (options) {
    queryOptions = options;
  }

  const params = new URLSearchParams();
  if (queryOptions.status) params.append('status', queryOptions.status);
  if (queryOptions.excludeEvaluatedPeriod) params.append('excludeEvaluatedPeriod', queryOptions.excludeEvaluatedPeriod);
  if (queryOptions.evaluatorId) params.append('evaluatorId', queryOptions.evaluatorId);
  if (queryOptions.search) params.append('q', queryOptions.search);

  const queryString = params.toString();
  const url = queryString ? `/employees?${queryString}` : '/employees';

  const { data, error, isLoading, mutate } = useSWR<Employee[]>(url, (url: string) => api.get<Employee[]>(url));

  const createEmployee = async (emp: Omit<Employee, 'id'>) => {
    await api.post('/employees', emp);
    mutate();
  };

  const updateEmployee = async (emp: Employee) => {
    await api.put(`/employees/${emp.id}`, emp);
    mutate();
  };

  const partialUpdateEmployee = async (id: string, fields: Partial<Employee>) => {
    await api.patch(`/employees/${id}`, fields);
    mutate();
  };

  const deleteEmployee = async (id: string) => {
    await api.delete(`/employees/${id}`);
    mutate();
  };

  return {
    employees: data || [],
    isLoading,
    error,
    createEmployee,
    updateEmployee,
    partialUpdateEmployee,
    deleteEmployee,
  };
}
