import { useState } from 'react';
import { Input } from '../atoms';
import { ComboBox } from '../molecules';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

/**
 * EntityManager - Atomic organism for managing entities (company, category, line, brand)
 * Props:
 *  - label: string (label for the field)
 *  - value: string (selected value)
 *  - options: array of { value, label }
 *  - loading: boolean
 *  - onChange: (value) => void
 *  - onCreate: () => void
 *  - onEdit: (newValue) => void
 *  - onDelete: () => void
 */
export default function EntityManager({
    label,
    value,
    options,
    loading,
    onChange,
    onCreate,
    onEdit,
    onDelete
}) {
    const [editMode, setEditMode] = useState(false);
    const [editValue, setEditValue] = useState('');
    const [originalValue, setOriginalValue] = useState('');

    const startEdit = () => {
        setOriginalValue(value);
        setEditValue(value);
        setEditMode(true);
    };
    const cancelEdit = () => {
        setEditMode(false);
        setEditValue('');
        setOriginalValue('');
    };
    const confirmEdit = () => {
        if (editValue && editValue !== originalValue) {
            onEdit(editValue);
        }
        setEditMode(false);
        setEditValue('');
        setOriginalValue('');
    };

    return (
        <div className="flex items-center gap-2 w-full">
            {!editMode ? (
                <>
                    <ComboBox
                        value={value}
                        onSelect={onChange}
                        onChange={onChange}
                        options={options}
                        placeholder={label}
                        className="flex-1"
                        disabled={loading}
                    />
                    <button
                        type="button"
                        className="p-1 text-green-600 hover:bg-green-100 rounded disabled:opacity-50"
                        title={`Add ${label}`}
                        onClick={onCreate}
                        disabled={!value || loading}
                    >
                        <PlusIcon className="w-5 h-5" />
                    </button>
                    <button
                        type="button"
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded disabled:opacity-50"
                        title={`Edit ${label}`}
                        onClick={startEdit}
                        disabled={!value || loading}
                    >
                        <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                        type="button"
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                        title={`Delete ${label}`}
                        onClick={onDelete}
                        disabled={!value || loading}
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </>
            ) : (
                <>
                    <div className="flex flex-row flex-1 items-center gap-2">
                        <Input
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            placeholder={`New ${label}`}
                            autoFocus
                        />
                        <span className="text-xs text-gray-500 whitespace-nowrap">Original: <b>{originalValue}</b></span>
                    </div>
                    <button
                        type="button"
                        className="p-1 text-green-600 hover:bg-green-100 rounded"
                        title="Confirm edit"
                        onClick={confirmEdit}
                        disabled={loading}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </button>
                    <button
                        type="button"
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                        title="Cancel edit"
                        onClick={cancelEdit}
                        disabled={loading}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </>
            )}
        </div>
    );
}
