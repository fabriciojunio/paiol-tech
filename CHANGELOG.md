# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Não Lançado]

### Adicionado
- Suporte a múltiplas culturas (soja, milho, cana, café)
- Relatórios exportáveis em PDF e Excel
- Notificações push para vencimento de parcelas

## [0.1.0] - 2026-05-18

### Adicionado
- Monorepo Turborepo com pnpm workspaces
- Frontend Next.js 15 com App Router e PWA offline-first
- Backend NestJS com Clean Architecture e padrão CQRS
- Autenticação OTP via SMS (sem senha)
- Dashboard com visão geral de dívidas e parcelas
- Packages compartilhados: `@paiol/ui`, `@paiol/types`, `@paiol/utils`, `@paiol/validators`
- Schema PostgreSQL com Prisma ORM
- Configuração Docker Compose para ambiente local
- Pipeline CI/CD com GitHub Actions
