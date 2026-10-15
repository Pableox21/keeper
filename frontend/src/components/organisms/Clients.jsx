import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from '../../hooks/useForm';
import { useAlert } from '../../hooks/useAlert';
import { PlusIcon, PencilIcon, NoSymbolIcon, CheckCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Input, Select, Alert } from '../atoms';
import Button from '../atoms/Button';
import { FormField } from '../molecules';
import { fetchClientes, crearCliente, editarCliente, cambiarEstadoCliente, eliminarCliente } from '../../api/clientes';

const ZONAS = [
    { value: 'SIPE_SIPE', label: 'Sipe Sipe' },
    { value: 'SUTICOLLO', label: 'Suticollo' },
    { value: 'MALLCO_CHAPI', label: 'Mallco Chapi' }
];

const PLANES = [
    { value: 'ECONOMICO', label: 'Económico' },
    { value: 'MEDIO', label: 'Medio' },
    { value: 'PREMIUM', label: 'Premium' },
    { value: 'GAMER', label: 'Gamer' }
];

const getLabel = (options, value) => options.find((o) => o.value === value)?.label || value;

// Nombre: solo letras (con tildes y ñ), espacios y los signos . ' -
const NOMBRE_REGEX = /^\p{L}[\p{L}\s.'’-]*$/u;
const sanitizeNombre = (value) => value.replace(/[^\p{L}\s.'’-]/gu, '');

// CI y complemento se muestran juntos: 1234567-1A
const formatCi = (cliente) => (cliente.ci_complemento ? `${cliente.ci}-${cliente.ci_complemento}` : cliente.ci);

const validateForm = (form) => {
    if (!form.numero_contrato.trim()) return 'Ingresa el número de contrato';
    if (!form.nombre_completo.trim()) return 'Ingresa el nombre completo';
    if (form.nombre_completo.trim().length < 3) return 'El nombre completo debe tener al menos 3 caracteres';
    if (!NOMBRE_REGEX.test(form.nombre_completo.trim())) return 'El nombre completo solo puede contener letras y espacios';
    if (!/^\d{5,10}$/.test(form.ci)) return 'El CI debe tener entre 5 y 10 dígitos';
    if (form.ci_complemento && !/^[A-Z0-9]{1,3}$/.test(form.ci_complemento)) {
        return 'El complemento del CI debe tener entre 1 y 3 letras o números';
    }
    if (!/^[67]\d{7}$/.test(form.celular)) return 'El celular debe tener 8 dígitos y empezar con 6 o 7';
    if (!form.zona) return 'Selecciona la zona';
    if (!form.plan) return 'Selecciona el plan de internet';
    return null;
};

function Clients() {
    const initialForm = {
        numero_contrato: '',
        nombre_completo: '',
        ci: '',
        ci_complemento: '',
        celular: '',
        zona: '',
        plan: ''
    };
    const {
        values: form,
        setValues: setForm,
        handleChange,
        resetForm
    } = useForm(initialForm);

    const { alert, showAlert, closeAlert, setAlert } = useAlert();
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formMode, setFormMode] = useState('disabled'); // 'disabled', 'creating', 'editing'
    const [selectedCliente, setSelectedCliente] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [search, setSearch] = useState('');

    const isActive = selectedCliente?.estado === 'ACTIVO';

    // Cargar clientes al montar el componente
    const loadClientes = useCallback(async () => {
        try {
            const data = await fetchClientes();
            setClientes(data);
        } catch (error) {
            setAlert({
                open: true,
                type: 'error',
                message: 'Error al cargar los clientes: ' + error.message
            });
        }
    }, [setAlert]);

    useEffect(() => {
        loadClientes();
    }, [loadClientes]);

    // Búsqueda por contrato, nombre, CI, celular, zona o plan
    const filteredClientes = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return clientes;
        return clientes.filter((c) =>
            [
                c.numero_contrato,
                c.nombre_completo,
                formatCi(c),
                c.celular,
                getLabel(ZONAS, c.zona),
                getLabel(PLANES, c.plan)
            ].some((value) => String(value ?? '').toLowerCase().includes(term))
        );
    }, [clientes, search]);

    // Manejar selección de fila
    const handleRowSelect = (cliente) => {
        if (formMode !== 'disabled') return;
        setSelectedCliente(selectedCliente?.id === cliente.id ? null : cliente);
    };

    // Iniciar creación
    const handleCreate = () => {
        resetForm();
        setFormMode('creating');
        setSelectedCliente(null);
        setEditingId(null);
    };

    // Iniciar edición
    const handleEdit = () => {
        if (!selectedCliente) {
            showAlert('warning', 'Selecciona un cliente para editar');
            return;
        }
        setForm({
            numero_contrato: selectedCliente.numero_contrato || '',
            nombre_completo: selectedCliente.nombre_completo || '',
            ci: selectedCliente.ci || '',
            ci_complemento: selectedCliente.ci_complemento || '',
            celular: selectedCliente.celular || '',
            zona: selectedCliente.zona || '',
            plan: selectedCliente.plan || ''
        });
        setFormMode('editing');
        setEditingId(selectedCliente.id);
    };

    // Cancelar operación
    const handleCancel = () => {
        resetForm();
        setFormMode('disabled');
        setSelectedCliente(null);
        setEditingId(null);
    };

    // Activar / desactivar cliente
    const handleToggleEstado = async () => {
        if (!selectedCliente) {
            showAlert('warning', 'Selecciona un cliente');
            return;
        }

        const nuevoEstado = isActive ? 'INACTIVO' : 'ACTIVO';
        const accion = isActive ? 'desactivar' : 'activar';

        if (!confirm(`¿Estás seguro de ${accion} al cliente "${selectedCliente.nombre_completo}" (contrato ${selectedCliente.numero_contrato})?`)) {
            return;
        }

        try {
            await cambiarEstadoCliente(selectedCliente.id, nuevoEstado);
            showAlert('success', `Cliente ${isActive ? 'desactivado' : 'activado'} correctamente`);
            setSelectedCliente(null);
            await loadClientes();
        } catch (error) {
            showAlert('error', `Error al ${accion} el cliente: ` + error.message);
        }
    };

    // Eliminar cliente (definitivo)
    const handleDelete = async () => {
        if (!selectedCliente) {
            showAlert('warning', 'Selecciona un cliente para eliminar');
            return;
        }

        if (!confirm(
            `¿Eliminar definitivamente al cliente "${selectedCliente.nombre_completo}" (contrato ${selectedCliente.numero_contrato})?\n\nEsta acción no se puede deshacer.`
        )) {
            return;
        }

        try {
            await eliminarCliente(selectedCliente.id);
            showAlert('success', 'Cliente eliminado correctamente');
            setSelectedCliente(null);
            await loadClientes();
        } catch (error) {
            showAlert('error', 'Error al eliminar el cliente: ' + error.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationError = validateForm(form);
        if (validationError) {
            showAlert('warning', validationError);
            return;
        }

        setLoading(true);

        try {
            if (formMode === 'editing') {
                await editarCliente(editingId, form);
                showAlert('success', 'Cliente actualizado correctamente');
            } else {
                await crearCliente(form);
                showAlert('success', 'Cliente creado correctamente');
            }

            handleCancel();
            await loadClientes();
        } catch (error) {
            const action = formMode === 'editing' ? 'actualizar' : 'crear';
            showAlert('error', `Error al ${action} el cliente: ` + error.message);
        } finally {
            setLoading(false);
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
                <div className="flex items-center gap-2 p-2 bg-white border border-gray-200">
                    {formMode === 'disabled' && (
                        <>
                            <Button onClick={handleCreate}>
                                <PlusIcon className="w-4 h-4" /> Crear
                            </Button>
                            <Button onClick={handleEdit} disabled={!selectedCliente}>
                                <PencilIcon className="w-4 h-4" /> Editar
                            </Button>
                            <Button onClick={handleToggleEstado} disabled={!selectedCliente}>
                                {isActive || !selectedCliente ? (
                                    <><NoSymbolIcon className="w-4 h-4" /> Desactivar</>
                                ) : (
                                    <><CheckCircleIcon className="w-4 h-4" /> Activar</>
                                )}
                            </Button>
                            <Button onClick={handleDelete} disabled={!selectedCliente}>
                                <TrashIcon className="w-4 h-4" /> Eliminar
                            </Button>
                            <div className="ml-auto w-72">
                                <Input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Buscar por contrato, nombre, CI, celular..."
                                />
                            </div>
                        </>
                    )}
                    {(formMode === 'creating' || formMode === 'editing') && (
                        <>
                            <Button onClick={handleSubmit} disabled={loading}>
                                {loading ? 'Guardando...' : (formMode === 'editing' ? 'Actualizar' : 'Guardar')}
                            </Button>
                            <Button onClick={handleCancel}>Cancelar</Button>
                        </>
                    )}
                </div>

                {(formMode === 'creating' || formMode === 'editing') && (
                    <div className="p-2 bg-white border border-gray-200">
                        <form className="grid grid-cols-6 gap-2" onSubmit={handleSubmit}>
                            <FormField className="col-span-2" label="N° contrato" layout="side" required>
                                <Input
                                    value={form.numero_contrato}
                                    onChange={e => handleChange('numero_contrato', e.target.value)}
                                    placeholder="Ej: 00123"
                                    maxLength={30}
                                />
                            </FormField>
                            <FormField className="col-span-4" label="Nombre completo" layout="side" required>
                                <Input
                                    value={form.nombre_completo}
                                    onChange={e => handleChange('nombre_completo', sanitizeNombre(e.target.value))}
                                    placeholder="Ej: Juan Pérez Gómez"
                                    maxLength={255}
                                />
                            </FormField>
                            <FormField className="col-span-2" label="CI" layout="side" required>
                                <Input
                                    value={form.ci}
                                    onChange={e => handleChange('ci', e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    placeholder="Ej: 1234567"
                                    inputMode="numeric"
                                />
                            </FormField>
                            <FormField className="col-span-2" label="Complemento" layout="side">
                                <Input
                                    value={form.ci_complemento}
                                    onChange={e => handleChange('ci_complemento', e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 3))}
                                    placeholder="Opcional. Ej: 1A"
                                />
                            </FormField>
                            <FormField className="col-span-2" label="Celular" layout="side" required>
                                <Input
                                    value={form.celular}
                                    onChange={e => handleChange('celular', e.target.value.replace(/\D/g, '').slice(0, 8))}
                                    placeholder="Ej: 71234567"
                                    inputMode="numeric"
                                />
                            </FormField>
                            <FormField className="col-span-3" label="Zona" layout="side" required>
                                <Select
                                    options={ZONAS}
                                    value={form.zona}
                                    onChange={value => handleChange('zona', value)}
                                    placeholder="Selecciona zona"
                                    className="w-full"
                                />
                            </FormField>
                            <FormField className="col-span-3" label="Plan de internet" layout="side" required>
                                <Select
                                    options={PLANES}
                                    value={form.plan}
                                    onChange={value => handleChange('plan', value)}
                                    placeholder="Selecciona plan"
                                    className="w-full"
                                />
                            </FormField>
                        </form>
                    </div>
                )}

                <div className="bg-white border border-gray-200 flex-1 min-h-0 flex flex-col">
                    <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="sticky top-0 bg-gray-50 z-10 p-2 text-center text-xs font-medium text-black uppercase tracking-wider">#</th>
                                    <th className="sticky top-0 bg-gray-50 z-10 p-2 text-left text-xs font-medium text-black uppercase tracking-wider">N° contrato</th>
                                    <th className="sticky top-0 bg-gray-50 z-10 p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Nombre completo</th>
                                    <th className="sticky top-0 bg-gray-50 z-10 p-2 text-left text-xs font-medium text-black uppercase tracking-wider">CI</th>
                                    <th className="sticky top-0 bg-gray-50 z-10 p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Celular</th>
                                    <th className="sticky top-0 bg-gray-50 z-10 p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Zona</th>
                                    <th className="sticky top-0 bg-gray-50 z-10 p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Plan</th>
                                    <th className="sticky top-0 bg-gray-50 z-10 p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredClientes.map((c, idx) => (
                                    <tr
                                        key={c.id}
                                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                                            selectedCliente?.id === c.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                                        }`}
                                        onClick={() => handleRowSelect(c)}
                                    >
                                        <td className="p-2 text-xs text-black text-center">{idx + 1}</td>
                                        <td className="p-2 text-xs text-black">{c.numero_contrato}</td>
                                        <td className="p-2 text-xs text-black">{c.nombre_completo}</td>
                                        <td className="p-2 text-xs text-black">{formatCi(c)}</td>
                                        <td className="p-2 text-xs text-black">{c.celular}</td>
                                        <td className="p-2 text-xs text-black">{getLabel(ZONAS, c.zona)}</td>
                                        <td className="p-2 text-xs text-black">{getLabel(PLANES, c.plan)}</td>
                                        <td className="p-2 text-xs">
                                            <span className={`px-2 py-0.5 rounded-full font-medium ${
                                                c.estado === 'ACTIVO'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {c.estado === 'ACTIVO' ? 'Activo' : 'Desactivado'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredClientes.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                {clientes.length === 0 ? 'No hay clientes registrados' : 'Ningún cliente coincide con la búsqueda'}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default Clients;
