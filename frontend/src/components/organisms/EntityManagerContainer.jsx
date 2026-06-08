import { useState, useEffect } from 'react';
import EntityManager from './EntityManager';

export default function EntityManagerContainer({
    label,
    value,
    onChange,
    alertHandler,
    fetchList,
    createEntity,
    editEntity,
    deleteEntity
}) {
    const [entities, setEntities] = useState([]);
    const [loading, setLoading] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const data = await fetchList();
            setEntities(data);
        } catch {
            setEntities([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchList]);

    const handleCreate = async () => {
        const nombre = (value || '').trim().toUpperCase();
        if (!nombre) {
            alertHandler({ open: true, type: 'warning', message: `Ingrese el nombre de ${label.toLowerCase()}.` });
            return;
        }
        if (entities.some(e => e.nombre === nombre)) {
            alertHandler({ open: true, type: 'error', message: `Ya existe ${label.toLowerCase()} con ese nombre.` });
            return;
        }
        try {
            await createEntity(nombre);
            alertHandler({ open: true, type: 'success', message: `${label} creada correctamente.` });
            load();
        } catch (err) {
            alertHandler({ open: true, type: 'error', message: err.message });
        }
    };

    const handleEdit = async (newValue) => {
        const nombre = (value || '').trim().toUpperCase();
        const nuevoNombre = (newValue || '').trim().toUpperCase();
        if (!nuevoNombre) {
            alertHandler({ open: true, type: 'warning', message: `Ingrese el nuevo nombre de ${label.toLowerCase()}.` });
            return;
        }
        if (entities.some(e => e.nombre === nuevoNombre)) {
            alertHandler({ open: true, type: 'error', message: `Ya existe ${label.toLowerCase()} con ese nombre.` });
            return;
        }
        const entity = entities.find(e => e.nombre === nombre);
        if (!entity) {
            alertHandler({ open: true, type: 'error', message: `No se encontró ${label.toLowerCase()} original.` });
            return;
        }
        try {
            await editEntity(entity.id, nuevoNombre);
            alertHandler({ open: true, type: 'success', message: `${label} editada correctamente.` });
            onChange(nuevoNombre);
            load();
        } catch (err) {
            alertHandler({ open: true, type: 'error', message: err.message });
        }
    };

    const handleDelete = async () => {
        const nombre = (value || '').trim().toUpperCase();
        if (!nombre) {
            alertHandler({ open: true, type: 'warning', message: `Ingrese el nombre de ${label.toLowerCase()} a eliminar.` });
            return;
        }
        const entity = entities.find(e => e.nombre === nombre);
        if (!entity) {
            alertHandler({ open: true, type: 'error', message: `No existe ${label.toLowerCase()} con ese nombre.` });
            return;
        }
        try {
            await deleteEntity(entity.id);
            alertHandler({ open: true, type: 'success', message: `${label} eliminada correctamente.` });
            onChange('');
            load();
        } catch (err) {
            alertHandler({ open: true, type: 'error', message: err.message });
        }
    };

    return (
        <EntityManager
            label={label}
            value={value}
            options={entities.map(e => ({ value: e.nombre, label: e.nombre }))}
            loading={loading}
            onChange={onChange}
            onCreate={handleCreate}
            onEdit={handleEdit}
            onDelete={handleDelete}
        />
    );
}
