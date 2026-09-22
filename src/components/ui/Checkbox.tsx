

"use client";

import {
  InputHTMLAttributes,
  useId,
} from "react";

interface CheckboxProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "type"
  > {
  label?: string;
}

export default function Checkbox({
  label,
  className = "",
  id,
  ...props
}: CheckboxProps) {
  const generatedId = useId();

  const checkboxId = id || generatedId;

  return (
    <div className="flex items-center gap-2">
      <input
        {...props}
        id={checkboxId}
        type="checkbox"
        className={`h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      />

      {label && (
        <label
          htmlFor={checkboxId}
          className="cursor-pointer select-none text-sm text-[var(--color-text)]"
        >
          {label}
        </label>
      )}
    </div>
  );
}

