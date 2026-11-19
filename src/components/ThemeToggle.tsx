import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

/** Botão flutuante sol/lua — canto inferior direito. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className="fixed bottom-5 right-5 z-[60] flex items-center gap-1 rounded-full border border-border/80 bg-card/95 p-1.5 shadow-lg backdrop-blur-md"
      role="group"
      aria-label="Alternar tema"
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        aria-pressed={!isDark}
        aria-label="Tema claro"
        title="Tema claro"
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300",
          !isDark
            ? "bg-primary text-primary-foreground shadow-md"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <Sun className="h-[1.125rem] w-[1.125rem]" />
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        aria-pressed={isDark}
        aria-label="Tema escuro"
        title="Tema escuro"
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300",
          isDark
            ? "bg-primary text-primary-foreground shadow-md"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <Moon className="h-[1.125rem] w-[1.125rem]" />
      </button>
    </div>
  );
}
