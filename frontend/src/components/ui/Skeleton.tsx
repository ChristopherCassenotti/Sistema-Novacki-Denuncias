type Props = {
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
};

const radius = { sm: 'rounded-md', md: 'rounded-lg', lg: 'rounded-xl', full: 'rounded-full' };

export function Skeleton({ className = '', rounded = 'md' }: Props) {
  return <div className={`skeleton-shimmer overflow-hidden bg-slate-200/80 ${radius[rounded]} ${className}`} aria-hidden="true" />;
}
