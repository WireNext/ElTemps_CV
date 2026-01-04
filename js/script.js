// Gestión de Tema
document.addEventListener("DOMContentLoaded", () => {
    const theme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", theme);
    
    const homeBox = document.getElementById("resultado-tiempo-home");
    if (homeBox) {
        const guardado = localStorage.getItem("ultimPobleBuscat");
        if (guardado) { buscarTiempo(guardado, "resultado-tiempo-home"); }
        else {
            homeBox.innerHTML = `<div style="padding:20px;"><a href="buscador.html" class="btn-home" style="background:var(--accent); color:white; padding:10px 20px; border-radius:8px; text-decoration:none;">📍 Configurar Poble</a></div>`;
        }
    }
});

async function buscarTiempo(poble, targetId) {
    try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(poble)}&count=1&language=ca`);
        const geoData = await geoRes.json();
        if (!geoData.results) return;

        const m = geoData.results[0];
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${m.latitude}&longitude=${m.longitude}&current=temperature_2m,weather_code,apparent_temperature,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
        const data = await res.json();
        
        renderizar(data, m.name, targetId);
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

    let html = `
        <div style="padding:1.5rem;">
            <h2 style="margin:0; color:var(--accent);">${nombre}</h2>
            <div style="font-size:4rem;">${obtenerIcono(current.weather_code)}</div>
            <div style="font-size:2.5rem; font-weight:bold;">${Math.round(current.temperature_2m)}°C</div>
            <p>Sensació: ${Math.round(current.apparent_temperature)}°C | Vent: ${Math.round(current.wind_speed_10m)}km/h</p>
        </div>`;

    if (targetId === "resultado-tiempo") {
        // Slider 24h
        html += `<h3>Pròximes 24h</h3><div id="proximas-horas-container">`;
        const horaIdx = new Date().getHours();
        for (let i = horaIdx; i < horaIdx + 24; i++) {
            html += `
                <div class="hora-item">
                    <div style="font-size:0.8rem;">${i % 24}:00</div>
                    <div style="font-size:1.5rem; margin:5px 0;">${obtenerIcono(hourly.weather_code[i])}</div>
                    <div class="hora-temp">${Math.round(hourly.temperature_2m[i])}°</div>
                </div>`;
        }
        html += `</div><h3>Previsió Setmanal</h3><div id="previsio-7dies-container">`;
        for (let i = 0; i < 7; i++) {
            html += `
                <div class="previsio-dia">
                    <b>${new Date(daily.time[i]).toLocaleDateString("ca",{weekday:'short'})}</b><br>
                    <span style="font-size:1.5rem;">${obtenerIcono(daily.weather_code[i])}</span><br>
                    <small>${Math.round(daily.temperature_2m_max[i])}° / ${Math.round(daily.temperature_2m_min[i])}°</small>
                </div>`;
        }
        html += `</div>`;
    }
    container.innerHTML = html;
}