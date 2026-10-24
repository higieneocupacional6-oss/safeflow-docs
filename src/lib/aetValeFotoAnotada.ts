import type { AnaliseFotoVale } from "../../supabase/functions/_shared/aetValeFotos";

export async function hashFotoVale(imagem: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(imagem));
  return Array.from(new Uint8Array(hash), v => v.toString(16).padStart(2, "0")).join("");
}
// A non-generative overlay preserves every source pixel and uses numbered leaders
// with full technical callouts in a separate band, avoiding obscured evidence.
export async function renderizarFotoAnotada(imagem: string, analise: AnaliseFotoVale): Promise<string> {
  const img = new Image(); img.src = imagem; await img.decode();
  const width = Math.max(1600, img.naturalWidth), scale = width / img.naturalWidth;
  const height = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height + Math.max(110, analise.marcacoes.length * 104 + 24);
  const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Não foi possível criar a imagem anotada.");
  const theme = getComputedStyle(document.documentElement);
  const token = (name: string) => `hsl(${theme.getPropertyValue(name).trim()})`;
  const ink = token("--foreground"), paper = token("--background"), accent = token("--destructive");
  ctx.fillStyle = paper; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, width, height);
  ctx.lineWidth = 4; ctx.font = "bold 28px Arial";
  const wrap = (text: string, x: number, y: number) => {
    let line = "";
    for (const word of text.split(/\s+/)) {
      if (ctx.measureText(`${line} ${word}`).width > width - 90) { ctx.fillText(line, x, y); y += 34; line = word; } else line = line ? `${line} ${word}` : word;
    }
    ctx.fillText(line, x, y);
  };
  analise.marcacoes.forEach((m, i) => {
    const x = m.x * width, y = m.y * height;
    const sx = Math.max(28, Math.min(width - 28, m.caixaX * width)), sy = Math.max(28, Math.min(height - 28, m.caixaY * height));
    ctx.strokeStyle = accent; ctx.fillStyle = accent;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(x, y); ctx.stroke();
    const angle = Math.atan2(y - sy, x - sx);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 20 * Math.cos(angle - .4), y - 20 * Math.sin(angle - .4)); ctx.lineTo(x - 20 * Math.cos(angle + .4), y - 20 * Math.sin(angle + .4)); ctx.closePath(); ctx.fill();
    ctx.fillStyle = paper; ctx.fillRect(sx - 22, sy - 22, 44, 44); ctx.strokeRect(sx - 22, sy - 22, 44, 44);
    ctx.fillStyle = ink; ctx.fillText(String(i + 1), sx - 9, sy + 10);
    wrap(`${i + 1}. ${m.problema} — ${m.melhoria}`, 24, height + 44 + i * 104);
  });
  if (!analise.marcacoes.length) { ctx.fillStyle = ink; wrap(analise.observacao || "Nenhuma melhoria visual comprovada nesta foto.", 24, height + 44); }
  return canvas.toDataURL("image/png");
}