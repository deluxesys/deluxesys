import React from 'react';
import { Plus } from 'lucide-react';

export default function Ordenes() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white">Reparaciones y Estado</h1>
        <button className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30">
          <Plus size={16} /> Registrar Equipo
        </button>
      </div>
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 text-center text-slate-400">
        <p className="mb-2">Módulo de órdenes en construcción.</p>
        <p className="text-xs">Aquí irá la tabla de equipos conectados a Supabase.</p>
      </div>
    </div>
  );
}