# Changelog TUL Writer

Původní historie Scribe je v docs/upstream/CHANGELOG.md a v Git historii.

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
