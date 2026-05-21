let isExitMode = false;
let allRecords = [];

document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('fecha').value = today;
    
    checkSystemStatus();
    
    document.getElementById('attendanceForm').addEventListener('submit', handleSubmit);
});

function checkSystemStatus() {
    const isActive = localStorage.getItem('form_enabled') !== 'false';
    const now = new Date();
    const hours = now.getHours();
    const isTimeOk = hours >= 8 && hours < 18; // 8 AM a 6 PM
    
    const btn = document.querySelector('.btn-primary');
    if (btn) {
        btn.disabled = !(isActive && isTimeOk);
    }
}

function toggleFormAccess() {
    const toggle = document.getElementById('formAccessToggle');
    const status = document.getElementById('accessStatus');
    const isActive = toggle.checked;
    
    localStorage.setItem('form_enabled', isActive);
    status.textContent = isActive ? 'ACTIVO' : 'BLOQUEADO';
    status.style.color = isActive ? '#48bb78' : '#f56565';
    
    checkSystemStatus();
    
    alert(isActive ? '✅ Sistema ACTIVADO' : '🔒 Sistema DESACTIVADO');
}

function toggleExitMode() {
    isExitMode = !isExitMode;
    const container = document.getElementById('personalDataContainer');
    const btn = document.querySelector('.btn-primary');
    const toggleBtn = document.querySelector('.btn-toggle');
    
    if (isExitMode) {
        container.style.display = 'none';
        btn.textContent = 'REGISTRAR SALIDA';
        toggleBtn.textContent = 'Cancelar: VOLVER A ENTRADA';
    } else {
        container.style.display = 'block';
        btn.textContent = 'REGISTRAR ENTRADA';
        toggleBtn.textContent = 'Cambiar a: REGISTRAR SALIDA';
    }
}

function handleSubmit(e) {
    e.preventDefault();
    
    const dni = document.getElementById('dni').value;
    const fecha = document.getElementById('fecha').value;
    
    if (isExitMode) {
        const existing = allRecords.find(r => r.dni === dni && r.fecha === fecha);
        if (!existing) {
            alert('❌ No se encontró registro de entrada');
            return;
        }
        if (existing.horaSalida) {
            alert('⚠️ Ya registró salida a las ' + existing.horaSalida);
            return;
        }
        existing.horaSalida = new Date().toLocaleTimeString();
        alert('✅ Salida registrada: ' + existing.horaSalida);
    } else {
        const exists = allRecords.find(r => r.dni === dni && r.fecha === fecha);
        if (exists) {
            alert('⚠️ Ya registró entrada a las ' + exists.horaEntrada);
            return;
        }
        
        allRecords.push({
            fecha: fecha,
            horaEntrada: new Date().toLocaleTimeString(),
            horaSalida: '',
            nombre: document.getElementById('nombre').value,
            dni: dni
        });
        alert('✅ Entrada registrada');
    }
    
    localStorage.setItem('asistencia_db', JSON.stringify(allRecords));
    resetForms();
}

function resetForms() {
    document.getElementById('attendanceForm').reset();
    document.getElementById('fecha').value = new Date().toISOString().split('T')[0];
    if (isExitMode) toggleExitMode();
}

function checkLogin() {
    const user = document.getElementById('adminUser').value;
    const pass = document.getElementById('adminPass').value;
    
    if (user === 'admin' && pass === 'admin2026') {
        document.getElementById('loginModal').classList.add('hidden');
        document.getElementById('adminPanel').classList.remove('hidden');
        loadRecordsForAdmin();
    } else {
        alert('❌ Credenciales incorrectas');
    }
}

function loadRecordsForAdmin() {
    const data = JSON.parse(localStorage.getItem('asistencia_db') || '[]');
    const tbody = document.getElementById('recordsBody');
    tbody.innerHTML = '';
    
    data.forEach(r => {
        tbody.innerHTML += `
            <tr>
                <td>${r.fecha}</td>
                <td>${r.horaEntrada}</td>
                <td>${r.horaSalida || 'Pendiente'}</td>
                <td>${r.nombre}</td>
                <td>${r.dni}</td>
            </tr>
        `;
    });
}

function downloadExcel() {
    const data = JSON.parse(localStorage.getItem('asistencia_db') || '[]');
    let csv = 'Fecha,Entrada,Salida,Nombre,DNI\n';
    data.forEach(r => {
        csv += `${r.fecha},${r.horaEntrada},${r.horaSalida || ''},${r.nombre},${r.dni}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'asistencia.csv';
    link.click();
}