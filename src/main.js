import './style.css'
import ProgressBar from 'progressbar.js'
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
  const { error: sorteddbError } = await supabase.from("users_sorted").insert([
    { id: userId, username: username }
  ]);

  if (dbError || sorteddbError) {
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
  const { data, error } = await supabase
    .from("users")
    .select("username, points")
    .order("points", { ascending: false });

  if (error) {
    console.error("Fehler beim Laden:", error);
    return;
  }

  const tbody = document.querySelector("#usertable tbody");
  tbody.innerHTML = "";

  data.forEach((user, index) => {
    const tr = document.createElement("tr");

    // Platznummer + Emoji
    let place = index + 1;
    let emoji = "";
    let cssClass = "";

    if (index === 0) {
      emoji = "🏆";
      cssClass = "top1";
    } else if (index === 1) {
      emoji = "🥈";
      cssClass = "top2";
    } else if (index === 2) {
      emoji = "🥉";
      cssClass = "top3";
    }

    tr.innerHTML = `
      <td>${place}. ${emoji}</td>
      <td>${user.username}</td>
      <td>${user.points}</td>
    `;

    if (cssClass) {
      tr.classList.add(cssClass);
    }

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

      const AdminPanel = document.getElementById("adminPanel");
      const TimerPanel = document.getElementById("countdown");
      if (userData.role === "admin") {
        // Hier Admin Scheiß reinmachen
        if (AdminPanel?.classList.contains("hidden")) {
          AdminPanel?.classList.remove("hidden");
        }
        if (TimerPanel?.classList.contains("hidden")) {
          TimerPanel?.classList.remove("hidden");
        }
      }
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

  loginTab?.addEventListener('click', () => {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
  });

  registerTab?.addEventListener('click', () => {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.classList.add('active');
    loginForm.classList.remove('active');
  });

  // Standardmäßig Login anzeigen
  loginTab?.classList.add('active');
  registerTab?.classList.remove('active');
  loginForm?.classList.add('active');
  registerForm?.classList.remove('active');
}
//#endregion


//#region Spiellogik
// === Spiel Start Einstellungen ===
let round = 0;
let countdownBar = null;
async function start_game() {
  round++;
  await clearAllGames();

  // Guard gegen ungerade Spieleranzahl
  const ownid = await getUserId();
  console.log("Got own Id ", ownid);
  const {data: users_in_queue, error: userErr} = await supabase
    .from("users_sorted")
    .select("id")
    .neq("id", ownid);
  
  if (users_in_queue.length % 2 !== 0) alert('Ungerade Anzahl an Spielern! Matchmaking nicht möglich.');

  const duration = 600; // Sekunden für eine Runde (10 minuten gerade)

  // Progress Bar einfügen
  if (!countdownBar) {
    countdownBar = new ProgressBar.Line('#timer-bar', {
      strokeWidth: 4,
      duration: duration * 1000,
      color: '#84b9ff',
      trailColor: '#444',
      trailWidth: 2,
      svgStyle: { width: '100%', height: '20px' },
      text: { style: { color: '#fff', position: 'absolute', right: '0', top: '-1.5rem', padding: 0 } },
      step: (state, bar) => {
        const remaining = Math.ceil((1 - bar.value()) * duration);
        document.getElementById('countdown').innerText = `Runde: ${round} gestartet mit ${remaining}s verbleibend`;
      }
    });
  } else {
    countdownBar.destroy();
    countdownBar = new ProgressBar.Line('#timer-bar', {
      strokeWidth: 4,
      duration: duration * 1000,
      color: '#84b9ff',
      trailColor: '#444',
      trailWidth: 2,
      svgStyle: { width: '100%', height: '20px' },
      text: { style: { color: '#fff', position: 'absolute', right: '0', top: '-1.5rem', padding: 0 } },
      step: (state, bar) => {
        const remaining = Math.ceil((1 - bar.value()) * duration);
        document.getElementById('countdown').innerText = `Runde: ${round} gestartet mit ${remaining}s verbleibend`;
      }
    });
  }
  countdownBar.animate(1.0);
  
  // Edge Funktion aktivieren
  const { data: { session } } = await supabase.auth.getSession();
  const {data, error } = await supabase.functions.invoke('alt_start_game', {
    body: { name: 'Functions', round: round},
  })
  if (error) {
    console.error('EdgeFunctionError', error);
  } else {
    console.log("alt_start_game aufgerufen in Runde ", round);
  }
}

// Flag für Game-View
let hasEnteredGameView = false;

// Hilfsfunktion zum alle Spiele aus SQL löschen, falls nötig
async function clearAllGames() {
  console.log("Clear Funktion aufgerufen. Erwarte löschen aller Spiele...");
  const myid = await getUserId();
  const { error: userErr } = await supabase
    .from("users")
    .update({ status: "in_queue" })
    .neq("id", myid);
  if (userErr) {
    console.error("Fehler beim Zurücksetzen der Benutzerstatus:", userErr);
  } else {
    console.log("Alle Spieler wieder auf in_queue gesetzt.")
  }

  const { error: gameErr } = await supabase.rpc("delete_all_games")
  if (gameErr) {
    console.error("Fehler beim Löschen der Spiele:", gameErr);
  } else {
    console.log("Alle Spiele erfolgreich gelöscht");
  }
}

// Hilfsfunktion zum Einblenden der Game-View
function showGameView(player1Name, player2Name) {
  const userTable = document.getElementById("usertabletab");
  if (!userTable?.classList.contains("hidden")) userTable.classList.add("hidden");
  document.getElementById("lobby")?.classList.add("hidden");
  const btnplayer1 = document.getElementById("player1Btn");
  if (btnplayer1) btnplayer1.textContent = player1Name;
  const btnplayer2 = document.getElementById("player2Btn");
  if (btnplayer2) btnplayer2.textContent = player2Name;
  document.getElementById("gameView")?.classList.add("visible");
  hasEnteredGameView = true;
}

// Hilfsfunktion zum Aufräumen (Game-View ausblenden, Listener entfernen)
async function deleteGameView() {
  const userTable = document.getElementById("usertabletab");
  if (userTable?.classList.contains("hidden")) userTable.classList.remove("hidden");
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

// Setze schonmal beide Funktionen für den Click
let p1ClickHandler = null;
let p2ClickHandler = null;

// Button Funktion für Gewinner 1
async function onP1Click(game, currentUserId, p1) {

  // Gewinner checken
  const winner = game.winner;

  if (!winner) {
    const {error: updateWinnerError } = await supabase
      .from("games")
      .update({ winner: p1 })
      .eq("id", game.id);
    
    if (updateWinnerError) {
      console.log("Fehler beim Winner Update.");
    }
  } else {
    if (winner && winner === p1) { 
      // Trage plus Punkt für Gewinner ein
      const { error: updateError } = await supabase
      .rpc("increment_user_points", { uid: p1, delta: 1 });

      if (updateError) {
        alert("Gewinner konnte nicht registriert werden!");
        return;
      }
      console.log("Gewinner eingetragen");
    } else {
      alert("Na toll, weil ihr euch uneinig wart, kriegt keiner einen Punkt.");
    }

    // Spiel aus der Tablle löschen
    const { error: deleteErr } = await supabase
    .from("games")
    .delete()
    .eq("id", game.id);

    if (deleteErr) {
      console.error("Fehler beim Löschen des Spiels:", deleteErr);
    }
  }

  // Setze den aktuellen Spieler wieder in_queue
  const { error: resetErr } = await supabase
  .from("users")
  .update({ status: "in_queue" })
  .eq("id", currentUserId);

  if (resetErr) {
    console.error("Fehler beim Zurücksetzen des Status:", resetErr);
  }

  // Game-View aufräumen und User-Liste neu laden
  await deleteGameView();
  loadUsers();
}

// Button Funktion für Gewinner 2
async function onP2Click(game, currentUserId, p2) {

  const winner = game.winner;
  
  if (!winner) {
    const {error: updateWinnerError } = await supabase
      .from("games")
      .update({ winner: p2 })
      .eq("id", game.id);
    
    if (updateWinnerError) {
      console.log("Fehler beim Winner Update.");
    }
  } else {
    if (winner && winner === p2) { 

      const { error: updateError } = await supabase
      .rpc("increment_user_points", { uid: p2, delta: 1 });

      if (updateError) {
        alert("Gewinner konnte nicht registriert werden!");
        return;
      }
      console.log("Gewinner eingetragen");
    } else {
      alert("Na toll, weil ihr euch uneinig wart, kriegt keiner einen Punkt.");
    }

    const { error: deleteErr } = await supabase
      .from("games")
      .delete()
      .eq("id", game.id);

    if (deleteErr) {
      console.error("Fehler beim Löschen des Spiels:", deleteErr);
    }
  }


  const { error: resetErr } = await supabase
    .from("users")
    .update({ status: "in_queue" })
    .eq("id", currentUserId);

  if (resetErr) {
    console.error("Fehler beim Zurücksetzen des Status:", resetErr);
  }

  await deleteGameView();
  loadUsers();
  
}

async function end_game() {
  document.getElementById("rules-board")?.classList.add("hidden");
  document.getElementById("status")?.classList.add("hidden");
  const countdownBar = document.getElementById("countdown");
  if (!countdownBar?.classList.contains("hidden")) countdownBar.classList.add("hidden");
  document.getElementById("timerbar")?.classList.add("hidden");

  await loadUsers();
}
//#endregion

// === Seite nach DOM Loaded starten === 
document.addEventListener("DOMContentLoaded", async () => {
  const { data: { session } } = await supabase.auth.getSession();
  console.log("User ID bekommen?: ", session?.user.id)

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
  document.getElementById("determine-winner-btn")?.addEventListener("click", end_game);

  // Deal with Authentification
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
    // Sichergehen mit dem Logout Buttom
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn?.classList.contains("hidden")) logoutBtn?.classList.remove("hidden");
    // Lösche den ganzen Login Kram aus der View
    const loginText = document.getElementById('login-text');
    if (!loginText?.classList.contains("hidden")) {
      loginText.classList.add("hidden");
    }
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

    // === Realtime für die Tabelle hinzufügen ===
    supabase
    .channel("realtime:users")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "users" },
      async (payload) => {
        console.log("Subscribe zum User Table wurde aufgerufen ...");
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
        console.log("User hat schon ein Match ...");
        const { data: mygame, error: gameError } = await supabase
            .from("games")
            .select("*")
            .or(`player1.eq.${session.user.id},player2.eq.${session.user.id}`)
            .maybeSingle();
        
        // Spieler-Namen aus der users-Tabelle laden
        if (!mygame || gameError) {
          console.log("Kein Spiel trotz paired Status gefunden.");

          const { error: resetErr } = await supabase
          .from("users")
          .update({ status: "in_queue" })
          .eq("id", session.user.id);

          if (resetErr) {
            console.error("Fehler beim Zurücksetzen des Status:", resetErr);
          }
          console.log("Wieder auf in_queue gesetzt.")
          return;
        }
        console.log("Spiel gefunden, Spiel ID: ", mygame.id);
        const p1 = mygame.player1;
        const p2 = mygame.player2;
        const { data: users, error: userErr } = await supabase
          .from("users_sorted")
          .select("id, username")
          .in("id", [p1, p2]);

        if (userErr || !users) {
          console.error("Fehler beim Laden der Spielernamen:", userErr);
          return;
        }

        // Keyword laden
        const { data: keyword, error: keywordErr } = await supabase.rpc("get_random_keyword");
        if (keywordErr) {
          console.error("Konnte kein Keyword finden.");
        } else if (keyword) {
          document.getElementById("player-keyword").textContent = keyword;
        }

        // In eine Map packen, um schnellen Zugriff per ID zu haben
        const userMap = {};
        users.forEach((u) => {
          userMap[u.id] = u.username;
        });

        // Game-View anzeigen
        showGameView(userMap[p1], userMap[p2]);

        // Beide Event Listener hinzufügen
        const currentUserId = session.user.id;
        p1ClickHandler = () => onP1Click(mygame, currentUserId, p1);
        p2ClickHandler = () => onP2Click(mygame, currentUserId, p2);
        resetClickListener("player1Btn", p1ClickHandler);
        resetClickListener("player2Btn", p2ClickHandler);
      }
    }

    // === Realtime für das Userspiel-Interface hinzufügen ===
    supabase
      .channel("realtime:games")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "games" },
        async (payload) => {
          const { data: userStatus, error: statusError} = await supabase
                .from("users")
                .select("id, status")
                .eq("id", session.user.id)
                .single();
          console.log("Subscribe zum Games Table wurde aufgerufen mit USer Status ", userStatus.status);
          // Sichergehen, dass der Spieler noch aktiv ist      
          if (userStatus.status === "in_queue") {
            console.log("Überspringt realtime:games, da ", userStatus.status, ". Flag für GameView ist ", hasEnteredGameView);
            return;
          }

          if (payload.eventType === "DELETE") {
            if (hasEnteredGameView) {
              // Eigenes Spiel holen
              console.log("User hat schon ein Match ...");
              const { data: mygame, error: gameError } = await supabase
                  .from("games")
                  .select("*")
                  .or(`player1.eq.${session.user.id},player2.eq.${session.user.id}`)
                  .maybeSingle();
              
              // Mein GameView löschen, falls mein Spiel entfernt wurde
              if (!mygame || gameError) {
                console.log("Kein Spiel gefunden.");
      
                const { error: resetErr } = await supabase
                .from("users")
                .update({ status: "in_queue" })
                .eq("id", session.user.id);
      
                if (resetErr) {
                  console.error("Fehler beim Zurücksetzen des Status:", resetErr);
                }
                console.log("Wieder auf in_queue gesetzt.")

                deleteGameView();
              } else {
                console.log("Delete eines Games stattgefunden, aber wohl nicht das eigene Spiel.");
              }
            }
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
            .from("users_sorted")
            .select("id, username")
            .in("id", [p1, p2]);
  
          if (userErr || !users) {
            console.error("Fehler beim Laden der Spielernamen:", userErr);
            return;
          }

          // Keyword laden
          const { data: keyword, error: keywordErr } = await supabase.rpc("get_random_keyword");
          if (keywordErr) {
            console.error("Konnte kein Keyword finden.");
          } else if (keyword) {
            document.getElementById("player-keyword").textContent = keyword;
          }
  
          // In eine Map packen, um schnellen Zugriff per ID zu haben
          const userMap = {};
          users.forEach((u) => {
            userMap[u.id] = u.username;
          });
  
          // Game-View anzeigen
          console.log("Zeige GameView für ", userMap[p1], userMap[p2])
          showGameView(userMap[p1], userMap[p2]);
  
          // Beide Event Listener hinzufügen
          p1ClickHandler = () => onP1Click(game, currentUserId, p1);
          p2ClickHandler = () => onP2Click(game, currentUserId, p2);
          resetClickListener("player1Btn", p1ClickHandler);
          resetClickListener("player2Btn", p2ClickHandler);
        }
      )
      .subscribe();
    

  } else {
    initializeTabs();
    document.getElementById("logout-btn")?.classList.add("hidden");
    resetClickListener("login-btn", login);
    resetClickListener("register-btn", register);
  }
}