import { useState, useRef, useEffect } from 'react'
import { Input, Button, Icon } from '../atoms'
import { ChevronDownIcon, ChevronUpIcon, XMarkIcon } from '@heroicons/react/24/outline'

/**
 * ComboBox Molecule - Componente de selección con búsqueda
 * 
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.options - Array de opciones [{value, label}]
 * @param {string} props.value - Valor seleccionado
 * @param {Function} props.onSelect - Función cuando se selecciona una opción
 * @param {string} props.placeholder - Texto placeholder
 * @param {boolean} props.searchable - Permite búsqueda (default: true)
 * @param {boolean} props.clearable - Permite limpiar selección (default: true)
 * @param {string} props.variant - Variante del input (default, error, success)
 * @param {boolean} props.disabled - Estado deshabilitado
 * @param {string} props.className - Clases adicionales
 * @param {string} props.id - ID del componente
 * @param {string} props.name - Nombre del componente
 * @param {string} props.noOptionsText - Texto cuando no hay opciones (default: "No hay opciones")
 */

function ComboBox({
    options = [],
    value = '',
    onSelect,
    onChange,
    placeholder = "",
    searchable = true,
    clearable = true,
    variant = 'default',
    disabled = false,
    className = '',
    id,
    name,
    noOptionsText = "No hay opciones",
    ...props
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(value || '');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const listRef = useRef(null);

    useEffect(() => {
        if (value) {
            // Buscar la opción correspondiente al valor para mostrar su label
            const selectedOption = options.find(option => option.value === value);
            setSearchTerm(selectedOption ? selectedOption.label : value);
        } else {
            setSearchTerm('');
        }
    }, [value, options]);

    const filteredOptions = searchable
        ? options.filter(option =>
            option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            option.value.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : options;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
                setHighlightedIndex(-1);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (!isOpen) return;
            switch (event.key) {
                case 'ArrowDown':
                    event.preventDefault();
                    setHighlightedIndex(prev =>
                        prev < filteredOptions.length - 1 ? prev + 1 : prev
                    );
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
                    break;
                case 'Enter':
                    event.preventDefault();
                    if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
                        const selectedOption = filteredOptions[highlightedIndex];
                        if (onSelect) onSelect(selectedOption.value, selectedOption);
                        if (onChange) onChange(selectedOption.value);
                        setSearchTerm(selectedOption.label); // Mostrar el label en el input
                        setIsOpen(false);
                        setHighlightedIndex(-1);
                        inputRef.current?.blur();
                    }
                    break;
                case 'Escape':
                    setIsOpen(false);
                    setHighlightedIndex(-1);
                    inputRef.current?.blur();
                    break;
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, highlightedIndex, filteredOptions, onSelect, onChange]);

    const handleInputClick = () => {
        if (disabled) return;
        setIsOpen(!isOpen);
        inputRef.current?.focus();
    };

    const handleInputChange = (e) => {
        setSearchTerm(e.target.value);
        if (onChange) onChange(e.target.value);
        setIsOpen(true);
        setHighlightedIndex(-1);
    };

    const handleSelectOption = (option) => {
        if (onSelect) onSelect(option.value, option);
        if (onChange) onChange(option.value);
        setSearchTerm(option.label); // Mostrar el label en el input
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
    };

    const handleClear = (e) => {
        e.stopPropagation();
        if (onSelect) onSelect('', null);
        if (onChange) onChange('');
        setSearchTerm('');
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className={`relative ${className}`} id={id}>
            <div className="relative">
                <Input
                    ref={inputRef}
                    value={searchTerm}
                    onChange={handleInputChange}
                    onClick={handleInputClick}
                    placeholder={placeholder}
                    variant={variant}
                    disabled={disabled}
                    className="pr-20"
                    name={name}
                    {...props}
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {clearable && value && !disabled && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={handleClear}
                            className="p-1 h-6 w-6 hover:bg-gray-200 rounded"
                        >
                            <Icon icon={XMarkIcon} className="h-3 w-3" />
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={handleInputClick}
                        disabled={disabled}
                        className="p-1 h-6 w-6 hover:bg-gray-200 rounded"
                    >
                        <Icon
                            icon={isOpen ? ChevronUpIcon : ChevronDownIcon}
                            className="h-3 w-3"
                        />
                    </Button>
                </div>
            </div>
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {filteredOptions.length > 0 ? (
                        <ul ref={listRef} className="py-1">
                            {filteredOptions.map((option, index) => (
                                <li
                                    key={option.value}
                                    onClick={() => handleSelectOption(option)}
                                    className={`
                                        px-2 py-1 text-xs cursor-pointer transition-colors
                                        ${index === highlightedIndex
                                            ? 'bg-blue-100 text-blue-900'
                                            : 'text-gray-900 hover:bg-gray-100'
                                        }
                                        ${value === option.value
                                            ? 'bg-blue-50 font-medium'
                                            : ''
                                        }
                                    `}
                                >
                                    {option.label}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="px-3 py-2 text-xs text-gray-500 italic">
                            {noOptionsText}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default ComboBox