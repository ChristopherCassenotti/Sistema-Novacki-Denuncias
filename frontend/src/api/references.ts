import { api } from './client';
import { asRecord, booleanValue, collectionFromPayload, namedReference, stringValue } from './normalizers';
import type { NamedReference } from '../types/reports';

const normalizeReferences = (payload: unknown): NamedReference[] =>
  collectionFromPayload(payload)
    .map((value) => namedReference(value))
    .filter((value): value is NamedReference => Boolean(value));

export const referencesApi = {
  async categories(): Promise<NamedReference[]> {
    const response = await api.get('/api/public/report-categories');
    return normalizeReferences(response.data);
  },

  async units(): Promise<NamedReference[]> {
    const response = await api.get('/api/public/units');
    return normalizeReferences(response.data);
  },

  async adminUsers(): Promise<NamedReference[]> {
    const response = await api.get('/api/admin/users', { params: { page: 1, limit: 100 } });
    return collectionFromPayload(response.data).map((value) => {
      const item = asRecord(value) ?? {};
      return {
        id: stringValue(item.id, item.uuid) ?? '',
        name: stringValue(item.name, item.nome, item.email) ?? 'Usuário',
        active: booleanValue(item.isActive, item.is_active, item.active),
      };
    }).filter((item) => item.id && item.active !== false).map(({ id, name }) => ({ id, name }));
  },

  async teams(): Promise<NamedReference[]> {
    const response = await api.get('/api/admin/teams');
    return normalizeReferences(response.data);
  },
};
