import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createLocalClient } from '../db/local-supabase';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createClient(): Promise<any> {
  if (process.env.DATABASE_URL) {
    return createLocalClient();
  }

  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll is called from Server Components where cookies cannot be set
          }
        },
      },
    }
  );
}
