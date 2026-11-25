import { useState, useEffect } from 'react'
import ExcelJS from 'exceljs'
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import { Alert } from '../atoms'
import Button from '../atoms/Button'
import { ComboBox } from '../molecules'
import { crearIngreso, fetchIngresos, fetchIngresoById, eliminarIngreso } from '../../api/ingresos'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { fetchProductos, crearProducto } from '../../api/productos'
import { fetchEmpresas, crearEmpresa } from '../../api/empresas'
import { fetchCategorias, crearCategoria } from '../../api/categorias'
import { fetchLineas, crearLinea } from '../../api/lineas'
import { fetchMarcas, crearMarca } from '../../api/marcas'
import { fetchUnidadesMedida, buscarOCrearUnidadMedida } from '../../api/unidadesMedida'
import { fetchProveedores } from '../../api/proveedores'
import { fetchAlmacenes } from '../../api/almacenes'
import { useAuth } from '../../hooks/useAuth'
import EventBus from '../../utils/EventBus'

function InitialInventory() {
    const { user } = useAuth()
    const [alert, setAlert] = useState({ open: false, type: 'success', message: '' })
    const [items, setItems] = useState([])
    const [originalItems, setOriginalItems] = useState([])
    const [loading, setLoading] = useState(false)
    const [proveedores, setProveedores] = useState([])
    const [almacenes, setAlmacenes] = useState([])
    const [destino, setDestino] = useState({ proveedorId: '', almacenId: '' })
    const [filters, setFilters] = useState({
        empresa: '',
        categoria: '',
        linea: '',
        marca: '',
        codigo: '',
        nombre: '',
        unidad: '',
        stock_minimo: '',
        stock_maximo: ''
    })

    const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

    const handleSort = (key) => {
        setSortConfig(prev => {
            if (!prev.key || prev.key !== key) {
                return { key, direction: 'asc' };
            } else if (prev.direction === 'asc') {
                return { key, direction: 'desc' };
            } else if (prev.direction === 'desc') {
                return { key: null, direction: null };
            } else {
                return { key, direction: 'asc' };
            }
        });
    };
    useEffect(() => {
        const cargarInventarioInicial = async () => {
            try {
                setLoading(true);
                const ingresos = await fetchIngresos();
                const inventarioInicial = ingresos.find(ingreso => ingreso.detalle === 'INVENTARIO INICIAL');
                
                if (inventarioInicial) {
                    const detalleIngreso = await fetchIngresoById(inventarioInicial.id);
                    
                    if (detalleIngreso && detalleIngreso.detalles) {
                        const itemsMapeados = detalleIngreso.detalles.map(detalle => ({
                            empresa: detalle.empresa_nombre || '',
                            categoria: detalle.categoria_nombre || '',
                            linea: detalle.linea_nombre || '',
                            marca: detalle.marca_nombre || '',
                            codigo: detalle.producto_codigo || '',
                            nombre: detalle.producto_nombre || '',
                            unidad: detalle.unidad_ingreso || '',
                            cantidad: detalle.cantidad || 0,
                            precio_unitario: detalle.precio_unitario || 0
                        }));
                        setItems(itemsMapeados);
                        setOriginalItems(itemsMapeados);
                        setDestino({
                            proveedorId: inventarioInicial.id_proveedor ? String(inventarioInicial.id_proveedor) : '',
                            almacenId: inventarioInicial.id_almacen ? String(inventarioInicial.id_almacen) : ''
                        });
                        setAlert({ open: true, type: 'success', message: 'Inventario inicial cargado correctamente.' });
                    }
                }
            } catch (error) {
                console.error('Error al cargar inventario inicial:', error);
                setAlert({ open: true, type: 'error', message: 'Error al cargar inventario inicial.' });
            } finally {
                setLoading(false);
            }
        };
        
        cargarInventarioInicial();
        const handler = () => cargarInventarioInicial();
        EventBus.addEventListener('INITIAL_INVENTORY_UPDATED', handler);
        return () => EventBus.removeEventListener('INITIAL_INVENTORY_UPDATED', handler);
    }, []);

    // El ingreso de inventario inicial necesita un proveedor y un almacén reales: se eligen en la barra superior
    useEffect(() => {
        fetchProveedores()
            .then(lista => setProveedores((lista || []).filter(p => Number(p.autorizado) === 1)))
            .catch(() => setProveedores([]));
        fetchAlmacenes()
            .then(lista => setAlmacenes((lista || []).filter(a => a.estado === 'ACTIVO')))
            .catch(() => setAlmacenes([]));
    }, []);

    const almacenPorDefecto = almacenes.find(a => Number(a.es_principal) === 1) || almacenes[0];
    const proveedorEfectivo = destino.proveedorId || (proveedores[0] ? String(proveedores[0].id) : '');
    const almacenEfectivo = destino.almacenId || (almacenPorDefecto ? String(almacenPorDefecto.id) : '');

    // Opciones únicas para cada filtro
    const empresaOptions = [
        { value: '', label: 'Todas' },
        ...Array.from(new Set(items.map(i => i.empresa))).filter(Boolean).map(val => ({ value: val, label: val }))
    ];
    const categoriaOptions = [
        { value: '', label: 'Todas' },
        ...Array.from(new Set(items.map(i => i.categoria))).filter(Boolean).map(val => ({ value: val, label: val }))
    ];
    const lineaOptions = [
        { value: '', label: 'Todas' },
        ...Array.from(new Set(items.map(i => i.linea))).filter(Boolean).map(val => ({ value: val, label: val }))
    ];
    const marcaOptions = [
        { value: '', label: 'Todas' },
        ...Array.from(new Set(items.map(i => i.marca))).filter(Boolean).map(val => ({ value: val, label: val }))
    ];
    const unidadOptions = [
        { value: '', label: 'Todas' },
        ...Array.from(new Set(items.map(i => i.unidad))).filter(Boolean).map(val => ({ value: val, label: val }))
    ];
    const codigoOptions = [
        { value: '', label: 'Todos' },
        ...Array.from(new Set(items.map(i => i.codigo))).filter(Boolean).map(val => ({ value: val, label: val }))
    ];
    const nombreOptions = [
        { value: '', label: 'Todos' },
        ...Array.from(new Set(items.map(i => i.nombre))).filter(Boolean).map(val => ({ value: val, label: val }))
    ];
    const stockMinimoOptions = [
        { value: '', label: 'Todos' },
        ...Array.from(new Set(items.map(i => i.stock_minimo))).filter(Boolean).map(val => ({ value: String(val), label: String(val) }))
    ];
    const stockMaximoOptions = [
        { value: '', label: 'Todos' },
        ...Array.from(new Set(items.map(i => i.stock_maximo))).filter(Boolean).map(val => ({ value: String(val), label: String(val) }))
    ];

    let filteredItems = items.filter(item =>
        (filters.empresa === '' || item.empresa === filters.empresa) &&
        (filters.categoria === '' || item.categoria === filters.categoria) &&
        (filters.linea === '' || item.linea === filters.linea) &&
        (filters.marca === '' || item.marca === filters.marca) &&
        (filters.codigo === '' || item.codigo === filters.codigo) &&
        (filters.nombre === '' || item.nombre === filters.nombre) &&
        (filters.unidad === '' || item.unidad === filters.unidad) &&
        (filters.stock_minimo === '' || String(item.stock_minimo || 0) === filters.stock_minimo) &&
        (filters.stock_maximo === '' || String(item.stock_maximo || 0) === filters.stock_maximo)
    );

    if (sortConfig.key && sortConfig.direction) {
        filteredItems = [...filteredItems].sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];
            if (!isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
                aValue = Number(aValue);
                bValue = Number(bValue);
            } else {
                aValue = String(aValue).toLowerCase();
                bValue = String(bValue).toLowerCase();
            }
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    } else if (!sortConfig.key && originalItems.length > 0) {
        filteredItems = originalItems.filter(item =>
            (filters.empresa === '' || item.empresa === filters.empresa) &&
            (filters.categoria === '' || item.categoria === filters.categoria) &&
            (filters.linea === '' || item.linea === filters.linea) &&
            (filters.marca === '' || item.marca === filters.marca) &&
            (filters.codigo === '' || item.codigo === filters.codigo) &&
            (filters.nombre === '' || item.nombre === filters.nombre) &&
            (filters.unidad === '' || item.unidad === filters.unidad) &&
            (filters.stock_minimo === '' || String(item.stock_minimo || 0) === filters.stock_minimo) &&
            (filters.stock_maximo === '' || String(item.stock_maximo || 0) === filters.stock_maximo)
        );
    }

    const buscarOCrearEntidad = async (nombre, fetchFn, crearFn) => {
        if (!nombre) return null;

        try {
            const entidades = await fetchFn();
            let entidad = entidades.find(e => e.nombre.toLowerCase() === nombre.toLowerCase());

            if (!entidad) {
                entidad = await crearFn(nombre);
            }

            return entidad.id;
        } catch (error) {
            // Sin id no se inventa uno: el backend responde 400 explicando qué falta
            console.error(`Error al buscar/crear entidad ${nombre}:`, error);
            return null;
        }
    };

    const handleImportExcel = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setLoading(true);
        setAlert({ open: false, type: 'success', message: '' });
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const buffer = e.target.result;
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.load(buffer);
                const worksheet = workbook.worksheets[0];
                const headerRow = worksheet.getRow(3).values;
                const headers = headerRow.slice(1);
                const mapped = [];
                worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                    if (rowNumber <= 3) return;
                    const rowArr = row.values.slice(1);
                    const obj = {};
                    headers.forEach((key, idx) => {
                        obj[key] = rowArr[idx] || '';
                    });
                    mapped.push({
                        empresa: obj['Empresa'] || '',
                        categoria: obj['Categoria'] || '',
                        linea: obj['Linea'] || '',
                        marca: obj['Marca'] || '',
                        codigo: obj['Codigo'] || '',
                        nombre: obj['Nombre'] || '',
                        unidad: obj['Unid.'] || obj['Unidad'] || '',
                        cantidad: Number(obj['Cantidad'] || 0),
                        precio_unitario: Number(obj['Precio Unitario'] || 0)
                    });
                });

                // Se valida todo el archivo antes de tocar la base: un error a mitad del proceso
                // dejaría productos creados o el inventario inicial anterior borrado
                const filas = [];
                const codigosVistos = new Set();
                for (const item of mapped) {
                    const codigo = String(item.codigo).trim();
                    const nombre = String(item.nombre).trim();
                    if (!codigo && !nombre) continue;
                    if (!codigo || !nombre) {
                        throw new Error(`La fila ${filas.length + 1} del archivo necesita código y nombre`);
                    }
                    if (codigosVistos.has(codigo)) {
                        throw new Error(`El producto "${codigo}" aparece repetido en el archivo; junta las cantidades en una sola fila`);
                    }
                    if (!Number.isInteger(item.cantidad) || item.cantidad <= 0) {
                        throw new Error(`La cantidad del producto "${codigo}" debe ser un número entero mayor a 0: el inventario inicial no guarda productos sin stock`);
                    }
                    if (!Number.isFinite(item.precio_unitario) || item.precio_unitario <= 0) {
                        throw new Error(`El precio del producto "${codigo}" debe ser mayor a 0`);
                    }
                    codigosVistos.add(codigo);
                    filas.push({ ...item, codigo, nombre });
                }
                if (filas.length === 0) {
                    throw new Error('El archivo no contiene productos para importar');
                }
                if (!proveedorEfectivo) {
                    throw new Error('No hay proveedores autorizados: registra un proveedor antes de importar');
                }
                if (!almacenEfectivo) {
                    throw new Error('No hay almacenes activos: registra un almacén antes de importar');
                }

                const productosExistentes = await fetchProductos();
                const productosPorCodigo = {};
                productosExistentes.forEach(p => {
                    productosPorCodigo[p.codigo] = p;
                });

                const detalles = [];
                let total = 0;
                const unidades = await fetchUnidadesMedida();
                for (const item of filas) {
                    let producto = productosPorCodigo[item.codigo];
                    if (!producto) {
                        const idEmpresa = await buscarOCrearEntidad(item.empresa, fetchEmpresas, crearEmpresa);
                        const idCategoria = await buscarOCrearEntidad(item.categoria, fetchCategorias, crearCategoria);
                        const idLinea = await buscarOCrearEntidad(item.linea, fetchLineas, crearLinea);
                        const idMarca = await buscarOCrearEntidad(item.marca, fetchMarcas, crearMarca);

                        const nuevo = await crearProducto({
                            codigo: item.codigo,
                            nombre: item.nombre,
                            id_unidad_medida: await buscarOCrearUnidadMedida(item.unidad, unidades),
                            id_empresa: idEmpresa,
                            id_categoria: idCategoria,
                            id_linea: idLinea,
                            id_marca: idMarca,
                            estado: 'ACTIVO'
                        });
                        producto = nuevo;
                        productosPorCodigo[item.codigo] = nuevo;
                    }
                    total += Number(item.cantidad) * Number(item.precio_unitario);
                    detalles.push({
                        id_producto: producto.id_producto || producto.id,
                        cantidad: item.cantidad,
                        precio_unitario: item.precio_unitario
                    });
                }

                const now = new Date();
                const fecha = now.toISOString().slice(0, 10);
                const hora = now.toTimeString().slice(0, 8);

                const ingresosExistentes = await fetchIngresos();
                const inventarioAnterior = ingresosExistentes.find(ingreso => ingreso.detalle === 'INVENTARIO INICIAL');

                if (inventarioAnterior) {
                    await eliminarIngreso(inventarioAnterior.id);
                }

                const payload = {
                    id_proveedor: Number(proveedorEfectivo),
                    id_almacen: Number(almacenEfectivo),
                    fecha,
                    hora,
                    doc_respaldo: '',
                    numero_doc: '',
                    detalle: 'INVENTARIO INICIAL',
                    total: Math.round(total * 100) / 100,
                    id_responsable: user?.id,
                    detalles,
                    forma_pago: 'EFECTIVO',
                };

                await crearIngreso(payload);
                setItems(filas);
                setOriginalItems(filas);
                EventBus.dispatchEvent(new Event('INITIAL_INVENTORY_UPDATED'));
                setAlert({ open: true, type: 'success', message: 'Ingreso registrado y productos cargados correctamente.' });
            } catch (err) {
                setAlert({ open: true, type: 'error', message: err.message || 'Error al procesar el archivo o registrar ingreso.' });
                setItems([]);
                setOriginalItems([]);
            } finally {
                setLoading(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleExportInventoryToPDF = () => {
        if (!filteredItems || filteredItems.length === 0) {
            setAlert({ open: true, type: 'warning', message: 'No hay inventario para exportar' });
            return;
        }
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;

            doc.setFontSize(16);
            const empresa = 'OPTINET S.R.L.';
            const titulo = 'INVENTARIO INICIAL';
            doc.text(empresa, 14, 18);
            const tituloWidth = doc.getTextWidth(titulo);
            const tituloX = (pageWidth - tituloWidth) / 2;
            doc.text(titulo, tituloX, 18);

            const fecha = new Date().toLocaleDateString('es-ES');
            doc.setFontSize(10);
            const fechaText = `Generado el: ${fecha}`;
            const fechaWidth = doc.getTextWidth(fechaText);
            const fechaX = (pageWidth - fechaWidth) / 2;
            doc.text(fechaText, fechaX, 12);

            const tableHeaders = [
                'Código',
                'Nombre',
                'Unidad',
                'Cantidad',
                'P. Unit. (Bs)',
                'Empresa',
                'Categoría',
                'Línea',
                'Marca'
            ];
            const tableData = filteredItems.map(item => [
                item.codigo || '-',
                item.nombre || '-',
                item.unidad || '-',
                item.cantidad || '0',
                item.precio_unitario || '0',
                item.empresa || '-',
                item.categoria || '-',
                item.linea || '-',
                item.marca || '-'
            ]);

            const tableWidth = 18 + 30 + 12 + 15 + 18 + 20 + 20 + 20 + 20;
            const leftMargin = (pageWidth - tableWidth) / 2;
            autoTable(doc, {
                head: [tableHeaders],
                body: tableData,
                startY: 30,
                styles: {
                    fontSize: 5,
                    cellPadding: 1,
                    overflow: 'linebreak'
                },
                headStyles: {
                    fillColor: [41, 128, 185],
                    textColor: 255,
                    fontSize: 6,
                    fontStyle: 'bold',
                    cellPadding: 1,
                    halign: 'center'
                },
                alternateRowStyles: {
                    fillColor: [248, 249, 250]
                },
                margin: { top: 30, left: leftMargin, right: leftMargin },
                columnStyles: {
                    0: { cellWidth: 18, halign: 'left' },
                    1: { cellWidth: 30, halign: 'left' },
                    2: { cellWidth: 12, halign: 'left' },
                    3: { cellWidth: 15, halign: 'left' },
                    4: { cellWidth: 18, halign: 'left' },
                    5: { cellWidth: 20, halign: 'left' },
                    6: { cellWidth: 20, halign: 'left' },
                    7: { cellWidth: 20, halign: 'left' },
                    8: { cellWidth: 20, halign: 'left' }
                },
                theme: 'grid'
            });

            const pageHeight = doc.internal.pageSize.height;
            doc.setFontSize(8);
            doc.text(`Total de ítems: ${filteredItems.length}`, 14, pageHeight - 10);

            const fileName = `inventario_inicial_${new Date().toISOString().slice(0, 10)}.pdf`;
            doc.save(fileName);
            setAlert({ open: true, type: 'success', message: 'PDF generado correctamente' });
        } catch (error) {
            console.error('Error al generar PDF:', error);
            setAlert({ open: true, type: 'error', message: 'Error al generar el PDF' });
        }
    };

    const handleExportInventoryToExcel = async () => {
        if (!filteredItems || filteredItems.length === 0) {
            setAlert({ open: true, type: 'warning', message: 'No hay inventario para exportar' });
            return;
        }
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Inventario Inicial');

            worksheet.mergeCells('A1:D1');
            worksheet.getCell('A1').value = 'OPTINET S.R.L.';
            worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
            worksheet.mergeCells('E1:I1');
            worksheet.getCell('E1').value = 'INVENTARIO INICIAL';
            worksheet.getCell('E1').alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            worksheet.getRow(1).font = { bold: true, size: 13 };

            const headers = ['Código', 'Nombre', 'Unidad', 'Cantidad', 'P. Unit. (Bs)', 'Empresa', 'Categoría', 'Línea', 'Marca'];
            worksheet.addRow([]);
            worksheet.addRow(headers);
            const headerRow = worksheet.getRow(3);
            headerRow.font = { bold: true, color: { argb: 'FF000000' } };
            headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            headerRow.eachCell(cell => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFD9D9D9' }
                };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });

            filteredItems.forEach(item => {
                worksheet.addRow([
                    item.codigo || '-',
                    item.nombre || '-',
                    item.unidad || '-',
                    item.cantidad || '0',
                    item.precio_unitario || '0',
                    item.empresa || '-',
                    item.categoria || '-',
                    item.linea || '-',
                    item.marca || '-'
                ]);
            });

            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber >= 3) {
                    row.eachCell(cell => {
                        cell.border = {
                            top: { style: 'thin' },
                            left: { style: 'thin' },
                            bottom: { style: 'thin' },
                            right: { style: 'thin' }
                        };
                        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                    });
                }
            });

            worksheet.columns.forEach(col => {
                let maxLength = 10;
                col.eachCell({ includeEmpty: true }, cell => {
                    maxLength = Math.max(maxLength, (cell.value ? cell.value.toString().length : 0));
                });
                col.width = maxLength + 2;
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `inventario_inicial_${new Date().toISOString().slice(0, 10)}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            setAlert({ open: true, type: 'success', message: 'Excel generado correctamente' });
        } catch (error) {
            console.error('Error al generar Excel:', error);
            setAlert({ open: true, type: 'error', message: 'Error al generar el Excel' });
        }
    };

    return (
        <>
            <Alert
                open={alert.open}
                type={alert.type}
                message={alert.message}
                onClose={() => setAlert(a => ({ ...a, open: false }))}
                duration={3000}
            />

            <div className="flex flex-col h-full min-h-0 space-y-2">
                <div className="col-span-4 flex gap-2 p-2 bg-white border border-gray-200">
                    <input
                        id="excel-upload"
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleImportExcel}
                        className="hidden"
                        disabled={loading}
                    />
                    <Button
                        type="button"
                        onClick={() => {
                            if (!loading) {
                                document.getElementById('excel-upload').click();
                            }
                        }}
                        disabled={loading}
                        className="px-4 py-1 text-xs"
                    >
                        <ArrowUpTrayIcon className="w-4 h-4 mr-1" />
                        Importar Excel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleExportInventoryToPDF}
                        disabled={loading || !filteredItems || filteredItems.length === 0}
                        className="px-4 py-1 text-xs"
                    >
                        Exportar PDF
                    </Button>
                    <Button
                        type="button"
                        onClick={handleExportInventoryToExcel}
                        disabled={loading || !filteredItems || filteredItems.length === 0}
                        className="px-4 py-1 text-xs"
                    >
                        Exportar Excel
                    </Button>
                    <div className="flex items-center gap-1 ml-auto">
                        <span className="text-xs text-gray-600 whitespace-nowrap">Proveedor</span>
                        <div className="w-44">
                            <ComboBox
                                value={proveedorEfectivo}
                                onChange={v => setDestino(d => ({ ...d, proveedorId: v }))}
                                options={proveedores.map(p => ({ value: String(p.id), label: p.nombre }))}
                                placeholder="Sin proveedores"
                                searchable={true}
                                clearable={false}
                                disabled={loading || proveedores.length === 0}
                            />
                        </div>
                        <span className="text-xs text-gray-600 whitespace-nowrap">Almacén</span>
                        <div className="w-44">
                            <ComboBox
                                value={almacenEfectivo}
                                onChange={v => setDestino(d => ({ ...d, almacenId: v }))}
                                options={almacenes.map(a => ({ value: String(a.id), label: a.nombre }))}
                                placeholder="Sin almacenes"
                                searchable={true}
                                clearable={false}
                                disabled={loading || almacenes.length === 0}
                            />
                        </div>
                    </div>
                    {loading && <span className="ml-2 text-blue-600 animate-pulse">Procesando...</span>}
                </div>
                <div className="flex-1 overflow-auto border border-gray-200">
                    <table className="min-w-full text-xs">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort('codigo')}>
                                    Código
                                    {sortConfig.key === 'codigo' && (sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '')}
                                </th>
                                <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort('nombre')}>
                                    Nombre
                                    {sortConfig.key === 'nombre' && (sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '')}
                                </th>
                                <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort('unidad')}>
                                    Unidad
                                    {sortConfig.key === 'unidad' && (sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '')}
                                </th>
                                <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort('cantidad')}>
                                    Cantidad
                                    {sortConfig.key === 'cantidad' && (sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '')}
                                </th>
                                <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort('precio_unitario')}>
                                    Precio Unitario
                                    {sortConfig.key === 'precio_unitario' && (sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '')}
                                </th>
                                <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort('stock_minimo')}>
                                    Stock Mínimo
                                    {sortConfig.key === 'stock_minimo' && (sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '')}
                                </th>
                                <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort('stock_maximo')}>
                                    Stock Máximo
                                    {sortConfig.key === 'stock_maximo' && (sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '')}
                                </th>
                                <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort('empresa')}>
                                    Empresa
                                    {sortConfig.key === 'empresa' && (sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '')}
                                </th>
                                <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort('categoria')}>
                                    Categoría
                                    {sortConfig.key === 'categoria' && (sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '')}
                                </th>
                                <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort('linea')}>
                                    Línea
                                    {sortConfig.key === 'linea' && (sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '')}
                                </th>
                                <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort('marca')}>
                                    Marca
                                    {sortConfig.key === 'marca' && (sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '')}
                                </th>
                            </tr>
                            <tr className="bg-gray-50">
                                <th>
                                    <ComboBox
                                        value={filters.codigo}
                                        onChange={v => setFilters(f => ({ ...f, codigo: v }))}
                                        options={codigoOptions}
                                        placeholder="Filtrar"
                                    />
                                </th>
                                <th>
                                    <ComboBox
                                        value={filters.nombre}
                                        onChange={v => setFilters(f => ({ ...f, nombre: v }))}
                                        options={nombreOptions}
                                        placeholder="Filtrar"
                                    />
                                </th>
                                <th>
                                    <ComboBox
                                        value={filters.unidad}
                                        onChange={v => setFilters(f => ({ ...f, unidad: v }))}
                                        options={unidadOptions}
                                        placeholder="Filtrar"
                                    />
                                </th>
                                <th></th>
                                <th>
                                    <ComboBox
                                        value={filters.stock_minimo}
                                        onChange={v => setFilters(f => ({ ...f, stock_minimo: v }))}
                                        options={stockMinimoOptions}
                                        placeholder="Filtrar"
                                    />
                                </th>
                                <th>
                                    <ComboBox
                                        value={filters.stock_maximo}
                                        onChange={v => setFilters(f => ({ ...f, stock_maximo: v }))}
                                        options={stockMaximoOptions}
                                        placeholder="Filtrar"
                                    />
                                </th>
                                <th>
                                    <ComboBox
                                        value={filters.empresa}
                                        onChange={v => setFilters(f => ({ ...f, empresa: v }))}
                                        options={empresaOptions}
                                        placeholder="Filtrar"
                                    />
                                </th>
                                <th>
                                    <ComboBox
                                        value={filters.categoria}
                                        onChange={v => setFilters(f => ({ ...f, categoria: v }))}
                                        options={categoriaOptions}
                                        placeholder="Filtrar"
                                    />
                                </th>
                                <th>
                                    <ComboBox
                                        value={filters.linea}
                                        onChange={v => setFilters(f => ({ ...f, linea: v }))}
                                        options={lineaOptions}
                                        placeholder="Filtrar"
                                    />
                                </th>
                                <th>
                                    <ComboBox
                                        value={filters.marca}
                                        onChange={v => setFilters(f => ({ ...f, marca: v }))}
                                        options={marcaOptions}
                                        placeholder="Filtrar"
                                    />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((item, idx) => (
                                <tr key={idx}>
                                    <td className="p-2 text-xs text-black truncate whitespace-nowrap" title={item.codigo}>{item.codigo}</td>
                                    <td className="p-2 text-xs text-black truncate whitespace-nowrap" title={item.nombre}>{item.nombre}</td>
                                    <td className="p-2 text-xs text-black truncate whitespace-nowrap" title={item.unidad}>{item.unidad}</td>
                                    <td className="p-2 text-xs text-black text-right whitespace-nowrap">{item.cantidad}</td>
                                    <td className="p-2 text-xs text-black text-right whitespace-nowrap">{item.precio_unitario}</td>
                                    <td className="p-2 text-xs text-black text-right whitespace-nowrap">{item.stock_minimo || 0}</td>
                                    <td className="p-2 text-xs text-black text-right whitespace-nowrap">{item.stock_maximo || 0}</td>
                                    <td className="p-2 text-xs text-black truncate whitespace-nowrap" title={item.empresa}>{item.empresa}</td>
                                    <td className="p-2 text-xs text-black truncate whitespace-nowrap" title={item.categoria}>{item.categoria}</td>
                                    <td className="p-2 text-xs text-black truncate whitespace-nowrap" title={item.linea}>{item.linea}</td>
                                    <td className="p-2 text-xs text-black truncate whitespace-nowrap" title={item.marca}>{item.marca}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    )
}

export default InitialInventory
