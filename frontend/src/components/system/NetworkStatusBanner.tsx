import { useEffect, useState } from 'react';

export function NetworkStatusBanner() {
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' ? true : navigator.onLine);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div className="safe-bottom fixed inset-x-0 bottom-0 z-[120] flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-center text-xs font-bold text-amber-950 shadow-md" role="status" aria-live="polite">
      <i className="bi bi-wifi-off" aria-hidden="true" />
      Você está sem conexão. Algumas ações ficarão indisponíveis até a internet voltar.
    </div>
  );
}
