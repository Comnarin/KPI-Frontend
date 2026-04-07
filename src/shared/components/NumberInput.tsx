'use client';

import { useRef, useState } from 'react';

interface NumberInputProps {
  value: number;
  onChange: (val: number) => void;
  placeholder?: string;
  allowNegative?: boolean;
  allowDecimal?: boolean;
  className?: string;
  style?: React.CSSProperties;
  step?: number;
}

/**
 * A clean number input that:
 * - Shows empty string instead of "0" when the field is empty / cleared
 * - Removes leading zeros while typing
 * - Shows controlled decimal via allowDecimal
 * - Prevents negatives unless allowNegative is true
 * - Uses type="text" with inputMode="decimal" for best mobile UX
 * - No browser spinner arrows
 */
export default function NumberInput({
  value,
  onChange,
  placeholder = '0',
  allowNegative = false,
  allowDecimal = false,
  className = 'input-field',
  style,
}: NumberInputProps) {
  // Display state: we allow free-form text while typing, convert on blur
  const [display, setDisplay] = useState<string>(value === 0 ? '' : String(value));
  const isFocused = useRef(false);

  function buildPattern() {
    // Build regex for allowed characters
    let pattern = allowNegative ? '^-?' : '^';
    pattern += '\\d*';
    if (allowDecimal) pattern += '(\\.\\d*)?';
    pattern += '$';
    return new RegExp(pattern);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;

    // Allow clearing the field
    if (raw === '' || raw === '-') {
      setDisplay(raw);
      if (raw === '') onChange(0);
      return;
    }

    // Only allow valid characters
    if (!buildPattern().test(raw)) return;

    // Remove internal leading zeros (e.g. "007" → "7") but keep "0." for decimals
    let cleaned = raw;
    if (allowDecimal) {
      cleaned = raw.replace(/^(-?)0+(\d)/, '$1$2'); // remove leading zeros before non-zero
    } else {
      cleaned = raw.replace(/^(-?)0+(\d+)/, '$1$2');
    }

    setDisplay(cleaned);

    const num = parseFloat(cleaned);
    if (!isNaN(num)) {
      onChange(num);
    }
  }

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    isFocused.current = true;
    // When focusing, show current value (suppress 0 → show empty)
    setDisplay(value === 0 ? '' : String(value));
    e.target.select();
  }

  function handleBlur() {
    isFocused.current = false;
    // On blur, normalise the display
    const num = parseFloat(display);
    if (isNaN(num) || display === '' || display === '-') {
      setDisplay('');
      onChange(0);
    } else {
      // Clamp negatives if not allowed
      const final = !allowNegative && num < 0 ? 0 : num;
      setDisplay(final === 0 ? '' : String(final));
      onChange(final);
    }
  }

  // Sync external value changes when not focused
  const externalDisplay = value === 0 ? '' : String(value);
  const shownValue = isFocused.current ? display : externalDisplay;

  return (
    <input
      type="text"
      inputMode={allowDecimal ? 'decimal' : 'numeric'}
      className={className}
      style={style}
      value={shownValue}
      placeholder={placeholder}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
}
