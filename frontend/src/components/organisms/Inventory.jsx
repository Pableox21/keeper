import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Alert } from '../atoms';
import Button from '../atoms/Button';
import { FormField, ComboBox } from '../molecules';
import { fetchInventarioPorAlmacen, fetchAlmacenes } from '../../api/inventarios';
import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import EventBus from '../../utils/EventBus';

function Inventory() {
    // Cargar inventario cada vez que cambia el almacén seleccionado
    const [items, setItems] = useState([]);
    const [originalItems, setOriginalItems] = useState([]);
    const [almacenes, setAlmacenes] = useState([]);
    const [selectedAlmacen, setSelectedAlmacen] = useState('');
    const [loadedAlmacen, setLoadedAlmacen] = useState('');
    const [selectedInventario, setSelectedInventario] = useState(null);
    const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });
    const [loading, setLoading] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
    // Ya no se carga el inventario automáticamente al cambiar el almacén seleccionado
    useEffect(() => {
        loadAlmacenes();
        // Suscribirse a eventos de actualización global
        const handler = () => {
            if (loadedAlmacen) {
                fetchInventarioPorAlmacen(loadedAlmacen).then(data => {
                    setItems(data);
                    setOriginalItems(data);
                });
            }
        };
        EventBus.addEventListener('INVENTORY_UPDATED', handler);
        return () => EventBus.removeEventListener('INVENTORY_UPDATED', handler);
    }, [loadedAlmacen]);
    async function loadAlmacenes() {
        try {
            const data = await fetchAlmacenes();
            setAlmacenes(data);
        } catch (error) {
            setAlert({ open: true, type: 'error', message: 'Error al cargar almacenes', error });
        }
    }
    async function loadInventario() {
        if (!selectedAlmacen) {
            setAlert({ open: true, type: 'warning', message: 'Debe seleccionar un almacén' });
            return;
        }
        setLoading(true);
        try {
            const data = await fetchInventarioPorAlmacen(selectedAlmacen);
            setItems(data);
            setOriginalItems(data);
            setLoadedAlmacen(selectedAlmacen);
            setAlert({ open: true, type: 'success', message: 'Inventario cargado correctamente' });
        } catch (error) {
            setAlert({ open: true, type: 'error', message: 'Error al cargar inventario', error });
        } finally {
            setLoading(false);
        }
    }
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
    const [filters, setFilters] = useState({
        producto_codigo: '',
        producto_nombre: '',
        unidad_ingreso: '',
        stock_actual: '',
        stock_minimo: '',
        stock_maximo: '',
        costo_promedio: '',
        empresa_nombre: '',
        categoria_nombre: '',
        linea_nombre: '',
        marca_nombre: ''
    });
    const codigoOptions = [
        { value: '', label: 'Todos' },
        ...Array.from(new Set(items.map(i => i.producto_codigo))).filter(Boolean).map(val => ({ value: val, label: val }))
    ];
    const nombreOptions = [
        { value: '', label: 'Todos' },
        ...Array.from(new Set(items.map(i => i.producto_nombre))).filter(Boolean).map(val => ({ value: val, label: val }))
    ];
    const unidadOptions = [
        { value: '', label: 'Todas' },
        ...Array.from(new Set(items.map(i => i.unidad_ingreso))).filter(Boolean).map(val => ({ value: val, label: val }))
    ];
    const stockActualOptions = [
        { value: '', label: 'Todos' },
        ...Array.from(new Set(items.map(i => i.stock_actual))).map(val => ({ value: String(val), label: String(val) }))
    ];
    const stockMinimoOptions = [
        { value: '', label: 'Todos' },
        ...Array.from(new Set(items.map(i => i.stock_minimo))).map(val => ({ value: String(val), label: String(val) }))
    ];
    const stockMaximoOptions = [
        { value: '', label: 'Todos' },
        ...Array.from(new Set(items.map(i => i.stock_maximo))).map(val => ({ value: String(val), label: String(val) }))
    ];
    const costoPromedioOptions = [
        { value: '', label: 'Todos' },
        ...Array.from(new Set(items.map(i => parseFloat(i.costo_promedio).toFixed(2)))).map(val => ({ value: val, label: val }))
    ];
    const empresaOptions = [
        { value: '', label: 'Todas' },
        ...Array.from(new Set(items.map(i => i.empresa_nombre))).filter(Boolean).map(val => ({ value: val, label: val }))
    ];
    const categoriaOptions = [
        { value: '', label: 'Todas' },
        ...Array.from(new Set(items.map(i => i.categoria_nombre))).filter(Boolean).map(val => ({ value: val, label: val }))
    ];
    const lineaOptions = [
        { value: '', label: 'Todas' },
        ...Array.from(new Set(items.map(i => i.linea_nombre))).filter(Boolean).map(val => ({ value: val, label: val }))
    ];
    const marcaOptions = [
        { value: '', label: 'Todas' },
        ...Array.from(new Set(items.map(i => i.marca_nombre))).filter(Boolean).map(val => ({ value: val, label: val }))
    ];
    const isAlmacenCentral = almacenes.find(a => String(a.id) === loadedAlmacen)?.nombre?.toLowerCase().includes('central') || false;
    let filteredItems = items.filter(item =>
        (filters.producto_codigo === '' || (item.producto_codigo || '').toLowerCase().includes(filters.producto_codigo.toLowerCase())) &&
        (filters.producto_nombre === '' || (item.producto_nombre || '').toLowerCase().includes(filters.producto_nombre.toLowerCase())) &&
        (filters.unidad_ingreso === '' || (item.unidad_ingreso || '') === filters.unidad_ingreso) &&
        (filters.stock_actual === '' || String(item.stock_actual).includes(filters.stock_actual)) &&
        (filters.stock_minimo === '' || String(item.stock_minimo).includes(filters.stock_minimo)) &&
        (filters.stock_maximo === '' || String(item.stock_maximo).includes(filters.stock_maximo)) &&
        (filters.costo_promedio === '' || parseFloat(item.costo_promedio).toFixed(2).includes(filters.costo_promedio)) &&
        (filters.empresa_nombre === '' || (item.empresa_nombre || '') === filters.empresa_nombre) &&
        (filters.categoria_nombre === '' || (item.categoria_nombre || '') === filters.categoria_nombre) &&
        (filters.linea_nombre === '' || (item.linea_nombre || '') === filters.linea_nombre) &&
        (filters.marca_nombre === '' || (item.marca_nombre || '') === filters.marca_nombre)
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
            (filters.producto_codigo === '' || (item.producto_codigo || '').toLowerCase().includes(filters.producto_codigo.toLowerCase())) &&
            (filters.producto_nombre === '' || (item.producto_nombre || '').toLowerCase().includes(filters.producto_nombre.toLowerCase())) &&
            (filters.unidad_ingreso === '' || (item.unidad_ingreso || '') === filters.unidad_ingreso) &&
            (filters.stock_actual === '' || String(item.stock_actual).includes(filters.stock_actual)) &&
            (filters.stock_minimo === '' || String(item.stock_minimo).includes(filters.stock_minimo)) &&
            (filters.stock_maximo === '' || String(item.stock_maximo).includes(filters.stock_maximo)) &&
            (filters.costo_promedio === '' || parseFloat(item.costo_promedio).toFixed(2).includes(filters.costo_promedio)) &&
            (filters.empresa_nombre === '' || (item.empresa_nombre || '') === filters.empresa_nombre) &&
            (filters.categoria_nombre === '' || (item.categoria_nombre || '') === filters.categoria_nombre) &&
            (filters.linea_nombre === '' || (item.linea_nombre || '') === filters.linea_nombre) &&
            (filters.marca_nombre === '' || (item.marca_nombre || '') === filters.marca_nombre)
        );
    }

    const handleExportInventoryToPDF = () => {
        if (!filteredItems || filteredItems.length === 0) {
            setAlert({ open: true, type: 'warning', message: 'No hay inventario para exportar' });
            return;
        }
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const almacenActual = almacenes.find(a => String(a.id) === loadedAlmacen);
            const nombreAlmacen = almacenActual ? almacenActual.nombre : 'Almacén';
            const isAlmacenCentral = almacenActual && almacenActual.nombre.toLowerCase().includes('central');
            doc.setFontSize(16);
            const empresa = 'OPTINET S.R.L.';
            const titulo = `INVENTARIO - ${nombreAlmacen.toUpperCase()}`;
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
                'Stock Actual',
                'Stock Mín.',
                'Stock Máx.',
                'Costo Prom.',
                'Empresa',
                'Categoría'
            ];
            const tableData = filteredItems.map(item => {
                const stockActual = Number(item.stock_actual) || 0;
                const stockMinimo = Number(item.stock_minimo) || 0;
                const stockMaximo = Number(item.stock_maximo) || 0;

                let stockStatus = 'normal';
                if (isAlmacenCentral) {
                    if (stockMinimo === 0 && stockMaximo === 0) {
                        stockStatus = 'warning';
                    } else if (stockActual < stockMinimo || (stockMaximo > 0 && stockActual > stockMaximo)) {
                        stockStatus = 'danger';
                    } else if (stockMinimo === 0 || stockMaximo === 0) {
                        stockStatus = 'warning';
                    }
                }

                return {
                    data: [
                        item.producto_codigo || '-',
                        item.producto_nombre || '-',
                        item.unidad_ingreso || '-',
                        item.stock_actual || '0',
                        item.stock_minimo || '0',
                        item.stock_maximo || '0',
                        parseFloat(item.costo_promedio || 0).toFixed(2),
                        item.empresa_nombre || '-',
                        item.categoria_nombre || '-'
                    ],
                    status: stockStatus
                };
            });

            const tableWidth = 18 + 30 + 12 + 15 + 15 + 15 + 18 + 20 + 20;
            const leftMargin = (pageWidth - tableWidth) / 2;

            autoTable(doc, {
                head: [tableHeaders],
                body: tableData.map(item => item.data),
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
                    0: { cellWidth: 18, halign: 'center' },
                    1: { cellWidth: 30, halign: 'left' },
                    2: { cellWidth: 12, halign: 'center' },
                    3: { cellWidth: 15, halign: 'center' },
                    4: { cellWidth: 15, halign: 'center' },
                    5: { cellWidth: 15, halign: 'center' },
                    6: { cellWidth: 18, halign: 'right' },
                    7: { cellWidth: 20, halign: 'center' },
                    8: { cellWidth: 20, halign: 'center' }
                },
                theme: 'grid',
                didParseCell: function (data) {
                    // Aplicar colores solo para almacén central
                    if (isAlmacenCentral && data.section === 'body') {
                        const rowIndex = data.row.index;
                        const status = tableData[rowIndex]?.status;

                        if (status === 'danger') {
                            data.cell.styles.fillColor = [255, 220, 220]; // Rojo claro
                            data.cell.styles.textColor = [180, 0, 0]; // Rojo oscuro
                        } else if (status === 'warning') {
                            data.cell.styles.fillColor = [255, 240, 200]; // Naranja claro
                            data.cell.styles.textColor = [200, 120, 0]; // Naranja oscuro
                        }
                    }
                }
            });

            const pageHeight = doc.internal.pageSize.height;
            doc.setFontSize(8);
            doc.text(`Total de ítems: ${filteredItems.length}`, 14, pageHeight - 10);

            // Agregar leyenda para almacén central
            if (isAlmacenCentral) {
                doc.setFontSize(7);
                doc.text('Leyenda: Rojo = Fuera de rango, Naranja = Límites incompletos', 14, pageHeight - 5);
            }

            const fileName = `inventario_${nombreAlmacen.replace(/\s/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
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
            const worksheet = workbook.addWorksheet('Inventario');

            // Obtener nombre del almacén actual
            const almacenActual = almacenes.find(a => String(a.id) === loadedAlmacen);
            const nombreAlmacen = almacenActual ? almacenActual.nombre : 'Almacén';
            const isAlmacenCentral = almacenActual && almacenActual.nombre.toLowerCase().includes('central');

            worksheet.mergeCells('A1:D1');
            worksheet.getCell('A1').value = 'OPTINET S.R.L.';
            worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
            worksheet.mergeCells('E1:I1');
            worksheet.getCell('E1').value = `INVENTARIO - ${nombreAlmacen.toUpperCase()}`;
            worksheet.getCell('E1').alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            worksheet.getRow(1).font = { bold: true, size: 13 };

            const headers = ['Código', 'Nombre', 'Unidad', 'Stock Actual', 'Stock Mín.', 'Stock Máx.', 'Costo Prom.', 'Empresa', 'Categoría'];
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

            // Agregar datos con colores condicionales
            filteredItems.forEach((item) => {
                const stockActual = Number(item.stock_actual) || 0;
                const stockMinimo = Number(item.stock_minimo) || 0;
                const stockMaximo = Number(item.stock_maximo) || 0;

                const row = worksheet.addRow([
                    item.producto_codigo || '-',
                    item.producto_nombre || '-',
                    item.unidad_ingreso || '-',
                    item.stock_actual || '0',
                    item.stock_minimo || '0',
                    item.stock_maximo || '0',
                    parseFloat(item.costo_promedio || 0).toFixed(2),
                    item.empresa_nombre || '-',
                    item.categoria_nombre || '-'
                ]);

                // Aplicar colores solo para almacén central
                if (isAlmacenCentral) {
                    let fillColor = null;

                    if (stockMinimo === 0 && stockMaximo === 0) {
                        fillColor = 'FFFFEACC'; // Naranja claro
                    } else if (stockActual < stockMinimo || (stockMaximo > 0 && stockActual > stockMaximo)) {
                        fillColor = 'FFFFCCCC'; // Rojo claro
                    } else if (stockMinimo === 0 || stockMaximo === 0) {
                        fillColor = 'FFFFEACC'; // Naranja claro
                    }

                    if (fillColor) {
                        row.eachCell(cell => {
                            cell.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: fillColor }
                            };
                        });
                    }
                }
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

            // Agregar leyenda para almacén central
            if (isAlmacenCentral) {
                worksheet.addRow([]);
                const leyendaTextRow = worksheet.addRow(['Leyenda:', 'Rojo = Fuera de rango', 'Naranja = Límites incompletos']);
                leyendaTextRow.font = { bold: true, size: 10 };
            }

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
            a.download = `inventario_${nombreAlmacen.replace(/\s/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
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
            <Alert open={alert.open} type={alert.type} message={alert.message} onClose={() => setAlert(a => ({ ...a, open: false }))} duration={3000} />
            <div className="flex flex-col gap-2 h-full min-h-0">
                <div className="flex gap-2 mb-2 items-center flex-shrink-0">
                    <FormField label="Almacén" layout='side'>
                        <ComboBox
                            value={selectedAlmacen}
                            onChange={setSelectedAlmacen}
                            placeholder='Seleccione un almacén'
                            options={[
                                { value: '', label: 'Seleccione un almacén' },
                                ...almacenes.map(almacen => ({
                                    value: String(almacen.id),
                                    label: `${almacen.nombre}`
                                }))
                            ]}
                        />
                    </FormField>
                    <div className="border-r border-gray-300 pr-2">
                        <Button
                            color="primary"
                            onClick={loadInventario}
                            disabled={loading || !selectedAlmacen}
                            className="flex items-center gap-2"
                        >
                            <MagnifyingGlassIcon className="w-4 h-4" />
                            {'Cargar Inventario'}
                        </Button>
                    </div>
                    <Button
                        type="button"
                        onClick={handleExportInventoryToPDF}
                        disabled={loading || !filteredItems || filteredItems.length === 0}
                        className="px-4 py-1 text-xs"
                    >
                        Exportar PDF
                    </Button>

                    <div className="border-r border-gray-300 pr-2">
                        <Button
                            type="button"
                            onClick={handleExportInventoryToExcel}
                            disabled={loading || !filteredItems || filteredItems.length === 0}
                            className="px-4 py-1 text-xs "
                        >
                            Exportar Excel
                        </Button>
                    </div>
                    {filteredItems.length > 0 && isAlmacenCentral && (
                        <div className="flex gap-3 ml-4">
                            <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-red-100 border border-red-200">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <span className="text-xs font-medium text-red-700">
                                    Críticos: {filteredItems.filter(item => {
                                        const stockActual = Number(item.stock_actual) || 0;
                                        const stockMinimo = Number(item.stock_minimo) || 0;
                                        const stockMaximo = Number(item.stock_maximo) || 0;
                                        return stockMinimo > 0 && stockMaximo > 0 && (stockActual < stockMinimo || stockActual > stockMaximo);
                                    }).length}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-orange-100 border border-orange-200">
                                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                <span className="text-xs font-medium text-orange-700">
                                    Sin límites: {filteredItems.filter(item => {
                                        const stockMinimo = Number(item.stock_minimo) || 0;
                                        const stockMaximo = Number(item.stock_maximo) || 0;
                                        return stockMinimo === 0 || stockMaximo === 0;
                                    }).length}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-green-100 border border-green-200">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span className="text-xs font-medium text-green-700">
                                    Normales: {filteredItems.filter(item => {
                                        const stockActual = Number(item.stock_actual) || 0;
                                        const stockMinimo = Number(item.stock_minimo) || 0;
                                        const stockMaximo = Number(item.stock_maximo) || 0;
                                        return stockMinimo > 0 && stockMaximo > 0 && stockActual >= stockMinimo && stockActual <= stockMaximo;
                                    }).length}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-1 min-h-0 overflow-auto border border-gray-200">
                    <table className="min-w-full text-xs">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort('producto_codigo')}>
                                    Código
                                    {sortConfig.key === 'producto_codigo' && (sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '')}
                                </th>
                                <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort('producto_nombre')}>
                                    Nombre
                                    {sortConfig.key === 'producto_nombre' && (sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '')}
                                </th>
                                <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort('unidad_ingreso')}>
                                    Unidad
                                    {sortConfig.key === 'unidad_ingreso' && (sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '')}
                                </th>
                                <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort('stock_actual')}>
                                    Stock Actual
                                    {sortConfig.key === 'stock_actual' && (sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '')}
                                </th>
                                <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort('stock_minimo')}>
                                    Stock Mínimo
                                    {sortConfig.key === 'stock_minimo' && (sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '')}
                                </th>
                                <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort('stock_maximo')}>
                                    Stock Máximo
                                    {sortConfig.key === 'stock_maximo' && (sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '')}
                                </th>
                                <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort('costo_promedio')}>
                                    Costo Promedio
                                    {sortConfig.key === 'costo_promedio' && (sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '')}
                                </th>
                                <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort('empresa_nombre')}>
                                    Empresa
                                    {sortConfig.key === 'empresa_nombre' && (sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '')}
                                </th>
                                <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort('categoria_nombre')}>
                                    Categoría
                                    {sortConfig.key === 'categoria_nombre' && (sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '')}
                                </th>
                                <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort('linea_nombre')}>
                                    Línea
                                    {sortConfig.key === 'linea_nombre' && (sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '')}
                                </th>
                                <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider whitespace-nowrap cursor-pointer select-none" onClick={() => handleSort('marca_nombre')}>
                                    Marca
                                    {sortConfig.key === 'marca_nombre' && (sortConfig.direction === 'asc' ? ' ▲' : sortConfig.direction === 'desc' ? ' ▼' : '')}
                                </th>
                            </tr>
                            <tr className="bg-gray-50">
                                <th>
                                    <ComboBox
                                        value={filters.producto_codigo}
                                        onChange={v => setFilters(f => ({ ...f, producto_codigo: v }))}
                                        options={codigoOptions}
                                        placeholder="Filtrar"
                                    />
                                </th>
                                <th>
                                    <ComboBox
                                        value={filters.producto_nombre}
                                        onChange={v => setFilters(f => ({ ...f, producto_nombre: v }))}
                                        options={nombreOptions}
                                        placeholder="Filtrar"
                                    />
                                </th>
                                <th>
                                    <ComboBox
                                        value={filters.unidad_ingreso}
                                        onChange={v => setFilters(f => ({ ...f, unidad_ingreso: v }))}
                                        options={unidadOptions}
                                        placeholder="Filtrar"
                                    />
                                </th>
                                <th>
                                    <ComboBox
                                        value={filters.stock_actual}
                                        onChange={v => setFilters(f => ({ ...f, stock_actual: v }))}
                                        options={stockActualOptions}
                                        placeholder="Filtrar"
                                    />
                                </th>
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
                                        value={filters.costo_promedio}
                                        onChange={v => setFilters(f => ({ ...f, costo_promedio: v }))}
                                        options={costoPromedioOptions}
                                        placeholder="Filtrar"
                                    />
                                </th>
                                <th>
                                    <ComboBox
                                        value={filters.empresa_nombre}
                                        onChange={v => setFilters(f => ({ ...f, empresa_nombre: v }))}
                                        options={empresaOptions}
                                        placeholder="Filtrar"
                                    />
                                </th>
                                <th>
                                    <ComboBox
                                        value={filters.categoria_nombre}
                                        onChange={v => setFilters(f => ({ ...f, categoria_nombre: v }))}
                                        options={categoriaOptions}
                                        placeholder="Filtrar"
                                    />
                                </th>
                                <th>
                                    <ComboBox
                                        value={filters.linea_nombre}
                                        onChange={v => setFilters(f => ({ ...f, linea_nombre: v }))}
                                        options={lineaOptions}
                                        placeholder="Filtrar"
                                    />
                                </th>
                                <th>
                                    <ComboBox
                                        value={filters.marca_nombre}
                                        onChange={v => setFilters(f => ({ ...f, marca_nombre: v }))}
                                        options={marcaOptions}
                                        placeholder="Filtrar"
                                    />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map(item => {
                                // Lógica para determinar el estado del stock - Solo para almacén central
                                const stockActual = Number(item.stock_actual) || 0;
                                const stockMinimo = Number(item.stock_minimo) || 0;
                                const stockMaximo = Number(item.stock_maximo) || 0;

                                // Determinar el estado del stock solo si es almacén central
                                let stockStatus = 'normal'; // normal, warning, danger

                                if (isAlmacenCentral) {
                                    // Si no hay límites definidos (mínimo = 0 Y máximo = 0)
                                    if (stockMinimo === 0 && stockMaximo === 0) {
                                        stockStatus = 'warning'; // Naranja - sin límites
                                    }
                                    // Si hay límites definidos, verificar si está fuera de rango
                                    else if (stockActual < stockMinimo || (stockMaximo > 0 && stockActual > stockMaximo)) {
                                        stockStatus = 'danger'; // Rojo - fuera de rango
                                    }
                                    // Si solo falta un límite (mínimo = 0 O máximo = 0, pero no ambos)
                                    else if (stockMinimo === 0 || stockMaximo === 0) {
                                        stockStatus = 'warning'; // Naranja - límites incompletos
                                    }
                                }

                                // Determinar las clases CSS según el estado
                                let rowClasses = 'cursor-pointer transition-colors ';
                                let stockClasses = 'p-2 text-xs text-right whitespace-nowrap ';

                                if (selectedInventario?.id === item.id) {
                                    rowClasses += 'bg-blue-100 ';
                                    stockClasses += 'text-black ';
                                } else if (isAlmacenCentral && stockStatus === 'danger') {
                                    rowClasses += 'bg-red-100 hover:bg-red-200 ';
                                    stockClasses += 'text-red-700 font-semibold ';
                                } else if (isAlmacenCentral && stockStatus === 'warning') {
                                    rowClasses += 'bg-orange-100 hover:bg-orange-200 ';
                                    stockClasses += 'text-orange-700 font-semibold ';
                                } else {
                                    rowClasses += 'hover:bg-gray-50 ';
                                    stockClasses += 'text-black ';
                                }

                                return (
                                    <tr key={item.id} className={rowClasses} onClick={() => setSelectedInventario(item)}>
                                        <td className="p-2 text-xs text-black truncate whitespace-nowrap" title={item.producto_codigo}>{item.producto_codigo || ''}</td>
                                        <td className="p-2 text-xs text-black truncate whitespace-nowrap" title={item.producto_nombre}>{item.producto_nombre || ''}</td>
                                        <td className="p-2 text-xs text-black truncate whitespace-nowrap" title={item.unidad_ingreso}>{item.unidad_ingreso || ''}</td>
                                        <td className={stockClasses}>{item.stock_actual}</td>
                                        <td className="p-2 text-xs text-black text-right whitespace-nowrap">{item.stock_minimo || 0}</td>
                                        <td className="p-2 text-xs text-black text-right whitespace-nowrap">{item.stock_maximo || 0}</td>
                                        <td className="p-2 text-xs text-black text-right whitespace-nowrap">{parseFloat(item.costo_promedio).toFixed(2)}</td>
                                        <td className="p-2 text-xs text-black truncate whitespace-nowrap" title={item.empresa_nombre}>{item.empresa_nombre || ''}</td>
                                        <td className="p-2 text-xs text-black truncate whitespace-nowrap" title={item.categoria_nombre}>{item.categoria_nombre || ''}</td>
                                        <td className="p-2 text-xs text-black truncate whitespace-nowrap" title={item.linea_nombre}>{item.linea_nombre || ''}</td>
                                        <td className="p-2 text-xs text-black truncate whitespace-nowrap" title={item.marca_nombre}>{item.marca_nombre || ''}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

export default Inventory;