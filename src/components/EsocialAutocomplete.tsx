import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { esocialAgentes, type EsocialAgente } from "@/lib/esocialTabela24";

interface Props {
  onSelect: (agente: EsocialAgente) => void;
  value?: string;
}

export function EsocialAutocomplete({ onSelect, value }: Props) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<EsocialAgente[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value !== undefined) setQuery(value);
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = (val: string) => {
    setQuery(val);
    if (val.length < 2) { setResults([]); setOpen(false); return; }
    const q = val.toLowerCase();
    const filtered = esocialAgentes.filter(
      (a) => a.codigo.toLowerCase().includes(q) || a.descricao.toLowerCase().includes(q)
    ).slice(0, 10);
    setResults(filtered);
    setOpen(filtered.length > 0);
  };

  return (
    <div ref={ref} className="relative">
      <Input
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Buscar código ou descrição eSocial..."
        onFocus={() => query.length >= 2 && results.length > 0 && setOpen(true)}
      />
      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {results.map((a) => (
            <button
              key={a.codigo}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-accent/10 text-sm flex gap-2"
              onClick={() => {
                onSelect(a);
                setQuery(`${a.codigo} - ${a.descricao}`);
                setOpen(false);
              }}
            >
              <span className="font-mono text-xs text-muted-foreground shrink-0">{a.codigo}</span>
              <span className="truncate">{a.descricao}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
