import './style.css'
import { createClient } from '@supabase/supabase-js'
// === Supabase-Konfiguration ===
const SUPABASE_URL = "https://gwusxowacqvutyrqxqgq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3dXN4b3dhY3F2dXR5cnF4cWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMDQ0NDIsImV4cCI6MjA2MzU4MDQ0Mn0.a3TKGAcxTXKHS8VCKLPwSm2z0HSymzlGgmiKkZPJDj4";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// === Registrierung/Login ===
async function register() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (!username || !password) return alert("Bitte beides ausfüllen!");

  // In Datenbank einfügen
  const { data, error } = await supabase.from("users").insert([
    { username, password }
  ]);

  if (error) {
    console.error("Fehler:", error);
    alert("Fehler beim Einloggen/Registrieren");
  } else {
    alert("Erfolgreich registriert!");
    loadUsers();
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

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("register-btn").addEventListener("click", register);
  loadUsers();
});