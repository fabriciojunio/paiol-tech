# Open Finance no Paiol Tech

Como o Paiol busca as dívidas do produtor direto nos bancos, o que é grátis, o que depende de fornecedor pago e como trocar de provedor sem mexer no domínio.

## A ideia em uma frase

O domínio da API conhece uma única porta (`IOpenFinanceService`); Mock, Pluggy, TecnoSpeed ou qualquer outro agregador são adapters intercambiáveis escolhidos por variável de ambiente.

```
domain/services/open-finance.service.interface.ts   <- porta (contrato)
infrastructure/open-finance/
  open-finance-mock.adapter.ts                      <- grátis, padrão
  pluggy.adapter.ts                                 <- real, desligado por padrão
  tecnospeed.adapter.ts                             <- real, legado
  open-finance-provider.factory.ts                  <- escolhe pelo env
```

## O contrato (porta)

Todo provedor implementa:

| Método | O que faz |
| --- | --- |
| `getAvailableBanks()` | Lista os bancos que o produtor pode conectar |
| `createConsent(request)` | Abre o consentimento; devolve `AUTHORIZED` (mock) ou `PENDING_AUTHORIZATION` + `authorizationUrl` (real) |
| `fetchDebts(cpfCnpj, bankCode, consentId)` | Busca os empréstimos e devolve já normalizados como dívida rural (`BankDebt`), incluindo a linha de crédito detectada (Pronaf, Pronamp, custeio...) |

A normalização para o vocabulário do campo acontece dentro do adapter, usando `detectCreditLine` de `@paiol/utils`. O resto do sistema nunca vê o formato do fornecedor.

## Escolha do provedor

```bash
# .env
OPEN_FINANCE_PROVIDER="mock"        # padrão: grátis, sem rede, sem contrato
OPEN_FINANCE_PROVIDER="pluggy"      # exige PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET
OPEN_FINANCE_PROVIDER="tecnospeed"  # exige TECNOSPEED_API_KEY
```

Regras da fábrica (`open-finance-provider.factory.ts`):

- Sem configuração nenhuma, roda o mock. Em produção também, enquanto nenhum agregador for contratado (modo lançamento, tudo grátis).
- Provedor real selecionado sem credencial derruba o boot de propósito: melhor falhar cedo do que subir achando que sincroniza banco de verdade.
- Compatibilidade: produção com `TECNOSPEED_API_KEY` e sem seleção explícita continua na TecnoSpeed, como antes.

## Fluxo de conexão

1. `POST /open-finance/connect { bankCode }` valida o banco, exige CPF/CNPJ cadastrado e chama `createConsent`.
2. Mock: consentimento sai `AUTHORIZED` na hora e a conexão nasce `ACTIVE`.
3. Provedor real: a conexão nasce `PENDING_AUTHORIZATION` e a resposta traz `authorizationUrl`; o app mostra o botão "Autorizar no banco".
4. `POST /open-finance/sync/:connectionId` valida que a conexão existe, pertence ao produtor e está ativa, busca as dívidas e importa as novas (dedup por número de contrato).
5. `DELETE /open-finance/connections/:id` revoga o consentimento (direito LGPD). As dívidas já importadas ficam.

Segurança: posse da conexão validada em todo comando (deny by default), CPF/CNPJ nunca aparece em log, corpos de resposta do fornecedor nunca são logados, auditoria em sync e revogação.

## Pluggy: o que já funciona e o que falta

O adapter (`pluggy.adapter.ts`) cobre autenticação com cache de apiKey, listagem de conectores BR, criação de connect token com URL do widget e busca/normalização de `GET /loans`. Testado com fixtures baseadas na documentação pública (docs.pluggy.ai); não foi validado contra a API real porque isso exige conta e contrato.

Para ligar de verdade:

1. Criar conta em dashboard.pluggy.ai e obter `clientId`/`clientSecret` (sandbox é grátis; produção é paga por conexão).
2. Preencher `PLUGGY_CLIENT_ID`, `PLUGGY_CLIENT_SECRET` e `OPEN_FINANCE_PROVIDER=pluggy`.
3. Pendência conhecida: o widget do Pluggy Connect devolve o `itemId` num callback do frontend; falta um endpoint `POST /open-finance/callback` que troque o consentimento pendente pelo `itemId` definitivo e marque a conexão como `ACTIVE`. Hoje o `consentId` guardado é o connect token. Esse endpoint só faz sentido quando houver conta real para testar o widget.
4. Recomendado: webhook do Pluggy para saber quando o item termina de sincronizar.

## Como plugar Belvo, Klavi ou outro

1. Criar `infrastructure/open-finance/belvo.adapter.ts` implementando `IOpenFinanceService` (três métodos + `providerName`).
2. Normalizar a resposta do fornecedor para `BankDebt` dentro do adapter, usando `detectCreditLine` para a linha de crédito.
3. Registrar um `case 'belvo'` na fábrica, exigindo as credenciais no boot.
4. Documentar as variáveis no `.env.example`.

O domínio, os handlers e o frontend não mudam.

## Grátis vs pago

| | Hoje (lançamento) | Futuro |
| --- | --- | --- |
| Cadastro manual, voz, foto de boleto | Grátis | Grátis para sempre |
| Dashboard, alertas WhatsApp, calendário de safra | Grátis | Grátis para sempre |
| Pix copia e cola | Grátis | Grátis para sempre |
| Sincronização automática via Open Finance | Grátis (mock/sandbox) | Premium (custo real por conexão no agregador) |
| Iniciação de pagamento via Open Finance (ITP) | Não existe | Premium; exige instituição iniciadora regulada pelo BCB ou parceiro ITP. Só a interface está pronta (`PIX_INITIATION` no catálogo de features) |

O gating é por recurso (`PlanService` + `@RequiresFeature`), desligado por padrão (`FREEMIUM_ENFORCEMENT=off`). Ligar a cobrança no futuro é trocar uma variável de ambiente, sem deploy.

## Por que não FAPI/mTLS aqui?

O Paiol se conecta a agregadores licenciados (Pluggy, Belvo...), que por sua vez participam do Open Finance Brasil e cuidam de FAPI, certificados ICP e consentimento junto aos bancos. Participação direta exigiria autorização do BCB e infraestrutura de instituição regulada; não faz sentido no estágio atual e está registrado como caminho de longo prazo no roadmap.
