const tableBody = document.querySelector("#bpTable tbody");
const startDateInput = document.getElementById("startDate");

function getTimes() {
    return [
        t("morning"),
        t("noon"),
        t("evening")
    ];
}

const DAYS_IN_WEEK = 7;
const DEFAULT_LIMITS = {
    normal: 130,
    warning: 180
};

let limits = loadLimits();
let doctorMode = false;


function loadLimits() {
    return JSON.parse(localStorage.getItem("bp_limits")) || DEFAULT_LIMITS;
}

function saveLimits(newLimits) {
    limits = newLimits;
    localStorage.setItem("bp_limits", JSON.stringify(limits));
}

// Zentrale Datumsfunktion
// Anzeigeformat: dd.mm.jjjj
function formatDateDisplay(date) {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
}

// Storage / interne Keys: yyyy-mm-dd
function formatDateISO(date) {
  return date.toISOString().split("T")[0];
}




// Initialisierung
init();

function init() {
    const today = new Date();
    startDateInput.valueAsDate = today;
    renderWeek(today);

    document.getElementById("resetData").addEventListener("click", () => {
        const ok = confirm(t("resetConfirm"));

        if (!ok) return;

        localStorage.clear();
        location.reload();
    });
}

// Tabelle für 7 Tage erzeugen
function renderWeek(startDate) {
    tableBody.innerHTML = "";

    const weekKey = getWeekKey(startDate);
    const storedData = loadWeekData(weekKey);

    for (let i = 0; i < DAYS_IN_WEEK; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        const dateKey = formatDateISO(currentDate);
        const dateDisplay = formatDateDisplay(currentDate);


        getTimes().forEach((time, index) => {
            const row = document.createElement("tr");
            row.dataset.date = dateKey; // z.B. 2026-01-28 (ISO)
            row.dataset.time = time;    // Morgens | Mittag | Abend

            // Datum nur einmal pro Tag
            if (index === 0) {
                const dateCell = document.createElement("td");
                dateCell.className = "date";
                dateCell.rowSpan = 3;
                dateCell.innerText = dateDisplay;
                row.appendChild(dateCell);
            }

            row.innerHTML += `
                <td><input type="time" data-field="clock"></td>
                <td class="time">${time}</td>
                <td><input type="number" data-field="sys"></td>
                <td><input type="number" data-field="dia"></td>
                <td><input type="number" data-field="pulse"></td>
            `;

            const storageKey = `${dateKey}_${time}`;

            if (storedData[storageKey]) {
                const inputs = row.querySelectorAll("input");
                inputs[0].value = storedData[storageKey].clock || "";
                inputs[1].value = storedData[storageKey].sys;
                inputs[2].value = storedData[storageKey].dia;
                inputs[3].value = storedData[storageKey].pulse;
            }

            row.querySelectorAll("input").forEach(input => {
                input.addEventListener("input", () => {
                    validateBloodPressure(row);
                    saveCellData(startDate);
                });
            });

            // Arztmodus: nur Lesen
            if (doctorMode) {
                row.querySelectorAll("input").forEach(input => {
                    input.disabled = true;
                });
            }

            validateBloodPressure(row);
            tableBody.appendChild(row);
        });
    }
    updateWeekSummary(startDate);
    updateTitle();

}

// Speichert komplette Woche
function saveCellData(startDate) {
    const weekKey = getWeekKey(startDate);
    const data = {};

    tableBody.querySelectorAll("tr").forEach(row => {
        const date = row.dataset.date;
        const time = row.dataset.time;

        const inputs = row.querySelectorAll("input");

        data[`${date}_${time}`] = {
            clock: inputs[0].value,
            sys: inputs[1].value,
            dia: inputs[2].value,
            pulse: inputs[3].value
        };

    });

    localStorage.setItem(weekKey, JSON.stringify(data));
}


// Daten laden
function loadWeekData(weekKey) {
    return JSON.parse(localStorage.getItem(weekKey)) || {};
}

// Wochen-Key (z. B. week_2026-01-28)
function getWeekKey(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    const monday = new Date(d);
    const day = monday.getDay() || 7;
    monday.setDate(monday.getDate() - day + 1);

    return `week-${monday.toISOString().slice(0, 10)}`;
}



// Navigation
document.getElementById("prevWeek").addEventListener("click", () => {
    changeWeek(-7);
});

document.getElementById("nextWeek").addEventListener("click", () => {
    changeWeek(7);
});

startDateInput.addEventListener("change", () => {
    renderWeek(new Date(startDateInput.value));
});

function changeWeek(days) {
    const date = new Date(startDateInput.value);
    date.setDate(date.getDate() + days);
    startDateInput.valueAsDate = date;
    renderWeek(date);
}

function validateBloodPressure(row) {
    const sysInput = row.querySelector('input[data-field="sys"]');

    if (!sysInput.value) {
        row.classList.remove("bp-normal", "bp-warning", "bp-danger");
        row.dataset.warned = "false";
        return;
    }

    const sys = parseInt(sysInput.value, 10);

    row.classList.remove("bp-normal", "bp-warning", "bp-danger");

    if (sys < limits.normal) {
        row.classList.add("bp-normal");
        row.dataset.warned = "false";
    } 
    else if (sys <= limits.warning) {
        row.classList.add("bp-warning");
        row.dataset.warned = "false";
    } 
    else {
        row.classList.add("bp-danger");

        // ⚠️ echte Warnung – nur einmal
        if (row.dataset.warned !== "true") {
            alert(
            t("alertCriticalTitle") + "\n\n" +
            t("alertCriticalText")
            );
            row.dataset.warned = "true";
        }
    }
}

/* Wochenanalyse */
function updateWeekSummary(startDate) {
    const weekKey = getWeekKey(startDate);
    const data = loadWeekData(weekKey);

    let normal = 0, warning = 0, danger = 0;

    Object.values(data).forEach(entry => {
        const sys = parseInt(entry.sys, 10);
        if (!sys) return;

        if (sys < limits.normal) normal++;
        else if (sys <= limits.warning) warning++;
        else danger++;
    });

        document.getElementById("weekSummary").innerHTML = `
        <span>🟢 ${t("normal")}: ${normal}</span>
        <span>🟡 ${t("warning")}: ${warning}</span>
        <span>🔴 ${t("danger")}: ${danger}</span>
        `;

}

/* speichern & anwenden */
document.getElementById("limitNormal").value = limits.normal;
document.getElementById("limitWarning").value = limits.warning;

document.getElementById("saveLimits").addEventListener("click", () => {
    saveLimits({
        normal: parseInt(limitNormal.value, 10),
        warning: parseInt(limitWarning.value, 10)
    });
    renderWeek(new Date(startDateInput.value));
});

/* Arzt-Zusammenfassung */
function getDoctorSummary(startDate) {
    const weekKey = getWeekKey(startDate);
    const data = loadWeekData(weekKey);
    const entries = Object.values(data);

    if (!entries.length) {
        return null;
    }

    const sysValues = [];
    const diaValues = [];
    const pulseValues = [];
    let critical = 0;

    entries.forEach(e => {
        if (e.sys) sysValues.push(+e.sys);
        if (e.dia) diaValues.push(+e.dia);
        if (e.pulse) pulseValues.push(+e.pulse);

        if (e.sys && +e.sys >= limitWarning) {
            critical++;
        }
    });

    const avg = arr =>
        arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : "-";

    const start = new Date(startDate);
    const end = new Date(startDate);
    end.setDate(start.getDate() + 6);

    return {
        period: `${formatDateDisplay(start)} – ${formatDateDisplay(end)}`,
        count: entries.length,
        avgSys: avg(sysValues),
        avgDia: avg(diaValues),
        avgPulse: avg(pulseValues),
        critical
    };
}


function updateTitle() {
    const title = document.querySelector("h2");
    title.innerText = doctorMode
    ? t("titleDoctor")
    : t("title");
}

function updateDoctorSummary() {
    const summaryEl = document.getElementById("doctorSummary");

    if (!doctorMode) {
        summaryEl.innerText = "";
        return;
    }

    const summary = getDoctorSummary(new Date(startDateInput.value));

    summaryEl.innerText = summary
        ? `${summary.period} | Ø ${summary.avgSys}/${summary.avgDia} | Puls Ø ${summary.avgPulse}`
        : t("noValues");
}

document.getElementById("doctorMode").addEventListener("change", e => {
    doctorMode = e.target.checked;

    document.documentElement.classList.toggle(
        "doctor-print",
        doctorMode
    );

    updateTitle();
    renderWeek(new Date(startDateInput.value));
    updateDoctorSummary();
});





/* Language / Sparache / Dil Secimi */
const langSelect = document.getElementById("languageSelect");

langSelect.addEventListener("change", e => {
    const lang = e.target.value;
    setLanguage(lang);
    updateLanguageFlag(lang);
    // 🔁 Tabelle neu aufbauen, damit getTimes() neu greift
    renderWeek(new Date(startDateInput.value));
});


// 🌍 Sprache beim ersten Start automatisch erkennen
let savedLang = localStorage.getItem("language");

if (!savedLang) {
    savedLang = detectBrowserLanguage();
    localStorage.setItem("language", savedLang);
}

langSelect.value = savedLang;
setLanguage(savedLang);
updateLanguageFlag(savedLang);
// 🔁 Tabelle neu rendern (wichtig für getTimes!)
renderWeek(new Date(startDateInput.value));

function updateLanguageFlag(lang) {
    const flags = {
        de: "flags/flagde.png",
        tr: "flags/flagtr.png",
        en: "flags/flagen.png",
        fr: "flags/flagfr.png"
    };

    const flagImg = document.getElementById("langFlag");
    if (flagImg && flags[lang]) {
        flagImg.src = flags[lang];
        flagImg.alt = lang.toUpperCase();
    }
}

