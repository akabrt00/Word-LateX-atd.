# Changelog TUL Writer

Původní historie Scribe je v docs/upstream/CHANGELOG.md a v Git historii.

## Vývoj – 2026-11-05

- Nastavitelný pracovní prostor pro nové dokumenty, uložený pro celý počítač; nový český dialog názvu a šablony. Každý projekt vzniká ve vlastní složce bez přepsání existujícího obsahu.
- Přibaleny nezměněné TUL předvolby semestrální práce, závěrečné práce, prezentace a posteru z uživatelského portálu včetně původních podkladů a licencí; uložena provenance a SHA-256.
- Nastavení překladače podle šablony, přímý XeLaTeX/LuaLaTeX a zpracování BibTeXu/Biberu. Diagnostika vícenásobného překladu zobrazuje poslední průchod a úplný log zůstává dostupný.

- Otevřené dokumenty používají kontrolu revize obsahu při ukládání; změna nebo odstranění na disku zastaví zápis a nabídne zachování lokálního textu nebo načtení z disku.
- Opraveno zavírání bočního editoru po neúspěšném uložení; panel zůstane otevřený. Souběžná uložení respektují revize a další psaní během zápisu zůstává neuložené.
- Jedinečné dočasné soubory při zápisu nahrazují předvídatelnou cestu .scribe-tmp; přidány regresní testy konfliktů a souběžných editorů.

- Zprovozněno vývojové prostředí na druhém Windows PC; ověřeno nativní sestavení a GUI průchod editace, uložení, kompilace a PDF náhledu. Výsledky zaznamenány v docs/TEST_REPORT.md.

- Propojení projektu s GitHub origin akabrt00/Word-LateX-atd. a větví main při zachování historie Scribe i původního GitHub commitu.
- Rozšířen .gitignore o lokální konfiguraci, přihlašovací údaje, klíče, cache a dočasné soubory.
- V AGENTS.md uloženo trvalé oprávnění automaticky commitovat a pushovat dokončené úkoly a ověřovat vzdálený commit.

## 0.1.0 – 2026-11-05

- Založen vlastní pracovní fork Scribe 1.2.3 se zachovanou MIT licencí.
- Přidán audit tří kandidátů, projektová vize, architektura, design systém, AI návrh a roadmapa.
- Samostatné jméno, desktop identifier, keyring service a vlastní ikona.
- Lokální Inter, světlý a tmavý TUL Writer motiv, česká úvodní obrazovka a zavíratelné AI centrum.
- Vypnut updater Scribe a automatické spouštění notebooků při kompilaci.
- Přímá kompilace MiKTeX pdflatex při nedostupném latexmk/Perlu; dva průchody, shell escape off a latexmkrc off.
- Po neúspěšné kompilaci se staré PDF nevrací jako nový výsledek.
- Kontrola kanonických předků u nových souborových cest.
- Ukázkový vícesouborový LaTeX projekt a nativní integrační test.
- Experiment zdrojových transakcí se 7 testy zachování maker, komentářů, citací, struktur a Unicode.
- Opravena detekce standardního Windows Python launcheru a pořadí importů AI centra.
- Ověřen celý nativní desktopový průchod a vytvořeny testovací EXE/MSI s licencemi.
- Vite aktualizován na 8.3.6 po auditovaných zranitelnostech výchozí verze.

Přesné výsledky a omezení ověření: docs/TEST_REPORT.md. Word Mode ani autonomní agent zatím nejsou implementovány.
