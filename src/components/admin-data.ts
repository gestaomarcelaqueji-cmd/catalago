import type{Product}from'@/lib/models';
export function adminProductForm(p?:Product){return{name:p?.name||'',slug:p?.slug||'',description:p?.description||'',status:p?.status||'draft',featured:p?.featured||false}}
export const errorText=(e:unknown)=>e instanceof Error?e.message:String(e||'Erro desconhecido');
