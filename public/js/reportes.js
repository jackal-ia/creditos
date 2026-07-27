// ============================================
// REPORTES TIENDA CARACAS - LÓGICA
// ============================================

const token = localStorage.getItem('token') || '';
let datosReporte = [];
let resumenReporte = {};

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Set fecha actual en header
    document.getElementById('fechaActual').textContent = new Date().toLocaleDateString('es-VE', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    // Set fechas por defecto (mes actual)
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    document.getElementById('filtroFechaDesde').value = primerDia.toISOString().split('T')[0];
    document.getElementById('filtroFechaHasta').value = hoy.toISOString().split('T')[0];
});

// ============================================
// GENERAR REPORTE
// ============================================
async function generarReporte() {
    showLoading(true);

    try {
        const filtros = {
            fecha_desde: document.getElementById('filtroFechaDesde').value || null,
            fecha_hasta: document.getElementById('filtroFechaHasta').value || null,
            estado: document.getElementById('filtroEstado').value,
            monto_min: document.getElementById('filtroMontoMin').value || null,
            monto_max: document.getElementById('filtroMontoMax').value || null,
            nombre_cliente: document.getElementById('filtroNombre').value || null,
            cedula: document.getElementById('filtroCedula').value || null
        };

        const response = await fetch('/api/reportes/caracas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(filtros)
        });

        const data = await response.json();

        if (!data.exito) {
            throw new Error(data.error || 'Error al generar reporte');
        }

        datosReporte = data.datos || [];
        resumenReporte = data.resumen || {};

        // Renderizar todo
        renderizarResumen();
        renderizarTabla();
        renderizarGraficos();

        // Mostrar secciones
        document.getElementById('resumenSection').style.display = 'block';
        document.getElementById('tablaSection').style.display = 'block';
        document.getElementById('graficosSection').style.display = 'grid';
        document.getElementById('exportarSection').style.display = 'block';

        showAlert('Reporte generado: ' + data.total + ' registros', 'success');

    } catch (e) {
        console.error('Error:', e);
        showAlert('Error: ' + e.message, 'error');
    } finally {
        showLoading(false);
    }
}

// ============================================
// RENDERIZAR RESUMEN
// ============================================
function renderizarResumen() {
    document.getElementById('resTotalClientes').textContent = formatNumber(resumenReporte.total_clientes || 0);
    document.getElementById('resDeudaTotal').textContent = formatCurrency(resumenReporte.total_deuda || 0);
    document.getElementById('resTotalPagado').textContent = formatCurrency(resumenReporte.total_depositado || 0);
    document.getElementById('resClientesMora').textContent = formatNumber(resumenReporte.clientes_mora || 0);
    document.getElementById('resPromedioDeuda').textContent = formatCurrency(resumenReporte.promedio_deuda || 0);
}

// ============================================
// RENDERIZAR TABLA
// ============================================
function renderizarTabla() {
    const tbody = document.getElementById('tablaBody');
    const contador = document.getElementById('tablaContador');

    contador.textContent = datosReporte.length + ' registros';

    if (datosReporte.length === 0) {
        tbody.innerHTML = \`<tr><td colspan="10" style="text-align:center;padding:30px;color:#718096;">No hay registros que coincidan con los filtros</td></tr>\`;
        return;
    }

    tbody.innerHTML = datosReporte.map((row, index) => {
        const estado = calcularEstado(row);
        return \`
            <tr>
                <td>\${index + 1}</td>
                <td>\${row.nro_factura || '-'}</td>
                <td>\${row.nombre_apellido || '-'}</td>
                <td>\${row.cedula || '-'}</td>
                <td class="monto-cell">\${formatCurrency(row.monto_factura || 0)}</td>
                <td>\${row.cuotas || '-'}</td>
                <td class="monto-cell monto-pagado">\${formatCurrency(row.monto_depositados || 0)}</td>
                <td class="monto-cell monto-deuda">\${formatCurrency(row.deuda || 0)}</td>
                <td><span class="estado-badge estado-\${estado.clase}">\${estado.texto}</span></td>
                <td>\${formatearFecha(row.fecha_factura)}</td>
            </tr>
        \`;
    }).join('');
}

// ============================================
// RENDERIZAR GRÁFICOS
// ============================================
function renderizarGraficos() {
    // Gráfico de barras - Deuda por estado
    const porEstado = {
        pendiente: datosReporte.filter(r => calcularEstado(r).clase === 'pendiente').reduce((s, r) => s + (parseFloat(r.deuda) || 0), 0),
        pagado: datosReporte.filter(r => calcularEstado(r).clase === 'pagado').reduce((s, r) => s + (parseFloat(r.monto_depositados) || 0), 0),
        mora: datosReporte.filter(r => calcularEstado(r).clase === 'mora').reduce((s, r) => s + (parseFloat(r.deuda) || 0), 0)
    };

    const maxValor = Math.max(porEstado.pendiente, porEstado.pagado, porEstado.mora, 1);

    document.getElementById('graficoBarras').innerHTML = \`
        <div class="barra-item">
            <div class="barra-label">Pendiente</div>
            <div class="barra-track">
                <div class="barra-fill" style="width:\${(porEstado.pendiente/maxValor*100)}%;background:linear-gradient(90deg,#f6e05e,#d69e2e);">
                    <span>\${formatCurrency(porEstado.pendiente)}</span>
                </div>
            </div>
        </div>
        <div class="barra-item">
            <div class="barra-label">Pagado</div>
            <div class="barra-track">
                <div class="barra-fill" style="width:\${(porEstado.pagado/maxValor*100)}%;background:linear-gradient(90deg,#68d391,#38a169);">
                    <span>\${formatCurrency(porEstado.pagado)}</span>
                </div>
            </div>
        </div>
        <div class="barra-item">
            <div class="barra-label">En Mora</div>
            <div class="barra-track">
                <div class="barra-fill" style="width:\${(porEstado.mora/maxValor*100)}%;background:linear-gradient(90deg,#fc8181,#e53e3e);">
                    <span>\${formatCurrency(porEstado.mora)}</span>
                </div>
            </div>
        </div>
    \`;

    // Gráfico pastel - Distribución
    const total = resumenReporte.total_facturado || 1;
    const pagadoPct = ((resumenReporte.total_depositado || 0) / total * 100).toFixed(1);
    const pendientePct = ((resumenReporte.total_deuda || 0) / total * 100).toFixed(1);

    document.getElementById('graficoPastel').innerHTML = \`
        <div class="pastel-container">
            <svg class="pastel-svg" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" stroke-width="20"/>
                <circle cx="50" cy="50" r="40" fill="none" stroke="#48bb78" stroke-width="20" 
                    stroke-dasharray="\${pagadoPct * 2.51} 251" stroke-linecap="round"/>
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f56565" stroke-width="20" 
                    stroke-dasharray="\${pendientePct * 2.51} 251" 
                    stroke-dashoffset="\${-pagadoPct * 2.51}" stroke-linecap="round"/>
            </svg>
        </div>
        <div class="pastel-legend">
            <div class="legend-item">
                <div class="legend-color" style="background:#48bb78"></div>
                <span class="legend-label">Pagado</span>
                <span class="legend-value">\${pagadoPct}%</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background:#f56565"></div>
                <span class="legend-label">Pendiente</span>
                <span class="legend-value">\${pendientePct}%</span>
            </div>
        </div>
    \`;
}

// ============================================
// EXPORTAR EXCEL
// ============================================
function exportarExcel() {
    if (datosReporte.length === 0) {
        showAlert('No hay datos para exportar', 'error');
        return;
    }

    const datosExcel = datosReporte.map(row => ({
        'Nro Factura': row.nro_factura || '',
        'Cliente': row.nombre_apellido || '',
        'Cédula': row.cedula || '',
        'Monto Factura': parseFloat(row.monto_factura) || 0,
        'Cuotas': row.cuotas || '',
        'Depositado': parseFloat(row.monto_depositados) || 0,
        'Deuda': parseFloat(row.deuda) || 0,
        'Estado': calcularEstado(row).texto,
        'Fecha Factura': row.fecha_factura || ''
    }));

    // Agregar fila de resumen
    datosExcel.push({});
    datosExcel.push({
        'Nro Factura': 'RESUMEN',
        'Cliente': 'Total Clientes: ' + resumenReporte.total_clientes,
        'Monto Factura': resumenReporte.total_facturado,
        'Depositado': resumenReporte.total_depositado,
        'Deuda': resumenReporte.total_deuda,
        'Estado': 'Clientes Mora: ' + resumenReporte.clientes_mora
    });

    const ws = XLSX.utils.json_to_sheet(datosExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte Caracas');

    // Ajustar anchos de columna
    ws['!cols'] = [
        {wch: 12}, {wch: 30}, {wch: 15}, {wch: 15}, 
        {wch: 10}, {wch: 15}, {wch: 15}, {wch: 12}, {wch: 15}
    ];

    XLSX.writeFile(wb, 'reporte_caracas_' + new Date().toISOString().split('T')[0] + '.xlsx');
    showAlert('Excel exportado correctamente', 'success');
}

// ============================================
// EXPORTAR PDF
// ============================================
function exportarPDF() {
    if (datosReporte.length === 0) {
        showAlert('No hay datos para exportar', 'error');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');

    // Encabezado
    doc.setFontSize(20);
    doc.setTextColor(26, 54, 93);
    doc.text('Reporte Tienda Caracas', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Generado: ' + new Date().toLocaleString('es-VE'), 14, 28);
    doc.text('Total Registros: ' + datosReporte.length, 14, 33);

    // Línea separadora
    doc.setDrawColor(26, 54, 93);
    doc.setLineWidth(0.5);
    doc.line(14, 36, 280, 36);

    // Tabla
    const headers = [['Nro', 'Factura', 'Cliente', 'Cédula', 'Monto', 'Cuotas', 'Depositado', 'Deuda', 'Estado', 'Fecha']];
    const rows = datosReporte.map((row, i) => [
        i + 1,
        row.nro_factura || '-',
        row.nombre_apellido || '-',
        row.cedula || '-',
        formatCurrency(row.monto_factura || 0),
        row.cuotas || '-',
        formatCurrency(row.monto_depositados || 0),
        formatCurrency(row.deuda || 0),
        calcularEstado(row).texto,
        formatearFecha(row.fecha_factura)
    ]);

    doc.autoTable({
        head: headers,
        body: rows,
        startY: 42,
        theme: 'striped',
        headStyles: {
            fillColor: [26, 54, 93],
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: 'bold'
        },
        bodyStyles: {
            fontSize: 8,
            textColor: [50, 50, 50]
        },
        alternateRowStyles: {
            fillColor: [240, 248, 255]
        },
        margin: { top: 42, left: 14, right: 14 },
        styles: {
            overflow: 'linebreak',
            cellWidth: 'wrap'
        },
        columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 20 },
            2: { cellWidth: 35 },
            3: { cellWidth: 20 },
            4: { cellWidth: 25 },
            5: { cellWidth: 15 },
            6: { cellWidth: 25 },
            7: { cellWidth: 25 },
            8: { cellWidth: 20 },
            9: { cellWidth: 20 }
        },
        didDrawPage: function(data) {
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text('Inversora IPSFA - Sistema de Créditos', 14, doc.internal.pageSize.height - 10);
            doc.text('Página ' + data.pageNumber, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
        }
    });

    doc.save('reporte_caracas_' + new Date().toISOString().split('T')[0] + '.pdf');
    showAlert('PDF exportado correctamente', 'success');
}

// ============================================
// LIMPIAR FILTROS
// ============================================
function limpiarFiltros() {
    document.getElementById('filtroFechaDesde').value = '';
    document.getElementById('filtroFechaHasta').value = '';
    document.getElementById('filtroEstado').value = 'todos';
    document.getElementById('filtroMontoMin').value = '';
    document.getElementById('filtroMontoMax').value = '';
    document.getElementById('filtroNombre').value = '';
    document.getElementById('filtroCedula').value = '';

    // Ocultar resultados
    document.getElementById('resumenSection').style.display = 'none';
    document.getElementById('tablaSection').style.display = 'none';
    document.getElementById('graficosSection').style.display = 'none';
    document.getElementById('exportarSection').style.display = 'none';

    datosReporte = [];
    resumenReporte = {};
}

// ============================================
// HELPERS
// ============================================
function calcularEstado(row) {
    const deuda = parseFloat(row.deuda) || 0;
    const depositado = parseFloat(row.monto_depositados) || 0;
    const total = parseFloat(row.monto_factura) || 0;
    const fecha = new Date(row.fecha_factura);
    const dias = (new Date() - fecha) / (1000 * 60 * 60 * 24);

    if (deuda <= 0 || depositado >= total) {
        return { texto: 'Pagado', clase: 'pagado' };
    }
    if (dias > 30 && deuda > 0) {
        return { texto: 'En Mora', clase: 'mora' };
    }
    return { texto: 'Pendiente', clase: 'pendiente' };
}

function formatCurrency(value) {
    return new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: 'VES',
        minimumFractionDigits: 2
    }).format(value).replace('VES', 'Bs');
}

function formatNumber(value) {
    return new Intl.NumberFormat('es-VE').format(value);
}

function formatearFecha(fecha) {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-VE');
}

function showLoading(show) {
    let overlay = document.querySelector('.loading-overlay');
    if (show) {
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            overlay.innerHTML = \`
                <div class="loading-spinner"></div>
                <div class="loading-text">Generando reporte...</div>
            \`;
            document.body.appendChild(overlay);
        }
        overlay.style.display = 'flex';
    } else if (overlay) {
        overlay.style.display = 'none';
    }
}

function showAlert(message, type) {
    // Remover alerta anterior
    const old = document.querySelector('.alert-reporte.show');
    if (old) old.remove();

    const alert = document.createElement('div');
    alert.className = 'alert-reporte ' + type + ' show';
    alert.innerHTML = '<i class="fas fa-' + (type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle') + '"></i> ' + message;

    const container = document.querySelector('.reportes-container');
    container.insertBefore(alert, container.firstChild);

    setTimeout(() => alert.remove(), 5000);
}
