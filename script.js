/* ==========================================
   CONFIGURACIÓN
   ========================================== */
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby1Z5lUq9I_7qomDieZWv-rRGeY_nVBjPXXw2eZhHJxFlXTDFe-0m4wafJeITjo0Hox/exec' };

let isExitMode = false; // Variable para saber si estamos en modo salida
let allRecords = [];

/* ==========================================
   INICIALIZACIÓN
   ========================================== */
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('fecha').value = today;
    document.getElementById('fecha').min = today;
    
    checkFormAccess();
    setupForm();
    setupLogin();
    
    // Evento para el checkbox "OTROS"
    document.getElementById('checkOtros')?.addEventListener('change', (e) => {
        const wrapper = document.getElementById('otrosWrapper');
        wrapper.classList.toggle('hidden', !e.target.checked);
    });
});

/* ==========================================
   LÓGICA DE BLOQUEO (MODO SALIDA)
   ========================================== */
function toggleExitMode() {
    isExitMode = !isExitMode;
    const btnToggle = document.getElementById('btnToggleExit');
    const submitBtn = document.getElementById('btnSubmit');
    const formTitle = document.getElementById('formTitle');
    const headerBar = document.getElementById('formHeaderBar');
    
    // Campos que se bloquean en modo salida
    const blockedFields = document.querySelectorAll('.locked-field');
    const blockedChecks = document.querySelectorAll('.locked-check');

    if (isExitMode) {
        // ACTIVAR MODO SALIDA
        // 1. Bloquear campos y cambiar estilo
        blockedFields.forEach(el => {
            el.classList.add('locked-field');
            if(el.tagName === 'INPUT') el.value = ''; // Limpiar campos
        });
        blockedChecks.forEach(el => {
            el.checked = false;
            el.disabled = true;
            el.parentElement.classList.add('locked-field');
        });
        document.getElementById('otrosWrapper').classList.add('hidden');

        // 2. Cambiar textos y botones
        btnToggle.innerHTML = '<i class="fas fa-times"></i> CANCELAR (VOLVER A ENTRADA)';
        btnToggle.classList.remove('btn-toggle-exit'); // Estilo simple
        btnToggle.classList.add('btn-secondary');
        
        submitBtn.classList.add('exit-mode');
        submitBtn.querySelector('span').textContent = 'REGISTRAR SALIDA';
        
        formTitle.innerHTML = '<i class="fas fa-sign-out-alt"></i> REGISTRO DE SALIDA';
        formTitle.style.color = 'var(--warning)';
        headerBar.style.background = 'var(--warning)';

        // 3. Foco en DNI
        document.getElementById('dni').focus();

    } else {
        // VOLVER A MODO ENTRADA
        // 1. Desbloquear campos
        blockedFields.forEach(el => el.classList.remove('locked-field'));
        blockedChecks.forEach(el => {
            el.disabled = false;
            el.parentElement.classList.remove('locked-field');
        });
        
        // Restaurar botón toggle
        btnToggle.innerHTML = '<i class="fas fa-sign-out-alt"></i> Cambiar a: REGISTRAR SALIDA';
        btnToggle.classList.remove('btn-secondary');
        btnToggle.classList.add('btn-toggle-exit');

        // Restaurar submit
        submitBtn.classList.remove('exit-mode');
        submitBtn.querySelector('span').textContent = 'REGISTRAR ENTRADA';
        
        formTitle.innerHTML = '<i class="fas fa-sign-in-alt"></i> REGISTRO DE ENTRADA';
        formTitle.style.color = 'var(--primary-dark)';
        headerBar.style.background = 'var(--primary)';
    }
}

/* ==========================================
   ENVÍO DEL FORMULARIO
   ========================================== */
function setupForm() {
    document.getElementById('attendanceForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        if (!getManualAccess()) {
            showError('El formulario está desactivado por el administrador.');
            return;
        }

        const dni = document.getElementById('dni').value.trim();
        const fecha = document.getElementById('fecha').value;

        // Validar DNI siempre
        if (dni.length !== 8) {
            showFieldError('dniError', 'El DNI debe tener 8 dígitos');
            return;
        }

        showLoading(true);

        if (isExitMode) {
            // --- LÓGICA DE SALIDA (SOLO DNI) ---
            const existingIndex = allRecords.findIndex(r => r.dni === dni && r.fecha === fecha);
            
            if (existingIndex === -1) {
                showError('No se encontró registro de entrada para hoy con ese DNI.');
                showLoading(false);
                return;
            }

            // Actualizar
            allRecords[existingIndex].horaSalida = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            saveData();
            showSuccess(allRecords[existingIndex], 'salida');

        } else {
            // --- LÓGICA DE ENTRADA (DATOS COMPLETOS) ---
            if (!validateEntrance()) {
                showLoading(false);
                return;
            }

            // Verificar si ya existe
            if (allRecords.some(r => r.dni === dni && r.fecha === fecha)) {
                showError('Ya existe un registro de entrada para hoy con este DNI.');
                showLoading(false);
                return;
            }

            const formData = {
                fecha: fecha,
                horaEntrada: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                horaSalida: '',
                tema: document.getElementById('tema').value,
                nombre: document.getElementById('nombre').value,
                dni: dni,
                nivel: getSelectedNiveles()
            };

            allRecords.push(formData);
            saveData();
            showSuccess(formData, 'entrada');
        }

        // Enviar a Google Sheets (opcional, si tienes URL configurada)
        if (GOOGLE_SCRIPT_URL !== 'TU_URL_DE_GOOGLE_APPS_SCRIPT_AQUI') {
            try {
                await fetch(GOOGLE_SCRIPT_URL, {
                    method: 'POST', mode: 'no-cors', 
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ action: isExitMode ? 'update' : 'create', data: allRecords[allRecords.length-1] })
                });
            } catch(err) { console.error(err); }
        }
        
        showLoading(false);
    });
}

/* ==========================================
   UTILIDADES
   ========================================== */
function validateEntrance() {
    let ok = true;
    if (!document.getElementById('tema').value) { showFieldError('temaError', 'Campo obligatorio'); ok = false; }
    if (!document.getElementById('nombre').value) { showFieldError('nombreError', 'Campo obligatorio'); ok = false; }
    if (getSelectedNiveles().length === 0) { showFieldError('nivelError', 'Seleccione un nivel'); ok = false; }
    return ok;
}

function getSelectedNiveles() {
    return Array.from(document.querySelectorAll('input[name="nivel"]:checked')).map(c => c.value).join(', ');
}

function saveData() {
    localStorage.setItem('asistencia_db', JSON.stringify(allRecords));
}

function loadData() {
    try { allRecords = JSON.parse(localStorage.getItem('asistencia_db')) || []; } 
    catch { allRecords = []; }
}

function showFieldError(id, msg) {
    const el = document.getElementById(id);
    if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function clearErrors() {
    document.querySelectorAll('.error-msg').forEach(e => e.style.display = 'none');
}

function showSuccess(data, type) {
    document.getElementById('formCard').classList.add('hidden');
    document.getElementById('successCard').classList.remove('hidden');
    
    const title = type === 'entrada' ? '¡Entrada Registrada!' : '¡Salida Registrada!';
    document.getElementById('successTitle').textContent = title;
    document.getElementById('successMessage').textContent = type === 'entrada' ? 'Bienvenido, buen día.' : 'Hasta mañana.';
    
    document.getElementById('successDetails').innerHTML = `
        <p><strong>DNI:</strong> ${data.dni}</p>
        <p><strong>Nombre:</strong> ${data.nombre}</p>
        <p><strong>Entrada:</strong> ${data.horaEntrada}</p>
        <p><strong>Salida:</strong> ${data.horaSalida || 'Pendiente'}</p>
    `;
}

function showError(msg) {
    document.getElementById('formCard').classList.add('hidden');
    document.getElementById('errorCard').classList.remove('hidden');
    document.getElementById('errorMessage').textContent = msg;
}

function resetForms() {
    document.getElementById('attendanceForm').reset();
    document.getElementById('successCard').classList.add('hidden');
    document.getElementById('errorCard').classList.add('hidden');
    document.getElementById('formCard').classList.remove('hidden');
    
    // Resetear a modo entrada si estaba en salida
    if (isExitMode) toggleExitMode();
    
    // Restaurar fecha
    document.getElementById('fecha').value = new Date().toISOString().split('T')[0];
    clearErrors();
}

function showLoading(show) {
    document.getElementById('loadingOverlay').classList.toggle('hidden', !show);
}

/* ==========================================
   ADMIN & ACCESO
   ========================================== */
function getManualAccess() { return localStorage.getItem('form_enabled') !== 'false'; }

function checkFormAccess() {
    const btnSubmit = document.getElementById('btnSubmit');
    const btnToggle = document.getElementById('btnToggleExit');
    const isActive = getManualAccess();
    
    // Validar horario (8:00 a 17:00)
    const hour = new Date().getHours();
    const isTimeOk = hour >= 8 && hour < 17;
    
    const finalState = isActive && isTimeOk;
    
    btnSubmit.disabled = !finalState;
    btnToggle.disabled = !finalState;
    
    const statusEl = document.getElementById('accessStatus');
    if (statusEl) {
        statusEl.textContent = finalState ? '🟢 ACTIVO' : '🔴 BLOQUEADO';
        statusEl.style.color = finalState ? 'var(--success)' : 'var(--error)';
    }
}

function toggleFormAccess() {
    const check = document.getElementById('formAccessToggle').checked;
    localStorage.setItem('form_enabled', check);
    checkFormAccess();
}

// Admin Panel (Funciones básicas)
function setupLogin() {
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const u = document.getElementById('adminUser').value;
        const p = document.getElementById('adminPass').value;
        
        if (u === ADMIN_CREDENTIALS.username && p === ADMIN_CREDENTIALS.password) {
            document.getElementById('loginModal').classList.add('hidden');
            document.getElementById('adminPanel').classList.remove('hidden');
            loadRecordsForAdmin();
        } else {
            document.getElementById('loginError').textContent = 'Credenciales incorrectas';
        }
    });
}

function loadRecordsForAdmin() {
    loadData();
    const tbody = document.getElementById('recordsBody');
    tbody.innerHTML = '';
    
    allRecords.forEach((r, i) => {
        tbody.innerHTML += `
            <tr>
                <td>${i+1}</td>
                <td>${r.fecha}</td>
                <td>${r.horaEntrada}</td>
                <td style="color: ${r.horaSalida ? 'green' : 'red'}">${r.horaSalida || '-'}</td>
                <td>${r.tema}</td>
                <td>${r.nombre}</td>
                <td>${r.dni}</td>
                <td>${r.nivel}</td>
            </tr>`;
    });
    
    document.getElementById('totalRegistros').textContent = allRecords.length;
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('totalHoy').textContent = allRecords.filter(r => r.fecha === today).length;
}

function closeLoginModal() { document.getElementById('loginModal').classList.add('hidden'); }
function closeAdminPanel() { document.getElementById('adminPanel').classList.add('hidden'); }
function togglePassword() {
    const p = document.getElementById('adminPass');
    const i = document.getElementById('eyeIcon');
    if(p.type === 'password') { p.type='text'; i.classList.replace('fa-eye', 'fa-eye-slash'); }
    else { p.type='password'; i.classList.replace('fa-eye-slash', 'fa-eye'); }
}

function downloadExcel() {
    loadData();
    let csv = 'N°,Fecha,Entrada,Salida,Tema,Docente,DNI,Nivel\n';
    allRecords.forEach((r, i) => {
        csv += `${i+1},${r.fecha},${r.horaEntrada},${r.horaSalida},"${r.tema}","${r.nombre}",${r.dni},"${r.nivel}"\n`;
    });
    const blob = new Blob([csv], {type: 'text/csv'});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'asistencia.csv';
    link.click();
}

// Listeners Admin
document.getElementById('adminToggle').addEventListener('click', () => document.getElementById('loginModal').classList.remove('hidden'));
document.getElementById('filterDate').addEventListener('change', () => {
    const date = document.getElementById('filterDate').value;
    const filtered = date ? allRecords.filter(r => r.fecha === date) : allRecords;
    // Actualizar tabla con filtrado (lógica simplificada)
    document.getElementById('recordsBody').innerHTML = filtered.map((r,i) => `<tr><td>${i+1}</td><td>${r.fecha}</td><td>${r.horaEntrada}</td><td>${r.horaSalida||'-'}</td><td>${r.tema}</td><td>${r.nombre}</td><td>${r.dni}</td><td>${r.nivel}</td></tr>`).join('');
});