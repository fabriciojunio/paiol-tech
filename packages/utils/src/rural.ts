import type { RuralCreditLine } from '@paiol/types';

/**
 * Rótulos em linguagem do campo para cada linha de crédito rural.
 */
export const CREDIT_LINE_LABELS: Record<RuralCreditLine, string> = {
  PRONAF: 'Pronaf',
  PRONAMP: 'Pronamp',
  CUSTEIO: 'Custeio',
  INVESTIMENTO: 'Investimento',
  COMERCIALIZACAO: 'Comercialização',
  CPR: 'CPR',
  OUTRA: 'Outra',
};

export const CREDIT_LINE_OPTIONS: { value: RuralCreditLine; label: string }[] = (
  Object.entries(CREDIT_LINE_LABELS) as [RuralCreditLine, string][]
).map(([value, label]) => ({ value, label }));

const CREDIT_LINE_PATTERNS: [RegExp, RuralCreditLine][] = [
  [/pronaf/i, 'PRONAF'],
  [/pronamp/i, 'PRONAMP'],
  [/\bcpr\b|c[eé]dula\s+de\s+produto/i, 'CPR'],
  [/custeio/i, 'CUSTEIO'],
  [/investimento|moderfrota|inovagro|moderagro|pca\b/i, 'INVESTIMENTO'],
  [/comercializa[çc][ãa]o|fgpp/i, 'COMERCIALIZACAO'],
];

/**
 * Tenta reconhecer a linha de crédito rural a partir de um texto livre
 * (descrição do contrato no banco, nome do produto, anotação do produtor).
 * Retorna undefined quando não dá para afirmar nada — melhor não chutar.
 */
export function detectCreditLine(text?: string | null): RuralCreditLine | undefined {
  if (!text) return undefined;
  for (const [pattern, line] of CREDIT_LINE_PATTERNS) {
    if (pattern.test(text)) return line;
  }
  return undefined;
}

/**
 * Ano-safra brasileiro: começa em julho e termina em junho do ano seguinte,
 * acompanhando o Plano Safra. Ex.: 10/07/2025 pertence à safra 2025/2026.
 */
export function harvestYear(date: Date): { start: number; end: number } {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0 = janeiro, 6 = julho
  return month >= 6 ? { start: year, end: year + 1 } : { start: year - 1, end: year };
}

/**
 * Rótulo amigável do ano-safra, ex.: "Safra 2025/2026".
 */
export function harvestLabel(date: Date = new Date()): string {
  const { start, end } = harvestYear(date);
  return `Safra ${start}/${end}`;
}

/**
 * Diz se duas datas caem no mesmo ano-safra.
 */
export function sameHarvest(a: Date, b: Date): boolean {
  const ha = harvestYear(a);
  const hb = harvestYear(b);
  return ha.start === hb.start;
}
