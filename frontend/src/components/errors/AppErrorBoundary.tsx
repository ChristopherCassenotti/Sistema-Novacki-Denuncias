import { Component, type ErrorInfo, type PropsWithChildren, type ReactNode } from 'react';

type State = { error: Error | null; reference: string; copied: boolean };

export class AppErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = { error: null, reference: '', copied: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error, reference: `UI-${Date.now().toString(36).toUpperCase()}`, copied: false };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AppErrorBoundary]', error, info);
  }

  copyReference = async () => {
    try {
      await navigator.clipboard.writeText(this.state.reference);
      this.setState({ copied: true });
      window.setTimeout(() => this.setState({ copied: false }), 1600);
    } catch {
      this.setState({ copied: false });
    }
  };

  render(): ReactNode {
    if (!this.state.error) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
        <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-xl text-red-700"><i className="bi bi-exclamation-octagon" aria-hidden="true" /></div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-red-600">Não foi possível carregar esta tela</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">Algo deu errado.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">Recarregue a página e tente novamente. Se o problema continuar, informe o código abaixo ao suporte.</p>
          <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-900">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p><strong>Código para suporte:</strong> <span className="font-mono">{this.state.reference}</span></p>
              <button type="button" onClick={() => void this.copyReference()} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 text-xs font-bold text-red-700 hover:bg-red-50"><i className="bi bi-copy" />{this.state.copied ? 'Copiado' : 'Copiar'}</button>
            </div>
            {import.meta.env.DEV ? <p className="mt-3 break-words border-t border-red-100 pt-3 text-xs"><strong>Mensagem:</strong> {this.state.error.message}</p> : null}
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={() => window.location.reload()} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 text-sm font-bold text-white hover:bg-brand-800"><i className="bi bi-arrow-clockwise" />Recarregar página</button>
            <a href="/" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 hover:bg-slate-50"><i className="bi bi-house" />Ir para o início</a>
          </div>
        </section>
      </main>
    );
  }
}
