# TechFix App - Proyecto React + Supabase

¡Hola! Aquí tienes la estructura completa y modular que había preparado la IA antes de quedarse sin límite. La lógica ahora está dividida en páginas y componentes, lista para conectarse.

## Pasos para ejecutar:
1. Extrae este archivo ZIP en tu computadora.
2. Abre la carpeta en VS Code.
3. Abre una terminal y ejecuta: `npm install`
4. Ejecuta: `npm run dev` para ver la interfaz corriendo (entrará sin login temporalmente para que puedas ver el diseño).

## Para conectar Supabase:
1. En tu proyecto de Supabase, ve al **SQL Editor** y pega el contenido del archivo `supabase/schema.sql` y dale en "Run".
2. Abre el archivo `src/lib/supabase.js` en este proyecto y pega la URL y la ANON KEY de tu base de datos Supabase.
3. En `src/App.jsx`, busca la línea `// if (!user) return <Navigate to="/login" />;` y quítale las barras de comentario `//` para activar el login obligatorio.
