export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}novackiLogo.webp`}
      alt="Novacki Papel e Embalagens"
      className={`block w-auto shrink-0 object-contain ${compact ? 'h-10' : 'h-14'}`}
      decoding="async"
      draggable={false}
    />
  );
}
