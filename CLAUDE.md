# CLAUDE.md

Guia operacional para o Claude Code (e qualquer desenvolvedor) trabalhar neste repositório. Este arquivo não descreve requisitos de negócio nem arquitetura — para isso, veja:

- [`PRD.md`](./PRD.md) — requisitos funcionais (RF01–RF11) e não-funcionais do produto.
- [`SSD.md`](./SSD.md) — arquitetura da solução, modelo de dados completo, mapeamento de requisitos para módulos técnicos, segurança, riscos.

## 1. O que é este projeto

PWA (Progressive Web App) de gestão financeira pessoal, construído como **React + Vite + TypeScript** no frontend sobre **Supabase** (Postgres + Auth + Storage + Edge Functions + Row Level Security) como backend. Cobre desde controle de contas e lançamentos manuais até automações avançadas (lançamento por áudio, OCR de recibos, importação OFX/CSV, Open Finance).

## 2. Stack

**Frontend (`apps/web`)**
- React 18 + Vite + TypeScript (`strict: true`)
- TailwindCSS + shadcn/ui (componentes)
- TanStack Query (cache/sincronização de dados do Supabase)
- Zustand (estado de UI local, não dados de servidor)
- React Hook Form + Zod (formulários e validação, schemas compartilhados com `packages/shared`)
- `vite-plugin-pwa` (service worker, manifest, Web Push)

**Backend (`supabase/`)**
- Postgres 15+ com Row Level Security (RLS) obrigatório em toda tabela de usuário
- Supabase Auth (GoTrue) para login (e-mail/senha, magic link)
- Supabase Storage para anexos (áudio, imagens de OCR, exports)
- Edge Functions (Deno) para toda integração com serviço externo (STT/LLM, OCR, Open Finance, e-mail, push)
- `pg_cron` para tarefas agendadas (geração de recorrências, fechamento de fatura)
- Vault/pgsodium para segredos de terceiros (tokens de Open Finance)

**Pacote compartilhado (`packages/shared`)**
- Schemas Zod, tipos de domínio e lógica de negócio pura (cálculo de próxima data de recorrência, projeção de fatura) — testável sem I/O e usada tanto pelo client quanto pelas Edge Functions, para nunca divergir.

## 3. Estrutura do repositório

```
FinancialControl/
├── PRD.md, CLAUDE.md, SSD.md
├── pnpm-workspace.yaml, package.json
├── apps/
│   └── web/                        # PWA React + Vite + TS
│       └── src/
│           ├── app/                # rotas, providers, layout raiz
│           ├── features/           # accounts/, transactions/, budgets/, cards/, audio/, ocr/, reports/, auth/
│           ├── lib/supabase/       # client tipado, queries
│           ├── components/ui/      # shadcn/ui
│           └── service-worker/     # push, offline cache
├── packages/
│   └── shared/                     # zod schemas, tipos, lógica pura
└── supabase/
    ├── config.toml
    ├── seed.sql                    # categorias padrão, moedas
    ├── migrations/                 # schema versionado
    └── functions/                  # Edge Functions (Deno)
```

## 4. Comandos essenciais

```bash
# Instalação e workspace
corepack enable                    # ativa o pnpm fixado em package.json#packageManager (necessário em máquina nova, pnpm não vem pré-instalado)
pnpm install

# Frontend
pnpm --filter web dev              # servidor de desenvolvimento
pnpm --filter web build            # build de produção (PWA)
pnpm --filter web test             # testes unitários (Vitest)
pnpm --filter web test:e2e         # testes E2E (Playwright)

# Qualidade
pnpm lint
pnpm typecheck

# Supabase (backend local)
supabase start                     # sobe stack local via Docker (Postgres, Auth, Storage, Studio)
supabase stop
supabase db reset                  # reaplica todas as migrations + seed.sql do zero
supabase migration new <nome>      # nova migration
supabase gen types typescript --local > packages/shared/src/database.types.ts
supabase functions serve <nome> --env-file supabase/.env.local
supabase functions deploy <nome>
supabase db push                   # aplica migrations no projeto cloud
supabase db push --include-seed    # idem, incluindo supabase/seed.sql (db push sozinho NÃO semeia)
supabase secrets set CHAVE=valor   # segredos de Edge Functions

# Vercel (frontend)
vercel link                        # linka a raiz do repo ao projeto (usa vercel.json p/ build do monorepo)
vercel deploy --prod               # build + deploy de produção
vercel env add NOME production --value "valor" --yes   # variável de ambiente persistida
```

## 5. Desenvolvimento local: Supabase CLI local vs projeto cloud

- **Regra de ouro**: toda migration nova e toda alteração de schema são criadas e validadas primeiro contra `supabase start` (Docker local). Nunca aplicar uma migration inédita direto em um projeto cloud.
- Desenho final (ainda não implantado): dois projetos Supabase na nuvem, `financialcontrol-staging` e `financialcontrol-prod`, com migrations indo para staging automaticamente após merge em `main` e promoção para prod manual, via CI. **Estado atual**: existe só um projeto cloud, `financial_control` (ref `szpplwojnfvxuhckkdyc`), usado como staging; migrations são aplicadas manualmente via `supabase db push` a partir da máquina local — não há CI configurado ainda. Ver `CLAUDE.md` §11 para o fluxo de deploy real hoje.
- `supabase/config.toml` fixa a versão do Postgres e extensões (`pgcrypto`, `pgsodium`/Vault, `pg_cron`, `pg_net`) para garantir paridade entre local e cloud.

## 6. Variáveis de ambiente

**Frontend (`apps/web/.env.local`) — só valores públicos:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_VAPID_PUBLIC_KEY`

**Edge Functions / secrets (`supabase secrets` em cloud, `supabase/.env.local` local, git-ignorado) — nunca no frontend:**
- `SUPABASE_SERVICE_ROLE_KEY`
- `STT_PROVIDER_API_KEY`, `LLM_API_KEY` (extração de entidades do áudio)
- `OCR_PROVIDER_API_KEY`
- `OPENFINANCE_CLIENT_ID`, `OPENFINANCE_CLIENT_SECRET`
- `RESEND_API_KEY` (e-mail transacional)
- `VAPID_PRIVATE_KEY`
- `WEBAUTHN_RP_ID`, `WEBAUTHN_ORIGIN` (usadas por `webauthn-register`/`webauthn-authenticate`; **precisam bater exatamente com o domínio do frontend** — `localhost` local, o domínio de produção na Vercel em cloud. Trocar o domínio de produção exige atualizar esses dois secrets, senão o WebAuthn passa a falhar silenciosamente por origin mismatch.)

## 7. Convenções de código

- TypeScript `strict: true`; sem `any` implícito. Tipos de tabela sempre derivados de `database.types.ts` (gerado, nunca escrito à mão) + tipos de "view model" em `packages/shared`.
- Organização por **feature**, não por tipo de arquivo: `features/transactions/{api,components,hooks,schemas}`.
- Toda leitura/escrita no Supabase passa pela camada `features/*/api/*.ts`. Componentes de UI nunca chamam `supabase.from(...)` diretamente.
- **Valores monetários são sempre inteiros em centavos** (`amount_cents: bigint`), nunca `float`, tanto no banco quanto nos schemas Zod e no client. Esta é a regra mais importante do projeto — evita erros de arredondamento em cálculos financeiros.
- Datas armazenadas em UTC (`date`/`timestamptz`) no Postgres; exibidas no timezone do usuário no client via `date-fns`.
- Branches: `feat/rf0X-descricao`, `fix/...`, `chore/...`.
- Commits: Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`), referenciando o RF quando aplicável — ex. `feat(rf06): geração de parcelas futuras`.

## 8. Fluxo obrigatório para mudanças de schema

1. `supabase migration new <nome>` — escrever DDL, policies de RLS e triggers na **mesma** migration da tabela.
2. Toda tabela nova precisa de `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` e suas policies antes de ser considerada pronta — nunca criar tabela sem RLS, nem temporariamente.
3. `supabase db reset` local para validar do zero.
4. Regenerar tipos: `supabase gen types typescript --local > packages/shared/src/database.types.ts`.
5. Se a mudança alterar o modelo de dados documentado, atualizar a seção correspondente do `SSD.md` no mesmo PR.
6. **Toda tabela, view ou função nova precisa de `GRANT` explícito para `authenticated`** (`SELECT/INSERT/UPDATE/DELETE` em tabelas/views, `EXECUTE` em funções) — além do RLS. Versões recentes da Supabase CLI não expõem mais automaticamente objetos novos do schema `public` para a Data API; sem o GRANT, toda chamada do PostgREST volta **403**, mesmo com as policies certas (bug real, ver `supabase/migrations/20260824173321_grants.sql` e `SSD.md` §4). Como essa migration já configurou `ALTER DEFAULT PRIVILEGES`, objetos novos herdam o GRANT automaticamente **desde que criados pelo mesmo role que rodou as migrations** — na dúvida, `supabase db reset` local e testar uma query autenticada antes de dar `db push`.

## 9. Testes

- **Unitários (Vitest)**: lógica pura em `packages/shared` (cálculo de recorrência, projeção de fatura, categorização) — sem I/O, fácil de testar exaustivamente.
- **Banco (pgTAP/SQL)**: em `supabase/tests/`, cobrindo RLS (usuário A nunca lê dados do usuário B) e triggers (saldo de conta, total de fatura).
- **E2E (Playwright)**: fluxos críticos — criar transação manual, confirmar lançamento por áudio, fechar fatura de cartão.
- **Edge Functions (Deno test)**: sempre mockando providers externos (STT, OCR, Open Finance, e-mail) — nunca testar contra API externa real em CI.

## 10. Segurança operacional (regras para o Claude Code)

- **Nunca** desabilitar RLS para "resolver rápido" um erro de permissão — investigar a policy e corrigi-la.
- **Nunca** commitar `.env*` com chaves reais, nem logar payloads de transação, áudio ou OCR em texto livre em `console.log` que sobrevive em produção (dados financeiros são sensíveis).
- Toda Edge Function que chama serviço externo (STT, OCR, Open Finance, e-mail) precisa de timeout e fallback definidos — lembrar do requisito de resposta do áudio em menos de 3 segundos (ver `SSD.md`).
- Ao adicionar uma tabela com credenciais/tokens de terceiros (ex. Open Finance), usar Supabase Vault/pgsodium para o campo sensível — nunca gravar token em texto puro numa coluna comum (ver `SSD.md` §4).
- Categorias com `is_system_default = true` são somente leitura para o usuário — nunca permitir update/delete via policy.

## 11. Deploy (Vercel + Supabase cloud)

- **Frontend na Vercel**: projeto `financial-control` (time `leandrosegheto17s-projects`), linkado a partir da **raiz** do monorepo (não de `apps/web`) para que o build enxergue o `pnpm-workspace.yaml` e resolva `@financial-control/shared: workspace:*`. Configuração fica em `vercel.json` na raiz:
  - `buildCommand: "pnpm --filter web build"`, `installCommand: "pnpm install --frozen-lockfile"`, `outputDirectory: "apps/web/dist"`.
  - `rewrites` catch-all para `/index.html` — **obrigatório**: sem isso, qualquer rota do React Router acessada diretamente (ex. `/login`) cai no 404 padrão da Vercel em vez de servir o app.
- **Domínio de produção**: `fintech-control-lsm.vercel.app`, registrado como **Domain** do projeto (`vercel domains add <dominio>`), não apenas um alias (`vercel alias set`). Isso importa porque a Vercel ativa por padrão a "Vercel Authentication" (Deployment Protection) em qualquer URL do projeto que não seja um Domain oficial — um alias criado só com `vercel alias set` fica atrás de um login da Vercel, mesmo apontando para produção (bug real encontrado ao trocar o domínio).
- **Variáveis de ambiente na Vercel**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY` — mesmos nomes da seção 6, mas apontando para o projeto Supabase **cloud**, nunca para `127.0.0.1`. `vercel env add NOME production --value "..." --yes` (o mesmo comando sem `--value`/`--yes` faz a CLI devolver uma sugestão em vez de executar, em sessões não-interativas — rodar de novo com as flags completas).
- **Backend**: projeto Supabase cloud `financial_control` (staging, ref `szpplwojnfvxuhckkdyc`). Linkar com `supabase link --project-ref <ref>` (exige `supabase login` prévio — fluxo interativo de navegador, não roda em terminal não-TTY). Depois do link: `supabase db push --include-seed` para schema + categorias padrão, e `supabase functions deploy webauthn-register` / `webauthn-authenticate` para as Edge Functions.
- **Checklist ao trocar o domínio de produção**: (1) `vercel domains add <novo-dominio>` (não só alias); (2) `supabase secrets set WEBAUTHN_RP_ID=<dominio-sem-protocolo> WEBAUTHN_ORIGIN=https://<dominio>`; (3) atualizar o Site URL em Supabase Dashboard → Authentication → URL Configuration (senão magic link/reset de senha apontam para o domínio antigo).
