import { useEffect } from "react";
import { toast } from "sonner";
import { useRegisterSW } from "virtual:pwa-register/react";

/**
 * Registra o service worker e avisa quando há atualização.
 * Usa prompt (não auto-reload) para não interromper formulários longos.
 */
export function PwaUpdateToast() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.warn("[PWA] Falha ao registrar service worker:", error);
    },
  });

  useEffect(() => {
    if (!offlineReady) return;
    toast.message("SegDoc pronto para uso offline", {
      description: "O aplicativo foi instalado no cache deste dispositivo.",
      duration: 4000,
    });
    setOfflineReady(false);
  }, [offlineReady, setOfflineReady]);

  useEffect(() => {
    if (!needRefresh) return;
    toast("Nova versão do SegDoc disponível", {
      description: "Atualize quando puder salvar o trabalho em andamento.",
      duration: Infinity,
      action: {
        label: "Atualizar",
        onClick: () => {
          void updateServiceWorker(true);
        },
      },
      cancel: {
        label: "Depois",
        onClick: () => setNeedRefresh(false),
      },
      onDismiss: () => setNeedRefresh(false),
    });
  }, [needRefresh, setNeedRefresh, updateServiceWorker]);

  return null;
}
