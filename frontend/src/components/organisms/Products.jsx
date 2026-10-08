// Exportar productos a Excel usando ExcelJS

import { useState, useEffect } from 'react'
import { validateProductForm } from '../../utils/validation';
import { useForm } from '../../hooks/useForm';
import { useAlert } from '../../hooks/useAlert';
import { PlusIcon, PencilIcon, TrashIcon, ArrowUpTrayIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import { Input, Alert } from '../atoms'
import Button from '../atoms/Button';
import { FormField, ComboBox } from '../molecules'
import EntityManagerContainer from './EntityManagerContainer';
import { fetchProductos as apiFetchProductos, crearProducto, editarProducto, eliminarProducto } from '../../api/productos';
import { fetchEmpresas, crearEmpresa, eliminarEmpresa, editarEmpresa } from '../../api/empresas';
import { fetchCategorias, crearCategoria, editarCategoria, eliminarCategoria } from '../../api/categorias';
import { fetchMarcas, crearMarca, editarMarca, eliminarMarca } from '../../api/marcas';
import { fetchLineas, crearLinea, editarLinea, eliminarLinea } from '../../api/lineas';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import EventBus from '../../utils/EventBus';
import { fetchUnidadesMedida, crearUnidadMedida } from '../../api/unidadesMedida';


function Products() {
    const { alert, showAlert, closeAlert } = useAlert();
    const [formMode, setFormMode] = useState('disabled');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const initialForm = {
        codigo: '',
        nombre: '',
        stockMinimo: '',
        stockMaximo: '',
        unidadVenta: '',
        empresa: '',
        categoria: '',
        linea: '',
        marca: ''
    };
    const {
        values: formData,
        setValues: setFormData,
        handleChange,
        resetForm
    } = useForm(initialForm);

    const [products, setProducts] = useState([])
    const [originalProducts, setOriginalProducts] = useState([])
    const [unidadVentaOptions, setUnidadVentaOptions] = useState([]);
    const [filters, setFilters] = useState({
        empresa: '',
        categoria: '',
        linea: '',
        marca: '',
        codigo: '',
        nombre: '',
        unidad: '',
        stockMinimo: '',
        stockMaximo: '',
        precio: ''
    });
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

    const fetchProductos = async () => {
        try {
            const data = await apiFetchProductos();
            setProducts(data);
            setOriginalProducts(data);
        } catch {
            setProducts([]);
            setOriginalProducts([]);
        }
    };

    useEffect(() => {
        fetchProductos();
        fetchUnidadesVenta();
        // Suscribirse a eventos de actualización global
        const handler = () => fetchProductos();
        EventBus.addEventListener('PRODUCTS_UPDATED', handler);
        return () => EventBus.removeEventListener('PRODUCTS_UPDATED', handler);
    }, []);

    const fetchUnidadesVenta = async () => {
        try {
            const data = await import('../../api/unidadesMedida').then(mod => mod.fetchUnidadesMedida());
            setUnidadVentaOptions(data.map(u => ({ value: String(u.id), label: `${u.nombre} (${u.abreviatura})` })));
        } catch {
            setUnidadVentaOptions([]);
        }
    };

    const handleRowSelect = (product) => {
        if (formMode !== 'disabled') return;
        setSelectedProduct(selectedProduct?.id_producto === product.id_producto ? null : product);
    }

    const handleCreate = () => {
        resetForm();
        setFormMode('creating');
        setSelectedProduct(null);
        setEditingId(null);
    }
    const handleEdit = () => {
        if (!selectedProduct) {
            showAlert('warning', 'Selecciona un producto para editar');
            return;
        }
        // Buscar nombres de entidades si solo hay id
        const getEntityName = (id, list) => {
            if (!id) return '';
            if (typeof id === 'string' && isNaN(Number(id))) return id; // ya es nombre
            const found = list.find(e => e.id === id || e.nombre === id);
            return found ? found.nombre : id;
        };
        setFormData({
            codigo: selectedProduct.codigo || '',
            nombre: selectedProduct.nombre || '',
            stockMinimo: selectedProduct.stock_minimo || '',
            stockMaximo: selectedProduct.stock_maximo || '',
            unidadVenta: selectedProduct.id_unidad_medida || '',
            empresa: getEntityName(selectedProduct.empresa || selectedProduct.id_empresa, empresaOptions || []),
            categoria: getEntityName(selectedProduct.categoria || selectedProduct.id_categoria, categoriaOptions || []),
            linea: getEntityName(selectedProduct.linea || selectedProduct.id_linea, lineaOptions || []),
            marca: getEntityName(selectedProduct.marca || selectedProduct.id_marca, marcaOptions || [])
        });
        setFormMode('editing');
        setEditingId(selectedProduct.id_producto);
    }

    const handleCancel = () => {
        resetForm();
        setFormMode('disabled');
        setSelectedProduct(null);
        setEditingId(null);
    }

    const handleDelete = async () => {
        if (!selectedProduct) {
            showAlert('warning', 'Selecciona un producto para eliminar');
            return;
        }

        if (!confirm(`¿Estás seguro de eliminar el producto "${selectedProduct.nombre}"?`)) {
            return;
        }

        try {
            await eliminarProducto(selectedProduct.id_producto);
            showAlert('success', 'Producto eliminado correctamente');
            setSelectedProduct(null);
            EventBus.dispatchEvent(new Event('PRODUCTS_UPDATED'));
            fetchProductos();
        } catch (error) {
            showAlert('error', 'Error al eliminar producto: ' + (error.error || error.message));
        }
    }

    const getOrCreateEntityId = async (entityName, entityValue, fetchFn, createFn) => {
        if (!entityValue || !entityValue.trim()) return 1;
        const normalizedValue = entityValue.trim().toUpperCase();
        try {
            const entities = await fetchFn();
            const existing = entities.find(e => e.nombre === normalizedValue);
            if (existing) return existing.id;
            const newEntity = await createFn(normalizedValue);
            return newEntity.id;
        } catch (err) {
            console.error(`Error gestionando ${entityName}:`, err);
            return 1;
        }
    };
    const handleImportExcel = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const productosExistentes = await apiFetchProductos();
            const productosPorCodigo = {};
            productosExistentes.forEach(p => {
                productosPorCodigo[p.codigo] = p;
            });
            const buffer = await file.arrayBuffer();
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(buffer);
            const worksheet = workbook.worksheets[0];
            const headerRowNumber = 3;
            const headerRow = worksheet.getRow(headerRowNumber);
            const colMap = {};
            headerRow.eachCell((cell, colNumber) => {
                const header = (cell.value || '').toString().trim().toLowerCase();
                if (header.includes('empresa')) colMap.empresa = colNumber;
                else if (header.includes('categoria')) colMap.categoria = colNumber;
                else if (header.includes('linea')) colMap.linea = colNumber;
                else if (header.includes('marca')) colMap.marca = colNumber;
                else if (header.includes('codigo')) colMap.codigo = colNumber;
                else if (header.includes('nombre')) colMap.nombre = colNumber;
                else if (header.includes('unid')) colMap.unidad = colNumber;
                else if (header.includes('precio')) colMap.precio = colNumber;
                else if (header.includes('vigente')) colMap.estado = colNumber;
            });

            const rows = [];
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber <= headerRowNumber) return;

                const get = (col) => colMap[col] ? row.getCell(colMap[col]).value || '' : '';

                const precioRaw = get('precio') || '0';
                let precio = 0;
                if (typeof precioRaw === 'string') {
                    precio = Number(precioRaw.replace(',', '.'));
                } else {
                    precio = Number(precioRaw);
                }

                let estado = get('estado') || '';
                estado = (estado.toString().toLowerCase().includes('seleccionado') ||
                    estado.toString().toLowerCase().includes('activo')) ? 'ACTIVO' : 'INACTIVO';

                rows.push({
                    empresa: get('empresa'),
                    categoria: get('categoria'),
                    linea: get('linea'),
                    marca: get('marca'),
                    codigo: get('codigo'),
                    nombre: get('nombre'),
                    unidad_ingreso: get('unidad') || 'Unidad',
                    precio_venta: isNaN(precio) ? 0 : precio,
                    estado
                });
            });

            let success = 0, fail = 0, skipped = 0;

            // Obtener todas las unidades de medida existentes una sola vez
            let unidades = await fetchUnidadesMedida();
            for (const producto of rows) {
                try {
                    let productoExistente = productosPorCodigo[producto.codigo];
                    // Buscar o crear unidad de medida
                    let unidadNombre = (producto.unidad_ingreso || 'Unidad').trim();
                    let unidad = unidades.find(u => u.nombre.trim().toLowerCase() === unidadNombre.toLowerCase());
                    let id_unidad_medida;
                    if (unidad) {
                        id_unidad_medida = unidad.id;
                    } else {
                        // Crear nueva unidad de medida con tipo UNIDAD y abreviatura igual al nombre
                        const nuevaUnidad = await crearUnidadMedida({ nombre: unidadNombre, abreviatura: unidadNombre, tipo: 'UNIDAD', descripcion: '' });
                        id_unidad_medida = nuevaUnidad.id;
                        // Actualizar cache local
                        unidades.push(nuevaUnidad);
                    }
                    if (!productoExistente) {
                        let id_empresa = null;
                        let id_categoria = null;
                        let id_marca = null;
                        let id_linea = null;
                        if (producto.empresa && producto.empresa.trim()) {
                            id_empresa = await getOrCreateEntityId('empresa', producto.empresa, fetchEmpresas, crearEmpresa);
                        }
                        if (producto.categoria && producto.categoria.trim()) {
                            id_categoria = await getOrCreateEntityId('categoria', producto.categoria, fetchCategorias, crearCategoria);
                        }
                        if (producto.marca && producto.marca.trim()) {
                            id_marca = await getOrCreateEntityId('marca', producto.marca, fetchMarcas, crearMarca);
                        }
                        if (producto.linea && producto.linea.trim()) {
                            id_linea = await getOrCreateEntityId('linea', producto.linea, fetchLineas, crearLinea);
                        }
                        const productoCompleto = {
                            codigo: producto.codigo,
                            nombre: producto.nombre,
                            unidad_ingreso: unidadNombre,
                            precio_venta: producto.precio_venta,
                            estado: producto.estado,
                            id_empresa,
                            id_categoria,
                            id_marca,
                            id_linea,
                            id_unidad_medida
                        };
                        const nuevoProducto = await crearProducto(productoCompleto);
                        productosPorCodigo[producto.codigo] = nuevoProducto;
                        success++;
                    } else {
                        skipped++;
                    }
                } catch (err) {
                    console.error('Error procesando producto:', err);
                    fail++;
                }
            }
            showAlert('success', `Importación finalizada. Creados: ${success}, Existentes saltados: ${skipped}, Fallos: ${fail}`);
            fetchProductos();
        } catch (err) {
            showAlert('error', 'Error al importar Excel: ' + err.message);
        }
    };
    const handleSubmit = async (e) => {

        e.preventDefault();
        // Validar que la unidad de medida sea obligatoria
        if (!formData.unidadVenta) {
            showAlert('warning', 'La unidad de medida es obligatoria');
            return;
        }
        const validationError = validateProductForm(formData);
        if (validationError) {
            showAlert('warning', validationError);
            return;
        }

        const empresaId = formData.empresa && String(formData.empresa).trim() !== ''
            ? await getOrCreateEntityId('empresa', formData.empresa, fetchEmpresas, crearEmpresa)
            : null;
        const categoriaId = formData.categoria && String(formData.categoria).trim() !== ''
            ? await getOrCreateEntityId('categoria', formData.categoria, fetchCategorias, crearCategoria)
            : null;
        const marcaId = formData.marca && String(formData.marca).trim() !== ''
            ? await getOrCreateEntityId('marca', formData.marca, fetchMarcas, crearMarca)
            : null;
        let lineaId = null;
        if (formData.linea && String(formData.linea).trim() !== '') {
            lineaId = await getOrCreateEntityId('linea', formData.linea, fetchLineas, crearLinea);
        } else {
            lineaId = null;
        }

        const producto = {
            codigo: formData.codigo,
            nombre: formData.nombre,
            unidad_ingreso: formData.unidadVenta || 'Unidad',
            stock_minimo: formData.stockMinimo ? Number(formData.stockMinimo) : 0,
            stock_maximo: formData.stockMaximo ? Number(formData.stockMaximo) : null,
            estado: 'ACTIVO',
            id_empresa: empresaId,
            id_categoria: categoriaId,
            id_marca: marcaId,
            id_linea: lineaId === '' ? null : lineaId,
            id_unidad_medida: formData.unidadVenta
        };

        try {
            if (formMode === 'editing') {
                await editarProducto(editingId, producto);
                showAlert('success', 'Producto actualizado correctamente');
            } else {
                await crearProducto(producto);
                showAlert('success', 'Producto creado correctamente');
            }

            handleCancel();
            EventBus.dispatchEvent(new Event('PRODUCTS_UPDATED'));
            fetchProductos();
        } catch (error) {
            if (error.error && error.error.includes('Duplicate entry')) {
                showAlert('error', 'Ya existe un producto con ese código.');
            } else {
                const action = formMode === 'editing' ? 'actualizar' : 'crear';
                showAlert('error', `Error al ${action} producto: ` + (error.error || error.message));
            }
        }
    }

    const handleExportToPDF = () => {
        if (filteredProducts.length === 0) {
            showAlert('warning', 'No hay productos para exportar');
            return;
        }

        try {
            const doc = new jsPDF();

            const pageWidth = doc.internal.pageSize.width;

            doc.setFontSize(16);
            const titulo = 'Reporte de Productos';
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
                'Stock Mín',
                'Stock Máx',
                'Empresa',
                'Categoría',
                'Línea',
                'Marca'
            ];

            const tableData = filteredProducts.map(product => [
                product.codigo || '',
                product.nombre || '',
                product.unidad_ingreso || product.unidadVenta || '',
                product.stock_minimo || 0,
                product.stock_maximo || '',
                product.empresa || '',
                product.categoria || '',
                product.linea || '',
                product.marca || ''
            ]);

            // Calcular margen para centrar la tabla
            const tableWidth = 18 + 35 + 15 + 15 + 15 + 20 + 20 + 20 + 20; // 178mm
            const leftMargin = (pageWidth - tableWidth) / 2;

            // Crear la tabla
            autoTable(doc, {
                head: [tableHeaders],
                body: tableData,
                startY: 30,
                styles: {
                    fontSize: 6,
                    cellPadding: 1,
                    overflow: 'linebreak'
                },
                headStyles: {
                    fillColor: [41, 128, 185],
                    textColor: 255,
                    fontSize: 7,
                    fontStyle: 'bold',
                    cellPadding: 1,
                    halign: 'center'
                },
                alternateRowStyles: {
                    fillColor: [248, 249, 250]
                },
                margin: { top: 35, left: leftMargin, right: leftMargin },
                columnStyles: {
                    0: { cellWidth: 18, halign: 'center' }, // Código
                    1: { cellWidth: 35, halign: 'left' }, // Nombre
                    2: { cellWidth: 15, halign: 'center' }, // Unidad
                    3: { cellWidth: 15, halign: 'center' }, // Stock Mín
                    4: { cellWidth: 15, halign: 'center' }, // Stock Máx
                    5: { cellWidth: 20, halign: 'center' }, // Empresa
                    6: { cellWidth: 20, halign: 'center' }, // Categoría
                    7: { cellWidth: 20, halign: 'center' }, // Línea
                    8: { cellWidth: 20, halign: 'center' }  // Marca
                },
                theme: 'grid'
            });

            const pageHeight = doc.internal.pageSize.height;
            doc.setFontSize(8);
            doc.text(`Total de productos: ${filteredProducts.length}`, 14, pageHeight - 10);

            const fileName = `productos_${new Date().toISOString().slice(0, 10)}.pdf`;
            doc.save(fileName);

            showAlert('success', 'PDF generado correctamente');
        } catch (error) {
            console.error('Error al generar PDF:', error);
            showAlert('error', 'Error al generar el PDF');
        }
    };

    // Opciones únicas para cada filtro
    const empresaOptions = [
        { value: '', label: 'Todas' },
        ...Array.from(new Set(products.map(p => p.empresa))).filter(Boolean).map(val => ({ value: val, label: val }))
    ];
    const categoriaOptions = [
        { value: '', label: 'Todas' },
        ...Array.from(new Set(products.map(p => p.categoria))).filter(Boolean).map(val => ({ value: val, label: val }))
    ];
    const lineaOptions = [
        { value: '', label: 'Todas' },
        ...Array.from(new Set(products.map(p => p.linea))).filter(Boolean).map(val => ({ value: val, label: val }))
    ];
    const marcaOptions = [
        { value: '', label: 'Todas' },
        ...Array.from(new Set(products.map(p => p.marca))).filter(Boolean).map(val => ({ value: val, label: val }))
    ];
    const unidadOptions = [
        { value: '', label: 'Todas' },
        ...Array.from(new Set(products.map(p => p.unidad_ingreso || p.unidadVenta))).filter(Boolean).map(val => ({ value: val, label: val }))
    ];
    const codigoOptions = [
        { value: '', label: 'Todos' },
        ...Array.from(new Set(products.map(p => p.codigo))).filter(Boolean).map(val => ({ value: val, label: val }))
    ];
    const nombreOptions = [
        { value: '', label: 'Todos' },
        ...Array.from(new Set(products.map(p => p.nombre))).filter(Boolean).map(val => ({ value: val, label: val }))
    ];
    const stockMaxOptions = [
        { value: '', label: 'Todos' },
        ...Array.from(new Set(products.map(p => p.stock_maximo).filter(Boolean))).sort((a, b) => a - b).map(val => ({ value: String(val), label: val.toString() }))
    ];
    const stockMinOptions = [
        { value: '', label: 'Todos' },
        ...Array.from(new Set(products.map(p => p.stock_minimo || 0))).sort((a, b) => a - b).map(val => ({ value: String(val), label: val.toString() }))
    ];

    let filteredProducts = products.filter(product =>
        (filters.empresa === '' || product.empresa === filters.empresa) &&
        (filters.categoria === '' || product.categoria === filters.categoria) &&
        (filters.linea === '' || product.linea === filters.linea) &&
        (filters.marca === '' || product.marca === filters.marca) &&
        (filters.codigo === '' || product.codigo === filters.codigo) &&
        (filters.nombre === '' || product.nombre === filters.nombre) &&
        (filters.unidad === '' || (product.unidad_ingreso || product.unidadVenta) === filters.unidad) &&
        (filters.stockMinimo === '' || (product.stock_minimo || 0) == filters.stockMinimo) &&
        (filters.stockMaximo === '' || product.stock_maximo == filters.stockMaximo)
    );

    if (sortConfig.key && sortConfig.direction) {
        filteredProducts = [...filteredProducts].sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            // Manejo especial para unidades
            if (sortConfig.key === 'unidad') {
                aValue = a.unidad_ingreso || a.unidadVenta || '';
                bValue = b.unidad_ingreso || b.unidadVenta || '';
            }
            // Manejo especial para stock
            if (sortConfig.key === 'stock_minimo') {
                aValue = a.stock_minimo || 0;
                bValue = b.stock_minimo || 0;
            }
            if (sortConfig.key === 'stock_maximo') {
                aValue = a.stock_maximo || 0;
                bValue = b.stock_maximo || 0;
            }

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
    } else if (!sortConfig.key && originalProducts.length > 0) {
        filteredProducts = originalProducts.filter(product =>
            (filters.empresa === '' || product.empresa === filters.empresa) &&
            (filters.categoria === '' || product.categoria === filters.categoria) &&
            (filters.linea === '' || product.linea === filters.linea) &&
            (filters.marca === '' || product.marca === filters.marca) &&
            (filters.codigo === '' || product.codigo === filters.codigo) &&
            (filters.nombre === '' || product.nombre === filters.nombre) &&
            (filters.unidad === '' || (product.unidad_ingreso || product.unidadVenta) === filters.unidad) &&
            (filters.stockMinimo === '' || (product.stock_minimo || 0) == filters.stockMinimo) &&
            (filters.stockMaximo === '' || product.stock_maximo == filters.stockMaximo)
        );
    }

    // Exportar productos a Excel con formato profesional
    const handleExportToExcel = async () => {
        if (filteredProducts.length === 0) {
            showAlert('warning', 'No hay productos para exportar');
            return;
        }
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Productos');

            // Fila 1: Empresa y título centrado
            worksheet.mergeCells('A1:D1');
            worksheet.getCell('A1').value = 'OPTINET S.R.L.';
            worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
            worksheet.mergeCells('E1:H1');
            worksheet.getCell('E1').value = 'LISTA DE PRODUCTOS';
            worksheet.getCell('E1').alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            worksheet.getRow(1).font = { bold: true, size: 13 };

            // Fila 3: Encabezados en el nuevo orden
            const headers = [
                'Código', 'Nombre', 'Unidad', 'Stock Mín', 'Stock Máx', 'Empresa', 'Categoría', 'Línea', 'Marca'
            ];
            worksheet.addRow([]); // Fila 2 vacía
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

            // Filas de datos en el nuevo orden
            filteredProducts.forEach(product => {
                worksheet.addRow([
                    product.codigo || '',
                    product.nombre || '',
                    product.unidad_ingreso || product.unidadVenta || '',
                    product.stock_minimo || 0,
                    product.stock_maximo || '',
                    product.empresa || '',
                    product.categoria || '',
                    product.linea || '',
                    product.marca || ''
                ]);
            });

            // Bordes y alineación para todas las celdas de la tabla
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

            // Ajustar ancho de columnas automáticamente
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
            a.download = `productos_${new Date().toISOString().slice(0, 10)}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            showAlert('success', 'Excel generado correctamente');
        } catch (error) {
            console.error('Error al generar Excel:', error);
            showAlert('error', 'Error al generar el Excel');
        }
    };

    return (
        <>
            <Alert
                open={alert.open}
                type={alert.type}
                message={alert.message}
                onClose={closeAlert}
                duration={3000}
            />
            <div className="flex flex-col h-full min-h-0 space-y-2">
                <div className="col-span-4 flex gap-2 p-2 bg-white border border-gray-200">
                    <input
                        id="import-excel-input"
                        type="file"
                        accept=".xlsx"
                        onChange={handleImportExcel}
                        className="hidden"
                        disabled={formMode !== 'disabled'}
                    />

                    <div className="border-r border-gray-300 pr-2">
                        <Button
                            type="button"
                            onClick={() => {
                                if (formMode === 'disabled') {
                                    document.getElementById('import-excel-input').click();
                                }
                            }}
                            disabled={formMode !== 'disabled'}
                            className="px-4 py-1 text-xs"
                        >
                            <ArrowUpTrayIcon className="w-4 h-4 mr-1" />
                            Cargar productos
                        </Button>
                    </div>
                    <Button
                        type="button"
                        onClick={handleExportToPDF}
                        disabled={formMode !== 'disabled' || filteredProducts.length === 0}
                        className="px-4 py-1 text-xs"
                    >
                        <DocumentArrowDownIcon className="w-4 h-4 mr-1" />
                        Exportar PDF
                    </Button>

                    <div className="border-r border-gray-300 pr-2">
                        <Button
                            type="button"
                            onClick={handleExportToExcel}
                            disabled={formMode !== 'disabled' || filteredProducts.length === 0}
                            className="px-4 py-1 text-xs"
                        >
                            <ArrowUpTrayIcon className="w-4 h-4 mr-1" />
                            Exportar Excel
                        </Button></div>
                    {formMode === 'disabled' && (
                        <>
                            <Button onClick={handleCreate}>
                                <PlusIcon className="w-4 h-4" />
                                Crear
                            </Button>
                            <Button
                                onClick={handleEdit}
                                disabled={!selectedProduct}
                            >
                                <PencilIcon className="w-4 h-4" />
                                Editar
                            </Button>
                            <Button
                                onClick={handleDelete}
                                disabled={!selectedProduct}
                            >
                                <TrashIcon className="w-4 h-4" />
                                Eliminar
                            </Button>
                        </>
                    )}

                    {(formMode === 'creating' || formMode === 'editing') && (
                        <>
                            <Button onClick={handleSubmit}>
                                {formMode === 'editing' ? 'Actualizar' : 'Guardar'}
                            </Button>
                            <Button onClick={handleCancel}>
                                Cancelar
                            </Button>
                        </>
                    )}
                </div>
                {(formMode === 'creating' || formMode === 'editing') && (
                    <div className="bg-white border border-gray-200 p-2">
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-2">
                            <>
                                <div className="flex flex-col gap-2">
                                    <FormField label="Código" layout="side" required labelClassName="w-20">
                                        <Input
                                            value={formData.codigo}
                                            onChange={e => handleChange('codigo', e.target.value)}
                                            placeholder="Código"
                                            required
                                            disabled={formMode === 'disabled'}
                                        />
                                    </FormField>
                                    <FormField label="Nombre" layout="side" required labelClassName="w-20">
                                        <Input
                                            value={formData.nombre}
                                            onChange={e => handleChange('nombre', e.target.value)}
                                            placeholder="Nombre"
                                            required
                                            disabled={formMode === 'disabled'}
                                        />
                                    </FormField>
                                    <FormField label="Unidad" layout="side" labelClassName="w-20" required>
                                        <ComboBox
                                            options={unidadVentaOptions}
                                            value={formData.unidadVenta ? String(formData.unidadVenta) : ''}
                                            onSelect={value => handleChange('unidadVenta', value)}
                                            placeholder="Selecciona unidad"
                                            searchable={true}
                                            clearable={false}
                                            disabled={formMode === 'disabled'}
                                        />
                                    </FormField>
                                    <div className="flex gap-2">
                                        <FormField label="Stock mínimo" layout="side" labelClassName="w-20">
                                            <Input
                                                type="number"
                                                value={formData.stockMinimo}
                                                onChange={e => handleChange('stockMinimo', e.target.value)}
                                                placeholder="0"
                                                disabled={formMode === 'disabled'}
                                            />
                                        </FormField>
                                        <FormField label="Stock máximo" layout="side" labelClassName="w-20">
                                            <Input
                                                type="number"
                                                value={formData.stockMaximo}
                                                onChange={e => handleChange('stockMaximo', e.target.value)}
                                                placeholder="0"
                                                disabled={formMode === 'disabled'}
                                            />
                                        </FormField>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                </div>
                                <div className="flex flex-col gap-2">
                                    <FormField label="Línea" layout="side" labelClassName="w-14">
                                        <EntityManagerContainer
                                            label="Línea"
                                            value={formData.linea}
                                            onChange={value => handleChange('linea', value)}
                                            alertHandler={showAlert}
                                            fetchList={fetchLineas}
                                            createEntity={crearLinea}
                                            editEntity={editarLinea}
                                            deleteEntity={eliminarLinea}
                                            disabled={formMode === 'disabled'}
                                        />
                                    </FormField>
                                    <FormField label="Marca" layout="side" labelClassName="w-14">
                                        <EntityManagerContainer
                                            label="Marca"
                                            value={formData.marca}
                                            onChange={value => handleChange('marca', value)}
                                            alertHandler={showAlert}
                                            fetchList={fetchMarcas}
                                            createEntity={crearMarca}
                                            editEntity={editarMarca}
                                            deleteEntity={eliminarMarca}
                                            disabled={formMode === 'disabled'}
                                        />
                                    </FormField>
                                    <FormField label="Empresa" layout="side" labelClassName="w-14">
                                        <EntityManagerContainer
                                            label="Empresa"
                                            value={formData.empresa}
                                            onChange={value => handleChange('empresa', value)}
                                            alertHandler={showAlert}
                                            fetchList={fetchEmpresas}
                                            createEntity={crearEmpresa}
                                            editEntity={editarEmpresa}
                                            deleteEntity={eliminarEmpresa}
                                            disabled={formMode === 'disabled'}
                                        />
                                    </FormField>
                                    <FormField label="Categoría" layout="side" labelClassName="w-14">
                                        <EntityManagerContainer
                                            label="Categoría"
                                            value={formData.categoria}
                                            onChange={value => handleChange('categoria', value)}
                                            alertHandler={showAlert}
                                            fetchList={fetchCategorias}
                                            createEntity={crearCategoria}
                                            editEntity={editarCategoria}
                                            deleteEntity={eliminarCategoria}
                                            disabled={formMode === 'disabled'}
                                        />
                                    </FormField>
                                </div>
                            </>
                        </form>
                    </div>
                )}
                <div className="bg-white border border-gray-200 flex-1 min-h-0 flex flex-col overflow-hidden">
                    <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="sticky top-0 bg-gray-50 z-10 p-2 text-center text-xs font-medium text-black uppercase tracking-wider">#</th>
                                    <th className="sticky top-0 bg-gray-50 z-10 p-2 text-left text-xs font-medium text-black uppercase tracking-wider whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort('codigo')}>Código{sortConfig.key === 'codigo' && (sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '')}</th>
                                    <th className="sticky top-0 bg-gray-50 z-10 p-2 text-left text-xs font-medium text-black uppercase tracking-wider whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort('nombre')}>Nombre{sortConfig.key === 'nombre' && (sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '')}</th>
                                    <th className="sticky top-0 bg-gray-50 z-10 p-2 text-left text-xs font-medium text-black uppercase tracking-wider whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort('unidad')}>Unidad{sortConfig.key === 'unidad' && (sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '')}</th>
                                    <th className="sticky top-0 bg-gray-50 z-10 p-2 text-left text-xs font-medium text-black uppercase tracking-wider whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort('stock_minimo')}>Stock Mín{sortConfig.key === 'stock_minimo' && (sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '')}</th>
                                    <th className="sticky top-0 bg-gray-50 z-10 p-2 text-left text-xs font-medium text-black uppercase tracking-wider whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort('stock_maximo')}>Stock Máx{sortConfig.key === 'stock_maximo' && (sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '')}</th>
                                    <th className="sticky top-0 bg-gray-50 z-10 p-2 text-left text-xs font-medium text-black uppercase tracking-wider whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort('empresa')}>Empresa{sortConfig.key === 'empresa' && (sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '')}</th>
                                    <th className="sticky top-0 bg-gray-50 z-10 p-2 text-left text-xs font-medium text-black uppercase tracking-wider whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort('categoria')}>Categoría{sortConfig.key === 'categoria' && (sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '')}</th>
                                    <th className="sticky top-0 bg-gray-50 z-10 p-2 text-left text-xs font-medium text-black uppercase tracking-wider whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort('linea')}>Línea{sortConfig.key === 'linea' && (sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '')}</th>
                                    <th className="sticky top-0 bg-gray-50 z-10 p-2 text-left text-xs font-medium text-black uppercase tracking-wider whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort('marca')}>Marca{sortConfig.key === 'marca' && (sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '')}</th>
                                </tr>
                                <tr className="bg-gray-50 text-start">
                                    <th></th>
                                    <th>
                                        <ComboBox
                                            value={filters.codigo}
                                            onChange={v => setFilters(f => ({ ...f, codigo: v }))}
                                            options={codigoOptions}
                                            className="font-normal text-left"
                                        />
                                    </th>
                                    <th>
                                        <ComboBox
                                            value={filters.nombre}
                                            onChange={v => setFilters(f => ({ ...f, nombre: v }))}
                                            options={nombreOptions}
                                            className="font-normal text-left"
                                        />
                                    </th>
                                    <th>
                                        <ComboBox
                                            value={filters.unidad}
                                            onChange={v => setFilters(f => ({ ...f, unidad: v }))}
                                            options={unidadOptions}
                                            className="font-normal text-left"
                                        />
                                    </th>
                                    <th>
                                        <ComboBox
                                            value={filters.stockMinimo}
                                            onChange={v => setFilters(f => ({ ...f, stockMinimo: v }))}
                                            options={stockMinOptions}
                                            className="font-normal text-left"
                                        />
                                    </th>
                                    <th>
                                        <ComboBox
                                            value={filters.stockMaximo}
                                            onChange={v => setFilters(f => ({ ...f, stockMaximo: v }))}
                                            options={stockMaxOptions}
                                            className="font-normal text-left"
                                        />
                                    </th>
                                    <th>
                                        <ComboBox
                                            value={filters.empresa}
                                            onChange={v => setFilters(f => ({ ...f, empresa: v }))}
                                            options={empresaOptions}
                                            className="font-normal text-left"
                                        />
                                    </th>
                                    <th>
                                        <ComboBox
                                            value={filters.categoria}
                                            onChange={v => setFilters(f => ({ ...f, categoria: v }))}
                                            options={categoriaOptions}
                                            className="font-normal text-left"
                                        />
                                    </th>
                                    <th>
                                        <ComboBox
                                            value={filters.linea}
                                            onChange={v => setFilters(f => ({ ...f, linea: v }))}
                                            options={lineaOptions}
                                            className="font-normal text-left"
                                        />
                                    </th>
                                    <th>
                                        <ComboBox
                                            value={filters.marca}
                                            onChange={v => setFilters(f => ({ ...f, marca: v }))}
                                            options={marcaOptions}
                                            className="font-normal text-left"
                                        />
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredProducts.map((product, idx) => (
                                    <tr
                                        key={product.id_producto || idx}
                                        className={`hover:bg-slate-600 hover:text-white cursor-pointer transition-colors ${selectedProduct?.id_producto === product.id_producto ? 'bg-slate-600 text-white' : ''}`}
                                        onClick={() => handleRowSelect(product)}
                                    >
                                        <td className="p-2 text-xs text-center">{idx + 1}</td>
                                        <td className="p-2 text-xs truncate whitespace-nowrap" title={product.codigo}>{product.codigo}</td>
                                        <td className="p-2 text-xs truncate whitespace-nowrap" title={product.nombre}>{product.nombre}</td>
                                        <td className="p-2 text-xs truncate whitespace-nowrap" title={product.unidad_ingreso || product.unidadVenta}>{product.unidad_ingreso || product.unidadVenta || ''}</td>
                                        <td className="p-2 text-xs text-center whitespace-nowrap">{product.stock_minimo || 0}</td>
                                        <td className="p-2 text-xs text-center whitespace-nowrap">{product.stock_maximo || '-'}</td>
                                        <td className="p-2 text-xs truncate whitespace-nowrap" title={product.empresa}>{product.empresa || ''}</td>
                                        <td className="p-2 text-xs truncate whitespace-nowrap" title={product.categoria}>{product.categoria || ''}</td>
                                        <td className="p-2 text-xs truncate whitespace-nowrap" title={product.linea}>{product.linea || ''}</td>
                                        <td className="p-2 text-xs truncate whitespace-nowrap" title={product.marca}>{product.marca || ''}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredProducts.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            {products.length > 0 ? 'No se encontraron productos que coincidan con los filtros' : 'No hay productos registrados'}
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default Products