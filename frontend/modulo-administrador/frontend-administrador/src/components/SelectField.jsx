import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export default function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  buttonClassName = '',
  valueClassName = '',
  chevronClassName = 'text-slate-200',
  optionClassName = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption =
    options.find((option) => String(option.value) === String(value)) ||
    options[0] || { value: '', label: '' };

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  function handleSelectOption(optionValue) {
    onChange({ target: { value: String(optionValue) } });
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-medium text-slate-400"
      >
        {label}
      </label>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between gap-2 rounded-md border bg-slate-900 px-3 py-2 text-left text-sm text-slate-100 transition-colors focus:outline-none ${
          isOpen
            ? 'border-cyan-500'
            : 'border-slate-800 hover:border-slate-700 focus:border-cyan-500'
        } ${buttonClassName}`}
      >
        <span className={`truncate ${valueClassName}`}>
          {selectedOption.label}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform ${chevronClassName} ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <ul
          role="listbox"
          aria-labelledby={id}
          className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-slate-700 bg-slate-900 py-1 shadow-xl"
        >
          {options.map((option) => {
            const isSelected = String(option.value) === String(value);
            return (
              <li
                key={String(option.value)}
                role="option"
                aria-selected={isSelected}
              >
                <button
                  type="button"
                  onClick={() => handleSelectOption(option.value)}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors ${
                    isSelected
                      ? 'bg-cyan-600 font-medium text-slate-100'
                      : 'text-slate-200 hover:bg-slate-800 hover:text-slate-100'
                  } ${optionClassName}`}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && (
                    <Check className="h-4 w-4 shrink-0 text-slate-100" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
