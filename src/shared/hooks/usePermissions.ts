import useSWR from 'swr';
import { api } from '@/shared/api';
import { RolePermission } from '@/shared/types';

export function usePermissions() {
  const { data, error, isLoading, mutate } = useSWR<RolePermission[]>(
    '/permissions/all',
    (url: string) => api.get<RolePermission[]>(url)
  );

  const updatePermissions = async (perms: RolePermission[]) => {
    await api.put('/permissions', { permissions: perms });
    mutate();
  };

  return {
    permissions: data || [],
    isLoading,
    error,
    updatePermissions,
  };
}
