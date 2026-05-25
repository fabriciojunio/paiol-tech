'use client';

import { useState, useRef } from 'react';
import { Button, Card, CardContent } from '@paiol/ui';
import { Camera, X, Loader2 } from 'lucide-react';

interface ParsedDebt {
  creditor?: string;
  amount?: string;
  dueDate?: string;
}

interface OcrInputProps {
  onResult: (parsed: ParsedDebt) => void;
  onClose: () => void;
}

function parseBoletText(text: string): ParsedDebt {
  const result: ParsedDebt = {};

  const amountMatch = text.match(/(?:valor|vl\.?|r\$)\s*:?\s*([\d.,]+)/i);
  if (amountMatch?.[1]) {
    result.amount = amountMatch[1].replace('.', '').replace(',', '.');
  }

  const dateMatch = text.match(/(?:vencimento|venc\.?|data)\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i);
  if (dateMatch?.[1]) {
    const [d, m, y] = dateMatch[1].split('/');
    result.dueDate = `${y}-${m}-${d}`;
  }

  const creditorMatch = text.match(/(?:benefici[aá]rio|favorecido|cedente)\s*:?\s*([A-Z][A-Z\s]+)/i);
  if (creditorMatch?.[1]) {
    result.creditor = creditorMatch[1].trim().slice(0, 100);
  }

  return result;
}

export function OcrInput({ onResult, onClose }: OcrInputProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsed, setParsed] = useState<ParsedDebt | null>(null);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setIsProcessing(true);
    setError('');

    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('por');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      const result = parseBoletText(text);
      setParsed(result);
    } catch {
      setError('Não consegui ler o boleto. Tente uma foto mais clara.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => { if (parsed) onResult(parsed); };

  return (
    <Card className="border-primary">
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">Foto do boleto</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent"><X className="h-4 w-4" /></button>
        </div>

        <p className="text-sm text-muted-foreground">
          Tire uma foto do boleto e vamos preencher os dados automaticamente.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFile}
        />

        {!preview && (
          <Button
            className="w-full h-12"
            onClick={() => inputRef.current?.click()}
          >
            <Camera className="h-5 w-5 mr-2" />
            Tirar foto do boleto
          </Button>
        )}

        {isProcessing && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm">Lendo o boleto...</span>
          </div>
        )}

        {preview && !isProcessing && (
          <img src={preview} alt="Boleto" className="w-full rounded-lg max-h-48 object-cover" loading="lazy" />
        )}

        {error && <p className="text-sm text-destructive text-center">{error}</p>}

        {parsed && !isProcessing && (
          <div className="space-y-2 border rounded-lg p-3">
            <p className="text-sm font-medium">Encontrei esses dados — está certo?</p>
            {parsed.creditor && <p className="text-sm">Credor: <strong>{parsed.creditor}</strong></p>}
            {parsed.amount && <p className="text-sm">Valor: <strong>R$ {parsed.amount}</strong></p>}
            {parsed.dueDate && <p className="text-sm">Vencimento: <strong>{new Date(parsed.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}</strong></p>}
            {!parsed.creditor && !parsed.amount && !parsed.dueDate && (
              <p className="text-sm text-muted-foreground">Não consegui extrair os dados. Preencha manualmente.</p>
            )}
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleConfirm} className="flex-1">Usar esses dados</Button>
              <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}>Nova foto</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
