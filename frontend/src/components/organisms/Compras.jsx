import { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Input, Alert, Select } from '../atoms';
import { ComboBox } from '../molecules';
import { fetchProductos as apiFetchProductos } from '../../api/productos';
import { fetchProveedores } from '../../api/proveedores';
// import { fetchAlmacenes } from '../../api/almacenes';
import { fetchIngresos, fetchIngresoById, crearIngreso, eliminarIngreso, actualizarIngreso } from '../../api/ingresos';
import Button from '../atoms/Button';
import { FormField } from '../molecules';
import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import EventBus from '../../utils/EventBus';

const usuarioLogueado = { id: 1, nombre: 'Usuario Demo' };

function getHoraActual() {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
}

function getFechaActual() {
    const now = new Date();
    return now.toISOString().slice(0, 10);
}

function Compras() {
    const [alert, setAlert] = useState({ open: false, type: 'info', message: '' });
    const [formMode, setFormMode] = useState('disabled'); // 'disabled', 'creating', 'editing'
    const [selectedCompra, setSelectedCompra] = useState(null);
    const [detallesCompraSeleccionada, setDetallesCompraSeleccionada] = useState([]);
    const [loadingDetalles, setLoadingDetalles] = useState(false);

    const [productos, setProductos] = useState([]);
    const [productoSeleccionadoId, setProductoSeleccionadoId] = useState('');
    const [detalleCompra, setDetalleCompra] = useState([]);

    const [proveedores, setProveedores] = useState([]);
    // const [almacenes, setAlmacenes] = useState([]);

    const [compras, setCompras] = useState([]);
    const [loadingCompras, setLoadingCompras] = useState(false);
    const [errorCompras, setErrorCompras] = useState(null);

    useEffect(() => {
        if (formMode === 'creating' || formMode === 'editing') {
            apiFetchProductos().then(setProductos).catch(() => setProductos([]));
            fetchProveedores().then(setProveedores).catch(() => setProveedores([]));
            // fetchAlmacenes().then(setAlmacenes).catch(() => setAlmacenes([]))
        }
    }, [formMode]);

    const handleSelectCompra = async (compra) => {
        if (selectedCompra?.id === compra.id) {
            setSelectedCompra(null);
            setDetallesCompraSeleccionada([]);
            return;
        }
        setSelectedCompra(compra);
        setLoadingDetalles(true);
        setDetallesCompraSeleccionada([]);
        try {
            const data = await fetchIngresoById(compra.id);
            setDetallesCompraSeleccionada(data.detalles || []);
        } catch {
            setDetallesCompraSeleccionada([]);
        } finally {
            setLoadingDetalles(false);
        }
    };
    useEffect(() => {
        if (formMode === 'disabled') {
            setLoadingCompras(true);
            setErrorCompras(null);
            fetchIngresos()
                .then(data => setCompras(data))
                .catch(err => setErrorCompras(err.message || 'Error al obtener compras'))
                .finally(() => setLoadingCompras(false));
        }
        // Suscribirse a eventos de actualización global
        const handler = () => {
            fetchIngresos().then(data => setCompras(data)).catch(console.error);
        };
        EventBus.addEventListener('COMPRAS_UPDATED', handler);
        return () => EventBus.removeEventListener('COMPRAS_UPDATED', handler);
    }, [formMode]);

    const handleAgregarProducto = () => {
        if (!productoSeleccionadoId) return;
        const productoSeleccionado = productos.find(p => p.id_producto.toString() === productoSeleccionadoId);
        if (!productoSeleccionado) return;
        if (detalleCompra.some(item => item.producto.id_producto === productoSeleccionado.id_producto)) return;
        setDetalleCompra(prev => [
            ...prev,
            {
                producto: productoSeleccionado,
                cantidad: 1,
                precio: productoSeleccionado.precio_venta || 0
            }
        ]);
        setProductoSeleccionadoId('');
    };

    const handleDetalleChange = (idx, field, value) => {
        setDetalleCompra(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
    };

    const handleEliminarDetalle = (idx) => {
        setDetalleCompra(prev => prev.filter((_, i) => i !== idx));
    };

    const handleCreate = () => {
        setFormMode('creating');
        setSelectedCompra(null);

    };
    const handleEdit = async () => {
        if (!selectedCompra) return;
        setFormMode('editing');
        try {
            const data = await fetchIngresoById(selectedCompra.id);
            setForm({
                nroDoc: data.numero_doc || '',
                proveedorId: data.id_proveedor?.toString() || '',
                detalle: data.detalle || '',
                almacenId: data.id_almacen?.toString() || '',
                fecha: data.fecha || getFechaActual(),
                hora: data.hora || getHoraActual(),
                tipoDoc: data.doc_respaldo || '',
                formaPago: data.forma_pago || '',
                id_responsable: data.id_responsable || usuarioLogueado.id
            });
            setDetalleCompra(
                (data.detalles || []).map(item => ({
                    producto: {
                        id_producto: item.id_producto,
                        codigo: item.producto_codigo,
                        nombre: item.producto_nombre
                    },
                    cantidad: item.cantidad,
                    precio: item.precio_unitario
                }))
            );
        } catch {
            setAlert({ open: true, type: 'error', message: 'No se pudo cargar la compra para editar' });
        }
    };
    const handleDelete = async () => {
        if (!selectedCompra) return;
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta compra?')) return;
        try {
            await eliminarIngreso(selectedCompra.id);
            setCompras(prev => prev.filter(c => c.id !== selectedCompra.id));
            setSelectedCompra(null);
            EventBus.dispatchEvent(new Event('COMPRAS_UPDATED'));
            setAlert({ open: true, type: 'success', message: 'Compra eliminada correctamente' });
        } catch (err) {
            setAlert({ open: true, type: 'error', message: err.message || 'Error al eliminar la compra' });
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        const total = detalleCompra.reduce((sum, item) => sum + (Number(item.cantidad) * Number(item.precio)), 0);

        const detalles = detalleCompra.map(item => ({
            id_producto: item.producto.id_producto,
            cantidad: Number(item.cantidad),
            precio_unitario: Number(item.precio)
        }));

        const payload = {
            id_proveedor: Number(form.proveedorId),
            id_almacen: Number(form.almacenId),
            fecha: form.fecha,
            hora: form.hora,
            id_tipo_ingreso: 1,
            doc_respaldo: form.tipoDoc,
            numero_doc: form.nroDoc,
            codigo: '',
            detalle: form.detalle,
            estado: 'PENDIENTE',
            forma_pago: form.formaPago,
            total: total,
            id_responsable: form.id_responsable,
            detalles
        };

        try {
            if (formMode === 'editing' && selectedCompra) {
                await actualizarIngreso(selectedCompra.id, payload);
                setAlert({ open: true, type: 'success', message: 'Compra actualizada correctamente' });
            } else {
                await crearIngreso(payload);
                setAlert({ open: true, type: 'success', message: 'Compra registrada correctamente' });
            }
            setForm({
                nroDoc: '', proveedorId: '', detalle: '', almacenId: '', fecha: getFechaActual(), hora: getHoraActual(), tipoDoc: '', formaPago: '', id_responsable: usuarioLogueado.id
            });
            setDetalleCompra([]);
            EventBus.dispatchEvent(new Event('COMPRAS_UPDATED'));
            setFormMode('disabled');
            setSelectedCompra(null);
        } catch (err) {
            setAlert({ open: true, type: 'error', message: err.message || 'Error al guardar la compra' });
        }
    };
    const handleCancel = () => {
        setFormMode('disabled');
        setSelectedCompra(null);
    };

    const handleExportComprasToPDF = () => {
        if (!compras || compras.length === 0) {
            setAlert({ open: true, type: 'warning', message: 'No hay compras para exportar' });
            return;
        }
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;

            doc.setFontSize(16);
            const empresa = 'OPTINET S.R.L.';
            const titulo = 'REPORTE DE COMPRAS';
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
                'Nro Doc',
                'Fecha',
                'Proveedor',
                'Almacén',
                'Total (Bs)'
            ];
            const tableData = compras.map(compra => [
                compra.codigo || '-',
                compra.numero_doc || '-',
                compra.fecha || '-',
                compra.proveedor_nombre || '-',
                compra.almacen_nombre || '-',
                compra.total || '0'
            ]);

            const tableWidth = 25 + 25 + 25 + 40 + 35 + 25;
            const leftMargin = (pageWidth - tableWidth) / 2;
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
                margin: { top: 30, left: leftMargin, right: leftMargin },
                columnStyles: {
                    0: { cellWidth: 25, halign: 'center' },
                    1: { cellWidth: 25, halign: 'center' },
                    2: { cellWidth: 25, halign: 'center' },
                    3: { cellWidth: 40, halign: 'left' },
                    4: { cellWidth: 35, halign: 'center' },
                    5: { cellWidth: 25, halign: 'right' }
                },
                theme: 'grid'
            });

            const pageHeight = doc.internal.pageSize.height;
            doc.setFontSize(8);
            doc.text(`Total de compras: ${compras.length}`, 14, pageHeight - 10);

            const fileName = `compras_${new Date().toISOString().slice(0, 10)}.pdf`;
            doc.save(fileName);
            setAlert({ open: true, type: 'success', message: 'PDF generado correctamente' });
        } catch (error) {
            console.error('Error al generar PDF:', error);
            setAlert({ open: true, type: 'error', message: 'Error al generar el PDF' });
        }
    };

    const handleExportComprasToExcel = async () => {
        if (!compras || compras.length === 0) {
            setAlert({ open: true, type: 'warning', message: 'No hay compras para exportar' });
            return;
        }
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Compras');

            worksheet.mergeCells('A1:C1');
            worksheet.getCell('A1').value = 'OPTINET S.R.L.';
            worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
            worksheet.mergeCells('D1:F1');
            worksheet.getCell('D1').value = 'REPORTE DE COMPRAS';
            worksheet.getCell('D1').alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            worksheet.getRow(1).font = { bold: true, size: 13 };

            const headers = ['Código', 'Nro Doc', 'Fecha', 'Proveedor', 'Almacén', 'Total (Bs)'];
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

            compras.forEach(compra => {
                worksheet.addRow([
                    compra.codigo || '-',
                    compra.numero_doc || '-',
                    compra.fecha || '-',
                    compra.proveedor_nombre || '-',
                    compra.almacen_nombre || '-',
                    compra.total || '0'
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
            a.download = `compras_${new Date().toISOString().slice(0, 10)}.xlsx`;
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
    // Declaración correcta de useState para form
    const [form, setForm] = useState({
        nroDoc: '',
        proveedorId: '',
        detalle: '',
        almacenId: 1,
        fecha: getFechaActual(),
        hora: getHoraActual(),
        tipoDoc: '',
        formaPago: '',
        id_responsable: usuarioLogueado.id
    });
    const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

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
                    {formMode === 'disabled' && (
                        <>
                            <Button onClick={handleCreate}>
                                <PlusIcon className="w-4 h-4" />
                                Crear
                            </Button>
                            <Button
                                onClick={handleEdit}
                                disabled={!selectedCompra}
                            >
                                <PencilIcon className="w-4 h-4" />
                                Editar
                            </Button>
                            <div className="border-r border-gray-300 pr-2">
                                <Button
                                    onClick={handleDelete}
                                    disabled={!selectedCompra}
                                >
                                    <TrashIcon className="w-4 h-4" />
                                    Eliminar
                                </Button>
                            </div>
                            <Button
                                type="button"
                                onClick={handleExportComprasToPDF}
                                disabled={loadingCompras || !compras || compras.length === 0}
                                className="px-4 py-1 text-xs"
                            >
                                Exportar PDF
                            </Button>

                            <div className="border-r border-gray-300 pr-2">
                                <Button
                                    type="button"
                                    onClick={handleExportComprasToExcel}
                                    disabled={loadingCompras || !compras || compras.length === 0}
                                    className="px-4 py-1 text-xs"
                                >
                                    Exportar Excel
                                </Button>
                            </div>
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
                    <div className="bg-white border border-gray-200 flex-1 min-h-0 flex flex-col overflow-hidden">
                        <form className="flex flex-col h-full overflow-hidden">
                            <div className="grid grid-cols-5 gap-2 p-2 flex-shrink-0">
                                <div className="col-span-1 row-span-1">
                                    <FormField label="Proveedor" layout="side" labelClassName="w-24">
                                        <ComboBox
                                            options={proveedores.map(p => ({ value: p.id.toString(), label: p.nombre }))}
                                            value={form.proveedorId}
                                            onSelect={value => handleChange('proveedorId', value)}
                                            placeholder="Seleccionar proveedor"
                                            searchable={true}
                                            clearable={true}
                                            disabled={proveedores.length === 0}
                                        />
                                    </FormField>
                                </div>
                                <div className="col-span-1 row-span-1">
                                    <FormField label="Tipo de Doc." layout="side" labelClassName="w-24">
                                        <Input value={form.tipoDoc} onChange={e => handleChange('tipoDoc', e.target.value)} placeholder="Tipo de documento" />
                                    </FormField>
                                </div>
                                <div className="col-span-1 row-span-1">
                                    <FormField label="NroDoc" layout="side" labelClassName="w-24">
                                        <Input value={form.nroDoc} onChange={e => handleChange('nroDoc', e.target.value)} placeholder="Nro. de documento" />
                                    </FormField>
                                </div>
                                <div className="col-span-1 row-span-1">
                                    <FormField label="Fecha" layout="side" labelClassName="w-20">
                                        <Input type="date" value={form.fecha} onChange={e => handleChange('fecha', e.target.value)} placeholder="Fecha" />
                                    </FormField>
                                </div>
                                <div className="col-span-1 row-span-1">
                                    <FormField label="Hora" layout="side" labelClassName="w-20">
                                        <Input type="time" value={form.hora} onChange={e => handleChange('hora', e.target.value)} readOnly />
                                    </FormField>
                                </div>
                                <div className="col-span-1 row-span-1">
                                    <FormField label="Forma de pago" layout="side" labelClassName="w-24">
                                        <Select
                                            value={form.formaPago}
                                            onChange={value => handleChange('formaPago', value)}
                                            options={[
                                                { value: '', label: 'Seleccionar forma de pago' },
                                                { value: 'EFECTIVO', label: 'Efectivo' },
                                                { value: 'QR', label: 'QR' },
                                                { value: 'TRANSFERENCIA', label: 'Transferencia' }
                                            ]}
                                            required
                                        />
                                    </FormField>
                                </div>

                                {/* <div className="col-span-1 row-span-1">
                                    <FormField label="Almacén" layout="side" labelClassName="w-24">

                                <div className="col-span-1 row-span-1">
                                    <FormField label="C.costo" layout="side" labelClassName="w-24">

                                        <ComboBox
                                            options={almacenes.map(a => ({ value: a.id.toString(), label: a.nombre }))}
                                            value={form.almacenId}
                                            onSelect={value => handleChange('almacenId', value)}
                                            placeholder="Seleccionar centro de costo"
                                            searchable={true}
                                            clearable={true}
                                            disabled={almacenes.length === 0}
                                        />
                                    </FormField>
                                </div> */}
                                <div className="col-span-2 row-span-1">
                                    <FormField label="Detalle" layout="side" labelClassName="w-24 h-full" className="flex-1" inputWrapperClassName="h-full">
                                        <Input
                                            type="text"
                                            value={form.detalle}
                                            onChange={e => handleChange('detalle', e.target.value)}
                                            placeholder="Detalle de la compra"
                                            className="h-full flex-1 w-full text-left p-2 text-xs border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                        />
                                    </FormField>
                                </div>
                            </div>
                            <div className="col-span-5 p-2">
                                <div className="flex items-end gap-2 w-fit p-2 bg-gray-50 border-t border-x border-gray-300 relative z-10" style={{ marginBottom: '-1px' }}>
                                    <FormField label="Agregar producto" layout="side" labelClassName="w-32">
                                        <ComboBox
                                            options={productos.map(p => ({ value: p.id_producto.toString(), label: `${p.nombre} (${p.codigo})` }))}
                                            value={productoSeleccionadoId}
                                            onSelect={setProductoSeleccionadoId}
                                            placeholder="Buscar producto..."
                                            searchable={true}
                                            clearable={true}
                                            disabled={productos.length === 0}
                                        />
                                    </FormField>
                                    <Button type="button" onClick={handleAgregarProducto} disabled={!productoSeleccionadoId}>
                                        <PlusIcon className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="overflow-x-auto">
                                    {detalleCompra.length > 0 ? (
                                        <table className="min-w-full border border-gray-300 text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="p-2 text-center text-xs font-medium text-black uppercase tracking-wider">#</th>
                                                    <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Código</th>
                                                    <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Nombre</th>
                                                    <th className="p-2 text-right text-xs font-medium text-black uppercase tracking-wider">Cantidad</th>
                                                    <th className="p-2 text-right text-xs font-medium text-black uppercase tracking-wider">Precio</th>
                                                    <th className="p-2 text-right text-xs font-medium text-black uppercase tracking-wider">Subtotal</th>
                                                    <th className="p-2 text-center text-xs font-medium text-black uppercase tracking-wider">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {detalleCompra.map((item, idx) => (
                                                    <tr key={item.producto.id_producto} className="hover:bg-gray-50 transition-colors">
                                                        <td className="p-2 text-xs text-black text-center">{idx + 1}</td>
                                                        <td className="p-2 text-xs text-black">{item.producto.codigo}</td>
                                                        <td className="p-2 text-xs text-black">{item.producto.nombre}</td>
                                                        <td className="p-2 w-24">
                                                            <Input
                                                                type="number"
                                                                min={1}
                                                                value={item.cantidad}
                                                                onChange={e => handleDetalleChange(idx, 'cantidad', Number(e.target.value))}
                                                                className="w-16 text-right text-xs"
                                                            />
                                                        </td>
                                                        <td className="p-2 w-24">
                                                            <Input
                                                                type="number"
                                                                min={0}
                                                                value={item.precio}
                                                                onChange={e => handleDetalleChange(idx, 'precio', Number(e.target.value))}
                                                                className="w-20 text-right text-xs"
                                                            />
                                                        </td>
                                                        <td className="p-2 text-xs text-black text-right">{(item.cantidad * item.precio).toFixed(2)}</td>
                                                        <td className="p-2 text-center">
                                                            <Button type="button" onClick={() => handleEliminarDetalle(idx)} className="p-2 bg-transparent border-0 hover:bg-red-500 hover:text-white rounded-full transition-colors duration-200 shadow-none focus:outline-none"><TrashIcon className="w-4 h-4 text-red-500 hover:text-white" /></Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            No hay productos agregados a la compra
                                        </div>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>
                )}
                <div className="bg-white border border-gray-200 flex-1 min-h-0 flex flex-col overflow-hidden">
                    <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
                        {loadingCompras ? (
                            <div className="text-center py-8 text-gray-500">Cargando compras...</div>
                        ) : errorCompras ? (
                            <div className="text-center py-8 text-red-500">{errorCompras}</div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="sticky top-0 bg-gray-50 z-10 p-2 text-center text-xs font-medium text-black uppercase tracking-wider">#</th>
                                        <th className="sticky top-0 bg-gray-50 z-10 p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Código</th>
                                        <th className="sticky top-0 bg-gray-50 z-10 p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Nro Doc</th>
                                        <th className="sticky top-0 bg-gray-50 z-10 p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Fecha</th>
                                        <th className="sticky top-0 bg-gray-50 z-10 p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Proveedor</th>
                                        <th className="sticky top-0 bg-gray-50 z-10 p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Detalle</th>
                                        <th className="sticky top-0 bg-gray-50 z-10 p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Almacén</th>
                                        <th className="sticky top-0 bg-gray-50 z-10 p-2 text-right text-xs font-medium text-black uppercase tracking-wider">Total Bs.</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {compras.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="text-center py-8 text-gray-500">No hay compras registradas</td>
                                        </tr>
                                    ) : (
                                        compras.map((compra, idx) => (
                                            <>
                                                <tr
                                                    key={compra.id || idx}
                                                    className={`hover:bg-slate-600 hover:text-white cursor-pointer transition-colors ${selectedCompra?.id === compra.id ? 'bg-slate-600 text-white' : ''}`}
                                                    onClick={() => handleSelectCompra(compra)}
                                                >
                                                    <td className="p-2 text-xs text-center">{idx + 1}</td>
                                                    <td className="p-2 text-xs">{compra.codigo || ''}</td>
                                                    <td className="p-2 text-xs">{compra.numero_doc || ''}</td>
                                                    <td className="p-2 text-xs">{compra.fecha || ''}</td>
                                                    <td className="p-2 text-xs">{compra.proveedor_nombre || ''}</td>
                                                    <td className="p-2 text-xs">{compra.detalle || ''}</td>
                                                    <td className="p-2 text-xs">{compra.almacen_nombre || ''}</td>
                                                    <td className="p-2 text-xs text-right">{compra.total || ''}</td>
                                                </tr>
                                                {selectedCompra?.id === compra.id && (
                                                    <tr>
                                                        <td colSpan={9} className="bg-blue-white">
                                                            {loadingDetalles ? (
                                                                <div className="text-xs text-gray-500">Cargando detalles...</div>
                                                            ) : detallesCompraSeleccionada.length === 0 ? (
                                                                <div className="text-xs text-gray-500">No hay detalles para esta compra</div>
                                                            ) : (
                                                                <table className="w-full border border-gray-200">
                                                                    <thead className="bg-gray-50">
                                                                        <tr>
                                                                            <th className="bg-gray-50 p-2 text-center text-xs font-medium text-black uppercase tracking-wider">#</th>
                                                                            <th className="bg-gray-50 p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Código</th>
                                                                            <th className="bg-gray-50 p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Nombre</th>
                                                                            <th className="bg-gray-50 p-2 text-right text-xs font-medium text-black uppercase tracking-wider">Cantidad</th>
                                                                            <th className="bg-gray-50 p-2 text-right text-xs font-medium text-black uppercase tracking-wider">Precio Unitario</th>
                                                                            <th className="bg-gray-50 p-2 text-right text-xs font-medium text-black uppercase tracking-wider">Subtotal</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                                        {detallesCompraSeleccionada.map((detalle, i) => (
                                                                            <tr key={detalle.id || i} className="hover:bg-gray-50 transition-colors">
                                                                                <td className="p-2 text-xs text-black text-center">{i + 1}</td>
                                                                                <td className="p-2 text-xs text-black">{detalle.producto_codigo || ''}</td>
                                                                                <td className="p-2 text-xs text-black">{detalle.producto_nombre || ''}</td>
                                                                                <td className="p-2 text-xs text-black text-right">{detalle.cantidad}</td>
                                                                                <td className="p-2 text-xs text-black text-right">{detalle.precio_unitario}</td>
                                                                                <td className="p-2 text-xs text-black text-right">{detalle.subtotal}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

            </div>
        </>
    );
}

export default Compras;
