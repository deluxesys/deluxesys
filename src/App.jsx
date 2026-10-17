import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from './lib/supabase';

// ==========================================
// CONTEXTO DE DATOS Y CONEXIÓN A SUPABASE
// ==========================================
const AppContext = createContext();

export function AppProvider({ children }) {
  const [empresa, setEmpresa] = useState({ nombre: 'Cargando...', telefono: '', direccion: '', email: '', logoUrl: '' });
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
        setEmpresa({ 
          ...resEmp.data[0], 
          email: resEmp.data[0].email || 'contacto@syspcdoctor.com',
          logoUrl: resEmp.data[0].logo_url 
        });
      } else {
        setEmpresa({ nombre: 'Taller (Falta Configurar)', telefono: '', direccion: '', email: '', logoUrl: '' });
      }

      const resRol = await supabase.from('roles').select('*');
      if (resRol.data) setRoles(resRol.data);

      const resUsr = await supabase.from('usuarios').select('*');
      if (resUsr.data) setUsuarios(resUsr.data);

      const resCli = await supabase.from('clientes').select('*');
      if (resCli.data) setClientes(resCli.data);

      const resOrd = await supabase.from('ordenes').select('*').order('id', { ascending: false });
      if (resOrd.data) setOrdenes(resOrd.data);

      const resFac = await supabase.from('facturas').select('*').order('id', { ascending: false });
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
    if (error || !insertado) {
      alert('Error guardando cliente.');
      return null;
    }
    setClientes(prev => [insertado[0], ...prev]);
    return insertado[0];
  };

  const modificarCliente = async (id, data) => {
    const { error } = await supabase.from('clientes').update(data).eq('id', id);
    if (!error) {
      setClientes(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    } else {
      alert('Error actualizando cliente.');
    }
  };

  const agregarOrden = async (ordenData, clienteSeleccionado, nombreUsuario) => {
    const nueva = {
      codigo_seguimiento: generarCodigoSeguimiento(),
      cliente_nombre: clienteSeleccionado.nombre,
      cliente_telefono: clienteSeleccionado.telefono,
      cliente_email: clienteSeleccionado.email || '',
      tipo_equipo: ordenData.tipo_equipo,
      marca_modelo: ordenData.marca_modelo,
      serie: ordenData.serie || '',
      fallo_reportado: ordenData.fallo_reportado,
      valor_estimado: Number(ordenData.valor_estimado) || 0,
      total_pagar: 0,
      usuario_creador: nombreUsuario || 'Sistema',
      estado: 'Ingresado',
      observaciones: [{ fecha: new Date().toLocaleString('es-CO'), texto: `Orden registrada por ${nombreUsuario || 'Sistema'}.` }]
    };

    const { data: insertada, error } = await supabase.from('ordenes').insert([nueva]).select();
    if (error) {
      console.error("Error Supabase:", error);
      alert(`Error guardando la orden en la nube: ${error.message}`);
      return null;
    }
    setOrdenes(prev => [insertada[0], ...prev]);
    return insertada[0];
  };

  const actualizarOrden = async (id, estado, obs, diag, presupuesto, totalPagar, remisionAsociada = null) => {
    const ordenObj = ordenes.find(o => o.id === id);
    if (!ordenObj) return;

    let obsArr = Array.isArray(ordenObj.observaciones) ? [...ordenObj.observaciones] : [];
    if (obs && obs.trim()) {
      obsArr.push({ fecha: new Date().toLocaleString('es-CO'), texto: obs.trim() });
    }

    const updateData = {
      estado,
      diagnostico: diag !== undefined ? diag : ordenObj.diagnostico,
      valor_estimado: presupuesto !== undefined ? Number(presupuesto) : ordenObj.valor_estimado,
      total_pagar: totalPagar !== undefined ? Number(totalPagar) : (ordenObj.total_pagar || 0),
      observaciones: obsArr,
      ...(remisionAsociada ? { numero_factura_asociada: remisionAsociada } : {})
    };

    const { error } = await supabase.from('ordenes').update(updateData).eq('id', id);
    if (!error) {
      setOrdenes(prev => prev.map(o => o.id === id ? { ...o, ...updateData } : o));
    } else {
      alert('Error al actualizar la orden en Supabase.');
    }
  };

  const remisionarOrden = async (orden, idConsecutivoStr, nombreUsuario) => {
    const cliEncontrado = clientes.find(c => c.nombre.toLowerCase() === orden.cliente_nombre.toLowerCase());
    const telCliente = cliEncontrado ? cliEncontrado.telefono : (orden.cliente_telefono || 'N/A');
    const numRemisionGenerado = idConsecutivoStr;
    const valorCobro = orden.total_pagar > 0 ? orden.total_pagar : (orden.valor_estimado || 0);

    const nuevaFac = {
      numero_factura: numRemisionGenerado,
      cliente_nombre: orden.cliente_nombre,
      cliente_telefono: telCliente,
      fecha: new Date().toISOString().split('T')[0],
      total: valorCobro,
      tipo: 'Servicio Técnico',
      usuario_creador: nombreUsuario || 'Sistema',
      items: [
        { descripcion: `Servicio Técnico (${orden.tipo_equipo} - ${orden.marca_modelo}) | Fallo: ${orden.fallo_reportado} | Diagnóstico: ${orden.diagnostico || 'N/A'}`, cantidad: 1, precio: valorCobro }
      ]
    };

    const { data: insertada, error } = await supabase.from('facturas').insert([nuevaFac]).select();
    if (!error && insertada) {
      setFacturas(prev => [insertada[0], ...prev]);
      await actualizarOrden(orden.id, 'Entregado / Remisionado', 'Equipo entregado y remisionado bajo ' + numRemisionGenerado, orden.diagnostico, orden.valor_estimado, valorCobro, numRemisionGenerado);
      return insertada[0];
    } else {
      console.error(error);
      alert('Error al generar la remisión.');
      return null;
    }
  };

  const agregarVentaDirecta = async (clienteObj, itemsArray, totalCalculado, nombreUsuario) => {
    const nombreCliente = clienteObj ? clienteObj.nombre : 'Cliente Mostrador';
    const telefonoCliente = clienteObj ? (clienteObj.telefono || 'N/A') : 'N/A';
    const numRemisionGenerado = `REM-${Math.floor(Math.random() * 90000) + 10000}`;

    const nuevaFac = {
      numero_factura: numRemisionGenerado,
      cliente_nombre: nombreCliente,
      cliente_telefono: telefonoCliente,
      fecha: new Date().toISOString().split('T')[0],
      total: totalCalculado,
      tipo: 'Venta de Repuestos',
      usuario_creador: nombreUsuario || 'Sistema',
      items: itemsArray
    };

    const { data: insertada, error } = await supabase.from('facturas').insert([nuevaFac]).select();
    if (!error && insertada) { 
      setFacturas(prev => [insertada[0], ...prev]); 
      return insertada[0]; 
    } else {
      alert('Error al generar la remisión directa.');
    }
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
    const updateData = { nombre: datos.nombre, telefono: datos.telefono, email: datos.email, direccion: datos.direccion, logo_url: datos.logoUrl };
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
      facturas, remisionarOrden, agregarVentaDirecta
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
        <div className="text-center space-y-3">
          {empresa.logoUrl ? (
            <img src={empresa.logoUrl} alt="Logo" className="w-32 h-32 object-contain mx-auto rounded-xl bg-slate-800 p-2 border border-slate-700 shadow-lg" />
          ) : (
            <div className="w-24 h-24 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-white text-3xl mx-auto shadow-lg shadow-indigo-600/30">TF</div>
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
    remisionarOrden, agregarVentaDirecta, setEmpresa
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
  const [editOrdForm, setEditOrdForm] = useState({ estado: '', observacion: '', diagnostico: '', presupuesto: 0, totalPagar: 0 });
  
  const [tipoClienteVentaOpt, setTipoClienteVentaOpt] = useState('EXISTENTE');
  const [busquedaClienteVenta, setBusquedaClienteVenta] = useState('');
  const [clienteVentaSeleccionado, setClienteVentaSeleccionado] = useState(null);
  const [formNuevoClienteVenta, setFormNuevoClienteVenta] = useState({ nombre: '', telefono: '', cedula: '', email: '', direccion: '' });
  const [itemsVenta, setItemsVenta] = useState([{ descripcion: '', cantidad: 1, precio: 0 }]);

  const [mostrarHistorialPortal, setMostrarHistorialPortal] = useState(false);

  const [formNuevoRol, setFormNuevoRol] = useState({ nombre: '', permisos: { crear_orden: true, editar_diagnostico: true, ver_clientes: false, editar_clientes: false, facturar: false, ver_configuracion: false } });
  const [formUsuarioNuevo, setFormUsuarioNuevo] = useState({ nombre: '', usuario: '', clave: '', rolId: roles[0]?.id || '' });

  const clientesFiltradosBusqueda = clientes.filter(c => c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()) || c.telefono.includes(busquedaCliente));
  const clientesFiltradosVenta = clientes.filter(c => c.nombre.toLowerCase().includes(busquedaClienteVenta.toLowerCase()) || c.telefono.includes(busquedaClienteVenta));

  const enviarWhatsApp = (orden, idConsecutivoStr) => {
    const msg = `Hola *${orden.cliente_nombre}* 👋\n\nTe saludamos de *${empresa.nombre}*.\n\nTu orden *${idConsecutivoStr}* (*${orden.tipo_equipo} ${orden.marca_modelo}*) se encuentra en estado: *${orden.estado}*.\n\nPuedes consultar el avance, diagnóstico y estado de tu equipo ingresando a nuestra plataforma:\n🔗 https://syspcdoctor.vercel.app/portal\n\nUtiliza tu código único: *${orden.codigo_seguimiento}*`;
    window.open(`https://wa.me/57${orden.cliente_telefono}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const exportarClientesCSV = () => {
    let csv = 'Nombre,Telefono,Cedula,Email,Direccion\n';
    clientes.forEach(c => csv += `"${c.nombre}","${c.telefono}","${c.cedula || ''}","${c.email || ''}","${c.direccion || ''}"\n`);
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `clientes_taller.csv`;
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
            {permisos.facturar && <button onClick={() => setTab('facturacion')} className={`w-full text-left p-3 rounded-xl transition ${tab === 'facturacion' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800'}`}>🧾 Remisiones y Ventas</button>}
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
                    <input placeholder="Cédula" className="bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-xs text-white" value={formNuevoCliente.cedula} onChange={e => setFormNuevoCliente({ ...formNuevoCliente, cedula: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Correo Electrónico" type="email" className="bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-xs text-white" value={formNuevoCliente.email} onChange={e => setFormNuevoCliente({ ...formNuevoCliente, email: e.target.value })} />
                    <input placeholder="Dirección" className="bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-xs text-white" value={formNuevoCliente.direccion} onChange={e => setFormNuevoCliente({ ...formNuevoCliente, direccion: e.target.value })} />
                  </div>
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
              <input type="number" placeholder="Presupuesto Estimado ($ COP) - Opcional" className="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-xs text-white" value={formOrden.valor_estimado} onChange={e => setFormOrden({ ...formOrden, valor_estimado: e.target.value })} />
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

                const nombreUsrActual = usuarioSesion ? usuarioSesion.nombre : 'Admin';
                const nueva = await agregarOrden(formOrden, targetClient, nombreUsrActual);
                if (nueva) {
                  alert(`¡Orden registrada!\nCódigo Cliente: ${nueva.codigo_seguimiento}`);
                  const idConsecutivoStr = `#${1001 + (ordenes.length)}`;
                  setDocumentoImprimir({ tipo: 'ORDEN', data: nueva, idConsecutivo: idConsecutivoStr });
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
                  <tr><th className="p-3">ID Registro</th><th className="p-3">Código Cliente</th><th className="p-3">Cliente / Atendió</th><th className="p-3">Equipo</th><th className="p-3">Estado</th><th className="p-3">Presupuesto / Total Pagar</th><th className="p-3 text-right">Acciones</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {ordenes.map((o, index) => {
                    const idRegistroConsecutivo = `#${1001 + (ordenes.length - 1 - index)}`;
                    return (
                      <tr key={o.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-indigo-400">{idRegistroConsecutivo}</td>
                        <td className="p-3 font-mono text-xs text-amber-400 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-800/40">{o.codigo_seguimiento}</td>
                        <td className="p-3 font-medium text-white">
                          {o.cliente_nombre}
                          <span className="block text-[10px] text-slate-500">{o.cliente_telefono}</span>
                          <span className="block text-[10px] text-indigo-300 font-semibold mt-0.5">👤 Atendió: {o.usuario_creador || 'Sistema'}</span>
                        </td>
                        <td className="p-3">{o.tipo_equipo} {o.marca_modelo}</td>
                        <td className="p-3"><span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold">{o.estado}</span></td>
                        <td className="p-3 font-bold text-white">
                          <div className="space-y-0.5">
                            <span className="text-slate-400 text-[11px] block">Presupuesto: {o.valor_estimado ? `$ ${Number(o.valor_estimado).toLocaleString('es-CO')}` : '-'}</span>
                            <span className="text-emerald-400 text-[11px] block">Total Pagar: {o.total_pagar ? `$ ${Number(o.total_pagar).toLocaleString('es-CO')}` : '-'}</span>
                          </div>
                          {o.numero_factura_asociada && (
                            <span className="block text-[11px] text-indigo-400 font-mono mt-1">Remisión: {o.numero_factura_asociada}</span>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-1">
                          {permisos.editar_diagnostico && <button onClick={() => { setModalEditOrden(o); setEditOrdForm({ estado: o.estado, observacion: '', diagnostico: o.diagnostico || '', presupuesto: o.valor_estimado || 0, totalPagar: o.total_pagar || 0 }); }} className="bg-indigo-600 text-white px-2 py-1 rounded text-[11px]">✏️ Diagnóstico</button>}
                          <button onClick={() => enviarWhatsApp(o, idRegistroConsecutivo)} className="bg-emerald-600 text-white px-2 py-1 rounded text-[11px]">💬 WhatsApp</button>
                          <button onClick={() => setDocumentoImprimir({ tipo: 'ORDEN', data: o, idConsecutivo: idRegistroConsecutivo })} className="bg-slate-800 text-white px-2 py-1 rounded text-[11px]">🖨️ PDF</button>
                          {o.estado === 'Reparado / Listo' && permisos.facturar && <button onClick={async () => { const nombreUsrActual = usuarioSesion ? usuarioSesion.nombre : 'Admin'; const fac = await remisionarOrden(o, idRegistroConsecutivo, nombreUsrActual); if(fac){ alert('¡Remisión Generada!'); setDocumentoImprimir({ tipo: 'FACTURA', data: fac, idConsecutivo: idRegistroConsecutivo }); } }} className="bg-emerald-500 text-white px-2 py-1 rounded text-[11px] font-bold">📄 Remisionar</button>}
                        </td>
                      </tr>
                    );
                  })}
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
                  <tr key={c.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-white">{c.nombre}</td>
                    <td className="p-3 text-indigo-400">{c.telefono}</td>
                    <td className="p-3 text-right space-x-1">
                      {permisos.editar_clientes && <button onClick={() => { setModalEditCliente(c); setFormNuevoCliente({ nombre: c.nombre || '', telefono: c.telefono || '', cedula: c.cedula || '', email: c.email || '', direccion: c.direccion || '' }); }} className="bg-slate-800 text-white px-2 py-1 rounded text-[11px]">✏️ Editar</button>}
                      <button onClick={() => setVerHistorialCliente(c)} className="bg-indigo-600 text-white px-2 py-1 rounded text-[11px]">📜 Historial</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. REMISIONES Y VENTAS */}
        {tab === 'facturacion' && permisos.facturar && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex justify-between items-center"><h2 className="text-xl font-bold text-white">Remisiones y Ventas</h2><button onClick={() => { setModalVenta(true); setTipoClienteVentaOpt('EXISTENTE'); setClienteVentaSeleccionado(null); }} className="bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold">+ Venta Directa</button></div>
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800 text-slate-400 uppercase"><tr><th className="p-3">Remisión N°</th><th className="p-3">Fecha</th><th className="p-3">Cliente / Vendedor</th><th className="p-3">Total</th><th className="p-3 text-right">Detalle</th></tr></thead>
              <tbody className="divide-y divide-slate-800">
                {facturas.map(f => (
                  <tr key={f.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-indigo-400">{f.numero_factura}</td>
                    <td className="p-3 text-slate-400">{f.fecha}</td>
                    <td className="p-3 font-medium text-white">
                      {f.cliente_nombre}
                      <span className="block text-[10px] text-indigo-300 font-semibold mt-0.5">👤 Vendedor: {f.usuario_creador || 'Sistema'}</span>
                    </td>
                    <td className="p-3 font-extrabold text-white">$ {(f.total || 0).toLocaleString('es-CO')}</td>
                    <td className="p-3 text-right space-x-1">
                      <button onClick={() => setFacturaSeleccionada(f)} className="bg-indigo-600 text-white px-2 py-1 rounded text-[11px]">👁️ Ver</button>
                      <button onClick={() => setDocumentoImprimir({ tipo: 'FACTURA', data: f })} className="bg-slate-800 text-white px-2 py-1 rounded text-[11px]">🖨️ PDF</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. PORTAL DEL CLIENTE INTERNO */}
        {tab === 'portal' && (
          <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4 text-center">
            {empresa.logoUrl ? (
              <img src={empresa.logoUrl} alt="Logo" className="w-32 h-32 object-contain mx-auto rounded-xl bg-slate-800 p-2 border border-slate-700 shadow-lg" />
            ) : (
              <div className="w-24 h-24 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-white text-3xl mx-auto shadow-lg shadow-indigo-600/30">TF</div>
            )}
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
                  setMostrarHistorialPortal(false);
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold"
              >
                Consultar
              </button>
            </div>

            {clienteSeleccionado && clienteSeleccionado !== 'NO_ENCONTRADO' && (
              <div className="text-left bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-3 text-xs">
                <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                  <span className="font-bold text-indigo-400">Estado: {clienteSeleccionado.estado}</span>
                  <span className="font-mono text-[11px] text-amber-400">Código: {clienteSeleccionado.codigo_seguimiento}</span>
                </div>
                <p><strong className="text-white">Equipo:</strong> {clienteSeleccionado.tipo_equipo} {clienteSeleccionado.marca_modelo} (S/N: {clienteSeleccionado.serie || 'N/A'})</p>
                <p><strong className="text-white">Fallo Reportado:</strong> {clienteSeleccionado.fallo_reportado}</p>
                <p><strong className="text-white">Diagnóstico Técnico:</strong> {clienteSeleccionado.diagnostico || 'Equipo en proceso de revisión.'}</p>
                
                {clienteSeleccionado.numero_factura_asociada && (
                  <p><strong className="text-indigo-400">Remisión Asociada:</strong> <span className="text-indigo-300 font-mono font-bold">{clienteSeleccionado.numero_factura_asociada}</span></p>
                )}

                {Number(clienteSeleccionado.valor_estimado) > 0 && (
                  <p><strong className="text-white">Presupuesto Estimado:</strong> $ {Number(clienteSeleccionado.valor_estimado).toLocaleString('es-CO')}</p>
                )}

                {Number(clienteSeleccionado.total_pagar) > 0 && (
                  <p className="bg-emerald-950/40 border border-emerald-800/50 p-2.5 rounded-xl"><strong className="text-emerald-400">Total a Pagar:</strong> <span className="text-emerald-300 font-extrabold">$ {Number(clienteSeleccionado.total_pagar).toLocaleString('es-CO')}</span></p>
                )}

                {/* HISTORIAL DESPLEGABLE */}
                <div className="pt-2 border-t border-slate-700">
                  <button 
                    onClick={() => setMostrarHistorialPortal(!mostrarHistorialPortal)} 
                    className="w-full flex justify-between items-center text-xs font-bold text-indigo-400 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 transition hover:bg-slate-800"
                  >
                    <span>📜 Ver historial de avances y procesos</span>
                    <span>{mostrarHistorialPortal ? '▲' : '▼'}</span>
                  </button>

                  {mostrarHistorialPortal && (
                    <div className="mt-2 space-y-1.5 p-3 bg-slate-900/90 rounded-xl border border-slate-800">
                      {(Array.isArray(clienteSeleccionado.observaciones) ? clienteSeleccionado.observaciones : []).length > 0 ? (
                        clienteSeleccionado.observaciones.map((obs, idx) => (
                          <p key={idx} className="text-[11px] text-slate-300">🔹 <span className="text-slate-500 font-mono">[{obs.fecha}]</span> {obs.texto}</p>
                        ))
                      ) : (
                        <p className="text-[11px] text-slate-500">Sin registros en el historial aún.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            {clienteSeleccionado === 'NO_ENCONTRADO' && <p className="text-xs text-amber-400">No se encontró ninguna orden con ese código.</p>}

            {/* DATOS DE LA EMPRESA EN EL PORTAL */}
            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
              <p className="font-bold text-slate-300">{empresa.nombre}</p>
              {empresa.direccion && <p>📍 Dirección: {empresa.direccion}</p>}
              {empresa.telefono && <p>📞 Teléfono: {empresa.telefono}</p>}
              {empresa.email && <p>✉️ Correo: {empresa.email}</p>}
            </div>
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
                  <div className="flex items-center gap-3 mt-1">{empresa.logoUrl && <img src={empresa.logoUrl} className="w-16 h-16 object-contain bg-slate-800 border rounded-lg p-1" />} <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-xs text-white file:bg-indigo-600 file:text-white file:rounded-xl file:border-0 file:px-3 file:py-1.5 cursor-pointer" /></div>
                </div>
                <div><label className="text-slate-400">Nombre de la Empresa</label><input className="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-white" value={empresa.nombre} onChange={e => setEmpresa({ ...empresa, nombre: e.target.value })} /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="text-slate-400">Teléfono</label><input className="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-white" value={empresa.telefono} onChange={e => setEmpresa({ ...empresa, telefono: e.target.value })} /></div>
                  <div><label className="text-slate-400">Correo</label><input className="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-white" value={empresa.email} onChange={e => setEmpresa({ ...empresa, email: e.target.value })} /></div>
                  <div><label className="text-slate-400">Dirección</label><input className="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-white" value={empresa.direccion} onChange={e => setEmpresa({ ...empresa, direccion: e.target.value })} /></div>
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
                  <label className="flex items-center gap-2"><input type="checkbox" checked={formNuevoRol.permisos.facturar} onChange={e => setFormNuevoRol({ ...formNuevoRol, permisos: { ...formNuevoRol.permisos, facturar: e.target.checked } })} /> Remisiones y Ventas</label>
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

      {/* MODALES */}
      
      {/* 1. Modal Editar Diagnóstico */}
      {modalEditOrden && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 no-imprimir">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg p-6 rounded-2xl space-y-3">
            <h3 className="font-bold text-white text-base">Modificar Orden #{modalEditOrden.id}</h3>
            
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 max-h-36 overflow-y-auto space-y-1 text-xs">
              <p className="font-bold text-indigo-400">Historial de Avances Anteriores:</p>
              {(Array.isArray(modalEditOrden.observaciones) ? modalEditOrden.observaciones : []).length > 0 ? (
                modalEditOrden.observaciones.map((obs, idx) => (
                  <p key={idx} className="text-slate-300">▪️ <span className="text-slate-500">[{obs.fecha}]</span> {obs.texto}</p>
                ))
              ) : (
                <p className="text-slate-500">Sin comentarios previos.</p>
              )}
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Estado del Equipo</label>
              <select className="w-full bg-slate-800 p-2 rounded-xl text-xs text-white" value={editOrdForm.estado} onChange={e => setEditOrdForm({ ...editOrdForm, estado: e.target.value })}>
                <option value="Ingresado">Ingresado</option>
                <option value="En Diagnóstico">En Diagnóstico</option>
                <option value="Esperando Repuesto">Esperando Repuesto</option>
                <option value="Reparado / Listo">Reparado / Listo</option>
                <option value="Entregado / Remisionado">Entregado / Remisionado</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Diagnóstico Técnico</label>
              <textarea className="w-full bg-slate-800 p-2 rounded-xl text-xs text-white" rows={2} value={editOrdForm.diagnostico} onChange={e => setEditOrdForm({ ...editOrdForm, diagnostico: e.target.value })} placeholder="Diagnóstico técnico..." />
            </div>

            <div>
              <label className="text-[11px] text-indigo-400 font-bold block mb-1">+ Añadir Nuevo Comentario / Avance</label>
              <input className="w-full bg-slate-800 border border-slate-700 p-2 rounded-xl text-xs text-white" value={editOrdForm.observacion} onChange={e => setEditOrdForm({ ...editOrdForm, observacion: e.target.value })} placeholder="Ej. Se reparó conector de carga..." />
            </div>

            {/* CAMPOS SEPARADOS */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Presupuesto Estimado ($)</label>
                <input type="number" className="w-full bg-slate-800 p-2 rounded-xl text-xs text-white" value={editOrdForm.presupuesto} onChange={e => setEditOrdForm({ ...editOrdForm, presupuesto: e.target.value })} />
              </div>
              <div>
                <label className="text-[11px] text-emerald-400 font-bold block mb-1">Total a Pagar ($)</label>
                <input type="number" className="w-full bg-slate-800 p-2 rounded-xl text-xs text-white font-bold text-emerald-300" value={editOrdForm.totalPagar} onChange={e => setEditOrdForm({ ...editOrdForm, totalPagar: e.target.value })} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setModalEditOrden(null)} className="text-xs text-slate-400 px-3">Cancelar</button>
              <button onClick={async () => { 
                await actualizarOrden(modalEditOrden.id, editOrdForm.estado, editOrdForm.observacion, editOrdForm.diagnostico, editOrdForm.presupuesto, editOrdForm.totalPagar); 
                setModalEditOrden(null); 
              }} className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-xs font-bold">Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal Editar / Crear Cliente */}
      {modalEditCliente && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 no-imprimir">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md p-6 rounded-2xl space-y-3">
            <h3 className="font-bold text-white text-base">{modalEditCliente.id ? 'Modificar Cliente' : 'Nuevo Cliente'}</h3>
            <input placeholder="Nombre *" className="w-full bg-slate-800 border border-slate-700 p-2 rounded-xl text-xs text-white" value={formNuevoCliente.nombre} onChange={e => setFormNuevoCliente({ ...formNuevoCliente, nombre: e.target.value })} />
            <input placeholder="Teléfono *" className="w-full bg-slate-800 border border-slate-700 p-2 rounded-xl text-xs text-white" value={formNuevoCliente.telefono} onChange={e => setFormNuevoCliente({ ...formNuevoCliente, telefono: e.target.value })} />
            <input placeholder="Cédula" className="w-full bg-slate-800 border border-slate-700 p-2 rounded-xl text-xs text-white" value={formNuevoCliente.cedula} onChange={e => setFormNuevoCliente({ ...formNuevoCliente, cedula: e.target.value })} />
            <input placeholder="Correo Electrónico" type="email" className="w-full bg-slate-800 border border-slate-700 p-2 rounded-xl text-xs text-white" value={formNuevoCliente.email} onChange={e => setFormNuevoCliente({ ...formNuevoCliente, email: e.target.value })} />
            <input placeholder="Dirección" className="w-full bg-slate-800 border border-slate-700 p-2 rounded-xl text-xs text-white" value={formNuevoCliente.direccion} onChange={e => setFormNuevoCliente({ ...formNuevoCliente, direccion: e.target.value })} />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setModalEditCliente(null)} className="text-xs text-slate-400 px-3 py-1">Cancelar</button>
              <button onClick={async () => {
                if (!formNuevoCliente.nombre || !formNuevoCliente.telefono) return alert('Nombre y teléfono son obligatorios.');
                if (modalEditCliente.id) {
                  await modificarCliente(modalEditCliente.id, formNuevoCliente);
                } else {
                  await agregarCliente(formNuevoCliente);
                }
                setModalEditCliente(null);
              }} className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-xs font-bold">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal Historial de Cliente */}
      {verHistorialCliente && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 no-imprimir">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg p-6 rounded-2xl space-y-3">
            <h3 className="font-bold text-white text-base">Historial de: <span className="text-indigo-400">{verHistorialCliente.nombre}</span></h3>
            <div className="space-y-2 text-xs max-h-60 overflow-y-auto">
              <p className="font-bold text-slate-400 uppercase">Órdenes Registradas:</p>
              {ordenes.filter(o => o.cliente_nombre === verHistorialCliente.nombre).length > 0 ? (
                ordenes.filter(o => o.cliente_nombre === verHistorialCliente.nombre).map(o => (
                  <div key={o.id} className="p-2.5 bg-slate-800 rounded-xl border border-slate-700 space-y-1">
                    <p className="font-bold text-white">Código: {o.codigo_seguimiento} | Estado: <span className="text-amber-400">{o.estado}</span></p>
                    <p className="text-slate-300">Equipo: {o.tipo_equipo} {o.marca_modelo} (S/N: {o.serie || 'N/A'})</p>
                    <p className="text-slate-400">Fallo: {o.fallo_reportado}</p>
                    <p className="text-slate-400">Diagnóstico: {o.diagnostico || 'En proceso'}</p>
                  </div>
                ))
              ) : (
                <p className="text-slate-500">Este cliente no tiene órdenes registradas aún.</p>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setVerHistorialCliente(null)} className="bg-slate-800 text-white px-4 py-1.5 rounded-xl text-xs">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal Venta Directa con Selección de Cliente */}
      {modalVenta && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 no-imprimir">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg p-6 rounded-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-white text-base">Emitir Venta / Remisión Directa</h3>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-indigo-400 uppercase">Cliente</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => { setTipoClienteVentaOpt('EXISTENTE'); setClienteVentaSeleccionado(null); }} className={`p-2 rounded-xl text-xs font-bold border transition ${tipoClienteVentaOpt === 'EXISTENTE' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>Buscar Existente</button>
                <button type="button" onClick={() => { setTipoClienteVentaOpt('NUEVO'); setClienteVentaSeleccionado(null); }} className={`p-2 rounded-xl text-xs font-bold border transition ${tipoClienteVentaOpt === 'NUEVO' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>+ Cliente Nuevo</button>
              </div>

              {tipoClienteVentaOpt === 'EXISTENTE' && (
                <div className="relative pt-1">
                  {!clienteVentaSeleccionado ? (
                    <div className="relative">
                      <input type="text" placeholder="Buscar cliente por Nombre o Celular..." className="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-xs text-white" value={busquedaClienteVenta} onChange={e => setBusquedaClienteVenta(e.target.value)} />
                      {busquedaClienteVenta.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-20 max-h-36 overflow-y-auto">
                          {clientesFiltradosVenta.length > 0 ? clientesFiltradosVenta.map(c => (
                            <div key={c.id} onClick={() => { setClienteVentaSeleccionado(c); setBusquedaClienteVenta(''); }} className="p-2.5 hover:bg-slate-700 cursor-pointer text-xs border-b border-slate-700/50">
                              <p className="font-bold text-white">{c.nombre}</p><p className="text-[11px] text-indigo-400">Tel: {c.telefono}</p>
                            </div>
                          )) : <p className="p-3 text-xs text-slate-500">No se encontraron coincidencias.</p>}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-indigo-950/60 border border-indigo-700/60 p-2.5 rounded-xl flex justify-between items-center text-xs">
                      <div><p className="font-bold text-white">{clienteVentaSeleccionado.nombre}</p><p className="text-indigo-300">Tel: {clienteVentaSeleccionado.telefono}</p></div>
                      <button onClick={() => setClienteVentaSeleccionado(null)} className="text-slate-400 hover:text-white font-bold text-xs">Cambiar</button>
                    </div>
                  )}
                </div>
              )}

              {tipoClienteVentaOpt === 'NUEVO' && (
                <div className="space-y-2 pt-1 bg-slate-800/40 p-3 rounded-xl border border-slate-800 text-xs">
                  <input placeholder="Nombre Completo *" className="w-full bg-slate-800 border border-slate-700 p-2 rounded-xl text-white" value={formNuevoClienteVenta.nombre} onChange={e => setFormNuevoClienteVenta({ ...formNuevoClienteVenta, nombre: e.target.value })} />
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Teléfono / WhatsApp *" className="w-full bg-slate-800 border border-slate-700 p-2 rounded-xl text-white" value={formNuevoClienteVenta.telefono} onChange={e => setFormNuevoClienteVenta({ ...formNuevoClienteVenta, telefono: e.target.value })} />
                    <input placeholder="Cédula" className="w-full bg-slate-800 border border-slate-700 p-2 rounded-xl text-white" value={formNuevoClienteVenta.cedula} onChange={e => setFormNuevoClienteVenta({ ...formNuevoClienteVenta, cedula: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Correo Electrónico" type="email" className="w-full bg-slate-800 border border-slate-700 p-2 rounded-xl text-white" value={formNuevoClienteVenta.email} onChange={e => setFormNuevoClienteVenta({ ...formNuevoClienteVenta, email: e.target.value })} />
                    <input placeholder="Dirección" className="w-full bg-slate-800 border border-slate-700 p-2 rounded-xl text-white" value={formNuevoClienteVenta.direccion} onChange={e => setFormNuevoClienteVenta({ ...formNuevoClienteVenta, direccion: e.target.value })} />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Artículos / Ítems</label>
              {itemsVenta.map((it, idx) => (
                <div key={idx} className="flex gap-2">
                  <input placeholder="Descripción repuesto..." className="flex-1 bg-slate-800 border border-slate-700 p-2 rounded-xl text-xs text-white" value={it.descripcion} onChange={e => { const n = [...itemsVenta]; n[idx].descripcion = e.target.value; setItemsVenta(n); }} />
                  <input type="number" placeholder="Cant." className="w-16 bg-slate-800 border border-slate-700 p-2 rounded-xl text-xs text-white text-center" value={it.cantidad} onChange={e => { const n = [...itemsVenta]; n[idx].cantidad = Number(e.target.value); setItemsVenta(n); }} />
                  <input type="number" placeholder="Precio ($)" className="w-28 bg-slate-800 border border-slate-700 p-2 rounded-xl text-xs text-white" value={it.precio} onChange={e => { const n = [...itemsVenta]; n[idx].precio = Number(e.target.value); setItemsVenta(n); }} />
                </div>
              ))}
              <button type="button" onClick={() => setItemsVenta([...itemsVenta, { descripcion: '', cantidad: 1, precio: 0 }])} className="text-xs text-indigo-400 font-bold hover:underline">+ Añadir otro ítem</button>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <span className="font-bold text-xs text-white">Total a Pagar:</span>
              <span className="font-extrabold text-emerald-400 text-base">$ {itemsVenta.reduce((acc, i) => acc + (i.cantidad * i.precio), 0).toLocaleString('es-CO')}</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setModalVenta(false)} className="text-xs text-slate-400 px-3 py-1">Cancelar</button>
              <button onClick={async () => {
                let clienteFinalObj = null;
                if (tipoClienteVentaOpt === 'EXISTENTE' && clienteVentaSeleccionado) {
                  clienteFinalObj = clienteVentaSeleccionado;
                } else if (tipoClienteVentaOpt === 'NUEVO') {
                  if (!formNuevoClienteVenta.nombre || !formNuevoClienteVenta.telefono) return alert('Ingresa el nombre y teléfono del cliente.');
                  clienteFinalObj = await agregarCliente(formNuevoClienteVenta);
                }

                const total = itemsVenta.reduce((acc, i) => acc + (i.cantidad * i.precio), 0);
                if (total <= 0) return alert('Ingresa ítems con precio mayor a 0');
                
                const nombreUsrActual = usuarioSesion ? usuarioSesion.nombre : 'Admin';
                const fac = await agregarVentaDirecta(clienteFinalObj, itemsVenta, total, nombreUsrActual);
                setModalVenta(false);
                if(fac) {
                  alert('¡Remisión creada!');
                  setDocumentoImprimir({ tipo: 'FACTURA', data: fac });
                }
              }} className="bg-emerald-600 text-white px-4 py-1.5 rounded-xl text-xs font-bold">Generar Remisión</button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal Ver Detalle de Remisión */}
      {facturaSeleccionada && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 no-imprimir">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="font-bold text-white text-base">Detalle de {facturaSeleccionada.numero_factura}</h3>
              <span className="text-xs font-bold text-indigo-400">Fecha: {facturaSeleccionada.fecha}</span>
            </div>
            <p className="text-xs text-slate-300"><strong>Cliente:</strong> {facturaSeleccionada.cliente_nombre}</p>
            <p className="text-xs text-slate-300"><strong>Teléfono:</strong> {facturaSeleccionada.cliente_telefono || 'N/A'}</p>
            <p className="text-xs text-slate-300"><strong>Vendedor:</strong> <span className="text-indigo-300 font-semibold">{facturaSeleccionada.usuario_creador || 'Sistema'}</span></p>
            <p className="text-xs text-slate-300"><strong>Tipo Operación:</strong> {facturaSeleccionada.tipo}</p>

            <div className="border border-slate-800 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800 text-slate-400">
                  <tr><th className="p-2">Ítem / Descripción</th><th className="p-2 text-center">Cant.</th><th className="p-2 text-right">Precio</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {(facturaSeleccionada.items || []).map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2 text-[11px]">{it.descripcion}</td>
                      <td className="p-2 text-center text-[11px]">{it.cantidad}</td>
                      <td className="p-2 text-right text-[11px]">$ {(it.precio || 0).toLocaleString('es-CO')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <span className="font-bold text-xs text-white">Total a Pagar:</span>
              <span className="font-extrabold text-emerald-400 text-base">$ {(facturaSeleccionada.total || 0).toLocaleString('es-CO')}</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setFacturaSeleccionada(null)} className="bg-slate-800 text-white px-4 py-1.5 rounded-xl text-xs font-bold">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Documento Impreso PDF (TEXTOS MÁS GRANDES Y ESPACIO DE GARANTÍA/SELLO) */}
      {documentoImprimir && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-50">
          <div className="bg-white text-slate-900 w-full max-w-xl p-8 rounded-2xl space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div id="seccion-impresion" className="space-y-4 text-base">
              
              <div className="flex items-center justify-between border-b-2 pb-3 gap-4">
                <div className="flex items-center gap-3">
                  {empresa.logoUrl && (
                    <img src={empresa.logoUrl} alt="Logo" className="w-20 h-20 object-contain rounded-lg border p-1 bg-white shrink-0" />
                  )}
                  <div>
                    <h1 className="font-black text-2xl leading-tight">{empresa.nombre}</h1>
                    <p className="text-sm text-slate-600">Tel: {empresa.telefono || 'N/A'} | Email: {empresa.email || 'N/A'}</p>
                  </div>
                </div>
                <h2 className="font-extrabold text-indigo-700 uppercase text-right text-lg shrink-0">
                  {documentoImprimir.tipo === 'FACTURA' ? 'REMISIÓN' : 'ORDEN DE ENTRADA'}
                </h2>
              </div>

              {documentoImprimir.tipo === 'ORDEN' && (
                <div className="space-y-3 text-sm">
                  {documentoImprimir.idConsecutivo && (
                    <p className="text-lg"><strong>N° Registro:</strong> <span className="font-black text-indigo-700">{documentoImprimir.idConsecutivo}</span></p>
                  )}
                  <p><strong>Cliente:</strong> {documentoImprimir.data.cliente_nombre}</p>
                  <p><strong>Teléfono:</strong> {documentoImprimir.data.cliente_telefono || 'N/A'}</p>
                  <p><strong>Código de Seguimiento:</strong> {documentoImprimir.data.codigo_seguimiento}</p>
                  {documentoImprimir.data.numero_factura_asociada && (
                    <p><strong>Remisión Asociada:</strong> {documentoImprimir.data.numero_factura_asociada}</p>
                  )}
                  <p><strong>Equipo:</strong> {documentoImprimir.data.tipo_equipo} {documentoImprimir.data.marca_modelo} (S/N: {documentoImprimir.data.serie || 'N/A'})</p>
                  <p><strong>Fallo Reportado:</strong> {documentoImprimir.data.fallo_reportado}</p>
                  <p><strong>Diagnóstico Actual:</strong> {documentoImprimir.data.diagnostico || 'En proceso'}</p>
                  
                  {Number(documentoImprimir.data.valor_estimado) > 0 && (
                    <p><strong>Presupuesto Estimado:</strong> $ {Number(documentoImprimir.data.valor_estimado).toLocaleString('es-CO')}</p>
                  )}

                  {Number(documentoImprimir.data.total_pagar) > 0 && (
                    <p className="font-bold text-emerald-700 text-lg"><strong>Total a Pagar:</strong> $ {Number(documentoImprimir.data.total_pagar).toLocaleString('es-CO')}</p>
                  )}

                  {Array.isArray(documentoImprimir.data.observaciones) && documentoImprimir.data.observaciones.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-300 space-y-1.5">
                      <p className="font-bold text-slate-800 uppercase text-sm">Historial de Proceso y Avances:</p>
                      {documentoImprimir.data.observaciones.map((obs, idx) => (
                        <p key={idx} className="text-xs text-slate-700">▪️ [{obs.fecha}]: {obs.texto}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {documentoImprimir.tipo === 'FACTURA' && (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-base">
                    <p><strong>Remisión N°:</strong> <span className="font-black text-indigo-700">{documentoImprimir.data.numero_factura}</span></p>
                    <p><strong>Fecha:</strong> {documentoImprimir.data.fecha}</p>
                  </div>
                  <p><strong>Cliente:</strong> {documentoImprimir.data.cliente_nombre}</p>
                  <p><strong>Teléfono:</strong> {documentoImprimir.data.cliente_telefono || 'N/A'}</p>
                  <p><strong>Vendedor / Atendió:</strong> {documentoImprimir.data.usuario_creador || 'Sistema'}</p>

                  <table className="w-full text-left border border-slate-300 mt-3 text-sm">
                    <thead className="bg-slate-100">
                      <tr><th className="p-2.5 border">Descripción</th><th className="p-2.5 text-center border">Cant.</th><th className="p-2.5 text-right border">Precio</th></tr>
                    </thead>
                    <tbody>
                      {(documentoImprimir.data.items || []).map((it, idx) => (
                        <tr key={idx}><td className="p-2.5 border">{it.descripcion}</td><td className="p-2.5 text-center border">{it.cantidad}</td><td className="p-2.5 text-right border">$ {(it.precio || 0).toLocaleString('es-CO')}</td></tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="font-black text-emerald-700 text-xl text-right mt-3">Total a Pagar: $ {(documentoImprimir.data.total || 0).toLocaleString('es-CO')}</p>

                  {/* SECCIÓN DE GARANTÍA / SELLO FÍSICO */}
                  <div className="mt-6 pt-4 border-t-2 border-dashed border-slate-300 grid grid-cols-2 gap-6 text-xs">
                    <div className="border border-slate-300 p-3 rounded-lg h-24 flex flex-col justify-between">
                      <span className="font-bold text-slate-600 uppercase">Garantía del Servicio / Producto:</span>
                      <div className="border-b border-dotted border-slate-400 w-full mb-1"></div>
                      <div className="border-b border-dotted border-slate-400 w-full"></div>
                    </div>
                    <div className="border border-slate-300 p-3 rounded-lg h-24 flex flex-col items-center justify-end text-center">
                      <span className="text-[11px] text-slate-400 font-bold uppercase">Espacio para Sello / Firma</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-4 no-imprimir">
              <button onClick={() => setDocumentoImprimir(null)} className="text-slate-500 px-3">Cerrar</button>
              <button onClick={() => window.print()} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold">Imprimir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// PORTAL PÚBLICO (/portal)
// ==========================================
function PortalPublico() {
  const { empresa, ordenes } = useApp();
  const [codigoConsulta, setCodigoConsulta] = useState('');
  const [ordenConsultaResult, setOrdenConsultaResult] = useState(null);
  const [mostrarHistorialPortal, setMostrarHistorialPortal] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100 font-sans">
      <div className="max-w-xl w-full mx-auto bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl text-center space-y-4">
        {empresa.logoUrl ? (
          <img src={empresa.logoUrl} alt="Logo" className="w-32 h-32 object-contain mx-auto rounded-xl bg-slate-800 p-2 border border-slate-700 shadow-lg" />
        ) : (
          <div className="w-24 h-24 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-white text-3xl mx-auto shadow-lg shadow-indigo-600/30">TF</div>
        )}
        <h2 className="text-xl font-bold text-white mb-0">{empresa.nombre}</h2>
        <p className="text-xs text-slate-400">Portal Público de Consulta</p>
        
        <div className="flex gap-2">
          <input 
            placeholder="Ingresa tu Código (ej. TK-89A1)" 
            className="flex-1 bg-slate-800 border border-slate-700 p-3 rounded-xl text-sm font-bold font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white" 
            value={codigoConsulta} 
            onChange={e => setCodigoConsulta(e.target.value.toUpperCase())} 
          />
          <button 
            onClick={() => { 
              const res = ordenes.find(o => o.codigo_seguimiento && o.codigo_seguimiento.toUpperCase() === codigoConsulta.trim().toUpperCase()); 
              setOrdenConsultaResult(res || 'NO_ENCONTRADO'); 
              setMostrarHistorialPortal(false);
            }} 
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl font-bold text-xs transition"
          >
            Consultar
          </button>
        </div>

        {ordenConsultaResult && ordenConsultaResult !== 'NO_ENCONTRADO' && (
          <div className="text-left bg-slate-800/60 p-5 rounded-xl border border-slate-700 space-y-3 text-xs">
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
              <span className="font-bold text-indigo-400 text-sm">Estado: {ordenConsultaResult.estado}</span>
              <span className="font-mono text-[11px] text-amber-400">Código: {ordenConsultaResult.codigo_seguimiento}</span>
            </div>
            <p className="text-white"><strong>Equipo:</strong> {ordenConsultaResult.tipo_equipo} {ordenConsultaResult.marca_modelo}</p>
            <p className="text-white"><strong>Fallo Reportado:</strong> {ordenConsultaResult.fallo_reportado}</p>
            <p className="text-white"><strong>Diagnóstico Técnico:</strong> {ordenConsultaResult.diagnostico || 'Equipo en proceso de revisión.'}</p>
            
            {ordenConsultaResult.numero_factura_asociada && (
              <p className="text-white"><strong>Remisión Asociada:</strong> <span className="text-indigo-400 font-mono font-bold">{ordenConsultaResult.numero_factura_asociada}</span></p>
            )}

            {Number(ordenConsultaResult.valor_estimado) > 0 && (
              <p className="text-white"><strong>Presupuesto Estimado:</strong> $ {Number(ordenConsultaResult.valor_estimado).toLocaleString('es-CO')}</p>
            )}

            {Number(ordenConsultaResult.total_pagar) > 0 && (
              <p className="bg-emerald-950/40 border border-emerald-800/50 p-2.5 rounded-xl"><strong className="text-emerald-400">Total a Pagar:</strong> <span className="text-emerald-300 font-extrabold">$ {Number(ordenConsultaResult.total_pagar).toLocaleString('es-CO')}</span></p>
            )}

            {/* HISTORIAL DESPLEGABLE EN PORTAL PÚBLICO */}
            <div className="pt-2 border-t border-slate-700">
              <button 
                onClick={() => setMostrarHistorialPortal(!mostrarHistorialPortal)} 
                className="w-full flex justify-between items-center text-xs font-bold text-indigo-400 bg-slate-800 p-2.5 rounded-xl border border-slate-700 transition hover:bg-slate-700/80"
              >
                <span>📜 Ver historial de avances y procesos</span>
                <span>{mostrarHistorialPortal ? '▲' : '▼'}</span>
              </button>

              {mostrarHistorialPortal && (
                <div className="mt-2 space-y-1.5 p-3 bg-slate-900/90 rounded-xl border border-slate-800">
                  {(Array.isArray(ordenConsultaResult.observaciones) ? ordenConsultaResult.observaciones : []).length > 0 ? (
                    ordenConsultaResult.observaciones.map((obs, idx) => (
                      <p key={idx} className="text-[11px] text-slate-300">🔹 <span className="text-slate-500 font-mono">[{obs.fecha}]</span> {obs.texto}</p>
                    ))
                  ) : (
                    <p className="text-[11px] text-slate-500">Sin registros en el historial aún.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {ordenConsultaResult === 'NO_ENCONTRADO' && (
          <p className="text-xs text-amber-400 py-2">No se encontró ninguna orden con ese código.</p>
        )}

        {/* DATOS DE LA EMPRESA EN PORTAL PÚBLICO */}
        <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
          <p className="font-bold text-slate-300">{empresa.nombre}</p>
          {empresa.direccion && <p>📍 Dirección: {empresa.direccion}</p>}
          {empresa.telefono && <p>📞 Teléfono: {empresa.telefono}</p>}
          {empresa.email && <p>✉️ Correo: {empresa.email}</p>}
        </div>
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