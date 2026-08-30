import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Desativa o crescimento automático de altura conforme o conteúdo. */
  autoGrow?: boolean;
}

/**
 * Textarea padrão do sistema.
 * Cresce automaticamente conforme o conteúdo (nunca corta texto, nunca reduz a
 * fonte), com quebra automática de linha e espaçamento interno confortável.
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, autoGrow = true, onChange, value, defaultValue, ...props }, ref) => {
    const innerRef = React.useRef<HTMLTextAreaElement | null>(null);

    const setRefs = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        innerRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
      },
      [ref],
    );

    const ajustar = React.useCallback(() => {
      const el = innerRef.current;
      if (!el || !autoGrow) return;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight + 2}px`;
    }, [autoGrow]);

    React.useLayoutEffect(() => {
      ajustar();
    }, [ajustar, value, defaultValue]);

    React.useEffect(() => {
      if (!autoGrow) return;
      const onResize = () => ajustar();
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }, [ajustar, autoGrow]);

    return (
      <textarea
        className={cn(
          "flex min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm leading-relaxed",
          "ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          "whitespace-pre-wrap break-words [overflow-wrap:anywhere]",
          autoGrow && "resize-y overflow-hidden",
          className,
        )}
        ref={setRefs}
        value={value}
        defaultValue={defaultValue}
        onChange={(e) => {
          onChange?.(e);
          ajustar();
        }}
        onInput={ajustar}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
