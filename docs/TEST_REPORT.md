# Ověření milníku 0.1 – 2026-11-05

## Ochrana otevřených dokumentů před přepsáním – 2026-11-05

Scénář: soubor otevřený v editoru změní nebo odstraní jiný program a uživatel zkusí uložit, zavřít kartu/panel nebo kompilovat. Backend porovná SHA-256 načtených bajtů a odmítne zastaralý zápis. Rozsah: hlavní editor, boční editor a serializace notebooků; legacy integrační write_file volání a filesystem watcher zůstávají další etapou. Optimistická kontrola má omezení závodu s cizími procesy podle ADR-007.

Prostředí: Windows x64, Node.js 24.15.0, npm 11.12.1, Rust/Cargo 1.99.1 MSVC, Visual Studio Build Tools 2022, MiKTeX pdflatex a WebView2. Rust příkazy běžely mimo sandbox s PATH doplněným o uživatelské .cargo/bin a MiKTeX bin.

- `npm test`: 9 prošlo, 0 selhalo. Dva nové testy ověřují řazení překrývajících se uložení, použití navazující revize a zachování původní revize po opakovaném konfliktu.
- `npm run check`: prošlo. `npm run build`: prošlo s dosavadními varováními o velikosti chunků a neúčinných dynamických importech.
- První `cargo test --manifest-path src-tauri/Cargo.toml documents::tests -- --test-threads=1`: oba tehdejší nové testy prošly. Poté doplněn test souběžných editorů a spuštěna regresní sada níže.
- `cargo test --manifest-path src-tauri/Cargo.toml --lib -- --test-threads=1 --skip lists_and_compiles_example --skip synctex_round_trip_on_example --skip export_is_plain_latex_that_compiles_on_its_own`: 27 prošlo, 0 selhalo, 1 upstream ignorovaný, 3 odfiltrováno. Tři vynechané testy patří k volitelnému Python/notebook/example toku, který nebyl součástí tohoto úkolu. Některé převzaté testy se při chybějícím volitelném nástroji vracejí předčasně; počet úspěchů neprokazuje plné pokrytí těchto integrací.
- Nové Rust testy skutečně mění/smažou soubor na disku, ověřují nezměněný externí obsah při konfliktu, kontrolují BOM/CRLF snapshot, pomocné read_file čtení, nové revize, původní historii, zachování existujícího sourozence main.scribe-tmp a přesně jeden úspěšný zápis dvou souběžných editorů téže revize. Původní nativní open/edit/save/compile/PDF a history testy také prošly.
- `npm run tauri build -- --debug --no-bundle`: prošlo. Vytvořeno nové DEBUG EXE; instalátor ani release build se pro tento úkol nevytvářely.
- GUI test na oddělené kopii v `output/verification/conflict-project`: hlavní editor obsahoval LOCAL UNSAVED VERSION, zatímco externí zápis změnil main.tex na EXTERNAL VERSION MUST SURVIVE. Ctrl+S ukázalo český konfliktový dialog. Po volbě Ponechat moje úpravy zůstal lokální text i neuložený stav v editoru a externí obsah na disku byl ověřen příkazem Get-Content.
- Ctrl+W znovu vyvolalo konflikt. Po výslovné volbě Načíst z disku se načetl externí obsah a karta zůstala otevřená. Následná nová editace a Ctrl+S uložily novou revizi bez konfliktu; Ctrl+Enter zobrazilo Compiled with pdflatex, 0 chyb, 0 varování a skutečné Page 1 of 1 PDF s novým textem „Conflict resolved. Normal save and PDF compilation work.“
- GUI test bočního panelu: lokální text LOCAL SIDE UNSAVED VERSION a externí změna notes.txt. Zavření panelu ukázalo konflikt; Ponechat moje úpravy ponechalo panel otevřený i s lokálním textem. Disk stále obsahoval EXTERNAL SIDE VERSION MUST SURVIVE. Po explicitním načtení z disku a dalším zavření se panel zavřel normálně.
- Živá notebooková editace a změna během IPC nebyly zvlášť simulovány v GUI; řazení IPC ověřují frontendové testy, revizní zápis sdílí stejný backend.
- Logy v ignorovaném `output/verification/conflict-frontend-build.log`, `conflict-rust.log`, `conflict-rust-regression.log` a `conflict-native-build.log`. `git diff --check`: bez chyb whitespace. Testovací projekty a buildy nejsou určeny ke commitu.

Záměrně se nedoplňuje vynucené přepsání konfliktního souboru. Uživatel může svůj text zkopírovat a načíst aktuální soubor. Nejde o úplnou obnovu neuložené práce po zavření celého OS okna/pádu ani o procesovou izolaci kompilátoru.

## Zprovoznění na druhém PC – 2026-11-05

Čistý klon origin/main v `C:\Users\akabr\Documents\ChatGPT\TULWright\Word-LateX-atd`. Zdrojový kód aplikace se při zprovoznění neměnil.

- Prostředí: Windows x64, Node.js 24.15.0, npm 11.12.1, MiKTeX-pdfTeX 4.18 (MiKTeX 24.1), WebView2 156.0.4314.58. Python není nainstalovaný.
- `gh repo clone` nebylo dostupné (chybí GitHub CLI). `git clone https://github.com/akabrt00/Word-LateX-atd..git Word-LateX-atd` prošlo mimo sandbox; explicitní cílová složka obchází nepovolenou koncovou tečku názvu ve Windows. První síťový pokus v sandboxu selhal na `getaddrinfo() thread failed to start`.
- Přes winget instalovány `Microsoft.VisualStudio.2022.BuildTools` 17.14.44 s `--override '--wait --quiet --norestart --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended'` a `Rustlang.Rustup` 1.29.3. Ověřeno Rust/Cargo 1.99.1 (MSVC), C++ workload a úspěšná instalace Windows SDK 10.0.26100.
- První `npm ci` v sandboxu nepostupovalo a bylo přerušeno. Opakované `npm ci` mimo sandbox uspělo: 97 balíčků, audit bez známých zranitelností v tomto běhu.
- `npm test`: 7 prošlo, 0 selhalo. `npm run check`: prošlo. `npm run build`: prošlo s dosavadními varováními o velikosti chunků a neúčinných dynamických importech.
- S PATH doplněným o `C:\Users\akabr\.cargo\bin`: `npm run tauri build -- --debug --no-bundle` prošlo, nativní kompilace trvala 3 minuty. EXE: `src-tauri/target/debug/tul-writer.exe`. Instalátor nebyl vytvářen.
- `cargo test --manifest-path src-tauri/Cargo.toml tul_writer_open_edit_save_compile_pdf -- --test-threads=1`: 1 prošel, 27 odfiltrováno. Skutečně ověřeno čtení, změna, uložení, kompilace PDF v cestě s diakritikou a odmítnutí starého PDF po chybě. Celá Rust sada ani volitelné notebookové integrace se při tomto úkolu nespouštěly.
- Desktopové ověření: EXE spuštěno s `--project` nad kopií `examples/first-project` v ignorované složce `output/verification/desktop-project`. Přes GUI změněn text na „TUL Writer works on this computer. Edited and saved in the desktop app.“, uložen Ctrl+S a ověřen na disku. Ctrl+Enter spustilo kompilaci; GUI ukázalo `Compiled with pdflatex`, 0 chyb, 0 varování, Page 1 of 1 a nový text i sekci Results v PDF.js. PDF má 68 198 bajtů.
- Lokální logy: `output/verification/native-build.log` a `output/verification/native-test.log`. Generované soubory zůstávají ignorované Gitem.

Ověřený rozsah je základní desktopový editor a LaTeX/PDF tok na tomto PC. Nejde o nové ověření všech převzatých funkcí, instalátoru, AI nebo Word Mode. Následující oddíly zachovávají výsledky z původního vývojového počítače.

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

## Propojení s GitHubem – 2026-11-05

Rozsah změn: Git remote/tracking, .gitignore, AGENTS.md a související projektová dokumentace. Funkční zdroje aplikace ani workflow nebyly změněny.

- git status --short --branch: před úkolem čistá větev tul-writer/milestone-1 na c4d2b81.
- gh auth status mimo sandbox: účet akabrt00 přihlášený, oprávnění repo a workflow; gh repo view ověřil soukromý repozitář a viewerPermission ADMIN. Token nebyl vypsán v otevřené podobě.
- git ls-remote --symref https://github.com/akabrt00/Word-LateX-atd..git HEAD refs/heads/main: původní main na 5c44e576d5c9fd192740258e64941e4fb1abf059.
- git remote add origin a git fetch --no-tags origin: úspěšné. Upstream Scribe zachován.
- git switch main, git merge --ff-only tul-writer/milestone-1 a git merge --allow-unrelated-histories --no-commit origin/main: zachování obou historií. Jediný konflikt add/add v README.md vyřešen plnou projektovou dokumentací a doplněním hlavního GitHub repozitáře; původní GitHub README zůstává v jeho commitu.
- Kontrola 835 dosažitelných Git blobů, z toho 812 textových, nezjistila shodu s kontrolovanými vzory privátních klíčů a známých GitHub/OpenAI/Anthropic/Google/AWS/Slack přístupových údajů. Jde o kontrolu známých vzorů, nikoli důkaz nepřítomnosti libovolného citlivého údaje.
- git check-ignore --no-index nad 25 příklady: všechny očekávané citlivé/generované cesty ignorovány, zdrojové soubory, oba lockfiles a sanitizované .env příklady povoleny. Kontrola sledovaných cest: žádný node_modules, target, output ani kontrolované soubory s tajemstvími.
- npm test: 7 prošlo, 0 selhalo. První pokus v sandboxu skončil na spawn EPERM před provedením testů; opakování mimo sandbox prošlo.
- npm run check: prošlo. npm run build: prošlo s dosavadními varováními o velikosti chunků a importech. Lokální logy v ignorovaném output/github-sync/.
- Rust testy a desktopový průchod se pro tento úkol neopakovaly: kód aplikace ani její chování se neměnily; jejich poslední výsledky jsou výše.

Kritérium finálního ověření uploadu: úspěšný běžný git push origin main bez force a shoda git rev-parse HEAD s git ls-remote origin refs/heads/main; tracking větev musí být origin/main. Výsledek GitHub Actions se posuzuje odděleně od úspěchu uploadu.
