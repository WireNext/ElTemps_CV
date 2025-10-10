// --- Modo oscuro automático + manual ---
const toggleBtn = document.getElementById("theme-toggle");
const userPref = localStorage.getItem("theme");
const systemPrefDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

if (userPref === "dark" || (!userPref && systemPrefDark)) {
  document.documentElement.setAttribute("data-theme", "dark");
}

// Evento al pulsar el botón
if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  });
}

console.log("🌤️ Web Meteorologia CV carregada correctament.");
