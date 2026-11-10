export const getInitials = (name?: string) => {
  if (!name?.trim()) return 'NV';

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
};
