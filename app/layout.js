import './globals.css';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: 'AI Memory — Transfer project context between any AI',
  description: 'Move a project’s full context between AI systems. Never re-explain your work to a new AI again.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster theme="dark" position="bottom-right" toastOptions={{ className: 'font-mono text-xs' }} />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
