import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

export async function getServerClient(){
  if (!url || !key) throw new Error('Configure as variáveis públicas do Supabase');
  const jar = await cookies();
  return createServerClient(url,key,{cookies:{
    getAll(){return jar.getAll()},
    setAll(items){try{items.forEach(({name,value,options})=>jar.set(name,value,options))}catch{/* Server Components não gravam cookies. */}}
  }});
}
export function getSecretClient(){
  const secret = process.env.SUPABASE_SECRET_KEY;
  if(!url || !secret) throw new Error('SUPABASE_SECRET_KEY ausente (somente servidor)');
  return createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
}
