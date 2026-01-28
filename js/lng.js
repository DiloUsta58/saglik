/* =========================
   LANGUAGE DEFINITIONS
========================= */

const translations = {
  de: {
    resetConfirm: "Alle gespeicherten Daten werden gelöscht.\nFortfahren?",
    ResetAllData:"! Alle Daten Löschen !",
    title: "Blutdruck Wochenprotokoll",
    h2: "Blutdruck Wochenprotokoll",
    prev: "← Zurück" ,
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
    save: "Speichern"
  },

  tr: {
    resetConfirm: "Tüm kayıtlı veriler silinecek.\nDevam edilsin mi?",
    ResetAllData:"! Tüm Kayıtları SIL !",
    title: "Tansiyon Haftalık Takip",
    h2: "Tansiyon Haftalık Takip", 
    prev: "← Geri" ,
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
    save: "Kayıt et"
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
