# Loja independente — Next.js + Supabase + WhatsApp

Projeto **novo**, separado da loja Ducks e da Nuvemshop, criado a partir da auditoria estrutural de `lojaducks-dev(20261117-182645).zip`.

## O que já está implementado

**Público:** Home com blocos configuráveis, barra de anúncio, menu/categorias, slideshow, vitrines, cards, catálogo, filtros de preço, ordenação, busca, página de produto, seleção de variações, carrinho em `localStorage`, validação dos itens e abertura de conversa por `wa.me` com mensagem pré-preenchida.

**Painel `/admin`:** acesso por e-mail e senha do Supabase Auth + cadastro explícito em `admin_profiles`, dashboard, cadastro/edição/arquivamento de produtos, variações e fotos, categorias/subcategorias, estoque com histórico, solicitações com confirmação/baixa manual, editor **somente de seções predefinidas**, configuração da marca, logotipo, textos e WhatsApp.

**Dados:** Supabase PostgreSQL, Storage `store-media`, RLS e funções transacionais de geração de solicitações e ajuste de estoque.

### Exclusões definitivas

Não haverá **pagamentos**, **frete automático**, **contas de clientes**, **emissão fiscal**, **integração para receber ou ler mensagens do WhatsApp** nem **construtor livre de páginas**, agora ou no futuro. Não criar código para essas funções.

## Como começar

### 1. Ambiente

- Node.js 22.16+ e npm.
- **Repositório já existente:** https://github.com/gestaomarcelaqueji-cmd/catalago (branch `main`). Não crie outro repositório nem utilize `nobron` ou `nobroneventos`.
- Execute `npm install` para baixar dependências. O GitHub Actions verifica automaticamente TypeScript e compilação Next.js a cada alteração.
- Copie `.env.example` para `.env.local` e preencha as variáveis.
- Execute `npm run dev` e abra http://localhost:3000.

### 2. Supabase

O projeto **`catalago`** (ref `ksaqmubebsioosubznyb`) recebeu as migrações de forma efetiva no banco, com tabelas e políticas verificadas. Não aplique novamente os SQLs em um projeto que já contém essas tabelas.

Se você preferir um Supabase novo ou outro ambiente, aplique `supabase/migrations/20261117190000_initial_store.sql` em um banco vazio, em ordem, usando as migrações oficiais. Os arquivos de migração estão incluídos para referência e recuperação.

O Storage tem o bucket público `store-media`, mas só administradores podem enviar, atualizar ou excluir imagens. **Não há imagens da Ducks** no projeto.

### 3. Credenciais administrativas (passo obrigatório)

Não existe cadastro público de funcionários. Para criar o primeiro administrador:

1. Abra **Supabase > Authentication > Users** e utilize **Add user** para adicionar seu e-mail e senha administrativa (ou convide um usuário conforme a configuração de autenticação do projeto).
2. No **SQL Editor**, execute, substituindo o e-mail por aquele que acabou de cadastrar:

```sql
insert into public.admin_profiles (id,name,role,active)
select id, 'Proprietário', 'owner', true
from auth.users
where email = 'SEU_EMAIL@EXEMPLO.COM'
on conflict(id) do update set active=true,role='owner';
```

3. Entre em `/admin/login`. Contas Auth sem linha ativa em `admin_profiles` **não conseguem acessar o painel**.
4. Para novos funcionários, crie primeiro o usuário no Auth e insira o respectivo `admin_profiles` com `role='operator'`.

**Nunca** adicione usuários de atendimento em `auth.users` como se fossem clientes da loja. Somente administradores e funcionários utilizam login.

### 4. WhatsApp

No painel `/admin/configuracoes`, preencha o número completo com DDI e DDD, por exemplo `55` + DDD + número (sem espaços/símbolos). Sem número válido o endpoint de solicitações retorna erro 503.

O **servidor** precisa de `SUPABASE_SECRET_KEY` (chave secreta do projeto) e `QUOTE_HASH_SALT` (texto longo e aleatório). Configure **somente** em `.env.local` e nas variáveis de ambiente da Vercel. **Nunca** use `NEXT_PUBLIC_` para segredo e **nunca** compartilhe sua chave secreta no chat ou no GitHub.

O endpoint valida novamente SKU/variação, status, preço e estoque no banco, cria solicitação inicial com código e abre `https://wa.me/` no navegador. O cliente deve **enviar a mensagem manualmente**. O sistema não verifica envio, recebimento ou resposta.

### 5. Publicar na Vercel

1. **Não crie outro repositório:** o código está em `gestaomarcelaqueji-cmd/catalago`. Se quiser que o código não seja público, altere a visibilidade para privado nas configurações do GitHub.
2. O código já foi enviado e passou na verificação automatizada de tipos e build. Não envie `.env.local`, segredos, `node_modules` nem `.next`.
3. Em **Vercel > Add New > Project**, importe o repositório e selecione o projeto Next.js.
4. Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` e `QUOTE_HASH_SALT` nos ambientes Preview e Production.
5. Publique **somente depois** de executar build, revisar a URL e validar um ciclo completo.
6. Ajuste URL do site em **Supabase > Authentication > URL Configuration** caso use redirecionamentos por e-mail.

### Validação antes de liberar a loja ao público

O GitHub Actions instalou as dependências e concluiu `npm run typecheck` e `npm run build` com sucesso. O SQL também foi aplicado e consultado no Supabase. Ainda faltam a configuração de ambiente na Vercel, o primeiro administrador e testes de navegação/funcionamento com produtos reais. Não trate o sistema como homologado até concluir essas etapas.

Checklist: login de funcionário autorizado, restrição de não-admin, produto rascunho/publicado, foto e variante, categorias, busca/filtro mobile, carrinho, solicitação WhatsApp, confirmação e baixa de estoque, estorno no cancelamento, gestão de seções e atualização dos dados na loja, respostas de erro do servidor e tela 404.

## Organização principal

```text
src/app/                    páginas e rotas Next.js (incluindo /api/solicitacoes)
src/components/             visual da loja, painel, carrinho e formulários
src/lib/                    clientes Supabase, modelos e consultas
src/proxy.ts                proteção de /admin no Next.js 16
src/app/globals.css         CSS próprio inspirado na estrutura do ZIP
supabase/migrations/        schema e funções transacionais
README.md                   operação e configuração
```

## Segurança

- Imagens, nomes e textos da Ducks **não** foram copiados.
- Não importar `.nuvem`, `store.js`, scripts de checkout ou configurações da Nuvemshop.
- `public.create_quote_internal` só é executável pelo papel `service_role` (chamado com chave secreta somente no servidor).
- `anon` não tem acesso a `quote_requests`, `quote_items`, `admin_profiles` nem privilégios de escrita em produtos.
- RLS em todas as tabelas expostas, e controles de administrador verificados no SQL e proxy.
- Preços em centavos no banco; o carrinho não controla o preço final.

## Referência / direitos de reutilização

A estrutura de seções e o comportamento geral foram documentados a partir do ZIP fornecido. A implementação Next/React e o CSS são próprios. O tema Ipanema original pode estar sujeito a licenças/termos da plataforma; o projeto não contém cópia integral de arquivos `.tpl`, CSS da plataforma, logomarcas ou fotografias do tema.
