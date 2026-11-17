import fs from 'node:fs';import path from 'node:path';
const required=[
'src/app/page.tsx','src/app/catalogo/page.tsx','src/app/produto/[slug]/page.tsx',
'src/app/carrinho/page.tsx','src/app/api/solicitacoes/route.ts',
'src/app/admin/login/page.tsx','src/app/admin/produtos/page.tsx',
'src/app/admin/categorias/page.tsx','src/app/admin/estoque/page.tsx',
'src/app/admin/solicitacoes/page.tsx','src/app/admin/aparencia/page.tsx',
'src/app/admin/configuracoes/page.tsx','src/proxy.ts',
'supabase/migrations/20261117190000_initial_store.sql'
];
let errors=0;for(const f of required)if(!fs.existsSync(f)){console.error('Faltando:',f);errors++}
const sql=fs.readFileSync('supabase/migrations/20261117190000_initial_store.sql','utf8');
for(const txt of ['enable row level security','create_quote_internal','adjust_stock','change_quote_status','revoke all on all tables','store-media'])if(!sql.includes(txt)){console.error('Faltando SQL:',txt);errors++}
let source='';function visit(dir){for(const name of fs.readdirSync(dir)){const f=path.join(dir,name);if(fs.statSync(f).isDirectory())visit(f);else source+=fs.readFileSync(f,'utf8')+'\n'}}visit('src');
for(const bad of ['@media-lib:','ducks-conceito','nuvemshop.com','mercadopago','stripe.com'])if(source.toLowerCase().includes(bad)){console.error('Referência indevida no runtime:',bad);errors++}
console.log(`Verificação estrutural: ${errors===0?'OK':'FALHOU'} (${required.length} rotas/arquivos críticos)`);process.exitCode=errors?1:0;
