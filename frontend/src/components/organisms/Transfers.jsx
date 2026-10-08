import React, { useState, useEffect } from 'react';
import { useAlert } from '../../hooks/useAlert';
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '../atoms/Button';
import { Input, Alert } from '../atoms';
import { FormField, ComboBox } from '../molecules';
import { fetchTraspasos, fetchOpcionesTraspaso, crearTraspaso, editarTraspaso, eliminarTraspaso, cambiarEstadoTraspaso } from '../../api/traspasos';
import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import EventBus from '../../utils/EventBus';

function Transfers() {
    const { alert, showAlert, closeAlert } = useAlert();
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [almacenes, setAlmacenes] = useState([]);
    // const [responsables, setResponsables] = useState([]);
    const [productos, setProductos] = useState([]);
    const [formMode, setFormMode] = useState('disabled');
    const [selectedTransfer, setSelectedTransfer] = useState(null);
    const [expandedTransfer, setExpandedTransfer] = useState(null);

    const [form, setForm] = useState({
        almacenOrigenId: '',
        almacenDestinoId: '',
        fechaTraspaso: new Date().toISOString().split('T')[0],
        hora: new Date().toTimeString().slice(0, 5),
        idAlmacenero: '',
        glosa: '',
        observaciones: '',
        detalles: []
    });

    const [productoSeleccionadoId, setProductoSeleccionadoId] = useState('');

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                setLoading(true);
                const [traspasosData, opcionesData] = await Promise.all([
                    fetchTraspasos(),
                    fetchOpcionesTraspaso()
                ]);
                setTransfers(traspasosData);
                setAlmacenes({
                    origen: opcionesData.almacenesOrigen || [],
                    destino: opcionesData.almacenesDestino || []
                });
                setProductos(opcionesData.productos || []);
                // setResponsables(opcionesData.responsables || []);
            } catch (error) {
                console.error('Error al cargar datos:', error);
                showAlert('error', 'Error al cargar los datos iniciales.');
            } finally {
                setLoading(false);
            }
        };
        cargarDatos();
        // Suscribirse a eventos de actualización global
        const handler = () => {
            fetchTraspasos().then(data => setTransfers(data)).catch(console.error);
        };
        EventBus.addEventListener('TRANSFERS_UPDATED', handler);
        // Suscribirse a almacenes actualizados
        const warehousesHandler = () => {
            fetchOpcionesTraspaso().then(opcionesData => {
                setAlmacenes({
                    origen: opcionesData.almacenesOrigen || [],
                    destino: opcionesData.almacenesDestino || []
                });
            }).catch(console.error);
        };
        EventBus.addEventListener('WAREHOUSES_UPDATED', warehousesHandler);
        // Suscribirse a inventario actualizado para refrescar productos con stock
        const inventoryHandler = () => {
            fetchOpcionesTraspaso().then(opcionesData => {
                setProductos(opcionesData.productos || []);
            }).catch(console.error);
        };
        EventBus.addEventListener('INVENTORY_UPDATED', inventoryHandler);
        return () => {
            EventBus.removeEventListener('TRANSFERS_UPDATED', handler);
            EventBus.removeEventListener('WAREHOUSES_UPDATED', warehousesHandler);
            EventBus.removeEventListener('INVENTORY_UPDATED', inventoryHandler);
        };
    }, [showAlert]);
    const handleRowSelect = (transfer) => {
        if (formMode !== 'disabled') return;
        setSelectedTransfer(selectedTransfer?.id === transfer.id ? null : transfer);
    };

    const handleToggleDetails = (transfer) => {
        if (formMode !== 'disabled') return;
        setExpandedTransfer(expandedTransfer?.id === transfer.id ? null : transfer);
    };
    const handleCreate = () => {
        setForm({
            almacenOrigenId: '',
            almacenDestinoId: '',
            fechaTraspaso: new Date().toISOString().split('T')[0],
            hora: new Date().toTimeString().slice(0, 5),
            idAlmacenero: '',
            glosa: '',
            observaciones: '',
            detalles: []
        });
        setFormMode('creating');
        setSelectedTransfer(null);
    };
    const handleEdit = () => {
        if (!selectedTransfer || selectedTransfer.estado !== 'PENDIENTE') return;
        setForm({
            almacenOrigenId: selectedTransfer.almacenOrigenId || '',
            almacenDestinoId: selectedTransfer.almacenDestinoId || '',
            fechaTraspaso: selectedTransfer.fechaTraspaso?.split('T')[0] || new Date().toISOString().split('T')[0],
            hora: selectedTransfer.hora || new Date().toTimeString().slice(0, 5),
            idAlmacenero: selectedTransfer.idAlmacenero || '',
            glosa: selectedTransfer.glosa || '',
            observaciones: selectedTransfer.observaciones || '',
            detalles: selectedTransfer.detalles?.map(det => ({
                productoId: det.productoId || det.id_producto || '',
                productoNombre: det.productoNombre || det.producto_nombre || '',
                cantidad: det.cantidad
            })) || []
        });
        setFormMode('editing');
    };
    const handleSave = async () => {
        try {
            if (!form.almacenDestinoId) {
                showAlert('error', 'Debes seleccionar un almacén destino.');
                return;
            }
            if (form.detalles.length === 0) {
                showAlert('error', 'Debe agregar al menos un producto.');
                return;
            }
            setLoading(true);
            const formToSend = {
                id_almacen_origen: 1,
                id_almacen_destino: Number(form.almacenDestinoId),
                fecha: form.fechaTraspaso,
                hora: form.hora,
                id_almacenero: 1,
                glosa: form.glosa || '',
                observaciones: form.observaciones || '',
                detalles: form.detalles.map(det => ({
                    id_producto: Number(det.productoId),
                    cantidad: Number(det.cantidad),
                    observaciones: det.observaciones || ''
                }))
            };
            if (
                isNaN(formToSend.id_almacen_origen) ||
                isNaN(formToSend.id_almacen_destino) ||
                isNaN(formToSend.id_almacenero) ||
                !formToSend.hora
            ) {
                showAlert('error', 'Error: Faltan datos obligatorios.');
                setLoading(false);
                return;
            }
            if (formMode === 'creating') {
                await crearTraspaso(formToSend);
                showAlert('success', 'Traspaso creado exitosamente');
            } else {
                await editarTraspaso(selectedTransfer.id, formToSend);
                showAlert('success', 'Traspaso actualizado exitosamente');
            }
            const traspasosData = await fetchTraspasos();
            setTransfers(traspasosData);
            EventBus.dispatchEvent(new Event('TRANSFERS_UPDATED'));
            EventBus.dispatchEvent(new Event('INVENTORY_UPDATED'));
            setFormMode('disabled');
            setSelectedTransfer(null);
        } catch (error) {
            console.error('Error al guardar:', error);
            showAlert('error', 'Error al guardar el traspaso');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (almacenes.origen && almacenes.origen.length === 1) {
            setForm(prev => ({ ...prev, almacenOrigenId: String(almacenes.origen[0].id) }));
        }
    }, [almacenes.origen]);
    const handleCancel = () => {
        setFormMode('disabled');
        setSelectedTransfer(null);
        showAlert('info', 'Operación cancelada.');
    };
    const handleDelete = async () => {
        if (!selectedTransfer || !['PENDIENTE', 'CANCELADO'].includes(selectedTransfer.estado)) return;
        if (!confirm('¿Está seguro de eliminar este traspaso?')) return;
        try {
            setLoading(true);
            await eliminarTraspaso(selectedTransfer.id);
            showAlert('success', 'Traspaso eliminado exitosamente');
            const traspasosData = await fetchTraspasos();
            setTransfers(traspasosData);
            EventBus.dispatchEvent(new Event('TRANSFERS_UPDATED'));
            EventBus.dispatchEvent(new Event('INVENTORY_UPDATED'));
            setSelectedTransfer(null);
        } catch (error) {
            console.error('Error al eliminar:', error);
            showAlert('error', 'Error al eliminar el traspaso');
        } finally {
            setLoading(false);
        }
    };
    const handleChangeStatus = async (estado) => {
        if (!selectedTransfer) return;
        try {
            setLoading(true);
            await cambiarEstadoTraspaso(selectedTransfer.id, estado);
            showAlert('success', `Traspaso ${estado.toLowerCase()} exitosamente`);
            const traspasosData = await fetchTraspasos();
            setTransfers(traspasosData);
            EventBus.dispatchEvent(new Event('TRANSFERS_UPDATED'));
            EventBus.dispatchEvent(new Event('INVENTORY_UPDATED'));
            setSelectedTransfer(null);
        } catch (error) {
            console.error('Error al cambiar estado:', error);
            showAlert('error', 'Error al cambiar el estado del traspaso');
        } finally {
            setLoading(false);
        }
    };
    const handleChange = (field, value) => {
        setForm(prev => ({
            ...prev,
            [field]: value
        }));
    };
    const handleDetalleChange = (value) => {
        setProductoSeleccionadoId(value);
    };
    const handleAddDetalle = () => {
        if (!productoSeleccionadoId) return;
        const producto = productos.find(p => p.id.toString() === productoSeleccionadoId);
        if (!producto) return;
        if (form.detalles.some(item => item.productoId === producto.id.toString())) return;
        const nuevoDetalle = {
            productoId: producto.id.toString(),
            productoNombre: producto.nombre,
            cantidad: 1
        };
        setForm(prev => ({
            ...prev,
            detalles: [...prev.detalles, nuevoDetalle]
        }));
        setProductoSeleccionadoId('');
    };
    const handleRemoveDetalle = (index) => {
        setForm(prev => ({
            ...prev,
            detalles: prev.detalles.filter((_, i) => i !== index)
        }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        await handleSave();
    };
    const handleExportTransfersToExcel = async () => {
        if (!transfers || transfers.length === 0) {
            showAlert('warning', 'No hay transferencias para exportar');
            return;
        }
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Transferencias');
            worksheet.mergeCells('A1:B1');
            worksheet.getCell('A1').value = 'OPTINET S.R.L.';
            worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
            worksheet.mergeCells('C1:F1');
            worksheet.getCell('C1').value = 'REPORTE DE TRANSFERENCIAS';
            worksheet.getCell('C1').alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            worksheet.getRow(1).font = { bold: true, size: 13 };
            const headers = ['Fecha', 'Origen', 'Destino', 'Observaciones'];
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
            transfers.forEach(transfer => {
                worksheet.addRow([
                    transfer.fecha ? new Date(transfer.fecha).toLocaleDateString() : '-',
                    transfer.almacen_origen_nombre || '-',
                    transfer.almacen_destino_nombre || '-',
                    transfer.observaciones || '-'
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
            a.download = `transferencias_${new Date().toISOString().slice(0, 10)}.xlsx`;
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
    const handleExportTransfersToPDF = () => {
        if (!transfers || transfers.length === 0) {
            showAlert('warning', 'No hay transferencias para exportar');
            return;
        }
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;

            doc.setFontSize(16);
            const titulo = 'REPORTE DE TRANSFERENCIAS';
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
                'Fecha',
                'Origen',
                'Destino',
                'Observaciones'
            ];
            const tableData = transfers.map(transfer => [
                transfer.fecha ? new Date(transfer.fecha).toLocaleDateString() : '-',
                transfer.almacen_origen_nombre || '-',
                transfer.almacen_destino_nombre || '-',
                transfer.observaciones || '-'
            ]);
            const tableWidth = 30 + 40 + 40 + 60;
            const leftMargin = (pageWidth - tableWidth) / 2;
            autoTable(doc, {
                head: [tableHeaders],
                body: tableData,
                startY: 25,
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
                    0: { cellWidth: 30, halign: 'center' },
                    1: { cellWidth: 40, halign: 'center' },
                    2: { cellWidth: 40, halign: 'center' },
                    3: { cellWidth: 60, halign: 'left' }
                },
                theme: 'grid'
            });
            const pageHeight = doc.internal.pageSize.height;
            doc.setFontSize(8);
            doc.text(`Total de transferencias: ${transfers.length}`, 14, pageHeight - 10);
            const fileName = `transferencias_${new Date().toISOString().slice(0, 10)}.pdf`;
            doc.save(fileName);
            showAlert('success', 'PDF generado correctamente');
        } catch (error) {
            console.error('Error al generar PDF:', error);
            showAlert('error', 'Error al generar el PDF');
        }
    };
    const almacenDestinoOptions = (almacenes.destino || []).map(a => ({ value: String(a.id), label: a.nombre }));
    const productoOptions = productos.map(p => ({ value: String(p.id), label: `${p.codigo} - ${p.nombre}` }));
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
                <div className="flex gap-2 bg-white border border-gray-300 p-2">
                    {formMode === 'disabled' && (
                        <>
                            <Button onClick={handleCreate} disabled={loading}>
                                <PlusIcon className="w-4 h-4" />
                                Crear
                            </Button>
                            <Button
                                onClick={handleEdit}
                                disabled={!selectedTransfer || selectedTransfer.estado !== 'PENDIENTE' || loading}
                            >
                                <PencilIcon className="w-4 h-4" />
                                Editar
                            </Button>

                            <div className="border-r border-gray-300 pr-2">
                                <Button
                                    onClick={handleDelete}
                                    disabled={!selectedTransfer || !['PENDIENTE', 'CANCELADO'].includes(selectedTransfer?.estado) || loading}
                                >
                                    <TrashIcon className="w-4 h-4" />
                                    Eliminar
                                </Button>
                            </div>
                            <Button
                                type="button"
                                onClick={handleExportTransfersToPDF}
                                disabled={loading || !transfers || transfers.length === 0}
                                className="px-4 py-1 text-xs"
                            >
                                Exportar PDF
                            </Button>
                            <div className="border-r border-gray-300 pr-2">
                                <Button
                                    type="button"
                                    onClick={handleExportTransfersToExcel}
                                    disabled={loading || !transfers || transfers.length === 0}
                                    className="px-4 py-1 text-xs"
                                >
                                    Exportar Excel
                                </Button>
                            </div>
                            {selectedTransfer && selectedTransfer.estado === 'PENDIENTE' && (
                                <>
                                    <Button
                                        onClick={() => handleChangeStatus('EN_PROCESO')}
                                        disabled={loading}
                                        variant="success"
                                    >
                                        <CheckIcon className="w-4 h-4" />
                                        Procesar
                                    </Button>
                                    <Button
                                        onClick={() => handleChangeStatus('CANCELADO')}
                                        disabled={loading}
                                        variant="danger"
                                    >
                                        <XMarkIcon className="w-4 h-4" />
                                        Cancelar
                                    </Button>
                                </>
                            )}
                            {selectedTransfer && selectedTransfer.estado === 'EN_PROCESO' && (
                                <Button
                                    onClick={() => handleChangeStatus('COMPLETADO')}
                                    disabled={loading}
                                    variant="success"
                                >
                                    <CheckIcon className="w-4 h-4" />
                                    Completar
                                </Button>
                            )}
                        </>
                    )}
                    {(formMode === 'creating' || formMode === 'editing') && (
                        <>
                            <Button onClick={handleSave} disabled={loading}>
                                {formMode === 'editing' ? 'Actualizar' : 'Guardar'}
                            </Button>
                            <Button onClick={handleCancel} disabled={loading}>
                                Cancelar
                            </Button>
                        </>
                    )}
                </div>
                {(formMode === 'creating' || formMode === 'editing') && (
                    <div className="bg-white border border-gray-300 p-2">
                        <form className="grid grid-cols-4 gap-2" onSubmit={handleSubmit}>
                            <FormField label="Hora" layout="side" labelClassName="w-24">
                                <Input
                                    type="time"
                                    value={form.hora}
                                    onChange={e => handleChange('hora', e.target.value)}
                                    required
                                />
                            </FormField>
                            <FormField label="Glosa" layout="side" labelClassName="w-24">
                                <Input
                                    value={form.glosa}
                                    onChange={e => handleChange('glosa', e.target.value)}
                                    placeholder="Glosa del traspaso"
                                />
                            </FormField>
                            <FormField label="Almacén Destino" layout="side" labelClassName="w-24">
                                <ComboBox
                                    options={almacenDestinoOptions}
                                    value={form.almacenDestinoId}
                                    onChange={(value) => handleChange('almacenDestinoId', value)}
                                    placeholder="Seleccione almacén destino"
                                    required
                                />
                            </FormField>
                            <FormField label="Fecha" layout="side" labelClassName="w-24">
                                <Input
                                    type="date"
                                    value={form.fechaTraspaso}
                                    onChange={(e) => handleChange('fechaTraspaso', e.target.value)}
                                    required
                                />
                            </FormField>
                            <FormField label="Observaciones" layout="side" labelClassName="w-24">
                                <Input
                                    value={form.observaciones}
                                    onChange={(e) => handleChange('observaciones', e.target.value)}
                                    placeholder="Observaciones del traspaso"
                                />
                            </FormField>
                            <div className="col-span-4">
                                <div
                                    className="flex items-end gap-2 w-fit p-2 bg-gray-50 border-t border-x border-gray-300 relative z-10"
                                    style={{ marginBottom: '-1px' }}
                                >
                                    <FormField label="Agregar producto" layout="side" labelClassName="w-24" className=''>
                                        <ComboBox
                                            options={productoOptions}
                                            value={productoSeleccionadoId}
                                            onChange={handleDetalleChange}
                                            placeholder="Buscar producto..."
                                            searchable={true}
                                            clearable={true}
                                            disabled={productos.length === 0}
                                        />
                                    </FormField>
                                    <Button type="button" onClick={handleAddDetalle} disabled={!productoSeleccionadoId}>
                                        <PlusIcon className="w-4 h-4" />
                                    </Button>
                                </div>
                                {form.detalles.length > 0 && (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full border border-gray-300 text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                                                    <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase">Disponible</th>
                                                    <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                                                    <th className="p-2 text-center text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Total</th>
                                                    <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {form.detalles.map((detalle, index) => {
                                                    const producto = productos.find(p => p.id.toString() === detalle.productoId);
                                                    let cantidad = '-';
                                                    let unidad = '-';
                                                    
                                                    if (producto) {
                                                        const cantidadNum = Number(detalle.cantidad);
                                                        cantidad = isNaN(cantidadNum) || cantidadNum === 0 ? '-' : cantidadNum;
                                                        unidad = producto.unidad_nombre || producto.unidad_base_nombre || producto.unidad_ingreso_nombre || producto.unidad || '-';
                                                    }
                                                    return (
                                                        <tr key={index}>
                                                            <td className="p-2 text-xs w-full">{detalle.productoNombre}</td>
                                                            <td className="p-2 text-xs w-24 text-right font-mono">{producto ? producto.stock_actual : '-'}</td>
                                                            <td className="p-2 text-xs w-48">
                                                                <Input
                                                                    type="number"
                                                                    min={1}
                                                                    step={1}
                                                                    pattern="^[0-9]+$"
                                                                    value={detalle.cantidad}
                                                                    onChange={e => {
                                                                        let value = e.target.value;
                                                                        if (value === '' || (/^\d+$/.test(value) && Number(value) > 0)) {
                                                                            setForm(prev => ({
                                                                                ...prev,
                                                                                detalles: prev.detalles.map((d, i) => i === index ? { ...d, cantidad: value } : d)
                                                                            }));
                                                                        }
                                                                    }}
                                                                    className="text-right text-xs"
                                                                    containerClassName="w-8"
                                                                />
                                                            </td>
                                                            <td className="p-2 text-xs w-32 text-center">
                                                                <div className="text-right font-mono">
                                                                    {cantidad !== '-' ? `${cantidad} ${unidad}` : '-'}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-2 text-xs">
                                                                <Button
                                                                    size="sm"
                                                                    variant="danger"
                                                                    onClick={() => handleRemoveDetalle(index)}
                                                                >
                                                                    <TrashIcon className="h-4 w-4" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>
                )}
                <div className="bg-white border border-gray-300 flex-1 min-h-0 flex flex-col overflow-hidden">
                    <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-2 text-center text-xs font-medium text-black uppercase tracking-wider">#</th>
                                    <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Fecha</th>
                                    <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Origen</th>
                                    <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Destino</th>
                                    <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Observaciones</th>
                                    <th className="p-2 text-center text-xs font-medium text-black uppercase tracking-wider">Detalles</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-8 text-gray-500">Cargando traspasos...</td>
                                    </tr>
                                ) : transfers.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-8 text-gray-500">No hay traspasos registrados</td>
                                    </tr>
                                ) : (
                                    transfers.map((transfer, idx) => (
                                        <React.Fragment key={transfer.id || idx}>
                                            <tr
                                                className={`hover:bg-slate-600 hover:text-white cursor-pointer transition-colors ${selectedTransfer?.id === transfer.id ? 'bg-slate-600 text-white' : ''}`}
                                                onClick={() => handleRowSelect(transfer)}
                                            >
                                                <td className="p-2 text-xs text-center">{idx + 1}</td>
                                                <td className="p-2 text-xs">
                                                    {transfer.fecha ? new Date(transfer.fecha).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="p-2 text-xs">{transfer.almacen_origen_nombre || '-'}</td>
                                                <td className="p-2 text-xs">{transfer.almacen_destino_nombre || '-'}</td>
                                                <td className="p-2 text-xs">{transfer.observaciones || '-'}</td>
                                                <td className="p-2 text-xs text-center">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleToggleDetails(transfer);
                                                        }}
                                                        className="text-blue-600 hover:text-blue-800 text-lg"
                                                    >
                                                        {expandedTransfer?.id === transfer.id ? '−' : '+'}
                                                    </button>
                                                </td>
                                            </tr>
                                            {expandedTransfer?.id === transfer.id && (
                                                <tr className="bg-gray-50">
                                                    <td colSpan={7} className="p-4">
                                                        <div className="text-sm font-medium text-gray-900 mb-2">
                                                            Detalles del Traspaso #{transfer.id}
                                                        </div>
                                                        {transfer.detalles && transfer.detalles.length > 0 ? (
                                                            <div className="overflow-x-auto">
                                                                <table className="min-w-full divide-y divide-gray-200">
                                                                    <thead className="bg-gray-100">
                                                                        <tr>
                                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                                                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Observaciones</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                                        {transfer.detalles.map((detalle, detalleIdx) => (
                                                                            <tr key={detalleIdx}>
                                                                                <td className="px-4 py-2 text-xs">{detalle.producto_nombre || detalle.productoNombre || '-'}</td>
                                                                                <td className="px-4 py-2 text-xs">{detalle.cantidad || '-'}</td>
                                                                                <td className="px-4 py-2 text-xs">{detalle.observaciones || '-'}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        ) : (
                                                            <p className="text-gray-500 text-sm">No hay detalles disponibles para este traspaso.</p>
                                                        )}
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Transfers;