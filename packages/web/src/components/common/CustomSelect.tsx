import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  label: string;
  value: string;
  description?: string;
}

interface CustomSelectProps {
  label?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
}

export function CustomSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  className = '',
  error,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`space-y-1.5 ${className}`} ref={containerRef}>
      {label && (
        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-electric-blue rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          {label}
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-4 py-3.5 bg-slate-900/60 border ${
            error ? 'border-red-500/50' : 'border-white/10'
          } rounded-sm text-sm font-medium transition-all hover:bg-slate-900/80 hover:border-white/20 focus:outline-none group ${
            isOpen ? 'border-electric-blue/50 ring-1 ring-electric-blue/20' : ''
          }`}
        >
          <span className={selectedOption ? 'text-white' : 'text-slate-500'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown 
            className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-electric-blue' : ''}`} 
          />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-slate-900/95 border border-white/10 rounded-sm shadow-[0_10px_40px_-10px_rgba(0,0,0,0.7)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex flex-col items-start px-4 py-3 text-left transition-colors hover:bg-electric-blue/5 group/opt relative ${
                    value === option.value ? 'bg-electric-blue/10' : ''
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-sm ${value === option.value ? 'text-electric-blue font-bold' : 'text-slate-300 group-hover/opt:text-white'}`}>
                      {option.label}
                    </span>
                    {value === option.value && (
                      <Check className="w-4 h-4 text-electric-blue" />
                    )}
                  </div>
                  {option.description && (
                    <span className="text-[10px] text-slate-500 mt-0.5 line-clamp-1 group-hover/opt:text-slate-400">
                      {option.description}
                    </span>
                  )}
                  {value === option.value && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-electric-blue" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-[10px] text-red-400 font-medium uppercase tracking-wider animate-pulse pt-1">
          {error}
        </p>
      )}
    </div>
  );
}
