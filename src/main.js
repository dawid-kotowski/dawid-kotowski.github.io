import './style.css'
import { createClient } from '@supabase/supabase-js'
// === Supabase-Konfiguration ===
const SUPABASE_URL = "https://gwusxowacqvutyrqxqgq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3dXN4b3dhY3F2dXR5cnF4cWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMDQ0NDIsImV4cCI6MjA2MzU4MDQ0Mn0.a3TKGAcxTXKHS8VCKLPwSm2z0HSymzlGgmiKkZPJDj4";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// === Registrierung ===
async function register() {
  const entered_email = document.getElementById("email").value;
  const entered_username = document.getElementById("username").value;
  const entered_password = document.getElementById("password").value;

  if (!entered_username || !entered_password || !entered_email) {
    alert("Bitte alle Felder ausfüllen!");
    return;
  }

  // Step 1: Sign up with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: entered_email,
    password: entered_password
  });

  if (authError) {
    console.error("Registrierungsfehler:", authError);
    alert("Fehler bei der Registrierung: " + authError.message);
    return;
  }

  const userId = authData?.user?.id;
  if (!userId) {
    console.error("Kein Benutzer nach Registrierung vorhanden.");
    alert("Unbekannter Fehler nach Registrierung.");
    return;
  }

  // Step 2: Add entry in the 'users' table
  const { error: dbError } = await supabase.from("users").insert([
    {
      id: userId,         // this links to auth.users
      username: entered_username
    }
  ]);

  if (dbError) {
    console.error("Fehler beim Schreiben in users-Tabelle:", dbError);
    alert("Registrierung fehlgeschlagen: Userdaten konnten nicht gespeichert werden.");
    return;
  }

  alert("Erfolgreich registriert!");
  updateLoginStatus();
  loadUsers();
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

  if (session && session.user) {
    const userId = session.user.id;

    const { data, error } = await supabase
      .from("users")
      .select("username")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Fehler beim Abrufen des Benutzernamens:", error);
      statusElement.textContent = "Angemeldet";
      return;
    }

    statusElement.textContent = `Angemeldet als ${data.username}`;
  } else {
    statusElement.textContent = "Nicht angemeldet";
  }
}

// === Initialisierung ===
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("register-btn").addEventListener("click", register);
  updateLoginStatus();
  loadUsers();
});