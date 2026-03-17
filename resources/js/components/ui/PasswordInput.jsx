import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Input de contraseña con botón para mostrar/ocultar
 */
export default function PasswordInput({ value, onChange, placeholder = '••••••••', className = '', required, minLength, name, autoComplete }) {
    const [visible, setVisible] = useState(false);

    const baseClass = 'w-full px-4 py-3 pr-12 bg-zinc-50 dark:bg-[#050505] border border-zinc-200 dark:border-[#1f1f1f] rounded-lg focus:ring-1 focus:ring-[#AF9460] outline-none transition-all placeholder:text-zinc-300 dark:placeholder:text-zinc-800 text-zinc-900 dark:text-white text-sm shadow-sm';

    return (
        <div className="relative">
            <input
                type={visible ? 'text' : 'password'}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                minLength={minLength}
                autoComplete={autoComplete}
                className={`${baseClass} ${className}`}
            />
            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                tabIndex={-1}
                aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
        </div>
    );
}
