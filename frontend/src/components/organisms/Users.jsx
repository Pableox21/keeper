import { useState, useEffect, useCallback } from 'react';
import { useForm } from '../../hooks/useForm';
import { useAlert } from '../../hooks/useAlert';
import { useAuth } from '../../hooks/useAuth';
import { validateRequiredFields } from '../../utils/validation';
import { PlusIcon, PencilIcon, NoSymbolIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Input, Select, Alert } from '../atoms';
import Button from '../atoms/Button';
import { FormField } from '../molecules';
import { fetchUsuarios, crearUsuario, editarUsuario, cambiarEstadoUsuario } from '../../api/usuarios';

const ROLES = [
    { value: 'ADMIN', label: 'Administrador' },
    { value: 'ALMACEN', label: 'Almacén' },
    { value: 'SUPERVISOR', label: 'Supervisor' },
    { value: 'USUARIO', label: 'Usuario' },
    { value: 'SOLO_LECTURA', label: 'Solo lectura' }
];

const MIN_PASSWORD_LENGTH = 6;

const getRolLabel = (rol) => ROLES.find((r) => r.value === rol)?.label || rol;

const formatDate = (value) => (value ? new Date(value).toLocaleString('es-BO') : 'Nunca');

function Users() {
    const initialForm = {
        username: '',
        nombre_completo: '',
        email: '',
        rol: '',
        password: ''
    };
    const {
        values: form,
        setValues: setForm,
        handleChange,
        resetForm
    } = useForm(initialForm);

    const { user: currentUser } = useAuth();
    const { alert, showAlert, closeAlert, setAlert } = useAlert();
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formMode, setFormMode] = useState('disabled'); // 'disabled', 'creating', 'editing'
    const [selectedUsuario, setSelectedUsuario] = useState(null);
    const [editingId, setEditingId] = useState(null);

    const isSelf = (usuario) => usuario && Number(usuario.id) === Number(currentUser?.id);
    const isActive = selectedUsuario?.estado === 'ACTIVO';

    // Cargar usuarios al montar el componente
    const loadUsuarios = useCallback(async () => {
        try {
            const data = await fetchUsuarios();
            setUsuarios(data);
        } catch (error) {
            setAlert({
                open: true,
                type: 'error',
                message: 'Error al cargar los usuarios: ' + error.message
            });
        }
    }, [setAlert]);

    useEffect(() => {
        loadUsuarios();
    }, [loadUsuarios]);

    // Manejar selección de fila
    const handleRowSelect = (usuario) => {
        if (formMode !== 'disabled') return;
        setSelectedUsuario(selectedUsuario?.id === usuario.id ? null : usuario);
    };

    // Iniciar creación
    const handleCreate = () => {
        resetForm();
        setFormMode('creating');
        setSelectedUsuario(null);
        setEditingId(null);
    };

    // Iniciar edición
    const handleEdit = () => {
        if (!selectedUsuario) {
            showAlert('warning', 'Selecciona un usuario para editar');
            return;
        }
        setForm({
            username: selectedUsuario.username || '',
            nombre_completo: selectedUsuario.nombre_completo || '',
            email: selectedUsuario.email || '',
            rol: selectedUsuario.rol || '',
            password: ''
        });
        setFormMode('editing');
        setEditingId(selectedUsuario.id);
    };

    // Cancelar operación
    const handleCancel = () => {
        resetForm();
        setFormMode('disabled');
        setSelectedUsuario(null);
        setEditingId(null);
    };

    // Habilitar / deshabilitar usuario
    const handleToggleEstado = async () => {
        if (!selectedUsuario) {
            showAlert('warning', 'Selecciona un usuario');
            return;
        }

        const nuevoEstado = isActive ? 'INACTIVO' : 'ACTIVO';
        const accion = isActive ? 'deshabilitar' : 'habilitar';

        if (!confirm(`¿Estás seguro de ${accion} al usuario "${selectedUsuario.username}"?`)) {
            return;
        }

        try {
            await cambiarEstadoUsuario(selectedUsuario.id, nuevoEstado);
            showAlert('success', `Usuario ${isActive ? 'deshabilitado' : 'habilitado'} correctamente`);
            setSelectedUsuario(null);
            await loadUsuarios();
        } catch (error) {
            showAlert('error', `Error al ${accion} el usuario: ` + error.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationError = validateRequiredFields(form, ['username', 'email', 'rol']);
        if (validationError) {
            showAlert('warning', validationError);
            return;
        }
        if (formMode === 'creating' && !form.password) {
            showAlert('warning', 'Por favor, ingresa una contraseña');
            return;
        }
        if (form.password && form.password.length < MIN_PASSWORD_LENGTH) {
            showAlert('warning', `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`);
            return;
        }

        setLoading(true);

        try {
            if (formMode === 'editing') {
                await editarUsuario(editingId, form);
                showAlert('success', 'Usuario actualizado correctamente');
            } else {
                await crearUsuario(form);
                showAlert('success', 'Usuario creado correctamente');
            }

            handleCancel();
            await loadUsuarios();
        } catch (error) {
            const action = formMode === 'editing' ? 'actualizar' : 'crear';
            showAlert('error', `Error al ${action} el usuario: ` + error.message);
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
                            <Button onClick={handleEdit} disabled={!selectedUsuario}>
                                <PencilIcon className="w-4 h-4" /> Editar
                            </Button>
                            <Button
                                onClick={handleToggleEstado}
                                disabled={!selectedUsuario || isSelf(selectedUsuario)}
                            >
                                {isActive || !selectedUsuario ? (
                                    <><NoSymbolIcon className="w-4 h-4" /> Deshabilitar</>
                                ) : (
                                    <><CheckCircleIcon className="w-4 h-4" /> Habilitar</>
                                )}
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
                            <FormField className="col-span-2" label="Usuario" layout="side" required>
                                <Input
                                    value={form.username}
                                    onChange={e => handleChange('username', e.target.value)}
                                    placeholder="Ej: almacen1"
                                />
                            </FormField>
                            <FormField className="col-span-2" label="Nombre completo" layout="side">
                                <Input
                                    value={form.nombre_completo}
                                    onChange={e => handleChange('nombre_completo', e.target.value)}
                                    placeholder="Ej: Juan Pérez"
                                />
                            </FormField>
                            <FormField className="col-span-2" label="Email" layout="side" required>
                                <Input
                                    type="email"
                                    value={form.email}
                                    onChange={e => handleChange('email', e.target.value)}
                                    placeholder="correo@ejemplo.com"
                                />
                            </FormField>
                            <FormField className="col-span-2" label="Rol" layout="side" required>
                                <Select
                                    options={ROLES}
                                    value={form.rol}
                                    onChange={value => handleChange('rol', value)}
                                    placeholder="Selecciona rol"
                                    disabled={formMode === 'editing' && isSelf(selectedUsuario)}
                                    className="w-full"
                                />
                            </FormField>
                            <FormField
                                className="col-span-2"
                                label={formMode === 'editing' ? 'Nueva contraseña' : 'Contraseña'}
                                layout="side"
                                required={formMode === 'creating'}
                            >
                                <Input
                                    type="password"
                                    value={form.password}
                                    onChange={e => handleChange('password', e.target.value)}
                                    placeholder={formMode === 'editing' ? 'Dejar vacío para no cambiarla' : 'Mínimo 6 caracteres'}
                                    autoComplete="new-password"
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
                                    <th className="sticky top-0 bg-gray-50 z-10 p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Usuario</th>
                                    <th className="sticky top-0 bg-gray-50 z-10 p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Nombre completo</th>
                                    <th className="sticky top-0 bg-gray-50 z-10 p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Email</th>
                                    <th className="sticky top-0 bg-gray-50 z-10 p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Rol</th>
                                    <th className="sticky top-0 bg-gray-50 z-10 p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Estado</th>
                                    <th className="sticky top-0 bg-gray-50 z-10 p-2 text-left text-xs font-medium text-black uppercase tracking-wider">Último acceso</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {usuarios.map((u, idx) => (
                                    <tr
                                        key={u.id}
                                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                                            selectedUsuario?.id === u.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                                        }`}
                                        onClick={() => handleRowSelect(u)}
                                    >
                                        <td className="p-2 text-xs text-black text-center">{idx + 1}</td>
                                        <td className="p-2 text-xs text-black">
                                            {u.username}
                                            {isSelf(u) && <span className="ml-1 text-gray-500">(tú)</span>}
                                        </td>
                                        <td className="p-2 text-xs text-black">{u.nombre_completo}</td>
                                        <td className="p-2 text-xs text-black">{u.email}</td>
                                        <td className="p-2 text-xs text-black">{getRolLabel(u.rol)}</td>
                                        <td className="p-2 text-xs">
                                            <span className={`px-2 py-0.5 rounded-full font-medium ${
                                                u.estado === 'ACTIVO'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {u.estado === 'ACTIVO' ? 'Activo' : 'Deshabilitado'}
                                            </span>
                                        </td>
                                        <td className="p-2 text-xs text-black">{formatDate(u.ultimo_acceso)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {usuarios.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                No hay usuarios registrados
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default Users;
