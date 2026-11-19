import { useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { lerArquivoImagemAepAet, type AepAetFoto } from "@/lib/aepAetFormulario";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  fotos: AepAetFoto[];
  onChange: (fotos: AepAetFoto[]) => void;
  required?: boolean;
  error?: boolean;
  maxFotos?: number;
  minFotos?: number;
};

export function AepAetFotosCampo({
  label,
  fotos,
  onChange,
  required,
  error,
  maxFotos = 8,
  minFotos,
}: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galeriaRef = useRef<HTMLInputElement>(null);
  const [lendo, setLendo] = useState(false);

  const adicionar = async (file?: File | null) => {
    if (!file) return;
    if (fotos.length >= maxFotos) {
      toast.error(`Limite de ${maxFotos} fotos.`);
      return;
    }
    setLendo(true);
    try {
      const foto = await lerArquivoImagemAepAet(file);
      onChange([...fotos, foto]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao carregar a imagem.");
    } finally {
      setLendo(false);
    }
  };

  const remover = (id: string) => onChange(fotos.filter((f) => f.id !== id));

  return (
    <div
      className={cn(
        "space-y-3 rounded-lg border p-3",
        error ? "border-destructive/60" : "border-border/70",
      )}
    >
      <div className="space-y-0.5">
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive"> *</span>}
        </Label>
        {minFotos != null && (
          <p className="text-xs text-muted-foreground">
            {fotos.length}/{minFotos} foto{minFotos === 1 ? "" : "s"}
            {maxFotos < 8 ? ` (máx. ${maxFotos})` : ""}
          </p>
        )}
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          void adicionar(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={galeriaRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void adicionar(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={lendo || fotos.length >= maxFotos}
          onClick={() => cameraRef.current?.click()}
        >
          {lendo ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Camera className="mr-1.5 h-4 w-4" />}
          Tirar foto
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={lendo || fotos.length >= maxFotos}
          onClick={() => galeriaRef.current?.click()}
        >
          <Upload className="mr-1.5 h-4 w-4" /> Anexar imagem
        </Button>
      </div>

      {fotos.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-border/80 bg-muted/20 px-3 py-6 text-sm text-muted-foreground">
          <ImagePlus className="h-4 w-4 shrink-0" />
          Nenhuma foto adicionada.
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {fotos.map((f, idx) => (
            <li key={f.id} className="relative overflow-hidden rounded-lg border border-border/70 bg-card">
              <img
                src={f.imagem}
                alt={f.nome || `Foto ${idx + 1}`}
                className="h-40 w-full object-contain bg-muted/30"
              />
              <div className="flex items-center justify-between gap-2 border-t border-border/60 px-2 py-1.5">
                <span className="truncate text-xs text-muted-foreground">
                  {f.nome || `Foto ${idx + 1}`}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  aria-label={`Remover foto ${idx + 1}`}
                  onClick={() => remover(f.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
