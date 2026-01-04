// --- 1. Gestión de Modo Oscuro ---
const toggleBtn = document.getElementById("theme-toggle");
const currentTheme = localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

document.documentElement.setAttribute("data-theme", currentTheme);

if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
        const theme = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    });
}

// --- 2. Lógica Meteorológica Centralizada ---
document.addEventListener("DOMContentLoaded", () => {
    const homeContainer = document.getElementById("resultado-tiempo-home");
    const pobleGuardat = localStorage.getItem("ultimPobleBuscat");

    if (homeContainer) {
        if (pobleGuardat) {
            buscarTiempo(pobleGuardat, "resultado-tiempo-home");
        } else {
            homeContainer.innerHTML = `
                <div style="padding: 30px; text-align: center;">
                    <p style="font-size: 1.2em;">📍 No has seleccionat cap poble encara.</p>
                    <p style="opacity: 0.7;">Configura el teu municipi per a veure el temps ací.</p>
                    <a href="buscador.html" class="btn-home">Configurar ara</a>
                </div>`;
        }
    }
});

function obtenerIcono(code) {
    if (code <= 1) return "☀️";
    if (code <= 3) return "🌤️";
    if (code <= 48) return "🌫️";
    if (code <= 65 || (code >= 80 && code <= 82)) return "🌧️";
    if (code <= 77 || (code >= 85 && code <= 86)) return "❄️";
    if (code >= 95) return "🌩️";
    return "❓";
}

async function buscarTiempo(poble, targetId) {
    const container = document.getElementById(targetId);
    if (!container) return;
    if (targetId === "resultado-tiempo") container.innerHTML = "⏳ Carregant previsió detallada...";

    try {
        const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(poble)}&count=1&language=ca`);
        const geoData = await geo.json();
        
        if (!geoData.results) {
            container.innerHTML = "❌ No s'ha trobat el municipi.";
            return;
        }

        const m = geoData.results[0];
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${m.latitude}&longitude=${m.longitude}&current=temperature_2m,weather_code,apparent_temperature,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`);
        const data = await res.json();
        
        renderizarTiempo(data, m.name, targetId);
    } catch (e) {
        container.innerHTML = "⚠️ Error de connexió.";
    }
}

function renderizarTiempo(data, nombre, targetId) {
    const container = document.getElementById(targetId);
    const { current, hourly, daily } = data;

    // --- Vista COMÚN (Tarjeta Principal) ---
    let html = `
        <div id="temps-actual-card" style="margin-bottom: 20px;">
            <h2 style="margin: 0;">${nombre}</h2>
            <span style="font-size: 4rem; display: block; margin: 10px 0;">${obtenerIcono(current.weather_code)}</span>
            <span style="font-size: 2.5rem; font-weight: bold;">${Math.round(current.temperature_2m)}°C</span>
            <p style="opacity: 0.9;">Sensació: ${Math.round(current.apparent_temperature)}°C | Vent: ${Math.round(current.wind_speed_10m)} km/h</p>
        </div>`;

    // --- Vista DETALLADA (Solo para la página del buscador) ---
    if (targetId === "resultado-tiempo") {
        // Horas
        html += `<h3 style="text-align:left; margin-left:10px;">Pròximes 24 hores</h3>
                 <div id="proximas-horas-container">`;
        const actual = new Date().getHours();
        for (let i = actual; i < actual + 24; i++) {
            html += `
                <div class="hora-item">
                    <span class="hora-txt">${i % 24}:00</span>
                    <span class="hora-icon">${obtenerIcono(hourly.weather_code[i])}</span>
                    <span class="hora-temp">${Math.round(hourly.temperature_2m[i])}°</span>
                </div>`;
        }
        html += `</div>`;

        // 7 Días
        html += `<h3 style="text-align:left; margin-left:10px;">Previsió setmanal</h3>
                 <div id="previsio-7dies-container">`;
        for (let i = 0; i < 7; i++) {
            const fecha = new Date(daily.time[i]).toLocaleDateString("ca", { weekday: 'short', day: 'numeric' });
            html += `
                <div class="previsio-dia">
                    <span style="font-weight:bold; text-transform: capitalize;">${fecha}</span>
                    <span style="font-size: 2em; display:block; margin: 10px 0;">${obtenerIcono(daily.weather_code[i])}</span>
                    <span style="color: var(--accent); font-weight:bold;">${Math.round(daily.temperature_2m_max[i])}°</span> 
                    <span style="opacity:0.6;">${Math.round(daily.temperature_2m_min[i])}°</span>
                    <p style="font-size: 0.8em; margin-top: 10px;">💧 ${daily.precipitation_probability_max[i]}%</p>
                </div>`;
        }
        html += `</div>`;
    }
    container.innerHTML = html;
}