/* ================= AUDIO ENGINE (Web Audio API) ================= */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    if (type === 'eat') {
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        osc.start(now); 
        osc.stop(now + 0.15);
    } else if (type === 'wash') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        osc.start(now); 
        osc.stop(now + 0.1);
    } else if (type === 'coin') {
        osc.frequency.setValueAtTime(987.77, now);
        osc.frequency.setValueAtTime(1318.51, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        osc.start(now); 
        osc.stop(now + 0.25);
    } else if (type === 'levelup') {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554, now + 0.1);
        osc.frequency.setValueAtTime(659, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        osc.start(now); 
        osc.stop(now + 0.4);
    }
}

/* ================= GAME STATE & DATA ================= */
const rooms = ['Cozinha', 'Banheiro', 'Quarto', 'Diversão'];
let currentRoomIndex = 0;

let state = {
    fome: 80,
    saude: 90,
    energia: 70,
    diversao: 60,
    coins: 100,
    xp: 0,
    level: 1,
    color: '#b07d4f',
    hat: 'none',
    dirt: 2,
    isSleeping: false,
    inventory: { apple: 5, burger: 2, potionHealth: 1 }
};

const itemsData = {
    apple: { name: 'Maçã', emoji: '🍎', type: 'food', value: 20, cost: 5 },
    burger: { name: 'Hambúrguer', emoji: '🍔', type: 'food', value: 40, cost: 15 },
    pizza: { name: 'Pizza', emoji: '🍕', type: 'food', value: 35, cost: 12 },
    icecream: { name: 'Sorvete', emoji: '🍦', type: 'food', value: 25, cost: 8 },
    potionHealth: { name: 'Poção Saúde', emoji: '🧪', type: 'potion', target: 'saude', value: 50, cost: 20 },
    potionEnergy: { name: 'Energético', emoji: '⚡', type: 'potion', target: 'energia', value: 50, cost: 25 },
    redColor: { name: 'Cor Vermelha', emoji: '🎨', type: 'skin', value: '#e74c3c', cost: 50 },
    blueColor: { name: 'Cor Azul', emoji: '🎨', type: 'skin', value: '#3498db', cost: 50 },
    capHat: { name: 'Boné', emoji: '🧢', type: 'hat', value: 'cap', cost: 80 }
};

let activeFood = 'apple';

/* ================= INITIALIZATION ================= */
window.onload = () => {
    loadGame();
    setupDragAndDrop();
    setupEyeTracking();
    updateUI();
    setInterval(gameLoop, 3000); // Decaimento dos atributos a cada 3 segundos
};

function gameLoop() {
    if (!state.isSleeping) {
        state.fome = Math.max(0, state.fome - 2);
        state.saude = Math.max(0, state.saude - 1);
        state.energia = Math.max(0, state.energia - 1.5);
        state.diversao = Math.max(0, state.diversao - 2);

        if (state.fome < 30 || state.saude < 30) {
            if (Math.random() > 0.6 && state.dirt < 5) state.dirt++;
        }
    } else {
        state.energia = Math.min(100, state.energia + 8);
        state.fome = Math.max(0, state.fome - 0.5);
        if (state.energia >= 100) toggleSleep(false);
    }

    updateUI();
    saveGame();
}

function addXP(amount) {
    state.xp += amount;
    if (state.xp >= 100) {
        state.level++;
        state.xp -= 100;
        state.coins += 50;
        playSound('levelup');
        alert(`🎉 Parabéns! Pou subiu para o Nível ${state.level}! Ganhou 50 moedas!`);
    }
    updateUI();
}

/* ================= UI & RENDER ================= */
function updateUI() {
    document.getElementById('txt-level').innerText = state.level;
    document.getElementById('txt-xp').innerText = state.xp;
    document.getElementById('txt-coins').innerText = state.coins;

    document.getElementById('bar-fome').style.width = state.fome + '%';
    document.getElementById('bar-saude').style.width = state.saude + '%';
    document.getElementById('bar-energia').style.width = state.energia + '%';
    document.getElementById('bar-diversao').style.width = state.diversao + '%';

    document.getElementById('pou-body').setAttribute('fill', state.color);

    // Render Sujeira
    const dirtContainer = document.getElementById('dirt-container');
    dirtContainer.innerHTML = '';
    for (let i = 0; i < state.dirt; i++) {
        let d = document.createElement('div');
        d.className = 'dirt-overlay';
        d.style.top = (40 + (i * 25) % 80) + 'px';
        d.style.left = (30 + (i * 35) % 100) + 'px';
        dirtContainer.appendChild(d);
    }

    // Render Expressão Bucal
    const mouth = document.getElementById('pou-mouth');
    if (state.isSleeping) {
        mouth.setAttribute('d', 'M 90 125 Q 100 125 110 125');
    } else if (state.fome < 30 || state.saude < 30 || state.diversao < 30) {
        mouth.setAttribute('d', 'M 80 135 Q 100 115 120 135');
    } else {
        mouth.setAttribute('d', 'M 80 120 Q 100 135 120 120');
    }

    // Render Chapéu
    const hatLayer = document.getElementById('hat-layer');
    if (state.hat === 'cap') {
        hatLayer.innerHTML = `<path d="M 60 40 Q 100 10 140 40 L 160 45 L 140 50 Z" fill="#e74c3c"/>`;
    } else {
        hatLayer.innerHTML = '';
    }

    renderRoomDock();
}

function changeRoom(dir) {
    currentRoomIndex = (currentRoomIndex + dir + rooms.length) % rooms.length;
    const viewport = document.getElementById('room-viewport');
    document.getElementById('room-title').innerText = rooms[currentRoomIndex];

    viewport.className = '';
    const item = document.getElementById('interactive-item');
    item.style.display = 'flex';

    if (currentRoomIndex === 0) { // Cozinha
        viewport.classList.add('room-kitchen');
        item.innerText = itemsData[activeFood] ? itemsData[activeFood].emoji : '🍎';
    } else if (currentRoomIndex === 1) { // Banheiro
        viewport.classList.add('room-bathroom');
        item.innerText = '🧼';
    } else if (currentRoomIndex === 2) { // Quarto
        viewport.classList.add(state.isSleeping ? 'room-night' : 'room-bedroom');
        item.style.display = 'none';
    } else if (currentRoomIndex === 3) { // Diversão
        viewport.classList.add('room-playroom');
        item.innerText = '⚽';
    }

    updateUI();
}

function renderRoomDock() {
    const dock = document.getElementById('action-dock');
    dock.innerHTML = '';

    if (currentRoomIndex === 0) {
        let btnShop = document.createElement('button');
        btnShop.className = 'dock-btn';
        btnShop.innerText = '🛒 Comprar Comida';
        btnShop.onclick = () => openShop('food');

        let btnSelect = document.createElement('button');
        btnSelect.className = 'dock-btn';
        btnSelect.innerText = `Item: ${itemsData[activeFood].emoji} (${state.inventory[activeFood] || 0})`;
        btnSelect.onclick = cycleFood;

        dock.appendChild(btnShop);
        dock.appendChild(btnSelect);
    } else if (currentRoomIndex === 1) {
        let btnPotions = document.createElement('button');
        btnPotions.className = 'dock-btn';
        btnPotions.innerText = '🧪 Poções';
        btnPotions.onclick = () => openShop('potion');
        dock.appendChild(btnPotions);
    } else if (currentRoomIndex === 2) {
        let btnSleep = document.createElement('button');
        btnSleep.className = 'dock-btn';
        btnSleep.innerText = state.isSleeping ? '💡 Acordar' : '🌙 Dormir';
        btnSleep.onclick = () => toggleSleep(!state.isSleeping);

        let btnCloset = document.createElement('button');
        btnCloset.className = 'dock-btn';
        btnCloset.innerText = '👔 Armário';
        btnCloset.onclick = () => openShop('style');

        dock.appendChild(btnSleep);
        dock.appendChild(btnCloset);
    } else if (currentRoomIndex === 3) {
        let btnGame = document.createElement('button');
        btnGame.className = 'dock-btn';
        btnGame.innerText = '🎮 Jogar Minijogo';
        btnGame.onclick = startMinigame;
        dock.appendChild(btnGame);
    }
}

function cycleFood() {
    const foods = Object.keys(itemsData).filter(k => itemsData[k].type === 'food');
    let idx = foods.indexOf(activeFood);
    activeFood = foods[(idx + 1) % foods.length];
    document.getElementById('interactive-item').innerText = itemsData[activeFood].emoji;
    renderRoomDock();
}

function toggleSleep(sleeping) {
    state.isSleeping = sleeping;
    const viewport = document.getElementById('room-viewport');
    const pupils = document.querySelectorAll('#eyes circle');

    if (sleeping) {
        viewport.classList.add('room-night');
        pupils.forEach(p => p.style.display = 'none');
    } else {
        viewport.classList.remove('room-night');
        viewport.classList.add('room-bedroom');
        pupils.forEach(p => p.style.display = 'block');
    }
    updateUI();
}

/* ================= DRAG AND DROP INTERACTION ================= */
function setupDragAndDrop() {
    const item = document.getElementById('interactive-item');
    const pou = document.getElementById('pou-wrapper');
    let isDragging = false;
    let startX, startY, origX, origY;

    item.addEventListener('pointerdown', (e) => {
        if (state.isSleeping) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        origX = item.offsetLeft;
        origY = item.offsetTop;
        item.setPointerCapture(e.pointerId);
    });

    item.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        let dx = e.clientX - startX;
        let dy = e.clientY - startY;
        item.style.left = (origX + dx) + 'px';
        item.style.top = (origY + dy) + 'px';

        let itemRect = item.getBoundingClientRect();
        let pouRect = pou.getBoundingClientRect();

        if (checkOverlap(itemRect, pouRect)) {
            handleInteraction();
        }
    });

    item.addEventListener('pointerup', () => {
        isDragging = false;
        item.style.left = 'calc(50% - 30px)';
        item.style.top = '70%';
    });
}

function checkOverlap(rect1, rect2) {
    return !(rect1.right < rect2.left || 
             rect1.left > rect2.right || 
             rect1.bottom < rect2.top || 
             rect1.top > rect2.bottom);
}

function handleInteraction() {
    if (currentRoomIndex === 0) { // Alimentar
        if ((state.inventory[activeFood] || 0) > 0 && state.fome < 100) {
            state.inventory[activeFood]--;
            state.fome = Math.min(100, state.fome + itemsData[activeFood].value);
            playSound('eat');
            addXP(10);
            animatePou();
        }
    } else if (currentRoomIndex === 1) { // Banhar
        if (state.dirt > 0) {
            state.dirt--;
            state.saude = Math.min(100, state.saude + 10);
            playSound('wash');
            addXP(5);
            animatePou();
        }
    }
}

function animatePou() {
    const pou = document.getElementById('pou-wrapper');
    pou.style.transform = 'scale(1.1)';
    setTimeout(() => pou.style.transform = 'scale(1)', 150);
}

function setupEyeTracking() {
    document.addEventListener('pointermove', (e) => {
        if (state.isSleeping) return;
        const leftPupil = document.getElementById('pupil-left');
        const rightPupil = document.getElementById('pupil-right');
        
        [leftPupil, rightPupil].forEach(pupil => {
            let rect = pupil.getBoundingClientRect();
            let cx = rect.left + rect.width / 2;
            let cy = rect.top + rect.height / 2;
            let angle = Math.atan2(e.clientY - cy, e.clientX - cx);
            let dist = Math.min(5, Math.hypot(e.clientX - cx, e.clientY - cy) / 10);
            
            let ox = Math.cos(angle) * dist;
            let oy = Math.sin(angle) * dist;
            
            pupil.setAttribute('transform', `translate(${ox}, ${oy})`);
        });
    });
}

/* ================= SHOP SYSTEM ================= */
function openShop(filter) {
    const modal = document.getElementById('shop-modal');
    const container = document.getElementById('shop-items-container');
    container.innerHTML = '';

    Object.keys(itemsData).forEach(key => {
        let item = itemsData[key];
        if (filter === 'food' && item.type !== 'food') return;
        if (filter === 'potion' && item.type !== 'potion') return;
        if (filter === 'style' && item.type !== 'skin' && item.type !== 'hat') return;

        let row = document.createElement('div');
        row.className = 'shop-item';
        row.innerHTML = `
            <span>${item.emoji} ${item.name}</span>
            <button onclick="buyItem('${key}')">Comprar (🪙 ${item.cost})</button>
        `;
        container.appendChild(row);
    });

    modal.style.display = 'flex';
}

function closeShop() {
    document.getElementById('shop-modal').style.display = 'none';
}

function buyItem(key) {
    let item = itemsData[key];
    if (state.coins >= item.cost) {
        state.coins -= item.cost;
        playSound('coin');

        if (item.type === 'food') {
            state.inventory[key] = (state.inventory[key] || 0) + 1;
        } else if (item.type === 'potion') {
            state[item.target] = Math.min(100, state[item.target] + item.value);
        } else if (item.type === 'skin') {
            state.color = item.value;
        } else if (item.type === 'hat') {
            state.hat = item.value;
        }

        updateUI();
        closeShop();
    } else {
        alert('Moedas insuficientes!');
    }
}

/* ================= MINIGAME (Food Catch) ================= */
let gameLoopId, canvas, ctx;
let playerX = 130;
let fallingObjects = [];

function startMinigame() {
    document.getElementById('game-overlay').style.display = 'flex';
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    playerX = canvas.width / 2 - 25;
    fallingObjects = [];
    
    window.addEventListener('keydown', handleGameInput);
    canvas.addEventListener('touchmove', handleTouchInput);

    gameLoopId = requestAnimationFrame(updateMinigame);
}

function closeMinigame() {
    cancelAnimationFrame(gameLoopId);
    window.removeEventListener('keydown', handleGameInput);
    document.getElementById('game-overlay').style.display = 'none';
}

function handleGameInput(e) {
    if (e.key === 'ArrowLeft') playerX = Math.max(0, playerX - 20);
    if (e.key === 'ArrowRight') playerX = Math.min(canvas.width - 50, playerX + 20);
}

function handleTouchInput(e) {
    let rect = canvas.getBoundingClientRect();
    let touchX = e.touches[0].clientX - rect.left;
    playerX = Math.max(0, Math.min(canvas.width - 50, touchX - 25));
}

function updateMinigame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenhar Pou Jogador
    ctx.fillStyle = state.color;
    ctx.beginPath();
    ctx.arc(playerX + 25, 370, 25, 0, Math.PI * 2);
    ctx.fill();

    // Spawn de Itens
    if (Math.random() < 0.04) {
        fallingObjects.push({
            x: Math.random() * (canvas.width - 30),
            y: 0,
            speed: 2 + Math.random() * 3,
            isFood: Math.random() > 0.2
        });
    }

    // Atualizar e Desenhar Itens Caidores
    for (let i = fallingObjects.length - 1; i >= 0; i--) {
        let obj = fallingObjects[i];
        obj.y += obj.speed;

        ctx.font = '20px Arial';
        ctx.fillText(obj.isFood ? '🍎' : '💣', obj.x, obj.y);

        if (obj.y >= 340 && obj.y <= 380 && obj.x >= playerX - 10 && obj.x <= playerX + 40) {
            if (obj.isFood) {
                state.coins += 2;
                state.diversao = Math.min(100, state.diversao + 5);
                playSound('coin');
                addXP(2);
            } else {
                playSound('eat');
                closeMinigame();
                alert('💥 Ops! Você pegou uma bomba!');
                return;
            }
            fallingObjects.splice(i, 1);
            continue;
        }

        if (obj.y > canvas.height) fallingObjects.splice(i, 1);
    }

    gameLoopId = requestAnimationFrame(updateMinigame);
}

/* ================= LOCAL STORAGE SAVE/LOAD ================= */
function saveGame() {
    localStorage.setItem('pou_save_data', JSON.stringify(state));
}

function loadGame() {
    const saved = localStorage.getItem('pou_save_data');
    if (saved) {
        state = Object.assign(state, JSON.parse(saved));
    }
}