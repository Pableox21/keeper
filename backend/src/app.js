
const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const { prepareDatabase } = require('./config/startup');


const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));



// Importar la ruta de productos, empresas, categorias, marcas, líneas y unidades de medida
const productoRoutes = require('./routes/producto');
const empresaRoutes = require('./routes/empresa');
const categoriaRoutes = require('./routes/categoria');
const marcaRoutes = require('./routes/marca');
const lineaRoutes = require('./routes/linea');
const unidadMedidaRoutes = require('./routes/unidadMedida');
app.use('/api/productos', productoRoutes);
app.use('/api/empresas', empresaRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/marcas', marcaRoutes);
app.use('/api/lineas', lineaRoutes);
app.use('/api/unidades-medida', unidadMedidaRoutes);


//////Rutas Autenticacion /////////////////////////////////////////////////////////////////////////////////////////////////////////////
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);


//////Rutas Proveedores /////////////////////////////////////////////////////////////////////////////////////////////////////////////
const proveedorRoutes = require('./routes/proveedor');
app.use('/api/proveedores', proveedorRoutes);


//////Rutas TipoDocumento /////////////////////////////////////////////////////////////////////////////////////////////////////////////
const tipoDocRoutes = require('./routes/tipoDoc');
app.use('/api/tipo-doc', tipoDocRoutes);


//////Rutas Almacen /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const almacenRoutes = require('./routes/almacen');
app.use('/api/almacenes', almacenRoutes);


//////Rutas Ingresos x Compra /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const ingresosRoutes = require('./routes/ingresos');
app.use('/api/ingresos', ingresosRoutes);


//////Rutas Salidas /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const salidasRoutes = require('./routes/salidas');
app.use('/api/salidas', salidasRoutes);


//////Rutas Traspasos (Salidas de almacen a tecnico) /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const traspasosRoutes = require('./routes/traspasos');
app.use('/api/traspasos', traspasosRoutes);


//////Rutas Inventario /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const inventarioRoutes = require('./routes/inventario');
app.use('/api/inventario', inventarioRoutes);

// Rutas de clientes
const clienteRoutes = require('./routes/cliente');
app.use('/api/clientes', clienteRoutes);



app.get('/', (_req, res) => {
  res.send('Backend is running!');
});

// Una ruta /api inexistente debe responder JSON, no el HTML de Express
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'La ruta solicitada no existe' });
});

// Cualquier error que llegue hasta acá sale como JSON: el HTML de Error de Express no sirve
// en la pantalla, que espera `{ error: ... }`.
app.use((err, _req, res, _next) => {
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la solicitud no es un JSON válido' });
  }
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'La solicitud es demasiado grande' });
  }
  console.error('Error no controlado:', err);
  return res.status(500).json({ error: 'No se pudo completar la operación' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

// La preparación de la base (esquema y usuario por defecto) corre en segundo plano:
// si tarda o falla, la API igual responde y el motivo queda en los logs.
prepareDatabase().catch((error) => {
  console.error('Error preparando la base de datos:', error.message);
});
