import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from './lib/supabase';
import { Sidebar } from './components/layout/Sidebar';
import { Menu, Wallet } from 'lucide-react';

// Pages
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Accounts from './pages/Accounts';
import Goals from './pages/Goals';
import FixedExpenses from './pages/FixedExpenses';
import Categories from './pages/Categories';
import CCBilling from './pages/CCBilling';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-emerald-500 font-bold animate-pulse">FINANCE OS INITIALIZING...</div>
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30">
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          
          <div className="flex-1 flex flex-col min-w-0">
            {/* Mobile Header */}
            <header className="h-16 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-4 md:hidden sticky top-0 z-30">
              <div className="flex items-center gap-2">
                <Wallet className="w-6 h-6 text-emerald-500" />
                <span className="font-bold text-emerald-500 tracking-tight">FINANCE OS</span>
              </div>
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 text-zinc-400 hover:text-zinc-100"
              >
                <Menu className="w-6 h-6" />
              </button>
            </header>

            <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/accounts" element={<Accounts />} />
                <Route path="/goals" element={<Goals />} />
                <Route path="/fixed-expenses" element={<FixedExpenses />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/cc-billing" element={<CCBilling />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

function AuthPage() {
  const handleSignIn = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        skipBrowserRedirect: true,
      }
    });

    if (error) {
      console.error('Auth error:', error.message);
      return;
    }

    if (data?.url) {
      // Open the auth URL in a popup window
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      window.open(
        data.url,
        'google_auth_popup',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,status=yes`
      );
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="max-w-sm w-full space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-emerald-500 tracking-tighter">FINANCE OS</h1>
          <p className="text-zinc-500 text-sm uppercase tracking-widest font-bold">Personal Finance Bloomberg Terminal</p>
        </div>
        
        <div className="p-8 border border-zinc-800 bg-zinc-900 rounded-2xl shadow-2xl space-y-6">
          <p className="text-zinc-400 text-sm">
            Securely connect with your Google account to manage your financial life.
          </p>
          <button
            onClick={handleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-3 px-4 rounded-lg hover:bg-zinc-200 transition-colors"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            Sign in with Google
          </button>
        </div>

        <div className="pt-8 grid grid-cols-3 gap-4 opacity-20 grayscale">
          <div className="h-1 bg-zinc-800 rounded" />
          <div className="h-1 bg-zinc-800 rounded" />
          <div className="h-1 bg-zinc-800 rounded" />
        </div>
      </div>
    </div>
  );
}
