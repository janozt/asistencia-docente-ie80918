/* ==========================================
CONFIGURACIÓN
========================================== */
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz7DznTA_q71b_nyl6EYuDLz99xG45ZRwziThe0FRm8FXgQzAsAuoNBMZNPiKDVqZzc/exec';
const ADMIN_CREDENTIALS = { username: 'admin', password: 'admin2026' };
let isExitMode = false;
let allRecords = [];

/* ==========================================
INICIALIZACIÓN
========================================== */
document.addEventListener('DOMContentLoaded', () => {
    loadData();
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

    const checkOtros = document.getElementById('checkOtros');
    if (checkOtros) {
        checkOtros.addEventListener('change', (e) => {
            const wrapper = document.getElementById('otrosWrapper');
            if (wrapper) wrapper.classList.toggle('hidden', !e.target.checked);
        });
    }
});

/* ==========================================
VERIFICAR ESTADO DEL SISTEMA
========================================== */
function checkSystemStatus() {
    const manualActive = getManualAccess();
    const now = new Date();
    const currentTotalMinutes = (now.getHours() * 60) + now.getMinutes();
    const isTimeOk = currentTotalMinutes >= 480 && currentTotalMinutes < 1050;
    const systemActive = manualActive || isTimeOk;

    const btnSubmit = document.getElementById('btnSubmit');
    const btnToggle = document.getElementById('btnToggleExit');

    if (systemActive) {
        if (btnSubmit) btnSubmit.disabled = false;
        if (btnToggle) btnToggle.disabled = false;
        hideClosedMessage();
    } else {
        if (btnSubmit) btnSubmit.disabled = true;
        if (btnToggle) btnToggle.disabled = true;
        showClosedMessage(!manualActive, !isTimeOk);
    }

    updateAccessIndicator(manualActive, isTimeOk);
}

function showClosedMessage(isAdminDisabled, isTimeDisabled) {
    document.getElementById('formCard').classList.add('hidden');
    document.getElementById('closedCard').classList.remove('hidden');
    const messageEl = document.getElementById('closedMessage');
    if (isTimeDisabled && !isAdminDisabled) {
        messageEl.innerHTML = '⏰ <strong>Fuera del Horario de Atención</strong><br>El sistema solo está disponible de 8:00 a.m. a 5:30 p.m.<br><em>O active el control manual desde el panel de administración.</em>';
    } else {
        messageEl.innerHTML = '🔒 <strong>Sistema Desactivado</strong><br>El administrador ha desactivado temporalmente el registro.';
    }
}

function hideClosedMessage() {
    document.getElementById('formCard').classList.remove('hidden');
    document.getElementById('closedCard').classList.add('hidden');
}

/* ==========================================
CONTROL DE ACCESO MANUAL
========================================== */
function getManualAccess() {
    return localStorage.getItem('form_enabled') === 'true';
}

function updateAccessIndicator(manualActive, isTimeOk) {
    const statusEl = document.getElementById('accessStatus');
    const toggleEl = document.getElementById('formAccessToggle');
    if (statusEl) {
        if (manualActive) {
            statusEl.innerHTML = '<i class="fas fa-circle"></i> HABILITADO MANUALMENTE';
            statusEl.className = 'access-status active';
            statusEl.style.background = 'linear-gradient(135deg, #fef3c7, #fcd34d)';
            statusEl.style.color = '#b45309';
            statusEl.style.borderColor = '#f59e0b';
        } else if (isTimeOk) {
            statusEl.innerHTML = '<i class="fas fa-circle"></i> CONTROLADO POR HORARIO';
            statusEl.className = 'access-status active';
        } else {
            statusEl.innerHTML = '<i class="fas fa-circle"></i> BLOQUEADO';
            statusEl.className = 'access-status inactive';
        }
    }

    if (toggleEl) {
        toggleEl.checked = manualActive;
    }
}

function toggleFormAccess() {
    const check = document.getElementById('formAccessToggle');
    if (check) {
        const newState = check.checked;
        localStorage.setItem('form_enabled', newState);
        checkSystemStatus();
        alert(newState ? '✅ Asistencia ACTIVADA manualmente.\n\nEl sistema está abierto independientemente del horario.' : '🔒 Control MANUAL DESACTIVADO.\n\nEl sistema volverá a regirse por el horario automático (8:00 a.m. - 5:30 p.m.).');
    }
}

/* ==========================================
BLOQUEAR/DESBLOQUEAR CAMPOS
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
    const inputs = document.querySelectorAll('#personalDataContainer input');
    inputs.forEach(el => { el.disabled = false; el.readOnly = false; });

    document.querySelectorAll('input[name="nivel"]').forEach(el => {
        el.disabled = false;
        const parent = el.closest('.checkbox-item');
        if (parent) parent.classList.remove('locked-field');
    });
}

/* ==========================================
CAMBIAR MODO ENTRADA/SALIDA
========================================== */
function toggleExitMode() {
    isExitMode = !isExitMode;
    const btnToggle = document.getElementById('btnToggleExit');
    const submitBtn = document.getElementById('btnSubmit');
    const formTitle = document.getElementById('formTitle');
    const formSubtitle = document.getElementById('formSubtitle');
    const headerBar = document.getElementById('formHeaderBar');
    const dniInfo = document.getElementById('dniInfo');

    if (isExitMode) {
        lockPersonalFields();
        if (btnToggle) { 
            btnToggle.innerHTML = '<i class="fas fa-times"></i> CANCELAR SALIDA'; 
            btnToggle.style.background = 'var(--error)'; 
            btnToggle.style.color = 'white'; 
            btnToggle.style.borderColor = 'var(--error)'; 
        }
        if (submitBtn) { 
            submitBtn.classList.add('exit-mode'); 
            submitBtn.querySelector('span').textContent = 'REGISTRAR SALIDA'; 
            submitBtn.querySelector('i').className = 'fas fa-sign-out-alt'; 
        }
        if (formTitle) { 
            formTitle.innerHTML = '<i class="fas fa-sign-out-alt"></i> REGISTRO DE SALIDA'; 
            formTitle.style.color = 'var(--warning)'; 
        }
        if (formSubtitle) formSubtitle.textContent = 'Ingrese solo su DNI para registrar su salida';
        if (headerBar) headerBar.style.background = 'var(--warning)';
        if (dniInfo) dniInfo.innerHTML = '<i class="fas fa-info-circle"></i> El sistema buscará su registro de entrada y agregará la hora de salida';
        
        const dniInput = document.getElementById('dni');
        if (dniInput) { 
            dniInput.value = ''; 
            dniInput.focus(); 
            dniInput.placeholder = 'Ingrese su DNI para registrar salida'; 
        }
    } else {
        unlockAllFields();
        if (btnToggle) { 
            btnToggle.innerHTML = '<i class="fas fa-sign-out-alt"></i> Cambiar a: REGISTRAR SALIDA'; 
            btnToggle.style.background = ''; 
            btnToggle.style.color = ''; 
            btnToggle.style.borderColor = ''; 
        }
        if (submitBtn) { 
            submitBtn.classList.remove('exit-mode'); 
            submitBtn.querySelector('span').textContent = 'REGISTRAR ENTRADA'; 
            submitBtn.querySelector('i').className = 'fas fa-paper-plane'; 
        }
        if (formTitle) { 
            formTitle.innerHTML = '<i class="fas fa-sign-in-alt"></i> REGISTRO DE ENTRADA'; 
            formTitle.style.color = 'var(--primary-dark)'; 
        }
        if (formSubtitle) formSubtitle.textContent = 'Complete todos los campos para registrar su ingreso';
        if (headerBar) headerBar.style.background = 'var(--primary)';
        if (dniInfo) dniInfo.innerHTML = '<i class="fas fa-info-circle"></i> El DNI se usa para crear o actualizar su registro';
        
        const dniInput = document.getElementById('dni');
        if (dniInput) { 
            dniInput.value = ''; 
            dniInput.placeholder = 'Ingrese su DNI para registrar'; 
        }
    }
}

/* ==========================================
FORMULARIO - CORREGIDO
========================================== */
function setupForm() {
    const form = document.getElementById('attendanceForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        const manualActive = getManualAccess();
        const now = new Date();
        const currentTotalMinutes = (now.getHours() * 60) + now.getMinutes();
        const isTimeOk = currentTotalMinutes >= 480 && currentTotalMinutes < 1050;
        const systemActive = manualActive || isTimeOk;

        if (!systemActive) {
            showClosedMessage(!manualActive, !isTimeOk);
            return;
        }

        const dniInput = document.getElementById('dni');
        const dni = dniInput ? dniInput.value.trim() : '';
        const fechaInput = document.getElementById('fecha');
        const fecha = fechaInput ? fechaInput.value : '';

        if (!dni || dni.length !== 8) {
            showFieldError('dniError', 'Ingrese un DNI válido de 8 dígitos');
            return;
        }

        showLoading(true);

        try {
            if (isExitMode) {
                // 🟡 BUSCAR REGISTRO DE ENTRADA EXISTENTE
                const existingIndex = allRecords.findIndex(r => r.dni === dni && r.fecha === fecha);

                if (existingIndex === -1) {
                    showError('❌ No se encontró registro de entrada para hoy.<br><br>Primero debe registrar su entrada.');
                    return;
                }
                if (allRecords[existingIndex].horaSalida) {
                    showError('⚠️ Ya registró su salida hoy a las <strong>' + allRecords[existingIndex].horaSalida + '</strong>.<br><br>No puede registrar su salida dos veces en el mismo día.');
                    return;
                }

                // ✅ ACTUALIZAR HORA DE SALIDA LOCALMENTE
                allRecords[existingIndex].horaSalida = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
                allRecords[existingIndex].estado = 'Completo';
                saveData();
                showSuccess(allRecords[existingIndex], 'salida');

                // 📡 ENVIAR A GOOGLE SHEETS
                if (GOOGLE_SCRIPT_URL && !GOOGLE_SCRIPT_URL.includes('TU_URL_DE_GOOGLE_APPS_SCRIPT_AQUI')) {
                    try {
                        await fetch(GOOGLE_SCRIPT_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                            body: JSON.stringify({ action: 'update', data: allRecords[existingIndex] })
                        });
                    } catch (err) {
                        console.warn('⚠️ Advertencia de sincronización (salida):', err);
                    }
                }

            } else {
                // 🟢 VALIDAR DUPLICADO DE ENTRADA
                const existingRecord = allRecords.find(r => r.dni === dni && r.fecha === fecha);
                if (existingRecord) {
                    showError('⚠️ Ya registró su entrada hoy a las <strong>' + existingRecord.horaEntrada + '</strong>.<br><br>Si necesita registrar su salida, use el botón "Cambiar a: REGISTRAR SALIDA".');
                    return;
                }

                if (!validateEntrance()) return;

                const temaInput = document.getElementById('tema');
                const nombreInput = document.getElementById('nombre');

                const formData = {
                    fecha: fecha,
                    horaEntrada: now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
                    horaSalida: '',
                    estado: 'En Jornada',
                    tema: temaInput ? temaInput.value.trim() : '',
                    nombre: nombreInput ? nombreInput.value.trim() : '',
                    dni: dni,
                    nivel: getSelectedNiveles(),
                    timestamp: now.toISOString()
                };

                allRecords.push(formData);
                saveData();
                showSuccess(formData, 'entrada');

                // 📡 ENVIAR A GOOGLE SHEETS
                if (GOOGLE_SCRIPT_URL && !GOOGLE_SCRIPT_URL.includes('TU_URL_DE_GOOGLE_APPS_SCRIPT_AQUI')) {
                    try {
                        await fetch(GOOGLE_SCRIPT_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                            body: JSON.stringify({ action: 'create', data: formData })
                        });
                    } catch (err) {
                        console.warn('⚠️ Advertencia de sincronización (entrada):', err);
                    }
                }
            }
        } finally {
            showLoading(false);
        }
    });

    // Máscaras de input
    const dniInput = document.getElementById('dni');
    if (dniInput) dniInput.addEventListener('input', (e) => e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 8));

    const nombreInput = document.getElementById('nombre');
    if (nombreInput) nombreInput.addEventListener('input', (e) => e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''));
}

/* ==========================================
VALIDACIÓN Y UTILIDADES
========================================== */
function validateEntrance() {
    let isValid = true;
    const tema = document.getElementById('tema');
    const nombre = document.getElementById('nombre');
    const fecha = document.getElementById('fecha');
    if (!tema || !tema.value.trim()) { showFieldError('temaError', 'El tema es obligatorio'); isValid = false; }
    if (!nombre || !nombre.value.trim()) { showFieldError('nombreError', 'El nombre es obligatorio'); isValid = false; }
    if (!fecha || !fecha.value) { showFieldError('fechaError', 'La fecha es obligatoria'); isValid = false; }
    if (getSelectedNiveles().length === 0) { showFieldError('nivelError', 'Seleccione al menos un nivel'); isValid = false; }
    return isValid;
}

function getSelectedNiveles() {
    return Array.from(document.querySelectorAll('input[name="nivel"]:checked')).map(cb => cb.value).join(', ');
}

function saveData() {
    try { localStorage.setItem('asistencia_db', JSON.stringify(allRecords)); }
    catch (e) { console.error('Error al guardar:', e); }
}

function loadData() {
    try {
        const stored = localStorage.getItem('asistencia_db');
        allRecords = stored ? JSON.parse(stored) : [];
    } catch { allRecords = []; }
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
    document.getElementById('successMessage').textContent = type === 'entrada' ? 'Su hora de entrada ha sido registrada correctamente.' : 'Su hora de salida ha sido actualizada correctamente.';
    document.getElementById('successDetails').innerHTML = `
        <p><strong>📅 Fecha:</strong> ${data.fecha}</p>
        <p><strong>⏰ Entrada:</strong> ${data.horaEntrada}</p>
        <p><strong>🏁 Salida:</strong> ${data.horaSalida || 'Pendiente'}</p>
        <p><strong>👤 Docente:</strong> ${data.nombre}</p>
        <p><strong>🆔 DNI:</strong> ${data.dni}</p>
        <p><strong>📚 Nivel:</strong> ${data.nivel}</p>`;
}

function showError(msg) {
    document.getElementById('formCard').classList.add('hidden');
    document.getElementById('errorCard').classList.remove('hidden');
    document.getElementById('errorTitle').textContent = 'Error de Registro';
    document.getElementById('errorMessage').innerHTML = msg;
}

function resetForms() {
    document.getElementById('attendanceForm').reset();
    document.getElementById('successCard').classList.add('hidden');
    document.getElementById('errorCard').classList.add('hidden');
    document.getElementById('closedCard').classList.add('hidden');
    document.getElementById('formCard').classList.remove('hidden');
    if (isExitMode) toggleExitMode();
    document.getElementById('fecha').value = new Date().toISOString().split('T')[0];
    unlockAllFields();
    clearErrors();
    document.getElementById('otrosWrapper').classList.add('hidden');
    checkSystemStatus();
}

function showLoading(show) {
    document.getElementById('loadingOverlay').classList.toggle('hidden', !show);
}

/* ==========================================
ADMIN PANEL FUNCIONES
========================================== */
function setupLogin() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (document.getElementById('adminUser').value === ADMIN_CREDENTIALS.username && document.getElementById('adminPass').value === ADMIN_CREDENTIALS.password) {
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
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:3rem;color:var(--gray-400)"><i class="fas fa-inbox" style="font-size:3rem;margin-bottom:1rem;display:block;"></i>No hay registros</td></tr>';
        return;
    }

    allRecords.forEach((r, i) => {
        tbody.innerHTML += `
            <tr>
                <td>${i+1}</td>
                <td>${formatDateDisplay(r.fecha)}</td>
                <td><strong>${r.horaEntrada}</strong></td>
                <td style="color:${r.horaSalida?'var(--success)':'var(--warning)'};font-weight:${r.horaSalida?'600':'400'}">${r.horaSalida||'<em>Pendiente</em>'}</td>
                <td>${r.tema}</td>
                <td><strong>${r.nombre}</strong></td>
                <td><code style="background:var(--gray-100);padding:0.2rem 0.5rem;border-radius:4px">${r.dni}</code></td>
                <td><span style="background:var(--primary-bg);color:var(--primary);padding:0.3rem 0.6rem;border-radius:50px;font-size:0.85rem;font-weight:600">${r.nivel}</span></td>
            </tr>`;
    });

    document.getElementById('totalRegistros').textContent = allRecords.length;
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('totalHoy').textContent = allRecords.filter(r => r.fecha === today).length;

    const niveles = new Set();
    allRecords.forEach(r => r.nivel.split(', ').forEach(n => n && niveles.add(n.trim())));
    document.getElementById('totalNiveles').textContent = niveles.size;

    const now = new Date();
    const currentMinutes = (now.getHours() * 60) + now.getMinutes();
    updateAccessIndicator(getManualAccess(), currentMinutes >= 480 && currentMinutes < 1050);
}

function closeLoginModal() { document.getElementById('loginModal').classList.add('hidden'); }
function closeAdminPanel() { document.getElementById('adminPanel').classList.add('hidden'); }
function togglePassword() {
    const p = document.getElementById('adminPass');
    const i = document.getElementById('eyeIcon');
    if (p.type === 'password') { p.type = 'text'; i.classList.replace('fa-eye', 'fa-eye-slash'); }
    else { p.type = 'password'; i.classList.replace('fa-eye-slash', 'fa-eye'); }
}

/* ==========================================
REPORTES
========================================== */
function downloadExcel() {
    loadData();
    let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"><style>table{border-collapse:collapse;width:100%;font-family:Arial,sans-serif;}th,td{border:1px solid #b0b0b0;padding:10px 8px;text-align:left;font-size:11px;}th{background:#2563eb;color:#ffffff;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;}tr:nth-child(even){background:#f8f9fa;}td{mso-number-format:"\\@";}</style></head><body><h2 style="text-align:center;color:#1e40af;margin-bottom:10px;">📊 Reporte de Asistencia Docente</h2><p style="text-align:center;color:#666;font-size:12px;margin-top:0;">Generado: '+new Date().toLocaleString('es-PE')+' | Total: '+allRecords.length+' registros</p><table><tr><th>Fecha</th><th>Hora Entrada</th><th>Hora Salida</th><th>Nombre del Docente</th><th>Curso o Área</th><th>Tema Tratado</th><th>Estado de Asistencia</th></tr>';
    allRecords.forEach(r => {
        const estado = r.horaSalida ? 'Completo' : 'En Jornada';
        const tema = (r.tema || '').replace(/"/g, '""');
        const nombre = (r.nombre || '').replace(/"/g, '""');
        const nivel = (r.nivel || '').replace(/"/g, '""');
        html += `<tr><td>${r.fecha}</td><td>${r.horaEntrada}</td><td>${r.horaSalida||'-'}</td><td>${nombre}</td><td>${nivel}</td><td>${tema}</td><td style="font-weight:bold;color:${r.horaSalida?'#10b981':'#f59e0b'}">${estado}</td></tr>`;
    });
    html += '</table></body></html>';
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Asistencia_Docente_${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
    URL.revokeObjectURL(link.href);
}

function printReport() {
    loadData();
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Reporte de Asistencia</title><style>body{font-family:Arial,sans-serif;padding:20px;color:#333}h2{text-align:center;color:#1e40af;margin-bottom:5px}.info{text-align:center;color:#666;font-size:13px;margin-bottom:20px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#f3f4f6;font-weight:bold}tr:nth-child(even){background:#fafafa}.completo{color:#10b981;font-weight:bold}.jornada{color:#f59e0b;font-weight:bold}@media print{body{padding:0;margin:10px}table{page-break-inside:auto}tr{page-break-inside:avoid;page-break-after:auto}thead{display:table-header-group}h2,.info{margin-bottom:15px}@page{margin:1cm}}</style></head><body><h2>📊 Control de Asistencia Docente</h2><p class="info">Generado: ${new Date().toLocaleString('es-PE')} | Total: ${allRecords.length}</p><table><thead><tr><th>#</th><th>Fecha</th><th>Entrada</th><th>Salida</th><th>Docente</th><th>Nivel</th><th>Tema</th><th>Estado</th></tr></thead><tbody>${allRecords.map((r,i)=>`<tr><td>${i+1}</td><td>${r.fecha}</td><td>${r.horaEntrada}</td><td>${r.horaSalida||'-'}</td><td>${r.nombre}</td><td>${r.nivel}</td><td>${r.tema}</td><td class="${r.horaSalida?'completo':'jornada'}">${r.horaSalida?'Completo':'En Jornada'}</td></tr>`).join('')}</tbody></table><script>window.onload=function(){window.print();window.close()}<\/script></body></html>`);
}

function formatDateDisplay(dateStr) { if (!dateStr) return ''; const [y,m,d] = dateStr.split('-'); return `${d}/${m}/${y}`; }

function filterRecords() {
    const txt = document.getElementById('searchInput').value.toLowerCase();
    const date = document.getElementById('filterDate').value;
    const filtered = allRecords.filter(r => (!txt || r.nombre.toLowerCase().includes(txt) || r.dni.includes(txt) || (r.tema && r.tema.toLowerCase().includes(txt))) && (!date || r.fecha === date));
    const tbody = document.getElementById('recordsBody');
    if (tbody) {
        if (filtered.length === 0) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:3rem;color:var(--gray-400)">No se encontraron registros</td></tr>';
        else tbody.innerHTML = filtered.map((r, i) => `<tr><td>${i+1}</td><td>${formatDateDisplay(r.fecha)}</td><td>${r.horaEntrada}</td><td>${r.horaSalida||'-'}</td><td>${r.tema}</td><td>${r.nombre}</td><td>${r.dni}</td><td>${r.nivel}</td></tr>`).join('');
        document.getElementById('recordsCount').textContent = `${filtered.length} registro(s) encontrado(s)`;
    }
}

function resetFilters() { document.getElementById('searchInput').value = ''; document.getElementById('filterDate').value = ''; loadRecordsForAdmin(); }

// Event Listeners Globales
document.getElementById('adminToggle').addEventListener('click', () => document.getElementById('loginModal').classList.remove('hidden'));
document.getElementById('searchInput').addEventListener('input', filterRecords);
document.getElementById('loginModal').addEventListener('click', (e) => { if (e.target.id === 'loginModal') closeLoginModal(); });
document.getElementById('adminPanel').addEventListener('click', (e) => { if (e.target.id === 'adminPanel') closeAdminPanel(); });