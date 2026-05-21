/* ==========================================
   CONFIGURACIÓN GLOBAL
   ========================================== */
const GOOGLE_SCRIPT_URL = 'TU_URL_DE_GOOGLE_APPS_SCRIPT_AQUI'; // Pega aquí tu URL de Apps Script
const ADMIN_CREDENTIALS = { username: 'admin', password: 'admin2026' };

let isExitMode = false;
let allRecords = [];

/* ==========================================
   INICIALIZACIÓN
   ========================================== */
document.addEventListener('DOMContentLoaded', () => {
    // Fecha de hoy automática
    const today = new Date().toISOString().split('T')[0];
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) {
        fechaInput.value = today;
        fechaInput.min = today;
    }
    
    unlockAllFields();
    checkSystemStatus();
    setupForm();
    setupLogin();
    
    // Checkbox OTROS
    const checkOtros = document.getElementById('checkOtros');
    if (checkOtros) {
        checkOtros.addEventListener('change', (e) => {
            const wrapper = document.getElementById('otrosWrapper');
            if (wrapper) wrapper.classList.toggle('hidden', !e.target.checked);
        });
    }
    
    // ✅ INICIALIZAR TOGGLE DE ESTADO
    initToggleState();
});

/* ==========================================
   ✅ CONTROL DE ACCESO (BOTÓN ACTIVO/BLOQUEADO)
   ========================================== */
function initToggleState() {
    const toggleEl = document.getElementById('formAccessToggle');
    if (toggleEl) {
        // Sincronizar con localStorage
        toggleEl.checked = getManualAccess();
        // Forzar evento para actualizar UI
        toggleEl.addEventListener('change', toggleFormAccess);
        updateAccessIndicator(getManualAccess());
    }
}

function getManualAccess() {
    return localStorage.getItem('form_enabled') !== 'false';
}

function updateAccessIndicator(isActive) {
    const statusEl = document.getElementById('accessStatus');
    const toggleEl = document.getElementById('formAccessToggle');
    
    if (statusEl) {
        statusEl.innerHTML = isActive ? '<i class="fas fa-circle"></i> ACTIVO' : '<i class="fas fa-circle"></i> BLOQUEADO';
        statusEl.className = isActive ? 'access-status active' : 'access-status inactive';
    }
    if (toggleEl) toggleEl.checked = isActive;
}

function toggleFormAccess() {
    const toggleEl = document.getElementById('formAccessToggle');
    if (!toggleEl) return;
    
    const newState = toggleEl.checked;
    localStorage.setItem('form_enabled', newState);
    
    updateAccessIndicator(newState);
    checkSystemStatus();
    
    // Mensaje de confirmación
    if (newState) {
        alert('✅ Formulario ACTIVADO manualmente.\n\nLos docentes podrán registrar si están en horario (8:00 a.m. - 6:30 p.m.).');
    } else {
        alert('🔒 Formulario DESACTIVADO manualmente.\n\nLos docentes NO podrán registrar bajo ninguna circunstancia.');
    }
}

/* ==========================================
   VERIFICACIÓN DE ESTADO DEL SISTEMA
   ========================================== */
function isWithinOperatingHours() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentMinutes = (hours * 60) + minutes;
    // 8:00 AM = 480 min | 6:30 PM (18:30) = 1110 min
    return currentMinutes >= 480 && currentMinutes < 1110;
}

function checkSystemStatus() {
    const manualActive = getManualAccess();
    const timeActive = isWithinOperatingHours();
    const systemActive = manualActive && timeActive;

    const btnSubmit = document.getElementById('btnSubmit');
    const btnToggle = document.getElementById('btnToggleExit');

    if (systemActive) {
        if (btnSubmit) btnSubmit.disabled = false;
        if (btnToggle) btnToggle.disabled = false;
        hideClosedMessage();
    } else {
        if (btnSubmit) btnSubmit.disabled = true;
        if (btnToggle) btnToggle.disabled = true;
        showClosedMessage(!manualActive, !timeActive);
    }
    updateAccessIndicator(manualActive);
}

function showClosedMessage(isAdminDisabled, isTimeDisabled) {
    document.getElementById('formCard').classList.add('hidden');
    document.getElementById('closedCard').classList.remove('hidden');
    
    const messageEl = document.getElementById('closedMessage');
    if (isTimeDisabled) {
        messageEl.innerHTML = '⏰ <strong>Fuera del Horario de Atención</strong><br>El sistema solo está disponible de 8:00 a.m. a 6:30 p.m.';
    } else {
        messageEl.innerHTML = '🔒 <strong>Sistema Desactivado</strong><br>El administrador ha desactivado temporalmente el registro.';
    }
}

function hideClosedMessage() {
    document.getElementById('formCard').classList.remove('hidden');
    document.getElementById('closedCard').classList.add('hidden');
}

/* ==========================================
   BLOQUEAR / DESBLOQUEAR CAMPOS (MODO SALIDA)
   ========================================== */
function lockPersonalFields() {
    const container = document.getElementById('personalDataContainer');
    if (container) container.classList.add('hidden-container');
    
    const tema = document.getElementById('tema');
    const nombre = document.getElementById('nombre');
    const otrosNivel = document.getElementById('otrosNivel');
    
    if (tema) tema.value = '';
    if (nombre) nombre.value = '';
    if (otrosNivel) otrosNivel.value = '';
    
    document.querySelectorAll('input[name="nivel"]').forEach(el => el.checked = false);
    
    const otrosWrapper = document.getElementById('otrosWrapper');
    if (otrosWrapper) otrosWrapper.classList.add('hidden');
}

function unlockAllFields() {
    const container = document.getElementById('personalDataContainer');
    if (container) container.classList.remove('hidden-container');
    
    document.querySelectorAll('#personalDataContainer input').forEach(el => {
        el.disabled = false;
        el.readOnly = false;
    });
    
    document.querySelectorAll('input[name="nivel"]').forEach(el => {
        el.disabled = false;
        const parent = el.closest('.checkbox-item');
        if (parent) parent.classList.remove('locked-field');
    });
}

/* ==========================================
   CAMBIAR MODO ENTRADA / SALIDA
   ========================================== */
function toggleExitMode() {
    isExitMode = !isExitMode;
    
    const btnToggle = document.getElementById('btnToggleExit');
    const submitBtn = document.getElementById('btnSubmit');
    const formTitle = document.getElementById('formTitle');
    const formSubtitle = document.getElementById('formSubtitle');
    const headerBar = document.getElementById('formHeaderBar');
    const dniInfo = document.getElementById('dniInfo');
    const dniInput = document.getElementById('dni');
    
    if (isExitMode) {
        lockPersonalFields();
        
        btnToggle.innerHTML = '<i class="fas fa-times"></i> CANCELAR SALIDA';
        btnToggle.style.cssText = 'background:var(--error);color:white;border-color:var(--error)';
        
        submitBtn.classList.add('exit-mode');
        submitBtn.querySelector('span').textContent = 'REGISTRAR SALIDA';
        
        formTitle.innerHTML = '<i class="fas fa-sign-out-alt"></i> REGISTRO DE SALIDA';
        formTitle.style.color = 'var(--warning)';
        formSubtitle.textContent = 'Ingrese solo su DNI para registrar su salida';
        headerBar.style.background = 'var(--warning)';
        dniInfo.innerHTML = '<i class="fas fa-info-circle"></i> El sistema buscará su registro de entrada y agregará la hora de salida';
        
        if (dniInput) { dniInput.value = ''; dniInput.focus(); dniInput.placeholder = 'Ingrese su DNI para registrar salida'; }
        
    } else {
        unlockAllFields();
        
        btnToggle.innerHTML = '<i class="fas fa-sign-out-alt"></i> Cambiar a: REGISTRAR SALIDA';
        btnToggle.style.cssText = '';
        
        submitBtn.classList.remove('exit-mode');
        submitBtn.querySelector('span').textContent = 'REGISTRAR ENTRADA';
        
        formTitle.innerHTML = '<i class="fas fa-sign-in-alt"></i> REGISTRO DE ENTRADA';
        formTitle.style.color = 'var(--primary-dark)';
        formSubtitle.textContent = 'Complete todos los campos para registrar su ingreso';
        headerBar.style.background = 'var(--primary)';
        dniInfo.innerHTML = '<i class="fas fa-info-circle"></i> El DNI se usa para crear o actualizar su registro';
        
        if (dniInput) { dniInput.value = ''; dniInput.placeholder = 'Ingrese su DNI para registrar'; }
    }
}

/* ==========================================
   MANEJO DEL FORMULARIO
   ========================================== */
function setupForm() {
    const form = document.getElementById('attendanceForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();
        
        // Verificar estado del sistema antes de enviar
        if (!isWithinOperatingHours() || !getManualAccess()) {
            checkSystemStatus();
            return;
        }
        
        const dniInput = document.getElementById('dni');
        const dni = dniInput ? dniInput.value.trim() : '';
        const fecha = document.getElementById('fecha').value;
        
        if (!dni || dni.length !== 8) {
            showFieldError('dniError', 'Ingrese un DNI válido de 8 dígitos');
            return;
        }
        
        showLoading(true);
        
        if (isExitMode) {
            // === MODO SALIDA ===
            const existingIndex = allRecords.findIndex(r => r.dni === dni && r.fecha === fecha);
            
            if (existingIndex === -1) {
                showError('❌ No se encontró registro de entrada para hoy.<br><br>Primero debe registrar su entrada.');
                showLoading(false);
                return;
            }
            
            if (allRecords[existingIndex].horaSalida) {
                showError('⚠️ Ya registró su salida hoy a las <strong>' + allRecords[existingIndex].horaSalida + '</strong>.<br><br>No puede registrar su salida dos veces en el mismo día.');
                showLoading(false);
                return;
            }
            
            allRecords[existingIndex].horaSalida = new Date().toLocaleTimeString('es-PE', { 
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false 
            });
            
            saveData();
            showSuccess(allRecords[existingIndex], 'salida');
            
        } else {
            // === MODO ENTRADA ===
            const existingRecord = allRecords.find(r => r.dni === dni && r.fecha === fecha);
            
            if (existingRecord) {
                showError('⚠️ Ya registró su entrada hoy a las <strong>' + existingRecord.horaEntrada + '</strong>.<br><br>Si necesita registrar su salida, use el botón "Cambiar a: REGISTRAR SALIDA".');
                showLoading(false);
                return;
            }
            
            if (!validateEntrance()) {
                showLoading(false);
                return;
            }
            
            const formData = {
                fecha: fecha,
                horaEntrada: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
                horaSalida: '',
                tema: document.getElementById('tema').value.trim(),
                nombre: document.getElementById('nombre').value.trim(),
                dni: dni,
                nivel: getSelectedNiveles(),
                timestamp: new Date().toISOString()
            };
            
            allRecords.push(formData);
            saveData();
            showSuccess(formData, 'entrada');
        }
        
        // Enviar a Google Sheets (opcional)
        if (GOOGLE_SCRIPT_URL !== 'TU_URL_DE_GOOGLE_APPS_SCRIPT_AQUI') {
            try {
                const lastRecord = allRecords[allRecords.length - 1];
                await fetch(GOOGLE_SCRIPT_URL, {
                    method: 'POST', mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: isExitMode ? 'update' : 'create', data: lastRecord })
                });
            } catch (err) { console.error('Error al enviar a Sheets:', err); }
        }
        
        showLoading(false);
    });
    
    // Restringir DNI a solo números
    document.getElementById('dni')?.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 8);
    });
}

/* ==========================================
   VALIDACIÓN Y UTILIDADES
   ========================================== */
function validateEntrance() {
    let isValid = true;
    if (!document.getElementById('tema').value.trim()) { showFieldError('temaError', 'El tema es obligatorio'); isValid = false; }
    if (!document.getElementById('nombre').value.trim()) { showFieldError('nombreError', 'El nombre es obligatorio'); isValid = false; }
    if (getSelectedNiveles().length === 0) { showFieldError('nivelError', 'Seleccione al menos un nivel'); isValid = false; }
    return isValid;
}

function getSelectedNiveles() {
    return Array.from(document.querySelectorAll('input[name="nivel"]:checked')).map(cb => cb.value).join(', ');
}

function saveData() { localStorage.setItem('asistencia_db', JSON.stringify(allRecords)); }
function loadData() {
    try { allRecords = JSON.parse(localStorage.getItem('asistencia_db')) || []; }
    catch { allRecords = []; }
}

function showFieldError(id, msg) {
    const el = document.getElementById(id);
    if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function clearErrors() {
    document.querySelectorAll('.error-msg').forEach(el => { el.textContent = ''; el.style.display = 'none'; });
}

function showSuccess(data, type) {
    document.getElementById('formCard').classList.add('hidden');
    document.getElementById('successCard').classList.remove('hidden');
    
    document.querySelector('#successCard h3').textContent = type === 'entrada' ? '✅ Entrada Registrada' : '✅ Salida Registrada';
    document.getElementById('successMessage').textContent = type === 'entrada' 
        ? 'Su hora de entrada ha sido registrada correctamente.' 
        : 'Su hora de salida ha sido actualizada correctamente.';
    
    const details = document.getElementById('successDetails');
    if (details) {
        details.innerHTML = `
            <p><strong>📅 Fecha:</strong> ${data.fecha}</p>
            <p><strong>⏰ Entrada:</strong> ${data.horaEntrada}</p>
            <p><strong>🏁 Salida:</strong> ${data.horaSalida || 'Pendiente'}</p>
            <p><strong>👤 Docente:</strong> ${data.nombre}</p>
            <p><strong>🆔 DNI:</strong> ${data.dni}</p>
            <p><strong>📚 Nivel:</strong> ${data.nivel}</p>
        `;
    }
}

function showError(msg) {
    document.getElementById('formCard').classList.add('hidden');
    document.getElementById('errorCard').classList.remove('hidden');
    document.getElementById('errorTitle').textContent = 'Error de Registro';
    document.getElementById('errorMessage').innerHTML = msg;
}

function resetForms() {
    const form = document.getElementById('attendanceForm');
    if (form) form.reset();
    
    document.getElementById('successCard').classList.add('hidden');
    document.getElementById('errorCard').classList.add('hidden');
    document.getElementById('closedCard').classList.add('hidden');
    document.getElementById('formCard').classList.remove('hidden');
    
    if (isExitMode) toggleExitMode();
    
    const today = new Date().toISOString().split('T')[0];
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) fechaInput.value = today;
    
    unlockAllFields();
    clearErrors();
    
    const otrosWrapper = document.getElementById('otrosWrapper');
    if (otrosWrapper) otrosWrapper.classList.add('hidden');
    
    checkSystemStatus();
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.toggle('hidden', !show);
}

/* ==========================================
   PANEL DE ADMINISTRACIÓN
   ========================================== */
function setupLogin() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;
    
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const u = document.getElementById('adminUser').value;
        const p = document.getElementById('adminPass').value;
        
        if (u === ADMIN_CREDENTIALS.username && p === ADMIN_CREDENTIALS.password) {
            document.getElementById('loginModal').classList.add('hidden');
            document.getElementById('adminPanel').classList.remove('hidden');
            loadRecordsForAdmin();
        } else {
            document.getElementById('loginError').textContent = '❌ Usuario o contraseña incorrectos';
        }
    });
}

function loadRecordsForAdmin() {
    loadData();
    const tbody = document.getElementById('recordsBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (allRecords.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:3rem;color:var(--gray-400);"><i class="fas fa-inbox" style="font-size:3rem;margin-bottom:1rem;display:block;"></i>No hay registros</td></tr>';
        return;
    }
    
    allRecords.forEach((r, i) => {
        tbody.innerHTML += `
            <tr>
                <td>${i+1}</td>
                <td>${formatDateDisplay(r.fecha)}</td>
                <td><strong>${r.horaEntrada}</strong></td>
                <td style="color: ${r.horaSalida ? 'var(--success)' : 'var(--warning)'}; font-weight: ${r.horaSalida ? '600' : '400'}">
                    ${r.horaSalida || '<em>Pendiente</em>'}
                </td>
                <td>${r.tema}</td>
                <td><strong>${r.nombre}</strong></td>
                <td><code style="background:var(--gray-100);padding:0.2rem 0.5rem;border-radius:4px;">${r.dni}</code></td>
                <td><span style="background:var(--primary-bg);color:var(--primary);padding:0.3rem 0.6rem;border-radius:50px;font-size:0.85rem;font-weight:600;">${r.nivel}</span></td>
            </tr>
        `;
    });
    
    document.getElementById('totalRegistros').textContent = allRecords.length;
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('totalHoy').textContent = allRecords.filter(r => r.fecha === today).length;
    
    const niveles = new Set();
    allRecords.forEach(r => r.nivel.split(', ').forEach(n => n && niveles.add(n.trim())));
    document.getElementById('totalNiveles').textContent = niveles.size;
    
    // Sincronizar toggle al abrir admin
    initToggleState();
}

function closeLoginModal() { document.getElementById('loginModal').classList.add('hidden'); }
function closeAdminPanel() { document.getElementById('adminPanel').classList.add('hidden'); }

function togglePassword() {
    const p = document.getElementById('adminPass');
    const i = document.getElementById('eyeIcon');
    if (!p || !i) return;
    if (p.type === 'password') { p.type = 'text'; i.classList.remove('fa-eye'); i.classList.add('fa-eye-slash'); } 
    else { p.type = 'password'; i.classList.remove('fa-eye-slash'); i.classList.add('fa-eye'); }
}

function downloadExcel() {
    loadData();
    let csv = '\uFEFFN°,Fecha,Entrada,Salida,Tema,Docente,DNI,Nivel\n';
    allRecords.forEach((r, i) => {
        csv += `${i+1},${r.fecha},${r.horaEntrada},${r.horaSalida || ''},"${r.tema}","${r.nombre}",${r.dni},"${r.nivel}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Asistencia_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

function printReport() { window.print(); }

function formatDateDisplay(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

function filterRecords() {
    const txt = document.getElementById('searchInput').value.toLowerCase();
    const date = document.getElementById('filterDate').value;
    const filtered = allRecords.filter(r => {
        const matchTxt = !txt || r.nombre.toLowerCase().includes(txt) || r.dni.includes(txt) || (r.tema && r.tema.toLowerCase().includes(txt));
        const matchDate = !date || r.fecha === date;
        return matchTxt && matchDate;
    });
    
    const tbody = document.getElementById('recordsBody');
    if (tbody) {
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:3rem;color:var(--gray-400);">No se encontraron registros</td></tr>';
        } else {
            tbody.innerHTML = filtered.map((r, i) => `
                <tr><td>${i+1}</td><td>${formatDateDisplay(r.fecha)}</td><td>${r.horaEntrada}</td><td>${r.horaSalida || '-'}</td><td>${r.tema}</td><td>${r.nombre}</td><td>${r.dni}</td><td>${r.nivel}</td></tr>
            `).join('');
        }
        document.getElementById('recordsCount').textContent = `${filtered.length} registro(s) encontrado(s)`;
    }
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterDate').value = '';
    loadRecordsForAdmin();
}

/* ==========================================
   EVENT LISTENERS GENERALES
   ========================================== */
document.getElementById('adminToggle')?.addEventListener('click', () => document.getElementById('loginModal').classList.remove('hidden'));
document.getElementById('searchInput')?.addEventListener('input', filterRecords);
document.getElementById('loginModal')?.addEventListener('click', (e) => { if (e.target.id === 'loginModal') closeLoginModal(); });
document.getElementById('adminPanel')?.addEventListener('click', (e) => { if (e.target.id === 'adminPanel') closeAdminPanel(); });