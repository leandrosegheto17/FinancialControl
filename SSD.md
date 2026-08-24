# SSD.md — Software Specification Document (FinancialControl)

Especificação técnica de solução para o produto descrito em [`PRD.md`](./PRD.md). Para convenções operacionais de desenvolvimento (comandos, fluxo de schema, testes), veja [`CLAUDE.md`](./CLAUDE.md).

**Stack decidida:** PWA responsivo (React + Vite + TypeScript) sobre Supabase (Postgres + Auth + Storage + Edge Functions + Row Level Security). Este documento cobre a arquitetura para o **PRD completo (RF01–RF11)**, com fases de implementação sugeridas na seção 7 — não é um recorte de MVP.

---

## 1. Visão de arquitetura

```
┌───────────────────────────────────────────────────────────────────┐
│  PWA (React + Vite + TS) — instalável, service worker             │
│  - UI (dashboard, lançamentos, cartões, metas, relatórios)        │
│  - Camada de dados: Supabase JS client (anon key) + TanStack Query│
│  - Web Push subscription · WebAuthn (desbloqueio local)           │
└───────────────┬───────────────────────────────┬───────────────────┘
                │ HTTPS/TLS 1.3 (REST/Realtime)  │ invoca via fetch
                ▼                                 ▼
┌───────────────────────────────┐   ┌──────────────────────────────────┐
│  Supabase Platform             │   │  Edge Functions (Deno, isoladas) │
│  - Postgres 15 + RLS por user  │◄──┤  audio-transaction-intake        │
│  - Auth (GoTrue)                │   │  ocr-receipt-intake              │
│  - Storage (áudio/imagens temp, │   │  import-ofx-csv                  │
│    anexos OCR, exports)         │   │  openfinance-webhook / -sync     │
│  - Realtime (notificações)      │   │  recurring-generator (cron)      │
│  - pg_cron (agendamento)        │   │  invoice-closer (cron)           │
│  - Vault/pgsodium (segredos)    │   │  budget-alert-checker            │
└────────────────────────────────┘   │  notifications-dispatcher        │
                                      │  webauthn-register/-authenticate │
                                      └───────────┬────────────┬────────┘
                                                  ▼            ▼
                                   ┌─────────────────┐  ┌──────────────────┐
                                   │ STT + LLM         │  │ OCR provider       │
                                   │ (extração de       │  │ (leitura de QR     │
                                   │  entidades do áudio)│  │  NFC-e + fallback  │
                                   └─────────────────┘  └──────────────────┘
                                   ┌─────────────────┐  ┌──────────────────┐
                                   │ Open Finance       │  │ E-mail transacional│
                                   │ (agregador BR)      │  │                    │
                                   └─────────────────┘  └──────────────────┘
```

**Princípio central**: o client (PWA) **nunca** chama um provedor externo diretamente. Toda integração com STT/LLM, OCR, Open Finance ou e-mail passa por uma Edge Function, que segura as chaves de API e aplica validação/RLS antes de gravar no Postgres.

**Estrutura de repositório**: monorepo pnpm workspaces com `apps/web` (PWA), `packages/shared` (lógica de domínio pura compartilhada entre client e Edge Functions) e `supabase/` (migrations + Edge Functions). Detalhes em `CLAUDE.md`.

---

## 2. Modelo de dados relacional

Convenções globais: PK `id uuid default gen_random_uuid()`; toda tabela de domínio tem `user_id uuid references auth.users(id)` com RLS `auth.uid() = user_id`; valores monetários sempre `amount_cents bigint` (nunca float); timestamps `created_at`/`updated_at timestamptz default now()`.

### 2.1 `profiles`
Estende `auth.users` (criada via trigger `on_auth_user_created`).
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid PK | = `auth.users.id` |
| full_name | text | |
| avatar_url | text | |
| base_currency | char(3) | default `'BRL'` |
| pin_hash | text | nullable, hash+salt do PIN local |
| locale | text | |

### 2.2 `accounts` (RF01)
| Coluna | Tipo | Notas |
|---|---|---|
| id, user_id | uuid | |
| name | text | |
| type | enum | `checking\|savings\|wallet\|investment` |
| currency | char(3) | |
| initial_balance_cents | bigint | |
| current_balance_cents | bigint | mantido por trigger, ver §2.13 |
| color, icon | text | |
| is_active | bool | default true |

### 2.3 `credit_cards` (RF09)
| Coluna | Tipo | Notas |
|---|---|---|
| id, user_id | uuid | |
| name, brand | text | |
| limit_cents | bigint | |
| closing_day, due_day | smallint | 1–31 |
| payment_account_id | uuid → accounts | conta usada para pagar a fatura |
| color, icon, is_active | | |

### 2.4 `payment_methods` (RF02)
| Coluna | Tipo | Notas |
|---|---|---|
| id, user_id | uuid | |
| account_id | uuid → accounts | nullable |
| credit_card_id | uuid → credit_cards | nullable |
| type | enum | `pix\|debit_card\|credit_card\|boleto\|cash` |
| name, is_active | | |

`CHECK ((type = 'credit_card' AND credit_card_id IS NOT NULL) OR (type <> 'credit_card' AND account_id IS NOT NULL))`

### 2.5 `categories` (RF03)
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid | |
| user_id | uuid | **nullable** — `NULL` = categoria padrão do sistema |
| parent_category_id | uuid → categories.id | self-referencial (subcategoria) |
| name, icon, color | | |
| kind | enum | `income\|expense` |
| is_system_default | bool | default false |

RLS: SELECT permitido se `user_id = auth.uid() OR user_id IS NULL`; INSERT/UPDATE/DELETE restrito a `user_id = auth.uid() AND is_system_default = false`. Seed inicial (`seed.sql`) pré-carrega categorias padrão (Moradia, Alimentação, Transporte, Lazer, etc.) com `user_id = NULL`.

### 2.6 `recurring_rules` (RF06)
| Coluna | Tipo | Notas |
|---|---|---|
| id, user_id | uuid | |
| account_id, payment_method_id, category_id | uuid | |
| description, amount_cents, kind | | `income\|expense` |
| frequency | enum | `daily\|weekly\|monthly\|yearly` |
| interval | smallint | default 1 |
| start_date | date | |
| end_type | enum | `date\|occurrences\|infinite` |
| end_date | date | nullable |
| occurrences_total | int | nullable |
| occurrences_generated | int | default 0 |
| next_run_date | date | |
| is_active | bool | |

### 2.7 `installment_plans` (RF06 — parcelamento)
| Coluna | Tipo | Notas |
|---|---|---|
| id, user_id | uuid | |
| account_id, payment_method_id, credit_card_id (nullable), category_id | uuid | |
| description, total_amount_cents | | |
| installments_count | smallint | |
| first_due_date | date | |

### 2.8 `transactions` (tabela central)
| Coluna | Tipo | Notas |
|---|---|---|
| id, user_id | uuid | |
| account_id, payment_method_id, category_id | uuid | |
| kind | enum | `income\|expense\|transfer` |
| amount_cents | bigint | |
| description | text | |
| transaction_date | date | |
| status | enum | `pending\|cleared\|reconciled` |
| recurring_rule_id | uuid | nullable FK |
| installment_plan_id | uuid | nullable FK |
| installment_number | smallint | nullable, ex. 3 (de 12) |
| card_invoice_id | uuid | nullable FK, preenchido quando o meio de pagamento é cartão |
| attachment_id | uuid | nullable FK (OCR) |
| source | enum | `manual\|audio\|ocr\|import\|openfinance` |
| import_staging_id | uuid | nullable FK |
| external_ref | text | nullable, id da transação no Open Finance |

`UNIQUE(user_id, external_ref)` — garante idempotência de sincronização Open Finance.

### 2.9 `card_invoices` (RF09 — faturas)
| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid | |
| credit_card_id | uuid → credit_cards | |
| reference_month | date | primeiro dia do mês de referência |
| closing_date, due_date | date | |
| total_amount_cents | bigint | recalculado por trigger |
| status | enum | `open\|closed\|paid\|overdue` |
| paid_at, paid_amount_cents | | |

`UNIQUE(credit_card_id, reference_month)`

### 2.10 `budgets` (RF07)
| Coluna | Tipo | Notas |
|---|---|---|
| id, user_id, category_id | uuid | |
| period_month | date | ou `is_recurring_monthly bool` |
| limit_cents | bigint | |
| alert_thresholds | smallint[] | default `'{80,100}'` |

### 2.11 `goals` (RF07)
| Coluna | Tipo | Notas |
|---|---|---|
| id, user_id | uuid | |
| name | text | |
| target_amount_cents, current_amount_cents | bigint | current default 0 |
| target_date | date | nullable |
| linked_account_id | uuid | nullable — se setado, progresso deriva do saldo da conta |
| icon, color | | |
| status | enum | `active\|completed\|archived` |

### 2.12 Importação, OCR, áudio e Open Finance (RF08, RF05)

**`imports`**: `id, user_id, account_id, file_type (ofx|csv), storage_path, status (pending|processing|completed|failed), total_rows, imported_count, duplicate_count, error_log jsonb`.

**`import_staging_transactions`**: `id, import_id, raw_data jsonb, suggested_category_id, suggested_amount_cents, suggested_date, duplicate_of_transaction_id (nullable), status (new|duplicate|matched|ignored), resolved_transaction_id (nullable)`.

**`attachments`** (OCR): `id, user_id, transaction_id (nullable até confirmação), storage_path, mime_type, ocr_status (pending|processing|completed|failed), ocr_source (qr_nfce|vision_ocr), ocr_raw_text, ocr_extracted jsonb (merchant, amount_cents, date, cnpj)`.

**`audio_intents`** (RF05 — log de intenção, não é a transação final): `id, user_id, transcript text, extracted jsonb (amount_cents, category_id sugerido, payment_method_id sugerido, date, description), confidence numeric, latency_ms int (acompanha RNF <3s), status (pending_confirmation|confirmed|discarded), resulting_transaction_id (nullable)`.

**`openfinance_connections`**: `id, user_id, provider (pluggy|belvo), institution_id, institution_name, external_item_id, status (connected|error|disconnected|pending_mfa), last_sync_at, consent_expires_at, encrypted_credentials_ref` (referência a segredo no Vault, nunca token em texto puro).

**`openfinance_account_links`**: `id, connection_id, external_account_id, account_id → accounts`.

### 2.13 Notificações e segurança (RF11)

**`push_subscriptions`**: `id, user_id, endpoint text, p256dh text, auth text, user_agent`.

**`notifications`**: `id, user_id, type (budget_alert|bill_due|goal_progress|invoice_closed|system), title, body, payload jsonb, channel (push|email|in_app), status (pending|sent|failed|read), scheduled_for, sent_at, read_at`.

**`webauthn_credentials`**: `id, user_id, credential_id text unique, public_key bytea, sign_count bigint, device_label, last_used_at`.

### 2.14 Decisões de modelagem

- **Saldo de conta**: `accounts.current_balance_cents` é mantido por trigger `AFTER INSERT/UPDATE/DELETE ON transactions`, ajustando a conta afetada na mesma transação SQL (consistência forte, sem corrida). Alternativa descartada: view calculada via `SUM` a cada leitura — mais simples, mas cara para dashboard com histórico longo.
- **Recorrência**: `recurring_rules` é um *template*, não gera todas as ocorrências de uma vez. A Edge Function agendada `recurring-generator` roda diariamente (via `pg_cron`) e materializa transações `status='pending'` numa janela deslizante (ex. próximos 60 dias), atualizando `next_run_date`. Evita milhões de linhas para regras "infinitas" e permite editar a regra sem reescrever transações futuras distantes.
- **Parcelamento**: `installment_plans` é o "pai"; ao criar, o sistema já materializa todas as N transações-filhas de uma vez (fim conhecido, baixo volume — raramente >24 parcelas). Cada filha carrega `installment_number`/`installments_count` para exibição ("3/12").
- **Fatura de cartão**: `card_invoices` é criada sob demanda (primeira transação do cartão no período cria a fatura `open`) e fechada pela Edge Function agendada `invoice-closer`, que verifica `closing_day` de cada cartão diariamente. Um trigger em `transactions` recalcula `total_amount_cents` a cada INSERT/UPDATE/DELETE. Transação após o fechamento do mês corrente é automaticamente associada à fatura seguinte — essa regra vive em `packages/shared` e é replicada/testada tanto no client (preview antes de salvar) quanto no banco.
- **Deduplicação de importação**: hash determinístico `(account_id, date, amount_cents, normalized_description)` comparado contra `transactions` existentes; resultado gravado em `import_staging_transactions.duplicate_of_transaction_id` — decisão final **sempre humana**, nunca auto-mesclagem.

---

## 3. Mapeamento RF → módulo técnico

| RF | Módulo técnico |
|---|---|
| RF01 Contas | `features/accounts` + tabela `accounts` + trigger de saldo |
| RF02 Modos de pagamento | `features/payment-methods` + tabela `payment_methods` (constraint condicional com `credit_cards`) |
| RF03 Categorias | `features/categories` + tabela `categories` (self-FK) + `seed.sql` |
| RF04 Dashboard | Views/RPC agregadas (`v_monthly_summary`, `v_category_breakdown`) via TanStack Query; gráficos com Recharts/visx |
| RF05 Áudio | Edge Function `audio-transaction-intake`: recebe áudio/transcript, chama STT (fallback servidor) + LLM de extração com lista de categorias/contas do usuário no prompt; grava em `audio_intents`; client exibe confirmação antes de gravar em `transactions` |
| RF06 Recorrência/Parcelamento | `recurring_rules` + `recurring-generator` (cron); `installment_plans` materializados no insert |
| RF07 Planejamento/Metas | `budgets` + `budget-alert-checker` → `notifications`; `goals` com progresso via `linked_account_id` ou incremento manual |
| RF08a Importação OFX/CSV | Edge Function `import-ofx-csv` (parser + staging) + tela de reconciliação |
| RF08b OCR | Edge Function `ocr-receipt-intake`: prioriza QR code NFC-e (dado estruturado da SEFAZ), fallback OCR genérico + normalização por LLM; grava em `attachments` |
| RF08c Open Finance | `openfinance_connections`/`openfinance_account_links` + Edge Functions `openfinance-webhook` e `openfinance-sync` |
| RF09 Cartões | `credit_cards` + `card_invoices` + `invoice-closer` |
| RF10 Relatórios | Views agregadas + geração client-side (CSV sempre; PDF simples); Edge Function de export para relatórios pesados |
| RF11 Segurança | Supabase Auth (primário) + WebAuthn (desbloqueio local) + RLS em toda tabela + Vault/pgsodium; `push_subscriptions`/`notifications` + `notifications-dispatcher` |

---

## 4. Segurança

- **RLS obrigatório**: toda tabela de usuário tem policy `USING (auth.uid() = user_id)` (SELECT/UPDATE/DELETE) e `WITH CHECK (auth.uid() = user_id)` (INSERT). Tabelas de sistema (`categories` padrão) são somente leitura pública autenticada. Nenhuma tabela pode ficar sem RLS habilitado — validar em CI com query que lista tabelas em `public` sem `rowsecurity = true`.
- **Criptografia em trânsito**: TLS 1.3 gerenciado pelo Supabase (Postgres, REST, Storage) e pelo host do frontend — requer apenas configuração de HSTS e forçar HTTPS.
- **Criptografia em repouso**: disco do Postgres gerenciado pelo Supabase (AES-256 no provedor cloud). Para o requisito adicional do RNF de "dados sensíveis", usar **Supabase Vault** (`pgsodium`) apenas para: (a) segredos de Open Finance (`encrypted_credentials_ref`), (b) tokens de terceiros. Dados financeiros comuns (valores, categorias) **não** precisam de criptografia de coluna adicional — RLS + criptografia de disco já atendem; evitar overengineering aqui.
- **Biometria em PWA**: não existe API nativa de Face ID/Touch ID/Fingerprint em contexto web. A alternativa realista é **WebAuthn** (`navigator.credentials`), que aciona o autenticador de plataforma (Face ID, Touch ID, Windows Hello, fingerprint Android) via navegador.
  - Login primário continua sendo Supabase Auth (e-mail/senha ou magic link) — cria a sessão real (JWT).
  - Após o primeiro login, o usuário pode registrar um autenticador WebAuthn por dispositivo (Edge Functions `webauthn-register`/`webauthn-authenticate`, biblioteca `@simplewebauthn/server`) — usado como **desbloqueio rápido local**, não como segundo fator independente do Supabase.
  - PIN é fallback quando WebAuthn não está disponível: nunca trafega em claro, hash com salt (`pgcrypto`/bcrypt), validado via RPC com contador de tentativas e lockout temporário.
  - **Risco a monitorar**: suporte a WebAuthn/Push varia por navegador/SO — iOS Safari exige PWA instalada ("Adicionar à Tela de Início") para alguns recursos.
- **Gestão de segredos**: `supabase secrets set` para todas as chaves de provedores externos; nunca em `.env` do frontend; rotação trimestral documentada.

---

## 5. Notificações

- **Push**: Web Push API padrão (VAPID) via service worker (`vite-plugin-pwa`). Client assina push (`PushManager.subscribe`) → grava em `push_subscriptions`. Edge Function `notifications-dispatcher` lê `notifications` pendentes com `channel='push'` e envia via biblioteca `web-push` (Deno). Disparo por trigger de banco ou cron.
- **E-mail**: provedor transacional (Resend/Postmark) chamado pela mesma `notifications-dispatcher` para `channel='email'`. O SMTP do Supabase Auth fica reservado só para e-mails de autenticação (confirmação, reset de senha).
- **Risco**: Web Push em iOS só funciona com a PWA instalada (iOS 16.4+); usuários que só acessam via aba do navegador não recebem push. Mitigação: fallback para e-mail + notificação in-app sempre disponível.

---

## 6. Relatórios e exportação (RF10)

- **CSV**: sempre client-side (dados já carregados via TanStack Query) — sem custo de Edge Function.
- **PDF simples** (extrato do mês, resumo por categoria): client-side com `@react-pdf/renderer`, mantendo consistência visual com a UI.
- **Relatórios pesados** (evolução patrimonial multi-ano, múltiplas contas, milhares de transações): Edge Function dedicada, agregação via view/RPC no Postgres (evita transferir dado bruto ao client), retorno em PDF/CSV via link assinado temporário no Storage.

---

## 7. Fases sugeridas de implementação

1. **Fase 1 — Núcleo financeiro**: Auth + WebAuthn básico; `accounts`, `payment_methods`, `categories` (+ seed); `transactions` CRUD manual; dashboard com views agregadas simples; RLS baseline em todas as tabelas.
2. **Fase 2 — Cartões, recorrência e planejamento**: `credit_cards`, `card_invoices` + `invoice-closer`; `recurring_rules` + `recurring-generator`; `installment_plans`; `budgets` + `budget-alert-checker`; `goals`.
3. **Fase 3 — Relatórios**: evolução patrimonial, comparativo mensal, exportação PDF/CSV client-side.
4. **Fase 4 — Automação avançada**: `audio-transaction-intake` (RF05), `ocr-receipt-intake` (RF08 OCR), `import-ofx-csv` (RF08 importação) com tela de reconciliação.
5. **Fase 5 — Open Finance e notificações completas**: integração com agregador, push web completo, e-mail transacional, PWA offline/instalável polido.

---

## 8. Riscos técnicos e decisões em aberto

- **Provedor de Open Finance (Brasil)**: Pluggy (foco BR, certificado no Open Finance) vs Belvo (mais LatAm). Recomendação preliminar: Pluggy — validar com PoC de custo por conexão/sincronização e SLA antes de comprometer a arquitetura final.
- **STT/NLP de áudio (RNF <3s)**: Web Speech API no client (grátis, rápido, suporte inconsistente no Safari/iOS em PWA) vs STT server-side (ex. Whisper via provedor de baixa latência) + LLM leve para extração de entidades. Testar latência ponta a ponta real antes de fechar; abordagem híbrida (client quando suportado, fallback servidor) é candidata.
- **OCR de recibos/notas**: priorizar leitura do QR code da NFC-e (dado estruturado oficial da SEFAZ, mais confiável) quando presente; fallback para OCR genérico + normalização via LLM quando não há QR code.
- **Custo de Edge Functions em escala**: cada chamada de áudio/OCR envolve upload de mídia + chamada a provedor pago — monitorar custo por usuário ativo; considerar rate limit por usuário/dia.
- **Multi-moeda**: RF01 pede moeda por conta, mas o dashboard consolidado (RF04) pressupõe soma única. Decisão em aberto: V1 sem conversão de câmbio automática (contas em moeda estrangeira exibidas separadamente, sem consolidar) é a opção recomendada para simplificar a Fase 1.
- **Limitações de iOS**: Web Push e WebAuthn em PWA não instalada têm suporte parcial no Safari — UX deve incentivar "adicionar à tela de início".
