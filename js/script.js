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

// --- Lógica de Predicción Local ---

document.addEventListener("DOMContentLoaded", () => {
  // Solo se ejecuta en index.html si existe el contenedor
  const homeContainer = document.getElementById("tiempo-home-container");
  const pobleGuardat = localStorage.getItem("ultimPobleBuscat");

  if (homeContainer && pobleGuardat) {
    homeContainer.style.display = "block";
    buscarTiempo(pobleGuardat, "resultado-tiempo-home");
  }
});

// Función genérica para obtener iconos
function obtenerIcono(code) {
  if (code >= 0 && code <= 1) return "☀️"; 
  if (code >= 2 && code <= 3) return "🌤️"; 
  if (code >= 45 && code <= 48) return "🌫️"; 
  if ((code >= 51 && code <= 55) || (code >= 61 && code <= 65) || (code >= 80 && code <= 82)) return "🌧️"; 
  if ((code >= 71 && code <= 75) || (code >= 85 && code <= 86)) return "❄️"; 
  if (code >= 95 && code <= 99) return "🌩️"; 
  return "❓"; 
}

// Función para buscar y renderizar
async function buscarTiempo(poble, targetId) {
  const resultat = document.getElementById(targetId);
  if (!resultat) return;

  try {
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(poble)}&count=1&language=ca`);
    const geoData = await geoRes.json();

    if (geoData.results && geoData.results.length > 0) {
      const m = geoData.results[0];
      const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${m.latitude}&longitude=${m.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;
      
      const meteoRes = await fetch(meteoUrl);
      const data = await meteoRes.json();

      renderizarTiempo(data, m.name, targetId);
    }
  } catch (error) {
    console.error("Error cargando el tiempo:", error);
  }
}

function renderizarTiempo(meteoData, nombre, targetId) {
  const container = document.getElementById(targetId);
  const current = meteoData.current;
  
  // Versión simplificada para la Home
  container.innerHTML = `
    <div id="temps-actual-card" style="margin-top:0;">
        <h3>${nombre}</h3>
        <span class="weather-icon">${obtenerIcono(current.weather_code)}</span>
        <span class="temperature">${Math.round(current.temperature_2m)} °C</span>
        <div class="details">
            <p>🌡️ Sensació: <strong>${Math.round(current.apparent_temperature)} °C</strong> | 💨 Vent: <strong>${Math.round(current.wind_speed_10m)} km/h</strong></p>
        </div>
    </div>
  `;
}