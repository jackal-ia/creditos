/**
 * asistente-widget.js — Widget flotante de chat del Asistente Virtual IPSFA
 * =====================================================================
 * Vanilla JS (ES6, compatible navegadores 2020+), sin dependencias externas.
 *
 * Contratos (ver SPEC.md):
 *   GET  /api/asistente/bienvenida   -> {exito, mensaje|respuesta, ...}
 *   GET  /api/asistente/sugerencias  -> {exito, sugerencias:[...]} | [...]
 *   POST /api/asistente/ia/consultar -> body {pregunta, tienda}
 *        -> {exito, respuesta, grafico:null|{tipo,titulo,chart,series,categorias,moneda}, meta:{ia,...}}
 *
 * Fase 2: si la respuesta trae `grafico`, se renderiza con ApexCharts
 * (vendored en js/lib/apexcharts.min.js) dentro de la burbuja del asistente.
 * Si window.ApexCharts no existe, se muestra solo el texto con un aviso.
 * Cuando meta.ia===true se muestra un badge "IA" discreto en el header.
 *
 * Seguridad XSS: todo texto proveniente de la BD o del usuario se inserta
 * con textContent / createTextNode. innerHTML SOLO se usa para markup
 * estático propio (sin interpolación de datos). Las negritas markdown
 * (**texto**) de la respuesta del asistente se convierten escapando primero
 * el HTML y luego aplicando el replace sobre el texto ya escapado.
 */
(function () {
  'use strict';

  // ------------------------------------------------------------------
  // Utilidades base
  // ------------------------------------------------------------------

  /** Obtiene el token JWT almacenado en localStorage. */
  function obtenerToken() {
    try {
      return localStorage.getItem('token') || '';
    } catch (e) {
      return '';
    }
  }

  /** Obtiene el objeto usuario almacenado en localStorage ({nombre, rol, tienda}). */
  function obtenerUsuario() {
    try {
      var raw = localStorage.getItem('usuario');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  /** Headers estándar para todas las llamadas autenticadas a la API. */
  function headersAuth() {
    return {
      'Authorization': 'Bearer ' + obtenerToken(),
      'Content-Type': 'application/json'
    };
  }

  /**
   * Fetch autenticado con manejo de 401 (sesión expirada → redirige al login).
   * Devuelve el JSON parseado o lanza error.
   */
  function fetchAuth(url, opciones) {
    opciones = opciones || {};
    opciones.headers = headersAuth();
    return fetch(url, opciones).then(function (res) {
      if (res.status === 401) {
        // Sesión expirada o token inválido: volver al login
        window.location.href = '/';
        throw new Error('Sesión expirada');
      }
      if (res.status === 429) {
        // Rate limit: mostrar el mensaje amigable del servidor si viene
        // en el body (ej. "¡Un momentico!..."); si no se puede leer,
        // comportamiento genérico.
        return res.json().then(function (cuerpo) {
          throw new Error((cuerpo && cuerpo.error) ? cuerpo.error : 'Error HTTP 429');
        }, function () {
          throw new Error('Error HTTP 429');
        });
      }
      if (!res.ok) {
        throw new Error('Error HTTP ' + res.status);
      }
      return res.json();
    });
  }

  /**
   * Convierte la respuesta del asistente (texto plano con **negritas** markdown
   * simples) en HTML seguro: primero escapa TODO el HTML y luego aplica el
   * replace de **texto** → <strong>texto</strong> sobre el texto ya escapado.
   * Así, cualquier etiqueta inyectada desde BD queda neutralizada.
   */
  function formatearRespuestaSeguro(texto) {
    var div = document.createElement('div');
    div.textContent = String(texto == null ? '' : texto);
    var escapado = div.innerHTML;
    // Negritas markdown simples sobre el texto YA escapado
    escapado = escapado.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Saltos de línea para legibilidad (el texto ya está escapado)
    escapado = escapado.replace(/\n/g, '<br>');
    return escapado;
  }

  /** Formatea un número con separadores es-VE (sin símbolo de moneda). */
  function formatoNumeroVE(valor) {
    var n = Number(valor);
    if (!isFinite(n)) { return String(valor == null ? '' : valor); }
    return n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /** Formatea un monto es-VE anteponiendo la moneda del contrato (ej. "Bs 1.234,56"). */
  function formatoMonedaVE(valor, moneda) {
    var txt = formatoNumeroVE(valor);
    return moneda ? (moneda + ' ' + txt) : txt;
  }

  // ------------------------------------------------------------------
  // Construcción del DOM del widget (markup estático propio)
  // ------------------------------------------------------------------

  var HTML_WIDGET =
    '<button id="asst-boton" class="asst-boton" type="button" aria-label="Abrir asistente virtual" title="Asistente IPSFA">' +
      '<span class="asst-boton-icono" aria-hidden="true">🤖</span>' +
      '<span id="asst-badge" class="asst-badge asst-oculto" aria-label="Notificaciones no leídas">0</span>' +
    '</button>' +
    '<div id="asst-ventana" class="asst-ventana asst-oculto" role="dialog" aria-label="Asistente IPSFA">' +
      '<div id="asst-header" class="asst-header">' +
        '<div class="asst-header-info">' +
          '<span class="asst-header-icono" aria-hidden="true">🤖</span>' +
          '<div>' +
            '<div class="asst-header-titulo">Asistente IPSFA' +
              '<span id="asst-ia-badge" class="asistente-ia-badge asst-oculto" ' +
                'title="Respuesta redactada con IA (Gemini)">IA</span>' +
            '</div>' +
            '<div class="asst-header-subtitulo">En línea · Créditos</div>' +
          '</div>' +
        '</div>' +
        '<button id="asst-cerrar" class="asst-cerrar" type="button" aria-label="Cerrar asistente">✕</button>' +
      '</div>' +
      '<div id="asst-mensajes" class="asst-mensajes" aria-live="polite"></div>' +
      '<div id="asst-chips" class="asst-chips"></div>' +
      '<div class="asst-entrada">' +
        '<input id="asst-input" class="asst-input" type="text" maxlength="500" ' +
          'placeholder="Escribe tu pregunta..." autocomplete="off" aria-label="Escribe tu pregunta">' +
        '<button id="asst-enviar" class="asst-enviar" type="button" aria-label="Enviar mensaje" title="Enviar">➤</button>' +
      '</div>' +
    '</div>';

  // ------------------------------------------------------------------
  // Clase principal del widget
  // ------------------------------------------------------------------

  function AsistenteWidget() {
    this.abierto = false;
    this.bienvenidaCargada = false;
    this.esperandoRespuesta = false;
    this.historial = []; // Historial de la sesión en memoria (no persistente)

    this.construirDOM();
    this.vincularEventos();
  }

  /** Inserta el markup estático del widget en el body. */
  AsistenteWidget.prototype.construirDOM = function () {
    var cont = document.createElement('div');
    cont.id = 'asst-widget';
    // innerHTML SOLO con markup estático propio, sin datos externos (seguro)
    cont.innerHTML = HTML_WIDGET;
    document.body.appendChild(cont);

    this.$boton = document.getElementById('asst-boton');
    this.$badge = document.getElementById('asst-badge');
    this.$ventana = document.getElementById('asst-ventana');
    this.$header = document.getElementById('asst-header');
    this.$mensajes = document.getElementById('asst-mensajes');
    this.$chips = document.getElementById('asst-chips');
    this.$input = document.getElementById('asst-input');
    this.$enviar = document.getElementById('asst-enviar');
    this.$iaBadge = document.getElementById('asst-ia-badge');
  };

  /** Vincula todos los eventos de interacción del widget. */
  AsistenteWidget.prototype.vincularEventos = function () {
    var self = this;

    this.$boton.addEventListener('click', function () {
      self.alternarVentana();
    });

    document.getElementById('asst-cerrar').addEventListener('click', function () {
      self.cerrarVentana();
    });

    this.$enviar.addEventListener('click', function () {
      self.enviarMensaje();
    });

    this.$input.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        self.enviarMensaje();
      }
    });

    // Clic en el header: abrir lista de notificaciones (si el módulo existe)
    this.$header.addEventListener('click', function (ev) {
      // Ignorar clics en el botón cerrar
      if (ev.target && ev.target.id === 'asst-cerrar') { return; }
      if (typeof window.AsistenteNotificaciones !== 'undefined' &&
          typeof window.AsistenteNotificaciones.mostrarLista === 'function') {
        window.AsistenteNotificaciones.mostrarLista();
      }
    });

    // Clic en el badge: mostrar notificaciones sin abrir el chat completo
    this.$badge.addEventListener('click', function (ev) {
      ev.stopPropagation();
      if (!self.abierto) { self.abrirVentana(); }
      if (typeof window.AsistenteNotificaciones !== 'undefined' &&
          typeof window.AsistenteNotificaciones.mostrarLista === 'function') {
        window.AsistenteNotificaciones.mostrarLista();
      }
    });
  };

  // ------------------------------------------------------------------
  // Apertura / cierre
  // ------------------------------------------------------------------

  AsistenteWidget.prototype.alternarVentana = function () {
    if (this.abierto) {
      this.cerrarVentana();
    } else {
      this.abrirVentana();
    }
  };

  AsistenteWidget.prototype.abrirVentana = function () {
    this.abierto = true;
    this.$ventana.classList.remove('asst-oculto');
    // Forzar reflow para que la animación de entrada se reproduzca siempre
    void this.$ventana.offsetWidth;
    this.$ventana.classList.add('asst-ventana-abierta');
    this.$input.focus();

    if (!this.bienvenidaCargada) {
      this.bienvenidaCargada = true;
      this.cargarBienvenida();
      this.cargarSugerencias();
    }
  };

  AsistenteWidget.prototype.cerrarVentana = function () {
    this.abierto = false;
    this.$ventana.classList.remove('asst-ventana-abierta');
    this.$ventana.classList.add('asst-oculto');
  };

  // ------------------------------------------------------------------
  // Mensajes
  // ------------------------------------------------------------------

  /**
   * Agrega un mensaje al área de chat.
   * tipo: 'usuario' | 'asistente'
   * Los mensajes del asistente admiten **negritas** (ya escapadas internamente);
   * los del usuario siempre se insertan como texto plano (textContent).
   */
  AsistenteWidget.prototype.agregarMensaje = function (texto, tipo) {
    var burbuja = document.createElement('div');
    burbuja.className = 'asst-mensaje asst-mensaje-' + tipo;

    if (tipo === 'asistente') {
      // Respuesta del asistente: escapar HTML y aplicar negritas markdown
      burbuja.innerHTML = formatearRespuestaSeguro(texto);
    } else {
      // Mensaje del usuario: SIEMPRE texto plano (anti-XSS)
      burbuja.textContent = String(texto);
    }

    this.$mensajes.appendChild(burbuja);
    this.$mensajes.scrollTop = this.$mensajes.scrollHeight;

    // Guardar en historial de sesión (memoria, no persistente)
    this.historial.push({ tipo: tipo, texto: String(texto), fecha: new Date() });
    return burbuja;
  };

  /** Muestra el indicador "escribiendo..." mientras se espera la respuesta. */
  AsistenteWidget.prototype.mostrarEscribiendo = function () {
    var ind = document.createElement('div');
    ind.id = 'asst-escribiendo';
    ind.className = 'asst-mensaje asst-mensaje-asistente asst-escribiendo';
    // Markup estático propio (tres puntos animados)
    ind.innerHTML = '<span class="asst-punto"></span><span class="asst-punto"></span><span class="asst-punto"></span>';
    this.$mensajes.appendChild(ind);
    this.$mensajes.scrollTop = this.$mensajes.scrollHeight;
  };

  /** Oculta el indicador "escribiendo...". */
  AsistenteWidget.prototype.ocultarEscribiendo = function () {
    var ind = document.getElementById('asst-escribiendo');
    if (ind && ind.parentNode) {
      ind.parentNode.removeChild(ind);
    }
  };

  // ------------------------------------------------------------------
  // Fase 2: gráficos ApexCharts y badge IA
  // ------------------------------------------------------------------

  /** Muestra/oculta el badge "IA" del header según meta.ia de la última respuesta. */
  AsistenteWidget.prototype.mostrarBadgeIA = function (activo) {
    if (!this.$iaBadge) { return; }
    if (activo) {
      this.$iaBadge.classList.remove('asst-oculto');
    } else {
      this.$iaBadge.classList.add('asst-oculto');
    }
  };

  /**
   * Construye las opciones de ApexCharts a partir del contrato `grafico`:
   *   {tipo, titulo, chart:'bar'|'line'|'donut', series:[{name,data:[...]}], categorias:[...], moneda}
   * - donut  → labels = categorias, series = data plano de la primera serie.
   * - bar/line → xaxis.categories = categorias, series con name+data.
   * Tema acorde a la paleta del widget (azul #16324f, dorado #b08d3c).
   */
  AsistenteWidget.prototype.opcionesGrafico = function (grafico) {
    var chart = grafico.chart === 'donut' ? 'donut' : (grafico.chart === 'line' ? 'line' : 'bar');
    var categorias = Array.isArray(grafico.categorias) ? grafico.categorias.map(String) : [];
    var series = Array.isArray(grafico.series) ? grafico.series : [];
    var moneda = grafico.moneda || 'Bs';
    var horizontal = grafico.horizontal === true || grafico.tipo === 'top-deudores';

    var opciones = {
      chart: {
        type: chart,
        height: '100%',
        fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
        toolbar: { show: false },
        parentHeightOffset: 0
      },
      title: {
        text: String(grafico.titulo || ''),
        align: 'center',
        style: { fontSize: '13px', fontWeight: 700, color: '#16324f' }
      },
      colors: ['#16324f', '#b08d3c', '#3e6b8f', '#7a8a99', '#d9a441', '#0e2236'],
      tooltip: {
        y: {
          formatter: function (val) { return formatoMonedaVE(val, moneda); }
        }
      },
      noData: { text: 'Sin datos para graficar' }
    };

    if (chart === 'donut') {
      // Donut: serie plana (data de la primera serie) + labels = categorias
      var datosPlanos = (series[0] && Array.isArray(series[0].data)) ? series[0].data.map(Number) : [];
      opciones.labels = categorias;
      opciones.series = datosPlanos;
      opciones.legend = { position: 'bottom', fontSize: '11px' };
      opciones.dataLabels = {
        enabled: true,
        formatter: function (val) {
          var n = Number(val);
          return isFinite(n) ? n.toLocaleString('es-VE', { maximumFractionDigits: 1 }) + '%' : '';
        },
        style: { fontSize: '11px' }
      };
    } else {
      opciones.series = series.map(function (s) {
        return {
          name: String((s && s.name) || ''),
          data: (s && Array.isArray(s.data)) ? s.data.map(Number) : []
        };
      });
      opciones.xaxis = {
        categories: categorias,
        labels: { style: { fontSize: '10px' } }
      };
      opciones.yaxis = {
        labels: {
          formatter: function (val) { return formatoNumeroVE(val); },
          style: { fontSize: '10px' }
        }
      };
      opciones.dataLabels = {
        enabled: true,
        formatter: function (val) { return formatoMonedaVE(val, moneda); },
        style: { fontSize: '9px' }
      };
      if (chart === 'bar') {
        opciones.plotOptions = { bar: { horizontal: horizontal, borderRadius: 3 } };
        if (horizontal) {
          // En barras horizontales los dataLabels estorban: se apoyan en el tooltip
          opciones.dataLabels.enabled = false;
        }
      }
      if (chart === 'line') {
        opciones.stroke = { curve: 'smooth', width: 2.5 };
        opciones.markers = { size: 3 };
      }
    }

    return opciones;
  };

  /**
   * Renderiza el gráfico dentro de la burbuja del asistente.
   * Si window.ApexCharts no está cargado, muestra un aviso (el texto ya está).
   */
  AsistenteWidget.prototype.renderizarGrafico = function (grafico, burbuja) {
    if (!grafico || typeof grafico !== 'object' || !burbuja) { return; }

    if (typeof window.ApexCharts === 'undefined') {
      var aviso = document.createElement('div');
      aviso.className = 'asistente-chart-aviso';
      aviso.textContent = '📊 Gráfico no disponible (librería no cargada).';
      burbuja.appendChild(aviso);
      return;
    }

    burbuja.classList.add('asst-mensaje-con-grafico');
    var cont = document.createElement('div');
    cont.className = 'asistente-chart';
    burbuja.appendChild(cont);

    try {
      var chart = new window.ApexCharts(cont, this.opcionesGrafico(grafico));
      chart.render();
    } catch (err) {
      console.warn('[AsistenteWidget] Error al renderizar gráfico:', err);
      if (cont.parentNode) { cont.parentNode.removeChild(cont); }
      var avisoErr = document.createElement('div');
      avisoErr.className = 'asistente-chart-aviso';
      avisoErr.textContent = '📊 Gráfico no disponible.';
      burbuja.appendChild(avisoErr);
    }
  };

  // ------------------------------------------------------------------
  // API: bienvenida, sugerencias, consultar
  // ------------------------------------------------------------------

  /** GET /api/asistente/bienvenida — saludo inicial + minuta del día. */
  AsistenteWidget.prototype.cargarBienvenida = function () {
    var self = this;
    fetchAuth('/api/asistente/bienvenida')
      .then(function (data) {
        var texto = (data && (data.mensaje_completo || data.mensaje || data.respuesta || data.bienvenida)) ||
          '¡Hola! Soy tu asistente virtual de IPSFA. ¿En qué puedo ayudarte hoy?';
        self.agregarMensaje(texto, 'asistente');
      })
      .catch(function (err) {
        console.warn('[AsistenteWidget] No se pudo cargar la bienvenida:', err);
        self.agregarMensaje(
          '¡Hola! Soy tu asistente virtual de IPSFA. ¿En qué puedo ayudarte hoy?',
          'asistente'
        );
      });
  };

  /** GET /api/asistente/sugerencias — chips de preguntas sugeridas clicables. */
  AsistenteWidget.prototype.cargarSugerencias = function () {
    var self = this;
    fetchAuth('/api/asistente/sugerencias')
      .then(function (data) {
        var lista = [];
        if (Array.isArray(data)) {
          lista = data;
        } else if (data && Array.isArray(data.sugerencias)) {
          lista = data.sugerencias;
        } else if (data && Array.isArray(data.data)) {
          lista = data.data;
        }
        self.renderChips(lista);
      })
      .catch(function (err) {
        console.warn('[AsistenteWidget] No se pudieron cargar sugerencias:', err);
      });
  };

  /**
   * Renderiza los chips de sugerencias. Cada texto se inserta con
   * textContent (anti-XSS) y el clic envía la pregunta directamente.
   */
  AsistenteWidget.prototype.renderChips = function (lista) {
    var self = this;
    this.$chips.textContent = ''; // limpiar
    if (!lista || !lista.length) { return; }

    lista.slice(0, 6).forEach(function (sug) {
      var texto = (typeof sug === 'string') ? sug : (sug && (sug.texto || sug.pregunta)) || '';
      if (!texto) { return; }
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'asst-chip';
      chip.textContent = texto; // anti-XSS
      chip.addEventListener('click', function () {
        self.$input.value = texto;
        self.enviarMensaje();
      });
      self.$chips.appendChild(chip);
    });
  };

  /**
   * Envía el mensaje del usuario a POST /api/asistente/ia/consultar.
   * - Operador: la tienda se toma de localStorage usuario.tienda (forzada).
   * - Administrador: puede escribir la tienda en la pregunta; el backend la detecta.
   * Fase 2: si la respuesta trae `grafico` se renderiza con ApexCharts dentro
   * de la burbuja; el badge "IA" del header refleja meta.ia de la respuesta.
   */
  AsistenteWidget.prototype.enviarMensaje = function () {
    var self = this;
    var pregunta = (this.$input.value || '').trim();
    if (!pregunta || this.esperandoRespuesta) { return; }

    var usuario = obtenerUsuario();
    var tienda = null;
    if (usuario && usuario.rol === 'operador') {
      // Operador: siempre SU tienda
      tienda = usuario.tienda || null;
    } else if (usuario && usuario.tienda) {
      // Administrador: enviar su tienda como contexto por defecto (puede
      // indicar otra en el texto de la pregunta y el backend la prioriza)
      tienda = usuario.tienda;
    }

    this.$input.value = '';
    this.agregarMensaje(pregunta, 'usuario');
    this.esperandoRespuesta = true;
    this.$enviar.disabled = true;
    this.mostrarEscribiendo();

    fetchAuth('/api/asistente/ia/consultar', {
      method: 'POST',
      body: JSON.stringify({ pregunta: pregunta, tienda: tienda })
    })
      .then(function (data) {
        self.ocultarEscribiendo();
        var respuesta = (data && (data.respuesta || data.mensaje)) ||
          'No pude procesar tu consulta en este momento. Intenta de nuevo.';
        var burbuja = self.agregarMensaje(respuesta, 'asistente');

        // Badge "IA": visible solo si la última respuesta fue redactada con IA
        self.mostrarBadgeIA(!!(data && data.meta && data.meta.ia === true));

        // Gráfico (Fase 2): se renderiza dentro de la misma burbuja
        if (data && data.grafico) {
          self.renderizarGrafico(data.grafico, burbuja);
          self.$mensajes.scrollTop = self.$mensajes.scrollHeight;
        }
      })
      .catch(function (err) {
        self.ocultarEscribiendo();
        console.warn('[AsistenteWidget] Error al consultar:', err);
        self.agregarMensaje(
          'Lo siento, ocurrió un error al procesar tu consulta. Por favor intenta nuevamente.',
          'asistente'
        );
      })
      .then(function () {
        // finally (compatible ES6 sin Promise.prototype.finally en navegadores viejos)
        self.esperandoRespuesta = false;
        self.$enviar.disabled = false;
        self.$input.focus();
      });
  };

  // ------------------------------------------------------------------
  // Badge de notificaciones (integración con resumen-diario-widget.js)
  // ------------------------------------------------------------------

  /**
   * Actualiza el badge con el número de notificaciones no leídas.
   * Lo invoca el módulo de notificaciones (feature detection con typeof).
   */
  AsistenteWidget.prototype.actualizarBadge = function (cantidad) {
    var n = parseInt(cantidad, 10) || 0;
    if (n > 0) {
      this.$badge.textContent = n > 99 ? '99+' : String(n);
      this.$badge.classList.remove('asst-oculto');
    } else {
      this.$badge.textContent = '0';
      this.$badge.classList.add('asst-oculto');
    }
  };

  /** Devuelve el elemento del badge (para integración externa si hace falta). */
  AsistenteWidget.prototype.obtenerBadge = function () {
    return this.$badge;
  };

  // ------------------------------------------------------------------
  // Auto-inicialización (con protección global para no romper el panel)
  // ------------------------------------------------------------------

  function inicializar() {
    try {
      // Solo inicializar si hay sesión activa (evita errores en la página de login)
      if (!obtenerToken()) {
        console.warn('[AsistenteWidget] Sin token de sesión; widget no inicializado.');
        return;
      }
      window.AsistenteWidget = new AsistenteWidget();
    } catch (err) {
      console.warn('[AsistenteWidget] Error al inicializar el widget:', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializar);
  } else {
    inicializar();
  }
})();
