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

    // 1. Bloque de Tiempo Actual (Igual para ambos)
    let html = `
        <div style="padding:1.5rem; text-align:center; color:var(--text-color);">
            <h2 style="color:var(--accent); margin-bottom:10px;">${nombre}</h2>
            <div style="font-size:4rem; margin:10px 0;">${obtenerIcono(current.weather_code)}</div>
            <div style="font-size:3rem; font-weight:bold; color:var(--accent);">${Math.round(current.temperature_2m)}°C</div>
            <p>Sensació: <b>${Math.round(current.apparent_temperature)}°C</b> | Vent: <b>${Math.round(current.wind_speed_10m)}km/h</b></p>
        </div>`;

    // 2. Previsión para la HOME (Versión reducida horizontal)
    if (targetId === "resultado-tiempo-home") {
        html += `<div style="display:flex; justify-content:center; gap:15px; padding:15px; border-top:1px solid var(--nav-bg); flex-wrap:wrap;">`;
        for (let i = 1; i <= 4; i++) {
            html += `
                <div style="text-align:center; min-width:70px;">
                    <span style="font-size:0.8rem; font-weight:bold; text-transform:uppercase;">${new Date(daily.time[i]).toLocaleDateString("ca",{weekday:'short'})}</span>
                    <div style="font-size:1.5rem; margin:5px 0;">${obtenerIcono(daily.weather_code[i])}</div>
                    <div style="font-size:0.9rem;">
                        <span style="color:#d62828;">${Math.round(daily.temperature_2m_max[i])}°</span> 
                        <span style="opacity:0.6;">${Math.round(daily.temperature_2m_min[i])}°</span>
                    </div>
                </div>`;
        }
        html += `</div>`;
    }

    // 3. Previsión detallada para el BUSCADOR
    if (targetId === "resultado-tiempo") {
        // Slider 24 horas
        html += `<h4 style="margin-left:15px; color:var(--text-color);">Pròximes 24h</h4>
                 <div id="proximas-horas-container">`;
        const horaActual = new Date().getHours();
        for (let i = horaActual; i < horaActual + 24; i++) {
            html += `
                <div class="hora-item">
                    <div style="font-size:0.8rem; font-weight:bold;">${i % 24}:00</div>
                    <div style="font-size:1.5rem; margin:5px 0;">${obtenerIcono(hourly.weather_code[i])}</div>
                    <div style="color:var(--accent); font-weight:bold;">${Math.round(hourly.temperature_2m[i])}°</div>
                </div>`;
        }
        html += `</div>`;

        // 7 Días completos
        html += `<h4 style="margin-left:15px; color:var(--text-color);">Previsió 7 Dies</h4>
                 <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:10px; padding:10px;">`;
        for (let i = 0; i < 7; i++) {
            html += `
                <div class="previsio-dia">
                    <b style="text-transform:capitalize;">${new Date(daily.time[i]).toLocaleDateString("ca",{weekday:'short'})}</b><br>
                    <span style="font-size:1.8rem; display:block; margin:5px 0;">${obtenerIcono(daily.weather_code[i])}</span>
                    <small><b>${Math.round(daily.temperature_2m_max[i])}°</b> / ${Math.round(daily.temperature_2m_min[i])}°</small>
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