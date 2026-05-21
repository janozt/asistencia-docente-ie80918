/* ==========================================
   CONFIGURACIÓN
   ========================================== */
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby1Z5lUq9I_7qomDieZWv';
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin2026'
};

let allRecords = [];
let filteredRecords = [];
let exitTime = ''; // Variable global para la hora de salida

/* ==========================================
   INICIALIZACIÓN
   ========================================== */
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Página cargada correctamente');
    
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayString = `${year}-${month}-${day}`;
    
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) {
        fechaInput.value = todayString;
        fechaInput.min = todayString;
    }
    
    checkFormAccess();
    setInterval(checkFormAccess, 60000);
    
    setupForm();
    setupLogin();
    setupAdminToggle();
});

/* ==========================================
   HORA DE SALIDA - BOTÓN
   ========================================== */
function captureExitTime() {
    const now = new Date();
    exitTime = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    
    // Actualizar el campo visualmente
    const salidaInput = document.getElementById('horaSalida');
    if(salidaInput) salidaInput.value = exitTime;
    
    // Feedback visual al botón
    const btn = document.querySelector('.btn-exit-time');
    if(btn) {
        const originalHTML = btn.innerHTML;
        const originalStyle = btn.style.cssText;
        
        btn.innerHTML = '<i class="fas fa-check"></i> Registrado';
        btn.style.background = 'var(--success-bg)';
        btn.style.borderColor = 'var(--success)';
        btn.style.color = 'var(--success)';
        
        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.cssText = originalStyle;
        }, 2000);
    }
}

/* ==========================================
   CONTROL DE ACCESO (HORARIO + MANUAL)
   ========================================== */
function isTimeAllowed() {
    const now = new Date();
    const minutes = (now.getHours() * 60) + now.getMinutes();
    return minutes >= 480 && minutes < 1020; // 08:00 a 17:00
}

function getManualAccess() {
    return localStorage.getItem('form_access_enabled') !== 'false';
}

function setManualAccess(enabled) {
    localStorage.setItem('form_access_enabled', enabled ? 'true' : 'false');
}

function checkFormAccess() {
    const timeOk = isTimeAllowed();
    const manualOk = getManualAccess();
    
    const formCard = document.getElementById('formCard');
    const btnSubmit = document.getElementById('btnSubmit');
    const statusEl = document.getElementById('accessStatus');
    const toggleEl = document.getElementById('formAccessToggle');

    if (!timeOk) {
        showDisabledOverlay('time');
        if (btnSubmit) btnSubmit.disabled = true;
        if (statusEl) { statusEl.textContent = ' FUERA DE HORARIO'; statusEl.className = 'access-status inactive'; }
        if (toggleEl) toggleEl.checked = false;
        return;
    }

    if (manualOk) {
        removeDisabledOverlay();
        if (btnSubmit) btnSubmit.disabled = false;
        if (statusEl) { statusEl.textContent = '🟢 ACTIVO'; statusEl.className = 'access-status active'; }
        if (toggleEl) toggleEl.checked = true;
    } else {
        showDisabledOverlay('manual');
        if (btnSubmit) btnSubmit.disabled = true;
        if (statusEl) { statusEl.textContent = '🔴 DESACTIVADO'; statusEl.className = 'access-status inactive'; }
        if (toggleEl) toggleEl.checked = false;
    }
}

function showDisabledOverlay(reason) {
    const formCard = document.getElementById('formCard');
    if (formCard.querySelector('.form-disabled-overlay')) return;

    const now = new Date();
    const currentTime = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    let message = '', icon = 'fa-lock';

    if (reason === 'time') {
        message = `⏰ El registro solo está habilitado de 8:00 a.m. a 5:00 p.m.<br>Hora actual: ${currentTime}<br>Intente más tarde.`;
        icon = 'fa-clock';
    } else {
        message = ` El registro ha sido desactivado temporalmente por el administrador.<br>Hora actual: ${currentTime}`;
        icon = 'fa-ban';
    }

    const overlay = document.createElement('div');
    overlay.className = 'form-disabled-overlay';
    overlay.id = 'blockOverlay';
    overlay.innerHTML = `<i class="fas ${icon}"></i><h4>${reason === 'time' ? 'Fuera de Horario' : 'Registro Pausado'}</h4><p>${message}</p>`;
    formCard.style.position = 'relative';
    formCard.appendChild(overlay);
}

function removeDisabledOverlay() {
    const overlay = document.getElementById('blockOverlay');
    if (overlay) overlay.remove();
}

function toggleFormAccess() {
    const toggle = document.getElementById('formAccessToggle');
    const isEnabled = toggle.checked;
    
    if (isEnabled && !isTimeAllowed()) {
        alert('⚠️ No se puede activar: Está fuera del horario permitido (8:00 a.m. - 5:00 p.m.).');
        toggle.checked = false;
        return;
    }

    setManualAccess(isEnabled);
    checkFormAccess();
    alert(isEnabled ? '✅ Formulario ACTIVADO' : '🔒 Formulario DESACTIVADO');
}

/* ==========================================
   CONFIGURAR FORMULARIO
   ========================================== */
function setupForm() {
    const form = document.getElementById('attendanceForm');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!isTimeAllowed()) {
            showError(`⏰ El registro solo está habilitado de 8:00 a.m. a 5:00 p.m.\nHora actual: ${new Date().toLocaleTimeString('es-PE', {hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false})}`);
            return;
        }
        if (!getManualAccess()) {
            showError('⚠️ El registro ha sido desactivado por el administrador.');
            return;
        }
        
        clearErrors();
        if (!validateForm()) return;
        
        const dni = document.getElementById('dni').value.trim();
        const fecha = document.getElementById('fecha').value;
        
        if (isDuplicate(dni, fecha)) {
            showError('⚠️ Ya existe un registro con este DNI para la fecha seleccionada.');
            return;
        }
        
        showLoading(true);
        
        const now = new Date();
        const formData = {
            fecha: fecha,
            horaEntrada: now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
            horaSalida: exitTime || '', // Guardar hora de salida si se registró
            tema: document.getElementById('tema').value.trim(),
            nombre: document.getElementById('nombre').value.trim(),
            dni: dni,
            nivel: getSelectedNiveles().join(', '),
            timestamp: now.toISOString()
        };
        
        saveLocalRecord(formData);
        
        try {
            if (GOOGLE_SCRIPT_URL !== 'TU_URL_DE_GOOGLE_APPS_SCRIPT_AQUI') {
                await fetch(GOOGLE_SCRIPT_URL, {
                    method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            }
            showSuccess(formData);
        } catch (error) {
            showSuccess(formData, true);
        }
        
        showLoading(false);
    });
    
    document.getElementById('dni')?.addEventListener('input', e => e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 8));
    document.getElementById('nombre')?.addEventListener('input', e => e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''));

    const checkOtros = document.getElementById('checkOtros');
    const otrosWrapper = document.getElementById('otrosWrapper');
    const otrosInput = document.getElementById('otrosNivel');

    if (checkOtros && otrosWrapper && otrosInput) {
        checkOtros.addEventListener('change', function() {
            if (this.checked) { otrosWrapper.classList.remove('hidden'); otrosInput.focus(); }
            else { otrosWrapper.classList.add('hidden'); otrosInput.value = ''; }
        });
    }
}

/* ==========================================
   VALIDACIÓN & UTILIDADES
   ========================================== */
function validateForm() {
    let isValid = true;
    const checks = [
        { id: 'fecha', err: 'fechaError', msg: 'Seleccione la fecha' },
        { id: 'tema', err: 'temaError', msg: 'El tema es obligatorio' },
        { id: 'nombre', err: 'nombreError', msg: 'El nombre es obligatorio' },
        { id: 'dni', err: 'dniError', msg: 'El DNI es obligatorio' }
    ];
    
    checks.forEach(c => {
        const val = document.getElementById(c.id).value.trim();
        if (!val) { showFieldError(c.err, c.msg); isValid = false; }
    });

    const dni = document.getElementById('dni').value.trim();
    if (dni && dni.length !== 8) { showFieldError('dniError', 'El DNI debe tener 8 dígitos'); isValid = false; }
    
    if (getSelectedNiveles().length === 0) { showFieldError('nivelError', 'Seleccione al menos un nivel'); isValid = false; }
    
    const checkOtros = document.getElementById('checkOtros');
    if (checkOtros?.checked && !document.getElementById('otrosNivel').value.trim()) {
        showFieldError('otrosError', 'Especifique el nivel'); isValid = false;
    }
    return isValid;
}

function showFieldError(id, msg) { const el = document.getElementById(id); if(el) { el.textContent = msg; el.style.display = 'block'; } }
function clearErrors() { document.querySelectorAll('.error-msg').forEach(el => { el.textContent = ''; el.style.display = 'none'; }); }
function getSelectedNiveles() {
    const niveles = Array.from(document.querySelectorAll('input[name="nivel"]:checked')).map(cb => cb.value);
    if (niveles.includes('OTROS')) {
        const txt = document.getElementById('otrosNivel').value.trim();
        niveles[niveles.indexOf('OTROS')] = txt ? `OTROS: ${txt.toUpperCase()}` : 'OTROS';
    }
    return niveles;
}

/* ==========================================
   ALMACENAMIENTO & ÉXITO/ERROR
   ========================================== */
function getLocalRecords() { try { return JSON.parse(localStorage.getItem('asistencia_records') || '[]'); } catch { return []; } }
function saveLocalRecord(data) { const r = getLocalRecords(); r.push(data); localStorage.setItem('asistencia_records', JSON.stringify(r)); }
function isDuplicate(dni, fecha) { return getLocalRecords().some(r => r.dni === dni && r.fecha === fecha); }

function showSuccess(data, isLocal = false) {
    document.getElementById('formCard').classList.add('hidden');
    document.getElementById('successCard').classList.remove('hidden');
    let html = `
        <p><strong> Fecha:</strong> ${data.fecha}</p>
        <p><strong>⏰ Entrada:</strong> ${data.horaEntrada}</p>
        <p><strong>🏁 Salida:</strong> ${data.horaSalida || 'No registrada'}</p>
        <p><strong>👤 Docente:</strong> ${data.nombre}</p>
        <p><strong> DNI:</strong> ${data.dni}</p>
        <p><strong>📚 Nivel:</strong> ${data.nivel}</p>
    `;
    if (isLocal) html += `<p style="color: var(--warning); margin-top: 0.5rem;"><i class="fas fa-exclamation-circle"></i> Guardado localmente</p>`;
    document.getElementById('successDetails').innerHTML = html;
}

function showError(msg) {
    document.getElementById('formCard').classList.add('hidden');
    document.getElementById('errorCard').classList.remove('hidden');
    document.getElementById('errorMessage').textContent = msg;
}

function resetForm() {
    document.getElementById('attendanceForm').reset();
    clearErrors();
    const today = new Date();
    document.getElementById('fecha').value = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    
    exitTime = '';
    document.getElementById('horaSalida').value = ''; // Limpiar campo de salida
    document.getElementById('otrosWrapper')?.classList.add('hidden');
    document.getElementById('otrosNivel').value = '';
    document.getElementById('checkOtros').checked = false;
    
    document.getElementById('formCard').classList.remove('hidden');
    document.getElementById('successCard').classList.add('hidden');
    document.getElementById('errorCard').classList.add('hidden');
}

/* ==========================================
   ADMIN PANEL
   ========================================== */
function setupAdminToggle() { document.getElementById('adminToggle')?.addEventListener('click', () => document.getElementById('loginModal').classList.remove('hidden')); }
function closeLoginModal() { document.getElementById('loginModal').classList.add('hidden'); document.getElementById('loginForm').reset(); document.getElementById('loginError').textContent = ''; }
function togglePassword() {
    const p = document.getElementById('adminPass'), i = document.getElementById('eyeIcon');
    if(p.type === 'password') { p.type = 'text'; i.className = 'fas fa-eye-slash'; }
    else { p.type = 'password'; i.className = 'fas fa-eye'; }
}
function setupLogin() {
    document.getElementById('loginForm')?.addEventListener('submit', e => {
        e.preventDefault();
        if(document.getElementById('adminUser').value === ADMIN_CREDENTIALS.username && document.getElementById('adminPass').value === ADMIN_CREDENTIALS.password) {
            closeLoginModal();
            document.getElementById('adminPanel').classList.remove('hidden');
            loadRecords();
        } else {
            document.getElementById('loginError').textContent = 'Usuario o contraseña incorrectos';
        }
    });
}
function closeAdminPanel() { document.getElementById('adminPanel').classList.add('hidden'); }

function loadRecords() {
    allRecords = getLocalRecords();
    filteredRecords = [...allRecords];
    checkFormAccess();
    renderRecords(filteredRecords);
    updateStats();
}

// ⚠️ FUNCION CORREGIDA PARA QUE LOS DATOS VAYAN EN SU LUGAR
function renderRecords(records) {
    const tbody = document.getElementById('recordsBody');
    if (!tbody) return;
    
    if (records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--gray-400);">No se encontraron registros</td></tr>';
        document.getElementById('recordsCount').textContent = '0 registros';
        return;
    }
    
    tbody.innerHTML = records.map((r, i) => `
        <tr>
            <td>${i+1}</td>
            <td>${formatDateDisplay(r.fecha)}</td>
            <td>${r.horaEntrada || '-'}</td>
            <td>${r.horaSalida || '-'}</td>
            <td>${r.tema}</td>
            <td><strong>${r.nombre}</strong></td>
            <td><code>${r.dni}</code></td>
            <td>${r.nivel}</td>
        </tr>
    `).join('');
    
    document.getElementById('recordsCount').textContent = `${records.length} registro(s) encontrado(s)`;
}

function updateStats() {
    document.getElementById('totalRegistros').textContent = allRecords.length;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    document.getElementById('totalHoy').textContent = allRecords.filter(r => r.fecha === todayStr).length;
    const niveles = new Set();
    allRecords.forEach(r => r.nivel.split(', ').forEach(n => n && niveles.add(n.trim())));
    document.getElementById('totalNiveles').textContent = niveles.size;
}

function filterRecords() {
    const txt = document.getElementById('searchInput').value.trim().toLowerCase();
    const date = document.getElementById('filterDate').value;
    filteredRecords = allRecords.filter(r => {
        const matchTxt = !txt || r.nombre.toLowerCase().includes(txt) || r.dni.includes(txt) || r.tema.toLowerCase().includes(txt);
        const matchDate = !date || r.fecha === date;
        return matchTxt && matchDate;
    });
    renderRecords(filteredRecords);
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterDate').value = '';
    filteredRecords = [...allRecords];
    renderRecords(filteredRecords);
}

function downloadExcel() {
    if (filteredRecords.length === 0) return alert('No hay registros para exportar.');
    // CSV con las nuevas columnas
    let csv = '\uFEFFN°;Fecha;Entrada;Salida;Tema;Docente;DNI;Nivel\n';
    filteredRecords.forEach((r, i) => {
        csv += `${i+1};${formatDateDisplay(r.fecha)};${r.horaEntrada};${r.horaSalida||''};"${r.tema.replace(/"/g,'""')}";"${r.nombre.replace(/"/g,'""')}";${r.dni};"${r.nivel}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Asistencia_Docente_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

function printReport() {
    if (filteredRecords.length === 0) return alert('No hay registros para imprimir.');
    window.print();
}

function showLoading(show) { document.getElementById('loadingOverlay')?.classList.toggle('hidden', !show); }
function formatDateDisplay(d) { if(!d) return ''; const [y,m,day] = d.split('-'); return `${day}/${m}/${y}`; }

document.getElementById('loginModal')?.addEventListener('click', e => e.target.id === 'loginModal' && closeLoginModal());
document.getElementById('adminPanel')?.addEventListener('click', e => e.target.id === 'adminPanel' && closeAdminPanel());
document.getElementById('searchInput')?.addEventListener('input', filterRecords);