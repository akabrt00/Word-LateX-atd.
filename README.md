# TUL Writer

Nezávislý studentský desktopový textový procesor pro Windows. Pracovní fork Scribe IDE (MIT), nikoli oficiální software TUL. Milník 0.1: skutečný LaTeX editor a lokální PDF kompilace. Word Mode a autonomní agent jsou následující etapy.

## Spuštění ve Windows

Vyžaduje Node.js 24+, Rust stable MSVC, Microsoft C++ Build Tools (Desktop development with C++), Windows SDK a WebView2. Pro dokumenty nainstalujte MiKTeX nebo TeX Live. Tectonic je alternativní cesta s vlastním stahováním balíčků. MiKTeX latexmk vyžaduje Perl; bez něj aplikace použije pdflatex.

    npm ci
    npm run tauri dev

Otevřete složku examples/first-project. Upravte main.tex, uložte Ctrl+S a zkompilujte Ctrl+Enter. Výsledek se zobrazí v pravém PDF panelu a uloží do build/main.pdf. Soubor sections/results.tex ověřuje vícesouborový projekt. V nabídce lze nastavit hlavní soubor. Projekt lze předat také argumentem --project ABSOLUTNI_CESTA výslednému EXE.

Pokud otevřený soubor mezitím změní nebo odstraní jiný program, uložení se zastaví. Volba „Ponechat moje úpravy“ zachová váš text v editoru; před načtením jiné verze jej můžete zkopírovat. „Načíst z disku“ výslovně nahradí neuložený obsah aktuálním souborem. Totéž platí pro boční editor a notebooky. Automatické sledování změn na pozadí a obnova po pádu zatím nejsou implementované.

    npm test
    npm run check
    npm run build
    cargo test --manifest-path src-tauri/Cargo.toml

Pro úplnou Rust sadu včetně notebooků použijte Python s requirements-test.txt. Ve Windows lze vytvořit .tools/test-python přes py -m venv, nainstalovat pip install -r requirements-test.txt a přidat jeho Scripts do PATH pro testovací příkaz. Aplikace umí najít také standardní Windows launcher py.

Přímý pdflatex běží dvakrát pro odkazy; automatická bibliografie a alternativní enginy vyžadují další konfiguraci/latexmk. Nejde o sandbox pro cizí nedůvěryhodné projekty. Notebooky se při kompilaci automaticky nespouštějí.

## Instalátor

    npm run tauri build

Tauri může vytvořit NSIS EXE a WiX MSI v src-tauri/target/release/bundle. Podpisy a vlastní aktualizační kanál zatím nejsou nastaveny. Stav skutečného sestavení a ověření je v docs/TEST_REPORT.md. Nezaměňovat zdrojovou konfiguraci instalátoru za ověřenou instalaci.

## Dokumentace

- PROJECT_VISION.md: cíle a hranice.
- docs/TECHNICAL_AUDIT.md: zdroje, licence, srovnání a zjištění.
- ARCHITECTURE.md: současná a cílová architektura.
- DESIGN_SYSTEM.md: ověřené barvy, typografie a komponenty.
- AI_AGENT_DESIGN.md: poskytovatelé, oprávnění a projektová paměť.
- FEATURES.md: implementováno vs. plán.
- ROADMAP.md: etapy a konkrétní příští kroky.
- DECISIONS.md: architektonická rozhodnutí.
- CHANGELOG.md: vlastní změny; docs/upstream obsahuje původní dokumentaci Scribe.
- AGENTS.md: opakovatelný vývojový postup.

## Původ a licence

Základ: Scribe-IDE/Scribe, commit 08168f3208c32609ae5404016e9306c185f69f37 (1.2.3).
Původní MIT licence a copyright George Kiritsis zůstávají v LICENSE. Nový kód je poskytován za stejných podmínek MIT. Nebyl převzat kód Oleafly ani WordCraft. Přehled dalších licencí a hranic distribuce je v THIRD_PARTY_NOTICES.md. Hlavní vzdálené úložiště je soukromý GitHub repozitář [akabrt00/Word-LateX-atd.](https://github.com/akabrt00/Word-LateX-atd.) pod remote origin; větev main sleduje origin/main. Git remote upstream slouží ke sledování původního Scribe. Po dokončených úkolech se změny automaticky commitují a nahrávají podle AGENTS.md. Počáteční GitHub commit s původním označením Word-LateX-atd. zůstává součástí historie.

AI je ve výchozím stavu vypnutá. Tento milník nevyžaduje API klíč a žádný nový provider adapter neodesílá požadavky. Převzaté integrační cesty nejsou potvrzením přístupu k modelům ani náhradou API účtu.
