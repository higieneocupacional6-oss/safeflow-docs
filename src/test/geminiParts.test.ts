import { describe, expect, it } from "vitest";
import { idModeloGemini, partesGeminiDeConteudo, urlGeracaoGemini } from "../../supabase/functions/_shared/aiStream";

describe("conteúdo Gemini", () => {
  it("converte texto, imagem e PDF do formato das Edge Functions", () => {
    const r = partesGeminiDeConteudo([
      { type: "input_text", text: "relato" },
      { type: "input_image", image_url: "data:image/jpeg;base64,abc" },
      { type: "input_file", filename: "base.pdf", file_data: "data:application/pdf;base64,xyz" },
    ]);
    expect(r.textParts).toEqual([{ text: "relato" }]);
    expect(r.inlineParts).toEqual([
      { inline_data: { mime_type: "image/jpeg", data: "abc" } },
      { inline_data: { mime_type: "application/pdf", data: "xyz" } },
    ]);
  });

  it("monta a URL sem duplicar o prefixo models/", () => {
    expect(idModeloGemini("gemini-3.8-flash")).toBe("gemini-3.8-flash");
    expect(idModeloGemini("models/gemini-3.8-flash")).toBe("gemini-3.8-flash");
    expect(urlGeracaoGemini("gemini-3.8-flash")).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
    );
    expect(urlGeracaoGemini("models/gemini-3.8-flash")).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
    );
    expect(urlGeracaoGemini("models/gemini-3.8-flash")).not.toContain("/models/models/");
  });
});
