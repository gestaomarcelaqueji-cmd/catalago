import {NextRequest,NextResponse} from 'next/server';
import {createServerClient} from '@supabase/ssr';
export async function proxy(request:NextRequest){
 if(!request.nextUrl.pathname.startsWith('/admin')||request.nextUrl.pathname==='/admin/login')return NextResponse.next({request});
 let response=NextResponse.next({request});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return NextResponse.redirect(new URL('/admin/login',request.url));
 const supabase=createServerClient(url,key,{cookies:{getAll(){return request.cookies.getAll()},setAll(cookies){cookies.forEach(({name,value})=>request.cookies.set(name,value));response=NextResponse.next({request});cookies.forEach(({name,value,options})=>response.cookies.set(name,value,options))}}});
 const{data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.redirect(new URL('/admin/login',request.url));
 const{data:admin}=await supabase.from('admin_profiles').select('active').eq('id',user.id).maybeSingle();
 if(!admin?.active)return NextResponse.redirect(new URL('/admin/login?erro=sem-permissao',request.url));
 return response;
}
export const config={matcher:['/admin/:path*']};
