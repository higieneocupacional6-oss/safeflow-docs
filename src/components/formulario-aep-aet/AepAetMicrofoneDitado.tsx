import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SpeechResult = { 0: { transcript: string }; isFinal: boolean };
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((ev: { resultIndex: number; results: ArrayLike<SpeechResult> }) => void) | null;
  onerror: ((ev: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

function obterSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

type Props = {
  value: string;
  onChange: (next: string) => void;
  label?: string;
  className?: string;
};

/**
 * Ditado por voz via Web Speech API (quando disponível no navegador).
 * Não envia áudio a serviços externos configurados no app.
 */
export function AepAetMicrofoneDitado({ value, onChange, label = "Ditado por voz", className }: Props) {
  const Recognition = obterSpeechRecognition();
  const disponivel = !!Recognition;
  const [ouvindo, setOuvindo] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    return () => {
      try {
        recRef.current?.abort();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const alternar = () => {
    if (!Recognition) {
      toast.message("Ditado indisponível", {
        description: "Este navegador não oferece reconhecimento de voz.",
      });
      return;
    }

    if (ouvindo && recRef.current) {
      recRef.current.stop();
      setOuvindo(false);
      return;
    }

    const rec = new Recognition();
    rec.lang = "pt-BR";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (ev) => {
      let chunk = "";
      for (let i = ev.resultIndex; i < ev.results.length; i += 1) {
        const r = ev.results[i];
        if (r.isFinal) chunk += r[0].transcript;
      }
      const texto = chunk.trim();
      if (!texto) return;
      const base = valueRef.current.trim();
      onChange(base ? `${base} ${texto}` : texto);
    };
    rec.onerror = (ev) => {
      setOuvindo(false);
      if (ev.error === "not-allowed") {
        toast.error("Permissão de microfone negada.");
      } else if (ev.error !== "aborted" && ev.error !== "no-speech") {
        toast.error("Não foi possível transcrever o áudio.");
      }
    };
    rec.onend = () => setOuvindo(false);
    recRef.current = rec;
    try {
      rec.start();
      setOuvindo(true);
    } catch {
      setOuvindo(false);
      toast.error("Não foi possível iniciar o microfone.");
    }
  };

  return (
    <Button
      type="button"
      variant={ouvindo ? "default" : "outline"}
      size="icon"
      className={cn("shrink-0", className)}
      title={disponivel ? (ouvindo ? "Parar ditado" : label) : "Ditado indisponível neste navegador"}
      aria-label={disponivel ? (ouvindo ? "Parar ditado" : label) : "Ditado indisponível"}
      aria-pressed={ouvindo}
      disabled={!disponivel}
      onClick={alternar}
    >
      {ouvindo ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </Button>
  );
}
