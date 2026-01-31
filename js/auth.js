async function sha256(text) {
  const enc = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/* =========================
   ZENTRALE LOGIN-UI-STEUERUNG
========================= */
function syncLoginUI() {
  if (!loginBox || !app) return;

  if (loggedIn) {
    loginBox.style.display = "none";
    app.style.display = "block";
  } else {
    app.style.display = "none";
    loginBox.style.display = "block";
  }
}


/* =====================================================
   LOGIN / LOGOUT
===================================================== */
async function login(e) {
  if (e) e.preventDefault();

  /* =========================
     LOADER START
  ========================= */
  LoadingManager.show("Anmeldung wird geprüft…");

  const user = userInput.value.trim();
  const pass = passInput.value.trim();

  if (!window.AUTH_CONFIG || !Array.isArray(AUTH_CONFIG.users)) {
    LoadingManager.hide();
    alert("Auth-Konfiguration fehlt");
    return;
  }

  /* =========================
     HASH
  ========================= */
  const passHash = await sha256(pass);
  LoadingManager.step(20, "Zugangsdaten geprüft…");

  const account = AUTH_CONFIG.users.find(
    u => u.username === user && u.passwordHash === passHash
  );

  if (!account) {
    LoadingManager.hide();
    alert("Login fehlgeschlagen");
    return;
  }

  /* =========================
     LOGIN OK
  ========================= */
  loggedIn = true;
  isAdmin = account.role === "admin";
  editEnabled = false;

  sessionStorage.setItem("loggedIn", "true");
  sessionStorage.setItem("role", account.role);
  localStorage.setItem("editEnabled", "false");

  LoadingManager.step(20, "Benutzerrechte geladen…");

  /* =========================
     UI EINBLENDEN
  ========================= */
  loginBox.style.display = "none";
  app.style.display = "block";
  document.getElementById("lastUpdate").style.display = "block";

  LoadingManager.step(15, "Oberfläche initialisiert…");

  /* =========================
     INIT / RENDER
  ========================= */
  initCategories();
  LoadingManager.step(10, "Kategorien geladen…");

  syncAdminUI();
  LoadingManager.step(10, "Admin-UI synchronisiert…");

  renderKE();
  LoadingManager.step(10, "KE geladen…");

  renderFS();
  LoadingManager.step(10, "FS geladen…");

  renderFM();
  LoadingManager.step(5, "FM geladen…");

  loadInventurDate();
  LoadingManager.step(10, "Inventur geladen…");

  TabController.init();
  LoadingManager.step(10, "Tabs vorbereitet…");

  /* =========================
     LOGOUT-WATCHER
  ========================= */
  lastUserActivity = Date.now();
  startLogoutWatcher();

  /* =========================
     LOADER ENDE
  ========================= */
  LoadingManager.hide();
}


function logout() {
  /* =========================
     WATCHER / TIMER STOPPEN
  ========================= */
  hideLogoutTimer();
  stopLogoutWatcher();

  /* =========================
     SESSION / STATUS RESET
  ========================= */
  sessionStorage.clear();
  localStorage.removeItem("editEnabled");
  localStorage.removeItem("activeTab");

  loggedIn = false;
  isAdmin = false;
  editEnabled = false;

  /* =========================
     ZENTRALE UI-SYNC
  ========================= */
  syncAdminUI();      // versteckt Admin-UI & deaktiviert Edit

  /* =========================
     APP AUS, LOGIN AN
  ========================= */
  app.style.display = "none";
  loginBox.style.display = "block";

  /* =========================
     TAB-ZUSTAND RESET
  ========================= */
  document.querySelectorAll(".tab-btn")
    .forEach(btn => btn.classList.remove("active"));

  document.querySelectorAll(".tab-section")
    .forEach(sec => sec.classList.remove("active"));

  /* =========================
     SUCHSTATUS RESET
  ========================= */
  globalSearchTerm = "";
  const searchInput = document.getElementById("search");
  if (searchInput) searchInput.value = "";
}



function syncAdminUI() {
  /* =========================
     ADMIN-BUTTONS
  ========================= */
  document.querySelectorAll(".admin-btn").forEach(btn => {
    btn.style.display = isAdmin ? "" : "none";
  });

  /* =========================
     EDIT-MODUS STATUS
     (NUR STATUS, KEINE AUFRUFE)
  ========================= */
  if (!isAdmin) {
    editEnabled = false;
    localStorage.setItem("editEnabled", "false");
  }

  /* =========================
     TAB-SICHTBARKEIT
  ========================= */
  document.querySelectorAll(".tab-btn").forEach(btn => {
    const tab = btn.dataset.tab;

    // History nur für Admin
    if (tab === "historySectionIExport") {
      btn.style.display = isAdmin ? "" : "none";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const isLoggedIn = sessionStorage.getItem("loggedIn") === "true";
  const role = sessionStorage.getItem("role");

  if (isLoggedIn && role) {
    // ✅ SESSION OK → APP STARTEN
    loggedIn = true;
    isAdmin = role === "admin";
    editEnabled = localStorage.getItem("editEnabled") === "true";

    loginBox.style.display = "none";
    app.style.display = "block";

    syncAdminUI();
    initCategories();
    loadInventurDate();
    TabController.init();

    lastUserActivity = Date.now();
    startLogoutWatcher();
  } else {
    // ❌ KEINE SESSION → LOGIN
    loggedIn = false;
    isAdmin = false;
    editEnabled = false;

    app.style.display = "none";
    loginBox.style.display = "block";
  }
});

