import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from './lib/supabase';

// ==========================================
// CONTEXTO DE DATOS Y CONEXIÓN A SUPABASE
// ==========================================
const AppContext = createContext();

export function AppProvider({ children }) {
  const [empresa, setEmpresa] = useState({ nombre: 'Cargando...', nit: '', telefono: '', direccion: '', logoUrl: '' });
  const [roles, setRoles] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [usuarioSesion, setUsuarioSesion] = useState(() => {
    const saved = localStorage.getItem('techfix_sesion');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const resEmp = await supabase.from('empresa').select('*').limit(1);
      if (resEmp.data && resEmp.data.length > 0) {
        setEmpresa({ ...resEmp.data[0], logoUrl: resEmp.data[0].logo_url });
      } else {
        setEmpresa({ nombre: 'TechFix (Falta Configurar)', nit: '', telefono: '', direccion: '', logoUrl: '' });
      }

      const resRol = await supabase.from('roles').select('*');
      if (resRol.data) setRoles(resRol.data);

      const resUsr = await supabase.from('usuarios').select('*');
      if (resUsr.data) setUsuarios(resUsr.data);

      const resCli = await supabase.from('clientes').select('*');
      if (resCli.data) setClientes(resCli.data);

      const resOrd = await supabase.from('ordenes').select('*');
      if (resOrd.data) setOrdenes(resOrd.data);

      const resFac = await supabase.from('facturas').select('*');
      if (resFac.data) setFacturas(resFac.data);

    } catch (error) {
      console.error("Error conectando a Supabase:", error);
    }
  };

  const login = (usr, pwd) => {
    if (usuarios.length === 0 && usr === 'admin' && pwd === 'admin123') {
      const adminEmergencia = { id: 'emergencia', nombre: 'Admin Master', usuario: 'admin', rol_id: 'emergencia' };
      setUsuarioSesion(adminEmergencia);
      localStorage.setItem('techfix_sesion', JSON.stringify(adminEmergencia));
      return true;
    }

    const encontrado = usuarios.find(u => u.usuario.toLowerCase() === usr.toLowerCase() && u.clave === pwd);
    if (encontrado) {
      setUsuarioSesion(encontrado);
      localStorage.setItem('techfix_sesion', JSON.stringify(encontrado));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUsuarioSesion(null);
    localStorage.removeItem('techfix_sesion');
  };

  const rolActual = usuarioSesion ? roles.find(r => r.id === usuarioSesion.rol_id) : null;

  const generarCodigoSeguimiento = () => 'TK-' + Math.random().toString(36).substring(2, 6).toUpperCase();

  const agregarCliente = async (data) => {
    const { data: insertado, error } = await supabase.from('clientes').insert([data]).select();
    if (error || !insertado) return alert('Error guardando cliente.');
    setClientes(prev => [insertado[0], ...prev]);
    return insertado[0];
  };

  const modificarCliente = async (id, data) => {
    const { error } = await supabase.from('clientes').update(data).eq('id', id);
    if (!error) setClientes(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const agregarOrden = async (ordenData, clienteSeleccionado) => {
    // Estructura simplificada y compatible con cualquier tabla básica de órdenes
    const nueva = {
      codigo_seguimiento: generarCodigoSeguimiento(),
      cliente_nombre: clienteSeleccionado.nombre,
      cliente_telefono: clienteSeleccionado.telefono,
      tipo_equipo: ordenData.tipo_equipo,
      marca_modelo: ordenData.marca_modelo,
      fallo_reportado: ordenData.fallo_reportado,
      valor_estimado: Number(ordenData.valor_estimado) || 0,
      estado: 'Ingresado'
    };

    const { data: insertada, error } = await supabase.from('ordenes').insert([nueva]).select();
    if (error) {
      console.error("Error Supabase:", error);
      return alert(`Error guardando la orden en la nube: ${error.message}`);
    }
    setOrdenes(prev => [insertada[0], ...prev]);
    return insertada[0];
  };

  const actualizarOrden = async (id, estado, obs, diag, costo) => {
    const updateData = {
      estado,
      diagnostico: diag || '',
      valor_estimado: costo !== undefined ? Number(costo) : 0
    };

    const { error } = await supabase.from('ordenes').update(updateData).eq('id', id);
    if (!error) {
      setOrdenes(prev => prev.map(o => o.id === id ? { ...o, ...updateData } : o));
    }
  };

  const facturarOrden = async (orden) => {
    const nuevaFac = {
      numero_factura: `FAC-${Math.floor(Math.random() * 90000) + 10000}`,
      cliente_nombre: orden.cliente_nombre,
      fecha: new Date().toISOString().split('T')[0],
      total: orden.valor_estimado || 0,
      tipo: 'Servicio Técnico'
    };

    const { data: insertada, error } = await supabase.from('facturas').insert([nuevaFac]).select();
    if (!error && insertada) {
      setFacturas(prev => [insertada[0], ...prev]);
      await actualizarOrden(orden.id, 'Entregado / Facturado', '', orden.diagnostico, orden.valor_estimado);
      return insertada[0];
    }
  };

  const agregarVentaDirecta = async (clienteNombre, itemsArray, totalCalculado) => {
    const nuevaFac = {
      numero_factura: `FAC-${Math.floor(Math.random() * 90000) + 10000}`,
      cliente_nombre: clienteNombre || 'Cliente Mostrador',
      fecha: new Date().toISOString().split('T')[0],
      total: totalCalculado,
      tipo: 'Venta de Repuestos'
    };

    const { data: insertada, error } = await supabase.from('facturas').insert([nuevaFac]).select();
    if (!error && insertada) { setFacturas(prev => [insertada[0], ...prev]); return insertada[0]; }
  };

  const agregarRol = async (nombreRol, permisosObj) => {
    const { data: insertado, error } = await supabase.from('roles').insert([{ nombre: nombreRol, permisos: permisosObj }]).select();
    if (!error && insertado) setRoles(prev => [...prev, insertado[0]]);
  };

  const agregarUsuario = async (data) => {
    const usr = { nombre: data.nombre, usuario: data.usuario, clave: data.clave, rol_id: data.rolId };
    const { data: insertado, error } = await supabase.from('usuarios').insert([usr]).select();
    if (!error && insertado) setUsuarios(prev => [...prev, insertado[0]]);
  };

  const actualizarEmpresa = async (datos) => {
    const updateData = { nombre: datos.nombre, nit: datos.nit, telefono: datos.telefono, direccion: datos.direccion, logo_url: datos.logoUrl };
    const { data: ext } = await supabase.from('empresa').select('id').limit(1);
    
    if (ext && ext.length > 0) {
      await supabase.from('empresa').update(updateData).eq('id', ext[0].id);
    } else {
      await supabase.from('empresa').insert([updateData]);
    }
    setEmpresa(datos);
  };

  return (
    <AppContext.Provider value={{
      empresa, setEmpresa: actualizarEmpresa, roles, agregarRol, usuarios, agregarUsuario,
      usuarioSesion, login, logout, rolActual,
      clientes, agregarCliente, modificarCliente,
      ordenes, agregarOrden, actualizarOrden,
      facturas, facturarOrden, agregarVentaDirecta
    }}>
      {children}
    </AppContext.Provider>
  );
}

const useApp = () => useContext(AppContext);

// ==========================================
// PANTALLA DE INICIO DE SESIÓN
// ==========================================
function LoginScreen() {
  const { login, empresa } = useApp();
  const [usr, setUsr] = useState('');
  const [pwd, setPwd] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (login(usr, pwd)) setError(false);
    else setError(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          {empresa.logoUrl ? (
            <img src={empresa.logoUrl} alt="Logo" className="w-16 h-16 object-contain mx-auto rounded-xl bg-slate-800 p-1 border border-slate-700" />
          ) : (
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-white text-2xl mx-auto shadow-lg shadow-indigo-600/30">TF</div>
          )}
          <h1 className="text-xl font-bold text-white">{empresa.nombre}</h1>
          <p className="text-xs text-slate-400">Ingresa tus credenciales para acceder al taller</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Usuario</label>
            <input type="text" placeholder="Ej. admin" className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" value={usr} onChange={e => setUsr(e.target.value)} required />
          </div>
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Contraseña</label>
            <input type="password" placeholder="••••••••" className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" value={pwd} onChange={e => setPwd(e.target.value)} required />
          </div>
          {error && <p className="text-rose-400 text-[11px] font-bold text-center">Usuario o contraseña incorrectos.</p>}
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 font-bold py-3 rounded-xl text-xs text-white transition shadow-lg shadow-indigo-600/30">Iniciar Sesión</button>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// APLICACIÓN PRINCIPAL
// ==========================================
function MainApp() {
  const {
    empresa, clientes, ordenes, facturas, roles, agregarRol, usuarios, agregarUsuario,
    usuarioSesion, logout, rolActual,
    agregarCliente, modificarCliente, agregarOrden, actualizarOrden,
    facturarOrden, agregarVentaDirecta, setEmpresa
  } = useApp();

  const [tab, setTab] = useState('ordenes');
  const [modalEditOrden, setModalEditOrden] = useState(null);
  const [modalEditCliente, setModalEditCliente] = useState(null);
  const [verHistorialCliente, setVerHistorialCliente] = useState(null);
  const [modalVenta, setModalVenta] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [documentoImprimir, setDocumentoImprimir] = useState(null);
  const [tipoClienteOpt, setTipoClienteOpt] = useState('EXISTENTE');
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [formNuevoCliente, setFormNuevoCliente] = useState({ nombre: '', telefono: '', cedula: '', email: '', direccion: '' });
  const [formOrden, setFormOrden] = useState({ tipo_equipo: 'PORTATIL', marca_modelo: '', serie: '', fallo_reportado: '', valor_estimado: 0 });
  const [editOrdForm, setEditOrdForm] = useState({ estado: '', diagnostico: '', costo: 0 });
  const [formNuevoRol, setFormNuevoRol] = useState({ nombre: '', permisos: { crear_orden: true, editar_diagnostico: true, ver_clientes: false, editar_clientes: false, facturar: false, ver_configuracion: false } });
  const [formUsuarioNuevo, setFormUsuarioNuevo] = useState({ nombre: '', usuario: '', clave: '', rolId: roles[0]?.id || '' });

  const clientesFiltradosBusqueda = clientes.filter(c => c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()) || c.telefono.includes(busquedaCliente));

  const enviarWhatsApp = (orden) => {
    const msg = `Hola *${orden.cliente_nombre}* 👋. Te saludamos de *${empresa.nombre}*.\nTu equipo *${orden.tipo_equipo} ${orden.marca_modelo}* se encuentra en estado: *${orden.estado}*.\n\nPuedes consultar el avance usando tu *Código Único: ${orden.codigo_seguimiento}* en nuestra plataforma.`;
    window.open(`https://wa.me/57${orden.cliente_telefono}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const exportarClientesCSV = () => {
    let csv = 'Nombre,Telefono,Cedula,Email,Direccion\n';
    clientes.forEach(c => csv += `"${c.nombre}","${c.telefono}","${c.cedula || ''}","${c.email || ''}","${c.direccion || ''}"\n`);
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `clientes_techfix.csv`;
    a.click();
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEmpresa({ ...empresa, logoUrl: reader.result });
      reader.readAsDataURL(file);
    }
  };

  const permisos = usuarioSesion?.id === 'emergencia' 
    ? { crear_orden: true, editar_diagnostico: true, ver_clientes: true, editar_clientes: true, facturar: true, ver_configuracion: true } 
    : (rolActual ? (typeof rolActual.permisos === 'string' ? JSON.parse(rolActual.permisos) : rolActual.permisos) : {});

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      
      {/* BARRA LATERAL */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-5 space-y-6 flex flex-col justify-between shrink-0 no-imprimir">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            {empresa.logoUrl ? (
              <img src={empresa.logoUrl} alt="Logo" className="w-10 h-10 object-contain rounded-lg bg-slate-800 border border-slate-700 p-0.5" />
            ) : (
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-white text-lg">TF</div>
            )}
            <div>
              <h1 className="text-sm font-extrabold text-indigo-400 leading-tight">{empresa.nombre}</h1>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Taller & Ventas</span>
            </div>
          </div>

          <nav className="space-y-1.5 text-xs font-semibold">
            {permisos.crear_orden && <button onClick={() => setTab('nueva_orden')} className={`w-full text-left p-3 rounded-xl transition ${tab === 'nueva_orden' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800'}`}>➕ Nueva Orden de Entrada</button>}
            <button onClick={() => setTab('ordenes')} className={`w-full text-left p-3 rounded-xl transition ${tab === 'ordenes' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800'}`}>🛠️ Reparaciones y Estado</button>
            {permisos.ver_clientes && <button onClick={() => setTab('clientes')} className={`w-full text-left p-3 rounded-xl transition ${tab === 'clientes' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800'}`}>👥 Directorio de Clientes</button>}
            {permisos.facturar && <button onClick={() => setTab('facturacion')} className={`w-full text-left p-3 rounded-xl transition ${tab === 'facturacion' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800'}`}>🧾 Facturación y Ventas</button>}
            <button onClick={() => setTab('portal')} className={`w-full text-left p-3 rounded-xl transition ${tab === 'portal' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800'}`}>🔍 Portal Consulta Cliente</button>
            {permisos.ver_configuracion && <button onClick={() => setTab('config')} className={`w-full text-left p-3 rounded-xl transition ${tab === 'config' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800'}`}>⚙️ Configuración & Permisos</button>}
          </nav>
        </div>
        <div className="pt-4 border-t border-slate-800 text-xs space-y-2">
          <div><p className="text-white font-bold">{usuarioSesion?.nombre}</p><p className="text-[10px] text-indigo-400 font-semibold">{rolActual?.nombre || 'Administrador Sistema'}</p></div>
          <button onClick={logout} className="w-full bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-300 font-bold p-2 rounded-xl text-center transition border border-slate-700">🚪 Cerrar Sesión</button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full no-imprimir">
        
        {/* 1. CREACIÓN DE NUEVA ORDEN */}
        {tab === 'nueva_orden' && permisos.crear_orden && (
          <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl space-y-5">
            <h2 className="text-xl font-bold text-white border-b border-slate-800 pb-3">Registrar Orden de Entrada</h2>
            <div className="space-y-3">
              <label className="text-xs font-bold text-indigo-400 uppercase">Selección de Cliente</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => { setTipoClienteOpt('EXISTENTE'); setClienteSeleccionado(null); }} className={`p-2.5 rounded-xl text-xs font-bold border transition ${tipoClienteOpt === 'EXISTENTE' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>Buscar Cliente Existente</button>
                <button type="button" onClick={() => { setTipoClienteOpt('NUEVO'); setClienteSeleccionado(null); }} className={`p-2.5 rounded-xl text-xs font-bold border transition ${tipoClienteOpt === 'NUEVO' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>+ Registrar Cliente Nuevo</button>
              </div>

              {tipoClienteOpt === 'EXISTENTE' && (
                <div className="space-y-2 pt-2">
                  {!clienteSeleccionado ? (
                    <div className="relative">
                      <input type="text" placeholder="Buscar por Nombre o Celular..." className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-xs text-white" value={busquedaCliente} onChange={e => setBusquedaCliente(e.target.value)} />
                      {busquedaCliente.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-20 max-h-40 overflow-y-auto">
                          {clientesFiltradosBusqueda.length > 0 ? clientesFiltradosBusqueda.map(c => (
                            <div key={c.id} onClick={() => { setClienteSeleccionado(c); setBusquedaCliente(''); }} className="p-2.5 hover:bg-slate-700 cursor-pointer text-xs border-b border-slate-700/50">
                              <p className="font-bold text-white">{c.nombre}</p><p className="text-[11px] text-indigo-400">Tel: {c.telefono}</p>
                            </div>
                          )) : <p className="p-3 text-xs text-slate-500">No se encontraron coincidencias.</p>}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-indigo-950/60 border border-indigo-700/60 p-3 rounded-xl flex justify-between items-center text-xs">
                      <div><p className="font-bold text-white">{clienteSeleccionado.nombre}</p><p className="text-indigo-300">Tel: {clienteSeleccionado.telefono}</p></div>
                      <button onClick={() => setClienteSeleccionado(null)} className="text-slate-400 hover:text-white font-bold text-xs">Cambiar</button>
                    </div>
                  )}
                </div>
              )}

              {tipoClienteOpt === 'NUEVO' && (
                <div className="space-y-2 pt-2 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                  <input placeholder="Nombre Completo *" className="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-xs text-white" value={formNuevoCliente.nombre} onChange={e => setFormNuevoCliente({ ...formNuevoCliente, nombre: e.target.value })} />
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Teléfono / WhatsApp *" className="bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-xs text-white" value={formNuevoCliente.telefono} onChange={e => setFormNuevoCliente({ ...formNuevoCliente, telefono: e.target.value })} />
                    <input placeholder="Cédula / NIT" className="bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-xs text-white" value={formNuevoCliente.cedula} onChange={e => setFormNuevoCliente({ ...formNuevoCliente, cedula: e.target.value })} />
                  </div>
                  <input placeholder="Dirección" className="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-xs text-white" value={formNuevoCliente.direccion} onChange={e => setFormNuevoCliente({ ...formNuevoCliente, direccion: e.target.value })} />
                </div>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-indigo-400 uppercase">2. Detalles del Equipo</label>
              <select className="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-xs text-white" value={formOrden.tipo_equipo} onChange={e => setFormOrden({ ...formOrden, tipo_equipo: e.target.value })}>
                <option value="PORTATIL">Portátil / Laptop</option>
                <option value="CPU">CPU / Escritorio</option>
                <option value="VARIOS">Monitor / Varios</option>
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Marca y Modelo *" className="bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-xs text-white" value={formOrden.marca_modelo} onChange={e => setFormOrden({ ...formOrden, marca_modelo: e.target.value })} />
                <input placeholder="N° de Serie (S/N)" className="bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-xs text-white" value={formOrden.serie} onChange={e => setFormOrden({ ...formOrden, serie: e.target.value })} />
              </div>
              <textarea placeholder="Síntomas / Fallo reportado *" className="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-xs text-white" rows={2} value={formOrden.fallo_reportado} onChange={e => setFormOrden({ ...formOrden, fallo_reportado: e.target.value })} />
              <input type="number" placeholder="Presupuesto Estimado ($ COP)" className="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-xs text-white" value={formOrden.valor_estimado} onChange={e => setFormOrden({ ...formOrden, valor_estimado: e.target.value })} />
            </div>

            <button
              onClick={async () => {
                let targetClient = clienteSeleccionado;
                if (tipoClienteOpt === 'NUEVO') {
                  if (!formNuevoCliente.nombre || !formNuevoCliente.telefono) return alert('Ingresa el nombre y teléfono del cliente.');
                  targetClient = await agregarCliente(formNuevoCliente);
                }
                if (!targetClient) return alert('Selecciona o registra un cliente.');
                if (!formOrden.marca_modelo || !formOrden.fallo_reportado) return alert('Completa los datos del equipo.');

                const nueva = await agregarOrden(formOrden, targetClient);
                if (nueva) {
                  alert(`¡Orden registrada!\nCódigo Cliente: ${nueva.codigo_seguimiento}`);
                  setDocumentoImprimir({ tipo: 'ORDEN', data: nueva });
                  setTab('ordenes');
                  setClienteSeleccionado(null);
                  setFormNuevoCliente({ nombre: '', telefono: '', cedula: '', email: '', direccion: '' });
                  setFormOrden({ tipo_equipo: 'PORTATIL', marca_modelo: '', serie: '', fallo_reportado: '', valor_estimado: 0 });
                }
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-500 font-bold py-3 rounded-xl text-xs transition shadow-lg shadow-indigo-600/30 text-white"
            >
              Guardar e Imprimir Orden
            </button>
          </div>
        )}

        {/* 2. TABLA REPARACIONES */}
        {tab === 'ordenes' && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <h2 className="text-xl font-bold text-white">Seguimiento de Reparaciones</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800 text-slate-400 uppercase">
                  <tr><th className="p-3">ID Registro</th><th className="p-3">Código Cliente</th><th className="p-3">Cliente</th><th className="p-3">Equipo</th><th className="p-3">Estado</th><th className="p-3">Presupuesto</th><th className="p-3 text-right">Acciones</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {ordenes.map(o => (
                    <tr key={o.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-indigo-400">#{o.id ? o.id.toString().slice(0, 5) : '1001'}</td>
                      <td className="p-3 font-mono text-xs text-amber-400 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-800/40">{o.codigo_seguimiento}</td>
                      <td className="p-3 font-medium text-white">{o.cliente_nombre}<span className="block text-[10px] text-slate-500">{o.cliente_telefono}</span></td>
                      <td className="p-3">{o.tipo_equipo} {o.marca_modelo}</td>
                      <td className="p-3"><span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold">{o.estado}</span></td>
                      <td className="p-3 font-bold text-white">$ {(o.valor_estimado || 0).toLocaleString('es-CO')}</td>
                      <td className="p-3 text-right space-x-1">
                        {permisos.editar_diagnostico && <button onClick={() => { setModalEditOrden(o); setEditOrdForm({ estado: o.estado, diagnostico: o.diagnostico || '', costo: o.valor_estimado || 0 }); }} className="bg-indigo-600 text-white px-2 py-1 rounded text-[11px]">✏️ Diagnóstico</button>}
                        <button onClick={() => enviarWhatsApp(o)} className="bg-emerald-600 text-white px-2 py-1 rounded text-[11px]">💬 WhatsApp</button>
                        <button onClick={() => setDocumentoImprimir({ tipo: 'ORDEN', data: o })} className="bg-slate-800 text-white px-2 py-1 rounded text-[11px]">🖨️ PDF</button>
                        {o.estado === 'Reparado / Listo' && permisos.facturar && <button onClick={async () => { const fac = await facturarOrden(o); if(fac){ alert('¡Facturada!'); setDocumentoImprimir({ tipo: 'FACTURA', data: fac }); } }} className="bg-emerald-500 text-white px-2 py-1 rounded text-[11px] font-bold">💵 Facturar</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. CLIENTES */}
        {tab === 'clientes' && permisos.ver_clientes && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex justify-between items-center"><h2 className="text-xl font-bold text-white">Directorio de Clientes</h2><div className="space-x-2"><button onClick={exportarClientesCSV} className="bg-slate-800 text-slate-200 px-3 py-1.5 rounded-xl text-xs">📊 Exportar</button>{permisos.editar_clientes && <button onClick={() => { setModalEditCliente({}); setFormNuevoCliente({ nombre: '', telefono: '', cedula: '', email: '', direccion: '' }); }} className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold">+ Nuevo Cliente</button>}</div></div>
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800 text-slate-400 uppercase"><tr><th className="p-3">Cliente</th><th className="p-3">Teléfono</th><th className="p-3 text-right">Acciones</th></tr></thead>
              <tbody className="divide-y divide-slate-800">
                {clientes.map(c => (
                  <tr key={c.id} className="hover:bg-slate-800/40"><td className="p-3 font-bold text-white">{c.nombre}</td><td className="p-3 text-indigo-400">{c.telefono}</td><td className="p-3 text-right space-x-1">{permisos.editar_clientes && <button onClick={() => { setModalEditCliente(c); setFormNuevoCliente(c); }} className="bg-slate-800 text-white px-2 py-1 rounded text-[11px]">✏️ Editar</button>}<button onClick={() => setVerHistorialCliente(c)} className="bg-indigo-600 text-white px-2 py-1 rounded text-[11px]">📜 Historial</button></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. FACTURACIÓN */}
        {tab === 'facturacion' && permisos.facturar && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex justify-between items-center"><h2 className="text-xl font-bold text-white">Facturación y Ventas</h2><button onClick={() => setModalVenta(true)} className="bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold">+ Venta Directa</button></div>
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800 text-slate-400 uppercase"><tr><th className="p-3">Factura</th><th className="p-3">Fecha</th><th className="p-3">Cliente</th><th className="p-3">Total</th><th className="p-3 text-right">Detalle</th></tr></thead>
              <tbody className="divide-y divide-slate-800">
                {facturas.map(f => (
                  <tr key={f.id} className="hover:bg-slate-800/40"><td className="p-3 font-bold text-emerald-400">{f.numero_factura}</td><td className="p-3 text-slate-400">{f.fecha}</td><td className="p-3 font-medium text-white">{f.cliente_nombre}</td><td className="p-3 font-extrabold text-white">$ {(f.total || 0).toLocaleString('es-CO')}</td><td className="p-3 text-right space-x-1"><button onClick={() => setFacturaSeleccionada(f)} className="bg-indigo-600 text-white px-2 py-1 rounded text-[11px]">👁️ Ver</button><button onClick={() => setDocumentoImprimir({ tipo: 'FACTURA', data: f })} className="bg-slate-800 text-white px-2 py-1 rounded text-[11px]">🖨️ PDF</button></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. PORTAL DEL CLIENTE INTERNO (NUEVO) */}
        {tab === 'portal' && (
          <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4 text-center">
            {empresa.logoUrl && <img src={empresa.logoUrl} alt="Logo" className="w-16 h-16 object-contain mx-auto rounded-xl bg-slate-800 p-1 border border-slate-700" />}
            <h2 className="text-xl font-bold text-white">{empresa.nombre}</h2>
            <p className="text-xs text-slate-400">Portal Público de Consulta de Estado de Reparación</p>
            <div className="flex gap-2">
              <input
                placeholder="Ingresa el Código (ej. TK-89A1)"
                className="flex-1 bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-xs text-white text-center font-bold font-mono tracking-wider uppercase"
                value={busquedaCliente}
                onChange={e => setBusquedaCliente(e.target.value)}
              />
              <button
                onClick={() => {
                  const clean = busquedaCliente.trim().toUpperCase();
                  const res = ordenes.find(o => o.codigo_seguimiento && o.codigo_seguimiento.toUpperCase() === clean);
                  setClienteSeleccionado(res || 'NO_ENCONTRADO');
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold"
              >
                Consultar
              </button>
            </div>

            {clienteSeleccionado && clienteSeleccionado !== 'NO_ENCONTRADO' && (
              <div className="text-left bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-2 text-xs">
                <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                  <span className="font-bold text-indigo-400">Estado: {clienteSeleccionado.estado}</span>
                  <span className="font-mono text-[11px] text-amber-400">Código: {clienteSeleccionado.codigo_seguimiento}</span>
                </div>
                <p><strong className="text-white">Equipo:</strong> {clienteSeleccionado.tipo_equipo} {clienteSeleccionado.marca_modelo}</p>
                <p><strong className="text-white">Diagnóstico Técnico:</strong> {clienteSeleccionado.diagnostico || 'Equipo en proceso de revisión.'}</p>
                <p><strong className="text-white">Presupuesto Estimado:</strong> $ {(clienteSeleccionado.valor_estimado || 0).toLocaleString('es-CO')}</p>
              </div>
            )}
            {clienteSeleccionado === 'NO_ENCONTRADO' && <p className="text-xs text-amber-400">No se encontró ninguna orden con ese código.</p>}
          </div>
        )}

        {/* 6. CONFIGURACIÓN */}
        {tab === 'config' && permisos.ver_configuracion && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
              <h2 className="text-xl font-bold text-white border-b border-slate-800 pb-2">Perfil de Empresa en Nube</h2>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400">Logo</label>
                  <div className="flex items-center gap-3 mt-1">{empresa.logoUrl && <img src={empresa.logoUrl} className="w-12 h-12 object-contain bg-slate-800 border rounded-lg p-1" />} <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-xs text-white file:bg-indigo-600 file:text-white file:rounded-xl file:border-0 file:px-3 file:py-1.5 cursor-pointer" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-slate-400">Nombre</label><input className="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-white" value={empresa.nombre} onChange={e => setEmpresa({ ...empresa, nombre: e.target.value })} /></div>
                  <div><label className="text-slate-400">NIT</label><input className="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-white" value={empresa.nit} onChange={e => setEmpresa({ ...empresa, nit: e.target.value })} /></div>
                </div>
                <button onClick={async () => { await setEmpresa(empresa); alert('Guardado en la Nube'); }} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold">Guardar Cambios</button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
              <h2 className="text-xl font-bold text-white border-b border-slate-800 pb-2">Crear Usuarios Reales</h2>
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                <p className="font-bold text-indigo-400 uppercase">Crear Perfil (Rol)</p>
                <input placeholder="Nombre de Perfil (ej. Técnico, Ventas)" className="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-white" value={formNuevoRol.nombre} onChange={e => setFormNuevoRol({ ...formNuevoRol, nombre: e.target.value })} />
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={formNuevoRol.permisos.crear_orden} onChange={e => setFormNuevoRol({ ...formNuevoRol, permisos: { ...formNuevoRol.permisos, crear_orden: e.target.checked } })} /> Crear Órdenes</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={formNuevoRol.permisos.editar_diagnostico} onChange={e => setFormNuevoRol({ ...formNuevoRol, permisos: { ...formNuevoRol.permisos, editar_diagnostico: e.target.checked } })} /> Modificar Diagnóstico</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={formNuevoRol.permisos.ver_clientes} onChange={e => setFormNuevoRol({ ...formNuevoRol, permisos: { ...formNuevoRol.permisos, ver_clientes: e.target.checked } })} /> Ver Clientes</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={formNuevoRol.permisos.facturar} onChange={e => setFormNuevoRol({ ...formNuevoRol, permisos: { ...formNuevoRol.permisos, facturar: e.target.checked } })} /> Facturar y Ventas</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={formNuevoRol.permisos.ver_configuracion} onChange={e => setFormNuevoRol({ ...formNuevoRol, permisos: { ...formNuevoRol.permisos, ver_configuracion: e.target.checked } })} /> Configuración</label>
                </div>
                <button onClick={async () => { if (!formNuevoRol.nombre) return; await agregarRol(formNuevoRol.nombre, formNuevoRol.permisos); alert('Rol creado'); setFormNuevoRol({ nombre: '', permisos: { crear_orden: true, editar_diagnostico: true, ver_clientes: false, editar_clientes: false, facturar: false, ver_configuracion: false } }); }} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold">Guardar Rol</button>

                <p className="font-bold text-indigo-400 uppercase mt-4">Crear Usuario</p>
                <div className="grid grid-cols-2 gap-2"><input placeholder="Nombre Completo" className="bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-white" value={formUsuarioNuevo.nombre} onChange={e => setFormUsuarioNuevo({ ...formUsuarioNuevo, nombre: e.target.value })} /><input placeholder="Usuario" className="bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-white" value={formUsuarioNuevo.usuario} onChange={e => setFormUsuarioNuevo({ ...formUsuarioNuevo, usuario: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2"><input type="password" placeholder="Contraseña" className="bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-white" value={formUsuarioNuevo.clave} onChange={e => setFormUsuarioNuevo({ ...formUsuarioNuevo, clave: e.target.value })} /><select className="bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-white" value={formUsuarioNuevo.rolId} onChange={e => setFormUsuarioNuevo({ ...formUsuarioNuevo, rolId: e.target.value })}><option value="">Selecciona Rol...</option>{roles.map(r => (<option key={r.id} value={r.id}>{r.nombre}</option>))}</select></div>
                <button onClick={async () => { if (!formUsuarioNuevo.nombre || !formUsuarioNuevo.rolId) return alert('Falta el Rol o Nombre'); await agregarUsuario(formUsuarioNuevo); alert('Usuario creado en Supabase'); }} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold">Guardar Usuario</button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* MODALES REUTILIZADOS */}
      {modalEditOrden && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 no-imprimir">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md p-6 rounded-2xl space-y-3">
            <h3 className="font-bold text-white text-base">Modificar Orden</h3>
            <select className="w-full bg-slate-800 p-2 rounded-xl text-xs text-white" value={editOrdForm.estado} onChange={e => setEditOrdForm({ ...editOrdForm, estado: e.target.value })}><option value="Ingresado">Ingresado</option><option value="En Diagnóstico">En Diagnóstico</option><option value="Esperando Repuesto">Esperando Repuesto</option><option value="Reparado / Listo">Reparado / Listo</option><option value="Entregado / Facturado">Entregado / Facturado</option></select>
            <textarea className="w-full bg-slate-800 p-2 rounded-xl text-xs text-white" rows={2} value={editOrdForm.diagnostico} onChange={e => setEditOrdForm({ ...editOrdForm, diagnostico: e.target.value })} placeholder="Diagnóstico técnico..." />
            <input type="number" className="w-full bg-slate-800 p-2 rounded-xl text-xs text-white" value={editOrdForm.costo} onChange={e => setEditOrdForm({ ...editOrdForm, costo: e.target.value })} placeholder="Costo..." />
            <div className="flex justify-end gap-2 pt-2"><button onClick={() => setModalEditOrden(null)} className="text-xs text-slate-400 px-3">Cancelar</button><button onClick={async () => { await actualizarOrden(modalEditOrden.id, editOrdForm.estado, '', editOrdForm.diagnostico, editOrdForm.costo); setModalEditOrden(null); }} className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-xs font-bold">Guardar</button></div>
          </div>
        </div>
      )}

      {documentoImprimir && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-50">
          <div className="bg-white text-slate-900 w-full max-w-xl p-8 rounded-2xl space-y-4 shadow-2xl">
            <div id="seccion-impresion" className="space-y-4 text-sm">
              <div className="flex justify-between"><h1 className="font-black text-xl">{empresa.nombre}</h1><h2 className="font-extrabold text-indigo-600">DOCUMENTO OFICIAL</h2></div>
              {documentoImprimir.tipo === 'ORDEN' && (<div className="space-y-2"><p><strong>Cliente:</strong> {documentoImprimir.data.cliente_nombre}</p><p><strong>Código Seguimiento:</strong> {documentoImprimir.data.codigo_seguimiento}</p><p><strong>Equipo:</strong> {documentoImprimir.data.tipo_equipo} {documentoImprimir.data.marca_modelo}</p><p><strong>Fallo:</strong> {documentoImprimir.data.fallo_reportado}</p></div>)}
              {documentoImprimir.tipo === 'FACTURA' && (<div className="space-y-2"><p><strong>Factura:</strong> {documentoImprimir.data.numero_factura}</p><p><strong>Total:</strong> ${(documentoImprimir.data.total || 0).toLocaleString('es-CO')}</p></div>)}
            </div>
            <div className="flex justify-end gap-2 pt-4 no-imprimir"><button onClick={() => setDocumentoImprimir(null)} className="text-slate-500 px-3">Cerrar</button><button onClick={() => window.print()} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold">Imprimir</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// PORTAL PÚBLICO
// ==========================================
function PortalPublico() {
  const { empresa, ordenes } = useApp();
  const [codigoConsulta, setCodigoConsulta] = useState('');
  const [ordenConsultaResult, setOrdenConsultaResult] = useState(null);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100 font-sans">
      <div className="max-w-xl w-full mx-auto bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl text-center">
        {empresa.logoUrl && <img src={empresa.logoUrl} alt="Logo" className="w-16 h-16 object-contain mx-auto rounded-xl bg-slate-800 p-1 border border-slate-700 mb-4" />}
        <h2 className="text-xl font-bold text-white mb-1">{empresa.nombre}</h2>
        <p className="text-xs text-slate-400 mb-6">Portal Público de Consulta</p>
        <div className="flex gap-2">
          <input placeholder="Ingresa tu Código (ej. TK-89A1)" className="flex-1 bg-slate-800 border border-slate-700 p-3 rounded-xl text-sm font-bold font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500" value={codigoConsulta} onChange={e => setCodigoConsulta(e.target.value.toUpperCase())} />
          <button onClick={() => { const res = ordenes.find(o => o.codigo_seguimiento && o.codigo_seguimiento.toUpperCase() === codigoConsulta.trim().toUpperCase()); setOrdenConsultaResult(res || 'NO_ENCONTRADO'); }} className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold">Consultar</button>
        </div>
        {ordenConsultaResult && ordenConsultaResult !== 'NO_ENCONTRADO' && (
          <div className="text-left bg-slate-800/60 p-5 rounded-xl border border-slate-700 space-y-3 text-sm mt-6">
            <p className="font-bold text-indigo-400">Estado: {ordenConsultaResult.estado}</p>
            <p className="text-white">Equipo: {ordenConsultaResult.tipo_equipo} {ordenConsultaResult.marca_modelo}</p>
            <p className="text-white">Presupuesto: $ {(ordenConsultaResult.valor_estimado || 0).toLocaleString('es-CO')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AppContent() {
  const { usuarioSesion } = useApp();
  if (window.location.pathname === '/portal') return <PortalPublico />;
  return usuarioSesion ? <MainApp /> : <LoginScreen />;
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}