import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  // Simulación de carga inicial para que puedas ver la UI sin tener base de datos conectada aún
  useEffect(() => {
    setClientes([
      { id: 1, nombre: 'Juan Manuel Gómez', telefono: '3001234567', cedula: '1098765432' },
      { id: 2, nombre: 'María Fernanda Ríos', telefono: '3159876543', cedula: '1112223334' }
    ]);
  }, []);

  const filtrados = clientes.filter(c => c.nombre.toLowerCase().includes(busqueda.toLowerCase()) || c.telefono.includes(busqueda));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white">Directorio de Clientes</h1>
        <button className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30">
          <Plus size={16} /> Nuevo Cliente
        </button>
      </div>
      
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center bg-slate-900">
          <Search className="text-slate-400 mr-3" size={18}/>
          <input 
            type="text" 
            placeholder="Buscar por nombre o teléfono..." 
            className="bg-transparent border-none outline-none text-white text-sm w-full"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-800 text-slate-400 uppercase text-xs">
            <tr>
              <th className="p-4">Cliente</th>
              <th className="p-4">Teléfono</th>
              <th className="p-4">Identificación</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filtrados.map(c => (
              <tr key={c.id} className="hover:bg-slate-800/50 transition">
                <td className="p-4 font-bold text-white">{c.nombre}</td>
                <td className="p-4 text-indigo-400 font-medium">{c.telefono}</td>
                <td className="p-4">{c.cedula}</td>
                <td className="p-4 text-right flex justify-end gap-2">
                  <button className="p-2 bg-slate-800 text-white rounded-lg hover:bg-indigo-600 transition border border-slate-700"><Edit size={14}/></button>
                  <button className="p-2 bg-slate-800 text-white rounded-lg hover:bg-rose-600 transition border border-slate-700"><Trash2 size={14}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}