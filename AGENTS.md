# Pokyny pro vývoj TUL Writeru

Komunikujte česky. Kód a komentáře mohou být anglicky. Začněte README.md, ARCHITECTURE.md, DECISIONS.md a FEATURES.md. Respektujte původní MIT licenci Scribe. Nepřebírejte AGPL kód Oleafly bez výslovného rozhodnutí o licencování celého odvozeného díla.

## Pracovní postup

1. Zkontrolujte git status; neodstraňujte uživatelské změny.
2. Vymezte malý ověřitelný scénář a jeho rizika.
3. Zachovejte fungující CodeMirror, PDF.js a Tauri infrastrukturu.
4. Zdroj je autorita: nikdy nepřevádějte celý LaTeX přes HTML pro uložení.
5. Nové zásahy mají kontrolovat revizi, původní rozsah a podporovanou syntaxi; neznámé konstrukce ponechte.
6. Spusťte npm test, npm run check, npm run build a relevantní Rust testy. Pro celý milník proveďte desktopový průchod otevřít, změnit, uložit, kompilovat a zobrazit PDF.
7. Zaznamenejte přesné příkazy, prostředí, selhání a neprovedené kontroly do docs/TEST_REPORT.md.
8. Aktualizujte FEATURES.md, ROADMAP.md a CHANGELOG.md. Architektonickou změnu přidejte do DECISIONS.md.
9. Před lokálním commitem ověřte diff a nepřidávejte tajemství, target, node_modules či testovací výstupy.
10. Nepublikujte ani nepushujte bez pokynu uživatele.

## Bezpečnost a pravdivost

AI API klíče nepatří do projektu ani logu; použijte OS credential store. Než připojíte skutečného poskytovatele, domluvte účet a rozsah odesílaných souborů. Neprohlašujte staticky nalezenou funkci za otestovanou. Selhání nebo přeskočení testu se nesmí vydávat za úspěch.

Kompilace nemá automaticky spouštět Python ani projektový latexmkrc. TeX s vypnutým shell escape stále není OS sandbox. Před veřejnou distribucí doplňte omezený worker, časový limit a explicitní trust flow.

## Kandidáti na opakovatelné skills

Navržené, zatím nevytvořené skills: latex-preservation-regression (korpus, náhodné transakce, no-op/undo), windows-desktop-release (toolchain, testy, podpis a čistá VM), document-agent-review (evidence, diff, oprávnění, rollback), tul-template-validation (verze, licence, metadata a kompilace). Do samostatných skills je převeďte až po ověření opakovaného workflow.
