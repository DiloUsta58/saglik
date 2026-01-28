/* =========================
   Globale Referenzen
========================= */

const tableBody = document.querySelector("#bpTable tbody");
const startDateInput = document.getElementById("startDate");
// DOM-Referenzen für Grenzwerte
const limitNormal = document.getElementById("limitNormal");
const limitWarning = document.getElementById("limitWarning");
const PATIENT_KEY = "bp_patient";

/* =========================
   Zeitpunkte (sprachneutral)
========================= */

function getTimes() {
    return [
        { id: "morning", label: t("morning") },
        { id: "noon", label: t("noon") },
        { id: "evening", label: t("evening") }
    ];
}

/* =========================
   Konstanten & State
========================= */

const DAYS_IN_WEEK = 7;

const DEFAULT_LIMITS = {
    normal: 130,
    warning: 180
};

let limits = loadLimits();
let doctorMode = false;

/* =========================
   Grenzwerte
========================= */

function loadLimits() {
    return JSON.parse(localStorage.getItem("bp_limits")) || DEFAULT_LIMITS;
}

function saveLimits(newLimits) {
    limits = newLimits;
    localStorage.setItem("bp_limits", JSON.stringify(limits));
}

/* =========================
   Patienten Name Speichern
========================= */
document.getElementById("savePatient").addEventListener("click", () => {
    const patient = {
        name: document.getElementById("patientNameInput").value.trim(),
        birth: document.getElementById("patientBirthInput").value
    };

    localStorage.setItem(PATIENT_KEY, JSON.stringify(patient));
    loadPatient();
});

/* =========================
   Patienten Name Laden
========================= */
function loadPatient() {
    const data = JSON.parse(localStorage.getItem(PATIENT_KEY));
    if (!data) return;

    document.getElementById("patientNameInput").value = data.name || "";
    document.getElementById("patientBirthInput").value = data.birth || "";

    document.getElementById("patientNameValue").innerText =
        data.name || "–";

    document.getElementById("birthDateValue").innerText =
        data.birth
            ? formatDateDisplay(new Date(data.birth))
            : "–";
}


/* =========================
   Datum – Anzeige & Keys
========================= */

// Anzeigeformat: dd.mm.yyyy
function formatDateDisplay(date) {
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();
    return `${d}.${m}.${y}`;
}

// Interner Tages-Key: yyyy-mm-dd (lokal, stabil)
function formatDateISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

/* =========================
   Initialisierung
========================= */

init();

function init() {
    const today = new Date();
    startDateInput.valueAsDate = today;
    loadPatient();
    renderWeek(today);

    document.getElementById("resetData").addEventListener("click", () => {
        if (!confirm(t("resetConfirm"))) return;
        localStorage.clear();
        location.reload();
    });
    
}

/* =========================
   Tabelle rendern
========================= */

function renderWeek(startDate) {
    tableBody.innerHTML = "";

    const weekKey = getWeekKey(startDate);
    const storedData = loadWeekData(weekKey);

    for (let i = 0; i < DAYS_IN_WEEK; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        const dateKey = formatDateISO(currentDate);
        const dateDisplay = formatDateDisplay(currentDate);

        getTimes().forEach((timeObj, index) => {
            const row = document.createElement("tr");
            row.dataset.date = dateKey;
            row.dataset.time = timeObj.id;

            if (index === 0) {
                const dateCell = document.createElement("td");
                dateCell.rowSpan = 3;
                dateCell.innerText = dateDisplay;
                row.appendChild(dateCell);
            }

            row.innerHTML += `
                <td><input type="time" data-field="clock"></td>
                <td class="time">${timeObj.label}</td>
                <td><input type="number" data-field="sys"></td>
                <td><input type="number" data-field="dia"></td>
                <td><input type="number" data-field="pulse"></td>
            `;

            const storageKey = `${dateKey}_${timeObj.id}`;

            if (storedData[storageKey]) {
                const inputs = row.querySelectorAll("input");
                inputs[0].value = storedData[storageKey].clock || "";
                inputs[1].value = storedData[storageKey].sys || "";
                inputs[2].value = storedData[storageKey].dia || "";
                inputs[3].value = storedData[storageKey].pulse || "";
            }

            row.querySelectorAll("input").forEach(input => {
                input.addEventListener("input", () => {
                    validateBloodPressure(row);
                    saveCellData(startDate);
                });
            });

            if (doctorMode) {
                row.querySelectorAll("input").forEach(input => input.disabled = true);
            }

            validateBloodPressure(row);
            tableBody.appendChild(row);
        });
        
    }
    updateWeekSummary(startDate);
    updateTitle();
    updateDoctorSummary();
    updateDoctorHeader(startDate);
}

/* =========================
   Speichern / Laden
========================= */

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

function loadWeekData(weekKey) {
    return JSON.parse(localStorage.getItem(weekKey)) || {};
}

/* =========================
   Wochen-Key (UTC-sicher)
========================= */

function getWeekKey(date) {
    const d = new Date(date);
    d.setHours(12, 0, 0, 0);

    const monday = new Date(d);
    const day = monday.getDay() || 7;
    monday.setDate(monday.getDate() - day + 1);

    const y = monday.getFullYear();
    const m = String(monday.getMonth() + 1).padStart(2, "0");
    const da = String(monday.getDate()).padStart(2, "0");

    return `week-${y}-${m}-${da}`;
}

/* =========================
   Navigation
========================= */

document.getElementById("prevWeek").addEventListener("click", () => changeWeek(-7));
document.getElementById("nextWeek").addEventListener("click", () => changeWeek(7));

startDateInput.addEventListener("change", () => {
    renderWeek(new Date(startDateInput.value));
});

function changeWeek(days) {
    const date = new Date(startDateInput.value);
    date.setDate(date.getDate() + days);
    startDateInput.valueAsDate = date;
    renderWeek(date);
}

/* =========================
   Validierung
========================= */

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
    } else if (sys <= limits.warning) {
        row.classList.add("bp-warning");
        row.dataset.warned = "false";
    } else {
        row.classList.add("bp-danger");
        if (row.dataset.warned !== "true") {
            alert(t("alertCriticalTitle") + "\n\n" + t("alertCriticalText"));
            row.dataset.warned = "true";
        }
    }
}

/* =========================
   Wochen-Zusammenfassung
========================= */

function updateWeekSummary(startDate) {
    const data = loadWeekData(getWeekKey(startDate));

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
   Arztmodus
========================= */

function updateTitle() {
    document.querySelector("h2").innerText = doctorMode ? t("titleDoctor") : t("title");
}

function getDoctorSummary(startDate) {
    const data = loadWeekData(getWeekKey(startDate));
    const entries = Object.values(data);

    if (!entries.length) return null;

    const avg = arr =>
        arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : "-";

    const sys = entries.map(e => +e.sys).filter(Boolean);
    const dia = entries.map(e => +e.dia).filter(Boolean);
    const pulse = entries.map(e => +e.pulse).filter(Boolean);

    const start = new Date(startDate);
    const end = new Date(startDate);
    end.setDate(start.getDate() + 6);

    return {
        period: `${formatDateDisplay(start)} – ${formatDateDisplay(end)}`,
        avgSys: avg(sys),
        avgDia: avg(dia),
        avgPulse: avg(pulse)
    };
}

function updateDoctorSummary() {
    const el = document.getElementById("doctorSummary");
    if (!doctorMode) {
        el.innerText = "";
        return;
    }

    const s = getDoctorSummary(new Date(startDateInput.value));
    el.innerText = s
        ? `${s.period} | Ø ${s.avgSys}/${s.avgDia} | Puls Ø ${s.avgPulse}`
        : t("noValues");
}

document.getElementById("doctorMode").addEventListener("change", e => {
    doctorMode = e.target.checked;
    document.documentElement.classList.toggle("doctor-print", doctorMode);
    renderWeek(new Date(startDateInput.value));
});

/* =========================
   Sprache
========================= */

const langSelect = document.getElementById("languageSelect");

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
renderWeek(new Date(startDateInput.value));

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

if (limitNormal && limitWarning) {
    limitNormal.value = limits.normal;
    limitWarning.value = limits.warning;
}

const saveLimitsBtn = document.getElementById("saveLimits");

if (saveLimitsBtn && limitNormal && limitWarning) {
    saveLimitsBtn.addEventListener("click", () => {
        saveLimits({
            normal: parseInt(limitNormal.value, 10),
            warning: parseInt(limitWarning.value, 10)
        });
        renderWeek(new Date(startDateInput.value));
    });
}

function updateDoctorHeader(startDate) {
    const start = new Date(startDate);
    const end = new Date(startDate);
    end.setDate(start.getDate() + 6);

    document.getElementById("doctorPeriod").innerText =
        `${formatDateDisplay(start)} – ${formatDateDisplay(end)}`;
}

/* =========================
   Drucken
========================= */
function printTable() {
  window.print();
}
