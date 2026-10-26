import { useState, useEffect, useMemo } from 'react';
import { onlyDigits } from '../../utils/fieldRules';
import { WrenchScrewdriverIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Button from '../atoms/Button';
import { Input, Select, Alert } from '../atoms';
import { FormField, ComboBox } from '../molecules';
import { fetchAlmacenes } from '../../api/almacenes';
import { fetchOpcionesSalida, fetchSalidas, registrarSalida } from '../../api/salidas';
import { authenticatedFetch } from '../../api/auth';
import { fetchInventarioPorAlmacen } from '../../api/inventarios';
import EventBus from '../../utils/EventBus';

function ProductionOutput() {
    // Estado para inventario y detalles de productos
    const [inventario, setInventario] = useState([]);
    const [productoSeleccionadoId, setProductoSeleccionadoId] = useState('');
    const [detalles, setDetalles] = useState([]);
    const [departamentoOptions, setDepartamentoOptions] = useState([]);
    const [olts, setOlts] = useState([]);
    const [clientesInternos, setClientesInternos] = useState([]);
    const [alert, setAlert] = useState({ open: false, type: 'info', message: '' });
    const [almacenes, setAlmacenes] = useState([]);
    const [formMode, setFormMode] = useState('disabled'); // 'disabled', 'creating', 'editing'
    const [selectedOutput, setSelectedOutput] = useState(null);
    const [outputs, setOutputs] = useState([]);
    const [form, setForm] = useState({
        fecha: '',
        id_almacen: '',
        id_tipo_salida: '',
        id_orden_trabajo: '',
        detalle: '',
        departamento: '',
        destino: '',
        observaciones: '',
    });

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
        setDetalles([]); // Limpiar detalles al cambiar almacén
        setProductoSeleccionadoId('');
    }, [form.id_almacen]);

    // Opciones para ComboBox de productos
    const productoOptions = useMemo(() =>
        inventario.map(p => ({ value: String(p.id_producto), label: `${p.producto_codigo} - ${p.producto_nombre}` })),
        [inventario]
    );

    // Agregar producto a detalles
    const handleAddDetalle = () => {
        if (!productoSeleccionadoId) {
            console.log('No hay producto seleccionado');
            return;
        }
    const producto = inventario.find(p => String(p.id_producto) === String(productoSeleccionadoId));
        if (!producto) {
            console.log('Producto no encontrado en inventario');
            return;
        }
    if (detalles.some(item => item.productoId === producto.id_producto.toString())) {
            return;
        }
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
    // Cargar salidas reales al montar el componente
    // ...existing code...
    // Manejar creación de nueva salida
    const handleCreate = () => {
        setFormMode('creating');
        setSelectedOutput(null);
        setForm({
            fecha: '',
            id_almacen: '',
            id_tipo_salida: '',
            id_orden_trabajo: '',
            detalle: '',
            departamento: '',
            destino: '',
            observaciones: '',
        });
        setAlert({ open: true, type: 'info', message: 'Complete los campos para registrar una nueva salida.' });
    };
    useEffect(() => {
        fetchSalidas()
            .then(data => {
                setOutputs(Array.isArray(data) ? data : []);
            })
            .catch(err => {
                setAlert({ open: true, type: 'error', message: 'Error al cargar salidas.'+err });
                setOutputs([]);
            });
        // Suscribirse a eventos de actualización global
        const handler = () => {
            fetchSalidas().then(data => setOutputs(Array.isArray(data) ? data : [])).catch(console.error);
        };
        EventBus.addEventListener('PRODUCTION_OUTPUT_UPDATED', handler);
        return () => EventBus.removeEventListener('PRODUCTION_OUTPUT_UPDATED', handler);
    }, []);

    // Obtener opciones de salida y poblar departamentoOptions, olts y clientesInternos
    useEffect(() => {
        fetchOpcionesSalida()
            .then(data => {
                if (data && data.departamentos) {
                    setDepartamentoOptions(data.departamentos.map(d => ({ value: d.codigo, label: d.nombre })));
                } else if (data && data.departamento) {
                    setDepartamentoOptions(data.departamento.map(d => ({ value: d.codigo, label: d.nombre })));
                }
                if (data && data.olts) {
                    setOlts(data.olts.map(o => ({ value: String(o.id), label: String(o.respuesta) })));
                }
                if (data && data.clientes_internos) {
                    setClientesInternos(data.clientes_internos.map(c => ({ value: c.contrato, label: `${c.contrato} | ${c.nombre_completo}` })));
                }
            })
            .catch(err => {
                console.error('Error al obtener opciones de salida:', err);
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

    // LLAMAR AL ENDPOINT DE OPCIONES DE SALIDA Y MOSTRAR EN CONSOLA
    useEffect(() => {
        fetchOpcionesSalida()
    }, []);

    // CARGAR ALMACENES AL INICIALIZAR
    const dummyTiposSalida = [
        { id: 1, nombre: 'PRODUCCION' }
    ];

    useEffect(() => {
        fetchAlmacenes()
            .then(data => {
                setAlmacenes(data);
            })
            .catch(error => {
                console.error('Error al cargar almacenes:', error);
                setAlmacenes([]);
            });
    }, []);

    const handleEdit = () => {
        if (!selectedOutput) {
            setAlert({ open: true, type: 'warning', message: 'Seleccione una salida para editar.' });
            return;
        }
        setFormMode('editing');
        setForm({
            fecha: selectedOutput.fecha,
            id_almacen: selectedOutput.id_almacen,
            id_tipo_salida: selectedOutput.id_tipo_salida,
            id_orden_trabajo: selectedOutput.id_orden_trabajo || '',
            detalle: selectedOutput.detalle,
            departamento: selectedOutput.departamento || '',
            destino: selectedOutput.destino || '',
            observaciones: selectedOutput.observaciones,
        });
        setAlert({ open: true, type: 'info', message: 'Edite los campos y guarde los cambios.' });
    };

    const handleDelete = () => {
        if (!selectedOutput) {
            setAlert({ open: true, type: 'warning', message: 'Seleccione una salida para eliminar.' });
            return;
        }
        if (window.confirm('¿Está seguro de que desea eliminar esta salida?')) {
            setOutputs(prevOutputs => prevOutputs.filter(output => output.id !== selectedOutput.id));
            setSelectedOutput(null);
            EventBus.dispatchEvent(new Event('PRODUCTION_OUTPUT_UPDATED'));
            setAlert({ open: true, type: 'success', message: 'Salida eliminada correctamente.' });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Validar campos requeridos
        if (!form.fecha || !form.id_almacen || !form.id_tipo_salida) {
            setAlert({ open: true, type: 'warning', message: 'Por favor complete todos los campos obligatorios.' });
            return;
        }

        const almacen = almacenes.find(a => a.id === parseInt(form.id_almacen));
        const tipoSalida = dummyTiposSalida.find(t => t.id === parseInt(form.id_tipo_salida));

        if (formMode === 'creating') {
            // Registrar nueva salida en backend, incluyendo detalles
            registrarSalida({
                fecha: form.fecha,
                id_almacen: form.id_almacen,
                id_tipo_salida: form.id_tipo_salida,
                id_orden_trabajo: form.id_orden_trabajo,
                detalle: form.detalle,
                departamento: form.departamento,
                destino: form.destino,
                observaciones: form.observaciones,
                detalles: detalles,
                id_responsable: 1
            })
            .then(() => {
                setAlert({ open: true, type: 'success', message: 'Salida registrada correctamente.' });
                EventBus.dispatchEvent(new Event('PRODUCTION_OUTPUT_UPDATED'));
                // Refrescar la tabla
                return fetchSalidas();
            })
            .then(data => {
                setOutputs(Array.isArray(data) ? data : []);
            })
            .catch(() => {
                setAlert({ open: true, type: 'error', message: 'Error al registrar salida.' });
            });
        } else if (formMode === 'editing') {
            // Actualizar salida existente
            setOutputs(prevOutputs => prevOutputs.map(output => 
                output.id === selectedOutput.id 
                    ? {
                        ...output,
                        fecha: form.fecha,
                        id_almacen: parseInt(form.id_almacen),
                        almacen_nombre: almacen ? `${almacen.codigo} - ${almacen.nombre}` : '',
                        id_tipo_salida: parseInt(form.id_tipo_salida),
                        tipo_salida_nombre: tipoSalida?.nombre || '',
                        id_orden_trabajo: form.id_orden_trabajo || null,
                        detalle: form.detalle,
                        departamento: form.departamento,
                        destino: form.destino,
                        observaciones: form.observaciones,
                    }
                    : output
                     
            ));
            EventBus.dispatchEvent(new Event('PRODUCTION_OUTPUT_UPDATED'));
            setAlert({ open: true, type: 'success', message: 'Salida actualizada correctamente.' });
        }

        setFormMode('disabled');
        setSelectedOutput(null);
    };

    const handleCancel = () => {
        setFormMode('disabled');
        setSelectedOutput(null);
        setForm({
            fecha: '',
            id_almacen: '',
            id_tipo_salida: '',
            id_orden_trabajo: '',
            detalle: '',
            departamento: '',
            destino: '',
            observaciones: '',
        });
        setAlert({ open: true, type: 'info', message: 'Operación cancelada.' });
    };

    const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }));


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
                            <Button onClick={handleEdit} disabled={!selectedOutput}>
                                <PencilIcon className="w-4 h-4" />
                                Editar
                            </Button>
                            <Button onClick={handleDelete} disabled>
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
                                    onChange={e => handleChange('id_almacen', e)}
                                    required
                                    options={
                                        almacenes.length === 0
                                            ? []
                                            : almacenes
                                                .filter(almacen => almacen.es_principal !== 1)
                                                .map(almacen => ({
                                                    value: almacen.id,
                                                    label: `${almacen.codigo} - ${almacen.nombre}`
                                                }))
                                    }
                                    placeholder={almacenes.length === 0 ? 'Cargando almacenes...' : 'Seleccionar almacén'}
                                />
                            </FormField>
                            <FormField label="Tipo Salida" layout="side" labelClassName="w-24">
                                <Select
                                    value={form.id_tipo_salida}
                                    onChange={e => handleChange('id_tipo_salida', e)}
                                    required
                                    options={dummyTiposSalida.map(tipo => ({
                                        value: tipo.id,
                                        label: tipo.nombre
                                    }))}
                                    placeholder="Seleccionar tipo"
                                />
                            </FormField>
                            <FormField label="Orden Trabajo" layout="side" labelClassName="w-24">
                                <Input 
                                    value={form.id_orden_trabajo} 
                                    onChange={e => handleChange('id_orden_trabajo', e.target.value)} 
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
                                                {detalles.map((detalle, index) => (
                                                    <tr key={index}>
                                                        <td className="p-2 text-xs w-full">{detalle.productoNombre}</td>
                                                        <td className="p-2 text-xs w-24 text-right font-mono">{detalle.stock_actual}</td>
                                                        <td className="p-2 text-xs w-48">
                                                            <Input
                                                                type="number"
                                                                min={1}
                                                                max={detalle.stock_actual}
                                                                value={detalle.cantidad}
                                                                onChange={e => handleCantidadChange(index, Math.min(Number(detalle.stock_actual) || Infinity, Math.max(1, parseInt(onlyDigits(e.target.value, 7) || '1', 10))))}
                                                                className="w-20"
                                                            />
                                                        </td>
                                                        <td className="p-2 text-xs w-24">
                                                            <Button type="button" onClick={() => handleRemoveDetalle(index)} className="p-2 bg-transparent border-0 rounded-full shadow-none focus:outline-none hover:bg-red-500 transition-colors duration-200">
                                                                <TrashIcon className="w-4 h-4 text-red-500 hover:text-white"/>
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
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
                                        <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Detalle</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {outputs.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-8 text-gray-500">No hay salidas registradas</td>
                                        </tr>
                                    ) : (
                                        outputs.map((output, idx) => (
                                            <>
                                                <tr
                                                    key={output.id || idx}
                                                    className={`hover:bg-slate-600 hover:text-white cursor-pointer transition-colors ${selectedOutput?.id === output.id ? 'bg-slate-600 text-white' : ''}`}
                                                    onClick={async () => {
                                                        if (selectedOutput?.id === output.id) {
                                                            setSelectedOutput(null);
                                                            setDetallesSalidaSeleccionada([]);
                                                            return;
                                                        }
                                                        setSelectedOutput(output);
                                                        setLoadingDetalles(true);
                                                        setDetallesSalidaSeleccionada([]);
                                                        try {
                                                            const data = await authenticatedFetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3210'}/api/salidas/${output.id}`);
                                                            setDetallesSalidaSeleccionada(data.detalles || []);
                                                        } catch {
                                                            setDetallesSalidaSeleccionada([]);
                                                        } finally {
                                                            setLoadingDetalles(false);
                                                        }
                                                    }}
                                                >
                                                    <td className="p-2 text-xs text-center">{idx + 1}</td>
                                                    <td className="p-2 text-xs">{output.codigo}</td>
                                                    <td className="p-2 text-xs">{output.fecha}</td>
                                                    <td className="p-2 text-xs">{output.almacen_nombre}</td>
                                                    <td className="p-2 text-xs">{output.tipo_salida_nombre}</td>
                                                    <td className="p-2 text-xs">{output.departamento}</td>
                                                    <td className="p-2 text-xs">{output.destino}</td>
                                                    <td className="p-2 text-xs">{output.detalle}</td>
                                                </tr>
                                                {selectedOutput?.id === output.id && (
                                                    <tr>
                                                        <td colSpan={8} className="bg-blue-white">
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
                                            </>
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
