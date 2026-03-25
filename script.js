// ==========================================
// YACHTMASTER PORTFOLIO
// ==========================================

// ---- state ----
const cardPages = ["about", "projects", "achievements", "contact"];
let currentSection = "home";
let currentPageIndex = 0;
let isAnimating = false;
let currentTheme = "light";
let bezelAngle = 0;

const aceData = {
  about: { suit: "♠", color: "black", name: "ABOUT" },
  projects: { suit: "♥", color: "red", name: "PROJECTS" },
  achievements: { suit: "♦", color: "red", name: "AWARDS" },
  contact: { suit: "♣", color: "black", name: "CONTACT" },
};
const suits = [
  { symbol: "♣", class: "" },
  { symbol: "♥", class: "red" },
  { symbol: "♦", class: "red" },
  { symbol: "♠", class: "" },
];
let suitIndex = 0;

function cycleSuit() {
  const face = document.querySelector(".flip-card-face");
  if (!face) return;
  suitIndex = (suitIndex + 1) % suits.length;
  face.textContent = suits[suitIndex].symbol;
  face.dataset.suit = suits[suitIndex].symbol;
  face.className = "flip-card-face " + suits[suitIndex].class;
}

const sectionAngles = {
  home: 0,
  contact: 0,
  about: 90,
  projects: 180,
  achievements: 270,
};

// ==========================================
// BEZEL MARKERS
// ==========================================
(function generateBezelMarkers() {
  const container = document.getElementById("bezelMarkers");
  if (!container) return;
  for (let i = 0; i < 60; i++) {
    const isHour = i === 0 || i === 15 || i === 30 || i === 45;
    const mark = document.createElement("div");
    mark.classList.add("bezel-mark");
    if (isHour) {
      mark.classList.add("hour");
    } else if (i % 5 === 0) {
      mark.classList.add("main");
      mark.setAttribute("data-num", String(i));
      mark.style.setProperty("--mark-angle", i * 6 + "deg");
    }
    container.appendChild(mark);
  }
})();

// ==========================================
// THEME
// ==========================================
document.getElementById("themeToggle")?.addEventListener("click", () => {
  currentTheme = currentTheme === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", currentTheme);
  document.querySelector(".toggle-icon").textContent =
    currentTheme === "light" ? "☀️" : "🌙";
});

// ==========================================
// CLOCK
// ==========================================
function pad(n) {
  return String(n).padStart(2, "0");
}
function setHand(id, deg) {
  const el = document.getElementById(id);
  if (el) el.style.transform = "rotate(" + deg + "deg)";
}
function updateClock() {
  const now = new Date();
  const h = now.getHours(),
    m = now.getMinutes(),
    s = now.getSeconds();
  const el = document.getElementById("miniTime");
  if (el) el.textContent = pad(h) + ":" + pad(m) + ":" + pad(s);
  const dn = document.getElementById("dateNum");
  if (dn) dn.textContent = pad(now.getDate());
  if (!isAnimating) {
    setHand("secondHand", (s / 60) * 360);
    setHand("minuteHand", ((m + s / 60) / 60) * 360);
    setHand("hourHand", (((h % 12) + m / 60) / 12) * 360);
  }
}
updateClock();
setInterval(updateClock, 1000);

// ==========================================
// BEZEL + DIAL ROTATION
// ==========================================
function rotateBezelAndDial(targetAngle) {
  const bezel = document.getElementById("bezel");
  const dial = document.getElementById("dial");
  if (!bezel || !dial) return Promise.resolve();
  return new Promise((resolve) => {
    const start = bezelAngle;
    let diff = targetAngle - start;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    const stepSize = 6;
    const steps = Math.max(1, Math.round(Math.abs(diff) / stepSize));
    let step = 0;
    const iv = setInterval(() => {
      step++;
      if (step >= steps) {
        clearInterval(iv);
        bezelAngle = targetAngle;
        applyRotation(targetAngle);
        resolve();
        return;
      }
      applyRotation(start + (diff / steps) * step);
    }, 30);
  });
}
function applyRotation(deg) {
  const markers = document.getElementById("bezelMarkers");
  if (markers) markers.style.transform = "rotate(" + deg + "deg)";
}

// ==========================================
// HANDS
// ==========================================
function animateHands(targetDeg) {
  return new Promise((resolve) => {
    isAnimating = true;
    const hands = ["hourHand", "minuteHand", "secondHand"];
    hands.forEach((id, i) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.transition =
        "transform " + (1.8 - i * 0.1) + "s cubic-bezier(0.25,0.46,0.45,0.94)";
      el.style.transform = "rotate(" + targetDeg + "deg)";
    });
    setTimeout(() => {
      hands.forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.style.transition = "transform 0.3s linear";
      });
      isAnimating = false;
      resolve();
    }, 1900);
  });
}

// ==========================================
// ACE ANIMATIONS
// ==========================================
function aceShiftAnimation() {
  return new Promise((resolve) => {
    const left = document.getElementById("leftAce");
    const right = document.getElementById("rightAce");
    left.classList.add("shift-in");
    right.classList.add("shift-in");
    setTimeout(() => {
      left.classList.remove("shift-in");
      right.classList.remove("shift-in");
      setTimeout(resolve, 420);
    }, 360);
  });
}

async function aceShuffleAnimation() {
  const overlay = document.getElementById("shuffleOverlay");
  const inner = overlay.querySelector(".flip-card-inner");
  const face = overlay.querySelector(".flip-card-face");
  if (!overlay || !inner || !face) return;
  overlay.classList.remove("hidden");
  suitIndex = 0;
  face.textContent = suits[0].symbol;
  face.className = "flip-card-face " + suits[0].class;
  inner.style.animationPlayState = "running";
  const interval = setInterval(cycleSuit, 250);
  await new Promise((r) => setTimeout(r, 800));
  clearInterval(interval);
  inner.style.animationPlayState = "paused";
  overlay.classList.add("hidden");
}

// ==========================================
// UPDATE ACES
// ==========================================
function updateAces() {
  const prev =
    cardPages[(currentPageIndex - 1 + cardPages.length) % cardPages.length];
  const next = cardPages[(currentPageIndex + 1) % cardPages.length];
  setAce("left", prev);
  setAce("right", next);
}
function setAce(side, page) {
  const data = aceData[page];
  if (!data) return;
  const suitEl = document.getElementById(side + "Suit");
  const nameEl = document.getElementById(side + "Name");
  if (suitEl) {
    suitEl.textContent = data.suit;
    suitEl.className = "ace-suit " + data.color;
  }
  if (nameEl) nameEl.textContent = data.name;
  document.getElementById(side + "Ace").setAttribute("data-page", page);
}

// ==========================================
// SHOW / HIDE
// ==========================================
function showWatch() {
  document.getElementById("watchScene").classList.remove("minimized");
  document.getElementById("contentZone").classList.add("hidden");
  document.getElementById("homeButton").classList.add("hidden");
}
function showContent() {
  document.getElementById("watchScene").classList.add("minimized");
  document.getElementById("contentZone").classList.remove("hidden");
  document.getElementById("homeButton").classList.remove("hidden");
}

// ==========================================
// SHOW PAGE — defined before typewriter wraps it
// ==========================================
var showPage = function (pageName) {
  document.querySelectorAll(".page").forEach((p) => p.classList.add("hidden"));
  const target = document.querySelector('.page[data-page="' + pageName + '"]');
  if (target) target.classList.remove("hidden");
};

// ==========================================
// TERMINAL TYPEWRITER
// Wraps showPage — must come AFTER showPage is defined
// ==========================================
const terminalLines = {
  termCmd1: "connect --list",
  termCmd2: "connect --email",
  termCmd3: "connect --linkedin",
  termCmd4: "connect --github",
  termCmd5: "",
};
const terminalDelays = {
  termCmd1: 200,
  termCmd2: 900,
  termCmd3: 1700,
  termCmd4: 2500,
  termCmd5: 3300,
};
let terminalPlayed = false;

function typeTerminal() {
  if (terminalPlayed) return;
  terminalPlayed = true;
  Object.entries(terminalLines).forEach(([id, text]) => {
    const el = document.getElementById(id);
    if (!el || text === "") return;
    const delay = terminalDelays[id] || 0;
    const perChar = 55;
    setTimeout(() => {
      let i = 0;
      const iv = setInterval(() => {
        el.textContent = text.slice(0, ++i);
        if (i >= text.length) clearInterval(iv);
      }, perChar);
    }, delay);
  });
}

const _origShowPage = showPage;
showPage = function (pageName) {
  _origShowPage(pageName);
  if (pageName === "contact") {
    terminalPlayed = false;
    typeTerminal();
  }
};

// ==========================================
// NAVIGATE
// ==========================================
async function navigateToSection(section) {
  if (isAnimating) return;
  if (section === currentSection) return;
  isAnimating = true;
  const target = sectionAngles[section];
  await rotateBezelAndDial(target !== undefined ? target : 0);
  await animateHands(target !== undefined ? target : 0);
  await aceShuffleAnimation();
  if (section === "home") {
    const contentZone = document.getElementById("contentZone");
    if (!contentZone.classList.contains("hidden")) await aceShiftAnimation();
    showWatch();
  } else {
    const idx = cardPages.indexOf(section);
    if (idx !== -1) {
      currentPageIndex = idx;
      updateAces();
      showPage(section);
      showContent();
      await aceShiftAnimation();
    }
  }
  currentSection = section;
  isAnimating = false;
}

// ==========================================
// ACE CLICK
// ==========================================
async function aceClicked(side) {
  if (isAnimating) return;
  isAnimating = true;
  const ace = document.getElementById(side + "Ace");
  const page = ace?.getAttribute("data-page");
  if (!page) {
    isAnimating = false;
    return;
  }
  const idx = cardPages.indexOf(page);
  if (idx === -1) {
    isAnimating = false;
    return;
  }
  await aceShuffleAnimation();
  currentPageIndex = idx;
  currentSection = page;
  updateAces();
  showPage(page);
  isAnimating = false;
}

// ==========================================
// HOME BUTTON
// ==========================================
document.getElementById("homeButton")?.addEventListener("click", async () => {
  if (isAnimating) return;
  isAnimating = true;
  await aceShuffleAnimation();
  showWatch();
  currentSection = "home";
  isAnimating = false;
});

// ==========================================
// DIAL BUTTON CLICKS
// ==========================================
document.querySelectorAll(".dial-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const section = btn.getAttribute("data-section");
    if (section) navigateToSection(section);
  });
});

// ==========================================
// MOBILE NAV
// ==========================================
document.querySelectorAll(".mobile-nav button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const section = btn.getAttribute("data-section");
    if (!section) return;
    showPage(section);
    showContent();
    currentSection = section;
  });
});

// ==========================================
// ACE CLICKS
// ==========================================
document
  .getElementById("leftAce")
  ?.addEventListener("click", () => aceClicked("left"));
document
  .getElementById("rightAce")
  ?.addEventListener("click", () => aceClicked("right"));

// ==========================================
// SUB-PAGE BUTTONS
// ==========================================
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn");
  if (!btn || isAnimating) return;
  const page = btn.getAttribute("data-page");
  if (!page) return;
  if (document.querySelector(`.page[data-page="${page}"]`)) {
    showPage(page);
    showContent();
    return;
  }
  loadDynamicPage(page);
});

function loadDynamicPage(name) {
  const pages = {
    "demo-1": {
      title: "Neural Style Transfer — Demo",
      body: `<p class="intro">Real-time artistic style transfer using deep CNNs.</p>`,
    },
    "demo-2": {
      title: "Time Series Forecasting — Demo",
      body: `<p class="intro">LSTM model predicting market trends with 87% accuracy.</p>`,
    },
    "demo-3": {
      title: "Multi-lingual NLP — Demo",
      body: `<p class="intro">Transformer-based sentiment analysis across 15+ languages.</p>`,
    },
    kaggle: {
      title: "Kaggle Competition History",
      body: `<p class="intro">Competitive machine learning achievements.</p>`,
    },
    paper: {
      title: "Research Publication",
      body: `<p class="intro">Novel attention mechanisms for efficient transformers.</p>`,
    },
    github: {
      title: "GitHub Contributions",
      body: `<p class="intro">Open source contributions to major ML frameworks.</p>`,
    },
  };
  const content = pages[name] || {
    title: "Content",
    body: "<p>Coming soon.</p>",
  };
  document.querySelectorAll(".page").forEach((p) => p.classList.add("hidden"));
  const dynTitle = document.getElementById("dynamicTitle");
  const dynBody = document.getElementById("dynamicBody");
  if (dynTitle) dynTitle.textContent = content.title;
  if (dynBody) dynBody.innerHTML = content.body;
  const dynPage = document.querySelector('.page[data-page="dynamic"]');
  if (dynPage) dynPage.classList.remove("hidden");
}

// ==========================================
// KEYBOARD
// ==========================================
document.addEventListener("keydown", (e) => {
  if (isAnimating) return;
  const sectionMap = {
    1: "home",
    2: "about",
    3: "projects",
    4: "achievements",
  };
  if (sectionMap[e.key]) {
    navigateToSection(sectionMap[e.key]);
    return;
  }
  if (e.key.toLowerCase() === "h" || e.key === "Escape") {
    navigateToSection("home");
    return;
  }
  if (currentSection !== "home") {
    if (e.key === "ArrowLeft") aceClicked("left");
    if (e.key === "ArrowRight") aceClicked("right");
  }
});

// ==========================================
// INIT
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  showWatch();
  updateAces();
  console.log(
    "%c⌚ ISHAN KULKARNI PORTFOLIO",
    "color:#b87653;font-size:22px;font-weight:bold",
  );
});

// ==========================================
// EASTER EGG
// ==========================================
let _secret = "";
document.addEventListener("keypress", (e) => {
  _secret += e.key.toLowerCase();
  if (_secret.length > 11) _secret = _secret.slice(-11);
  if (_secret === "yachtmaster") {
    const c = document.querySelector(".case");
    if (c) {
      c.style.boxShadow =
        "0 0 120px rgba(184,118,83,1),0 35px 90px rgba(184,118,83,0.9),inset 0 0 70px rgba(184,118,83,0.7)";
      setTimeout(() => {
        c.style.boxShadow = "";
      }, 3000);
    }
    console.log(
      "%c⚓ YACHTMASTER MODE ⚓",
      "color:#d4a574;font-size:20px;font-weight:bold",
    );
    _secret = "";
  }
});

// ==========================================
// MOBILE: HIDE TOP UI ON SCROLL
// ==========================================
let lastScrollY = window.scrollY;
window.addEventListener("scroll", () => {
  if (window.innerWidth > 768) return;
  const items = document.querySelectorAll(".hide-on-scroll");
  const currentScroll = window.scrollY;
  if (currentScroll <= 5) {
    items.forEach((el) => el.classList.remove("hidden"));
  } else if (currentScroll > lastScrollY) {
    items.forEach((el) => el.classList.add("hidden"));
  }
  lastScrollY = currentScroll;
});
