// ==========================================
// CONTROL FINANCIERO DE BODA - ANTONIO Y DORITA
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Colección de versículos bíblicos (Reina-Valera 1960)
    const versiculosBiblicos = [
        { texto: "Las muchas aguas no podrán apagar el amor, ni le ahogarán los ríos.", referencia: "Cantares 8:7" },
        { texto: "Y sobre todas estas cosas vestíos de amor, que es el vínculo perfecto.", referencia: "Colosenses 3:14" },
        { texto: "Mejores son dos que uno; porque tienen mejor paga de su trabajo.", referencia: "Eclesiastés 4:9" },
        { texto: "El cordón de tres dobleces no se rompe pronto.", referencia: "Eclesiastés 4:12" }
    ];

    let indiceVersiculoActual = 0;

    // Estado inicial de la aplicación (respaldado con almacenamiento local)
    let estadoApp = {
        metaGlobal: parseFloat(localStorage.getItem('boda_meta')) || 4000000,
        registroAhorros: JSON.parse(localStorage.getItem('boda_ahorros')) || [
            { id: 1, persona: 'Antonio', concepto: 'Ahorro base inicial', monto: 434000 }
        ],
        registroGastos: JSON.parse(localStorage.getItem('boda_gastos')) || []
    };

    // Referencias a elementos del DOM
    const inputMeta = document.getElementById('input-goal');
    const btnGuardarMeta = document.getElementById('btn-save-goal');
    const barraProgreso = document.getElementById('progress-bar-fill');
    const etiquetaAhorrado = document.getElementById('label-saved');
    const etiquetaPorcentaje = document.getElementById('label-percentage');
    const etiquetaMeta = document.getElementById('label-goal');

    const resumenAhorros = document.getElementById('summary-savings');
    const resumenGastos = document.getElementById('summary-expenses');
    const resumenBalance = document.getElementById('summary-balance');

    const formularioAhorro = document.getElementById('form-savings');
    const selectPersona = document.getElementById('saving-person');
    const inputConceptoAhorro = document.getElementById('saving-concept');
    const inputMontoAhorro = document.getElementById('saving-amount');
    const contenedorAhorros = document.getElementById('savings-list');

    const formularioGasto = document.getElementById('form-expenses');
    const inputConceptoGasto = document.getElementById('expense-concept');
    const inputMontoGasto = document.getElementById('expense-amount');
    const contenedorGastos = document.getElementById('expenses-list');

    const textoVersiculo = document.getElementById('verse-text');
    const referenciaVersiculo = document.getElementById('verse-ref');
    const btnSiguienteVersiculo = document.getElementById('btn-next-verse');

    // Función para formatear cifras en Colones Costarricenses (₡)
    const formatearColones = (monto) => '₡' + Math.round(monto).toLocaleString('es-CR');

    // Sincronizar con el almacenamiento local y actualizar pantalla
    function guardarYActualizar() {
        localStorage.setItem('boda_meta', estadoApp.metaGlobal);
        localStorage.setItem('boda_ahorros', JSON.stringify(estadoApp.registroAhorros));
        localStorage.setItem('boda_gastos', JSON.stringify(estadoApp.registroGastos));
        renderizarInterfaz();
    }

    // Renderizar toda la interfaz de usuario
    function renderizarInterfaz() {
        inputMeta.value = estadoApp.metaGlobal;

        const totalAhorros = estadoApp.registroAhorros.reduce((acc, item) => acc + item.monto, 0);
        const totalGastos = estadoApp.registroGastos.reduce((acc, item) => acc + item.monto, 0);
        const saldoDisponible = totalAhorros - totalGastos;
        const porcentajeLogrado = Math.min(Math.round((totalAhorros / estadoApp.metaGlobal) * 100), 100);

        // Actualizar barra de progreso
        barraProgreso.style.width = porcentajeLogrado + '%';
        etiquetaAhorrado.textContent = `Ahorrado: ${formatearColones(totalAhorros)}`;
        etiquetaPorcentaje.textContent = porcentajeLogrado + '%';
        etiquetaMeta.textContent = `Meta: ${formatearColones(estadoApp.metaGlobal)}`;

        // Actualizar tarjetas de resumen
        resumenAhorros.textContent = formatearColones(totalAhorros);
        resumenGastos.textContent = formatearColones(totalGastos);
        resumenBalance.textContent = formatearColones(saldoDisponible);

        // Renderizar tabla de ahorros
        contenedorAhorros.innerHTML = '';
        if (estadoApp.registroAhorros.length === 0) {
            contenedorAhorros.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#718096;">No hay aportes registrados todavía.</td></tr>';
        } else {
            estadoApp.registroAhorros.forEach(item => {
                const fila = document.createElement('tr');
                fila.innerHTML = `
                    <td><strong>${item.persona}</strong></td>
                    <td>${item.concepto}</td>
                    <td>${formatearColones(item.monto)}</td>
                    <td><button class="btn-delete" onclick="removerAhorro(${item.id})">Eliminar</button></td>
                `;
                contenedorAhorros.appendChild(fila);
            });
        }

        // Renderizar tabla de gastos
        contenedorGastos.innerHTML = '';
        if (estadoApp.registroGastos.length === 0) {
            contenedorGastos.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#718096;">No hay gastos registrados todavía.</td></tr>';
        } else {
            estadoApp.registroGastos.forEach(item => {
                const fila = document.createElement('tr');
                fila.innerHTML = `
                    <td>${item.concepto}</td>
                    <td>${formatearColones(item.monto)}</td>
                    <td><button class="btn-delete" onclick="removerGasto(${item.id})">Eliminar</button></td>
                `;
                contenedorGastos.appendChild(fila);
            });
        }
    }

    // Evento para actualizar la meta global
    btnGuardarMeta.addEventListener('click', () => {
        const nuevaMeta = parseFloat(inputMeta.value);
        if (nuevaMeta && nuevaMeta > 0) {
            estadoApp.metaGlobal = nuevaMeta;
            guardarYActualizar();
        } else {
            alert('Por favor, introduce un valor de meta válido.');
        }
    });

    // Evento para registrar un nuevo ahorro
    formularioAhorro.addEventListener('submit', (evento) => {
        evento.preventDefault();
        const persona = selectPersona.value;
        const concepto = inputConceptoAhorro.value.trim();
        const monto = parseFloat(inputMontoAhorro.value);

        if (concepto && monto > 0) {
            estadoApp.registroAhorros.push({
                id: Date.now(),
                persona,
                concepto,
                monto
            });
            inputConceptoAhorro.value = '';
            inputMontoAhorro.value = '';
            guardarYActualizar();
        }
    });

    // Evento para registrar un nuevo gasto de boda
    formularioGasto.addEventListener('submit', (evento) => {
        evento.preventDefault();
        const concepto = inputConceptoGasto.value.trim();
        const monto = parseFloat(inputMontoGasto.value);

        if (concepto && monto > 0) {
            estadoApp.registroGastos.push({
                id: Date.now(),
                concepto,
                monto
            });
            inputConceptoGasto.value = '';
            inputMontoGasto.value = '';
            guardarYActualizar();
        }
    });

    // Funciones globales para eliminar registros de las tablas
    window.removerAhorro = function(id) {
        estadoApp.registroAhorros = estadoApp.registroAhorros.filter(item => item.id !== id);
        guardarYActualizar();
    };

    window.removerGasto = function(id) {
        estadoApp.registroGastos = estadoApp.registroGastos.filter(item => item.id !== id);
        guardarYActualizar();
    };

    // Botón para rotar los versículos bíblicos
    btnSiguienteVersiculo.addEventListener('click', () => {
        indiceVersiculoActual = (indiceVersiculoActual + 1) % versiculosBiblicos.length;
        const versiculo = versiculosBiblicos[indiceVersiculoActual];
        textoVersiculo.textContent = `"${versiculo.texto}"`;
        referenciaVersiculo.textContent = `— ${versiculo.referencia} (RVR1960)`;
    });

    // Inicializar visualización al cargar la página
    renderizarInterfaz();
});
