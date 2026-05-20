import { Suspense } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Parcelas | Paiol Tech',
  description: 'Acompanhe todas as suas parcelas e vencimentos',
};

function ParcelesSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

export default function ParcelasPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Parcelas</h1>
        <p className="text-gray-500 mt-1">Gerencie todas as suas parcelas de dívidas rurais</p>
      </div>

      <Suspense fallback={<ParcelesSkeleton />}>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-gray-400 text-center py-8">
            Nenhuma parcela cadastrada ainda.
          </p>
        </div>
      </Suspense>
    </main>
  );
}
