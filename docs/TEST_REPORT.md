# Ověření milníku 0.1 – 2026-11-05

## Výsledek

Všech šest akceptačních bodů prvního milníku bylo ověřeno na Windows: spuštění nativního EXE, otevření LaTeX projektu, editace, uložení, lokální kompilace a zobrazení skutečného PDF uvnitř aplikace. Nejde pouze o webový náhled ani mock backendu.

## Prostředí

Windows x64, Node.js 24.15.0, npm 11.12.1, Rust/Cargo 1.99.1 (MSVC), Microsoft Build Tools 2022 17.14 / MSVC 14.44, Windows SDK 10.0.26100.0, MiKTeX 25.12. Rust a C++ workload byly v průběhu práce instalovány. Python 3.13; pro převzaté notebookové testy oddělené .tools/test-python s requirements-test.txt. Bez Perlu a bez instalovaného Tectonicu.

## Automatické kontroly

| Příkaz / kontrola | Skutečný výsledek |
|---|---|
| Původní Scribe npm ci + npm run build | Prošlo před vlastními úpravami |
| npm test | 7 prošlo, 0 selhalo |
| npm run check | Prošlo |
| npm run build | Prošlo, Vite 8.3.6 |
| cargo test --manifest-path src-tauri/Cargo.toml -- --test-threads=1 | 27 prošlo, 0 selhalo, 1 ignorovaný |
| npm audit --json | 0 známých zranitelností v tomto běhu |
| EXE --check-tools | tex=pdflatex; Python313/python.exe nalezen přes py launcher |
| npm run tauri build -- --debug --bundles nsis,msi | Vytvořeno EXE i MSI |
| npm run tauri bundle -- --debug --bundles nsis,msi | Finální balíčky v odděleném stagingu včetně licencí |
| git diff --check pro vlastní zdroje | Bez chyb whitespace |

Rust sada byla spuštěna s PATH rozšířeným o .tools/test-python/Scripts a .cargo/bin. Ignorovaný test installs_tectonic je ignorován už upstreamem. Některé převzaté testy mají podmíněný návrat bez kontroly při chybějícím nástroji: zejména latexdiff/latexmk cesta se zde neověřila kvůli chybějícímu Perlu. Číslo 27 proto není tvrzením o úplném pokrytí všech volitelných integrací. Nezávislé GUI ověření SyncTeXu, Zotera, bibliografických enginů a AI nebylo provedeno.

Nový nativní integrační test tul_writer_open_edit_save_compile_pdf opravdu čte, mění, zapisuje a kompiluje dokument v cestě s českými znaky. Kontroluje PDF hlavičku i odmítnutí starého PDF jako výsledku následující neúspěšné kompilace.

Sedm TypeScript testů kontroluje no-op zachování bajtů, makra/prostředí/citace/komentáře/TikZ/verbatim kolem změny, zastaralou revizi, chybný rozsah, překryvy, Unicode, více patchů, inverse patch, odmítnutí nepodporovaného textu a CRLF/BOM. Neprokazují obecný parser TeXu.

## Skutečný desktopový průchod

1. Spuštěn src-tauri/target/debug/tul-writer.exe se zabaleným frontendem na http://tauri.localhost, bez Vite serveru.
2. Argument --project načetl oddělenou testovací kopii vícesouborového projektu v output/verification/desktop-project. Strom ukázal main.tex a sections/results.tex.
3. V CodeMirror editoru byl pomocí klávesnice a vložení textu změněn obsah na větu „Desktop UI verification passed. This text was edited and saved in TUL Writer.“
4. Ctrl+S uložil změnu. Následná kontrola fyzického main.tex potvrdila tuto větu.
5. Tlačítko Kompilovat spustilo skutečný backend a MiKTeX; stavový řádek ukázal Compiled with pdflatex, 0 chyb a 0 varování.
6. PDF.js zobrazil Page 1 of 1 a přesně novou větu i výsledky z připojeného souboru. Ověřena textová vrstva i vizuální screenshot okna.
7. Otevřeno AI centrum. Zobrazuje Chat/Editace a agentní funkce výslovně jako plán. Screenshot ověřil rozložení panelu, nikoli živé AI spojení.

Dočasné souběžné používání počítače přerušilo první pokus; test byl dokončen až poté, co uživatel potvrdil, že je počítač volný. Nebyly upravovány jeho jiné dokumenty.

Samostatně kompilovaný příklad examples/first-project vytvořil skutečné A4 PDF o jedné stránce (69 207 B); PNG výstup byl vizuálně zkontrolován. Oficiální manuál TUL byl stažen a jeho stránky barev a typografie byly vyrenderovány a vizuálně prohlédnuty. Světlý motiv nebyl samostatně ručně ověřen v okně; definice a produkční sestavení jsou ověřeny, úplná kontrola kontrastů a přístupnosti zbývá.

## Nalezené a opravené problémy

- Chybějící Rust, linker a Windows SDK: doplněn toolchain.
- MiKTeX latexmk bez Perlu: přímý pdflatex fallback se dvěma průchody.
- Windows Python dostupný jen přes py: doplněna detekce skutečného interpretu.
- Chybějící NumPy/Matplotlib: izolované testovací prostředí, nikoli instalace do uživatelského Pythonu.
- Počáteční TypeScript deklarace assetů: samostatný vite-env.d.ts.
- Zranitelný vývojový Vite: aktualizován na 8.3.6, následný audit bez nálezů.
- Nový import AI centra měnil pořadí cyklických závislostí a zastavil inicializaci UI. Import přesunut za existující závislosti; následný nativní průchod prošel.
- Převzatý updater Scribe, automatický notebook execution a latexmkrc byly vypnuty.
- Do finálních balíčků přidána původní licence Scribe a dostupná znění licencí závislostí. Přítomnost MIT a notices ověřena také v generovaném WiX manifestu.

## Artefakty a hranice ověření

Finální testovací balíčky: output/TUL-Writer-0.1.0-debug/.
Jsou to nepodepsané DEBUG buildy, nikoli veřejné produkční vydání. SHA256SUMS.json zaznamenává jejich kontrolní součty.

EXE i MSI byly sestaveny ve Windows, ale nebyly instalovány/odinstalovány a nebyly ověřeny na čisté VM. Aplikace vyžaduje dostupný WebView2 a pro kompilaci TeX. Automatická aktualizace je vypnutá.

Živé AI API, autonomní agent, file disclosure policy, Word Mode, obecná round-trip věrnost, izolovaný compiler worker, timeout/cancel, kompletní crash recovery, konflikty s externím editorem a oficiální TUL šablony zůstávají neimplementované nebo neověřené podle FEATURES.md. Současná verze není sandbox pro nedůvěryhodné TeX projekty.

Build hlásí velké JS chunky a neúčinné dynamické importy z převzaté modulové struktury. Nejsou to chyby sestavení; optimalizace patří do další etapy. CI workflow bylo upraveno, ale nebylo spuštěno na GitHubu. Veřejný repozitář ani release nebyly publikovány.
