import { cn } from '@/lib/utils';

export function CountStat({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="font-serif text-2xl leading-none">{value}</div>
      <div className="mt-1 text-xs tracking-wide text-sidebar-foreground/70">{label}</div>
    </div>
  );
}
