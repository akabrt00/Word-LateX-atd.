export const faculties = [
  ["TUL", "TUL · Celá univerzita"], ["FS", "FS · Fakulta strojní"], ["FT", "FT · Fakulta textilní"],
  ["FP", "FP · Fakulta přírodovědně-humanitní a pedagogická"], ["EF", "EF · Ekonomická fakulta"],
  ["FUA", "FUA · Fakulta umění a architektury"], ["FM", "FM · Fakulta mechatroniky, informatiky a mezioborových studií"],
  ["FZS", "FZS · Fakulta zdravotnických studií"], ["CXI", "CXI · Ústav pro nanomateriály, pokročilé technologie a inovace"],
];

export const semesterFields = `        <legend class="sr-only">Údaje semestrální práce</legend>
        <label>Fakulta nebo součást TUL<select id="semester-faculty" required></select></label>
        <label>Název práce<input id="semester-title" type="text" maxlength="300" required placeholder="Název na titulní straně" /></label>
        <label>Autoři práce<textarea id="semester-authors" rows="3" maxlength="4000" required placeholder="Jméno a příjmení&#10;Další jméno a příjmení" aria-describedby="semester-authors-hint"></textarea></label>
        <p id="semester-authors-hint" class="semester-authors-hint">Každého autora napište na samostatný řádek. Může být i jediný; nejvýše 20 autorů.</p>
        <div class="semester-grid">
          <label>Předmět<input id="semester-subject" type="text" maxlength="200" required placeholder="Název předmětu" /></label>
          <label>Rok<input id="semester-year" type="number" min="1900" max="9999" step="1" required /></label>
        </div>
        <details class="semester-extra"><summary>Datum a verze zadání</summary><div class="semester-grid">
          <label>Datum na titulní straně<input id="semester-date" type="date" min="1900-01-01" max="9999-12-31" required /></label>
          <label>Verze zadání<input id="semester-version" type="text" maxlength="40" value="1" required /></label>
        </div></details>
        <p class="workspace-detail">Údaje se zapisují do zdroje LaTeXu. Ukázkový text práce a literaturu nahraďte vlastními.</p>
`;
