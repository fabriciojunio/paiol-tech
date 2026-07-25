-- Migração: linha de crédito rural na dívida (Pronaf, Pronamp, custeio...)
-- Campo opcional; dívidas antigas continuam válidas sem ele.
ALTER TABLE debts
    ADD COLUMN IF NOT EXISTS "creditLine" VARCHAR(20)
    CHECK ("creditLine" IS NULL OR "creditLine" IN (
        'PRONAF', 'PRONAMP', 'CUSTEIO', 'INVESTIMENTO', 'COMERCIALIZACAO', 'CPR', 'OUTRA'
    ));
