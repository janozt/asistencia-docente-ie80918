/* ==========================================
   CONFIGURACIÓN
   ========================================== */
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby1Z5lUq9I_7qomDieZWv-rRGeY_nVBjPXXw2eZhHJxFlXTDFe-0m4wafJeITjo0Hox/exec';
const ADMIN_CREDENTIALS = { username: 'admin', password: 'admin2026' };

let isExitMode = false;
let allRecords = [];

/* ==========================================
   INICIALIZACIÓN
   ========================================== */
document.addEventListener('DOMContentLoaded', () => {
    // Establecer fecha de hoy
    const today = new Date().toISOString().split('T')[0];
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) {
        fechaInput.value = today;
        fechaInput.min = today;
    }
    
    // ✅ IMPORTANTE: Desbloquear todos los campos al iniciar
    unlockAllFields();
    
    checkFormAccess();
    setupForm();
    setupLogin();
    
    // Checkbox OTROS
    const checkOtros = document.getElementById('checkOtros');
    if (checkOtros) {
        checkOtros.addEventListener('change', (e) => {
            const wrapper = document.getElementById('otrosWrapper');
            if (wrapper) {
                wrapper.classList.toggle('hidden', !e.target.checked);
            }
        });
    }
});

/* ==========================================
   DESBLOQUEAR CAMPOS (Para modo entrada)
   ========================================== */
function unlockAllFields() {
    // Quitar clase locked-field de todos los inputs
    const inputs = document.querySelectorAll('.locked-field');
    inputs.forEach(el => {
        el.classList.remove('locked-field');
        if (el.tagName === 'INPUT') {
            el.disabled = false;
            el.readOnly = false;
        }
    });
    
    // Habilitar checkboxes
    const checks = document.querySelectorAll('.locked-check');
    checks.forEach(el => {
        el.disabled = false;
        const parent = el.closest('.checkbox-item');
        if (parent) parent.classList.remove('locked-field');
    });
    
    // Mostrar wrapper de OTROS si es necesario
    const otrosWrapper = document.getElementById('otrosWrapper');
    if (otrosWrapper) {
        otrosWrapper.classList.remove('locked-field');
    }
}

/* ==========================================
   BLOQUEAR CAMPOS (Para modo salida)
   ========================================== */
function lockPersonalFields() {
    // Bloquear campos personales (menos DNI)
    const tema = document.getElementById('tema');
    const nombre = document.getElementById('nombre');
    const otrosNivel = document.getElementById('otrosNivel');
    
    if (tema) { tema.classList.add('locked-field'); tema.value = ''; }
    if (nombre) { nombre.classList.add('locked-field'); nombre.value = ''; }
    if (otrosNivel) { otrosNivel.classList.add('locked-field'); otrosNivel.value = ''; }
    
    // Bloquear checkboxes
    const checks = document.querySelectorAll('input[name="nivel"]');
    checks.forEach(el => {
        el.checked = false;
        el.disabled = true;
        const parent = el.closest('.checkbox-item');
        if (parent) parent.classList.add('locked-field');
    });
    
    // Ocultar wrapper de OTROS
    const otrosWrapper = document.getElementById('otrosWrapper');
    if (otrosWrapper) otrosWrapper.classList.add('hidden');
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
    
    if (isExitMode) {
        // 🟡 MODO SALIDA: Bloquear campos personales
        lockPersonalFields();
        
        // Cambiar botón toggle
        if (btnToggle) {
            btnToggle.innerHTML = '<i class="fas fa-times"></i> CANCELAR SALIDA';
            btnToggle.classList.remove('btn-toggle-exit');
            btnToggle.style.background = 'var(--error)';
            btnToggle.style.color = 'white';
            btnToggle.style.borderColor = 'var(--error)';
        }
        
        // Cambiar botón submit
        if (submitBtn) {
            submitBtn.classList.add('exit-mode');
            const span = submitBtn.querySelector('span');
            if (span) span.textContent = 'REGISTRAR SALIDA';
            const icon = submitBtn.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-paper-plane');
                icon.classList.add('fa-sign-out-alt');
            }
        }
        
        // Cambiar título
        if (formTitle) {
            formTitle.innerHTML = '<i class="fas fa-sign-out-alt"></i> REGISTRO DE SALIDA';
            formTitle.style.color = 'var(--warning)';
        }
        if (formSubtitle) {
            formSubtitle.textContent = 'Ingrese solo su DNI para registrar su salida';
        }
        if (headerBar) {
            headerBar.style.background = 'var(--warning)';
        }
        
        // Foco en DNI
        const dniInput = document.getElementById('dni');
        if (dniInput) {
            dniInput.value = '';
            dniInput.focus();
            dniInput.placeholder = 'Ingrese su DNI para registrar salida';
        }
        
    } else {
        // 🔵 MODO ENTRADA: Desbloquear todo
        unlockAllFields();
        
        // Restaurar botón toggle
        if (btnToggle) {
            btnToggle.innerHTML = '<i class="fas fa-sign-out-alt"></i> Cambiar a: REGISTRAR SALIDA';
            btnToggle.classList.add('btn-toggle-exit');
            btnToggle.style.background = '';
            btnToggle.style.color = '';
            btnToggle.style.borderColor = '';
        }
        
        // Restaurar botón submit
        if (submitBtn) {
            submitBtn.classList.remove('exit-mode');
            const span = submitBtn.querySelector('span');
            if (span) span.textContent = 'REGISTRAR ENTRADA';
            const icon = submitBtn.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-sign-out-alt');
                icon.classList.add('fa-paper-plane');
            }
        }
        
        // Restaurar título
        if (formTitle) {
            formTitle.innerHTML = '<i class="fas fa-sign-in-alt"></i> REGISTRO DE ENTRADA';
            formTitle.style.color = 'var(--primary-dark)';
        }
        if (formSubtitle) {
            formSubtitle.textContent = 'Complete todos los campos para registrar su ingreso';
        }
        if (headerBar) {
            headerBar.style.background = 'var(--primary)';
        }
        
        // Limpiar DNI
        const dniInput = document.getElementById('dni');
        if (dniInput) {
            dniInput.value = '';
            dniInput.placeholder = 'Ingrese su DNI para registrar';
        }
    }
}

/* ==========================================
   CONFIGURAR FORMULARIO
   ========================================== */
function setupForm() {
    const form = document.getElementById('attendanceForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();
        
        // Verificar acceso
        if (!getManualAccess()) {
            showError('El formulario está desactivado por el administrador.');
            return;
        }
        
        const dniInput = document.getElementById('dni');
        const dni = dniInput ? dniInput.value.trim() : '';
        const fechaInput = document.getElementById('fecha');
        const fecha = fechaInput ? fechaInput.value : '';
        
        // Validar DNI
        if (!dni || dni.length !== 8) {
            showFieldError('dniError', 'Ingrese un DNI válido de 8 dígitos');
            return;
        }
        
        showLoading(true);
        
        if (isExitMode) {
            // 🟡 MODO SALIDA: Solo actualizar con DNI
            const existingIndex = allRecords.findIndex(r => r.dni === dni && r.fecha === fecha);
            
            if (existingIndex === -1) {
                showError('❌ No se encontró registro de entrada para hoy. Primero debe registrar su entrada.');
                showLoading(false);
                return;
            }
            
            // Actualizar hora de salida
            allRecords[existingIndex].horaSalida = new Date().toLocaleTimeString('es-PE', { 
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false 
            });
            
            saveData();
            showSuccess(allRecords[existingIndex], 'salida');
            
        } else {
            // 🔵 MODO ENTRADA: Validar todos los campos
            if (!validateEntrance()) {
                showLoading(false);
                return;
            }
            
            // Verificar si ya registró entrada hoy
            if (allRecords.some(r => r.dni === dni && r.fecha === fecha)) {
                showError('⚠️ Ya registró su entrada hoy. Use el botón "Cambiar a REGISTRAR SALIDA" para registrar su salida.');
                showLoading(false);
                return;
            }
            
            const temaInput = document.getElementById('tema');
            const nombreInput = document.getElementById('nombre');
            
            const formData = {
                fecha: fecha,
                horaEntrada: new Date().toLocaleTimeString('es-PE', { 
                    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false 
                }),
                horaSalida: '',
                tema: temaInput ? temaInput.value.trim() : '',
                nombre: nombreInput ? nombreInput.value.trim() : '',
                dni: dni,
                nivel: getSelectedNiveles(),
                timestamp: new Date().toISOString()
            };
            
            allRecords.push(formData);
            saveData();
            showSuccess(formData, 'entrada');
        }
        
        // Enviar a Google Sheets si está configurado
        if (GOOGLE_SCRIPT_URL !== 'TU_URL_DE_GOOGLE_APPS_SCRIPT_AQUI') {
            try {
                const lastRecord = allRecords[allRecords.length - 1];
                await fetch(GOOGLE_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        action: isExitMode ? 'update' : 'create', 
                        data: lastRecord 
                    })
                });
            } catch (err) {
                console.error('Error al enviar a Google Sheets:', err);
            }
        }
        
        showLoading(false);
    });
    
    // Validación DNI - solo números
    const dniInput = document.getElementById('dni');
    if (dniInput) {
        dniInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 8);
        });
    }
    
    // Validación Nombre - solo letras
    const nombreInput = document.getElementById('nombre');
    if (nombreInput) {
        nombreInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
        });
    }
}

/* ==========================================
   VALIDACIÓN MODO ENTRADA
   ========================================== */
function validateEntrance() {
    let isValid = true;
    
    const tema = document.getElementById('tema');
    const nombre = document.getElementById('nombre');
    const fecha = document.getElementById('fecha');
    
    if (!tema || !tema.value.trim()) {
        showFieldError('temaError', 'El tema es obligatorio');
        isValid = false;
    }
    
    if (!nombre || !nombre.value.trim()) {
        showFieldError('nombreError', 'El nombre es obligatorio');
        isValid = false;
    }
    
    if (!fecha || !fecha.value) {
        showFieldError('fechaError', 'La fecha es obligatoria');
        isValid = false;
    }
    
    if (getSelectedNiveles().length === 0) {
        showFieldError('nivelError', 'Seleccione al menos un nivel');
        isValid = false;
    }
    
    return isValid;
}

/* ==========================================
   UTILIDADES
   ========================================== */
function getSelectedNiveles() {
    return Array.from(document.querySelectorAll('input[name="nivel"]:checked'))
        .map(cb => cb.value)
        .join(', ');
}

function saveData() {
    localStorage.setItem('asistencia_db', JSON.stringify(allRecords));
}

function loadData() {
    try {
        allRecords = JSON.parse(localStorage.getItem('asistencia_db')) || [];
    } catch {
        allRecords = [];
    }
}

function showFieldError(id, msg) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = msg;
        el.style.display = 'block';
    }
}

function clearErrors() {
    document.querySelectorAll('.error-msg').forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });
}

function showSuccess(data, type) {
    document.getElementById('formCard').classList.add('hidden');
    document.getElementById('successCard').classList.remove('hidden');
    
    const title = type === 'entrada' ? '✅ Entrada Registrada' : '✅ Salida Registrada';
    const message = type === 'entrada' 
        ? 'Su hora de entrada ha sido registrada correctamente.' 
        : 'Su hora de salida ha sido actualizada correctamente.';
    
    document.querySelector('#successCard h3').textContent = title;
    document.getElementById('successMessage').textContent = message;
    
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
    document.getElementById('errorMessage').textContent = msg;
}

function resetForms() {
    const form = document.getElementById('attendanceForm');
    if (form) form.reset();
    
    document.getElementById('successCard').classList.add('hidden');
    document.getElementById('errorCard').classList.add('hidden');
    document.getElementById('formCard').classList.remove('hidden');
    
    // Si está en modo salida, volver a entrada
    if (isExitMode) {
        toggleExitMode();
    }
    
    // Restaurar fecha
    const today = new Date().toISOString().split('T')[0];
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) {
        fechaInput.value = today;
    }
    
    // Desbloquear campos
    unlockAllFields();
    clearErrors();
    
    // Ocultar wrapper de OTROS
    const otrosWrapper = document.getElementById('otrosWrapper');
    if (otrosWrapper) otrosWrapper.classList.add('hidden');
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.toggle('hidden', !show);
    }
}

/* ==========================================
   CONTROL DE ACCESO
   ========================================== */
function getManualAccess() {
    return localStorage.getItem('form_enabled') !== 'false';
}

function checkFormAccess() {
    const btnSubmit = document.getElementById('btnSubmit');
    const btnToggle = document.getElementById('btnToggleExit');
    const isActive = getManualAccess();
    
    // Validar horario (8:00 a 17:00)
    const hour = new Date().getHours();
    const isTimeOk = hour >= 8 && hour < 17;
    
    const finalState = isActive && isTimeOk;
    
    if (btnSubmit) btnSubmit.disabled = !finalState;
    if (btnToggle) btnToggle.disabled = !finalState;
    
    const statusEl = document.getElementById('accessStatus');
    if (statusEl) {
        statusEl.textContent = finalState ? '🟢 ACTIVO' : '🔴 BLOQUEADO';
        statusEl.style.color = finalState ? 'var(--success)' : 'var(--error)';
    }
}

function toggleFormAccess() {
    const check = document.getElementById('formAccessToggle');
    if (check) {
        localStorage.setItem('form_enabled', check.checked);
        checkFormAccess();
    }
}

/* ==========================================
   ADMIN PANEL
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
            const errorEl = document.getElementById('loginError');
            if (errorEl) errorEl.textContent = 'Usuario o contraseña incorrectos';
        }
    });
}

function loadRecordsForAdmin() {
    loadData();
    const tbody = document.getElementById('recordsBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (allRecords.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;">No hay registros</td></tr>';
        return;
    }
    
    allRecords.forEach((r, i) => {
        tbody.innerHTML += `
            <tr>
                <td>${i+1}</td>
                <td>${formatDateDisplay(r.fecha)}</td>
                <td>${r.horaEntrada}</td>
                <td style="color: ${r.horaSalida ? 'var(--success)' : 'var(--warning)'}; font-weight: ${r.horaSalida ? '600' : '400'}">
                    ${r.horaSalida || 'Pendiente'}
                </td>
                <td>${r.tema}</td>
                <td><strong>${r.nombre}</strong></td>
                <td><code>${r.dni}</code></td>
                <td>${r.nivel}</td>
            </tr>
        `;
    });
    
    const totalEl = document.getElementById('totalRegistros');
    if (totalEl) totalEl.textContent = allRecords.length;
    
    const today = new Date().toISOString().split('T')[0];
    const hoyEl = document.getElementById('totalHoy');
    if (hoyEl) hoyEl.textContent = allRecords.filter(r => r.fecha === today).length;
}

function closeLoginModal() {
    document.getElementById('loginModal').classList.add('hidden');
}

function closeAdminPanel() {
    document.getElementById('adminPanel').classList.add('hidden');
}

function togglePassword() {
    const p = document.getElementById('adminPass');
    const i = document.getElementById('eyeIcon');
    if (!p || !i) return;
    
    if (p.type === 'password') {
        p.type = 'text';
        i.classList.remove('fa-eye');
        i.classList.add('fa-eye-slash');
    } else {
        p.type = 'password';
        i.classList.remove('fa-eye-slash');
        i.classList.add('fa-eye');
    }
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

function formatDateDisplay(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

// Event Listeners Admin
const adminToggle = document.getElementById('adminToggle');
if (adminToggle) {
    adminToggle.addEventListener('click', () => {
        document.getElementById('loginModal').classList.remove('hidden');
    });
}

const filterDate = document.getElementById('filterDate');
if (filterDate) {
    filterDate.addEventListener('change', () => {
        const date = filterDate.value;
        const filtered = date ? allRecords.filter(r => r.fecha === date) : allRecords;
        
        const tbody = document.getElementById('recordsBody');
        if (tbody) {
            tbody.innerHTML = filtered.map((r, i) => `
                <tr>
                    <td>${i+1}</td>
                    <td>${formatDateDisplay(r.fecha)}</td>
                    <td>${r.horaEntrada}</td>
                    <td>${r.horaSalida || '-'}</td>
                    <td>${r.tema}</td>
                    <td>${r.nombre}</td>
                    <td>${r.dni}</td>
                    <td>${r.nivel}</td>
                </tr>
            `).join('');
        }
    });
}

const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', () => {
        const txt = searchInput.value.toLowerCase();
        const filtered = allRecords.filter(r => 
            r.nombre.toLowerCase().includes(txt) || 
            r.dni.includes(txt) ||
            (r.tema && r.tema.toLowerCase().includes(txt))
        );
        
        const tbody = document.getElementById('recordsBody');
        if (tbody) {
            tbody.innerHTML = filtered.map((r, i) => `
                <tr>
                    <td>${i+1}</td>
                    <td>${formatDateDisplay(r.fecha)}</td>
                    <td>${r.horaEntrada}</td>
                    <td>${r.horaSalida || '-'}</td>
                    <td>${r.tema}</td>
                    <td>${r.nombre}</td>
                    <td>${r.dni}</td>
                    <td>${r.nivel}</td>
                </tr>
            `).join('');
        }
    });
}

// Cerrar modales al hacer clic fuera
document.getElementById('loginModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'loginModal') closeLoginModal();
});

document.getElementById('adminPanel')?.addEventListener('click', (e) => {
    if (e.target.id === 'adminPanel') closeAdminPanel();
});