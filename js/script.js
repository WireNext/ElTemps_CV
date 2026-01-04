// --- 1. Modo oscuro automático + manual ---
const toggleBtn = document.getElementById("theme-toggle");
const userPref = localStorage.getItem("theme");
const systemPrefDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

if (userPref === "dark" || (!userPref && systemPrefDark)) {
    document.documentElement.setAttribute("data-theme", "dark");
}

if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
    });
}

// --- 2. Lógica de Predicción (Compartida) ---

document.addEventListener("DOMContentLoaded", () => {
    const homeContainer = document.getElementById("tiempo-home-container");
    const pobleGuardat = localStorage.getItem("ultimPobleBuscat");

    // Si estamos en la Home y hay un pueblo guardado, cargamos el tiempo
    if (homeContainer && pobleGuardat) {
        homeContainer.style.display = "block";
        buscarTiempo(pobleGuardat, "resultado-tiempo-home");
    }
});

function obtenerIcono(code) {
    if (code >= 0 && code <= 1) return "☀️"; 
    if (code >= 2 && code <= 3) return "🌤️"; 
    if (code >= 45 && code <= 48) return "🌫️"; 
    if ((code >= 51 && code <= 55) || (code >= 61 && code <= 65) || (code >= 80 && code <= 82)) return "🌧️"; 
    if ((code >= 71 && code <= 75) || (code >= 85 && code <= 86)) return "❄️"; 
    if (code >= 95 && code <= 99) return "🌩️"; 
    return "❓"; 
}

function obtenerDiaSemana(dateString) {
    const date = new Date(dateString);
    const avui = new Date();
    if (date.toDateString() === avui.toDateString()) return "Avui";
    return date.toLocaleDateString("ca-ES", { weekday: 'short', day: 'numeric' });
}

async function buscarTiempo(poble, targetId) {
    const resultat = document.getElementById(targetId);
    if (!resultat) return;

    try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(poble)}&count=1&language=ca`);
        const geoData = await geoRes.json();

        if (geoData.results && geoData.results.length > 0) {
            const m = geoData.results[0];
            const meteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${m.latitude}&longitude=${m.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max&timezone=auto`;
            
            const meteoRes = await fetch(meteoUrl);
            const data = await meteoRes.json();

            renderizarTiempo(data, m.name, targetId);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

function renderizarTiempo(meteoData, nombre, targetId) {
    const container = document.getElementById(targetId);
    if (!container) return;

    const current = meteoData.current;
    const daily = meteoData.daily;
    const hourly = meteoData.hourly;

    // Parte común: Tiempo Actual
    let html = `
        <div id="temps-actual-card" style="margin-top:0;">
            <h3>${nombre}</h3>
            <span class="weather-icon">${obtenerIcono(current.weather_code)}</span>
            <span class="temperature">${Math.round(current.temperature_2m)} °C</span>
            <div class="details">
                <p>🌡️ Sensació: <strong>${Math.round(current.apparent_temperature)} °C</strong> | 💨 Vent: <strong>${Math.round(current.wind_speed_10m)} km/h</strong></p>
            </div>
        </div>
    `;

    // Si es la página de BUSCADOR, añadimos el detalle de horas y días
    if (targetId === "resultado-tiempo") {
        // Próximas Horas
        html += `<h4>Pròximes 24 hores</h4><div id="proximas-horas-container">`;
        const horaActual = new Date().getHours();
        for (let i = horaActual; i < horaActual + 24; i++) {
            html += `
                <div class="hora-item">
                    <span class="hora-txt">${i % 24}:00</span>
                    <span class="hora-icon">${obtenerIcono(hourly.weather_code[i])}</span>
                    <span class="hora-temp">${Math.round(hourly.temperature_2m[i])}°</span>
                </div>`;
        }
        html += `</div>`;

        // 7 Días
        html += `<h4>Previsió 7 Dies</h4><div id="previsio-7dies-container">`;
        for (let i = 0; i < 7; i++) {
            html += `
                <div class="previsio-dia">
                    <p class="dia-setmana">${obtenerDiaSemana(daily.time[i])}</p>
                    <span class="previsio-icon">${obtenerIcono(daily.weather_code[i])}</span>
                    <p class="temp-range">
                        <span class="max-temp">${Math.round(daily.temperature_2m_max[i])}°</span><br>
                        <span class="min-temp">${Math.round(daily.temperature_2m_min[i])}°</span>
                    </p>
                    <p style="font-size: 0.75rem; color: var(--accent);">💧 ${daily.precipitation_probability_max[i]}%</p>
                </div>`;
        }
        html += `</div>`;
    }

    container.innerHTML = html;
}