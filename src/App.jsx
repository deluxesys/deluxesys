import React, { useState, useEffect, createContext, useContext } from 'react';

// ==========================================
// CONTEXTO DE DATOS, AUTENTICACIÓN Y ROLES
// ==========================================
const AppContext = createContext();

const ROLES_INICIALES = [
  {
    id: 'rol_admin',
    nombre: 'Superusuario / Admin',
    permisos: {
      crear_orden: true,
      editar_diagnostico: true,
      ver_clientes: true,
      editar_clientes: true,
      facturar: true,
      ver_configuracion: true
    }
  },
  {
    id: 'rol_tecnico',
    nombre: 'Técnico de Laboratorio',
    permisos: {
      crear_orden: true,
      editar_diagnostico: true,
      ver_clientes: false,
      editar_clientes: false,
      facturar: false,
      ver_configuracion: false
    }
  },
  {
    id: 'rol_recepcion',
    nombre: 'Recepción y Ventas',
    permisos: {
      crear_orden: true,
      editar_diagnostico: false,
      ver_clientes: true,
      editar_clientes: true,
      facturar: true,
      ver_configuracion: false
    }
  }
];

const USUARIOS_INICIALES = [
  { id: 'usr_1', nombre: 'Carlos Pérez', usuario: 'admin', clave: 'admin123', rolId: 'rol_admin' },
  { id: 'usr_2', nombre: 'Laura Martínez', usuario: 'tecnico', clave: 'tecnico123', rolId: 'rol_tecnico' },
  { id: 'usr_3', nombre: 'Andrés Gómez', usuario: 'recepcion', clave: '123456', rolId: 'rol_recepcion' }
];

const CLIENTES_INICIALES = [
  { id: 'cli_1', nombre: 'Juan Manuel Gómez', telefono: '3001234567', cedula: '1098765432', email: 'juan.gomez@email.com', direccion: 'Calle 15 #24-10' },
  { id: 'cli_2', nombre: 'María Fernanda Ríos', telefono: '3159876543', cedula: '1112223334', email: 'mf.rios@email.com', direccion: 'Av. 6N #12-40' }
];

const ORDENES_INICIALES = [
  {
    id: 'ord_1',
    numero_orden: 1001,
    codigo_seguimiento: 'TK-89A1',
    cliente_id: 'cli_1',
    cliente_nombre: 'Juan Manuel Gómez',
    cliente_telefono: '3001234567',
    tipo_equipo: 'PORTATIL',
    marca_modelo: 'Lenovo ThinkPad X1',
    serie: 'LNV-883921',
    fallo_reportado: 'El equipo no enciende y se sobrecalienta.',
    diagnostico: 'Cortocircuito en la línea principal de 19V.',
    estado: 'En Diagnóstico',
    tecnico: 'Carlos Pérez',
    valor_estimado: 180000,
    fecha: '11/10/2026, 09:30 AM',
    observaciones: [{ fecha: '11/10/2026 09:30 AM', texto: 'Equipo ingresado a laboratorio.' }]
  }
];

const FACTURAS_INICIALES = [
  {
    id: 'fac_1',
    numero_factura: 'FAC-1001',
    cliente_nombre: 'María Fernanda Ríos',
    fecha: '2026-10-11',
    items: [{ descripcion: 'Mantenimiento Preventivo PC Gamer', cantidad: 1, precio: 95000 }],
    total: 95000,
    tipo: 'Venta Directa'
  }
];

export function AppProvider({ children }) {
  const [empresa, setEmpresa] = useState(() => {
    const saved = localStorage.getItem('techfix_empresa');
    return saved ? JSON.parse(saved) : {
      nombre: 'TechFix Soluciones Integrales',
      nit: '901.456.789-1',
      telefono: '+57 300 987 6543',
      direccion: 'Av. Comercial #45-12, Local 3, Cali',
      logoUrl: ''
    };
  });

  const [roles, setRoles] = useState(() => {
    const saved = localStorage.getItem('techfix_roles');
    return saved ? JSON.parse(saved) : ROLES_INICIALES;
  });

  const [usuarios, setUsuarios] = useState(() => {
    const saved = localStorage.getItem('techfix_usuarios');
    return saved ? JSON.parse(saved) : USUARIOS_INICIALES;
  });

  const [usuarioSesion, setUsuarioSesion] = useState(() => {
    const saved = localStorage.getItem('techfix_sesion');
    return saved ? JSON.parse(saved) : null;
  });

  const [clientes, setClientes] = useState(() => {
    const saved = localStorage.getItem('techfix_clientes');
    return saved ? JSON.parse(saved) : CLIENTES_INICIALES;
  });

  const [ordenes, setOrdenes] = useState(() => {
    const saved = localStorage.getItem('techfix_ordenes');
    return saved ? JSON.parse(saved) : ORDENES_INICIALES;
  });

  const [facturas, setFacturas] = useState(() => {
    const saved = localStorage.getItem('techfix_facturas');
    return saved ? JSON.parse(saved) : FACTURAS_INICIALES;
  });

  useEffect(() => localStorage.setItem('techfix_empresa', JSON.stringify(empresa)), [empresa]);
  useEffect(() => localStorage.setItem('techfix_roles', JSON.stringify(roles)), [roles]);
  useEffect(() => localStorage.setItem('techfix_usuarios', JSON.stringify(usuarios)), [usuarios]);
  useEffect(() => localStorage.setItem('techfix_clientes', JSON.stringify(clientes)), [clientes]);
  useEffect(() => localStorage.setItem('techfix_ordenes', JSON.stringify(ordenes)), [ordenes]);
  useEffect(() => localStorage.setItem('techfix_facturas', JSON.stringify(facturas)), [facturas]);
  useEffect(() => localStorage.setItem('techfix_sesion', JSON.stringify(usuarioSesion)), [usuarioSesion]);

  const login = (usr, pwd) => {
    const encontrado = usuarios.find(u => u.usuario.toLowerCase() === usr.toLowerCase() && u.clave === pwd);
    if (encontrado) {
      setUsuarioSesion(encontrado);
      return true;
    }
    return false;
  };

  const logout = () => setUsuarioSesion(null);

  const rolActual = usuarioSesion ? roles.find(r => r.id === usuarioSesion.rolId) || roles[0] : null;

  const generarCodigoSeguimiento = () => 'TK-' + Math.random().toString(36).substring(2, 6).toUpperCase();

  const agregarCliente = (data) => {
    const nuevo = { id: 'cli_' + Date.now(), ...data };
    setClientes(prev => [nuevo, ...prev]);
    return nuevo;
  };

  const modificarCliente = (id, data) => {
    setClientes(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  };

  const agregarOrden = (ordenData, clienteSeleccionado) => {
    const num = ordenes.length > 0 ? Math.max(...ordenes.map(o => o.numero_orden)) + 1 : 1001;
    const nueva = {
      id: 'ord_' + Date.now(),
      numero_orden: num,
      codigo_seguimiento: generarCodigoSeguimiento(),
      cliente_id: clienteSeleccionado.id,
      cliente_nombre: clienteSeleccionado.nombre,
      cliente_telefono: clienteSeleccionado.telefono,
      tecnico: usuarioSesion ? usuarioSesion.nombre : 'Técnico',
      fecha: new Date().toLocaleString('es-CO'),
      estado: 'Ingresado',
      observaciones: [{ fecha: new Date().toLocaleString('es-CO'), texto: 'Orden de entrada registrada.' }],
      ...ordenData
    };
    setOrdenes(prev => [nueva, ...prev]);
    return nueva;
  };

  const actualizarOrden = (id, estado, obs, diag, costo) => {
    setOrdenes(prev => prev.map(o => {
      if (o.id === id) {
        const obsArr = [...(o.observaciones || [])];
        if (obs && obs.trim()) obsArr.push({ fecha: new Date().toLocaleString('es-CO'), texto: obs });
        return {
          ...o,
          estado,
          diagnostico: diag !== undefined ? diag : o.diagnostico,
          valor_estimado: costo !== undefined ? Number(costo) : o.valor_estimado,
          observaciones: obsArr
        };
      }
      return o;
    }));
  };

  const facturarOrden = (orden) => {
    const nuevaFac = {
      id: 'fac_' + Date.now(),
      numero_factura: `FAC-${1000 + facturas.length + 1}`,
      cliente_nombre: orden.cliente_nombre,
      fecha: new Date().toISOString().split('T')[0],
      items: [{ descripcion: `Servicio Técnico Orden #${orden.numero_orden} (${orden.tipo_equipo} ${orden.marca_modelo})`, cantidad: 1, precio: orden.valor_estimado || 0 }],
      total: orden.valor_estimado || 0,
      tipo: 'Servicio Técnico'
    };
    setFacturas(prev => [nuevaFac, ...prev]);
    actualizarOrden(orden.id, 'Entregado / Facturado', 'Servicio entregado y cobrado.', orden.diagnostico, orden.valor_estimado);
    return nuevaFac;
  };

  const agregarVentaDirecta = (clienteNombre, itemsArray, totalCalculado) => {
    const nuevaFac = {
      id: 'fac_' + Date.now(),
      numero_factura: `FAC-${1000 + facturas.length + 1}`,
      cliente_nombre: clienteNombre || 'Cliente Mostrador',
      fecha: new Date().toISOString().split('T')[0],
      items: itemsArray,
      total: totalCalculado,
      tipo: 'Venta de Repuestos'
    };
    setFacturas(prev => [nuevaFac, ...prev]);
    return nuevaFac;
  };

  const agregarRol = (nombreRol, permisosObj) => {
    const nuevoRol = { id: 'rol_' + Date.now(), nombre: nombreRol, permisos: permisosObj };
    setRoles(prev => [...prev, nuevoRol]);
  };

  const agregarUsuario = (data) => {
    const nuevoUsr = { id: 'usr_' + Date.now(), ...data };
    setUsuarios(prev => [...prev, nuevoUsr]);
  };

  return (
    <AppContext.Provider value={{
      empresa, setEmpresa, roles, agregarRol, usuarios, agregarUsuario,
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
    if (login(usr, pwd)) {
      setError(false);
    } else {
      setError(true);
    }
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
            <input
              type="text"
              placeholder="Ej. admin"
              className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={usr}
              onChange={e => setUsr(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={pwd}
              onChange={e => setPwd(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-rose-400 text-[11px] font-bold text-center">Usuario o contraseña incorrectos.</p>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 font-bold py-3 rounded-xl text-xs text-white transition shadow-lg shadow-indigo-600/30"
          >
            Iniciar Sesión
          </button>
        </form>

        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <p className="font-bold text-slate-300">🔑 Credenciales de Prueba por Defecto:</p>
          <p>• Admin: <span className="text-indigo-300 font-mono">admin</span> / <span className="text-indigo-300 font-mono">admin123</span></p>
          <p>• Técnico: <span className="text-indigo-300 font-mono">tecnico</span> / <span className="text-indigo-300 font-mono">tecnico123</span></p>
          <p>• Recepción: <span className="text-indigo-300 font-mono">recepcion</span> / <span className="text-indigo-300 font-mono">123456</span></p>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// APLICACIÓN PRINCIPAL CON PERMISOS
// ==========================================
function MainApp() {
  const {
    empresa, clientes, ordenes, facturas, roles, agregarRol, usuarios, agregarUsuario,
    usuarioSesion, logout, rolActual,
    agregarCliente, modificarCliente, agregarOrden, actualizarOrden,
    facturarOrden, agregarVentaDirecta, setEmpresa
  } = useApp();

  const [tab, setTab] = useState('ordenes');

  // Modales
  const [modalEditOrden, setModalEditOrden] = useState(null);
  const [modalEditCliente, setModalEditCliente] = useState(null);
  const [verHistorialCliente, setVerHistorialCliente] = useState(null);
  const [modalVenta, setModalVenta] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [documentoImprimir, setDocumentoImprimir] = useState(null);

  // Formulario Creación Orden
  const [tipoClienteOpt, setTipoClienteOpt] = useState('EXISTENTE');
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [formNuevoCliente, setFormNuevoCliente] = useState({ nombre: '', telefono: '', cedula: '', email: '', direccion: '' });
  const [formOrden, setFormOrden] = useState({ tipo_equipo: 'PORTATIL', marca_modelo: '', serie: '', fallo_reportado: '', valor_estimado: 0 });

  // Formulario Modificar Orden
  const [editOrdForm, setEditOrdForm] = useState({ estado: '', observacion: '', diagnostico: '', costo: 0 });

  // Formulario Venta Directa
  const [clienteVenta, setClienteVenta] = useState('');
  const [itemsVenta, setItemsVenta] = useState([{ descripcion: '', cantidad: 1, precio: 0 }]);

  // Buscador Portal Cliente
  const [codigoConsulta, setCodigoConsulta] = useState('');
  const [ordenConsultaResult, setOrdenConsultaResult] = useState(null);

  // Formulario Crear Usuario / Rol
  const [formNuevoRol, setFormNuevoRol] = useState({ nombre: '', permisos: { crear_orden: true, editar_diagnostico: true, ver_clientes: false, editar_clientes: false, facturar: false, ver_configuracion: false } });
  const [formUsuarioNuevo, setFormUsuarioNuevo] = useState({ nombre: '', usuario: '', clave: '', rolId: roles[0]?.id || '' });

  const clientesFiltradosBusqueda = clientes.filter(c =>
    c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
    c.telefono.includes(busquedaCliente)
  );

  const enviarWhatsApp = (orden) => {
    const msg = `Hola *${orden.cliente_nombre}* 👋. Te saludamos de *${empresa.nombre}*.\nTu equipo *${orden.tipo_equipo} ${orden.marca_modelo}* se encuentra en estado: *${orden.estado}*.\n\nPuedes consultar el avance usando tu *Código Único: ${orden.codigo_seguimiento}*.`;
    window.open(`https://wa.me/57${orden.cliente_telefono}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const exportarClientesCSV = () => {
    let csv = 'Nombre,Telefono,Cedula,Email,Direccion\n';
    clientes.forEach(c => csv += `"${c.nombre}","${c.telefono}","${c.cedula || ''}","${c.email || ''}","${c.direccion || ''}"\n`);
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `clientes_techfix_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEmpresa({ ...empresa, logoUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const permisos = rolActual ? rolActual.permisos : {};

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
            {permisos.crear_orden && (
              <button onClick={() => setTab('nueva_orden')} className={`w-full text-left p-3 rounded-xl transition ${tab === 'nueva_orden' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800'}`}>➕ Nueva Orden de Entrada</button>
            )}
            <button onClick={() => setTab('ordenes')} className={`w-full text-left p-3 rounded-xl transition ${tab === 'ordenes' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800'}`}>🛠️ Reparaciones y Estado</button>
            {permisos.ver_clientes && (
              <button onClick={() => setTab('clientes')} className={`w-full text-left p-3 rounded-xl transition ${tab === 'clientes' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800'}`}>👥 Directorio de Clientes</button>
            )}
            {permisos.facturar && (
              <button onClick={() => setTab('facturacion')} className={`w-full text-left p-3 rounded-xl transition ${tab === 'facturacion' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800'}`}>🧾 Facturación y Ventas</button>
            )}
            <button onClick={() => setTab('portal')} className={`w-full text-left p-3 rounded-xl transition ${tab === 'portal' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800'}`}>🔍 Portal Consulta Cliente</button>
            {permisos.ver_configuracion && (
              <button onClick={() => setTab('config')} className={`w-full text-left p-3 rounded-xl transition ${tab === 'config' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-800'}`}>⚙️ Configuración & Permisos</button>
            )}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800 text-xs space-y-2">
          <div>
            <p className="text-white font-bold">{usuarioSesion?.nombre}</p>
            <p className="text-[10px] text-indigo-400 font-semibold">{rolActual?.nombre}</p>
          </div>
          <button onClick={logout} className="w-full bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-300 font-bold p-2 rounded-xl text-center transition border border-slate-700">
            🚪 Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO */}
      <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full no-imprimir">

        {/* 1. CREACIÓN DE NUEVA ORDEN */}
        {tab === 'nueva_orden' && permisos.crear_orden && (
          <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl space-y-5">
            <h2 className="text-xl font-bold text-white border-b border-slate-800 pb-3">Registrar Orden de Entrada</h2>

            <div className="space-y-3">
              <label className="text-xs font-bold text-indigo-400 uppercase">1. Selección de Cliente</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setTipoClienteOpt('EXISTENTE'); setClienteSeleccionado(null); }}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition ${tipoClienteOpt === 'EXISTENTE' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                >
                  Buscar Cliente Existente
                </button>
                <button
                  type="button"
                  onClick={() => { setTipoClienteOpt('NUEVO'); setClienteSeleccionado(null); }}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition ${tipoClienteOpt === 'NUEVO' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                >
                  + Registrar Cliente Nuevo
                </button>
              </div>

              {tipoClienteOpt === 'EXISTENTE' && (
                <div className="space-y-2 pt-2">
                  {!clienteSeleccionado ? (
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Escribe para buscar por Nombre o Celular..."
                        className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={busquedaCliente}
                        onChange={e => setBusquedaCliente(e.target.value)}
                      />
                      {busquedaCliente.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-20 max-h-40 overflow-y-auto">
                          {clientesFiltradosBusqueda.length > 0 ? (
                            clientesFiltradosBusqueda.map(c => (
                              <div
                                key={c.id}
                                onClick={() => { setClienteSeleccionado(c); setBusquedaCliente(''); }}
                                className="p-2.5 hover:bg-slate-700 cursor-pointer text-xs border-b border-slate-700/50 last:border-0"
                              >
                                <p className="font-bold text-white">{c.nombre}</p>
                                <p className="text-[11px] text-indigo-400">Tel: {c.telefono} {c.cedula ? `| CC: ${c.cedula}` : ''}</p>
                              </div>
                            ))
                          ) : (
                            <p className="p-3 text-xs text-slate-500">No se encontraron coincidencias.</p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-indigo-950/60 border border-indigo-700/60 p-3 rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-white">{clienteSeleccionado.nombre}</p>
                        <p className="text-indigo-300">Tel: {clienteSeleccionado.telefono} | Doc: {clienteSeleccionado.cedula || 'N/A'}</p>
                      </div>
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
              onClick={() => {
                let targetClient = clienteSeleccionado;
                if (tipoClienteOpt === 'NUEVO') {
                  if (!formNuevoCliente.nombre || !formNuevoCliente.telefono) return alert('Ingresa el nombre y teléfono del cliente.');
                  targetClient = agregarCliente(formNuevoCliente);
                }
                if (!targetClient) return alert('Selecciona o registra un cliente.');
                if (!formOrden.marca_modelo || !formOrden.fallo_reportado) return alert('Completa los datos del equipo.');

                const nueva = agregarOrden(formOrden, targetClient);
                alert(`¡Orden #${nueva.numero_orden} registrada!\nCódigo Cliente: ${nueva.codigo_seguimiento}`);
                setDocumentoImprimir({ tipo: 'ORDEN', data: nueva });
                setTab('ordenes');
                setClienteSeleccionado(null);
                setFormNuevoCliente({ nombre: '', telefono: '', cedula: '', email: '', direccion: '' });
                setFormOrden({ tipo_equipo: 'PORTATIL', marca_modelo: '', serie: '', fallo_reportado: '', valor_estimado: 0 });
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-500 font-bold py-3 rounded-xl text-xs transition shadow-lg shadow-indigo-600/30"
            >
              Guardar e Imprimir Orden
            </button>
          </div>
        )}

        {/* 2. TABLA REPARACIONES Y DIAGNÓSTICO */}
        {tab === 'ordenes' && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <h2 className="text-xl font-bold text-white">Seguimiento de Reparaciones y Estado</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800 text-slate-400 uppercase">
                  <tr>
                    <th className="p-3">Orden Interna</th>
                    <th className="p-3">Código Cliente</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Equipo</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3">Presupuesto</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {ordenes.map(o => (
                    <tr key={o.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-indigo-400">#{o.numero_orden}</td>
                      <td className="p-3 font-mono text-xs text-amber-400 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-800/40">{o.codigo_seguimiento}</td>
                      <td className="p-3 font-medium text-white">{o.cliente_nombre}<span className="block text-[10px] text-slate-500">{o.cliente_telefono}</span></td>
                      <td className="p-3">{o.tipo_equipo} - {o.marca_modelo}</td>
                      <td className="p-3"><span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold">{o.estado}</span></td>
                      <td className="p-3 font-bold text-white">$ {(o.valor_estimado || 0).toLocaleString('es-CO')}</td>
                      <td className="p-3 text-right space-x-1">
                        {permisos.editar_diagnostico && (
                          <button onClick={() => { setModalEditOrden(o); setEditOrdForm({ estado: o.estado, observacion: '', diagnostico: o.diagnostico || '', costo: o.valor_estimado || 0 }); }} className="bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded text-[11px]">✏️ Diagnóstico</button>
                        )}
                        <button onClick={() => enviarWhatsApp(o)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded text-[11px]">💬 WhatsApp</button>
                        <button onClick={() => setDocumentoImprimir({ tipo: 'ORDEN', data: o })} className="bg-slate-800 hover:bg-slate-700 text-white px-2 py-1 rounded text-[11px]">🖨️ PDF</button>
                        {o.estado === 'Reparado / Listo' && permisos.facturar && (
                          <button onClick={() => { const fac = facturarOrden(o); alert('¡Orden facturada!'); setDocumentoImprimir({ tipo: 'FACTURA', data: fac }); }} className="bg-emerald-500 text-white px-2 py-1 rounded text-[11px] font-bold">💵 Facturar</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. DIRECTORIO DE CLIENTES */}
        {tab === 'clientes' && permisos.ver_clientes && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Directorio de Clientes</h2>
              <div className="space-x-2">
                <button onClick={exportarClientesCSV} className="bg-slate-800 text-slate-200 px-3 py-1.5 rounded-xl text-xs">📊 Exportar Excel</button>
                {permisos.editar_clientes && (
                  <button onClick={() => { setModalEditCliente({}); setFormNuevoCliente({ nombre: '', telefono: '', cedula: '', email: '', direccion: '' }); }} className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold">+ Nuevo Cliente</button>
                )}
              </div>
            </div>
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800 text-slate-400 uppercase">
                <tr>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Teléfono</th>
                  <th className="p-3">Cédula / NIT</th>
                  <th className="p-3">Dirección</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {clientes.map(c => (
                  <tr key={c.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-white">{c.nombre}</td>
                    <td className="p-3 text-indigo-400">{c.telefono}</td>
                    <td className="p-3">{c.cedula || '-'}</td>
                    <td className="p-3 text-slate-400">{c.direccion || '-'}</td>
                    <td className="p-3 text-right space-x-1">
                      {permisos.editar_clientes && (
                        <button onClick={() => { setModalEditCliente(c); setFormNuevoCliente(c); }} className="bg-slate-800 text-white px-2 py-1 rounded text-[11px]">✏️ Editar</button>
                      )}
                      <button onClick={() => setVerHistorialCliente(c)} className="bg-indigo-600 text-white px-2 py-1 rounded text-[11px]">📜 Historial</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. FACTURACIÓN Y VENTAS */}
        {tab === 'facturacion' && permisos.facturar && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Facturación y Ventas de Mostrador</h2>
              <button onClick={() => setModalVenta(true)} className="bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold">+ Venta Directa de Repuesto</button>
            </div>
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800 text-slate-400 uppercase">
                <tr>
                  <th className="p-3">Factura</th>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Total</th>
                  <th className="p-3 text-right">Detalle / Impresión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {facturas.map(f => (
                  <tr key={f.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-emerald-400">{f.numero_factura}</td>
                    <td className="p-3 text-slate-400">{f.fecha}</td>
                    <td className="p-3 font-medium text-white">{f.cliente_nombre}</td>
                    <td className="p-3">{f.tipo}</td>
                    <td className="p-3 font-extrabold text-white">$ {f.total.toLocaleString('es-CO')}</td>
                    <td className="p-3 text-right space-x-1">
                      <button onClick={() => setFacturaSeleccionada(f)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded text-[11px]">👁️ Ver Ítems</button>
                      <button onClick={() => setDocumentoImprimir({ tipo: 'FACTURA', data: f })} className="bg-slate-800 hover:bg-slate-700 text-white px-2 py-1 rounded text-[11px]">🖨️ PDF</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. PORTAL DEL CLIENTE */}
        {tab === 'portal' && (
          <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4 text-center">
            {empresa.logoUrl && <img src={empresa.logoUrl} alt="Logo" className="w-16 h-16 object-contain mx-auto rounded-xl bg-slate-800 p-1 border border-slate-700" />}
            <h2 className="text-xl font-bold text-white">{empresa.nombre}</h2>
            <p className="text-xs text-slate-400">Portal Público de Consulta de Estado de Reparación</p>
            <div className="flex gap-2">
              <input
                placeholder="Ingresa tu Código de Consulta (ej. TK-89A1)"
                className="flex-1 bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-xs text-white text-center font-bold font-mono tracking-wider uppercase"
                value={codigoConsulta}
                onChange={e => setCodigoConsulta(e.target.value)}
              />
              <button
                onClick={() => {
                  const clean = codigoConsulta.trim().toUpperCase();
                  const res = ordenes.find(o => o.codigo_seguimiento.toUpperCase() === clean);
                  setOrdenConsultaResult(res || 'NO_ENCONTRADO');
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold"
              >
                Consultar
              </button>
            </div>

            {ordenConsultaResult && ordenConsultaResult !== 'NO_ENCONTRADO' && (
              <div className="text-left bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-2 text-xs">
                <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                  <span className="font-bold text-indigo-400">Estado: {ordenConsultaResult.estado}</span>
                  <span className="font-mono text-[11px] text-amber-400">Código: {ordenConsultaResult.codigo_seguimiento}</span>
                </div>
                <p><strong className="text-white">Equipo:</strong> {ordenConsultaResult.tipo_equipo} {ordenConsultaResult.marca_modelo}</p>
                <p><strong className="text-white">Diagnóstico Técnico:</strong> {ordenConsultaResult.diagnostico || 'Equipo en proceso de revisión.'}</p>
                <p><strong className="text-white">Presupuesto Estimado:</strong> $ {(ordenConsultaResult.valor_estimado || 0).toLocaleString('es-CO')}</p>

                <div className="pt-2 border-t border-slate-700/60 space-y-1">
                  <p className="font-bold text-slate-400 text-[11px]">Bitácora de Avance:</p>
                  {(ordenConsultaResult.observaciones || []).map((obs, idx) => (
                    <div key={idx} className="text-[11px] text-slate-300">
                      <span className="text-slate-500">{obs.fecha}:</span> {obs.texto}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {ordenConsultaResult === 'NO_ENCONTRADO' && <p className="text-xs text-amber-400">No se encontró ninguna orden con ese código.</p>}
          </div>
        )}

        {/* 6. CONFIGURACIÓN DEL NEGOCIO Y CONTROL DE ROLES */}
        {tab === 'config' && permisos.ver_configuracion && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
              <h2 className="text-xl font-bold text-white border-b border-slate-800 pb-2">Perfil de la Empresa & Branding</h2>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400">Logo de la Empresa</label>
                  <div className="flex items-center gap-3 mt-1">
                    {empresa.logoUrl ? (
                      <img src={empresa.logoUrl} alt="Logo Prev" className="w-12 h-12 object-contain bg-slate-800 border rounded-lg p-1" />
                    ) : (
                      <div className="w-12 h-12 bg-slate-800 border rounded-lg flex items-center justify-center text-xs text-slate-500">Sin Logo</div>
                    )}
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400">Nombre de la Empresa</label>
                    <input className="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-white" value={empresa.nombre} onChange={e => setEmpresa({ ...empresa, nombre: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-slate-400">NIT / Cédula Fiscal</label>
                    <input className="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-white" value={empresa.nit} onChange={e => setEmpresa({ ...empresa, nit: e.target.value })} />
                  </div>
                </div>
                <button onClick={() => alert('¡Branding actualizado!')} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold">Guardar Cambios Empresa</button>
              </div>
            </div>

            {/* ADMINISTRADOR DE ROLES Y PERMISOS */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
              <h2 className="text-xl font-bold text-white border-b border-slate-800 pb-2">Gestión de Roles y Permisos de Usuarios</h2>
              
              {/* CREAR ROLES */}
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                <p className="font-bold text-indigo-400 uppercase">Crear Nuevo Perfil / Rol</p>
                <input placeholder="Nombre del Rol (ej. Cajero, Practicante)" className="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-white" value={formNuevoRol.nombre} onChange={e => setFormNuevoRol({ ...formNuevoRol, nombre: e.target.value })} />
                
                <div className="grid grid-cols-2 gap-2 pt-1 text-slate-300">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={formNuevoRol.permisos.crear_orden} onChange={e => setFormNuevoRol({ ...formNuevoRol, permisos: { ...formNuevoRol.permisos, crear_orden: e.target.checked } })} /> Crear Órdenes</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={formNuevoRol.permisos.editar_diagnostico} onChange={e => setFormNuevoRol({ ...formNuevoRol, permisos: { ...formNuevoRol.permisos, editar_diagnostico: e.target.checked } })} /> Modificar Diagnóstico</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={formNuevoRol.permisos.ver_clientes} onChange={e => setFormNuevoRol({ ...formNuevoRol, permisos: { ...formNuevoRol.permisos, ver_clientes: e.target.checked } })} /> Ver Clientes</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={formNuevoRol.permisos.editar_clientes} onChange={e => setFormNuevoRol({ ...formNuevoRol, permisos: { ...formNuevoRol.permisos, editar_clientes: e.target.checked } })} /> Editar Clientes</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={formNuevoRol.permisos.facturar} onChange={e => setFormNuevoRol({ ...formNuevoRol, permisos: { ...formNuevoRol.permisos, facturar: e.target.checked } })} /> Facturar y Ventas</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={formNuevoRol.permisos.ver_configuracion} onChange={e => setFormNuevoRol({ ...formNuevoRol, permisos: { ...formNuevoRol.permisos, ver_configuracion: e.target.checked } })} /> Acceder Configuración</label>
                </div>

                <button onClick={() => {
                  if (!formNuevoRol.nombre) return alert('Ingresa un nombre para el perfil.');
                  agregarRol(formNuevoRol.nombre, formNuevoRol.permisos);
                  alert('¡Nuevo Perfil / Rol creado!');
                  setFormNuevoRol({ nombre: '', permisos: { crear_orden: true, editar_diagnostico: true, ver_clientes: false, editar_clientes: false, facturar: false, ver_configuracion: false } });
                }} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold">Guardar Perfil</button>
              </div>

              {/* CREAR USUARIOS */}
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
                <p className="font-bold text-indigo-400 uppercase">Registrar Nuevo Empleado / Usuario</p>
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Nombre Completo" className="bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-white" value={formUsuarioNuevo.nombre} onChange={e => setFormUsuarioNuevo({ ...formUsuarioNuevo, nombre: e.target.value })} />
                  <input placeholder="Usuario para Login" className="bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-white" value={formUsuarioNuevo.usuario} onChange={e => setFormUsuarioNuevo({ ...formUsuarioNuevo, usuario: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="password" placeholder="Contraseña" className="bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-white" value={formUsuarioNuevo.clave} onChange={e => setFormUsuarioNuevo({ ...formUsuarioNuevo, clave: e.target.value })} />
                  <select className="bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-white" value={formUsuarioNuevo.rolId} onChange={e => setFormUsuarioNuevo({ ...formUsuarioNuevo, rolId: e.target.value })}>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.nombre}</option>
                    ))}
                  </select>
                </div>
                <button onClick={() => {
                  if (!formUsuarioNuevo.nombre || !formUsuarioNuevo.usuario || !formUsuarioNuevo.clave) return alert('Completa los campos.');
                  agregarUsuario(formUsuarioNuevo);
                  alert('¡Usuario registrado exitosamente!');
                  setFormUsuarioNuevo({ nombre: '', usuario: '', clave: '', rolId: roles[0]?.id || '' });
                }} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold">Crear Usuario</button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* MODAL EDITAR DIAGNÓSTICO */}
      {modalEditOrden && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 no-imprimir">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md p-6 rounded-2xl space-y-3">
            <h3 className="font-bold text-white text-base">Modificar Orden #{modalEditOrden.numero_orden}</h3>
            <div>
              <label className="text-xs text-slate-400">Estado del Trabajo</label>
              <select className="w-full bg-slate-800 border border-slate-700 p-2 rounded-xl text-xs text-white" value={editOrdForm.estado} onChange={e => setEditOrdForm({ ...editOrdForm, estado: e.target.value })}>
                <option value="Ingresado">Ingresado</option>
                <option value="En Diagnóstico">En Diagnóstico</option>
                <option value="Esperando Repuesto">Esperando Repuesto</option>
                <option value="Reparado / Listo">Reparado / Listo</option>
                <option value="Entregado / Facturado">Entregado / Facturado</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400">Diagnóstico Técnico General</label>
              <textarea className="w-full bg-slate-800 border border-slate-700 p-2 rounded-xl text-xs text-white" rows={2} value={editOrdForm.diagnostico} onChange={e => setEditOrdForm({ ...editOrdForm, diagnostico: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-slate-400">Agregar Nueva Observación al Historial</label>
              <input className="w-full bg-slate-800 border border-slate-700 p-2 rounded-xl text-xs text-white" placeholder="Ej. Cambio de transistor realizado..." value={editOrdForm.observacion} onChange={e => setEditOrdForm({ ...editOrdForm, observacion: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-slate-400">Costo / Presupuesto Final ($ COP)</label>
              <input type="number" className="w-full bg-slate-800 border border-slate-700 p-2 rounded-xl text-xs text-white" value={editOrdForm.costo} onChange={e => setEditOrdForm({ ...editOrdForm, costo: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setModalEditOrden(null)} className="text-xs text-slate-400 px-3 py-1">Cancelar</button>
              <button onClick={() => { actualizarOrden(modalEditOrden.id, editOrdForm.estado, editOrdForm.observacion, editOrdForm.diagnostico, editOrdForm.costo); setModalEditOrden(null); }} className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-xs font-bold">Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR / CREAR CLIENTE */}
      {modalEditCliente && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 no-imprimir">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md p-6 rounded-2xl space-y-3">
            <h3 className="font-bold text-white text-base">{modalEditCliente.id ? 'Modificar Cliente' : 'Nuevo Cliente'}</h3>
            <input placeholder="Nombre" className="w-full bg-slate-800 border border-slate-700 p-2 rounded-xl text-xs text-white" value={formNuevoCliente.nombre} onChange={e => setFormNuevoCliente({ ...formNuevoCliente, nombre: e.target.value })} />
            <input placeholder="Teléfono" className="w-full bg-slate-800 border border-slate-700 p-2 rounded-xl text-xs text-white" value={formNuevoCliente.telefono} onChange={e => setFormNuevoCliente({ ...formNuevoCliente, telefono: e.target.value })} />
            <input placeholder="Cédula" className="w-full bg-slate-800 border border-slate-700 p-2 rounded-xl text-xs text-white" value={formNuevoCliente.cedula} onChange={e => setFormNuevoCliente({ ...formNuevoCliente, cedula: e.target.value })} />
            <input placeholder="Dirección" className="w-full bg-slate-800 border border-slate-700 p-2 rounded-xl text-xs text-white" value={formNuevoCliente.direccion} onChange={e => setFormNuevoCliente({ ...formNuevoCliente, direccion: e.target.value })} />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setModalEditCliente(null)} className="text-xs text-slate-400 px-3 py-1">Cancelar</button>
              <button onClick={() => {
                if (modalEditCliente.id) modificarCliente(modalEditCliente.id, formNuevoCliente);
                else agregarCliente(formNuevoCliente);
                setModalEditCliente(null);
              }} className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-xs font-bold">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLE DE FACTURA */}
      {facturaSeleccionada && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 no-imprimir">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="font-bold text-white text-base">Detalle de {facturaSeleccionada.numero_factura}</h3>
              <span className="text-xs font-bold text-emerald-400">{facturaSeleccionada.fecha}</span>
            </div>
            <p className="text-xs text-slate-300"><strong>Cliente:</strong> {facturaSeleccionada.cliente_nombre}</p>
            <p className="text-xs text-slate-300"><strong>Tipo Operación:</strong> {facturaSeleccionada.tipo}</p>

            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800 text-slate-400">
                  <tr>
                    <th className="p-2">Ítem</th>
                    <th className="p-2 text-center">Cant.</th>
                    <th className="p-2 text-right">Precio</th>
                  </tr>
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
              <span className="font-bold text-xs text-white">Total Cobrado:</span>
              <span className="font-extrabold text-indigo-400 text-base">$ {(facturaSeleccionada.total || 0).toLocaleString('es-CO')}</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setFacturaSeleccionada(null)} className="bg-slate-800 text-white px-4 py-1.5 rounded-xl text-xs font-bold">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VENTA DIRECTA */}
      {modalVenta && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 no-imprimir">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-white text-base">Emitir Venta Directa / Repuesto</h3>
            <input placeholder="Nombre del Cliente" className="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-xl text-xs text-white" value={clienteVenta} onChange={e => setClienteVenta(e.target.value)} />

            <div className="space-y-2">
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
              <span className="font-bold text-xs text-white">Total Calculado:</span>
              <span className="font-extrabold text-emerald-400 text-base">$ {itemsVenta.reduce((acc, i) => acc + (i.cantidad * i.precio), 0).toLocaleString('es-CO')}</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setModalVenta(false)} className="text-xs text-slate-400 px-3 py-1">Cancelar</button>
              <button onClick={() => {
                const total = itemsVenta.reduce((acc, i) => acc + (i.cantidad * i.precio), 0);
                if (total <= 0) return alert('Ingresa ítems con precio mayor a 0');
                const fac = agregarVentaDirecta(clienteVenta, itemsVenta, total);
                setModalVenta(false);
                alert('¡Venta realizada!');
                setDocumentoImprimir({ tipo: 'FACTURA', data: fac });
              }} className="bg-emerald-600 text-white px-4 py-1.5 rounded-xl text-xs font-bold">Generar Factura</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HISTORIAL DE CLIENTE */}
      {verHistorialCliente && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 no-imprimir">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg p-6 rounded-2xl space-y-3">
            <h3 className="font-bold text-white text-base">Historial: <span className="text-indigo-400">{verHistorialCliente.nombre}</span></h3>
            <div className="space-y-2 text-xs">
              <p className="font-bold text-slate-400 uppercase">Órdenes Técnicas:</p>
              {ordenes.filter(o => o.cliente_id === verHistorialCliente.id || o.cliente_nombre === verHistorialCliente.nombre).map(o => (
                <div key={o.id} className="p-2 bg-slate-800 rounded border border-slate-700">
                  <p className="font-bold text-white">Orden #{o.numero_orden} (Código Cliente: {o.codigo_seguimiento})</p>
                  <p className="text-slate-400">{o.tipo_equipo} {o.marca_modelo} | Estado: {o.estado}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setVerHistorialCliente(null)} className="bg-slate-800 text-white px-4 py-1.5 rounded-xl text-xs">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* DOCUMENTO IMPRESO EN CARTA Y PDF */}
      {documentoImprimir && (
        <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center p-4 z-50">
          <div className="bg-white text-slate-900 w-full max-w-xl p-8 rounded-2xl space-y-4 shadow-2xl">
            <div id="seccion-impresion" className="space-y-4">
              <div className="border-b pb-4 flex justify-between items-start">
                <div className="flex gap-3 items-center">
                  {empresa.logoUrl && <img src={empresa.logoUrl} alt="Logo" className="w-14 h-14 object-contain" />}
                  <div>
                    <h1 className="font-black text-xl text-slate-900">{empresa.nombre}</h1>
                    <p className="text-xs text-slate-600">NIT: {empresa.nit} | Tel: {empresa.telefono}</p>
                    <p className="text-xs text-slate-600">{empresa.direccion}</p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="font-extrabold text-indigo-600 text-lg">
                    {documentoImprimir.tipo === 'ORDEN' ? `ORDEN #${documentoImprimir.data.numero_orden}` : documentoImprimir.data.numero_factura}
                  </h2>
                  <p className="text-xs text-slate-500">{documentoImprimir.data.fecha}</p>
                </div>
              </div>

              {documentoImprimir.tipo === 'ORDEN' && (
                <div className="text-xs space-y-3">
                  <div className="bg-slate-50 p-3 rounded-lg border">
                    <p><strong>Cliente:</strong> {documentoImprimir.data.cliente_nombre} ({documentoImprimir.data.cliente_telefono})</p>
                    <p className="mt-1"><strong>Código de Consulta Cliente:</strong> <span className="font-bold text-indigo-600 font-mono text-sm">{documentoImprimir.data.codigo_seguimiento}</span></p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border">
                    <p><strong>Equipo:</strong> {documentoImprimir.data.tipo_equipo} {documentoImprimir.data.marca_modelo} (S/N: {documentoImprimir.data.serie || 'N/A'})</p>
                    <p className="mt-1"><strong>Síntomas:</strong> {documentoImprimir.data.fallo_reportado}</p>
                  </div>
                  <p className="font-black text-indigo-600 text-sm text-right">Presupuesto Estimado: $ {(documentoImprimir.data.valor_estimado || 0).toLocaleString('es-CO')}</p>
                </div>
              )}

              {documentoImprimir.tipo === 'FACTURA' && (
                <div className="text-xs space-y-3">
                  <p><strong>Cliente:</strong> {documentoImprimir.data.cliente_nombre}</p>
                  <table className="w-full text-left border border-slate-300">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="p-2 border">Descripción</th>
                        <th className="p-2 text-center border">Cant.</th>
                        <th className="p-2 text-right border">Precio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(documentoImprimir.data.items || []).map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-2 border">{it.descripcion}</td>
                          <td className="p-2 text-center border">{it.cantidad}</td>
                          <td className="p-2 text-right border">$ {(it.precio || 0).toLocaleString('es-CO')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="font-black text-emerald-600 text-base text-right">Total Facturado: $ {(documentoImprimir.data.total || 0).toLocaleString('es-CO')}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t no-imprimir">
              <button onClick={() => setDocumentoImprimir(null)} className="text-xs text-slate-500 px-3 py-1">Cerrar</button>
              <button onClick={() => window.print()} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg">🖨️ Imprimir / Guardar PDF</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// COMPONENTE CONTENEDOR RAÍZ
function AppContent() {
  const { usuarioSesion } = useApp();
  return usuarioSesion ? <MainApp /> : <LoginScreen />;
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}