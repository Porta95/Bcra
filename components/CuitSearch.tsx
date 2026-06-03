"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function CuitSearch() {
  const [value, setValue] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clean = value.replace(/\D/g, "");
    if (clean.length >= 10) {
      router.push(`/deudores?cuit=${clean}`);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Format as XX-XXXXXXXX-X while typing
    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
    let formatted = digits;
    if (digits.length > 2) formatted = digits.slice(0, 2) + "-" + digits.slice(2);
    if (digits.length > 10) formatted = formatted.slice(0, 11) + "-" + digits.slice(10);
    setValue(formatted);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-md mx-auto">
      <div className="relative flex-1">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={handleChange}
          placeholder="Ingresá tu CUIT (ej: 20-12345678-9)"
          className="input w-full pl-9 pr-4 py-3 text-sm"
          aria-label="CUIT o CUIL"
        />
      </div>
      <button
        type="submit"
        disabled={value.replace(/\D/g, "").length < 10}
        className="btn-primary px-5 py-3 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Consultar
      </button>
    </form>
  );
}
