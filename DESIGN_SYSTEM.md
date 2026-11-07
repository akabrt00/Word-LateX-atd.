# Design systém TUL Writer

## Ověřený zdroj

[Manuál vizuálního stylu TUL](https://www.fp.tul.cz/images/logo/2022/design-manual-tul.pdf), oddíl 2.1, PDF strana 22: fialová RGB 89/72/173 = #5948AD, bílá #FFFFFF, černá #000000. Oddíly 2.2–2.5 rozlišují TUL Mono, Inter a doplňkový Noto Sans Mono. Manuál není automatickým oprávněním distribuovat univerzitní značku či font. Oddíl 2.2 uvádí poskytování TUL Mono na vyžádání.

## Tokeny a typografie

Implementace: src/themes.ts a src/tul-writer.css. UI: lokálně balený Inter Variable (OFL), fallback Segoe UI. Editor: systémový monospace, volitelně existující JetBrains Mono a další převzaté volby. Typografie dokumentu je zcela v rukou jeho LaTeX třídy a balíčků.

| Token | Světlý režim | Tmavý režim |
|---|---|---|
| editor | #FFFFFF | #191B24 |
| panel | #F6F7FA | #1E202B |
| desktop | #EBEDF2 | #111219 |
| text | #20232E | #F1F2F7 |
| secondary | #454B5C | #CBCEDA |
| accent | #5948AD | #BCADF5 |
| border | #DCDFE8 | #343848 |

Tmavý accent je vlastní přístupná odvozená UI barva, nikoli nová oficiální barva univerzity. Zachovat dostatečný kontrast textu, viditelný focus a neodlišovat chybu pouze barvou. Základní prostorová řada: 4, 8, 12, 16, 24, 32 px; radius 4, 6, 8 px. Hlavní plocha klidná, sytá barva hlavně pro aktivní akci.

## Komponenty

Aktivní priorita je běžná pracovní cesta podle docs/UX_WORKFLOW.md. Podle dalšího upřesnění uživatele důsledně oddělit **Překompilovat** (překlad dokumentu a obnova náhledu) od **Uložit PDF…** (uložení zobrazeného výsledku do počítače). PDF v popisku akce vyhradit exportu; kompilaci nenazývat Vytvořit PDF. Včas říct, co se uloží automaticky, rozlišit probíhající operaci od úspěchu nebo chyby a nabídnout běžnou akci přímo tam, kde ji uživatel potřebuje.

Upřesněný směr uživatele (2026-11-07): jednoduchost znamená snadnou práci v programu. Prioritou je málo nutných kroků, srozumitelné popisky, rozumné předvolby a dobře dostupné běžné akce. Každou úpravu posuzovat podle toho, zda se v programu snadněji píše a pracuje s dokumentem. Vizuální bohatost a animace jsou vítané, pokud respektují identitu TUL Writeru a nebrání práci. Chyba, která brání hlavnímu úkolu, zůstává snadno dostupná; zachovat klávesnicové ovládání.

Úvodní obrazovka: vlevo nový dokument, otevření projektu, přímo dostupný import a poslední práce. Pracovní prostor, diagnostika a zkratky jsou pod Další možnosti; chybějící překladač tuto část otevře automaticky, nepřítomnost volitelného Pythonu nikoli. Vpravo česká animovaná ukázka zdroje a vznikající stránky: Inter, fialový akcent a barvy aktivního motivu. Ukázku lze pozastavit, obnovit a přehrát znovu; při omezeném pohybu se ukáže hotová statická stránka. Nejde o skutečně kompilovaný dokument. V menším okně má přednost přehledná stránka před kódem, při úzkém zobrazení jsou části pod sebou.
Pracovní plocha: soubory/struktura vlevo, zdroj uprostřed, PDF vpravo. AI centrum je nyní zavíratelný pravý overlay; cílově dockovaný panel s vlastní nastavitelnou šířkou.
Editorové režimy nyní popisujeme jako LaTeX + PDF. Nenabízíme nefunkční přepínač Word Mode.
Cílový ribbon: Soubor, Domů, Vložení, Rozložení, Reference, Rovnice, Revize, Zobrazení, AI asistent; kontextové nástroje obrázků a tabulek až s implementovanými operacemi.

## Přístupnost a pohyb

Klávesnicové otevření/zavření AI centra, aria-expanded a pojmenované ovladače. Resizable panely Scribe zachovávají klávesnicové ovládání. Respektovat prefers-reduced-motion. Nové obrazovky česky, převzaté části zatím obsahují angličtinu; úplná lokalizace je samostatná etapa. Přístupnost čtečkou obrazovky a všechny kontrasty zatím nejsou plně auditovány.

## Identita

Vlastní ikona listu a fialové plochy v src-tauri/icons/icon.svg, bez oficiálního loga. TUL Mono se nedistribuuje. Nezávislost projektu je uvedena na úvodní obrazovce i v About. Podmínky použití názvu, ochranných známek, oficiálních log a fontů je nutné před veřejným vydáním potvrdit s držiteli práv; dosavadní audit nenalezl výslovné udělení distribučních práv pro tuto aplikaci.
