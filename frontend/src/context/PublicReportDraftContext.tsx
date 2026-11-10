import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import type { DraftPerson, PublicReportDraft } from '../types/public';

const STORAGE_KEY = 'nvk:public-report-draft';

const EMPTY_DRAFT: PublicReportDraft = {
  mode: null,
  relationship: '',
  unitId: '',
  categoryId: '',
  occurrenceDate: '',
  occurrenceLocation: '',
  description: '',
  additionalInformation: '',
  reporterName: '',
  reporterEmail: '',
  reporterPhone: '',
  consentToContact: false,
  involvedPeople: [],
  witnesses: [],
  immediateRisk: null,
  immediateRiskDetails: '',
};

type DraftContextValue = {
  draft: PublicReportDraft;
  attachments: File[];
  updateDraft: (patch: Partial<PublicReportDraft>) => void;
  addPerson: (kind: 'involvedPeople' | 'witnesses') => void;
  updatePerson: (kind: 'involvedPeople' | 'witnesses', id: string, patch: Partial<DraftPerson>) => void;
  removePerson: (kind: 'involvedPeople' | 'witnesses', id: string) => void;
  addAttachments: (files: File[]) => void;
  removeAttachment: (index: number) => void;
  resetDraft: () => void;
};

const DraftContext = createContext<DraftContextValue | null>(null);

const loadDraft = (): PublicReportDraft => {
  if (typeof window === 'undefined') return EMPTY_DRAFT;
  try {
    const saved = window.sessionStorage.getItem(STORAGE_KEY);
    if (!saved) return EMPTY_DRAFT;
    return { ...EMPTY_DRAFT, ...(JSON.parse(saved) as Partial<PublicReportDraft>) };
  } catch {
    return EMPTY_DRAFT;
  }
};

export function PublicReportDraftProvider({ children }: PropsWithChildren) {
  const [draft, setDraft] = useState<PublicReportDraft>(loadDraft);
  const [attachments, setAttachments] = useState<File[]>([]);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // O rascunho continua funcional em memória quando o storage do navegador está indisponível.
    }
  }, [draft]);

  const updateDraft = useCallback((patch: Partial<PublicReportDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  }, []);

  const addPerson = useCallback((kind: 'involvedPeople' | 'witnesses') => {
    const person: DraftPerson = {
      id: crypto.randomUUID(),
      name: '',
      role: '',
      details: '',
    };
    setDraft((current) => ({ ...current, [kind]: [...current[kind], person] }));
  }, []);

  const updatePerson = useCallback(
    (kind: 'involvedPeople' | 'witnesses', id: string, patch: Partial<DraftPerson>) => {
      setDraft((current) => ({
        ...current,
        [kind]: current[kind].map((person) => (person.id === id ? { ...person, ...patch } : person)),
      }));
    },
    [],
  );

  const removePerson = useCallback((kind: 'involvedPeople' | 'witnesses', id: string) => {
    setDraft((current) => ({
      ...current,
      [kind]: current[kind].filter((person) => person.id !== id),
    }));
  }, []);

  const addAttachments = useCallback((files: File[]) => {
    setAttachments((current) => [...current, ...files].slice(0, 5));
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachments((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }, []);

  const resetDraft = useCallback(() => {
    setDraft(EMPTY_DRAFT);
    setAttachments([]);
    try { window.sessionStorage.removeItem(STORAGE_KEY); } catch { /* sem efeito no fluxo */ }
  }, []);

  const value = useMemo<DraftContextValue>(
    () => ({
      draft,
      attachments,
      updateDraft,
      addPerson,
      updatePerson,
      removePerson,
      addAttachments,
      removeAttachment,
      resetDraft,
    }),
    [
      draft,
      attachments,
      updateDraft,
      addPerson,
      updatePerson,
      removePerson,
      addAttachments,
      removeAttachment,
      resetDraft,
    ],
  );

  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function usePublicReportDraft() {
  const context = useContext(DraftContext);
  if (!context) throw new Error('usePublicReportDraft precisa ser usado dentro de PublicReportDraftProvider.');
  return context;
}
