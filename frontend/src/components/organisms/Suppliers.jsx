// (mover handleDelete dentro del componente Suppliers)
import { useState, useEffect } from 'react'
import EventBus from '../../utils/EventBus';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { Input, Alert } from '../atoms'
import Button from '../atoms/Button';
import { FormField } from '../molecules'
import { onlyDigits, phoneChars, codeChars } from '../../utils/fieldRules';
import {
    fetchProveedores,
    crearProveedor,
    crearProveedorTelefono,
    crearProveedorEmail,
    editarProveedor,
    eliminarProveedor
} from '../../api/proveedores'

function Suppliers() {
    // ---------- Eliminar Proveedor ----------
    const handleDelete = async () => {
        if (!selectedSupplier) return
        try {
            await eliminarProveedor(selectedSupplier.id)
            setAlert({ open: true, type: 'success', message: 'Proveedor eliminado correctamente' })
            EventBus.dispatchEvent(new Event('SUPPLIERS_UPDATED'));
            fetchData()
            clearForm()
        } catch (err) {
            setAlert({ open: true, type: 'error', message: 'Error al eliminar: ' + (err.error || err.message) })
        }
    }
    const [alert, setAlert] = useState({ open: false, type: 'info', message: '' })
    const [suppliers, setSuppliers] = useState([])
    const [showForm, setShowForm] = useState(false)
    const [formMode, setFormMode] = useState('disabled')
    const [selectedSupplier, setSelectedSupplier] = useState(null)
    const [editingId, setEditingId] = useState(null)

    const emptyForm = {
        cod: '',
        nombre: '',
        nit: '',
        direccion: '',
        ciudad: '',
        zona: '',
        comentario: '',
        autorizado: true,
        id_tipodoc: null,
        created_by: null,
        updated_by: null,
        telefonos: [''],
        emails: ['']
    }
    const [formData, setFormData] = useState(emptyForm)

    const fetchData = async () => {
        try {
            const data = await fetchProveedores()
            setSuppliers(data)
        } catch {
            setSuppliers([])
        }
    }
    useEffect(() => {
        fetchData();
        // Suscribirse a eventos de actualización global
        const handler = () => fetchData();
        EventBus.addEventListener('SUPPLIERS_UPDATED', handler);
        return () => EventBus.removeEventListener('SUPPLIERS_UPDATED', handler);
    }, [])

    // ---------- helpers ----------
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }
    const handleListChange = (listName, idx, value) => {
        setFormData(prev => ({
            ...prev,
            [listName]: prev[listName].map((item, i) => i === idx ? value : item)
        }))
    }
    const addToList = listName => setFormData(prev => ({ ...prev, [listName]: [...prev[listName], ''] }))
    const removeFromList = (listName, idx) =>
        setFormData(prev => ({ ...prev, [listName]: prev[listName].filter((_, i) => i !== idx) }))

    const clearForm = () => {
        setFormData(emptyForm)
        setEditingId(null)
        setSelectedSupplier(null)
    }

    const handleCreate = () => {
        clearForm()
        setFormMode('creating')
        setShowForm(true)
    }

    const handleEdit = () => {
        if (!selectedSupplier) return
        setFormMode('editing')
        setEditingId(selectedSupplier.id)
        setFormData({
            ...selectedSupplier,
            telefonos: selectedSupplier.telefonos?.length ? selectedSupplier.telefonos : [''],
            emails: selectedSupplier.emails?.length ? selectedSupplier.emails : ['']
        })
        setShowForm(true)
    }

    const handleCancel = () => {
        clearForm()
        setFormMode('disabled')
        setShowForm(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.cod || !formData.nombre) {
            setAlert({ open: true, type: 'warning', message: 'Código y Nombre son obligatorios.' })
            return
        }
        try {
            let provId = editingId
            if (formMode === 'editing') {
                await editarProveedor(editingId, formData)
            } else {
                const nuevo = await crearProveedor(formData)
                provId = nuevo.id
            }
            for (const tel of formData.telefonos.filter(t => t.trim())) {
                await crearProveedorTelefono(provId, { telefono: tel })
            }
            for (const mail of formData.emails.filter(m => m.trim())) {
                await crearProveedorEmail(provId, { email: mail })
            }

            setAlert({
                open: true,
                type: 'success',
                message: formMode === 'editing' ? 'Proveedor actualizado correctamente' : 'Proveedor creado correctamente'
            })
            EventBus.dispatchEvent(new Event('SUPPLIERS_UPDATED'));
            fetchData()
            handleCancel()
        } catch (err) {
            if (err.error && err.error.includes('Duplicate entry')) {
                setAlert({ open: true, type: 'error', message: 'Ya existe un proveedor con ese código.' })
            } else {
                const action = formMode === 'editing' ? 'actualizar' : 'crear'
                setAlert({ open: true, type: 'error', message: `Error al ${action} proveedor: ` + (err.error || err.message) })
            }
        }
    }

    return (
        <>
            <Alert
                open={alert.open}
                type={alert.type}
                message={alert.message}
                onClose={() => setAlert(a => ({ ...a, open: false }))}
                duration={3000}
            />
            <div className="space-y-2">
                <div className="flex gap-2 p-2 bg-white border border-gray-200">
                    {formMode === 'disabled' && (
                        <div className="flex gap-2">
                            <Button color="primary" onClick={handleCreate}>
                                <PlusIcon className="w-4 h-4" /> Crear
                            </Button>
                            <Button color="secondary" onClick={handleEdit} disabled={!selectedSupplier}>
                                <PencilIcon className="w-4 h-4" /> Editar
                            </Button>
                            <Button color="danger" onClick={handleDelete} disabled={!selectedSupplier}>
                                <TrashIcon className="w-4 h-4 mr-1" /> Eliminar
                            </Button>
                        </div>
                    )}
                    {(formMode === 'creating' || formMode === 'editing') && (
                        <div className="flex gap-2">
                            <Button color="primary" onClick={handleSubmit}>
                                {formMode === 'editing' ? 'Actualizar' : 'Guardar'}
                            </Button>
                            <Button color="secondary" onClick={handleCancel}>
                                Cancelar
                            </Button>
                        </div>
                    )}
                </div>
                {showForm && (
                    <div className="bg-white border border-gray-200 p-4">
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <FormField label="Código" layout="side" required className="col-span-1" labelClassName="w-20">
                                <Input
                                    value={formData.cod}
                                    onChange={e => handleInputChange('cod', codeChars(e.target.value, 50))}
                                    disabled={formMode === 'disabled'}
                                    required
                                />
                            </FormField>
                            <FormField label="Nombre" layout="side" required className="col-span-1" labelClassName="w-20">
                                <Input
                                    value={formData.nombre}
                                    onChange={e => handleInputChange('nombre', e.target.value)}
                                    disabled={formMode === 'disabled'}
                                    required
                                />
                            </FormField>
                            <FormField label="NIT" layout="side" className="col-span-1" labelClassName="w-20">
                                <Input value={formData.nit} onChange={e => handleInputChange('nit', onlyDigits(e.target.value, 20))} disabled={formMode === 'disabled'} />
                            </FormField>
                            <FormField label="Ciudad" layout="side" className="col-span-1" labelClassName="w-20">
                                <Input value={formData.ciudad} onChange={e => handleInputChange('ciudad', e.target.value)} disabled={formMode === 'disabled'} />
                            </FormField>
                            <FormField label="Zona" layout="side" className="col-span-1" labelClassName="w-20">
                                <Input value={formData.zona} onChange={e => handleInputChange('zona', e.target.value)} disabled={formMode === 'disabled'} />
                            </FormField>
                            <FormField label="Comentario" layout="side" className="col-span-1" labelClassName="w-20">
                                <Input value={formData.comentario} onChange={e => handleInputChange('comentario', e.target.value)} disabled={formMode === 'disabled'} />
                            </FormField>
                            <FormField label="Teléfonos" layout="side" className="md:col-span-3 col-span-1" labelClassName="w-20">
                                <div className="flex flex-wrap gap-2">
                                    {formData.telefonos.map((t, idx) => (
                                        <div key={idx} className="flex items-center gap-1">
                                            <Input
                                                value={t}
                                                onChange={e => handleListChange('telefonos', idx, phoneChars(e.target.value))}
                                                placeholder="Teléfono"
                                                disabled={formMode === 'disabled'}
                                            />
                                            {formMode !== 'disabled' && formData.telefonos.length > 1 && (
                                                <button type="button" onClick={() => removeFromList('telefonos', idx)} className="bg-red-500 text-white p-1">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {formMode !== 'disabled' && (
                                        <button type="button" onClick={() => addToList('telefonos')} className="bg-blue-500 text-white p-1">
                                            <PlusIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </FormField>
                            <FormField label="Emails" layout="side" className="md:col-span-3 col-span-1" labelClassName="w-20">
                                <div className="flex flex-wrap gap-2">
                                    {formData.emails.map((m, idx) => (
                                        <div key={idx} className="flex items-center gap-1">
                                            <Input
                                                value={m}
                                                onChange={e => handleListChange('emails', idx, e.target.value)}
                                                placeholder="Email"
                                                disabled={formMode === 'disabled'}
                                            />
                                            {formMode !== 'disabled' && formData.emails.length > 1 && (
                                                <button type="button" onClick={() => removeFromList('emails', idx)} className="bg-red-500 text-white p-1">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {formMode !== 'disabled' && (
                                        <button type="button" onClick={() => addToList('emails')} className="bg-blue-500 text-white p-1">
                                            <PlusIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </FormField>
                        </form>
                    </div>
                )}
                <div className="bg-white border border-gray-200 overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-2">#</th>
                                <th className="p-2 text-left">Código</th>
                                <th className="p-2 text-left">Nombre</th>
                                <th className="p-2 text-left">NIT</th>
                                <th className="p-2 text-left">Ciudad</th>
                                <th className="p-2 text-left">Zona</th>
                                <th className="p-2 text-left">Comentario</th>
                            </tr>
                        </thead>
                        <tbody>
                            {suppliers.map((p, idx) => (
                                <tr
                                    key={p.id}
                                    className={`cursor-pointer hover:bg-gray-50 ${selectedSupplier?.id === p.id ? 'bg-blue-100' : ''}`}
                                    onClick={() => setSelectedSupplier(p)}
                                >
                                    <td className="p-2 text-center">{idx + 1}</td>
                                    <td className="p-2">{p.cod}</td>
                                    <td className="p-2">{p.nombre}</td>
                                    <td className="p-2">{p.nit}</td>
                                    <td className="p-2">{p.ciudad}</td>
                                    <td className="p-2">{p.zona}</td>
                                    <td className="p-2">{p.comentario || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    )
}

export default Suppliers
