import './style.css'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient("https://gwusxowacqvutyrqxqgq.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3dXN4b3dhY3F2dXR5cnF4cWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMDQ0NDIsImV4cCI6MjA2MzU4MDQ0Mn0.a3TKGAcxTXKHS8VCKLPwSm2z0HSymzlGgmiKkZPJDj4");

// === Registrierung ===
async function register() {
  const email = document.getElementById("regEmail").value;
  const username = document.getElementById("regUsername").value;
  const password = document.getElementById("regPassword").value;

  if (!username || !password || !email) {
    alert("Bitte alle Felder ausfüllen!");
    return;
  }
  console.log("Registrierungs-Funktion aufgerufen mit", email, username, password);

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    console.error("Registrierungsfehler: " + error.message) 
    alert("Registrierungsfehler: " + error.message)
  } else if(!data?.user) {
    alert("Registrierung fehlgeschlagen: Passwort zu schwach oder Netzwerkfehler");
    return;
  } else {
    console.log("Registrierung in Auth erfolreich!")
    await insertUserIntoDatabase(data.user.id, username);
    await updateLoginStatus();  
    alert("Registrierung erfolgreich!");
  }
  await loadUsers();
}

// === Login ===
async function login() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  if (!password || !email) {
    alert("Bitte alle Felder ausfüllen!");
    return;
  }
  console.log("Login-Funktion aufgerufen mit", email, password);

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    alert("Loginfehler: " + error)
  }
  await updateLoginStatus();
  alert("Login erfolgreich!")

  document.getElementById('loginTab')?.classList.remove('active');
  document.getElementById('loginForm')?.classList.remove('active');
  const loginSection = document.querySelector(".login-section");
  if (loginSection) loginSection.remove();

  await loadUsers();
}

// === Nutzer in Datenbank laden ===
async function insertUserIntoDatabase(userId, username) {
  const { error: dbError } = await supabase.from("users").insert([
    { id: userId, username: username, points: 0, role: 'user' }
  ]);

  if (dbError) {
    console.error("Fehler beim Schreiben in users-Tabelle:", dbError);
    alert("Registrierung fehlgeschlagen: Userdaten konnten nicht gespeichert werden.");
  } else {
    console.log("User in Datenbank eingetragen!")
    document.getElementById('loginTab')?.classList.remove('active');
    document.getElementById('loginForm')?.classList.remove('active');
    const loginSection = document.querySelector(".login-section");
    if (loginSection) loginSection.remove();
  }
}

// === Nutzer laden ===
async function loadUsers() {
  const { data, error } = await supabase.from("users").select("username, created_at");
  if (error) {
    console.error("Fehler beim Laden:", error);
    return;
  }

  const tbody = document.querySelector("#usertable tbody");
  tbody.innerHTML = "";
  data.forEach(user => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${user.username}</td><td>${new Date(user.created_at).toLocaleString()}</td>`;
    tbody.appendChild(tr);
  });
}

// === Login-Status anzeigen ===
async function updateLoginStatus() {
  const { data: { session } } = await supabase.auth.getSession();
  const statusElement = document.getElementById("status");

  if (session?.user) {
    const userId = session.user.id;

    const { data: userData, error } = await supabase
      .from("users")
      .select("username, role")
      .eq("id", userId)
      .single();

    if (userData) {
      statusElement.textContent = `Angemeldet als ${userData.username} (${userData.role})`;
    }

    if (userData.role === "admin") {
      // Hier Admin Scheiß reinmachen
      document.getElementById("adminPanel")?.classList.remove("hidden");
    }

  } else {
    statusElement.textContent = "Nicht angemeldet";
  }
}

// === Tabs initialisieren ===
function initializeTabs() {
  const loginTab = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  loginTab.addEventListener('click', () => {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
  });

  registerTab.addEventListener('click', () => {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.classList.add('active');
    loginForm.classList.remove('active');
  });

  // Standardmäßig Login anzeigen
  loginTab.classList.add('active');
  registerTab.classList.remove('active');
  loginForm.classList.add('active');
  registerForm.classList.remove('active');
}

// === Seite initialisieren ===
document.addEventListener("DOMContentLoaded", async () => {
  initializeTabs();

  document.getElementById("register-btn")?.addEventListener("click", register);
  document.getElementById("login-btn")?.addEventListener("click", login);
  document.getElementById("logout-btn")?.addEventListener("click", async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Fehler beim Ausloggen:", error);
      alert("Fehler beim Ausloggen.");
    } else {
      alert("Erfolgreich ausgeloggt.");
      location.reload();
    }
  });

  await updateLoginStatus();
  await loadUsers();
});