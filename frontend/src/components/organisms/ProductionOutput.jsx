import { useState, useEffect, useMemo, Fragment } from 'react';
import { onlyDigits } from '../../utils/fieldRules';
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '../atoms/Button';
import { Input, Select, Alert } from '../atoms';
import { FormField, ComboBox } from '../molecules';
import {
    fetchOpcionesSalida,
    fetchSalidas,
    fetchSalidaById,
    registrarSalida,
    actualizarSalida,
    eliminarSalida,
    cambiarEstadoSalida
} from '../../api/salidas';
import { fetchInventarioPorAlmacen } from '../../api/inventarios';
import { useAuth } from '../../hooks/useAuth';
import EventBus from '../../utils/EventBus';

const ESTADO_ESTILOS = {
    ENTREGADA: 'bg-green-100 text-green-800',
    PENDIENTE: 'bg-yellow-100 text-yellow-800',
    CANCELADA: 'bg-red-100 text-red-800'
};

function getFechaActual() {
    return new Date().toISOString().slice(0, 10);
}

// La API devuelve la fecha como texto ISO; el input type="date" trabaja con AAAA-MM-DD
function fechaCorta(valor) {
    if (!valor) return '';
    const texto = String(valor);
    return /^\d{4}-\d{2}-\d{2}/.test(texto) ? texto.slice(0, 10) : texto;
}

function formVacio(user) {
    return {
        fecha: getFechaActual(),
        id_almacen: '',
        id_tipo_salida: '',
        id_orden_trabajo: '',
        id_responsable: user?.id ? String(user.id) : '',
        detalle: '',
        departamento: '',
        destino: '',
        observaciones: '',
    };
}

function ProductionOutput() {
    const { user } = useAuth();
    // Estado para inventario y detalles de productos
    const [inventario, setInventario] = useState([]);
    const [productoSeleccionadoId, setProductoSeleccionadoId] = useState('');
    const [detalles, setDetalles] = useState([]);
    const [departamentoOptions, setDepartamentoOptions] = useState([]);
    const [olts, setOlts] = useState([]);
    const [clientesInternos, setClientesInternos] = useState([]);
    const [tiposSalida, setTiposSalida] = useState([]);
    const [responsables, setResponsables] = useState([]);
    const [alert, setAlert] = useState({ open: false, type: 'info', message: '' });
    const [almacenes, setAlmacenes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formMode, setFormMode] = useState('disabled'); // 'disabled', 'creating', 'editing'
    const [selectedOutput, setSelectedOutput] = useState(null);
    const [outputs, setOutputs] = useState([]);
    const [form, setForm] = useState(() => formVacio(user));

    // Estado para detalles de la salida seleccionada
    const [detallesSalidaSeleccionada, setDetallesSalidaSeleccionada] = useState([]);
    const [loadingDetalles, setLoadingDetalles] = useState(false);


    // Actualizar inventario al cambiar almacén
    useEffect(() => {
        if (form.id_almacen) {
            fetchInventarioPorAlmacen(form.id_almacen)
                .then(data => {
                    setInventario(Array.isArray(data) ? data : []);
                })
                .catch(() => setInventario([]));
        } else {
            setInventario([]);
        }
    }, [form.id_almacen]);

    // Opciones para ComboBox de productos
    const productoOptions = useMemo(() =>
        inventario.map(p => ({ value: String(p.id_producto), label: `${p.producto_codigo} - ${p.producto_nombre}` })),
        [inventario]
    );

    // Agregar producto a detalles
    const handleAddDetalle = () => {
        if (!productoSeleccionadoId) return;
        const producto = inventario.find(p => String(p.id_producto) === String(productoSeleccionadoId));
        if (!producto) return;
        if (detalles.some(item => item.productoId === producto.id_producto.toString())) return;
        setDetalles(prev => {
            const nuevos = [
                ...prev,
                {
                    productoId: producto.id_producto.toString(),
                    productoNombre: producto.producto_nombre,
                    cantidad: 1,
                    stock_actual: producto.stock_actual,
                    id_producto: producto.id_producto,
                    unidad_ingreso: producto.unidad_ingreso
                }
            ];
            return nuevos;
        });
        setProductoSeleccionadoId('');
    };

    // Cambiar cantidad de un producto
    const handleCantidadChange = (index, value) => {
        setDetalles(prev => prev.map((item, i) => i === index ? { ...item, cantidad: value } : item));
    };

    // Eliminar producto de detalles
    const handleRemoveDetalle = (index) => {
        setDetalles(prev => prev.filter((_, i) => i !== index));
    };
    // Manejar creación de nueva salida
    const handleCreate = () => {
        setFormMode('creating');
        setSelectedOutput(null);
        setForm(formVacio(user));
        setDetalles([]);
        setAlert({ open: true, type: 'info', message: 'Complete los campos para registrar una nueva salida.' });
    };

    const recargarSalidas = () => {
        return fetchSalidas()
            .then(data => {
                const lista = Array.isArray(data) ? data : [];
                setOutputs(lista);
                return lista;
            })
            .catch(err => {
                setOutputs([]);
                setAlert({ open: true, type: 'error', message: err.message || 'Error al cargar salidas.' });
                return [];
            });
    };

    useEffect(() => {
        recargarSalidas();
        // Suscribirse a eventos de actualización global
        const handler = () => { recargarSalidas(); };
        EventBus.addEventListener('PRODUCTION_OUTPUT_UPDATED', handler);
        return () => EventBus.removeEventListener('PRODUCTION_OUTPUT_UPDATED', handler);
    }, []);

    // El endpoint de opciones entrega los almacenes válidos, los tipos de salida, los responsables
    // y los destinos (departamentos, OLTS y contratos internos) del formulario
    useEffect(() => {
        fetchOpcionesSalida()
            .then(data => {
                if (!data) return;
                setAlmacenes(data.almacenes || []);
                setTiposSalida(data.tiposSalida || []);
                setResponsables(data.responsables || []);
                setDepartamentoOptions((data.departamentos || []).map(d => ({ value: String(d.codigo), label: d.nombre })));
                setOlts((data.olts || []).map(o => ({ value: String(o.id), label: String(o.respuesta) })));
                setClientesInternos((data.clientes_internos || []).map(c => ({ value: c.contrato, label: `${c.contrato} | ${c.nombre_completo}` })));
            })
            .catch(err => {
                setAlert({ open: true, type: 'error', message: err.message || 'Error al cargar las opciones de salida.' });
            });
    }, []);

    // Opciones dinámicas para destino según departamento
    const destinoOptions = useMemo(() => {
        if (!form.departamento) return [];
        // Buscar el label del departamento seleccionado
        const depLabel = departamentoOptions.find(d => d.value === form.departamento)?.label || '';
        if (/NODO$/i.test(depLabel) || /RED$/i.test(depLabel)) {
            return olts;
        } else if (/CLIENTE$/i.test(depLabel)) {
            return clientesInternos;
        }
        return [];
    }, [form.departamento, departamentoOptions, olts, clientesInternos]);

    const responsableOptions = responsables.map(u => ({ value: String(u.id), label: u.username }));

    // El usuario elige otro almacén: se limpia el detalle porque los productos ya no corresponden
    const handleAlmacenChange = (value) => {
        setForm(f => ({ ...f, id_almacen: value }));
        setDetalles([]);
        setProductoSeleccionadoId('');
    };

    const handleEdit = async () => {
        if (!selectedOutput) {
            setAlert({ open: true, type: 'warning', message: 'Seleccione una salida para editar.' });
            return;
        }
        setLoading(true);
        try {
            const data = await fetchSalidaById(selectedOutput.id);
            setForm({
                fecha: fechaCorta(data.fecha),
                id_almacen: String(data.id_almacen ?? ''),
                id_tipo_salida: String(data.id_tipo_salida ?? ''),
                id_orden_trabajo: data.id_orden_trabajo ? String(data.id_orden_trabajo) : '',
                id_responsable: data.id_responsable ? String(data.id_responsable) : (user?.id ? String(user.id) : ''),
                detalle: data.detalle || '',
                departamento: data.departamento || '',
                destino: data.destino || '',
                observaciones: data.observaciones || '',
            });
            setDetalles((data.detalles || []).map(item => ({
                productoId: String(item.id_producto),
                id_producto: Number(item.id_producto),
                productoNombre: item.producto_nombre || '',
                cantidad: item.cantidad,
                stock_actual: item.cantidad,
                unidad_ingreso: item.unidad_ingreso || ''
            })));
            setFormMode('editing');
        } catch (error) {
            setAlert({ open: true, type: 'error', message: error.message || 'No se pudo cargar la salida para editar.' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedOutput) {
            setAlert({ open: true, type: 'warning', message: 'Seleccione una salida para eliminar.' });
            return;
        }
        if (!window.confirm('¿Está seguro de que desea eliminar esta salida?')) return;
        setLoading(true);
        try {
            await eliminarSalida(selectedOutput.id);
            setSelectedOutput(null);
            setDetallesSalidaSeleccionada([]);
            EventBus.dispatchEvent(new Event('PRODUCTION_OUTPUT_UPDATED'));
            EventBus.dispatchEvent(new Event('INVENTORY_UPDATED'));
            await recargarSalidas();
            setAlert({ open: true, type: 'success', message: 'Salida eliminada correctamente.' });
        } catch (error) {
            setAlert({ open: true, type: 'error', message: error.message || 'Error al eliminar la salida.' });
        } finally {
            setLoading(false);
        }
    };

    // Una salida ENTREGADA descuenta stock: cancelarla lo devuelve
    const handleCambiarEstado = async (estado) => {
        if (!selectedOutput) return;
        setLoading(true);
        try {
            await cambiarEstadoSalida(selectedOutput.id, estado);
            EventBus.dispatchEvent(new Event('PRODUCTION_OUTPUT_UPDATED'));
            EventBus.dispatchEvent(new Event('INVENTORY_UPDATED'));
            // La selección debe refrescarse o la barra de herramientas sigue mostrando los botones del estado anterior
            const salidas = await recargarSalidas();
            setSelectedOutput(salidas.find(s => s.id === selectedOutput.id) || null);
            setAlert({ open: true, type: 'success', message: `Salida ${estado.toLowerCase()} correctamente.` });
        } catch (error) {
            setAlert({ open: true, type: 'error', message: error.message || 'No se pudo cambiar el estado de la salida.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Validar campos requeridos
        if (!form.fecha || !form.id_almacen || !form.id_tipo_salida || !form.id_responsable) {
            setAlert({ open: true, type: 'warning', message: 'Por favor complete todos los campos obligatorios.' });
            return;
        }
        if (detalles.length === 0) {
            setAlert({ open: true, type: 'warning', message: 'Agregue al menos un producto a la salida.' });
            return;
        }
        if (detalles.some(item => !(Number(item.cantidad) > 0))) {
            setAlert({ open: true, type: 'error', message: 'Todos los productos deben tener una cantidad mayor a 0.' });
            return;
        }

        const payload = {
            fecha: form.fecha,
            id_almacen: Number(form.id_almacen),
            id_tipo_salida: Number(form.id_tipo_salida),
            id_orden_trabajo: form.id_orden_trabajo ? Number(form.id_orden_trabajo) : null,
            id_responsable: Number(form.id_responsable),
            detalle: form.detalle,
            departamento: form.departamento,
            destino: form.destino,
            observaciones: form.observaciones,
            detalles: detalles.map(item => ({
                id_producto: Number(item.id_producto ?? item.productoId),
                cantidad: Number(item.cantidad)
            }))
        };

        setLoading(true);
        try {
            if (formMode === 'editing' && selectedOutput) {
                await actualizarSalida(selectedOutput.id, payload);
                setAlert({ open: true, type: 'success', message: 'Salida actualizada correctamente.' });
            } else {
                await registrarSalida(payload);
                setAlert({ open: true, type: 'success', message: 'Salida registrada correctamente.' });
            }
            EventBus.dispatchEvent(new Event('PRODUCTION_OUTPUT_UPDATED'));
            EventBus.dispatchEvent(new Event('INVENTORY_UPDATED'));
            await recargarSalidas();
            setFormMode('disabled');
            setSelectedOutput(null);
            setDetalles([]);
        } catch (error) {
            setAlert({ open: true, type: 'error', message: error.message || 'Error al guardar la salida.' });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setFormMode('disabled');
        setSelectedOutput(null);
        setDetalles([]);
        setForm(formVacio(user));
        setAlert({ open: true, type: 'info', message: 'Operación cancelada.' });
    };

    const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

    const handleRowSelect = async (output) => {
        if (formMode !== 'disabled') return;
        if (selectedOutput?.id === output.id) {
            setSelectedOutput(null);
            setDetallesSalidaSeleccionada([]);
            return;
        }
        setSelectedOutput(output);
        setLoadingDetalles(true);
        setDetallesSalidaSeleccionada([]);
        try {
            const data = await fetchSalidaById(output.id);
            setDetallesSalidaSeleccionada(data.detalles || []);
        } catch (error) {
            setAlert({ open: true, type: 'error', message: error.message || 'No se pudo cargar el detalle de la salida.' });
        } finally {
            setLoadingDetalles(false);
        }
    };


    return (
    // ...existing code...
        <>
            <Alert
                open={alert.open}
                type={alert.type}
                message={alert.message}
                onClose={() => setAlert(a => ({ ...a, open: false }))}
                duration={3000}
            />
            <div className="flex flex-col h-full min-h-0 space-y-2">
                <div className="flex gap-2 bg-white border border-gray-200 p-2">
                    {formMode === 'disabled' && (
                        <>
                            <Button onClick={handleCreate}>
                                <PlusIcon className="w-4 h-4" />
                                Crear
                            </Button>
                            <Button onClick={handleEdit} disabled={!selectedOutput || loading}>
                                <PencilIcon className="w-4 h-4" />
                                Editar
                            </Button>
                            <div className="border-r border-gray-300 pr-2">
                                <Button onClick={handleDelete} disabled={!selectedOutput || loading}>
                                    <TrashIcon className="w-4 h-4" />
                                    Eliminar
                                </Button>
                            </div>
                            {selectedOutput?.estado === 'ENTREGADA' && (
                                <Button onClick={() => handleCambiarEstado('CANCELADA')} disabled={loading} variant="danger">
                                    <XMarkIcon className="w-4 h-4" />
                                    Cancelar y devolver stock
                                </Button>
                            )}
                            {selectedOutput?.estado === 'CANCELADA' && (
                                <Button onClick={() => handleCambiarEstado('ENTREGADA')} disabled={loading} variant="success">
                                    <CheckIcon className="w-4 h-4" />
                                    Volver a entregar
                                </Button>
                            )}
                            {selectedOutput?.estado === 'PENDIENTE' && (
                                <>
                                    <Button onClick={() => handleCambiarEstado('ENTREGADA')} disabled={loading} variant="success">
                                        <CheckIcon className="w-4 h-4" />
                                        Entregar
                                    </Button>
                                    <Button onClick={() => handleCambiarEstado('CANCELADA')} disabled={loading} variant="danger">
                                        <XMarkIcon className="w-4 h-4" />
                                        Cancelar
                                    </Button>
                                </>
                            )}
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
                        <form className="grid grid-cols-4 gap-2" onSubmit={handleSubmit}>
                            <FormField label="Departamento" layout="side" labelClassName="w-24">
                                <ComboBox
                                    options={departamentoOptions}
                                    value={form.departamento}
                                    onSelect={value => handleChange('departamento', value)}
                                    placeholder="Seleccionar departamento"
                                    required
                                    clearable={true}
                                    searchable={true}
                                />
                            </FormField>
                            <FormField label="Destino" layout="side" labelClassName="w-24">
                                <ComboBox
                                    options={destinoOptions}
                                    value={form.destino}
                                    onSelect={value => handleChange('destino', value)}
                                    placeholder="Seleccionar destino"
                                    required
                                    clearable={true}
                                    searchable={true}
                                    disabled={!form.departamento}
                                />
                            </FormField>
                            <FormField label="Fecha" layout="side" labelClassName="w-24">
                                <Input type="date" value={form.fecha} onChange={e => handleChange('fecha', e.target.value)} required />
                            </FormField>
                            <FormField label="Almacén" layout="side" labelClassName="w-24">
                                <Select
                                    value={form.id_almacen}
                                    onChange={value => handleAlmacenChange(value)}
                                    required
                                    options={almacenes.map(almacen => ({
                                        value: String(almacen.id),
                                        label: `${almacen.codigo} - ${almacen.nombre}`
                                    }))}
                                    placeholder={almacenes.length === 0 ? 'Cargando almacenes...' : 'Seleccionar almacén'}
                                />
                            </FormField>
                            <FormField label="Tipo Salida" layout="side" labelClassName="w-24">
                                <Select
                                    value={form.id_tipo_salida}
                                    onChange={value => handleChange('id_tipo_salida', value)}
                                    required
                                    options={tiposSalida.map(tipo => ({
                                        value: String(tipo.id),
                                        label: tipo.nombre
                                    }))}
                                    placeholder="Seleccionar tipo"
                                />
                            </FormField>
                            <FormField label="Responsable" layout="side" labelClassName="w-24">
                                <ComboBox
                                    options={responsableOptions}
                                    value={form.id_responsable}
                                    onSelect={value => handleChange('id_responsable', value)}
                                    placeholder="Seleccione el responsable"
                                    required
                                    clearable={true}
                                    searchable={true}
                                />
                            </FormField>
                            <FormField label="Orden Trabajo" layout="side" labelClassName="w-24">
                                <Input
                                    value={form.id_orden_trabajo}
                                    onChange={e => handleChange('id_orden_trabajo', onlyDigits(e.target.value, 10))}
                                    placeholder="Número de orden"
                                />
                            </FormField>
                            <div className="col-span-4">
                                <FormField label="Detalle" layout="side" labelClassName="w-24">
                                    <Input
                                        value={form.detalle}
                                        onChange={e => handleChange('detalle', e.target.value)}
                                        placeholder="Descripción detallada de la salida"
                                    />
                                </FormField>
                            </div>
                            <div className="col-span-4">
                                <FormField label="Observaciones" layout="side" labelClassName="w-24">
                                    <Input 
                                        value={form.observaciones} 
                                        onChange={e => handleChange('observaciones', e.target.value)} 
                                        placeholder="Observaciones adicionales"
                                    />
                                </FormField>
                            </div>
                            <div className="col-span-4">
                                <div className="flex items-end gap-2 w-fit p-2 bg-gray-50 border-t border-x border-gray-300 relative z-10" style={{ marginBottom: '-1px' }}>
                                    <FormField label="Agregar producto" layout="side" labelClassName="w-24">
                                        <ComboBox
                                            options={productoOptions}
                                            value={productoSeleccionadoId}
                                            onSelect={setProductoSeleccionadoId}
                                            placeholder="Buscar producto..."
                                            searchable={true}
                                            clearable={true}
                                            disabled={inventario.length === 0}
                                        />
                                    </FormField>
                                    <Button type="button" onClick={handleAddDetalle} disabled={!productoSeleccionadoId}>
                                        <PlusIcon className="w-4 h-4" />
                                    </Button>
                                </div>
                                {detalles.length > 0 && (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full border border-gray-300 text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                                                    <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase">Disponible</th>
                                                    <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                                                    <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {detalles.map((detalle, index) => {
                                                    // El stock real es el del inventario cargado; al editar puede no coincidir con lo que salió
                                                    const disponible = inventario.find(p => String(p.id_producto) === String(detalle.productoId))?.stock_actual
                                                        ?? detalle.stock_actual;
                                                    return (
                                                    <tr key={index}>
                                                        <td className="p-2 text-xs w-full">{detalle.productoNombre}</td>
                                                        <td className="p-2 text-xs w-24 text-right font-mono">{disponible ?? '-'}</td>
                                                        <td className="p-2 text-xs w-48">
                                                            <Input
                                                                type="number"
                                                                min={1}
                                                                max={disponible}
                                                                value={detalle.cantidad}
                                                                onChange={e => handleCantidadChange(index, Math.min(Number(disponible) || Infinity, Math.max(1, parseInt(onlyDigits(e.target.value, 7) || '1', 10))))}
                                                                className="w-20"
                                                            />
                                                        </td>
                                                        <td className="p-2 text-xs w-24">
                                                            <Button type="button" onClick={() => handleRemoveDetalle(index)} className="p-2 bg-transparent border-0 rounded-full shadow-none focus:outline-none hover:bg-red-500 transition-colors duration-200">
                                                                <TrashIcon className="w-4 h-4 text-red-500 hover:text-white"/>
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
                    <div className="bg-white border border-gray-200 flex-1 min-h-0 flex flex-col overflow-hidden">
                        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-2 text-center text-xs font-medium text-black uppercase tracking-wider">#</th>
                                        <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Código</th>
                                        <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Fecha</th>
                                        <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Almacén</th>
                                        <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Tipo</th>
                                        <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Departamento</th>
                                        <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Destino</th>
                                        <th className="p-2 text-center text-xs font-medium text-black uppercase tracking-wider">Estado</th>
                                        <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Detalle</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {outputs.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="text-center py-8 text-gray-500">No hay salidas registradas</td>
                                        </tr>
                                    ) : (
                                        outputs.map((output, idx) => (
                                            <Fragment key={output.id || idx}>
                                                <tr
                                                    className={`hover:bg-slate-600 hover:text-white cursor-pointer transition-colors ${selectedOutput?.id === output.id ? 'bg-slate-600 text-white' : ''}`}
                                                    onClick={() => handleRowSelect(output)}
                                                >
                                                    <td className="p-2 text-xs text-center">{idx + 1}</td>
                                                    <td className="p-2 text-xs">{output.codigo}</td>
                                                    <td className="p-2 text-xs">{fechaCorta(output.fecha)}</td>
                                                    <td className="p-2 text-xs">{output.almacen_origen_nombre}</td>
                                                    <td className="p-2 text-xs">{output.tipo_salida_nombre}</td>
                                                    <td className="p-2 text-xs">{output.departamento}</td>
                                                    <td className="p-2 text-xs">{output.destino}</td>
                                                    <td className="p-2 text-xs text-center">
                                                        <span className={`px-2 py-0.5 rounded text-xs ${ESTADO_ESTILOS[output.estado] || 'bg-gray-100 text-gray-700'}`}>
                                                            {output.estado || '-'}
                                                        </span>
                                                    </td>
                                                    <td className="p-2 text-xs">{output.detalle}</td>
                                                </tr>
                                                {selectedOutput?.id === output.id && (
                                                    <tr>
                                                        <td colSpan={9} className="bg-gray-50">
                                                            {loadingDetalles ? (
                                                                <div className="text-xs text-gray-500">Cargando detalles...</div>
                                                            ) : detallesSalidaSeleccionada.length === 0 ? (
                                                                <div className="text-xs text-gray-500">No hay detalles para esta salida</div>
                                                            ) : (
                                                                <table className="w-full border border-gray-200">
                                                                    <thead className="bg-gray-50">
                                                                        <tr>
                                                                            <th className="bg-gray-50 p-2 text-center text-xs font-medium text-black uppercase tracking-wider">#</th>
                                                                            <th className="bg-gray-50 p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Código</th>
                                                                            <th className="bg-gray-50 p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Nombre</th>
                                                                            <th className="bg-gray-50 p-2 text-right text-xs font-medium text-black uppercase tracking-wider">Cantidad</th>
                                                                            <th className="bg-gray-50 p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Unidad</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                                        {detallesSalidaSeleccionada.map((detalle, i) => (
                                                                            <tr key={detalle.id || i} className="hover:bg-gray-50 transition-colors">
                                                                                <td className="p-2 text-xs text-black text-center">{i + 1}</td>
                                                                                <td className="p-2 text-xs text-black">{detalle.producto_codigo || ''}</td>
                                                                                <td className="p-2 text-xs text-black">{detalle.producto_nombre || ''}</td>
                                                                                <td className="p-2 text-xs text-black text-right">{detalle.cantidad}</td>
                                                                                <td className="p-2 text-xs text-black">{detalle.unidad_ingreso || ''}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
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

export default ProductionOutput;
