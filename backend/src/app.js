
const express = require('express');
const dotenv = require('dotenv');
dotenv.config();


const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());



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



app.get('/', (_req, res) => {
  res.send('Backend is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});