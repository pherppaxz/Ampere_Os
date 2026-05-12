# AMPERE.OS — Ampere Neural Twin (web)

Dashboard **React + Vite + TypeScript + Tailwind** com espelho **Supabase** para a tríade IA + Solana + guardiões. Requisitos completos: [`PRD.md`](./PRD.md).

## Hackathon — início rápido

1. **Ferramentas:** correr `scripts\check-toolchain.cmd` no **cmd.exe** (ver PRD §0.1).
2. **Dependências:** na raiz do projeto, `pnpm install` ou `npm install`.
3. **Ambiente:** copiar `.env.example` para `.env.local` e preencher `VITE_SUPABASE_*` (e RPC Solana quando for usar chain).
4. **Base de dados:** no [Supabase](https://supabase.com) → SQL Editor → executar o ficheiro `supabase/migrations/20260110120000_ampere_initial.sql` (ou `supabase db push` com CLI).
5. **Dev:** `pnpm dev` ou `npm run dev`.
6. **Deploy:** Netlify a importar este repo; variáveis `VITE_*` no painel do site (não commitar secrets).

## Checklist Supabase (primeira vez)

1. **Criar projeto** em [supabase.com](https://supabase.com) → *New project* → anotar a região e a password da base (podes precisar mais tarde).
2. **SQL Editor** (menu lateral) → *New query* → abrir no teu PC o ficheiro `supabase/migrations/20260110120000_ampere_initial.sql`, copiar **todo** o conteúdo, colar no editor → **Run**. Deve aparecer “Success”. Se der erro em `execute function`, troca por `execute procedure` nas duas linhas do ficheiro (triggers) e volta a correr só a parte que falhou, ou pergunta no chat com a mensagem de erro.
3. **Chaves da API:** *Project Settings* (ícone de roda dentada) → *API* → copiar **Project URL** e **anon public** key.
4. **`.env.local`** na raiz de `ampere-web` (junto de `package.json`):

   ```env
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

   Guarda o ficheiro; reinicia `npm run dev` se já estiver a correr.
5. **Auth (para ver dados reais):** *Authentication* → *Providers* → confirma que **Email** está ativo. Cria um utilizador de teste (*Authentication* → *Users* → *Add user* ou registo pela app quando tiveres ecrã de login). O trigger cria a linha em `profiles` automaticamente.
6. **Dados de teste (opcional):** *Table Editor* → `twins` → *Insert row* — `owner_id` tem de ser o UUID do teu user (em *Authentication* → *Users* → copiar *User UID*). Preenche `twin_id`, `content_hash` (ex.: hex a 64 chars), `ai_score` entre 0 e 1. Recarrega o dashboard: deve aparecer **DADOS SUPABASE**.

Sem utilizador autenticado na app, o client ainda usa **anon key** e as políticas RLS podem devolver vazio ou erro — o ecrã mostra aviso e mantém a demo.

### Avisos do Vite 8 (Rolldown / `jsx` / `esbuild` deprecated)

O projeto usa **Vite 5.4.11** com `@vitejs/plugin-react`. Se ainda vires esses avisos, o teu `node_modules` pode ter ficado com Vite 8. Na pasta `ampere-web`:

```cmd
rmdir /s /q node_modules
npm install
npm run dev
```

Isto regera também o `package-lock.json` (foi removido do repo para não fixar Vite 8). Faz **commit** do novo lock depois de `npm install`.

## Scripts

| Comando | Descrição |
|--------|-----------|
| `pnpm dev` / `npm run dev` | Servidor de desenvolvimento |
| `pnpm build` / `npm run build` | Build de produção em `dist/` |
| `scripts\check-toolchain.cmd` | Verifica Node, Git, pnpm, Docker, Solana, etc. |

## Estrutura

- `src/` — aplicação Vite
- `supabase/migrations/` — schema Postgres + RLS
- `.github/workflows/ci.yml` — CI `pnpm install` + `pnpm build` (ajustar se usares só npm)

## Licença

Definir pela equipa do hackathon.
"# ampere-os" 
