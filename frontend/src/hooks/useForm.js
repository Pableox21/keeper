import { useState } from 'react';

/**
 * Custom hook para manejo de formularios con estado centralizado y handlers genéricos.
 * @param {object} initialValues - Estado inicial del formulario
 * @returns {object} - { values, handleChange, setValues, resetForm, handleArrayChange, handleArrayAdd, handleArrayRemove }
 */
export function useForm(initialValues) {
    const [values, setValues] = useState(initialValues);

    // Handler genérico para campos simples
    const handleChange = (field, value) => {
        setValues(prev => ({ ...prev, [field]: value }));
    };

    // Handler para campos tipo array (ej: codigosBarra)
    const handleArrayChange = (field, idx, value) => {
        setValues(prev => ({
            ...prev,
            [field]: prev[field].map((item, i) => (i === idx ? value : item)),
        }));
    };

    // Agregar elemento a un array
    const handleArrayAdd = (field, value = '') => {
        setValues(prev => ({
            ...prev,
            [field]: [...prev[field], value],
        }));
    };

    // Remover elemento de un array
    const handleArrayRemove = (field, idx) => {
        setValues(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== idx),
        }));
    };

    // Resetear formulario
    const resetForm = () => setValues(initialValues);

    return {
        values,
        setValues,
        handleChange,
        handleArrayChange,
        handleArrayAdd,
        handleArrayRemove,
        resetForm,
    };
}
