import type { AnaliseFotoVale } from "../../supabase/functions/_shared/aetValeFotos";

export async function hashFotoVale(imagem: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(imagem));
  return Array.from(new Uint8Array(hash), v => v.toString(16).padStart(2, "0")).join("");
}
// Non-generative overlays keep the source scene intact; full-size originals
// remain separate and the lower band retains complete technical callouts.
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
    const bw = Math.round(width * .28), bh = 128;
    const bx = Math.max(8, Math.min(width - bw - 8, m.caixaX * width));
    let by = Math.max(8, Math.min(height - bh - 8, m.caixaY * height));
    if (x >= bx && x <= bx + bw && y >= by && y <= by + bh) by = y > height / 2 ? 8 : Math.max(8, height - bh - 8);
    const sx = bx + bw / 2, sy = by + bh / 2;
    ctx.strokeStyle = accent; ctx.fillStyle = accent;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(x, y); ctx.stroke();
    const angle = Math.atan2(y - sy, x - sx);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 20 * Math.cos(angle - .4), y - 20 * Math.sin(angle - .4)); ctx.lineTo(x - 20 * Math.cos(angle + .4), y - 20 * Math.sin(angle + .4)); ctx.closePath(); ctx.fill();
    ctx.fillStyle = paper; ctx.fillRect(bx, by, bw, bh); ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = ink; ctx.font = "bold 22px Arial";
    let line = "", row = 0;
    for (const word of `${i+1}. ${m.problema} — ${m.melhoria}`.split(/\s+/)) {
      if (ctx.measureText(`${line} ${word}`).width > bw - 24) { ctx.fillText(line,bx+12,by+28+row*24); row++; line=word; if(row>=4)break; }
      else line = line ? `${line} ${word}` : word;
    }
    if(row<4)ctx.fillText(line,bx+12,by+28+row*24);
    ctx.font = "bold 28px Arial";
    wrap(`${i + 1}. ${m.problema} — ${m.melhoria}`, 24, height + 44 + i * 104);
  });
  if (!analise.marcacoes.length) { ctx.fillStyle = ink; wrap(analise.observacao || "Nenhuma melhoria visual comprovada nesta foto.", 24, height + 44); }
  return canvas.toDataURL("image/png");
}