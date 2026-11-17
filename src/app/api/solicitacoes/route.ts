import {NextRequest,NextResponse} from 'next/server';
import {createHash}from'node:crypto';
import{getSecretClient}from'@/lib/supabase-server';
export const runtime='nodejs';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export async function POST(req:NextRequest){
 try{
  const body=await req.json();if(!UUID.test(body?.idempotencyKey||'')||!Array.isArray(body?.items)||body.items.length<1||body.items.length>20)return NextResponse.json({error:'Itens inválidos.'},{status:400});
  const seen=new Set<string>();const items:{variantId:string;quantity:number}[]=[];
  for(const it of body.items){if(!UUID.test(it?.variantId||'')||!Number.isInteger(it.quantity)||it.quantity<1||it.quantity>20||seen.has(it.variantId))return NextResponse.json({error:'Variações ou quantidades inválidas.'},{status:400});seen.add(it.variantId);items.push({variantId:it.variantId,quantity:it.quantity})}
  const db=getSecretClient();const{data:settings}=await db.from('store_settings').select('whatsapp,name').eq('id',1).single();
  const phone=(settings?.whatsapp||'').replace(/\D/g,'');if(!/^\d{10,15}$/.test(phone))return NextResponse.json({error:'A loja ainda não configurou um WhatsApp válido.'},{status:503});
  const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
  const salt=process.env.QUOTE_HASH_SALT||'';
  if(!salt) return NextResponse.json({error:'Proteção do formulário não configurada.'},{status:503});
  const hash=createHash('sha256').update(ip+'|'+salt).digest('hex');
  // Repeated clicks share the same idempotency key; requests are server-validated in SQL.
  const {data,error}=await db.rpc('create_quote_internal',{p_items:items,p_idempotency_key:body.idempotencyKey,p_requester_hash:hash});
  if(error){console.error('quote',error.code,error.message);return NextResponse.json({error:error.message.includes('limit')?'Limite temporário de solicitações atingido.':error.message.includes('stock')?'Um produto ficou indisponível. Atualize seu carrinho.':'Não foi possível validar seus itens.'},{status:400})}
  const code=String(data?.code||'');const total=Number(data?.total_cents||0);
  const msg=[`Olá! Gostaria de consultar estes itens na ${settings?.name||'loja'}:`,`Solicitação #${code}`,'',...(data?.lines||[]).map((x:{name:string;variant:string;quantity:number;price_cents:number})=>`• ${x.name} — ${x.variant}\n  ${x.quantity} × ${(x.price_cents/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}`),'',`Total estimado: ${(total/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}`,'','Gostaria de confirmar a disponibilidade.'].join('\n');
  return NextResponse.json({code,url:'https://wa.me/'+phone+'?text='+encodeURIComponent(msg)});
 }catch(error){console.error('quote request',error instanceof Error?error.message:'unknown');return NextResponse.json({error:'Erro ao preparar a solicitação.'},{status:500})}
}
