# 🌾 Paiol Tech

> **Tudo que você deve, na palma da mão.**

SaaS de gestão de dívidas rurais para produtores brasileiros.
Login sem senha · Alertas no WhatsApp · Open Finance · Offline-first

**Deploy em produção:**
- App Web (usuários): [paiol-tech.vercel.app](https://paiol-tech.vercel.app)
- Painel Admin: [admin-psi-five-89.vercel.app](https://admin-psi-five-89.vercel.app) — usuário: `admin` · senha: `admin1234`

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 15 + React 19 + TypeScript + Tailwind + shadcn/ui + PWA |
| Backend | NestJS + TypeScript + Clean Architecture + CQRS |
| Banco | PostgreSQL 16 (Supabase) + Prisma ORM + RLS |
| Cache | Redis via Upstash |
| Filas | RabbitMQ via CloudAMQP |
| Monorepo | Turborepo + pnpm workspaces |

---

## Setup local

### Pré-requisitos
- Node.js >= 20
- pnpm >= 11
- PostgreSQL 16 (ou conta Supabase)
- Redis (opcional em dev — usado para OTP sessions)

### 1. Instalar dependências

```bash
git clone https://github.com/SEU_USUARIO/paiol-tech.git
cd paiol-tech
pnpm install
```

### 2. Configurar variáveis de ambiente

```bash
# Copiar template e preencher as variáveis
cp .env.example .env
```

Abra `.env` e preencha pelo menos:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — string aleatória segura (mínimo 32 caracteres)
- `NEXT_PUBLIC_API_URL=http://localhost:3001/api`

Em desenvolvimento, WhatsApp, Open Finance e Pagamentos usam **mocks automáticos** — não precisam de chaves reais.

### 3. Banco de dados

```bash
cd apps/api

# Criar banco e rodar migrations
npx prisma migrate deploy

# Gerar Prisma Client
npx prisma generate
```

### 4. Rodar em desenvolvimento

```bash
# Na raiz — sobe API (:3001), Web (:3000) e Admin (:3002) em paralelo
pnpm dev
```

| App | URL | Descrição |
|-----|-----|-----------|
| Web (PWA) | http://localhost:3000 | App dos produtores |
| API | http://localhost:3001/api | Backend NestJS |
| Admin | http://localhost:3002 | Painel administrativo |

### 5. Acesso ao Admin

- URL: http://localhost:3002
- Usuário: `admin` (ou `ADMIN_USERNAME` do .env)
- Senha: `paiol@admin2025` (ou `ADMIN_PASSWORD` do .env)

### Comandos úteis

```bash
pnpm lint          # ESLint em todos os packages
pnpm typecheck     # TypeScript em todos os packages (0 erros)
pnpm test          # Jest — 76 testes, 100% passing
pnpm build         # Build de produção (Turbo)
```

### Testes E2E (Playwright)

```bash
cd apps/web

# Instalar browsers
pnpm exec playwright install chromium

# Rodar E2E (requer API e Web rodando)
pnpm exec playwright test
```

### Load test (k6)

```bash
# Instalar k6: https://k6.io/docs/get-started/installation/
cd apps/api
k6 run tests/load/debts-load.js -e BASE_URL=http://localhost:3001/api -e JWT_TOKEN=<token>
```

---

## Arquitetura

```
paiol-tech/
├── apps/
│   ├── web/        Next.js 15 (PWA) — :3000
│   ├── api/        NestJS — :3001
│   └── admin/      Painel cooperativa (Refine)
├── packages/
│   ├── ui/         Componentes shadcn/ui compartilhados
│   ├── types/      TypeScript interfaces
│   ├── validators/ Zod schemas
│   └── utils/      Funções utilitárias
```

### Clean Architecture (backend)

```
api/src/
├── domain/         Entidades e interfaces (sem dependências externas)
├── application/    CQRS handlers + services
├── infrastructure/ Prisma, Redis, WhatsApp, Open Finance
└── presentation/   Controllers, Guards, Decorators
```

---

## Conventional Commits

```
feat(auth): add WhatsApp OTP login
fix(debts): prevent duplicate detection false positive
test(domain): add Debt entity unit tests
chore(deps): update prisma to 6.x
```

**Scopes válidos:** `auth`, `debts`, `alerts`, `open-finance`, `voice`, `ocr`, `dashboard`, `cooperative`, `billing`, `lgpd`, `pwa`, `infra`, `ui`, `types`, `validators`, `utils`, `ci`, `deps`

---

## Roadmap

- [x] ETAPA 0 — Infraestrutura base (monorepo, tooling)
- [x] ETAPA 1 — Autenticação OTP WhatsApp
- [x] ETAPA 2 — CRUD de dívidas
- [x] ETAPA 3 — Dashboard + alertas WhatsApp
- [x] ETAPA 4 — Entrada por voz + OCR de boleto
- [x] ETAPA 5 — Open Finance (TecnoSpeed)
- [x] ETAPA 6 — PWA offline (Workbox + Dexie.js)
- [x] ETAPA 7 — Painel administrativo (Admin panel)
- [x] ETAPA 8 — LGPD compliance (exportar dados + deletar conta)
- [x] ETAPA 9 — Pagamentos PIX (Pagar.me)
- [x] ETAPA 10 — E2E Playwright + k6 load test + Lighthouse CI

---

## Fundador

**Fabrício** — [linkedin.com/in/fabricio](https://linkedin.com)
Stack diária: Lecom BPM + JavaScript + Java + MySQL

---

*© 2025 Paiol Tech. Todos os direitos reservados.*
