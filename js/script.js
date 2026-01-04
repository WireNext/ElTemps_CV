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
    const { current, hourly, daily } = data;

    // Usamos etiquetas estándar para que el CSS las controle
    let html = `
        <div style="padding:20px; text-align:center;">
            <h2 style="background:transparent; color:var(--accent);">${nombre}</h2>
            <div style="font-size:4rem; margin:10px 0;">${obtenerIcono(current.weather_code)}</div>
            <div style="font-size:3rem; font-weight:bold;">${Math.round(current.temperature_2m)}°C</div>
            <p>Sensació: ${Math.round(current.apparent_temperature)}°C | Vent: ${Math.round(current.wind_speed_10m)}km/h</p>
        </div>`;

    if (targetId === "resultado-tiempo") {
        html += `
            <h4 style="margin-left:15px;">Pròximes 24h</h4>
            <div id="proximas-horas-container">`;
        const hIdx = new Date().getHours();
        for (let i = hIdx; i < hIdx + 24; i++) {
            html += `
                <div class="hora-item">
                    <div><b>${i % 24}:00</b></div>
                    <div style="font-size:1.5rem;">${obtenerIcono(hourly.weather_code[i])}</div>
                    <div style="color:var(--accent); font-weight:bold;">${Math.round(hourly.temperature_2m[i])}°</div>
                </div>`;
        }
        html += `</div>`;
        
        html += `
            <h4 style="margin-left:15px;">7 Dies</h4>
            <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:10px; padding:10px;">`;
        for (let i = 0; i < 7; i++) {
            html += `
                <div style="background:var(--nav-bg); padding:10px; border-radius:10px; min-width:80px; text-align:center;">
                    <b>${new Date(daily.time[i]).toLocaleDateString("ca",{weekday:'short'})}</b><br>
                    ${obtenerIcono(daily.weather_code[i])}<br>
                    <small>${Math.round(daily.temperature_2m_max[i])}° / ${Math.round(daily.temperature_2m_min[i])}°</small>
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
        else homeBox.innerHTML = "<p style='padding:20px'>📍 Configura el teu poble al cercador.</p>";
    }
});