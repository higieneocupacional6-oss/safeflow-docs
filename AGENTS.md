# Project architecture rules

- Psychosocial report screen, PDF, and Word exports must consume the same numerically sorted group payload so presentation formats cannot diverge.
- Psychosocial report terminology and frequency values must be normalized before persistence and shared by screen, PDF, Word, and AI context so legacy wording cannot reappear.
- AEP/AET generation contexts must be read-only, scoped by exact company and contract IDs, then narrowed by sector/GHE/function, so documents cannot mix tenants or overwrite source records.
- AEP decision extraction must use the shared pure aepAprofundamento helper in client context and AET generation; all supplied identity constraints must match before selection, so technical deepening cannot attach to a different group.
- AEP risk generation must retain every context-supported severity, target per-agent coverage without fabricating factors, and map internal matrix levels to Low/Medium/High only at presentation boundaries.- AI generation edge functions must stream NDJSON (pings + final result/error) via supabase/functions/_shared/aiStream.ts and be consumed with src/lib/aiEdgeStream.ts, because buffered multi-minute responses exceed the function idle timeout.
- Psychosocial report groups must be rebuilt from the current Setores/Funções registry filtered by the evaluation's exact company and contract, merging only editable texts from saved reports, so stale or cross-contract identification never reappears.
- Psychosocial groups must include registered functions without respondents, use existing function IDs before unique legacy-name matching, and leave unassessed groups without risk factors so absent answers never become fabricated results.
- AEP/AET AI output must follow supabase/functions/_shared/redacaoTecnica.ts (prompt rules + post-filter of source/gap phrases) so final documents never expose data origin, missing data, or artificial pending evaluations.
