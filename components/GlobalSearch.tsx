"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Variable } from "@/lib/bcra";
import { TIPOS } from "@/lib/transparencia";

type Suggestion =
  | { kind: "cuit"; clean: string }
  | { kind: "variable"; v: Variable }
  | { kind: "tipo"; id: string; label: string }
  | { kind: "cheque-hint" };

export default function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [variables, setVariables] = useState<Variable[]>([]);
  const [loaded, setLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function ensureLoaded() {
    if (loaded) return;
    setLoaded(true);
    try {
      const r = await fetch("/api/macro");
      const j = await r.json();
      if (j.ok) setVariables(j.data as Variable[]);
    } catch {}
  }

  const suggestions: Suggestion[] = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    const out: Suggestion[] = [];
    const digits = q.replace(/\D/g, "");

    if (digits.length === 11) {
      out.push({ kind: "cuit", clean: digits });
    }

    const lower = q.toLowerCase();
    for (const t of TIPOS) {
      if (t.label.toLowerCase().includes(lower)) {
        out.push({ kind: "tipo", id: t.id, label: t.label });
        if (out.length > 8) break;
      }
    }

    if (variables.length) {
      const vMatches = variables
        .filter((v) => v.descripcion.toLowerCase().includes(lower))
        .slice(0, 6);
      for (const v of vMatches) {
        out.push({ kind: "variable", v });
      }
    }

    if (/cheque/i.test(q) || /cheq/i.test(q)) {
      out.push({ kind: "cheque-hint" });
    }

    return out.slice(0, 10);
  }, [query, variables]);

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function go(s: Suggestion) {
    setOpen(false);
    setQuery("");
    if (s.kind === "cuit") router.push(`/deudores?cuit=${s.clean}`);
    else if (s.kind === "tipo") router.push(`/comparador?tipo=${s.id}`);
    else if (s.kind === "variable") router.push(`/variable/${s.v.idVariable}`);
    else if (s.kind === "cheque-hint") router.push("/cheques");
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      setHighlight((h) => Math.min(suggestions.length - 1, h + 1));
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setHighlight((h) => Math.max(0, h - 1));
      e.preventDefault();
    } else if (e.key === "Enter") {
      if (suggestions[highlight]) go(suggestions[highlight]);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor="global-search" className="sr-only">
        Buscador global
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id="global-search"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            ensureLoaded();
          }}
          onKeyDown={onKeyDown}
          placeholder="Buscar banco, CUIT, variable…"
          aria-autocomplete="list"
          aria-expanded={open && suggestions.length > 0}
          className="input-sm pr-12"
        />
        <kbd
          aria-hidden="true"
          className="hidden md:inline-block absolute right-2 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-widest text-muted border border-border px-1.5 py-0.5"
        >
          ⌘K
        </kbd>
      </div>

      {open && query && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 mt-1 bg-panel2 border border-borderStrong max-h-80 overflow-y-auto z-40 shadow-2xl"
        >
          {suggestions.map((s, i) => (
            <li
              key={`${s.kind}-${i}`}
              role="option"
              aria-selected={i === highlight}
              onMouseDown={(ev) => {
                ev.preventDefault();
                go(s);
              }}
              onMouseEnter={() => setHighlight(i)}
              className={`px-3 py-2 text-xs cursor-pointer flex items-center gap-3 ${
                i === highlight ? "bg-accent text-bg" : "text-ink hover:bg-panel"
              }`}
            >
              <SuggestionRow s={s} active={i === highlight} />
            </li>
          ))}
        </ul>
      )}

      {open && query && suggestions.length === 0 && (
        <div className="absolute left-0 right-0 mt-1 bg-panel2 border border-borderStrong p-3 text-xs text-muted">
          Probá con "ICBC", "reservas", "20-12345678-3" o "tarjetas".
        </div>
      )}
    </div>
  );
}

function SuggestionRow({ s, active }: { s: Suggestion; active: boolean }) {
  const tagClass = active
    ? "text-bg/70 border-bg/40"
    : "text-muted border-border";
  if (s.kind === "cuit") {
    return (
      <>
        <span className={`tabular text-[10px] uppercase border px-1.5 ${tagClass}`}>
          CUIT
        </span>
        <span className="tabular truncate">{s.clean}</span>
        <span className={`ml-auto text-[10px] ${active ? "text-bg/60" : "text-muted"}`}>
          → Deudores
        </span>
      </>
    );
  }
  if (s.kind === "tipo") {
    return (
      <>
        <span className={`text-[10px] uppercase border px-1.5 ${tagClass}`}>
          Tipo
        </span>
        <span className="truncate">{s.label}</span>
        <span className={`ml-auto text-[10px] ${active ? "text-bg/60" : "text-muted"}`}>
          → Comparador
        </span>
      </>
    );
  }
  if (s.kind === "variable") {
    return (
      <>
        <span className={`tabular text-[10px] uppercase border px-1.5 ${tagClass}`}>
          #{s.v.idVariable}
        </span>
        <span className="truncate">{s.v.descripcion}</span>
        <span className={`ml-auto text-[10px] ${active ? "text-bg/60" : "text-muted"}`}>
          → Macro
        </span>
      </>
    );
  }
  return (
    <>
      <span className={`text-[10px] uppercase border px-1.5 ${tagClass}`}>
        Cheque
      </span>
      <span className="truncate">Verificar cheque denunciado</span>
      <span className={`ml-auto text-[10px] ${active ? "text-bg/60" : "text-muted"}`}>
        → Cheques
      </span>
    </>
  );
}
