'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Card, CardContent } from '@paiol/ui';
import { Mic, MicOff, X } from 'lucide-react';

interface ParsedDebt {
  creditor?: string;
  amount?: string;
  dueDate?: string;
  description?: string;
}

interface VoiceInputProps {
  onResult: (parsed: ParsedDebt) => void;
  onClose: () => void;
}

function getSpeechRecognition(): (new () => SpeechRecognition) | undefined {
  if (typeof window === 'undefined') return undefined;
  type W = Window & { SpeechRecognition?: new () => SpeechRecognition; webkitSpeechRecognition?: new () => SpeechRecognition };
  const w = window as unknown as W;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

function parseTranscript(text: string): ParsedDebt {
  const result: ParsedDebt = {};
  const lower = text.toLowerCase();

  const amountRegex = /(\d[\d.,]*)\s*(mil)?\s*(reais?|r\$)?/i;
  const wordAmounts: Record<string, number> = {
    um: 1, dois: 2, três: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9,
    dez: 10, vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50, cem: 100, duzentos: 200,
    trezentos: 300, quatrocentos: 400, quinhentos: 500,
  };

  let amount = 0;
  const wordAmountMatch = Object.entries(wordAmounts).find(([w]) => lower.includes(w));
  if (wordAmountMatch) {
    amount = wordAmountMatch[1] ?? 0;
    if (lower.includes('mil')) amount *= 1000;
    result.amount = String(amount);
  } else {
    const match = lower.match(amountRegex);
    if (match?.[1]) {
      const raw = match[1].replace('.', '').replace(',', '.');
      if (match[2] === 'mil') result.amount = String(parseFloat(raw) * 1000);
      else result.amount = raw;
    }
  }

  const months: Record<string, string> = {
    janeiro: '01', fevereiro: '02', março: '03', abril: '04', maio: '05', junho: '06',
    julho: '07', agosto: '08', setembro: '09', outubro: '10', novembro: '11', dezembro: '12',
  };
  const dateWordMatch = lower.match(/dia\s+(\d{1,2})\s+de\s+(\w+)/);
  if (dateWordMatch) {
    const day = dateWordMatch[1]?.padStart(2, '0');
    const monthKey = dateWordMatch[2] ?? '';
    const month = months[monthKey];
    if (day && month) {
      const year = new Date().getFullYear();
      const d = new Date(`${year}-${month}-${day}`);
      if (d < new Date()) d.setFullYear(year + 1);
      const isoDate = d.toISOString().split('T')[0];
      if (isoDate) result.dueDate = isoDate;
    }
  }

  const creditorMatch = lower.match(/(?:pro|para o?|com a?|ao?)\s+([a-záéíóúâêîôûãõç\s]+?)(?:\s+no\s+dia|\s+em|\s+de\s+r\$|$)/i);
  if (creditorMatch?.[1]) {
    result.creditor = creditorMatch[1].trim().replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return result;
}

export function VoiceInput({ onResult, onClose }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsed, setParsed] = useState<ParsedDebt | null>(null);
  const [error, setError] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = useCallback(() => {
    const RecognitionCtor = getSpeechRecognition() as (new () => SpeechRecognition) | undefined;
    if (!RecognitionCtor) {
      setError('Seu celular não suporta entrada por voz.');
      return;
    }

    const recognition = new RecognitionCtor();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const text = Array.from(e.results)
        .map((r: SpeechRecognitionResult) => r[0]?.transcript ?? '')
        .join('');
      setTranscript(text);
      if (e.results[0]?.isFinal) {
        setParsed(parseTranscript(text));
        setIsListening(false);
      }
    };

    recognition.onerror = () => {
      setError('Não consegui ouvir. Fale mais alto e tente novamente.');
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setTranscript('');
    setParsed(null);
    setError('');
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  useEffect(() => { startListening(); }, [startListening]);

  const handleConfirm = () => { if (parsed) onResult(parsed); };

  return (
    <Card className="border-primary">
      <CardContent className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">Falar dívida</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent"><X className="h-4 w-4" /></button>
        </div>

        <p className="text-sm text-muted-foreground">
          Diga algo como: <em>&quot;devo cinco mil reais pro Sicredi no dia 20 de julho&quot;</em>
        </p>

        <div className="flex justify-center">
          <button
            onClick={isListening ? stopListening : startListening}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
              isListening
                ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-200'
                : 'bg-primary text-primary-foreground'
            }`}
          >
            {isListening ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
          </button>
        </div>

        {isListening && <p className="text-center text-sm text-muted-foreground animate-pulse">Ouvindo...</p>}

        {transcript && (
          <div className="bg-muted rounded-lg p-3">
            <p className="text-sm">&quot;{transcript}&quot;</p>
          </div>
        )}

        {error && <p className="text-sm text-destructive text-center">{error}</p>}

        {parsed && (
          <div className="space-y-2 border rounded-lg p-3">
            <p className="text-sm font-medium">Entendi isso — está certo?</p>
            {parsed.creditor && <p className="text-sm">Credor: <strong>{parsed.creditor}</strong></p>}
            {parsed.amount && <p className="text-sm">Valor: <strong>R$ {parsed.amount}</strong></p>}
            {parsed.dueDate && <p className="text-sm">Vencimento: <strong>{new Date(parsed.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}</strong></p>}
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleConfirm} className="flex-1">Sim, usar isso</Button>
              <Button size="sm" variant="outline" onClick={startListening}>Tentar de novo</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
