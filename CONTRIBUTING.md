# Guia de Contribuição — Paiol Tech

## Pré-requisitos

- Node.js >= 20
- pnpm >= 8
- Docker e Docker Compose

## Setup do Ambiente

```bash
# Clonar o repositório
git clone https://github.com/fabriciojunio/paiol-tech.git
cd paiol-tech

# Instalar dependências
pnpm install

# Copiar variáveis de ambiente
cp .env.example .env

# Subir infraestrutura local
docker compose up -d

# Rodar migrations
pnpm --filter @paiol/api prisma migrate dev

# Iniciar em modo desenvolvimento
pnpm dev
```

## Estrutura do Monorepo

```
apps/
  web/     — Next.js 15 (frontend PWA)
  api/     — NestJS (backend REST/GraphQL)
packages/
  ui/      — Componentes React compartilhados
  types/   — Tipos TypeScript compartilhados
  utils/   — Funções utilitárias
  validators/ — Schemas Zod de validação
```

## Padrão de Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/pt-br/):

```
feat(web): adicionar filtro por cultura no dashboard
fix(api): corrigir calculo de juros compostos
docs: atualizar README com instrucoes de deploy
test(api): adicionar testes para DebtService
```

## Pull Requests

1. Fork → branch `feat/nome-da-feature`
2. `pnpm test` deve passar
3. `pnpm typecheck` sem erros
4. Abra o PR com o template disponível
