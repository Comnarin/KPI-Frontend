import useSWR from 'swr';
import { api } from '@/shared/api';
import { SystemUser } from '@/shared/types';

export interface UseUsersOptions {
  q?: string;
}

export function useUsers(options?: UseUsersOptions) {
  const params = new URLSearchParams();
  if (options?.q) params.append('q', options.q);
  const qStr = params.toString();
  const url = qStr ? `/users?${qStr}` : '/users';

  const { data, error, isLoading, mutate } = useSWR<SystemUser[]>(
    url,
    (url: string) => api.get<SystemUser[]>(url)
  );

  const createUser = async (payload: {
    email: string;
    password: string;
    fullName: string;
    role: string;
    departmentId?: string;
  }) => {
    await api.post('/users', payload);
    mutate();
  };

  const updateUser = async (id: string, payload: { fullName?: string; role?: string; departmentId?: string }) => {
    await api.put(`/users/${id}`, payload);
    mutate();
  };

  const deleteUser = async (id: string) => {
    await api.delete(`/users/${id}`);
    mutate();
  };

  return {
    users: data || [],
    isLoading,
    error,
    createUser,
    updateUser,
    deleteUser,
  };
}
