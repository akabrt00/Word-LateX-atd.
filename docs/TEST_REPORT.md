# Ověření milníku 0.1 – 2026-11-05

## Skupinoví autoři semestrální práce – 2026-11-05

Na upřesnění uživatele rozšířen dosud nepublikovaný průvodce (1197c6f) o uspořádaný seznam 1–20 autorů. Každý neprázdný řádek tvoří jedno jméno, shodná jména se neslučují. Backend validuje každé jméno do 200 znaků a escapuje jej před spojením řízenými TeX zalomeními. V nové kopii stylu se pro skupinu změní jediný očekávaný popisek na Autoři práce; pro jednotlivce se styl nemění. Původní archivy zůstávají nedotčené.

- Stejné Windows/Node/Rust/MiKTeX prostředí jako níže; bez instalace dalších závislostí či TeX balíčků.
- `npm test`: 11 prošlo, 0 selhalo. `npm run check` a `npm run build`: prošly; dosavadní varování o importech/chuncích přetrvávají.
- `cargo test --manifest-path src-tauri/Cargo.toml --lib -- --test-threads=1 --skip lists_and_compiles_example --skip synctex_round_trip_on_example --skip export_is_plain_latex_that_compiles_on_its_own`: 36 prošlo, 0 selhalo, 7 ignorováno, 3 odfiltrováno. Ignorované TeX integrace nejsou v tomto běhu vykazovány jako ověřené; upstream instalace a tři volitelné notebook/example integrace zůstaly vynechány.
- `cargo test --manifest-path src-tauri/Cargo.toml wizard_pdf -- --ignored --test-threads=1`: 2 prošly, 0 selhalo, 13,60 s. Skutečný překlad pro jednoho autora se speciálními znaky a pro šest autorů; skupina bez Overfull vbox.
- `npm run tauri build -- --debug --no-bundle`: prošlo, vytvořeno DEBUG EXE. Bez nového instalátoru.
- GUI: zadáno šest fiktivních českých jmen po řádcích. Zpět a Pokračovat zachovaly celý seznam i předmět. Vytvořen projekt `C:\Users\akabr\Documents\TUL Writer\Ukázka skupinové semestrální práce`; zdroj na disku obsahuje šest jmen v původním pořadí oddělených TeX zalomením. Ctrl+Enter zobrazilo v PDF.js titulní stranu s popiskem Autoři práce a všemi šesti jmény pod sebou. Page 1 of 2, Compiled with pdflatex, 0 chyb a 0 varování. Aplikace zůstala otevřená nad touto ukázkou. Rozvržení extrémních seznamů s 20 dlouhými jmény není vizuálně ověřené.
- Nové testy pokrývají rozdělení CR/LF/CRLF, prázdné řádky, pořadí a duplicity, escapování jednotlivých jmen, jednotné/množné číslo popisku a odmítnutí chybějících, prázdných, víceřádkových či nadměrných položek. `git diff --check`: bez chyb.
- Dílčí pomocné pokusy: launch_app nejprve dostal nesprávný parametr path, opraveno na app; obecný python alias nebyl dostupný, použit konkrétní Python313. Pomocná aktualizace dokumentace skončila na přesné kontrole nenalezené věty v DECISIONS po uložení předchozích souborů; zbývající dokumentace upravena přímo a výsledný diff zkontrolován.

Logy v ignorovaném output/verification: authors-frontend.log, authors-regression.log, authors-pdf.log a authors-native-build.log. Starší výsledky níže popisují předchozí podobu průvodce.

## Průvodce semestrální prací – 2026-11-05

Rozsah: dvoukrokové založení nové semestrální práce s volbou TUL/FS/FT/FP/EF/FUA/FM/FZS/CXI, názvu, autora, předmětu, roku, data a verze zadání. Osobní údaje se zapisují pouze do nové kopie semestralni-prace.tex. Změny stávajících dokumentů a průvodci ostatními typy nejsou součástí úkolu. Před úkolem byla pracovní kopie čistá na commitu 3ed3d49.

- Prostředí: Windows x64, Node.js 24.15.0, npm 11.12.1, Rust/Cargo 1.99.1 MSVC a MiKTeX s balíčky opravenými v předchozím úkolu. Nebyly instalovány nové závislosti ani měněny TeX balíčky.
- `npm test`: 10 prošlo, 0 selhalo. `npm run check`: prošlo. `npm run build`: prošlo s dosavadními varováními o velikosti chunků a statických/dynamických importech.
- `cargo test --manifest-path src-tauri/Cargo.toml semester -- --test-threads=1`: první cílený běh ověřil 3 nové testy rendereru, bez selhání; PDF testy byly v tomto běhu ignorované.
- `cargo test --manifest-path src-tauri/Cargo.toml --lib -- --test-threads=1 --skip lists_and_compiles_example --skip synctex_round_trip_on_example --skip export_is_plain_latex_that_compiles_on_its_own`: 34 prošlo, 0 selhalo, 6 ignorováno, 3 odfiltrováno. Ignorované zahrnují pět explicitních TeX/šablonových integrací a upstream instalaci Tectonicu; odfiltrované jsou tři volitelné notebook/example integrace. Podmíněné návraty některých převzatých testů nadále nejsou důkazem úplného pokrytí volitelných nástrojů.
- `cargo test --manifest-path src-tauri/Cargo.toml semester_wizard_pdf -- --ignored --test-threads=1`: 1 prošel, 0 selhalo, 5,72 s. Skutečně založil projekt s údaji pro FM a názvem obsahujícím &, %, _, #, $, ~, ^, zpětné lomítko a závorky; pdfLaTeX/BibTeX vytvořily PDF s ověřenou hlavičkou.
- Nové testy ověřují všechny součásti, přestupný rok a neplatná data, prázdné či víceřádkové údaje, TeX escaping, zachování těla dokumentu, komentářů, BOM/CRLF, odmítnutí změněné struktury a ochranu před tím, aby uživatelský text ovlivnil další nahrazované deklarace. Test zakládání ověřuje, že neplatná metadata nevytvoří ani rodičovskou složku, že metadata pro jinou šablonu jsou odmítnuta a že existující projekt s uživatelskými úpravami nelze přepsat.
- `npm run tauri build -- --debug --no-bundle`: prošlo; vytvořeno nové DEBUG EXE. Při souběhu Cargo kontrol se čekalo na standardní build lock, nešlo o selhání. Instalátor se nevytvářel.
- GUI: první krok zobrazil název složky, šablonu a Pokračovat. Druhý krok nabídl fakultu, předvyplněný název podle složky, autora, předmět a rok; rozbalení Datum a verze zadání ukázalo 2026-11-05 a verzi 1. Vytvořit dokument bez autora neprovedlo založení; Test-Path cílového projektu vrátil False.
- GUI: vyplněn název „Měření & modelování 50 %“, autor „Zkušební autor“, předmět „Modelování & simulace“ a vybrána FM. Zpět a opětovné Pokračovat zachovaly všechna pole včetně ručně upraveného názvu a fakulty. Systémové rozbalovací menu WebView2 bylo kvůli omezení ovládacího nástroje vybráno klávesnicí; výsledná hodnota byla ověřena před pokračováním.
- GUI: vytvořen projekt `C:\Users\akabr\Documents\TUL Writer\Ukázka průvodce semestrální prací`. Get-Content ověřil správné deklarace FM, názvu a předmětu s escaped ampersandem/procentem, autora, roku, českého data a verze. Aplikace automaticky otevřela hlavní soubor.
- Ctrl+Enter vytvořilo skutečné dvoustránkové PDF; GUI ukázalo Compiled with pdflatex, 0 chyb a 0 varování. Vizuálně i textovou vrstvou ověřeno fakultní logo a oranžový akcent FM, název se skutečnými znaky & a %, autora, předmět, datum a verzi. Aplikace zůstala otevřená nad touto ukázkou.
- `git diff --check`: bez chyb whitespace. Logy: ignorované output/verification/semester-frontend.log, semester-rust.log, semester-regression.log, semester-pdf.log a semester-native-build.log. Původní ZIP archivy se při tomto úkolu neměnily.

Ověřený rozsah je semestrální šablona 1.3 a nové pracovní kopie. Nejde o obecný parser LaTeX metadat ani o automatickou úpravu existujících prací. Ostatní čtyři předvolby používají dosavadní zakládání bez tohoto formuláře; čtyři starší plné PDF testy šablon se neopakovaly, jejich zdroje a překladače se neměnily.

## Pracovní prostor a TUL předvolby – 2026-11-05

Scénář: nastavit jednu složku pro všechny nové dokumenty, zvolit výchozí šablonu, založit novou samostatnou pracovní kopii a přeložit ji. Existující adresář ani projekt se nesmí přepsat. Přidány čtyři nezměněné univerzitní balíčky z uživatelova portálu a prázdný dokument; fakultní průvodce není součástí tohoto kroku.

### Zdroje a prostředí

- Katalog a čtyři detailní stránky na `https://latex-tul.adamkabrt.chatgpt.site/templates` byly načteny přes Invoke-WebRequest. Webový čtecí nástroj URL nezpřístupnil, HTTP požadavky z hosta vrátily 200. ZIP soubory `/downloads/faculties/{semester,thesis,presentation,poster}-tul.zip` jsou beze změn v resources/templates; SHA-256 všech čtyř souhlasí s provenance.json. Původní podklady, skripty a licence byly zachovány, žádný projektový skript nebyl spuštěn.
- Windows x64, Node.js 24.15.0, npm 11.12.1, Rust/Cargo 1.99.1 MSVC, MiKTeX 24.1 s postupně aktualizovanými balíčky, WebView2. Příkazy Cargo/TeX běžely mimo sandbox s PATH doplněným o .cargo/bin a MiKTeX bin.
- První Rust sestavení odhalilo dva typové problémy: ZIP 9 vrací název jako Result a argument Biberu měl nesourodé reference String/Cow. Opraveno před dalšími kontrolami.

### Automatické kontroly

- `npm test`: 10 prošlo, 0 selhalo. Nový test diagnostiky ověřuje odstranění již vyřešených varování z dřívějších TeX průchodů i zachování skutečných problémů posledního průchodu.
- `npm run check`: prošlo. `npm run build` i finální `npm run tauri build -- --debug --no-bundle`: prošly s dosavadními varováními o velikosti chunků a kombinaci statických/dynamických importů. Vytvořeno DEBUG EXE, nikoli nový instalátor nebo veřejný release.
- `cargo test --manifest-path src-tauri/Cargo.toml --lib -- --test-threads=1 --skip lists_and_compiles_example --skip synctex_round_trip_on_example --skip export_is_plain_latex_that_compiles_on_its_own`: 30 prošlo, 0 selhalo, 5 ignorováno, 3 odfiltrováno. Čtyři ignorované jsou nové explicitní TeX integrační testy, pátý je upstream instalace Tectonicu. Tři odfiltrované volitelné notebook/example integrace nejsou tímto úkolem ověřeny; interní předčasné návraty některých převzatých testů nejsou důkazem pokrytí jejich volitelných nástrojů.
- Tři nové běžné Rust testy ověřují odmítnutí neplatných názvů a cest, nepřepsání existující práce, úplnost všech rozbalených předvoleb, nezávislost dvou kopií a odmítnutí libovolného programu či cesty mimo projekt v konfiguraci překladače.
- Přímé integrační testy se spouštějí přes `cargo test --manifest-path src-tauri/Cargo.toml workspace::tests::template_pdf -- --ignored --test-threads=1`. Každý zakládá skutečný nový projekt, používá jeho engine/bibliografii a kontroluje PDF hlavičku. Finální společný běh: 4 prošly, 0 selhalo, 43,43 s; zaznamenán v workspace-four-templates-final.log.
- `git diff --check`: bez chyb whitespace. Archivy jsou vstupní zdroje, testovací projekty a logy zůstávají v ignorovaném output/verification.

### Oprava místního TeX prostředí během ověření

Počáteční běh: semestrální práce a poster prošly, prezentace a závěrečná práce selhaly na starém XeLaTeX formátu (LaTeX 2023) s novější Polyglossií. Samotné `miktex formats build --engine=xetex` problém nevyřešilo. `miktex packages update --package-id-file=...` nejprve odmítlo neexistující název latex-base; správné ID je ltxbase. Poté byly aktualizovány ltxbase, l3kernel a l3packages, zatímco starý samostatný l3backend z roku 2024 stále překrýval novou kopii v l3kernel. Po ověření obou fyzických cest byl starý samostatný balíček odstraněn, l3kernel znovu nainstalován (`miktex packages install l3kernel`) a obnovena databáze (`miktex fndb refresh`). `miktex packages verify l3kernel` následně potvrdilo integritu.

`miktex formats build` obnovilo potřebné formáty, ale celý příkaz skončil chybou Windows API 2 u volitelných hilatex/hilatex-dev kvůli chybějícímu HiTeXu. To není vykazováno jako úspěšná obnova všech formátů. pdfLaTeX, XeLaTeX a LuaLaTeX byly ověřeny skutečnými překlady. Dílčí aktualizační příkazy také odmítly ID biber (správně biber-windows-x64) a nenainstalovaný caption; tyto pokusy se nevykazují jako úspěšné aktualizace.

Kvůli dalším nesouladům starých balíčků s novým jádrem byly následně úspěšně aktualizovány biblatex, fontspec, babel, hyperref, pgf, graphics, latex-tools, amsmath, fancyhdr, biber-windows-x64 a etoolbox. Počet opakování PDF testů souvisel s konkrétními chybami této smíšené instalace, nikoli se změnami zdrojů šablon. Konečná závěrečná práce úspěšně prošla XeLaTeXem a Biberem; původní ZIP nebyl upravován.

### Desktopové ověření

- Na úvodní obrazovce se zobrazila výchozí systémová složka `C:\Users\akabr\Documents\TUL Writer`. Nový český formulář obsahuje název, změnu složky, pět předvoleb, vysvětlení šablony a cílovou cestu. Při prvním vizuálním ověření bylo opraveno centrování dialogu a výška input/select polí; konečná podoba byla vizuálně zkontrolovaná.
- Přes formulář skutečně vytvořen dokument `Ukázková semestrální práce` v této složce a automaticky otevřen semestralni-prace.tex. Na disku ověřen zdroj i .tulwriter/project.json s pdflatex/bibtex. Knihovna podkladů a původní readme zůstaly přítomné.
- Nastavení bylo otevřeno také z ozubeného kolečka v editoru. Systémovým výběrem složky změněn pracovní prostor na ignorovaný testovací adresář output/verification/workspace-documents a výchozí šablona na prázdný dokument. Po úplném restartu se zobrazila uložená cesta a formulář nabídl prázdnou šablonu. Po ověření vráceno pouze toto testované nastavení na Dokumenty / TUL Writer a tul-semester; ostatní uživatelská nastavení se neměnila.
- GUI kompilace ukázkové práce zobrazila skutečné dvoustránkové PDF v PDF.js. První verze diagnostiky ukazovala i přechodná varování o citacích z prvního průchodu; opraveno výběrem posledního průchodu při zachování celého surového logu. Finální nové EXE nad ukázkovou prací zobrazilo Compiled with pdflatex, 0 chyb, 0 varování a Page 1 of 2. PDF má 203 712 bajtů. Aplikace zůstala otevřená nad ukázkou; výchozí nastavení na disku bylo ověřeno jako Dokumenty / TUL Writer a tul-semester.
- Fakultní výběr, vyplnění osobních metadat, automatické aktualizace šablon, instalátor na čistém PC, Word Mode a AI nebyly tímto úkolem implementovány ani ověřeny.

Logy: workspace-frontend.log, workspace-rust.log, workspace-regression-final.log, workspace-four-templates-final.log, workspace-final-native.log; jednotlivé neúspěšné pokusy a aktualizace mají v output/verification samostatné workspace-* logy. Starší oddíly níže zachovávají výsledky předchozích úkolů a prostředí.

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
