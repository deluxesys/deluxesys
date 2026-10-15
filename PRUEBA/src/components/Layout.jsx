import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Users, Home, Settings, Wrench } from 'lucide-react';

export default function Layout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItem = (path, icon, label) => {
    const isActive = location.pathname === path;
    return (
      <Link to={path} className={`flex items-center gap-3 p-3 rounded-xl transition ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'hover:bg-slate-800 text-slate-300'}`}>
        {icon} <span className="font-semibold text-sm">{label}</span>
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-5 flex flex-col no-imprimir">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-white text-lg">TF</div>
          <div>
            <h1 className="text-sm font-extrabold text-indigo-400">TechFix</h1>
            <span className="text-[10px] text-slate-500 uppercase">Taller & Ventas</span>
          </div>
        </div>
        
        <nav className="flex-1 space-y-2">
          {navItem('/', <Home size={18}/>, 'Dashboard')}
          {navItem('/ordenes', <Wrench size={18}/>, 'Reparaciones')}
          {navItem('/clientes', <Users size={18}/>, 'Directorio Clientes')}
        </nav>

        <div className="pt-4 border-t border-slate-800">
          <p className="text-xs text-slate-400 mb-3 truncate">{user?.email || 'Admin Local'}</p>
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full p-2.5 bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-400 rounded-xl transition font-bold text-sm border border-slate-700">
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto w-full max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}