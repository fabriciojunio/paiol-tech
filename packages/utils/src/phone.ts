export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) return `+${digits}`;
  if (digits.length === 11) return `+55${digits}`;
  if (digits.length === 10) return `+55${digits}`;
  throw new Error(`Número de telefone inválido: ${raw}`);
}

export function isValidBrazilianPhone(phone: string): boolean {
  return /^\+55[1-9]{2}[9]?[0-9]{8}$/.test(phone);
}
