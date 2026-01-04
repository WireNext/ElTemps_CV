document.addEventListener("DOMContentLoaded", () => {
    // Aplicar tema guardado
    const theme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", theme);
    
    // Toggle de tema
    const btn = document.getElementById("theme-toggle");
    if(btn) {
        btn.onclick = () => {
            const current = document.documentElement.getAttribute("data-theme");
            const nuevo = current === "dark" ? "light" : "dark";
            document.documentElement.setAttribute("data-theme", nuevo);
            localStorage.setItem("theme", nuevo);
        };
    }

    // Lógica Home
    const homeBox = document.getElementById("resultado-tiempo-home");
    if (homeBox) {
        const guardado = localStorage.getItem("ultimPobleBuscat");
        if (guardado) { 
            buscarTiempo(guardado, "resultado-tiempo-home"); 
        } else {
            homeBox.innerHTML = `
                <div style="padding:40px; text-align:center; color:var(--text-color);">
                    <p style="font-size:1.1rem;">📍 No has seleccionat cap municipi.</p>
                    <a href="buscador.html" style="display:inline-block; background:var(--accent); color:white; padding:10px 20px; border-radius:8px; text-decoration:none; font-weight:bold; margin-top:10px;">Configurar ara</a>
                </div>`;
        }
    }
});

async function buscarTiempo(poble, targetId) {
    try {
        const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(poble)}&count=1&language=ca`);
        const geoData = await geo.json();
        if (!geoData.results) return;
        const m = geoData.results[0];
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${m.latitude}&longitude=${m.longitude}&current=temperature_2m,weather_code,apparent_temperature,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
        const d = await res.json();
        renderizar(d, m.name, targetId);
    } catch (e) { console.error(e); }
}

function obtenerIcono(code) {
    if (code <= 1) return "☀️"; if (code <= 3) return "🌤️";
    if (code <= 48) return "🌫️"; if (code <= 82) return "🌧️";
    return "🌩️";
}

function renderizar(data, nombre, targetId) {
    const container = document.getElementById(targetId);
    const { current, hourly, daily } = data;

    // Estructura HTML con colores dinámicos de tu CSS
    let html = `
        <div style="padding:2rem; text-align:center; color:var(--text-color);">
            <h2 style="color:var(--accent); margin:0;">${nombre}</h2>
            <div style="font-size:4.5rem; margin:10px 0;">${obtenerIcono(current.weather_code)}</div>
            <div style="font-size:3rem; font-weight:bold; color:var(--accent);">${Math.round(current.temperature_2m)}°C</div>
            <p style="margin:5px 0; opacity:0.9;">Sensació: <b>${Math.round(current.apparent_temperature)}°C</b> | Vent: <b>${Math.round(current.wind_speed_10m)}km/h</b></p>
        </div>`;

    if (targetId === "resultado-tiempo") {
        html += `
            <h4 style="padding:0 20px; color:var(--text-color); text-align:left;">Pròximes 24h</h4>
            <div id="proximas-horas-container">`;
        const hIdx = new Date().getHours();
        for (let i = hIdx; i < hIdx + 24; i++) {
            html += `
                <div class="hora-item">
                    <div style="font-size:0.85rem; font-weight:bold;">${i % 24}:00</div>
                    <div style="font-size:1.8rem; margin:5px 0;">${obtenerIcono(hourly.weather_code[i])}</div>
                    <div style="color:var(--accent); font-weight:bold;">${Math.round(hourly.temperature_2m[i])}°</div>
                </div>`;
        }
        html += `</div>
            <h4 style="padding:0 20px; color:var(--text-color); text-align:left;">Previsió 7 Dies</h4>
            <div id="previsio-7dies-container" style="display:flex; flex-wrap:wrap; justify-content:center; gap:10px; padding:15px;">`;
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