# Project architecture rules

- Psychosocial report screen, PDF, and Word exports must consume the same numerically sorted group payload so presentation formats cannot diverge.
- Psychosocial report terminology and frequency values must be normalized before persistence and shared by screen, PDF, Word, and AI context so legacy wording cannot reappear.
- AEP/AET generation contexts must be read-only, scoped by exact company and contract IDs, then narrowed by sector/GHE/function, so documents cannot mix tenants or overwrite source records.