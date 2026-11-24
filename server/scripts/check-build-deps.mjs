/**
 * Garante que o TypeScript está disponível antes do `tsc`.
 * Em ambientes sem build tools, o argon2 também pode falhar no npm install.
 */
try {
  await import("typescript");
  console.log("prebuild: TypeScript OK");
} catch {
  console.error(
    "prebuild: TypeScript não encontrado. Rode `npm install` em server/ " +
      "(em Linux pode precisar de build-essential para o argon2).",
  );
  process.exit(1);
}
