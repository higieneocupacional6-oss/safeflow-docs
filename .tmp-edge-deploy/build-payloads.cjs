const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "supabase", "functions");
const outDir = __dirname;

const FUNCS = {
  "formulario-aep-generate": ["index.ts", "../_shared/aiStream.ts"],
  "apr-ergo-generate": [
    "index.ts",
    "../_shared/aiStream.ts",
    "../_shared/aprErgoIa.ts",
    "../_shared/aprErgoPlanilha.ts",
  ],
  "aep-generate": ["index.ts", "../_shared/aiStream.ts", "../_shared/redacaoTecnica.ts"],
  "aet-generate": [
    "index.ts",
    "../_shared/aiStream.ts",
    "../_shared/aepAprofundamento.ts",
    "../_shared/redacaoTecnica.ts",
  ],
  "aet-vale-generate": [
    "index.ts",
    "../_shared/aiStream.ts",
    "../_shared/aetValeIa.ts",
    "../_shared/aetValeFotos.ts",
  ],
  "aet-vale-plano-generate": [
    "index.ts",
    "../_shared/aiStream.ts",
    "../_shared/aetValeIa.ts",
    "../_shared/aetValeFotos.ts",
    "../_shared/aetValeCronograma.ts",
  ],
  "aet-vale-foto-analyze": [
    "index.ts",
    "../_shared/aiStream.ts",
    "../_shared/aetValeFotos.ts",
  ],
  "psico-generate": ["index.ts", "../_shared/aiStream.ts"],
};

function readRel(funcName, rel) {
  const abs = path.normalize(path.join(root, funcName, rel));
  if (!fs.existsSync(abs)) throw new Error("missing " + abs);
  return fs.readFileSync(abs, "utf8");
}

const summary = [];
for (const [name, rels] of Object.entries(FUNCS)) {
  const files = rels.map((rel) => ({
    name: rel === "index.ts" ? "index.ts" : rel,
    content: readRel(name, rel),
  }));
  const payload = {
    project_id: "fibqwwdnxymgmlwfmsgm",
    name,
    entrypoint_path: "index.ts",
    verify_jwt: true,
    files,
  };
  const dest = path.join(outDir, name + ".json");
  fs.writeFileSync(dest, JSON.stringify(payload));
  summary.push({
    name,
    dest,
    bytes: fs.statSync(dest).size,
    files: files.map((f) => ({ name: f.name, chars: f.content.length })),
  });
}
console.log(JSON.stringify(summary, null, 2));
