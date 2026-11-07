# Stav funkcí

Legenda: převzato = nalezeno ve zdroji, ještě ne potvrzeno kompletním živým testem; testováno = konkrétní evidence v docs/TEST_REPORT.md.

2026-11-07: vývojové historie obou PC bezpečně sloučeny, včetně updateru a semestrálních formulářů. Toto předání neověřuje skutečnou instalaci ani nové vydání aplikace.

| Funkce | Průběžný stav |
|---|---|
| Uložení a aktuálnost | Oddělený ukazatel otevřených neuložených změn a aktuálnosti PDF podle místních úprav; uložení neodstraní zastaralost. Překlad zachytí revizi a zachová upozornění při psaní během tvorby PDF. Neověřená PDF nemají příznak aktuálnosti; změny mimo aplikaci se nesledují. Evidence v docs/TEST_REPORT.md |
| Hlavní cesta k PDF | Vytvořit PDF automaticky uloží hlavní/boční editor; čitelná akce Uložit PDF v náhledu i nabídce Soubor. Český průběh a zachycení přesné zobrazené verze před dialogem, atomický export. Testováno skutečným PDF.js, regresními testy a reálným TeX překladem/exportem; celý UX krok 1 zůstává aktivní |
| Úvod v TUL vzhledu | Nový dokument, otevření, přímo dostupný import a poslední projekty. Česká animovaná ukázka LaTeXu a stránky v barvách TUL Writeru, s pozastavením, pokračováním a statickým režimem při omezeném pohybu. Chybějící LaTeX automaticky odkryje diagnostiku, Python je volitelný |
| Údaje existující prezentace | Načtení ze zdroje a lokální změny fakulty, názvu, autorů, pracoviště, data a kontaktů; revize main.tex, historie, no-op a zachování snímků. Ověřeny backendové konflikty, 24 bezokenních kontrol sdíleného formuláře a skutečné PDF po editaci; vlastní syntaxe se odmítá |
| Průvodci dalšími TUL šablonami | Druhý krok pro BP/DP, prezentaci a poster; vlastní pole a více autorů u prezentace/posteru. Ověřeno 21 bezokenních kontrol formuláře, backendová validace a skutečné PDF všech tří průvodců; nativní desktopový průchod se neopakoval |
| Údaje existující semestrálky | Formulář čte aktuální zdroj, mění sedm známých hodnot a popisek autorů; ochrana revizí zdroje/stylu, samostatná historie. Živě ověřen přechod skupina ↔ jeden autor, PDF i konflikt externího stylu. Vlastní makra nebo nejednoznačné deklarace odmítá |
| Český panel Soubory | Živě ověřeny popisky, nabídky souboru/složky, vytvoření souboru a česká validace cesty; ostatní panely a hlavní nabídka zůstávají částečně anglické |
| Popisky podkladů šablony | Živě ověřeny Vzhled šablony a Vzhled šablony / Písma; nápověda zachovává původní cesty, 166 podkladů nového projektu ověřeno proti ZIP pomocí SHA-256 |
| Tauri 2, Rust, TypeScript | Nativní EXE sestavené a spuštěné na Windows |
| Zprovoznění na druhém Windows PC | Ověřeno sestavení DEBUG EXE a GUI tok editace → uložení → kompilace → PDF; podrobnosti v docs/TEST_REPORT.md |
| Otevření složky, .tex soubory, více souborů | Ověřeno nativním integračním testem a načtením projektu v GUI |
| CodeMirror úpravy, Ctrl+S, undo | Editace a Ctrl+S ověřeny v GUI; undo převzato |
| Atomický zápis a historie | Jedinečné dočasné soubory, zachovaná historie; regresní testy zápisů prošly |
| Konflikt při uložení otevřeného souboru | Revize hlavního/bočního editoru a notebooku; odmítnutí novějšího nebo smazaného souboru, zachování bufferu a dialog pro načtení z disku; watchdog/recovery a starší integrační zápisy zbývají |
| Kompilace a PDF.js | Převzato; doplněna přímá cesta pdflatex, dva průchody a odmítnutí stale PDF |
| Shell escape a projektový latexmkrc | Explicitně vypnuty pro latexmk/pdflatex |
| Python notebook při kompilaci | Automatické spuštění vypnuto; explicitní spuštění zůstává |
| Vlastní identita, Inter, light/dark | Implementováno; ověření UI viz test report |
| AI centrum | Implementovaná struktura a navigace, agent označen jako plán |
| AI chat a editace výběru | Převzato, žádné živé API ověření |
| Source-preserving transakce | Experiment; 7 automatických testů |
| Word Mode, paginace, bezpečný parser | Plánováno, není hotový převod |
| Resize/crop/rotate obrázků | Plánováno; Cropper.js je kandidát |
| Tabulky a rovnice | Převzaté dialogy Scribe; Word-like integrace plán |
| Citace, Zotero, DOI, TikZ | Převzaté implementace; vyžadují dílčí ověření |
| AI agent, paměť, file disclosure policy | Navrženo, neimplementováno |
| Pracovní prostor | Výchozí složka Dokumenty / TUL Writer, změna složky a šablony pro celý počítač, nastavení přetrvává po restartu |
| TUL šablony a zakládání dokumentů | Čtyři nezměněné offline balíčky z portálu TUL × LaTeX; nová vlastní podsložka bez přepisování, volba šablony a nastavení enginu/bibliografie |
| Průvodce semestrální prací | Dva kroky, výběr TUL / sedmi fakult / CXI, název, 1–20 autorů po řádcích, předmět, rok a volitelné nastavení data/verze. Předvyplní pouze novou kopii, ošetří speciální znaky; nativní i PDF ověření prošlo. Další typy mají vlastní druhý krok |
| Překladač podle šablony | Explicitní pdfLaTeX / XeLaTeX / LuaLaTeX, BibTeX / Biber a navazující průchody; původní projekty zachovávají dosavadní automatickou detekci |
| Windows EXE/MSI | Podepsané aktualizační DEBUG i RELEASE NSIS/MSI; automatické privátní vydání 0.2.5. Authenticode, instalace a odinstalace na čistém systému neověřeny |
| Podepsané aktualizace | Vlastní privátní GitHub Release kanál; živě ověřeno stažení automatického 0.2.5, podpis a odmítnutí změněného balíčku/verze. Nabídka po startu i ruční kontrola, revizní uložení před instalací; vyžaduje GitHub CLI přihlášení. Skutečná instalace/restart zbývá; evidence v docs/TEST_REPORT.md |
| Kompletní české UI | Částečně; převzaté obrazovky zůstávají anglické |
| GitHub synchronizace projektu | Origin akabrt00/Word-LateX-atd.; main a automatický commit/push po dokončených úkolech podle AGENTS.md |

Není tvrzeno, že staticky auditované funkce jsou připraveny k veřejnému vydání. Neověřené části mají vlastní akceptační scénáře v roadmapě.
