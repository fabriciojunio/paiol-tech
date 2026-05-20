# Política de Segurança

## Versões Suportadas

| Versão | Suporte |
|--------|---------|
| 0.x    | ✅ Ativo |

## Reportando Vulnerabilidades

Envie um e-mail para **junioad555@gmail.com** com o assunto **[SECURITY] Paiol Tech**.

Resposta em até **72 horas**.

## Práticas de Segurança Adotadas

- **OTP sem senha**: eliminamos vetores de ataque de senha
- **JWT de curta duração**: 15 minutos com refresh token rotativo
- **Rate limiting**: proteção contra força bruta nos endpoints de OTP
- **Dados sensíveis**: CPF e valores financeiros encriptados no banco
- **Variáveis de ambiente**: segredos nunca commitados
- **HTTPS forçado**: redirecionamento automático em produção
