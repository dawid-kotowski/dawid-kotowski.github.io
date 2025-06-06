import './style.css'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient("https://gwusxowacqvutyrqxqgq.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3dXN4b3dhY3F2dXR5cnF4cWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMDQ0NDIsImV4cCI6MjA2MzU4MDQ0Mn0.a3TKGAcxTXKHS8VCKLPwSm2z0HSymzlGgmiKkZPJDj4");

//#region Authentification
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
  const tabSection = document.querySelector(".tab-container")
  if (tabSection) tabSection.remove();

  await loadUsers();
}

// === Session bekommen ===
async function getUserId() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    return session.user.id;
  } else {
    console.log("Kein User in der Session")
    return null;
  }
}

// === Nutzer in Datenbank laden ===
async function insertUserIntoDatabase(userId, username) {
  const { data, error } = await supabase.from("users").select("id").eq("username", username).single();
  if (data) {
    alert("Username bereits vergeben.");
    return;
  }
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
    const tabSection = document.querySelector(".tab-container")
    if (tabSection) tabSection.remove();
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
//#endregion


//#region Spiellogik
// === Spiel Start Einstellungen ===
async function start_game() {
  let startTime = Date.now();
  const interval = setInterval(async () => {
    const now = Date.now();
    if (now - startTime > 4 * 15 * 1000) {
      clearInterval(interval);
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    console.log("Nutze hier Access-Token: ", session.access_token);
    const response = await supabase.functions.invoke("start_game", {
      method: "POST",
      headers: {
        // zwingend das aktuelle Access-Token des eingeloggten Nutzers
        "Authorization": `Bearer ${session.access_token}`,
      },
    });
    console.log(response.data);
  }, 30000); // alle 30s
}

// Flag für Game-View
let hasEnteredGameView = false;

// Hilfsfunktion zum Einblenden der Game-View
function showGameView(player1Name, player2Name) {
  document.getElementById("lobby")?.classList.add("hidden");
  const btnplayer1 = document.getElementById("player1Btn");
  if (btnplayer1) btnplayer1.textContent = player1Name;
  const btnplayer2 = document.getElementById("player1Btn");
  if (btnplayer2) btnplayer2.textContent = player1Name;
  document.getElementById("gameView")?.classList.add("visible");
  hasEnteredGameView = true;
}

// Hilfsfunktion zum Aufräumen (Game-View ausblenden, Listener entfernen)
function deleteGameView() {
  document.getElementById("gameView")?.classList.remove("visible");
  document.getElementById("lobby")?.classList.remove("hidden");
  document.getElementById("player1Btn").replaceWith(document.getElementById("player1Btn").cloneNode(true));
  document.getElementById("player2Btn").replaceWith(document.getElementById("player2Btn").cloneNode(true));
  hasEnteredGameView = false;
}

// Hilfsfunktion zum Listener Reset
function resetClickListener(id, handler) {
  const oldBtn = document.getElementById(id);
  const newBtn = oldBtn?.cloneNode(true);
  if (oldBtn && newBtn) {
    oldBtn.replaceWith(newBtn);
    newBtn.addEventListener("click", handler);
  }
}

// Button Funktion für Gewinner 1
async function onP1Click(game, currentUserId, p1) {
  // Trage winner ins Spiel ein (entweder p1 oder p2 suchen)
  const { error: gameUpdateErr } = await supabase
    .from("games")
    .update({ winner: p1 })
    .eq("id", game.id);

  if (gameUpdateErr) {
    alert("Gewinner konnte nicht registriert werden!");
    return;
  }

  // Setze den aktuellen Spieler wieder in_queue
  const { error: resetErr } = await supabase
    .from("users")
    .update({ status: "in_queue" })
    .eq("id", currentUserId);

  if (resetErr) {
    console.error("Fehler beim Zurücksetzen des Status:", resetErr);
  }

  // Spiel aus der Tablle löschen
  const { error: deleteErr } = await supabase
    .from("games")
    .delete()
    .eq("id", game.id);

  if (deleteErr) {
    console.error("Fehler beim Löschen des Spiels:", deleteErr);
  }

  // Game-View aufräumen und User-Liste neu laden
  deleteGameView();
  loadUsers();

  // Listener entfernen, damit nicht mehrfach reagiert wird
  p1ClickHandler = () => onP1Click(game, currentUserId, p1);
  p2ClickHandler = () => onP2Click(game, currentUserId, p2);
  document.getElementById("player1Btn")?.removeEventListener("click", p1ClickHandler);
  document.getElementById("player2Btn")?.removeEventListener("click", p2ClickHandler);

}

// Button Funktion für Gewinner 2
async function onP2Click(game, currentUserId, p2) {
  const { error: gameUpdateErr } = await supabase
    .from("games")
    .update({ winner: p2 })
    .eq("id", game.id);

  if (gameUpdateErr) {
    alert("Gewinner konnte nicht registriert werden!");
    return;
  }

  const { error: resetErr } = await supabase
    .from("users")
    .update({ status: "in_queue" })
    .eq("id", currentUserId);

  if (resetErr) {
    console.error("Fehler beim Zurücksetzen des Status:", resetErr);
  }

  const { error: deleteErr } = await supabase
    .from("games")
    .delete()
    .eq("id", game.id);

  if (deleteErr) {
    console.error("Fehler beim Löschen des Spiels:", deleteErr);
  }

  deleteGameView();
  loadUsers();

  p1ClickHandler = () => onP1Click(game, currentUserId, p1);
  p2ClickHandler = () => onP2Click(game, currentUserId, p2);
  document.getElementById("player1Btn")?.removeEventListener("click", p1ClickHandler);
  document.getElementById("player2Btn")?.removeEventListener("click", p2ClickHandler);
}

// === RealTime API für neue/aktualisierte Einträge in "games" ===
function subscribeToGames() {
  // Haupt-Subscription
  supabase
    .channel("realtime:games")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "games" },
      async (payload) => {
        if (payload.eventType !== "INSERT" && payload.eventType !== "UPDATE") {
          return;
        }

        const game = payload.new;
        if (!game) return;

        // Aktuelle User-ID ermitteln
        const currentUserId = await getUserId();
        if (!currentUserId) return;

        // Falls der aktuelle User nicht zu diesem Spiel gehört, abbrechen
        if (game.player1 !== currentUserId && game.player2 !== currentUserId) {
          return;
        }

        if (hasEnteredGameView) {
          return;
        }

        // Spieler-Namen aus der users-Tabelle laden
        const p1 = game.player1;
        const p2 = game.player2;
        const { data: users, error: userErr } = await supabase
          .from("users")
          .select("id, username")
          .in("id", [p1, p2]);

        if (userErr || !users) {
          console.error("Fehler beim Laden der Spielernamen:", userErr);
          return;
        }

        // In eine Map packen, um schnellen Zugriff per ID zu haben
        const userMap = {};
        users.forEach((u) => {
          userMap[u.id] = u.username;
        });

        // Game-View anzeigen
        showGameView(userMap[p1], userMap[p2]);

        // Beide Event Listener hinzufügen
        document.getElementById("player1Btn")
          .addEventListener("click", () => onP1Click(game, currentUserId, p1));
        document.getElementById("player2Btn")
          .addEventListener("click", () => onP2Click(game, currentUserId, p2));
      }
    )
    .subscribe();
}
//#endregion

// === Seite nach DOM Loaded starten === 
document.addEventListener("DOMContentLoaded", async () => {
  const { data: { session } } = await supabase.auth.getSession();
  console.log("User ID bekommen?: ", session?.user.id)
  await handleAuthState(session);
});

// Bei jedem Wechsel des Auth Status
supabase.auth.onAuthStateChange((event, session) => {
  handleAuthState(session);
});

// === Aufrufe für jeden Auth User ===
async function handleAuthState(session) {
  console.log("Handle Auth aufgerufen...")
  if (session?.user) {
    // Logout und Interface nach Auth
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
    document.getElementById("start-game-btn")?.addEventListener("click", start_game);

    // Lösche den ganzen Login Kram aus der View
    const loginTab = document.getElementById('loginTab');
    if (loginTab?.classList.contains("active")) {
      loginTab.classList.remove("active");
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm?.classList.contains("active")) {
      loginForm.classList.remove("active");
    }
    const loginSection = document.querySelector(".login-section");
    if (loginSection) loginSection.remove();
    const tabSection = document.querySelector(".tab-container")
    if (tabSection) tabSection.remove();

    await updateLoginStatus();
    await loadUsers();

    // Realtime für die Tabelle hinzufügen
    supabase
    .channel("realtime:users")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "users" },
      async (payload) => {
        loadUsers(); 
        }
    )
    .subscribe();
    
    // Bei spätem Login in die GameView nachkommen
    if (!hasEnteredGameView) {
      const { data: user, error: userError } = await supabase
          .from("users")
          .select("id, status")
          .eq("id", session.user.id)
          .single();
      
      if (user.status === "paired") {
        // Eigenes Spiel holen
        const { data: mygame, error: gameError } = await supabase
            .from("games")
            .select("*")
            .or(`player1_id.eq.${session.user.id},player2_id.eq.${session.user.id}`)
            .single();
        
        // Spieler-Namen aus der users-Tabelle laden
        const p1 = mygame.player1;
        const p2 = mygame.player2;
        const { data: users, error: userErr } = await supabase
          .from("users")
          .select("id, username")
          .in("id", [p1, p2]);

        if (userErr || !users) {
          console.error("Fehler beim Laden der Spielernamen:", userErr);
          return;
        }

        // In eine Map packen, um schnellen Zugriff per ID zu haben
        const userMap = {};
        users.forEach((u) => {
          userMap[u.id] = u.username;
        });

        // Game-View anzeigen
        showGameView(userMap[p1], userMap[p2]);
        hasEnteredGameView = true;

        // Beide Event Listener hinzufügen
        const currentUserId = session.user.id;
        document.getElementById("player1Btn")
          .addEventListener("click", () => onP1Click(mygame, currentUserId, p1));
        document.getElementById("player2Btn")
          .addEventListener("click", () => onP2Click(mygame, currentUserId, p2));
      }
    }

    // Realtime für das Userspiel-Interface hinzufügen
    subscribeToGames();

  } else {
    initializeTabs();
    resetClickListener("login-btn", login);
    resetClickListener("register-btn", register);
  }
}