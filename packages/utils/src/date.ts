export function daysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function isOverdue(dueDate: Date): boolean {
  return daysUntil(dueDate) < 0;
}

export function formatDateBR(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0] as string;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function dueDateLabel(dueDate: Date): string {
  const days = daysUntil(dueDate);
  if (days < 0) return `Vencida há ${Math.abs(days)} dia${Math.abs(days) > 1 ? 's' : ''}`;
  if (days === 0) return 'Vence hoje';
  if (days === 1) return 'Vence amanhã';
  return `Vence em ${days} dias`;
}
