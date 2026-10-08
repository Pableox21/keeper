import { useState, useEffect } from 'react';
import { BuildingStorefrontIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Button from '../atoms/Button';
import { Input, Select, Alert } from '../atoms';
import { FormField } from '../molecules';
import { fetchAlmacenes, crearAlmacen, editarAlmacen, eliminarAlmacen, fetchOpcionesAlmacen } from '../../api/almacenes';
import EventBus from '../../utils/EventBus';

function Warehouses() {
    const [alert, setAlert] = useState({ open: false, type: 'info', message: '' });
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [opciones, setOpciones] = useState({
        tiposAlmacen: [],
        responsables: [],
        personalTecnico: []
    });
    const [formMode, setFormMode] = useState('disabled'); // 'disabled', 'creating', 'editing'
    const [selectedWarehouse, setSelectedWarehouse] = useState(null);
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                setLoading(true);
                const [almacenesData, opcionesData] = await Promise.all([
                    fetchAlmacenes(),
                    fetchOpcionesAlmacen()
                ]);
                setWarehouses(almacenesData);
                setOpciones({
                    tiposAlmacen: opcionesData.tiposAlmacen || [],
                    responsables: opcionesData.responsables || [],
                    personalTecnico: opcionesData.personalTecnico || []
                });
            } catch (error) {
                console.error('Error al cargar datos:', error);
                setAlert({ open: true, type: 'error', message: 'Error al cargar los datos iniciales.' });
            } finally {
                setLoading(false);
            }
        };
        cargarDatos();
        // Suscribirse a eventos de actualización global
        const handler = () => {
            fetchAlmacenes().then(data => setWarehouses(data)).catch(console.error);
        };
        EventBus.addEventListener('WAREHOUSES_UPDATED', handler);
        return () => EventBus.removeEventListener('WAREHOUSES_UPDATED', handler);
    }, []);
    const [form, setForm] = useState({
        codigo: '',
        nombre: '',
        direccion: '',
        telefono: '',
        observacion: '',
        zona: '',
        estado: 'ACTIVO',
        es_principal: 0,
        es_tecnico: 0,
        capacidad: '',
        id_cuenta_contable: '',
        id_tipo: '',
        id_centro_costo: '',
        id_tecnico_optiweb: ''
    });
    const handleCreate = () => {
        // Generate next available technical warehouse code
        const technicalCodes = warehouses
            .filter(w => w.es_tecnico && w.codigo && /^ALM-TEC-\d{2}$/.test(w.codigo))
            .map(w => parseInt(w.codigo.split('-')[2], 10))
            .filter(num => !isNaN(num));
        let nextNum = 1;
        while (technicalCodes.includes(nextNum)) {
            nextNum++;
        }
        const nextCode = `ALM-TEC-${nextNum.toString().padStart(2, '0')}`;
        setForm({
            codigo: nextCode,
            nombre: '',
            direccion: '',
            telefono: '',
            observacion: '',
            zona: '',
            estado: 'ACTIVO',
            es_principal: 0,
            es_tecnico: 1,
            capacidad: '',
            id_cuenta_contable: '',
            id_tipo: '',
            id_centro_costo: '',
            id_tecnico_optiweb: ''
        });
        setFormMode('creating');
        setSelectedWarehouse(null);
    };
    const handleEdit = () => {
        if (!selectedWarehouse) return;
        setForm({
            codigo: selectedWarehouse.codigo,
            nombre: selectedWarehouse.nombre,
            direccion: selectedWarehouse.direccion || '',
            telefono: selectedWarehouse.telefono || '',
            observacion: selectedWarehouse.observacion || '',
            zona: selectedWarehouse.zona || '',
            estado: selectedWarehouse.estado || 'ACTIVO',
            es_principal: selectedWarehouse.es_principal || 0,
            es_tecnico: selectedWarehouse.es_tecnico || 0,
            capacidad: selectedWarehouse.capacidad || '',
            id_cuenta_contable: selectedWarehouse.id_cuenta_contable || '',
            id_tipo: selectedWarehouse.id_tipo || '',
            id_centro_costo: selectedWarehouse.id_centro_costo || '',
            id_tecnico_optiweb: selectedWarehouse.id_tecnico_optiweb || ''
        });
        setFormMode('editing');
    };
    const handleDelete = async () => {
        if (!selectedWarehouse) return;
        if (window.confirm(`¿Está seguro de eliminar el almacén "${selectedWarehouse.nombre}"?`)) {
            try {
                await eliminarAlmacen(selectedWarehouse.id);
                setWarehouses(prev => prev.filter(w => w.id !== selectedWarehouse.id));
                setSelectedWarehouse(null);
                EventBus.dispatchEvent(new Event('WAREHOUSES_UPDATED'));
                setAlert({ open: true, type: 'success', message: 'Almacén eliminado correctamente.' });
            } catch (error) {
                console.error('Error al eliminar almacén:', error);
                setAlert({ open: true, type: 'error', message: 'Error al eliminar el almacén.' });
            }
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.codigo || !form.nombre) {
            setAlert({ open: true, type: 'error', message: 'Por favor complete los campos obligatorios (código y nombre).' });
            return;
        }
        
        // Validar que si es técnico, debe tener un técnico asignado
        if (form.es_tecnico && (!form.id_tecnico_optiweb || form.id_tecnico_optiweb === '')) {
            setAlert({ open: true, type: 'error', message: 'Para almacenes técnicos debe seleccionar un técnico.' });
            return;
        }

        // Validar que no exista ya un almacén técnico para el mismo técnico
        if (form.es_tecnico && form.id_tecnico_optiweb) {
            const existe = warehouses.some(w => w.es_tecnico === 1 && String(w.id_tecnico_optiweb) === String(form.id_tecnico_optiweb) && (formMode !== 'editing' || w.id !== selectedWarehouse?.id));
            if (existe) {
                setAlert({ open: true, type: 'error', message: 'Ya existe un almacén técnico para este técnico.' });
                return;
            }
        }
        // Configurar datos para almacén técnico
        const formConTipo = {
            ...form,
            id_tipo: 1, // Tipo fijo por ahora
            es_principal: 0, // Almacén técnico no es principal
            es_tecnico: 1,   // Es almacén técnico
            capacidad: form.capacidad === '' ? null : Number(form.capacidad),
            id_cuenta_contable: form.id_cuenta_contable === '' ? null : Number(form.id_cuenta_contable),
            id_centro_costo: form.id_centro_costo === '' ? null : Number(form.id_centro_costo),
            id_tecnico_optiweb: form.id_tecnico_optiweb === '' ? null : Number(form.id_tecnico_optiweb)
        };
        try {
            if (formMode === 'creating') {
                await crearAlmacen(formConTipo);
                const almacenesActualizados = await fetchAlmacenes();
                setWarehouses(almacenesActualizados);
                EventBus.dispatchEvent(new Event('WAREHOUSES_UPDATED'));
                setAlert({ open: true, type: 'success', message: 'Almacén creado correctamente.' });
            } else if (formMode === 'editing') {
                await editarAlmacen(selectedWarehouse.id, formConTipo);
                const almacenesActualizados = await fetchAlmacenes();
                setWarehouses(almacenesActualizados);
                EventBus.dispatchEvent(new Event('WAREHOUSES_UPDATED'));
                setAlert({ open: true, type: 'success', message: 'Almacén actualizado correctamente.' });
            }
            setFormMode('disabled');
            setSelectedWarehouse(null);
        } catch (error) {
            console.error('Error al guardar almacén:', error);
            setAlert({ 
                open: true, 
                type: 'error', 
                message: error.message || 'Error al guardar el almacén.' 
            });
        }
    };
    const handleCancel = () => {
        setFormMode('disabled');
        setSelectedWarehouse(null);
        setForm({
            codigo: '',
            nombre: '',
            direccion: '',
            telefono: '',
            observacion: '',
            zona: '',
            estado: 'ACTIVO',
            es_principal: 0,
            es_tecnico: 1,
            capacidad: '',
            id_cuenta_contable: '',
            id_tipo: '',
            id_responsable: '',
            id_centro_costo: '',
            id_tecnico_optiweb: ''
        });
        setAlert({ open: true, type: 'info', message: 'Operación cancelada.' });
    };
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
                <div className="flex gap-2 bg-white border border-gray-200 p-2">
                    {formMode === 'disabled' && (
                        <>
                            <Button onClick={handleCreate}>
                                <PlusIcon className="w-4 h-4" />
                                Crear
                            </Button>
                            <Button onClick={handleEdit} disabled={!selectedWarehouse}>
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
                            <FormField label="Nombre" layout="side" labelClassName="w-20">
                                <Input 
                                    value={form.nombre} 
                                    onChange={e => handleChange('nombre', e.target.value)} 
                                    placeholder="Nombre del almacén"
                                    required 
                                />
                            </FormField>
                            <FormField label="Dirección" layout="side" labelClassName="w-20">
                                <Input 
                                    value={form.direccion} 
                                    onChange={e => handleChange('direccion', e.target.value)} 
                                    placeholder="Dirección del almacén"
                                />
                            </FormField>
                            <FormField label="Teléfono" layout="side" labelClassName="w-20">
                                <Input 
                                    value={form.telefono} 
                                    onChange={e => handleChange('telefono', e.target.value)} 
                                    placeholder="Número de teléfono"
                                />
                            </FormField>
                            <FormField label="Zona" layout="side" labelClassName="w-20">
                                <Input 
                                    value={form.zona} 
                                    onChange={e => handleChange('zona', e.target.value)} 
                                    placeholder="Zona del almacén"
                                />
                            </FormField>
                            <FormField label="Estado" layout="side" labelClassName="w-20">
                                <Select
                                    value={form.estado}
                                    onChange={e => handleChange('estado', e)}
                                    options={[
                                        { value: 'ACTIVO', label: 'ACTIVO' },
                                        { value: 'INACTIVO', label: 'INACTIVO' }
                                    ]}
                                    required
                                    placeholder="Seleccionar estado"
                                />
                            </FormField>
                            <FormField label="C.C. / Técnico" layout="side" labelClassName="w-20">
                                <Select
                                    value={form.id_tecnico_optiweb}
                                    onChange={e => handleChange('id_tecnico_optiweb', e)}
                                    options={opciones.personalTecnico.map(tecnico => ({
                                        value: tecnico.id,
                                        label: tecnico.nombre_completo
                                    }))}
                                    placeholder="Seleccionar técnico"
                                    required
                                />
                            </FormField>
                            <div className="col-span-2">
                                <FormField label="Observación" layout="side" labelClassName="w-20">
                                    <Input 
                                        value={form.observacion} 
                                        onChange={e => handleChange('observacion', e.target.value)} 
                                        placeholder="Observaciones adicionales"
                                    />
                                </FormField>
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
                                        <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Nombre</th>
                                        <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Técnico</th>
                                        <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Tipo</th>
                                        <th className="p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-8 text-gray-500">Cargando almacenes...</td>
                                        </tr>
                                    ) : warehouses.filter(w => w.es_tecnico === 1).length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-8 text-gray-500">No hay almacenes técnicos registrados</td>
                                        </tr>
                                    ) : (
                                        warehouses.filter(w => w.es_tecnico === 1).map((warehouse, idx) => (
                                            <tr
                                                key={warehouse.id || idx}
                                                className={`hover:bg-slate-600 hover:text-white cursor-pointer transition-colors ${selectedWarehouse?.id === warehouse.id ? 'bg-slate-600 text-white' : ''}`}
                                                onClick={() => setSelectedWarehouse(warehouse)}
                                            >
                                                <td className="p-2 text-xs text-center">{idx + 1}</td>
                                                <td className="p-2 text-xs">{warehouse.codigo}</td>
                                                <td className="p-2 text-xs">{warehouse.nombre}</td>
                                                <td className="p-2 text-xs">{warehouse.tecnico_optiweb_nombre || '-'}</td>
                                                <td className="p-2 text-xs">{warehouse.tipo_almacen_nombre || '-'}</td>
                                                <td className="p-2 text-xs">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${warehouse.estado === 'ACTIVO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {warehouse.estado}
                                                    </span>
                                                </td>
                                            </tr>
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

export default Warehouses;