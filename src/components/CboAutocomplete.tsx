import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface Props {
  value: string;
  onSelect: (codigo: string, descricao: string) => void;
}

interface CboItem {
  codigo: string;
  titulo: string;
}

export function CboAutocomplete({ value, onSelect }: Props) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<CboItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchCbo = async (term: string) => {
    if (term.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`https://servicodados.ibge.gov.br/api/v2/cnae/subclasses`);
      // IBGE doesn't have a CBO API, so we use a local fallback approach
      // Search from a simplified inline list approach
      const localResults = searchLocalCbo(term);
      setResults(localResults);
      setShowDropdown(localResults.length > 0);
    } catch {
      const localResults = searchLocalCbo(term);
      setResults(localResults);
      setShowDropdown(localResults.length > 0);
    } finally {
      setLoading(false);
    }
  };

  const searchLocalCbo = (term: string): CboItem[] => {
    const t = term.toLowerCase();
    return cboDB
      .filter(c => c.codigo.includes(t) || c.titulo.toLowerCase().includes(t))
      .slice(0, 10);
  };

  const handleChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchCbo(val), 300);
  };

  const handleSelect = (item: CboItem) => {
    setQuery(item.codigo);
    onSelect(item.codigo, item.titulo);
    setShowDropdown(false);
  };

  return (
    <div ref={containerRef} className="relative mt-1">
      <div className="relative">
        <Input
          placeholder="Digite código ou nome da ocupação"
          value={query}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
        />
        {loading && <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-3 text-muted-foreground" />}
      </div>
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {results.map(item => (
            <button
              key={item.codigo}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent/10 transition-colors"
              onClick={() => handleSelect(item)}
            >
              <span className="font-mono text-xs text-muted-foreground mr-2">{item.codigo}</span>
              {item.titulo}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Simplified CBO database with common occupations
const cboDB: CboItem[] = [
  { codigo: "7842-05", titulo: "Alimentador de linha de produção" },
  { codigo: "7841-05", titulo: "Operador de máquinas fixas, em geral" },
  { codigo: "5143-20", titulo: "Auxiliar de limpeza" },
  { codigo: "4110-10", titulo: "Auxiliar de escritório" },
  { codigo: "4110-05", titulo: "Auxiliar administrativo" },
  { codigo: "2521-05", titulo: "Administrador" },
  { codigo: "2524-05", titulo: "Analista de recursos humanos" },
  { codigo: "3515-05", titulo: "Técnico em segurança do trabalho" },
  { codigo: "2234-05", titulo: "Farmacêutico" },
  { codigo: "2236-05", titulo: "Fisioterapeuta" },
  { codigo: "2235-05", titulo: "Enfermeiro" },
  { codigo: "2231-01", titulo: "Médico do trabalho" },
  { codigo: "2149-05", titulo: "Engenheiro de segurança do trabalho" },
  { codigo: "7152-10", titulo: "Pedreiro" },
  { codigo: "7170-20", titulo: "Pintor de obras" },
  { codigo: "7241-10", titulo: "Soldador" },
  { codigo: "7243-05", titulo: "Torneiro mecânico" },
  { codigo: "7244-05", titulo: "Fresador" },
  { codigo: "7823-05", titulo: "Motorista de caminhão" },
  { codigo: "7825-10", titulo: "Motorista de ônibus" },
  { codigo: "5211-10", titulo: "Vendedor de comércio varejista" },
  { codigo: "5201-05", titulo: "Supervisor de vendas" },
  { codigo: "1414-10", titulo: "Gerente de loja" },
  { codigo: "4211-25", titulo: "Operador de caixa" },
  { codigo: "5134-25", titulo: "Cozinheiro" },
  { codigo: "5131-05", titulo: "Garçom" },
  { codigo: "5163-45", titulo: "Vigilante" },
  { codigo: "5174-10", titulo: "Porteiro" },
  { codigo: "3171-05", titulo: "Técnico em informática" },
  { codigo: "2124-05", titulo: "Analista de sistemas" },
  { codigo: "7211-05", titulo: "Eletricista de instalações" },
  { codigo: "9511-05", titulo: "Eletricista de manutenção" },
  { codigo: "8621-05", titulo: "Operador de caldeira" },
  { codigo: "6220-10", titulo: "Trabalhador agropecuário" },
  { codigo: "7832-05", titulo: "Operador de empilhadeira" },
  { codigo: "4141-05", titulo: "Almoxarife" },
  { codigo: "3511-05", titulo: "Técnico em enfermagem" },
  { codigo: "2394-05", titulo: "Professor de ensino fundamental" },
  { codigo: "2526-05", titulo: "Contador" },
  { codigo: "3542-05", titulo: "Técnico em contabilidade" },
];
