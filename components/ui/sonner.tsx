import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { useTheme } from 'next-themes';

export function Toaster(props: ToasterProps) {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      toastOptions={{
        className: 'font-sans',
      }}
      {...props}
    />
  );
}
