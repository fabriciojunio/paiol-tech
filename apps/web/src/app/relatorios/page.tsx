import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Relatórios | Paiol Tech',
  description: 'Relatórios financeiros das dívidas rurais',
};

export default function RelatoriosPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-gray-500 mt-1">Exporte seus dados em PDF ou Excel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-2">Extrato de Dívidas</h2>
          <p className="text-sm text-gray-500 mb-4">
            Visão consolidada de todas as dívidas e parcelas por safra
          </p>
          <button
            disabled
            className="w-full py-2 px-4 bg-green-600 text-white rounded-lg text-sm font-medium opacity-50 cursor-not-allowed"
          >
            Exportar PDF (em breve)
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-2">Planilha de Vencimentos</h2>
          <p className="text-sm text-gray-500 mb-4">
            Calendário de vencimentos para os próximos 12 meses
          </p>
          <button
            disabled
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium opacity-50 cursor-not-allowed"
          >
            Exportar Excel (em breve)
          </button>
        </div>
      </div>
    </main>
  );
}
