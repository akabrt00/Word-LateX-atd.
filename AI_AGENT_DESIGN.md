# AI asistent a agent

## Stav 0.1

Scribe poskytuje streamovaný Chat a návrhy úprav výběru přes Rust src-tauri/src/ai.rs a src/ai.ts. ProviderKind podporuje OpenAI, Anthropic, Gemini, Ollama a kompatibilní endpoint. Klíče jdou přes keyring, nyní pod samostatným service ID cz.tulwriter.desktop.ai. Nové AI centrum rozlišuje dostupného převzatého asistenta a plánovaného agenta. Žádný živý AI požadavek nebyl v této etapě otestován. Nejsou vyžadovány ani čteny uživatelské klíče.

## Oddělení poskytovatele a runtime

Provider adapter normalizuje stream, chyby, usage, dostupné modely, cancel a CapabilitySet. AgentRuntime spravuje stav a nástroje nezávisle na konkrétním provideru. Transport, autentizace a schopnosti modelu se nesmějí zaměňovat.

| Integrace | Ověřený povrch | Rozhodnutí |
|---|---|---|
| OpenAI API | API provider převzatý ze Scribe | Chat/Edit; účet a model ověřit živým testem až po nastavení |
| Codex | App Server JSON-RPC přes stdio; SDK pro programové úlohy | Samostatný volitelný lokální proces, lifecycle a approvals přes broker |
| Claude | Agent SDK Python/TypeScript s nástroji a oprávněními | Samostatný adapter, nikoli přímý přístup k produkčnímu projektu |
| Gemini | Function calling a deklarace nástrojů v API | Vlastní omezený tool loop |
| Ollama | Lokální /api/chat a seznam modelů | Žádná automatická cloudová cesta; ověřit schopnosti konkrétního modelu |

Oficiální zdroje: [Codex App Server](https://learn.chatgpt.com/docs/app-server), [Codex SDK](https://learn.chatgpt.com/docs/codex-sdk), [Claude Agent SDK](https://code.claude.com/docs/en/agent-sdk/overview), [Gemini function calling](https://ai.google.dev/gemini-api/docs/function-calling), [Ollama API](https://docs.ollama.com/api/introduction).
App Server nabízí bohatý stav, události a schvalování; preferovat stdio. WebSocket transport je v aktuální dokumentaci experimentální. Neinstalujeme zatím SDK ani nové runtime adaptéry. Dokumentaci Gemini webový nástroj vracel jako nepodporovaný Markdown; detail schema je třeba získat před implementací.
Model selection je uživatelská konfigurace, ne hardcoded slib dostupnosti. Běžné spotřebitelské předplatné není obecnou zárukou API kreditu. Codex/Claude mohou mít vlastní specifické přihlašovací podmínky; nesdílet automaticky jejich tokeny s ostatními adaptéry.

## Stavový automat úlohy

Idle → Planning → AwaitingPlanApproval → Running → AwaitingPatchApproval → Validating → Completed.
Z každého běžícího stavu Cancelled/Failed. Budget, čas, počet kroků, velikost kontextu a počet nástrojů mají pevné uživatelské limity.

Chat jen vysvětluje; Edit nabízí diff pro zvolený rozsah; Agent nejprve plánuje a provádí pouze udělené projektové nástroje.

## Broker oprávnění

Povolené nástroje: list_project, read_text, search_project, read_approved_pdf, propose_patch, propose_bibliography, compile_project, read_diagnostics, inspect_diff. Model nedostává libovolný shell. Každý argument validuje Rust broker nad session-bound project handle a kanonickými cestami. Pouhé promptové instrukce nejsou vynucení bezpečnosti.

Nový projekt: externí odesílání žádných souborů, mutace jen jako návrhy. Uživatel zvolí poskytovatele a vidí manifest konkrétních souborů před odesláním. PDF a projektový text jsou nedůvěryhodná data, nikoli oprávnění ke spuštění nástroje.

Schválené změny aplikovat jako checkpoint + revizně kontrolované transakce do izolované pracovní kopie. Kompilaci spouštět odděleně bez shell escape, bez latexmkrc, s omezenými zápisy, sítí a časem. Publikace, mazání, přepis rozsáhlé části či přístup mimo projekt mají explicitní souhlas. Po validaci nabídnout přenos změn; rollback nesmí přepsat pozdější ruční editace.

## Paměť a věrohodnost

Navržená průhledná struktura .tul-writer/context/: instructions.md, terminology.json, supervisor-notes.md, decisions.md, approved-sources.json a claims.json. Index je odvozený cache, nikoli autorita. Uživatel smí vše prohlížet a exportovat. Kontextové soubory nikdy nesmějí obsahovat API tajemství.

Zdrojová evidence: hash, bibliografické metadata, konkrétní stránky/úryvky, licence a datum získání. Každé odborné tvrzení má vazbu na evidence nebo příznak nedoloženo. DOI metadata ověřovat vůči skutečnému zdroji. Naměřené hodnoty smí pocházet jen ze schválených dat; žádné doplňování chybějících výsledků z odhadu.

Audit log: úloha, provider/model, soubory povolené k odeslání, nástroj, rozhodnutí uživatele, před/po revize a výsledek kompilace. Obsah klíčů se neloguje. Implementace tohoto brokeru, paměti a živého agenta patří do etapy 3.
