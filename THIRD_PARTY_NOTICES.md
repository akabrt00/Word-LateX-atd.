# Původ a licence

Scribe od George Kiritsis (2026), MIT: plné původní znění v LICENSE. Zdrojová historie zůstává zachována. Nové vlastní úpravy jsou pod stejnými MIT podmínkami.

## Používané komponenty

CodeMirror 6 a související Lezer balíčky: MIT. PDF.js: Apache-2.0. Tauri/Rust runtime a Tauri pluginy: příslušné MIT/Apache podmínky balíčků. MathLive, KaTeX, marked, xterm.js: příslušné licence v nainstalovaných balíčcích. Fonty Inter a ostatní přibalené open fonty: licence a copyright zachovat z balíčků Fontsource. Před veřejnou distribucí vygenerovat úplný seznam přímých i transitivních Rust/npm licencí a přiložit jejich požadovaná znění/NOTICE.

docs/DEPENDENCY_LICENSES.json obsahuje kontrolovaný inventář přímých npm komponent podle lokálně nainstalovaných package.json, nikoli plný právní audit ani úplný SBOM. package-lock.json a Cargo.lock zajišťují konkrétní verze.

## Pouze auditované, nepřebírané

WordCraft: MIT OR Apache-2.0; nezahrnut kód ani grafika.
Oleafly: projekt deklaruje AGPL-3.0-or-later; nezahrnut kód, skills ani jiné assets.
Tiptap core a Cropper.js: MIT kandidáti pro další etapu, zatím nejsou instalované.
OpenAI Codex: Apache-2.0 harness; zatím se nedistribuuje jako runtime TUL Writeru.
unified-latex: MIT kandidát, zatím není instalovaný.

## Univerzitní materiály

Grafický manuál je referenční zdroj. Oficiální loga a TUL Mono se nedistribuují. Licence zdrojového kódu aplikace nezahrnuje oprávnění k univerzitním ochranným známkám. TUL/tulthesis archiv dosud není součástí distribuce. Veřejné vydání vyžaduje samostatnou kontrolu těchto práv.

## Přibalená znění

licenses/ obsahuje skutečné LICENSE/COPYING/NOTICE soubory nalezené v nainstalovaných npm balíčcích a stažených Rust zdrojích. Instalátory přibalují tento adresář i původní MIT licenci Scribe. docs/LICENSE_COLLECTION.json uvádí rozsah sběru a balíčky bez kořenového licenčního souboru; před veřejným vydáním je stále nutné dokončit úplný audit.
