import { NavLink, useParams } from 'react-router';

const tabs = [
  { suffix: '', label: 'Acompanhamento', icon: 'bi-clock-history' },
  { suffix: '/mensagens', label: 'Mensagens', icon: 'bi-chat-left-text' },
  { suffix: '/anexos', label: 'Anexos', icon: 'bi-paperclip' },
  { suffix: '/resposta', label: 'Resposta final', icon: 'bi-check2-circle' },
];

export function TrackingTabs() {
  const { protocolo } = useParams();
  const base = `/acompanhar/${encodeURIComponent(protocolo ?? '')}`;

  return (
    <nav className="overflow-x-auto border-b border-slate-200 soft-scrollbar" aria-label="Acompanhamento da denúncia">
      <div className="flex min-w-max gap-1 px-1">
        {tabs.map((tab) => (
          <NavLink
            key={tab.label}
            to={`${base}${tab.suffix}`}
            end={!tab.suffix}
            className={({ isActive }) =>
              [
                'inline-flex items-center gap-2 border-b-2 px-3 py-4 text-sm font-semibold transition-colors',
                isActive
                  ? 'border-brand-700 text-brand-800'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800',
              ].join(' ')
            }
          >
            <i className={`bi ${tab.icon}`} />
            {tab.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
