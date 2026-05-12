# PRD — AMPERE.OS / Ampere Neural Twin

Documento-fonte da verdade para implementação assistida por LLM (Cursor). Alinhar código, migrações Supabase e integrações a este arquivo.

## 0. Contexto: hackathon e GitHub

**Objetivo:** entregar demo jurável em tempo limitado sem perder rastreabilidade.

- **Fonte da verdade:** repositório no **GitHub** (código + `PRD.md` + migrações versionadas). Evitar “estado só na máquina”; commits pequenos e mensagens claras ajudam o time e os mentores.
- **Branch principal:** `main` = demo estável + deploy; opcional `dev` para integração rápida durante o evento.
- **Segredos:** nunca commitar `.env` / `.env.local`. No GitHub: *Settings → Secrets* apenas para CI que precise (evitar `VITE_*` nos secrets de Actions se o build for só verificação; **Netlify** ou **GitHub Pages** recebem envs de produção no painel do host).
- **Deploy:** conectar o repo ao **Netlify** (ou Vercel) via “Import from Git”; variáveis `VITE_SUPABASE_*` e RPC só no painel do provedor. O `netlify.toml` já descreve build/publish.
- **Pitch / README:** no repositório, um README curto com link da **demo em produção**, stack e como rodar localmente — juízes costumam abrir o GitHub primeiro.
- **Escopo:** priorizar fluxo feliz + vídeo ou README de arquitetura; políticas RLS podem começar restritivas e evoluir após o pitch.

## 0.1 Inventário: o que instalar vs o que é “só conta/API”

Use o script local `scripts\check-toolchain.cmd` no **Prompt de Comando** (`cmd.exe`). Ele muda sozinho para a pasta `ampere-web` antes de testar `npm`, para evitar o erro de módulos em `System32`. Não use parênteses no título do script; caracteres como `(Windows)` dentro de `echo` quebram ficheiros `.cmd`.

| Prioridade | Ferramenta | Para quê | Onde obter |
|------------|------------|-----------|------------|
| **Mínimo (dashboard web)** | Node.js LTS | `npm` / `vite` / build | https://nodejs.org |
| **Mínimo** | Git | versionamento, GitHub | https://git-scm.com |
| **Recomendado** | pnpm | igual ao `packageManager` do projeto | após Node: `npm.cmd install -g pnpm` (use **CMD** se o PowerShell bloquear scripts) |
| **Opcional web** | Supabase CLI | migrações locais, `db push` | https://supabase.com/docs/guides/cli |
| **Chain (Solana)** | Solana CLI | deploy, chaves, devnet | https://docs.solana.com/cli/install-solana-cli-tools |
| **Chain** | Rust + Cargo | compilar Anchor | https://rustup.rs |
| **Chain** | Anchor | programa `ampere_network` | https://www.anchor-lang.com/docs/installation |
| **Legado / worker** | Docker Desktop | compose app+worker+Redis | https://www.docker.com/products/docker-desktop |

**Serviços (conta + chaves no painel, não “download” de CLI):**

- **Supabase:** projeto → URL + `anon` key (e `service_role` só no servidor/Edge, nunca no Vite).
- **RPC Solana:** devnet público ou provedor (Helius, Triton, etc.) se precisares de quota melhor.
- **GitHub:** repositório; Actions já podem validar `pnpm build`.
- **Netlify (ou similar):** site importado do repo; variáveis `VITE_*` configuradas no host.

**Ordem sugerida para hackathon:** Node → Git → pnpm → `pnpm install` no `ampere-web`. Só depois Solana/Anchor se a demo exigir transação real on-chain.

## 1. Visão e proposta de valor

**Produto:** plataforma para **gêmeos digitais** com **Tríade de Validação**: filtro por IA (edge) + registro/imutabilidade na **Solana** + **consenso de guardiões** sobre o hash do dado.

**Tese:** dados do mundo físico são ruidosos; a cadeia exige integridade. A IA reduz custo de armazenamento on-chain ao barrar scores baixos; guardiões confirmam o hash antes do estado `is_confirmed`.

**Diferenciais (pitch):**

1. **Neural filtering:** só prossegue para chain se `ai_score >= limiar` (referência de contrato: 0.7 no protótipo Anchor).
2. **Consenso descentralizado:** votos de guardiões até `guardian_threshold`.
3. **RWA / auditoria:** leitura pública de estado confirmado na rede.

## 2. Stack alvo (fase web)

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 18, Vite, TypeScript |
| UI | Tailwind CSS, componentes compatíveis com Shadcn (Radix + CVA) |
| Backend de app | Supabase (Postgres + Auth + RLS) |
| Chain | Solana, programa Anchor `ampere_network` (repositório separado ou monorepo legado) |
| Pacotes | PNPM |
| Deploy web | Netlify (build `pnpm build`, `publish: dist`) |

**Nota:** prototipagem visual pode ser feita no Lovable; **lógica sensível**, RLS e integrações ficam no Cursor com este PRD.

## 3. Personas e fluxos

### 3.1 Personas

- **Operador:** ingere leituras de dispositivo / twin, vê dashboard.
- **Guardião:** assina validações on-chain (wallet); pode ter papel espelhado em `guardian` no Supabase para UX.
- **Admin:** configura `guardian_threshold`, programa ID, políticas.

### 3.2 Fluxo feliz (off-chain + on-chain)

1. Dispositivo ou serviço calcula hash do payload e **score de IA**.
2. Se score OK, cliente ou edge chama **registro do twin** (Solana `register_twin` + persistência espelho no Supabase).
3. Guardiões votam (`validate_twin`) até confirmar.
4. UI lê estado: pendente → confirmado; exibe hash truncado e métricas.

### 3.3 Autenticação (Supabase)

- **Auth:** email/OAuth conforme projeto Supabase; sessão JWT no client.
- **Perfis:** tabela `profiles` ligada a `auth.users`.
- **Papéis:** coluna `role` (`operator` | `guardian` | `admin`) para UI e RLS; **autorização on-chain continua sendo a wallet Solana**.

## 4. Modelo de dados (Supabase)

Convenção: `timestamptz`, `uuid`, nomes em `snake_case`. Todas as tabelas com RLS **habilitado**.

**Migração versionada no repositório:** `supabase/migrations/20260110120000_ampere_initial.sql` (SQL Editor no dashboard ou CLI `supabase db push`).

### 4.1 `profiles`

| Coluna | Tipo | Notas |
|--------|------|--------|
| id | uuid PK | FK → `auth.users.id` |
| display_name | text | opcional |
| role | text | `operator`, `guardian`, `admin` |
| wallet_public_key | text | opcional; base58 Solana |
| created_at | timestamptz | default now() |

### 4.2 `twins` (espelho off-chain)

| Coluna | Tipo | Notas |
|--------|------|--------|
| id | uuid PK | default gen_random_uuid() |
| twin_id | text UNIQUE | ex.: `TWIN-{timestamp}`; alinhado ao ID on-chain |
| content_hash | bytea ou text | 32 bytes ou hex; espelho do `hash` on-chain |
| ai_score | double precision | 0..1 |
| votes | int | espelho; fonte da verdade final na chain |
| is_confirmed | boolean | default false |
| solana_twin_pda | text | opcional; endereço PDA |
| owner_id | uuid | FK → `profiles.id` (quem registrou no app) |
| created_at / updated_at | timestamptz | |

**Regras:** atualização de `votes` / `is_confirmed` pode ser feita por triggers Edge Functions ou jobs após confirmação RPC; MVP pode permitir `service_role` apenas server-side.

### 4.3 `validation_events` (auditoria)

| Coluna | Tipo | Notas |
|--------|------|--------|
| id | bigserial PK | |
| twin_uuid | uuid FK | → `twins.id` |
| event_type | text | `registered`, `vote`, `confirmed`, `rejected` |
| payload | jsonb | opcional; sem segredos |
| created_at | timestamptz | |

### 4.4 Políticas RLS (esboço)

- **`profiles`:** usuário lê/atualiza apenas a própria linha (`auth.uid() = id`). Admin: política extra com claim ou tabela `admin_emails` (definir na implementação).
- **`twins`:** leitura para usuários autenticados do mesmo “tenant” ou público somente leitura para IDs confirmados (ajustar conforme compliance). Escrita: `owner_id = auth.uid()` em insert; update restrito a service role ou função `security definer`.
- **`validation_events`:** insert apenas via service role ou Edge Function; select para dono do twin ou guardião associado.

**Importante:** chaves `service_role` **nunca** no Vite bundle; apenas `anon` + RLS no client.

## 5. Variáveis de ambiente

Ver `.env.example` na raiz do app web:

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `VITE_SOLANA_RPC_URL`, `VITE_AMPERE_PROGRAM_ID`

Secrets de KMS, Redis, RPC pagos e `service_role` Supabase ficam em **Netlify / servidor / Edge**, não em `VITE_*`.

## 6. Contrato Solana (referência funcional)

Instruções esperadas (alinhado ao manifesto AMPERE):

- `initialize(threshold)` — estado global com `guardian_threshold`, `authority`.
- `register_twin(twin_id, hash, ai_score)` — exige `ai_score >= 0.7` (ajustável).
- `validate_twin` — incrementa votos; se `votes >= guardian_threshold`, `is_confirmed = true`.

Program ID de exemplo no material legado: `4Y8Nq7oJxVKzKuUXPHsH5ys69XkNp3xJLtVyL9wKTeDe` (substituir pelo ID real após deploy).

## 7. MCP e orquestração

- Servidores MCP podem expor **documentação** (Solana, Supabase) e **ferramentas de DB** (migrações, SQL) para reduzir passos manuais no dashboard.
- Qualquer migração aplicada via MCP deve ser **replicada** em arquivos versionados (`supabase/migrations`) para CI e revisão.

## 8. Git e CI/CD (GitHub)

- **Branches:** `main` (demo + produção), `dev` (opcional, integração no hackathon), `plan` ou feature branches para experimentos.
- **GitHub → Netlify:** repositório conectado ao site; cada merge/push em `main` dispara build. Conferir em *Site settings → Environment variables* as mesmas chaves de `.env.example` (prefixo `VITE_`).
- **GitHub Actions:** workflow de CI roda `pnpm install` e `pnpm build` em PR/push para quebrar cedo se TypeScript/build falhar (sem necessidade de publicar artefato). Após o primeiro `pnpm install` local, **commitar `pnpm-lock.yaml`** no repositório para builds reproduzíveis; opcionalmente trocar o CI para `pnpm install --frozen-lockfile`.
- **Checks:** time pode exigir CI verde antes de merge em `main` (*branch protection* opcional, se o repo permitir).

## 9. Critérios de aceite (MVP web)

1. App sobe com `pnpm install && pnpm dev` e exibe dashboard AMPERE.OS responsivo.
2. `PRD.md` e `.env.example` refletem schema e envs; sem credenciais no repositório.
3. Cliente Supabase opcional: se envs ausentes, app não quebra (dashboard estático).
4. Build de produção `pnpm build` gera `dist` servível com SPA fallback (Netlify).

## 10. Fora do escopo imediato

- Assinatura KMS-AWS no browser.
- Exército de bots em produção sem custódia clara de chaves.
- Substituição completa do programa Anchor sem revisão de segurança.

---

**Última orientação para a LLM:** antes de alterar requisitos ou schema, atualizar este `PRD.md` primeiro; o código deve seguir o PRD, não o contrário.
