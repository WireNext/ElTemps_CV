// --- Modo Oscuro ---
const toggleBtn = document.getElementById("theme-toggle");
if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
        const theme = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);
    });
}

// --- Carga Inicial ---
document.addEventListener("DOMContentLoaded", () => {
    const theme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", theme);

    const homeContainer = document.getElementById("resultado-tiempo-home");
    if (homeContainer) {
        const poble = localStorage.getItem("ultimPobleBuscat");
        if (poble) {
            buscarTiempo(poble, "resultado-tiempo-home");
        } else {
            homeContainer.innerHTML = `
                <div style="padding:2rem; text-align:center;">
                    <p>📍 Encara no has triat cap poble.</p>
                    <a href="buscador.html" style="background:var(--accent); color:white; padding:0.5rem 1rem; border-radius:8px; text-decoration:none; font-weight:bold;">Elegir Poble</a>
                </div>`;
        }
    }
});

function obtenerIcono(code) {
    if (code <= 1) return "☀️"; if (code <= 3) return "🌤️";
    if (code <= 48) return "🌫️"; if (code <= 82) return "🌧️";
    if (code <= 99) return "🌩️"; return "❓";
}

async function buscarTiempo(poble, targetId) {
    const container = document.getElementById(targetId);
    if (!container) return;
    try {
        const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(poble)}&count=1&language=ca`);
        const geoData = await geo.json();
        if (!geoData.results) return;

        const m = geoData.results[0];
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${m.latitude}&longitude=${m.longitude}&current=temperature_2m,weather_code,apparent_temperature,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`);
        const data = await res.json();
        renderizar(data, m.name, targetId);
    } catch (e) { console.error(e); }
}

function renderizar(data, nombre, targetId) {
    const container = document.getElementById(targetId);
    const { current, hourly, daily } = data;

    // Tarjeta Actual (Estilo de tu #resultado-tiempo)
    let html = `
        <div id="temps-actual-card" style="text-align:center; padding:1rem; border-bottom: 5px solid var(--accent);">
            <h3 style="color:var(--text-color);">${nombre}</h3>
            <span style="font-size:4rem; display:block; color:var(--accent);">${obtenerIcono(current.weather_code)}</span>
            <span style="font-size:3rem; font-weight:700; color:var(--accent); display:block;">${Math.round(current.temperature_2m)}°C</span>
            <div class="details">
                <p>Sensació: <b>${Math.round(current.apparent_temperature)}°C</b></p>
                <p>Vent: <b>${Math.round(current.wind_speed_10m)} km/h</b></p>
            </div>
        </div>`;

    // Si es la página Buscador, añadimos el resto
    if (targetId === "resultado-tiempo") {
        html += `<h4 style="margin-left:10px;">Pròximes 24h</h4><div id="proximas-horas-container">`;
        const horaIdx = new Date().getHours();
        for (let i = horaIdx; i < horaIdx + 24; i++) {
            html += `
                <div class="hora-item">
                    <span style="font-size:0.8rem; font-weight:bold;">${i % 24}:00</span>
                    <span style="font-size:1.5rem; display:block; margin:5px 0;">${obtenerIcono(hourly.weather_code[i])}</span>
                    <span class="hora-temp">${Math.round(hourly.temperature_2m[i])}°</span>
                </div>`;
        }
        html += `</div><h4 style="margin-left:10px;">Previsió 7 Dies</h4><div id="previsio-7dies-container">`;
        for (let i = 0; i < 7; i++) {
            html += `
                <div class="previsio-dia">
                    <div class="dia-setmana">${new Date(daily.time[i]).toLocaleDateString("ca",{weekday:'short'})}</div>
                    <span class="previsio-icon">${obtenerIcono(daily.weather_code[i])}</span>
                    <div class="temp-range">
                        <span class="max-temp">${Math.round(daily.temperature_2m_max[i])}°</span>
                        <span class="min-temp">${Math.round(daily.temperature_2m_min[i])}°</span>
                    </div>
                </div>`;
        }
        html += `</div>`;
    }
    container.innerHTML = html;
}