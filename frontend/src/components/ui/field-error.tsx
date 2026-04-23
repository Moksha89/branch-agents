'use client';

interface FieldErrorProps {
  error: string | null | undefined;
}

export function FieldError({ error }: FieldErrorProps) {
  if (!error) return null;
  return (
    <p className="text-xs text-red-400 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
      {error}
    </p>
  );
}
