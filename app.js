// ==========================================
// CONTROL FINANCIERO DE BODA - ANTONIO Y DORITA
// Integración en Tiempo Real con Firebase Firestore
// ==========================================

const BIBLE_VERSES = [
    { text: "Las muchas aguas no podrán apagar el amor, ni le ahogarán los ríos.", ref: "— Cantares 8:7 (RVR1960)" },
    { text: "El amor es sufrido, es benigno; el amor no tiene envidia, el amor no es jactancioso, no se envanece; no hace nada indebido, no busca lo suyo, no se irrita, no guarda rencor.", ref: "— 1 Corintios 13:4-5 (RVR1960)" },
    { text: "Y sobre todas estas cosas vestíos de amor, que es el vínculo perfecto.", ref: "— Colosenses 3:14 (RVR1960)" },
    { text: "Mejores son dos que uno; porque tienen mejor paga de su trabajo. Porque si cayeren, el uno levantará a su compañero.", ref: "— Eclesiastés 4:9-10 (RVR1960)" },
    { text: "Nosotros le amamos a él, porque él nos amó primero.", ref: "— 1 Juan 4:19 (RVR1960)" },
    { text: "Por tanto, dejará el hombre a su padre y a su madre, y se unirá a su mujer, y serán una sola carne.", ref: "— Génesis 2:24 (RVR1960)" },
    { text: "El cordón de tres dobleces no se rompe pronto.", ref: "— Eclesiastés 4:12 (RVR1960)" }
];

let currentVerseIndex = 0;
let appState = {
    goal: 4000000,
    savings: [],
    expenses: []
};

let inputGoal, btnSaveGoal, progressBarFill, labelSaved, labelPercentage, labelGoal;
let summarySavings, summaryExpenses, summaryBalance;
let formSavings, savingPerson, savingConcept, savingAmount, savingsList;
let formExpenses, expenseConcept, expenseAmount, expensesList;
let verseText, verseRef, btnNextVerse;

const formatCRC = (amount) => '₡' + Math.round(amount).toLocaleString('es-CR');

window.addEventListener('DOMContentLoaded', () => {
    inputGoal = document.getElementById('input-goal');
    btnSaveGoal = document.getElementById('btn-save-goal');
    progressBarFill = document.getElementById('progress-bar-fill');
    labelSaved = document.getElementById('label-saved');
    labelPercentage = document.getElementById('label-percentage');
    labelGoal = document.getElementById('label-goal');

    summarySavings = document.getElementById('summary-savings');
    summaryExpenses = document.getElementById('summary-expenses');
    summaryBalance = document.getElementById('summary-balance');

    formSavings = document.getElementById('form-savings');
    savingPerson = document.getElementById('saving-person');
    savingConcept = document.getElementById('saving-concept');
    savingAmount = document.getElementById('saving-amount');
    savingsList = document.getElementById('savings-list');

    formExpenses = document.getElementById('form-expenses');
    expenseConcept = document.getElementById('expense-concept');
    expenseAmount = document.getElementById('expense-amount');
    expensesList = document.getElementById('expenses-list');

    verseText = document.getElementById('verse-text');
    verseRef = document.getElementById('verse-ref');
    btnNextVerse = document.getElementById('btn-next-verse');

    if (btnSaveGoal) btnSaveGoal.addEventListener('click', guardarMetaNube);
    if (formSavings) formSavings.addEventListener('submit', guardarAhorroNube);
    if (formExpenses) formExpenses.addEventListener('submit', guardarGastoNube);
    if (btnNextVerse) {
        btnNextVerse.addEventListener('click', () => {
            currentVerseIndex = (currentVerseIndex + 1) % BIBLE_VERSES.length;
            const v = BIBLE_VERSES[currentVerseIndex];
            if (verseText) verseText.innerText = `"${v.text}"`;
            if (verseRef) verseRef.innerText = v.ref;
        });
    }

    if (window.db) {
        sincronizarBodaConNube();
    } else {
        window.addEventListener('firebase-ready', sincronizarBodaConNube);
    }
});

function sincronizarBodaConNube() {
    const docMetaRef = window.doc(window.db, "boda_finanzas", "meta_general");
    window.onSnapshot(docMetaRef, (docSnap) => {
        if (docSnap.exists()) {
            appState.goal = docSnap.data().monto || 4000000;
        }
        renderApp();
    });

    const qSavings = window.collection(window.db, "boda_ahorros");
    window.onSnapshot(qSavings, (snapshot) => {
        appState.savings = [];
        snapshot.forEach((docSnap) => {
            appState.savings.push({ idDoc: docSnap.id, ...docSnap.data() });
        });
        appState.savings.sort((a, b) => (b.fecha || 0) - (a.fecha || 0));
        renderApp();
    });

    const qExpenses = window.collection(window.db, "boda_gastos");
    window.onSnapshot(qExpenses, (snapshot) => {
        appState.expenses = [];
        snapshot.forEach((docSnap) => {
            appState.expenses.push({ idDoc: docSnap.id, ...docSnap.data() });
        });
        appState.expenses.sort((a, b) => (b.fecha || 0) - (a.fecha || 0));
        renderApp();
    });
}

function renderApp() {
    if (inputGoal) inputGoal.value = appState.goal;

    const totalSavings = appState.savings.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
    const totalExpenses = appState.expenses.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
    const currentBalance = totalSavings - totalExpenses;
    const percentage = appState.goal > 0 ? Math.min(Math.round((totalSavings / appState.goal) * 100), 100) : 0;

    if (progressBarFill) progressBarFill.style.width = `${percentage}%`;
    if (labelSaved) labelSaved.innerText = `Ahorrado: ${formatCRC(totalSavings)}`;
    if (labelPercentage) labelPercentage.innerText = `${percentage}%`;
    if (labelGoal) labelGoal.innerText = `Meta: ${formatCRC(appState.goal)}`;

    if (summarySavings) summarySavings.innerText = formatCRC(totalSavings);
    if (summaryExpenses) summaryExpenses.innerText = formatCRC(totalExpenses);
    if (summaryBalance) summaryBalance.innerText = formatCRC(currentBalance);

    if (savingsList) {
        savingsList.innerHTML = '';
        if (appState.savings.length === 0) {
            savingsList.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#888;">No hay ahorros registrados en la nube.</td></tr>';
        } else {
            appState.savings.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${item.person}</strong></td>
                    <td>${item.concept}</td>
                    <td>${formatCRC(item.amount)}</td>
                    <td><button class="btn-delete" onclick="eliminarAhorroNube('${item.idDoc}')">Eliminar</button></td>
                `;
                savingsList.appendChild(tr);
            });
        }
    }

    if (expensesList) {
        expensesList.innerHTML = '';
        if (appState.expenses.length === 0) {
            expensesList.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#888;">No hay gastos registrados en la nube.</td></tr>';
        } else {
            appState.expenses.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${item.concept}</td>
                    <td>${formatCRC(item.amount)}</td>
                    <td><button class="btn-delete" onclick="eliminarGastoNube('${item.idDoc}')">Eliminar</button></td>
                `;
                expensesList.appendChild(tr);
            });
        }
    }
}

async function guardarMetaNube() {
    const newGoal = parseFloat(inputGoal.value);
    if (newGoal && newGoal > 0) {
        try {
            const docMetaRef = window.doc(window.db, "boda_finanzas", "meta_general");
            await window.setDoc(docMetaRef, { monto: newGoal }, { merge: true });
        } catch (e) {
            console.error("Error al guardar meta:", e);
        }
    }
}

async function guardarAhorroNube(e) {
    e.preventDefault();
    const person = savingPerson.value;
    const concept = savingConcept.value.trim();
    const amount = parseFloat(savingAmount.value);

    if (concept && amount > 0) {
        try {
            await window.addDoc(window.collection(window.db, "boda_ahorros"), {
                person,
                concept,
                amount,
                fecha: Date.now()
            });
            savingConcept.value = '';
            savingAmount.value = '';
        } catch (e) {
            console.error("Error al guardar ahorro:", e);
        }
    }
}

async function guardarGastoNube(e) {
    e.preventDefault();
    const concept = expenseConcept.value.trim();
    const amount = parseFloat(expenseAmount.value);

    if (concept && amount > 0) {
        try {
            await window.addDoc(window.collection(window.db, "boda_gastos"), {
                concept,
                amount,
                fecha: Date.now()
            });
            expenseConcept.value = '';
            expenseAmount.value = '';
        } catch (e) {
            console.error("Error al guardar gasto:", e);
        }
    }
}

window.eliminarAhorroNube = async function(idDoc) {
    if (confirm("¿Deseas eliminar este registro de ahorro de la nube?")) {
        try {
            await window.deleteDoc(window.doc(window.db, "boda_ahorros", idDoc));
        } catch (e) {
            console.error("Error al eliminar ahorro:", e);
        }
    }
};

window.eliminarGastoNube = async function(idDoc) {
    if (confirm("¿Deseas eliminar este registro de gasto de la nube?")) {
        try {
            await window.deleteDoc(window.doc(window.db, "boda_gastos", idDoc));
        } catch (e) {
            console.error("Error al eliminar gasto:", e);
        }
    }
};

const premiosRuleta = [
    { texto: "¡Un Chocolate! 🍫", tipo: "premio" },
    { texto: "Te amo ❤️", tipo: "amor" },
    { texto: "¡Una Hamburguesa! 🍔", tipo: "premio" },
    { texto: "Sigue participando 🍀", tipo: "neutro" },
    { texto: "Te amo infinito 💖", tipo: "amor" },
    { texto: "Sigue participando 🍀", tipo: "neutro" }
];

let anguloActual = 0;
let girando = false;

window.addEventListener('DOMContentLoaded', () => {
    dibujarRuletaEstetica(0);
    verificarBloqueoDiario();
});

function dibujarRuletaEstetica(anguloRotacion) {
    const canvas = document.getElementById('ruleta-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const totalSectores = premiosRuleta.length;
    const arco = (2 * Math.PI) / totalSectores;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const centro = canvas.width / 2;
    const radio = centro - 5;

    const coloresSectores = ['#e11d48', '#9333ea', '#2563eb', '#0d9488', '#d97706', '#db2777'];

    premiosRuleta.forEach((premio, i) => {
        let anguloInicio = anguloRotacion + i * arco;
        let anguloFin = anguloInicio + arco;

        ctx.beginPath();
        ctx.moveTo(centro, centro);
        ctx.arc(centro, centro, radio, anguloInicio, anguloFin);
        ctx.closePath();

        ctx.fillStyle = coloresSectores[i % coloresSectores.length];
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.save();
        ctx.translate(centro, centro);
        ctx.rotate(anguloInicio + arco / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 12px Poppins, sans-serif";
        ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
        ctx.shadowBlur = 4;
        ctx.fillText(premio.texto, radio - 20, 5);
        ctx.restore();
    });
}

function verificarBloqueoDiario() {
    const ultimoGiro = localStorage.getItem('boda_ultimo_giro');
    const btnGirar = document.getElementById('btn-girar');
    const msg = document.getElementById('mensaje-ruleta');

    if (ultimoGiro) {
        const ahora = Date.now();
        const tiempoTranscurrido = ahora - parseInt(ultimoGiro);
        const unDiaMs = 24 * 60 * 60 * 1000;

        if (tiempoTranscurrido < unDiaMs) {
            const horasRestantes = Math.ceil((unDiaMs - tiempoTranscurrido) / (1000 * 60 * 60));
            if (btnGirar) btnGirar.disabled = true;
            if (msg) msg.innerText = `⏳ Ya giraste hoy. Vuelve en ${horasRestantes} horas para tu próximo intento.`;
        }
    }
}

function girarRuleta() {
    if (girando) return;
    
    const ultimoGiro = localStorage.getItem('boda_ultimo_giro');
    if (ultimoGiro) {
        const tiempoTranscurrido = Date.now() - parseInt(ultimoGiro);
        if (tiempoTranscurrido < 24 * 60 * 60 * 1000) {
            alert("¡Ya has realizado tu giro de las últimas 24 horas! Vuelve mañana.");
            return;
        }
    }

    girando = true;
    const btnGirar = document.getElementById('btn-girar');
    if (btnGirar) btnGirar.disabled = true;

    localStorage.setItem('boda_ultimo_giro', Date.now().toString());

    let numSectores = premiosRuleta.length;
    let sectorElegido = Math.floor(Math.random() * numSectores);
    let gradosPorSector = 360 / numSectores;
    let gradosObjetivo = 360 * 5 + (numSectores - sectorElegido) * gradosPorSector - gradosPorSector / 2;

    let anguloInicioAnimacion = anguloActual;
    let duracion = 3500;
    let tiempoInicio = null;

    function animar(tiempoActual) {
        if (!tiempoInicio) tiempoInicio = tiempoActual;
        let tiempoPasado = tiempoActual - tiempoInicio;
        let progreso = Math.min(tiempoPasado / duracion, 1);
        let easeProgreso = 1 - Math.pow(1 - progreso, 3);
        
        let anguloActualAnim = anguloInicioAnimacion + (gradosObjetivo * (Math.PI / 180)) * easeProgreso;
        dibujarRuletaEstetica(anguloActualAnim);

        if (progreso < 1) {
            requestAnimationFrame(animar);
        } else {
            anguloActual = anguloActualAnim % (2 * Math.PI);
            girando = false;
            let premioGanado = premiosRuleta[sectorElegido];
            mostrarNotificacionPremio(premioGanado);
        }
    }

    requestAnimationFrame(animar);
}

function mostrarNotificacionPremio(premio) {
    const msg = document.getElementById('mensaje-ruleta');
    if (msg) {
        msg.innerHTML = `🎉 ¡Felicidades! Te ha salido: <strong style="color: #e11d48; font-size: 1.1rem;">${premio.texto}</strong>`;
    }
    
    alert(`🎉 ¡Increíble! Dorita se ha ganado:\n\n✨ ${premio.texto} ✨\n\n(Este resultado ha quedado registrado para hacerlo efectivo ❤️).`);
}
