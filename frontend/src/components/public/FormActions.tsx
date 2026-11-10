import { useNavigate } from 'react-router';
import { Button } from '../ui/Button';

export function FormActions({ backTo, nextLabel = 'Continuar', loading = false }: { backTo?: string; nextLabel?: string; loading?: boolean }) {
  const navigate = useNavigate();
  return (
    <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
      {backTo ? <Button className="w-full sm:w-auto" type="button" variant="ghost" onClick={() => navigate(backTo)} disabled={loading}><i className="bi bi-arrow-left" />Voltar</Button> : <span />}
      <Button className="w-full sm:w-auto" type="submit" loading={loading}>{nextLabel}{!loading ? <i className="bi bi-arrow-right" /> : null}</Button>
    </div>
  );
}
