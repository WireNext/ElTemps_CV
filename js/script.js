// FUNCIONAMIENTO DEL TEMA OSCURO
function initTheme() {
    const theme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", theme);
    
    const btn = document.getElementById("theme-toggle");
    if (btn) {
        btn.onclick = () => {
            const current = document.documentElement.getAttribute("data-theme");
            const nuevo = current === "dark" ? "light" : "dark";
            document.documentElement.setAttribute("data-theme", nuevo);
            localStorage.setItem("theme", nuevo);
        };
    }
}

// BUSCAR TIEMPO
async function buscarTiempo(poble, targetId) {
    const container = document.getElementById(targetId);
    if (!container) return;

    try {
        const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(poble)}&count=1&language=ca`);
        const geoData = await geo.json();
        if (!geoData.results) return;

        const m = geoData.results[0];
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${m.latitude}&longitude=${m.longitude}&current=temperature_2m,weather_code,apparent_temperature,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
        const d = await res.json();
        
        renderizar(d, m.name, targetId);
    } catch (e) {
        console.error("Error cargando tiempo:", e);
    }
}

function obtenerIcono(code) {
    if (code <= 1) return "☀️"; if (code <= 3) return "🌤️";
    if (code <= 48) return "🌫️"; if (code <= 82) return "🌧️";
    return "🌩️";
}

function renderizar(data, nombre, targetId) {
    const container = document.getElementById(targetId);
    const { current, daily, hourly } = data;

    // 1. Info Actual (Limpia)
    let html = `
        <div class="tiempo-actual-wrapper">
            <h2>${nombre}</h2>
            <div class="icono-grande">${obtenerIcono(current.weather_code)}</div>
            <div class="temperatura-principal">${Math.round(current.temperature_2m)}°C</div>
            <p>Sensació: <b>${Math.round(current.apparent_temperature)}°C</b> | Vent: <b>${Math.round(current.wind_speed_10m)}km/h</b></p>
        </div>`;

    // 2. HOME: Previsión reducida
    if (targetId === "resultado-tiempo-home") {
        html += `<div class="previsio-container-horizontal">`;
        for (let i = 1; i <= 4; i++) {
            html += `
                <div class="dia-mini">
                    <span class="nombre-dia">${new Date(daily.time[i]).toLocaleDateString("ca",{weekday:'short'})}</span>
                    <div class="icono-mini">${obtenerIcono(daily.weather_code[i])}</div>
                    <div class="temps-mini">
                        <span class="max">${Math.round(daily.temperature_2m_max[i])}°</span> 
                        <span class="min">${Math.round(daily.temperature_2m_min[i])}°</span>
                    </div>
                </div>`;
        }
        html += `</div>`;
    }

    // 3. BUSCADOR: Detalle completo
    if (targetId === "resultado-tiempo") {
        html += `<h4>Pròximes 24h</h4>
                 <div id="proximas-horas-container">`;
        const horaActual = new Date().getHours();
        for (let i = horaActual; i < horaActual + 24; i++) {
            html += `
                <div class="hora-item">
                    <div class="hora-txt">${i % 24}:00</div>
                    <div class="hora-icon">${obtenerIcono(hourly.weather_code[i])}</div>
                    <div class="hora-temp">${Math.round(hourly.temperature_2m[i])}°</div>
                </div>`;
        }
        html += `</div>`;

        html += `<h4>Previsió 7 Dies</h4>
                 <div class="previsio-container-horizontal">`;
        for (let i = 0; i < 7; i++) {
            html += `
                <div class="previsio-dia">
                    <b class="caps">${new Date(daily.time[i]).toLocaleDateString("ca",{weekday:'short'})}</b>
                    <span class="icono-lista">${obtenerIcono(daily.weather_code[i])}</span>
                    <div class="rango-lista">
                        <span class="max">${Math.round(daily.temperature_2m_max[i])}°</span> / 
                        <span>${Math.round(daily.temperature_2m_min[i])}°</span>
                    </div>
                </div>`;
        }
        html += `</div>`;
    }

    container.innerHTML = html;
}

// INICIO
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    const homeBox = document.getElementById("resultado-tiempo-home");
    if (homeBox) {
        const p = localStorage.getItem("ultimPobleBuscat");
        if (p) buscarTiempo(p, "resultado-tiempo-home");
        else homeBox.innerHTML = "<p style='padding:20px; text-align:center;'>📍 Configura el teu poble al cercador.</p>";
    }
});