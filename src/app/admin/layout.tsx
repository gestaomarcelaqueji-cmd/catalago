import{getServerClient}from'@/lib/supabase';import{AdminShell}from'@/components/admin-shell';
export const dynamic='force-dynamic';
export default async function AdminLayout({children}:{children:React.ReactNode}){
 const db=await getServerClient();const{data:{user}}=await db.auth.getUser();
 if(!user)return <>{children}</>;
 const{data:profile}=await db.from('admin_profiles').select('name,active').eq('id',user.id).maybeSingle();
 if(!profile?.active)return <>{children}</>; // proxy.ts bloqueia qualquer página privada sem perfil
 return <AdminShell name={profile.name}>{children}</AdminShell>
}
