# Arquitetura — Paiol Tech

## Visão Geral

Sistema SaaS multi-tenant de gestão de dívidas rurais, construído como monorepo com Turborepo.

```
┌─────────────────────────────────────────────────────────────┐
│                    Usuário (Produtor Rural)                   │
│                     Browser / PWA Offline                    │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────┐
│               Next.js 15 (apps/web) — Vercel                │
│                                                             │
│  App Router │ Server Components │ PWA (Workbox)             │
│  OTP Auth   │ Dashboard         │ Formulários Offline       │
└────────────────────────────┬────────────────────────────────┘
                             │ REST / JWT
                             ▼
┌─────────────────────────────────────────────────────────────┐
│               NestJS (apps/api) — Railway/Fly.io            │
│                                                             │
│  Presentation ──► Application (Use Cases) ──► Domain        │
│                          │                                  │
│                   Infrastructure                            │
│          Prisma ORM │ BullMQ │ Redis │ Nodemailer           │
└──────────┬──────────────────────────────────────────────────┘
           │
     ┌─────▼──────┐
     │ PostgreSQL  │
     │ (Supabase) │
     └────────────┘
```

## Camadas (Clean Architecture)

### Domain
- **Entities**: `Debt`, `Producer`, `Alert`, `Installment` — regras de negócio puras
- **Repository Interfaces**: contratos para inversão de dependência
- **Services Interfaces**: `IPaymentService`, `IWhatsAppService`, `IOpenFinanceService`

### Application
- **Use Cases**: `RegisterPayment`, `ListOverdue`, `CreateDebt`, `SendAlert`
- Orquestra entidades e repositórios sem acoplar à infraestrutura

### Infrastructure
- **Prisma repositories**: implementações concretas dos repositórios
- **BullMQ**: filas para notificações assíncronas
- **Migrations**: SQL versionado

### Presentation
- **Controllers REST**: validação com class-validator, guards JWT
- **DTOs**: transformação de dados entre camadas

## Packages Compartilhados

| Package | Responsabilidade |
|---|---|
| `@paiol/types` | Tipos TypeScript compartilhados |
| `@paiol/ui` | Componentes React (Radix + Tailwind) |
| `@paiol/validators` | Schemas Zod (reutilizados front e back) |
| `@paiol/utils` | Funções puras (formatação, cálculo) |
