/* =========================================================
   Blutdruck WebApp – app.js
   Periodenbasiert (7 Tage ab Benutzer-Startdatum)
   Voll kommentiert – 1:1 ersetzbar
========================================================= */

/* =========================
   KONSTANTEN & GLOBALS
========================= */
// Perioden-Logik
const PATIENT_KEY = "bp_patient";   // <<< HIERHIN VERSCHIEBEN
const DAYS_IN_PERIOD = 7;
const ACTIVE_PERIOD_KEY = "bp_active_period_start";
// DOM
const tableBody = document.querySelector("#bpTable tbody");
const startDateInput = document.getElementById("startDate");
const langSelect = document.getElementById("languageSelect");



// Limits
const DATA_KEY = "bp_data";

const DEFAULT_LIMITS = {
    normal: 130,
    warning: 180
};

let limits = loadLimits();
let doctorMode = false;

/* =========================
   HILFSFUNKTIONEN – DATUM
========================= */

// Anzeigeformat: dd.mm.yyyy
function formatDateDisplay(date) {
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();
    return `${d}.${m}.${y}`;
}

// ISO-Format für Storage: yyyy-mm-dd
function formatDateISO(date) {
    return date.toISOString().split("T")[0];
}

/* =========================
   ZEITPUNKTE (I18N)
========================= */

function getTimes() {
    return [
        { key: "morning", label: t("morning") },
        { key: "noon",    label: t("noon") },
        { key: "evening", label: t("evening") }
    ];
}


/* =========================
   STORAGE – LIMITS
========================= */


function loadAllData() {
    return JSON.parse(localStorage.getItem(DATA_KEY)) || {};
}

function saveAllData(data) {
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

function loadLimits() {
    return JSON.parse(localStorage.getItem("bp_limits")) || DEFAULT_LIMITS;
}

function saveLimits(newLimits) {
    limits = newLimits;
    localStorage.setItem("bp_limits", JSON.stringify(limits));
}

/* =========================
   STORAGE – PERIODE
========================= */

// Key für komplette 7-Tage-Periode

/* =========================
   INITIALISIERUNG
========================= */

init();

function init() {
    let startDate;

    // gespeicherte Periode laden
    const savedStart = localStorage.getItem(ACTIVE_PERIOD_KEY);

    if (savedStart) {
        startDate = new Date(savedStart);
    } else {
        startDate = new Date();
        localStorage.setItem(
            ACTIVE_PERIOD_KEY,
            formatDateISO(startDate)
        );
    }

    // Kalender setzen
    startDateInput.valueAsDate = startDate;

    // Patient laden
    loadPatient();

    // Tabelle rendern
    renderWeek(startDate);

    // Reset
    document.getElementById("resetData").addEventListener("click", () => {
        const ok = confirm(t("resetConfirm"));
        if (!ok) return;
        localStorage.clear();
        location.reload();
    });
}

/* =========================
   TABELLE RENDERN (7 TAGE)
========================= */

function renderWeek(startDate) {
    tableBody.innerHTML = "";

        const storedData = loadAllData();

    for (let i = 0; i < DAYS_IN_PERIOD; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        const dateKey = formatDateISO(currentDate);
        const dateDisplay = formatDateDisplay(currentDate);

            getTimes().forEach((tObj, index) => {
                const row = document.createElement("tr");

                const timeKey = tObj.key;       // morning | noon | evening
                const timeLabel = tObj.label;   // Morgens | Morning | Matin

                row.dataset.date = dateKey;
                row.dataset.time = timeKey;

                // Datum nur einmal pro Tag
                if (index === 0) {
                    const dateCell = document.createElement("td");
                    dateCell.rowSpan = 3;
                    dateCell.innerText = dateDisplay;
                    row.appendChild(dateCell);
                }

                // Zellen
                row.innerHTML += `
                    <td><input type="time" data-field="clock"></td>
                    <td>${timeLabel}</td>
                    <td><input type="number" data-field="sys"></td>
                    <td><input type="number" data-field="dia"></td>
                    <td><input type="number" data-field="pulse"></td>
                `;

                // 🔐 Sprachunabhängiger Storage-Key
                const storageKey = `${dateKey}_${timeKey}`;

            // Daten laden
            if (storedData[storageKey]) {
                const inputs = row.querySelectorAll("input");
                const entry = storedData[storageKey];
                inputs[0].value = entry.clock || "";
                inputs[1].value = entry.sys || "";
                inputs[2].value = entry.dia || "";
                inputs[3].value = entry.pulse || "";
            }

            // Events
            row.querySelectorAll("input").forEach(input => {
                input.addEventListener("input", () => {
                    validateBloodPressure(row);
                    saveCellData();
                });

                if (doctorMode) {
                    input.disabled = true;
                }
            });

            validateBloodPressure(row);
            tableBody.appendChild(row);
        });
    }

    updateWeekSummary(startDate);
    updateTitle();
    updateDoctorSummary();
}

/* =========================
   STORAGE – PERIODENDATEN
========================= */


function saveCellData() {
    const data = loadAllData();

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

    saveAllData(data);
}


/* =========================
   NAVIGATION
========================= */

document.getElementById("prevWeek").addEventListener("click", () => {
    changePeriod(-7);
});

document.getElementById("nextWeek").addEventListener("click", () => {
    changePeriod(7);
});

function changePeriod(days) {
    const date = new Date(startDateInput.value);
    date.setDate(date.getDate() + days);

    localStorage.setItem(
        ACTIVE_PERIOD_KEY,
        formatDateISO(date)
    );

    startDateInput.valueAsDate = date;
    renderWeek(date);
}

// Benutzer ändert Startdatum
startDateInput.addEventListener("change", () => {
    const selected = new Date(startDateInput.value);

    localStorage.setItem(
        ACTIVE_PERIOD_KEY,
        formatDateISO(selected)
    );

    renderWeek(selected);
});

/* =========================
   VALIDIERUNG
========================= */

function validateBloodPressure(row) {
    const sysInput = row.querySelector('input[data-field="sys"]');

    row.classList.remove("bp-normal", "bp-warning", "bp-danger");

    if (!sysInput.value) return;

    const sys = parseInt(sysInput.value, 10);

    if (sys < limits.normal) {
        row.classList.add("bp-normal");
    } else if (sys <= limits.warning) {
        row.classList.add("bp-warning");
    } else {
        row.classList.add("bp-danger");
        alert(
            t("alertCriticalTitle") + "\n\n" +
            t("alertCriticalText")
        );
    }
}

/* =========================
   WOCHEN-ZUSAMMENFASSUNG
========================= */

function updateWeekSummary(startDate) {
    const data = loadAllData();

    let normal = 0, warning = 0, danger = 0;

    Object.values(data).forEach(e => {
        const sys = parseInt(e.sys, 10);
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

/* =========================
   LIMITS
========================= */

document.getElementById("limitNormal").value = limits.normal;
document.getElementById("limitWarning").value = limits.warning;

document.getElementById("saveLimits").addEventListener("click", () => {
    saveLimits({
        normal: parseInt(limitNormal.value, 10),
        warning: parseInt(limitWarning.value, 10)
    });
    renderWeek(new Date(startDateInput.value));
});

/* =========================
   ARZTMODUS
========================= */

function updateTitle() {
    document.querySelector("h2").innerText =
        doctorMode ? t("titleDoctor") : t("title");
}
function getDoctorSummary(startDate) {
        const data = loadAllData();
    const entries = Object.values(data);

    const start = new Date(startDate);
    const end = new Date(startDate);
    end.setDate(start.getDate() + 6);

    const period = `${formatDateDisplay(start)} – ${formatDateDisplay(end)}`;

    if (!entries.length) {
        return {
            period,
            avgSys: "-",
            avgDia: "-",
            avgPulse: "-"
        };
    }

    const sys = [];
    const dia = [];
    const pulse = [];

    entries.forEach(e => {
        if (e.sys) sys.push(+e.sys);
        if (e.dia) dia.push(+e.dia);
        if (e.pulse) pulse.push(+e.pulse);
    });

    const avg = arr =>
        arr.length
            ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
            : "-";

    return {
        period,
        avgSys: avg(sys),
        avgDia: avg(dia),
        avgPulse: avg(pulse)
    };
}



function updateDoctorSummary() {
    const periodEl = document.getElementById("doctorPeriod");
    const summaryEl = document.getElementById("doctorSummary");

    if (!doctorMode) {
        periodEl.textContent = "";
        summaryEl.textContent = "";
        return;
    }

    // 🔒 STARTDATUM ABSICHERN
    if (!startDateInput.value) {
        periodEl.textContent = "--";
        summaryEl.textContent = t("noValues");
        return;
    }

    const startDate = new Date(startDateInput.value);

    if (isNaN(startDate.getTime())) {
        periodEl.textContent = "--";
        summaryEl.textContent = t("noValues");
        return;
    }

    const s = getDoctorSummary(startDate);

    if (!s || !s.period) {
        periodEl.textContent = "--";
        summaryEl.textContent = t("noValues");
        return;
    }

    // ✅ JETZT GARANTIERT DEFINIERT
    periodEl.textContent = s.period;
    summaryEl.textContent =
        `Ø ${s.avgSys}/${s.avgDia} | Puls Ø ${s.avgPulse}`;
}



document.getElementById("doctorMode").addEventListener("change", e => {
    doctorMode = e.target.checked;
    document.documentElement.classList.toggle("doctor-print", doctorMode);
    renderWeek(new Date(startDateInput.value));
});

/* =========================
   SPRACHE
========================= */

langSelect.addEventListener("change", e => {
    const lang = e.target.value;
    setLanguage(lang);
    updateLanguageFlag(lang);
    renderWeek(new Date(startDateInput.value));
});

let savedLang = localStorage.getItem("language");

if (!savedLang) {
    savedLang = detectBrowserLanguage();
    localStorage.setItem("language", savedLang);
}

langSelect.value = savedLang;
setLanguage(savedLang);
updateLanguageFlag(savedLang);

/* =========================
   FLAGGEN
========================= */

function updateLanguageFlag(lang) {
    const flags = {
        de: "flags/flagde.png",
        tr: "flags/flagtr.png",
        en: "flags/flagen.png",
        fr: "flags/flagfr.png"
    };

    const img = document.getElementById("langFlag");
    if (img && flags[lang]) {
        img.src = flags[lang];
        img.alt = lang.toUpperCase();
    }
}

/* =========================
   PATIENT
========================= */

function loadPatient() {
    const data = JSON.parse(localStorage.getItem(PATIENT_KEY));
    if (!data) return;

    document.getElementById("patientNameInput").value = data.name || "";
    document.getElementById("patientBirthInput").value = data.birth || "";

    document.getElementById("patientNameValue").innerText = data.name || "–";
    document.getElementById("birthDateValue").innerText =
        data.birth ? formatDateDisplay(new Date(data.birth)) : "–";
}

document.getElementById("savePatient").addEventListener("click", () => {
    const patient = {
        name: document.getElementById("patientNameInput").value.trim(),
        birth: document.getElementById("patientBirthInput").value
    };
    localStorage.setItem(PATIENT_KEY, JSON.stringify(patient));
    loadPatient();
});
