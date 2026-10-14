'use client';

import { useParams } from 'next/navigation';
import { Sidebar } from '@/components/nav/sidebar';
import { signOut } from '../(auth)/login/actions';

interface Props {
  children: React.ReactNode;
  userName: string;
  lastProjectId?: string;
}

export function AppShell({ children, userName, lastProjectId }: Props) {
  const params = useParams();
  const projectId = (params?.projectId as string) ?? lastProjectId;

  return (
    <div className="flex min-h-screen">
      <Sidebar
        projectId={projectId}
        userName={userName}
        onSignOut={() => signOut()}
      />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
