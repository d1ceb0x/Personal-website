// ==========================================
// YACHTMASTER PORTFOLIO
// ==========================================

// ---- state ----
const cardPages = ['about', 'projects', 'achievements', 'contact'];  
let currentSection = 'home';
let currentPageIndex = 0;   // index into cardPages
let isAnimating = false;
let currentTheme = 'light';
let bezelAngle = 0;         // track current bezel/dial rotation

// suit & name for each page (for the aces)
const aceData = {
    about:        { suit: '♠', color: 'black', name: 'ABOUT'    },
    projects:     { suit: '♥', color: 'red',   name: 'PROJECTS' },
    achievements: { suit: '♦', color: 'red',   name: 'AWARDS'   },
    contact:      { suit: '♣', color: 'black', name: 'CONTACT' }
};
const suits = [
    { symbol: '♣', class: '' },
    { symbol: '♥', class: 'red' },
    { symbol: '♦', class: 'red' },
    { symbol: '♠', class: '' }
];

let suitIndex = 0;

function cycleSuit() {
    const face = document.querySelector('.flip-card-face');
    if (!face) return;

    suitIndex = (suitIndex + 1) % suits.length;

    face.textContent = suits[suitIndex].symbol;
    face.dataset.suit = suits[suitIndex].symbol;
    face.className = 'flip-card-face ' + suits[suitIndex].class;
}


// target bezel angle per section (the hour-marker × 30°)
const sectionAngles = {
    home:          0,
    contact:        0,
    about:        90,
    projects:    180,
    achievements:270
};

// ==========================================
// BEZEL MARKERS
// ==========================================
(function generateBezelMarkers() {
    const container = document.getElementById('bezelMarkers');
    if (!container) return;
    for (let i = 0; i < 60; i++) {
        // skip 12, 3, 6, 9 — buttons live there
        const isHour = (i === 0 || i === 15 || i === 30 || i === 45);
        const mark = document.createElement('div');
        mark.classList.add('bezel-mark');

        if (isHour) {
            mark.classList.add('hour');
        } else if (i % 5 === 0) {
            mark.classList.add('main');
            mark.setAttribute('data-num', String(i));
            mark.style.setProperty('--mark-angle', (i * 6) + 'deg');
        }

        
        container.appendChild(mark);
            }
})();

// ==========================================
// THEME
// ==========================================
document.getElementById('themeToggle')?.addEventListener('click', () => {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    document.querySelector('.toggle-icon').textContent = currentTheme === 'light' ? '☀️' : '🌙';
});

// ==========================================
// CLOCK
// ==========================================
function pad(n) { return String(n).padStart(2,'0'); }
function setHand(id, deg) {
    const el = document.getElementById(id);
    if (el) el.style.transform = 'rotate('+deg+'deg)';
}
function updateClock() {
    const now   = new Date();
    const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();

    const el = document.getElementById('miniTime');
    if (el) el.textContent = pad(h)+':'+pad(m)+':'+pad(s);

    const dn = document.getElementById('dateNum');
    if (dn) dn.textContent = pad(now.getDate());

    if (!isAnimating) {
        setHand('secondHand',  (s / 60) * 360);
        setHand('minuteHand', ((m + s/60) / 60) * 360);
        setHand('hourHand',   (((h%12) + m/60) / 12) * 360);
    }
}
updateClock();
setInterval(updateClock, 1000);


// ==========================================
// BEZEL + DIAL ROTATION (clicking, fast)
// ==========================================
function rotateBezelAndDial(targetAngle) {
    const bezel = document.getElementById('bezel');
    const dial  = document.getElementById('dial');
    if (!bezel || !dial) return Promise.resolve();

    return new Promise(resolve => {
        const start = bezelAngle;
        let diff    = targetAngle - start;
        // always go the short way around
        if (diff > 180)  diff -= 360;
        if (diff < -180) diff += 360;

        const stepSize = 6;  // degrees per tick
        const steps    = Math.max(1, Math.round(Math.abs(diff) / stepSize));
        let   step     = 0;

        const iv = setInterval(() => {
            step++;
            if (step >= steps) {
                clearInterval(iv);
                bezelAngle = targetAngle;
                applyRotation(targetAngle);
                resolve();
                return;
            }
            const angle = start + (diff / steps) * step;
            applyRotation(angle);
        }, 30);   // 30 ms per tick — roughly 1/3 of old 80 ms
    });
}

function applyRotation(deg) {
    const markers = document.getElementById('bezelMarkers');
    if (markers) markers.style.transform = 'rotate('+deg+'deg)';
}

// ==========================================
// HANDS → target angle (dramatic sweep)
// ==========================================
function animateHands(targetDeg) {
    return new Promise(resolve => {
        isAnimating = true;
        const hands = ['hourHand','minuteHand','secondHand'];
        hands.forEach((id, i) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.style.transition = 'transform '+(1.8 - i*0.1)+'s cubic-bezier(0.25,0.46,0.45,0.94)';
            el.style.transform  = 'rotate('+targetDeg+'deg)';
        });
        setTimeout(() => {
            hands.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.transition = 'transform 0.3s linear';
            });
            isAnimating = false;
            resolve();
        }, 1900);
    });
}

// ==========================================
// ACE SHIFT ANIMATION
// Slides both aces inward, holds briefly, slides back.
// Returns a promise that resolves when done.
// ==========================================
function aceShiftAnimation() {
    return new Promise(resolve => {
        const left  = document.getElementById('leftAce');
        const right = document.getElementById('rightAce');

        // slide in
        left.classList.add('shift-in');
        right.classList.add('shift-in');

        setTimeout(() => {
            // slide back
            left.classList.remove('shift-in');
            right.classList.remove('shift-in');
            setTimeout(resolve, 420);  // wait for slide-back transition
        }, 360);
    });
}
async function aceShuffleAnimation() {
    const overlay = document.getElementById('shuffleOverlay');
    const inner   = overlay.querySelector('.flip-card-inner');
    const face    = overlay.querySelector('.flip-card-face');

    if (!overlay || !inner || !face) return;

    overlay.classList.remove('hidden');

    // reset state
    suitIndex = 0;
    face.textContent = suits[0].symbol;
    face.className = 'flip-card-face ' + suits[0].class;

    inner.style.animationPlayState = 'running';

    const interval = setInterval(cycleSuit, 250);

    await new Promise(r => setTimeout(r, 800));

    clearInterval(interval);
    inner.style.animationPlayState = 'paused';

    overlay.classList.add('hidden');
}


// ==========================================
// UPDATE ACE LABELS for current page
// ==========================================
function updateAces() {
    const prev = cardPages[(currentPageIndex - 1 + cardPages.length) % cardPages.length];
    const next = cardPages[(currentPageIndex + 1) % cardPages.length];

    setAce('left',  prev);
    setAce('right', next);
}

function setAce(side, page) {
    const data = aceData[page];
    if (!data) return;
    const suitEl = document.getElementById(side + 'Suit');
    const nameEl = document.getElementById(side + 'Name');
    if (suitEl) { suitEl.textContent = data.suit; suitEl.className = 'ace-suit ' + data.color; }
    if (nameEl) nameEl.textContent = data.name;
    // store which page this ace targets
    document.getElementById(side + 'Ace').setAttribute('data-page', page);
}

// ==========================================
// NAVIGATE FROM WATCH → content page
// ==========================================
async function navigateToSection(section) {
    if (isAnimating) return;
    if (section === currentSection) return;
    isAnimating = true;

    const target = sectionAngles[section];

    // 1. rotate bezel + dial
    await rotateBezelAndDial(target !== undefined ? target : 0);

    // 2. hands sweep to the button's angle
    await animateHands(target !== undefined ? target : 0);
    await aceShuffleAnimation();
    if (section === 'home') {
        // going home: ace shift first, then show watch
        const contentZone = document.getElementById('contentZone');
        if (!contentZone.classList.contains('hidden')) {
            await aceShiftAnimation();
        }
        showWatch();
    } else {
        // going to a page
        const idx = cardPages.indexOf(section);
        if (idx !== -1) {
            currentPageIndex = idx;
            updateAces();
            showPage(section);
            showContent();
            // ace shift plays as the "reveal" animation
            await aceShiftAnimation();
        }
    }

    currentSection = section;
    isAnimating = false;
}

// ==========================================
// SHOW / HIDE
// ==========================================
function showWatch() {
    document.getElementById('watchScene').classList.remove('minimized');
    document.getElementById('contentZone').classList.add('hidden');
    document.getElementById('homeButton').classList.add('hidden');
}

function showContent() {
    document.getElementById('watchScene').classList.add('minimized');
    document.getElementById('contentZone').classList.remove('hidden');
    document.getElementById('homeButton').classList.remove('hidden');
}

function showPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    const target = document.querySelector('.page[data-page="'+pageName+'"]');
    if (target) target.classList.remove('hidden');
}



// ==========================================
// ACE CLICK → switch page (with shift anim)
// ==========================================
async function aceClicked(side) {
    if (isAnimating) return;
    isAnimating = true;

    const ace  = document.getElementById(side + 'Ace');
    const page = ace?.getAttribute('data-page');
    if (!page) { isAnimating = false; return; }

    const idx = cardPages.indexOf(page);
    if (idx === -1) { isAnimating = false; return; }

    // ace shift animation
    await aceShuffleAnimation();

    // update state
    currentPageIndex = idx;
    currentSection   = page;
    updateAces();
    showPage(page);

    isAnimating = false;
}

// ==========================================
// HOME BUTTON → ace shift then watch
// ==========================================
document.getElementById('homeButton')?.addEventListener('click', async () => {
    if (isAnimating) return;
    isAnimating = true;
    await aceShuffleAnimation();
    showWatch();
    currentSection = 'home';
    isAnimating = false;
});

// ==========================================
// DIAL BUTTON CLICKS
// ==========================================
document.querySelectorAll('.dial-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const section = btn.getAttribute('data-section');
        if (section) navigateToSection(section);
    });
});
// ==========================================
// MOBILE NAV BUTTON CLICKS
// ==========================================
document.querySelectorAll('.mobile-nav button').forEach(btn => {
    btn.addEventListener('click', () => {
        const section = btn.getAttribute('data-section');
        if (!section) return;

        // Skip watch animations on mobile
        showPage(section);
        showContent();
        currentSection = section;
    });
});

// ==========================================
// ACE CLICKS
// ==========================================
document.getElementById('leftAce')?.addEventListener('click',  () => aceClicked('left'));
document.getElementById('rightAce')?.addEventListener('click', () => aceClicked('right'));

// ==========================================
// SUB-PAGE BUTTONS (View Demo, etc.)
// ==========================================
document.addEventListener('click', e => {
    const btn = e.target.closest('.btn');
    if (!btn || isAnimating) return;

    const page = btn.getAttribute('data-page');
    if (!page) return;

    // If HTML page exists → show it
    if (document.querySelector(`.page[data-page="${page}"]`)) {
        showPage(page);
        showContent();
        return;
    }

    // Otherwise fallback to dynamic loader
    loadDynamicPage(page);
});


function loadDynamicPage(name) {
    const pages = {
        'demo-1': { title:'Neural Style Transfer — Demo',
            body:`<p class="intro">Real-time artistic style transfer using deep CNNs.</p>
                  <div style="background:var(--bg-secondary);padding:28px;border-radius:12px;margin:20px 0">
                  <h3 style="color:var(--accent-teal);margin-bottom:12px">Demo Interface</h3>
                  <p>Upload an image, pick a style, and watch the magic happen in real time. Deployed on AWS with GPU inference.</p></div>`},
        'demo-2': { title:'Time Series Forecasting — Demo',
            body:`<p class="intro">LSTM model predicting market trends with 87% accuracy.</p>
                  <div style="background:var(--bg-secondary);padding:28px;border-radius:12px;margin:20px 0">
                  <h3 style="color:var(--accent-teal);margin-bottom:12px">Model Performance</h3>
                  <p><strong>Accuracy:</strong> 87% on held-out test set &nbsp;|&nbsp; <strong>Latency:</strong> 12 ms per prediction</p></div>`},
        'demo-3': { title:'Multi-lingual NLP — Demo',
            body:`<p class="intro">Transformer-based sentiment analysis across 15+ languages.</p>
                  <div style="background:var(--bg-secondary);padding:28px;border-radius:12px;margin:20px 0">
                  <h3 style="color:var(--accent-teal);margin-bottom:12px">Supported Languages</h3>
                  <p>English, Mandarin, Hindi, Arabic, Spanish, French, German, Japanese, Korean, Portuguese, Russian, Thai, Vietnamese, Italian, Dutch</p></div>`},
        'kaggle': { title:'Kaggle Competition History',
            body:`<p class="intro">Competitive machine learning achievements.</p>
                  <div style="background:var(--bg-secondary);padding:24px;border-radius:12px;margin:18px 0">
                  <h4 style="color:var(--accent-blue);margin-bottom:10px">🥇 Computer Vision Challenge 2024</h4>
                  <p><strong>Rank:</strong> 1st / 2,543 &nbsp;|&nbsp; <strong>Score:</strong> 0.9876</p></div>`},
        'paper': { title:'Research Publication',
            body:`<p class="intro">Novel attention mechanisms for efficient transformers.</p>
                  <div style="background:var(--bg-secondary);padding:24px;border-radius:12px;margin:18px 0">
                  <p><strong>Venue:</strong> NeurIPS 2023 &nbsp;|&nbsp; <strong>Citations:</strong> 47</p></div>`},
        'github': { title:'GitHub Contributions',
            body:`<p class="intro">Open source contributions to major ML frameworks.</p>
                  <div style="background:var(--bg-secondary);padding:24px;border-radius:12px;margin:18px 0">
                  <p><strong>Commits:</strong> 450+ &nbsp;|&nbsp; <strong>Stars earned:</strong> 5,600+</p></div>`}
    };
    const content = pages[name] || { title:'Content', body:'<p>Coming soon.</p>' };
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById('dynamicTitle').textContent = content.title;
    document.getElementById('dynamicBody').innerHTML   = content.body;
    document.querySelector('.page[data-page="dynamic"]').classList.remove('hidden');
}

// ==========================================
// KEYBOARD
// ==========================================
document.addEventListener('keydown', e => {
    if (isAnimating) return;

    // 1-4 → sections
    const sectionMap = { '1':'home', '2':'about', '3':'projects', '4':'achievements' };
    if (sectionMap[e.key]) { navigateToSection(sectionMap[e.key]); return; }

    // H / Esc → home
    if (e.key.toLowerCase() === 'h' || e.key === 'Escape') { navigateToSection('home'); return; }

    // arrows → ace navigation when on content
    if (currentSection !== 'home') {
        if (e.key === 'ArrowLeft')  aceClicked('left');
        if (e.key === 'ArrowRight') aceClicked('right');
    }
});

// ==========================================
// INIT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    showWatch();
    updateAces();
    console.log('%c⌚ ISHAN KULKARNI PORTFOLIO', 'color:#b87653;font-size:22px;font-weight:bold');
});

// ==========================================
// EASTER EGG
// ==========================================
let _secret = '';
document.addEventListener('keypress', e => {
    _secret += e.key.toLowerCase();
    if (_secret.length > 11) _secret = _secret.slice(-11);
    if (_secret === 'yachtmaster') {
        const c = document.querySelector('.case');
        if (c) {
            c.style.boxShadow = '0 0 120px rgba(184,118,83,1),0 35px 90px rgba(184,118,83,0.9),inset 0 0 70px rgba(184,118,83,0.7)';
            setTimeout(() => { c.style.boxShadow = ''; }, 3000);
        }
        console.log('%c⚓ YACHTMASTER MODE ⚓','color:#d4a574;font-size:20px;font-weight:bold');
        _secret = '';
    }
});
