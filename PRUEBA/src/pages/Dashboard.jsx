import React from 'react';
import { Users, Wrench, DollarSign } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white border-b border-slate-800 pb-4">Panel Principal</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-4 bg-indigo-600/20 text-indigo-400 rounded-xl"><Wrench size={24}/></div>
          <div>
            <h3 className="text-slate-400 text-xs font-bold uppercase">Órdenes Activas</h3>
            <p className="text-2xl font-black text-white">24</p>
          </div>
        </div>
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-4 bg-emerald-600/20 text-emerald-400 rounded-xl"><Users size={24}/></div>
          <div>
            <h3 className="text-slate-400 text-xs font-bold uppercase">Clientes Registrados</h3>
            <p className="text-2xl font-black text-white">156</p>
          </div>
        </div>
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex items-center gap-4">
          <div className="p-4 bg-amber-600/20 text-amber-400 rounded-xl"><DollarSign size={24}/></div>
          <div>
            <h3 className="text-slate-400 text-xs font-bold uppercase">Ingresos Estimados</h3>
            <p className="text-2xl font-black text-white">$4.2M</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 min-h-[300px]">
        <h3 className="text-lg font-bold text-white mb-4">Actividad Reciente</h3>
        <p className="text-sm text-slate-500">Aquí se conectarán los datos en tiempo real de Supabase mostrando las últimas reparaciones ingresadas.</p>
      </div>
    </div>
  );
}