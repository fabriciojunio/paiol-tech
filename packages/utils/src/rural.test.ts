import { describe, expect, it } from 'vitest';
import { detectCreditLine, harvestLabel, harvestYear, sameHarvest, CREDIT_LINE_LABELS } from './rural';

describe('detectCreditLine', () => {
  it('reconhece Pronaf em descrições de contrato', () => {
    expect(detectCreditLine('Financiamento PRONAF custeio milho')).toBe('PRONAF');
    expect(detectCreditLine('pronaf mais alimentos')).toBe('PRONAF');
  });

  it('reconhece Pronamp', () => {
    expect(detectCreditLine('Crédito PRONAMP investimento')).toBe('PRONAMP');
  });

  it('reconhece custeio quando não há programa específico', () => {
    expect(detectCreditLine('Custeio safra 2024/2025')).toBe('CUSTEIO');
  });

  it('reconhece investimento e programas do BNDES', () => {
    expect(detectCreditLine('Financiamento de investimento em trator')).toBe('INVESTIMENTO');
    expect(detectCreditLine('MODERFROTA parcela 3/60')).toBe('INVESTIMENTO');
  });

  it('reconhece CPR', () => {
    expect(detectCreditLine('CPR financeira soja')).toBe('CPR');
    expect(detectCreditLine('Cédula de Produto Rural')).toBe('CPR');
  });

  it('prioriza o programa sobre a finalidade (Pronaf custeio = Pronaf)', () => {
    expect(detectCreditLine('Pronaf custeio pecuário')).toBe('PRONAF');
  });

  it('retorna undefined quando não reconhece nada', () => {
    expect(detectCreditLine('Compra de insumos na revenda')).toBeUndefined();
    expect(detectCreditLine('')).toBeUndefined();
    expect(detectCreditLine(undefined)).toBeUndefined();
    expect(detectCreditLine(null)).toBeUndefined();
  });

  it('tem rótulo em português para toda linha de crédito', () => {
    for (const label of Object.values(CREDIT_LINE_LABELS)) {
      expect(label.length).toBeGreaterThan(0);
    }
  });
});

describe('harvestYear', () => {
  it('julho em diante pertence à safra que começa no ano corrente', () => {
    expect(harvestYear(new Date(2025, 6, 1))).toEqual({ start: 2025, end: 2026 });
    expect(harvestYear(new Date(2025, 11, 31))).toEqual({ start: 2025, end: 2026 });
  });

  it('janeiro a junho pertence à safra iniciada no ano anterior', () => {
    expect(harvestYear(new Date(2026, 0, 15))).toEqual({ start: 2025, end: 2026 });
    expect(harvestYear(new Date(2026, 5, 30))).toEqual({ start: 2025, end: 2026 });
  });
});

describe('harvestLabel', () => {
  it('formata o rótulo do ano-safra', () => {
    expect(harvestLabel(new Date(2025, 8, 10))).toBe('Safra 2025/2026');
    expect(harvestLabel(new Date(2026, 2, 10))).toBe('Safra 2025/2026');
    expect(harvestLabel(new Date(2026, 6, 10))).toBe('Safra 2026/2027');
  });
});

describe('sameHarvest', () => {
  it('datas de setembro e março seguintes caem na mesma safra', () => {
    expect(sameHarvest(new Date(2025, 8, 1), new Date(2026, 2, 1))).toBe(true);
  });

  it('junho e julho do mesmo ano caem em safras diferentes', () => {
    expect(sameHarvest(new Date(2026, 5, 30), new Date(2026, 6, 1))).toBe(false);
  });
});
