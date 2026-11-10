import { useEffect, useId, type PropsWithChildren, type ReactNode } from 'react';

type ModalProps = PropsWithChildren<{ open: boolean; onClose: () => void; title: string; description?: string; footer?: ReactNode; size?: 'sm' | 'md' | 'lg' }>;
const sizes = { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-3xl' };

export function Modal({ open, onClose, title, description, footer, children, size = 'md' }: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = previous; };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
      <button className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" onClick={onClose} aria-label="Fechar modal" />
      <section
        className={`relative max-h-[92dvh] w-full overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl ${sizes[size]}`}
        role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined}
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-200 sm:hidden" aria-hidden="true" />
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="min-w-0"><h2 id={titleId} className="text-lg font-bold text-slate-900">{title}</h2>{description ? <p id={descriptionId} className="mt-1 text-sm leading-5 text-slate-500">{description}</p> : null}</div>
          <button onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-100" aria-label="Fechar"><i className="bi bi-x-lg" /></button>
        </div>
        <div className="soft-scrollbar max-h-[calc(92dvh-150px)] overflow-y-auto px-5 py-5 sm:max-h-[65vh] sm:px-6">{children}</div>
        {footer ? <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:flex-wrap sm:justify-end sm:px-6 [&>button]:w-full sm:[&>button]:w-auto">{footer}</div> : null}
      </section>
    </div>
  );
}
