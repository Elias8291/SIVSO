/**
 * Input del explorador de organización — mismo aspecto que SearchInput / Mi vestuario.
 * onChange recibe el string (compatibilidad con hooks existentes).
 */
import SearchInput from '../../../components/ui/SearchInput';

export default function ExplorerInput({
    placeholder = 'Buscar...',
    value,
    onChange,
    onFocus,
    onClick,
    className = '',
    ...props
}) {
    return (
        <SearchInput
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onFocus={onFocus}
            onClick={onClick}
            className={className}
            {...props}
        />
    );
}
