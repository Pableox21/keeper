import { useState, useEffect, useCallback } from 'react';
import { useForm } from '../../hooks/useForm';
import { useAlert } from '../../hooks/useAlert';
import { validateRequiredFields } from '../../utils/validation';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Input, Select, Alert } from '../atoms';
import Button from '../atoms/Button';
import { FormField } from '../molecules';
import { fetchUnidadesMedida, crearUnidadMedida, editarUnidadMedida, eliminarUnidadMedida } from '../../api/unidadesMedida';

function UnitsOfMeasure() {
    const initialForm = {
        nombre: '',
        abreviatura: '',
        tipo: '',
        descripcion: ''
    };
    const {
        values: form,
        setValues: setForm,
        handleChange,
        resetForm
    } = useForm(initialForm);

    const { alert, showAlert, closeAlert, setAlert } = useAlert();
    const [unidades, setUnidades] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formMode, setFormMode] = useState('disabled'); // 'disabled', 'creating', 'editing'
    const [selectedUnidad, setSelectedUnidad] = useState(null);
    const [editingId, setEditingId] = useState(null);

    const tipos = [
        { value: 'PESO', label: 'Peso' },
        { value: 'VOLUMEN', label: 'Volumen' },
        { value: 'LONGITUD', label: 'Longitud' },
        { value: 'AREA', label: 'Área' },
        { value: 'UNIDAD', label: 'Unidad' },
        { value: 'TIEMPO', label: 'Tiempo' }
    ];



    // Manejar selección de fila
    const handleRowSelect = (unidad) => {
        if (formMode !== 'disabled') return; // No permitir selección si estamos editando/creando
        setSelectedUnidad(selectedUnidad?.id === unidad.id ? null : unidad);
    };

    // Iniciar creación
    const handleCreate = () => {
        resetForm();
        setFormMode('creating');
        setSelectedUnidad(null);
        setEditingId(null);
    };

    // Iniciar edición
    const handleEdit = () => {
        if (!selectedUnidad) {
            showAlert('warning', 'Selecciona una unidad de medida para editar');
            return;
        }
        setForm({
            nombre: selectedUnidad.nombre || '',
            abreviatura: selectedUnidad.abreviatura || '',
            tipo: selectedUnidad.tipo || '',
            descripcion: selectedUnidad.descripcion || ''
        });
        setFormMode('editing');
        setEditingId(selectedUnidad.id);
    };

    // Cancelar operación
    const handleCancel = () => {
        resetForm();
        setFormMode('disabled');
        setSelectedUnidad(null);
        setEditingId(null);
    };

    // Eliminar unidad de medida
    const handleDelete = async () => {
        if (!selectedUnidad) {
            showAlert('warning', 'Selecciona una unidad de medida para eliminar');
            return;
        }

        if (!confirm(`¿Estás seguro de eliminar la unidad "${selectedUnidad.nombre}"?`)) {
            return;
        }

        try {
            await eliminarUnidadMedida(selectedUnidad.id);
            showAlert('success', 'Unidad de medida eliminada correctamente');
            setSelectedUnidad(null);
            loadUnidades();
        } catch (error) {
            showAlert('error', 'Error al eliminar unidad de medida: ' + error.message);
        }
    };

    // Cargar unidades de medida al montar el componente
    const loadUnidades = useCallback(async () => {
        try {
            const data = await fetchUnidadesMedida();
            setUnidades(data);
        } catch (error) {
            setAlert({
                open: true,
                type: 'error',
                message: 'Error al cargar las unidades de medida: ' + error.message
            });
        }
    }, [setAlert]);

    useEffect(() => {
        loadUnidades();
    }, [loadUnidades]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationError = validateRequiredFields(form, ['nombre', 'abreviatura', 'tipo']);
        if (validationError) {
            showAlert('warning', validationError);
            return;
        }

        setLoading(true);

        try {
            if (formMode === 'editing') {
                await editarUnidadMedida(editingId, form);
                showAlert('success', 'Unidad de medida actualizada correctamente');
            } else {
                await crearUnidadMedida(form);
                showAlert('success', 'Unidad de medida creada correctamente');
            }

            handleCancel(); // Limpiar formulario y resetear estado
            await loadUnidades(); // Recargar la lista
        } catch (error) {
            const action = formMode === 'editing' ? 'actualizar' : 'crear';
            showAlert('error', `Error al ${action} la unidad de medida: ` + error.message);
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
                <div className="flex gap-2 p-2 bg-white border border-gray-200">
                    {formMode === 'disabled' && (
                        <>
                            <Button onClick={handleCreate}>
                                <PlusIcon className="w-4 h-4" /> Crear
                            </Button>
                            <Button onClick={handleEdit} disabled={!selectedUnidad}>
                                <PencilIcon className="w-4 h-4" /> Editar
                            </Button>
                            <Button onClick={handleDelete} disabled={!selectedUnidad}>
                                <TrashIcon className="w-4 h-4" /> Eliminar
                            </Button>
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
                            <FormField label="Nombre" layout='side' required>
                                <Input 
                                    value={form.nombre}
                                    onChange={e => handleChange('nombre', e.target.value.slice(0, 50))}
                                    placeholder="Ej: Metro" 
                                />
                            </FormField>
                            <FormField label="Abreviatura" layout='side' required>
                                <Input 
                                    value={form.abreviatura}
                                    onChange={e => handleChange('abreviatura', e.target.value.slice(0, 10))}
                                    placeholder="Ej: m" 
                                />
                            </FormField>
                            <FormField label="Tipo" layout='side' required>
                                <Select
                                    options={tipos}
                                    value={form.tipo}
                                    onChange={value => handleChange('tipo', value)}
                                    placeholder="Selecciona tipo"
                                    className="w-full"
                                />
                            </FormField>
                            <FormField className='col-span-2' label="Descripción" layout='side'>
                                <Input 
                                    value={form.descripcion}
                                    onChange={e => handleChange('descripcion', e.target.value)}
                                    placeholder="Descripción opcional" 
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
                                    <th className="sticky top-0 bg-gray-50 z-10 p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Nombre</th>
                                    <th className="sticky top-0 bg-gray-50 z-10 p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Abreviatura</th>
                                    <th className="sticky top-0 bg-gray-50 z-10 p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Tipo</th>
                                    <th className="sticky top-0 bg-gray-50 z-10 p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Descripción</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {unidades.map((u, idx) => (
                                    <tr 
                                        key={u.id} 
                                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                                            selectedUnidad?.id === u.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                                        }`}
                                        onClick={() => handleRowSelect(u)}
                                    >
                                        <td className="p-2 text-xs text-black text-center">{idx + 1}</td>
                                        <td className="p-2 text-xs text-black">{u.nombre}</td>
                                        <td className="p-2 text-xs text-black">{u.abreviatura}</td>
                                        <td className="p-2 text-xs text-black">{u.tipo}</td>
                                        <td className="p-2 text-xs text-black">{u.descripcion}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {unidades.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                No hay unidades registradas
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default UnitsOfMeasure;