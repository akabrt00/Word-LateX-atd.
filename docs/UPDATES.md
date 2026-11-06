# Aktualizace TUL Writeru

Aktualizuje se nainstalovaná Windows x64 aplikace. LaTeX projekty se nestahují ani nepřepisují z Gitu.

## Pro uživatele na obou PC

1. Starý TUL Writer 0.1 nemá vlastní updater. Jednou ručně nainstalujte nové NSIS EXE nebo MSI z [nejnovějšího soukromého vydání](https://github.com/akabrt00/Word-LateX-atd./releases/latest). Používejte nadále stejný typ instalátoru. Před ručním upgradem zavřete aplikaci a uložte dokumenty.
2. Nainstalujte [GitHub CLI](https://cli.github.com/) a spusťte `gh auth login --hostname github.com` pro účet, který má přístup do repozitáře. Přihlášení proveďte na každém PC. Nevkládejte token do projektu ani do URL. Již přihlášený účet může být použit bez dalšího přihlášení.
3. Nový TUL Writer kontroluje aktualizace přibližně 15 sekund po startu. Ruční volba je **Help → Zkontrolovat aktualizace…**. Otevřenou aplikaci nemusíte ukončovat kvůli samotné kontrole.
4. Nabídka **Aktualizovat a restartovat** stáhne balíček, ověří podpis a verzi, uloží aktuální editory a spustí instalátor. Předem dokončete kompilace, notebookové úlohy a zavřete projektový terminál. Konflikt při ukládání nebo neplatný podpis instalaci zastaví. **Později** nabídku zavře.
5. Výpadek sítě či chybějící přihlášení nebrání běžné offline práci. Ruční kontrola zobrazí chybu; kontrola na pozadí neruší práci chybovým dialogem.

Pokud CLI bylo právě nainstalováno, může být nutné aplikaci znovu spustit kvůli PATH. Aktualizační podpis není Windows Authenticode certifikát; Windows může stále zobrazit výzvu neznámého vydavatele. Skutečný stav instalačních testů je v TEST_REPORT.md.

## Jak se změna stane aktualizací

Dokončený úkol → commit a push na main → Windows signed updates workflow → testy → sestavení → podpisy → privátní Release. Aplikace nabídne vydání až po dokončení této cesty. Samotný push ještě není dostupná aktualizace. GitHub Actions musí mít povolené spuštění workflow a běhový rozpočet.

Workflow `release.yml` běží automaticky na main a lze jej vyvolat ručně přes Actions. Verze se počítá jako major.minor.GITHUB_RUN_NUMBER, např. 0.2.1. Při přechodu na jinou major/minor verzi upravte zdrojovou verzi přes `node scripts/version.mjs X.Y.0`. Run number musí zůstat 1–65535 kvůli MSI. Nezakládejte workflow znovu pod jinou identitou s vynulovaným čítačem v témže major/minor kanálu. Novější push způsobí přeskočení publikace staršího rozpracovaného běhu. Již publikovaný balíček se automaticky nenahrazuje.

Repozitář zůstává soukromý. `scripts/publish-update.mjs` odmítá veřejný repozitář a jinou větev. Připraví draft, nahraje EXE/MSI a .sig, sestaví latest.json s API adresami assetů a až potom vydání zpřístupní jako latest. Podpisy obsahují i verzi; nesmí se používat starší signer bez této podpory. Binární soubory v GitHub Releases jsou distribuční artefakty, nepatří do Git historie.

## Klíče a přihlášení

- Veřejný ověřovací klíč je v tauri.conf.json; smí být v Gitu. `requireSignedVersion: true` musí zůstat zapnuté.
- Šifrovaný soukromý klíč a DPAPI soubor s heslem jsou v ignorované `.tools/update-signing/`. DPAPI heslo lze dešifrovat pouze v odpovídajícím Windows kontextu. Pouhá kopie těchto souborů na jiný PC nezaručí možnost obnovy; zajistěte vlastní bezpečnou zálohu/export hesla mimo projekt a chat. Ztráta klíče může znemožnit aktualizaci již nainstalovaných verzí.
- `py scripts/setup-updater-signing.py` připraví lokální klíč pouze tehdy, pokud ještě není veřejný klíč nastaven. Odmítne tichou výměnu existující identity.
- Po výslovném schválení uživatele byl spuštěn `py scripts/setup-updater-signing.py --upload`. Klíč a heslo jsou šifrovaná repository secrets `TAURI_SIGNING_PRIVATE_KEY` a `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`. Skript odmítá automaticky přepsat existující secrets. Zpětné získání tajemství z GitHubu není dostupná zálohovací cesta.
- Build používá klíč jen v podpisovém kroku, publikace krátkodobý `github.token`. Workflow pro pull requesty nepodepisuje vydání. Udržujte přístup ke změně workflow omezený; taková změna může použít podpisové secrets.
- Uživatelův GitHub token čte Rust backend přes gh. Není vložen do JS, konfigurace projektu ani manifestu aktualizace. Backend akceptuje pouze URL assetů kontrolovaného vydání. Metadata jsou omezena velikostí a požadavky mají timeout.

## Ověření a obnova

`npm test`, `npm run check`, `npm run build` a `cargo test --manifest-path src-tauri/Cargo.toml` kontrolují tok, metadata a dosavadní funkce. Pro živé ověření lze spustit DEBUG EXE s `--check-updates`; `--verify-update-download` navíc stáhne novější vydání a ověří podpis, odmítnutí pozměněného obsahu i jiné verze. Diagnostika nikdy nespouští instalátor. Bez novějšího vydání neprokazuje test stahování ani podpisu.

Pokud sestavení selže, uživatelům zůstane předchozí latest. Pokud selže stahování nebo uložení, nic se neinstaluje. Pokud instalace selže, použijte ruční instalátor ze stejného vydání; automatický rollback aplikace zatím není implementovaný. Skutečný upgrade, restart a odinstalace vyžadují samostatný desktopový test, nejlépe na čisté VM. Bez ověření v TEST_REPORT.md nejsou tvrzeny jako otestované.
