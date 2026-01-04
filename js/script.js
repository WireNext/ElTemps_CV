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

    // 1. BLOQUE SUPERIOR: Info Actual (Se ve igual en ambos sitios)
    let html = `
        <div style="padding:1.5rem; text-align:center;">
            <h2 style="background:transparent !important; color:var(--accent) !important; margin:0;">${nombre}</h2>
            <div style="font-size:4rem; margin:10px 0;">${obtenerIcono(current.weather_code)}</div>
            <div style="font-size:3rem; font-weight:bold; color:var(--accent);">${Math.round(current.temperature_2m)}°C</div>
            <p>Sensació: <b>${Math.round(current.apparent_temperature)}°C</b> | Vent: <b>${Math.round(current.wind_speed_10m)}km/h</b></p>
        </div>`;

    // 2. SLIDER 24 HORAS (Ahora se ve tanto en HOME como en BUSCADOR)
    html += `<h4 style="margin-left:20px;">Pròximes 24h</h4>
             <div id="proximas-horas-container">`;
    
    const horaActual = new Date().getHours();
    // Recorremos las próximas 24 horas desde la hora actual
    for (let i = horaActual; i < horaActual + 24; i++) {
        html += `
            <div class="hora-item">
                <div style="font-size:0.8rem; font-weight:bold;">${i % 24}:00</div>
                <div style="font-size:1.5rem; margin:5px 0;">${obtenerIcono(hourly.weather_code[i])}</div>
                <div style="color:var(--accent); font-weight:bold;">${Math.round(hourly.temperature_2m[i])}°</div>
            </div>`;
    }
    html += `</div>`;

    // 3. PREVISIÓN 7 DÍAS (Solo se ve en el BUSCADOR para no recargar la Home)
    if (targetId === "resultado-tiempo") {
        html += `<h4 style="margin-left:20px;">Previsió 7 Dies</h4>
                 <div class="previsio-grid">`;
        for (let i = 0; i < 7; i++) {
            html += `
                <div class="dia-caja">
                    <b style="text-transform:capitalize;">${new Date(daily.time[i]).toLocaleDateString("ca",{weekday:'short'})}</b><br>
                    <span style="font-size:1.8rem;">${obtenerIcono(daily.weather_code[i])}</span><br>
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