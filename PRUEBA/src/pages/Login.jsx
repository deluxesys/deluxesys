import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('¡Bienvenido a TechFix!');
      navigate('/');
    } catch (error) {
      toast.error('Error al iniciar sesión. Revisa tus credenciales.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-full max-w-md space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-white text-2xl mx-auto shadow-lg shadow-indigo-600/30">TF</div>
          <h1 className="text-xl font-bold text-white">Ingreso al Sistema</h1>
          <p className="text-xs text-slate-400">Conectado a Supabase Auth</p>
        </div>
        <div className="space-y-4">
          <input type="email" placeholder="Correo electrónico" className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input type="password" placeholder="Contraseña" className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={password} onChange={e=>setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="w-full bg-indigo-600 text-white p-3 rounded-xl font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition">Iniciar Sesión</button>
      </form>
    </div>
  );
}