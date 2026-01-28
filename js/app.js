const tableBody = document.querySelector("#bpTable tbody");
const startDateInput = document.getElementById("startDate");

const TIMES = ["Morgens", "Mittag", "Abend"];
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

// Initialisierung
init();

function init() {
    const today = new Date();
    startDateInput.valueAsDate = today;
    renderWeek(today);
}

// Tabelle für 7 Tage erzeugen
function renderWeek(startDate) {
    tableBody.innerHTML = "";

    const weekKey = getWeekKey(startDate);
    const storedData = loadWeekData(weekKey);

    for (let i = 0; i < DAYS_IN_WEEK; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        const dateKey = formatISO(currentDate);
        const dateDisplay = formatDE(currentDate);

        TIMES.forEach((time, index) => {
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
                <td class="time">${time}</td>
                <td><input type="number" data-field="sys"></td>
                <td><input type="number" data-field="dia"></td>
                <td><input type="number" data-field="pulse"></td>
            `;

            const storageKey = `${dateKey}_${time}`;

            if (storedData[storageKey]) {
                const inputs = row.querySelectorAll("input");
                inputs[0].value = storedData[storageKey].sys;
                inputs[1].value = storedData[storageKey].dia;
                inputs[2].value = storedData[storageKey].pulse;
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

function formatDE(date) {
    return date.toLocaleDateString("de-DE");
}

function formatISO(date) {
    return date.toISOString().split("T")[0];
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
            sys: inputs[0].value,
            dia: inputs[1].value,
            pulse: inputs[2].value
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
    return "week_" + formatDate(date);
}

// Datum formatieren
function formatDate(date) {
    return date.toISOString().split("T")[0];
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
                "⚠️ Kritischer Blutdruckwert!\n\n" +
                "Systolisch > 180 mmHg.\n" +
                "Bitte Ruhe bewahren und ggf. ärztliche Hilfe kontaktieren."
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
        <span>🟢 Normal: ${normal}</span>
        <span>🟡 Erhöht: ${warning}</span>
        <span>🔴 Kritisch: ${danger}</span>
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

/* Verhalten umsetzen */
document.getElementById("doctorMode").addEventListener("change", e => {
    doctorMode = e.target.checked;

    document.documentElement.classList.toggle(
        "doctor-print",
        doctorMode
    );

    renderWeek(new Date(startDateInput.value));
});

/* Arzt-Zusammenfassung */
function getDoctorSummary(startDate) {
    const data = loadWeekData(getWeekKey(startDate));
    const values = Object.values(data).map(e => parseInt(e.sys, 10)).filter(Boolean);

    if (!values.length) return "Keine Messwerte";

    const avg = Math.round(values.reduce((a, b) => a + b) / values.length);
    const max = Math.max(...values);

    return `Ø ${avg} mmHg | Max ${max} mmHg`;
}

function updateTitle() {
    const title = document.querySelector("h2");
    title.innerText = doctorMode
        ? "Blutdruck Wochenprotokoll – Arztansicht"
        : "Blutdruck Wochenprotokoll";
}
