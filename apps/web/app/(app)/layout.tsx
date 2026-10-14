import { createClient } from '@/lib/supabase/server';
import { AppShell } from './app-shell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: { full_name: string | null; last_project_id: string | null } | null = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, last_project_id')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  return (
    <AppShell
      userName={profile?.full_name ?? user?.email?.split('@')[0] ?? 'Usuario'}
      lastProjectId={profile?.last_project_id ?? undefined}
    >
      {children}
    </AppShell>
  );
}
