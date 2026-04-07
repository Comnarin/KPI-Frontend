import useSWR from 'swr';
import { api } from '@/shared/api';
import { KPITemplate } from '@/shared/types';

export interface UseTemplatesOptions {
  q?: string;
}

export function useTemplates(options?: UseTemplatesOptions) {
  const params = new URLSearchParams();
  if (options?.q) params.append('q', options.q);
  const qStr = params.toString();
  const url = qStr ? `/templates?${qStr}` : '/templates';

  const { data, error, isLoading, mutate } = useSWR<KPITemplate[]>(url, (url: string) => api.get<KPITemplate[]>(url));

  const createTemplate = async (tpl: Omit<KPITemplate, 'id'>) => {
    await api.post('/templates', tpl);
    mutate();
  };

  const updateTemplate = async (tpl: KPITemplate) => {
    await api.put(`/templates/${tpl.id}`, tpl);
    mutate();
  };

  const deleteTemplate = async (id: string) => {
    await api.delete(`/templates/${id}`);
    mutate();
  };

  return {
    templates: data || [],
    isLoading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
