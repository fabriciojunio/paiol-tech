-- Migração: Tabela de parcelas de dívidas rurais
CREATE TABLE installments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    debt_id         UUID         NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
    numero          INTEGER      NOT NULL,
    valor           DECIMAL(14,2) NOT NULL,
    data_vencimento DATE         NOT NULL,
    data_pagamento  DATE,
    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDENTE'
                    CHECK (status IN ('PENDENTE','PAGO','VENCIDO','RENEGOCIADO')),
    juros_acumulados DECIMAL(14,2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    UNIQUE (debt_id, numero)
);

CREATE INDEX idx_installments_debt_id         ON installments(debt_id);
CREATE INDEX idx_installments_status          ON installments(status);
CREATE INDEX idx_installments_data_vencimento ON installments(data_vencimento);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER installments_updated_at
    BEFORE UPDATE ON installments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
