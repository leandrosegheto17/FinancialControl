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
supabase secrets set CHAVE=valor   # segredos de Edge Functions
```

## 5. Desenvolvimento local: Supabase CLI local vs projeto cloud

- **Regra de ouro**: toda migration nova e toda alteração de schema são criadas e validadas primeiro contra `supabase start` (Docker local). Nunca aplicar uma migration inédita direto em um projeto cloud.
- Existem dois projetos Supabase na nuvem: `financialcontrol-staging` e `financialcontrol-prod`. Migrations vão para staging automaticamente após merge em `main`; promoção para prod é manual.
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
