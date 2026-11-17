import { createBrowserClient } from '@supabase/ssr';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
export function getBrowserClient(){
  if (!url || !key) throw new Error('Configure o Supabase em .env.local');
  return createBrowserClient(url,key);
}
