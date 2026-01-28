/* =========================
   LANGUAGE DEFINITIONS
========================= */

const translations = {
  de: {
    resetConfirm: "Alle gespeicherten Daten werden gelöscht.\nFortfahren?",
    ResetAllData: "! Alle Daten Löschen !",
    title: "Blutdruck Wochenprotokoll",
    h2: "Blutdruck Wochenprotokoll",
    prev: "← Zurück",
    next: "→ Vor",
    morning: "Morgens",
    noon: "Mittag",
    evening: "Abend",
    setings: "⚙️ Einstellungen",
    date: "Datum",
    clock: "Zeit",
    period: "Messzeitpunkt",
    sys: "Systolisch (mmHg)",
    dia: "Diastolisch (mmHg)",
    pulse: "Puls",
    doctorMode: "Arztmodus (nur Lesen)",
    limitN: "Normal bis:",
    limitW: "Kritisch ab:",
    normal: "Normal",
    warning: "Erhöht",
    alertCriticalTitle: "⚠️ Kritischer Blutdruckwert!",
    alertCriticalText: "Systolisch > 180 mmHg.\nBitte Ruhe bewahren und ggf. ärztliche Hilfe kontaktieren.",
    titleDoctor: "Blutdruck Wochenprotokoll – Arztansicht",
    noValues: "Keine Messwerte",
    danger: "Kritisch",
    save: "Speichern",
    patientName: "Name",
    birthDate: "Geburtsdatum",
    period: "Zeitraum"

  },

  tr: {
    resetConfirm: "Tüm kayıtlı veriler silinecek.\nDevam edilsin mi?",
    ResetAllData: "! Tüm Kayıtları SIL !",
    title: "Tansiyon Haftalık Takip",
    h2: "Tansiyon Haftalık Takip",
    prev: "← Geri",
    next: "→ İleri",
    morning: "Sabah",
    noon: "Öğle",
    evening: "Akşam",
    setings: "⚙️ Ayarlar",
    date: "Tarih",
    clock: "Saat",
    period: "Ölçüm Zamanı",
    sys: "Sistolik (mmHg)",
    dia: "Diyastolik (mmHg)",
    pulse: "Nabız",
    doctorMode: "Doktor Modu (Sadece Okuma)",
    limitN: "Normal:",
    limitW: "Kritik:",
    normal: "Normal",
    warning: "Yüksek",
    alertCriticalTitle: "⚠️ Kritik Tansiyon Değeri!",
    alertCriticalText: "Sistolik > 180 mmHg.\nLütfen sakin olun ve gerekirse doktora başvurun.",
    titleDoctor: "Tansiyon Haftalık Takip – Doktor Görünümü",
    noValues: "Ölçüm yok",
    danger: "Kritik",
    save: "Kaydet",
    patientName: "İsim",
    birthDate: "Doğumtarih",
    period: "Zaman Arası"

  },

  en: {
    resetConfirm: "All stored data will be deleted.\nDo you want to continue?",
    ResetAllData: "! Delete All Data !",
    title: "Blood Pressure Weekly Log",
    h2: "Blood Pressure Weekly Log",
    prev: "← Back",
    next: "→ Next",
    morning: "Morning",
    noon: "Noon",
    evening: "Evening",
    setings: "⚙️ Settings",
    date: "Date",
    clock: "Time",
    period: "Measurement Time",
    sys: "Systolic (mmHg)",
    dia: "Diastolic (mmHg)",
    pulse: "Pulse",
    doctorMode: "Doctor Mode (Read Only)",
    limitN: "Normal up to:",
    limitW: "Critical from:",
    normal: "Normal",
    warning: "Elevated",
    alertCriticalTitle: "⚠️ Critical Blood Pressure!",
    alertCriticalText: "Systolic > 180 mmHg.\nPlease stay calm and seek medical help if necessary.",
    titleDoctor: "Blood Pressure Weekly Log – Doctor View",
    noValues: "No measurements",
    danger: "Critical",
    save: "Save",
    patientName: "Name",
    birthDate: "Birth Date",
    period: "Periode"

  },

  fr: {
    resetConfirm: "Toutes les données enregistrées seront supprimées.\nContinuer ?",
    ResetAllData: "! Supprimer toutes les données !",
    title: "Suivi Hebdomadaire de la Tension",
    h2: "Suivi Hebdomadaire de la Tension",
    prev: "← Précédent",
    next: "→ Suivant",
    morning: "Matin",
    noon: "Midi",
    evening: "Soir",
    setings: "⚙️ Paramètres",
    date: "Date",
    clock: "Heure",
    period: "Moment de la mesure",
    sys: "Systolique (mmHg)",
    dia: "Diastolique (mmHg)",
    pulse: "Pouls",
    doctorMode: "Mode médecin (lecture seule)",
    limitN: "Normal jusqu’à :",
    limitW: "Critique à partir de :",
    normal: "Normal",
    warning: "Élevé",
    alertCriticalTitle: "⚠️ Tension critique !",
    alertCriticalText: "Systolique > 180 mmHg.\nVeuillez rester calme et consulter un médecin si nécessaire.",
    titleDoctor: "Suivi Hebdomadaire – Vue Médecin",
    noValues: "Aucune mesure",
    danger: "Critique",
    save: "Enregistrer",
    patientName: "Nom",  
    birthDate: "Date de naissance",
    period: "Période"


  }
};

/* =========================
   LANGUAGE HANDLER
========================= */

function setLanguage(lang) {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    if (translations[lang] && translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });

  localStorage.setItem("language", lang);
}

function t(key) {
  const lang = localStorage.getItem("language") || "de";
  return translations[lang][key] || key;
}

function detectBrowserLanguage() {
  const supported = ["de", "tr", "en", "fr"];

  const browserLang =
    navigator.language ||
    navigator.userLanguage ||
    "de";

  const short = browserLang.slice(0, 2).toLowerCase();

  return supported.includes(short) ? short : "de";
}
