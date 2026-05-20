/* ==========================================
   CONFIGURACIÓN
   ========================================== */
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby1Z5lUq9I_7qomDieZWv-rRGeY_nVBjPXXw2eZhHJxFlXTDFe-0m4wafJeITjo0Hox/exec';
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin2026'
};

let allRecords = [];
let filteredRecords = [];

/* ==========================================
   INICIALIZACIÓN
   ========================================== */
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Página cargada correctamente');
    
    // Establecer fecha de hoy automáticamente
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayString = `${year}-${month}-${day}`;
    
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) {
        fechaInput.value = todayString;
        fechaInput.min = todayString;
        console.log('📅 Fecha establecida:', todayString);
    }
    
    setupForm();
    setupLogin();
    setupAdminToggle();
});

/* ==========================================
   CONFIGURAR FORMULARIO
   ========================================== */
function setupForm() {
    const form = document.getElementById('attendanceForm');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearErrors();
        
        // Validar horario (8:00 a.m. - 13:30 p.m.)
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();
        const totalMinutes = currentHour * 60 + currentMinutes;
        
        if (totalMinutes < 480 || totalMinutes > 810) {
            showError('⏰ El registro solo está habilitado de 8:00 a.m. a 1:30 p.m.\nHora actual: ' + now.toLocaleTimeString());
            return;
        }
        
        if (!validateForm()) return;
        
        const dni = document.getElementById('dni').value.trim();
        const fecha = document.getElementById('fecha').value;
        
        if (isDuplicate(dni, fecha)) {
            showError('⚠️ Ya existe un registro con este DNI para la fecha seleccionada.');
            return;
        }
        
        showLoading(true);
        
        const formData = {
            fecha: fecha,
            hora: now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
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
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            }
            showSuccess(formData);
        } catch (error) {
            showSuccess(formData, true);
        }
        
        showLoading(false);
    });
    
    // Validación DNI
    const dniInput = document.getElementById('dni');
    if (dniInput) {
        dniInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 8);
        });
    }
    
    // Validación Nombre
    const nombreInput = document.getElementById('nombre');
    if (nombreInput) {
        nombreInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
        });
    }

    // Lógica para el campo "OTROS"
    const checkOtros = document.getElementById('checkOtros');
    const otrosWrapper = document.getElementById('otrosWrapper');
    const otrosInput = document.getElementById('otrosNivel');

    if (checkOtros && otrosWrapper && otrosInput) {
        checkOtros.addEventListener('change', function() {
            if (this.checked) {
                otrosWrapper.classList.remove('hidden');
                otrosInput.focus();
            } else {
                otrosWrapper.classList.add('hidden');
                otrosInput.value = '';
            }
        });
    }
}

/* ==========================================
   VALIDACIÓN
   ========================================== */
function validateForm() {
    let isValid = true;
    
    const fecha = document.getElementById('fecha').value;
    if (!fecha) {
        showFieldError('fechaError', 'Seleccione la fecha');
        isValid = false;
    }
    
    const tema = document.getElementById('tema').value.trim();
    if (!tema) {
        showFieldError('temaError', 'El tema es obligatorio');
        isValid = false;
    }
    
    const nombre = document.getElementById('nombre').value.trim();
    if (!nombre) {
        showFieldError('nombreError', 'El nombre es obligatorio');
        isValid = false;
    }
    
    const dni = document.getElementById('dni').value.trim();
    if (!dni) {
        showFieldError('dniError', 'El DNI es obligatorio');
        isValid = false;
    } else if (dni.length !== 8) {
        showFieldError('dniError', 'El DNI debe tener 8 dígitos');
        isValid = false;
    }
    
    const niveles = getSelectedNiveles();
    if (niveles.length === 0) {
        showFieldError('nivelError', 'Seleccione al menos un nivel');
        isValid = false;
    }
    
    const checkOtros = document.getElementById('checkOtros');
    const otrosInput = document.getElementById('otrosNivel');
    if (checkOtros && checkOtros.checked) {
        if (!otrosInput.value.trim()) {
            showFieldError('otrosError', 'Especifique el nivel');
            isValid = false;
        }
    }
    
    return isValid;
}

function showFieldError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.style.display = 'block';
    }
}

function clearErrors() {
    document.querySelectorAll('.error-msg').forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });
}

function getSelectedNiveles() {
    const checkboxes = document.querySelectorAll('input[name="nivel"]:checked');
    const niveles = Array.from(checkboxes).map(cb => cb.value);
    
    if (niveles.includes('OTROS')) {
        const otrosText = document.getElementById('otrosNivel').value.trim();
        const index = niveles.indexOf('OTROS');
        if (otrosText) {
            niveles[index] = 'OTROS: ' + otrosText.toUpperCase();
        }
    }
    
    return niveles;
}

/* ==========================================
   ALMACENAMIENTO LOCAL
   ========================================== */
function getLocalRecords() {
    try {
        return JSON.parse(localStorage.getItem('asistencia_records') || '[]');
    } catch {
        return [];
    }
}

function saveLocalRecord(data) {
    const records = getLocalRecords();
    records.push(data);
    localStorage.setItem('asistencia_records', JSON.stringify(records));
}

function isDuplicate(dni, fecha) {
    const records = getLocalRecords();
    return records.some(r => r.dni === dni && r.fecha === fecha);
}

/* ==========================================
   MOSTRAR ÉXITO / ERROR
   ========================================== */
function showSuccess(data, isLocal = false) {
    document.getElementById('formCard').classList.add('hidden');
    document.getElementById('successCard').classList.remove('hidden');
    
    const details = document.getElementById('successDetails');
    let html = `
        <p><strong>📅 Fecha:</strong> ${data.fecha}</p>
        <p><strong>🕐 Hora:</strong> ${data.hora}</p>
        <p><strong>👤 Docente:</strong> ${data.nombre}</p>
        <p><strong>🆔 DNI:</strong> ${data.dni}</p>
        <p><strong>📚 Nivel:</strong> ${data.nivel}</p>
    `;
    if (isLocal) {
        html += `<p style="color: var(--warning); margin-top: 0.5rem;"><i class="fas fa-exclamation-circle"></i> Guardado localmente</p>`;
    }
    details.innerHTML = html;
}

function showError(message) {
    document.getElementById('formCard').classList.add('hidden');
    document.getElementById('errorCard').classList.remove('hidden');
    document.getElementById('errorMessage').textContent = message;
}

function resetForm() {
    document.getElementById('attendanceForm').reset();
    clearErrors();
    
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    document.getElementById('fecha').value = `${year}-${month}-${day}`;
    
    const otrosWrapper = document.getElementById('otrosWrapper');
    const otrosInput = document.getElementById('otrosNivel');
    const checkOtros = document.getElementById('checkOtros');
    
    if (otrosWrapper) otrosWrapper.classList.add('hidden');
    if (otrosInput) otrosInput.value = '';
    if (checkOtros) checkOtros.checked = false;
    
    document.getElementById('formCard').classList.remove('hidden');
    document.getElementById('successCard').classList.add('hidden');
    document.getElementById('errorCard').classList.add('hidden');
}

/* ==========================================
   ADMIN - LOGIN
   ========================================== */
function setupAdminToggle() {
    const btn = document.getElementById('adminToggle');
    if (btn) {
        btn.addEventListener('click', () => {
            document.getElementById('loginModal').classList.remove('hidden');
        });
    }
}

function closeLoginModal() {
    document.getElementById('loginModal').classList.add('hidden');
    document.getElementById('loginError').textContent = '';
    document.getElementById('loginForm').reset();
}

function togglePassword() {
    const passInput = document.getElementById('adminPass');
    const eyeIcon = document.getElementById('eyeIcon');
    if (passInput.type === 'password') {
        passInput.type = 'text';
        eyeIcon.classList.remove('fa-eye');
        eyeIcon.classList.add('fa-eye-slash');
    } else {
        passInput.type = 'password';
        eyeIcon.classList.remove('fa-eye-slash');
        eyeIcon.classList.add('fa-eye');
    }
}

function setupLogin() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const user = document.getElementById('adminUser').value.trim();
            const pass = document.getElementById('adminPass').value;
            
            if (user === ADMIN_CREDENTIALS.username && pass === ADMIN_CREDENTIALS.password) {
                closeLoginModal();
                document.getElementById('adminPanel').classList.remove('hidden');
                loadRecords();
            } else {
                document.getElementById('loginError').textContent = 'Usuario o contraseña incorrectos';
            }
        });
    }
}

function closeAdminPanel() {
    document.getElementById('adminPanel').classList.add('hidden');
}

/* ==========================================
   ADMIN - CARGAR Y MOSTRAR REGISTROS
   ========================================== */
function loadRecords() {
    allRecords = getLocalRecords();
    filteredRecords = [...allRecords];
    renderRecords(filteredRecords);
    updateStats();
}

function renderRecords(records) {
    const tbody = document.getElementById('recordsBody');
    if (!tbody) return;
    
    if (records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--gray-400);">No se encontraron registros</td></tr>';
        document.getElementById('recordsCount').textContent = '0 registros encontrados';
        return;
    }
    
    tbody.innerHTML = records.map((r, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${formatDateDisplay(r.fecha)}</td>
            <td>${r.hora}</td>
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
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const todayCount = allRecords.filter(r => r.fecha === todayStr).length;
    document.getElementById('totalHoy').textContent = todayCount;
    
    const allNiveles = new Set();
    allRecords.forEach(r => {
        r.nivel.split(', ').forEach(n => {
            if (n) allNiveles.add(n.trim());
        });
    });
    document.getElementById('totalNiveles').textContent = allNiveles.size;
}

/* ==========================================
   ADMIN - FILTROS Y BÚSQUEDA
   ========================================== */
function filterRecords() {
    const searchText = document.getElementById('searchInput').value.trim().toLowerCase();
    const dateFilter = document.getElementById('filterDate').value;
    
    filteredRecords = allRecords.filter(record => {
        let matchesSearch = true;
        let matchesDate = true;
        
        if (searchText) {
            matchesSearch = 
                record.nombre.toLowerCase().includes(searchText) ||
                record.dni.includes(searchText) ||
                record.tema.toLowerCase().includes(searchText);
        }
        
        if (dateFilter) {
            matchesDate = record.fecha === dateFilter;
        }
        
        return matchesSearch && matchesDate;
    });
    
    renderRecords(filteredRecords);
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterDate').value = '';
    filteredRecords = [...allRecords];
    renderRecords(filteredRecords);
}

/* ==========================================
   ADMIN - DESCARGAR EXCEL (CSV)
   ========================================== */
function downloadExcel() {
    if (filteredRecords.length === 0) {
        alert('No hay registros para exportar.');
        return;
    }
    
    const headers = ['N°', 'Fecha', 'Hora', 'Tema', 'Docente', 'DNI', 'Nivel'];
    let csv = '\uFEFF'; // BOM para Excel
    csv += headers.join(';') + '\n';
    
    filteredRecords.forEach((r, i) => {
        csv += [
            i + 1,
            formatDateDisplay(r.fecha),
            r.hora,
            `"${r.tema.replace(/"/g, '""')}"`,
            `"${r.nombre.replace(/"/g, '""')}"`,
            r.dni,
            `"${r.nivel}"`
        ].join(';') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const today = new Date().toISOString().split('T')[0];
    
    link.href = URL.createObjectURL(blob);
    link.download = `Asistencia_Docente_${today}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
}

/* ==========================================
   ADMIN - IMPRIMIR REPORTE
   ========================================== */
function printReport() {
    if (filteredRecords.length === 0) {
        alert('No hay registros para imprimir.');
        return;
    }
    window.print();
}

/* ==========================================
   UTILIDADES
   ========================================== */
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.toggle('hidden', !show);
    }
}

function formatDateDisplay(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

// Cerrar modales
document.getElementById('loginModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'loginModal') closeLoginModal();
});

document.getElementById('adminPanel')?.addEventListener('click', (e) => {
    if (e.target.id === 'adminPanel') closeAdminPanel();
});

// Búsqueda en tiempo real
document.getElementById('searchInput')?.addEventListener('input', filterRecords);