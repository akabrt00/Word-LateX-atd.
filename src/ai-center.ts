import { showSidebar } from "./sidebar";
import { toggleSettings } from "./settings";
export function initAiCenter() {
  const center = document.getElementById("tul-ai-center")!;
  const toggle = document.getElementById("tul-ai-toggle")!;
  const close = () => { center.hidden = true; toggle.setAttribute("aria-expanded", "false"); };
  toggle.addEventListener("click", () => {
    center.hidden = !center.hidden;
    toggle.setAttribute("aria-expanded", String(!center.hidden));
    if (!center.hidden) document.getElementById("tul-ai-close")!.focus();
  });
  document.getElementById("tul-ai-close")!.addEventListener("click", () => { close(); toggle.focus(); });
  document.getElementById("tul-ai-chat")!.addEventListener("click", () => { close(); showSidebar("assistant"); });
  document.getElementById("tul-ai-settings")!.addEventListener("click", () => {
    close(); toggleSettings(true);
    document.getElementById("ai-provider")?.scrollIntoView({block: "center"});
  });
  center.addEventListener("keydown", event => { if (event.key === "Escape") { close(); toggle.focus(); } });
}
