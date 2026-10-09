/**
 * resumen-diario-widget.js — Notificaciones del Asistente Virtual IPSFA
 * =====================================================================
 * Vanilla JS (ES6, navegadores 2020+), sin dependencias externas.
 *
 * Funcionalidad:
 *   - Polling de GET /api/asistente/notificaciones cada 60 segundos.
 *   - Actualiza el badge del botón del widget principal (si existe).
 *   - Lista desplegable de notificaciones con fecha relativa ("hace 5 min").
 *   - Clic en notificación → POST /api/asistente/notificaciones/:id/leida.
 *
 * Integración: expone window.AsistenteNotificaciones con actualizar(),
 * mostrarLista() y contarNoLeidas(). Funciona aunque asistente-widget.js
 * no esté cargado (feature detection con typeof).
 */
(function () {
  'use strict';

  var INTERVALO_POLLING_MS = 60000; // 60 segundos
  var timerPolling = null;
  var listaVisible = false;
  var ultimaLista = [];

  // ------------------------------------------------------------------
  // Utilidades
  // ------------------------------------------------------------------

  function obtenerToken() {
    try {
      return localStorage.getItem('token') || '';
    } catch (e) {
      return '';
    }
  }

  function headersAuth() {
    return {
      'Authorization': 'Bearer ' + obtenerToken(),
      'Content-Type': 'application/json'
    };
  }

  /** Fetch autenticado con redirección al login en 401. */
  function fetchAuth(url, opciones) {
    opciones = opciones || {};
    opciones.headers = headersAuth();
    return fetch(url, opciones).then(function (res) {
      if (res.status === 401) {
        window.location.href = '/';
        throw new Error('Sesión expirada');
      }
      if (!res.ok) {
        throw new Error('Error HTTP ' + res.status);
      }
      return res.json();
    });
  }

  /**
   * Devuelve una fecha relativa en español: "hace 5 min", "hace 2 h",
   * "hace 3 d" o "ahora mismo".
   */
  function fechaRelativa(fechaStr) {
    var fecha = new Date(fechaStr);
    if (isNaN(fecha.getTime())) { return ''; }
    var diffMs = Date.now() - fecha.getTime();
    if (diffMs < 0) { diffMs = 0; }
    var min = Math.floor(diffMs / 60000);
    if (min < 1) { return 'ahora mismo'; }
    if (min < 60) { return 'hace ' + min + ' min'; }
    var horas = Math.floor(min / 60);
    if (horas < 24) { return 'hace ' + horas + ' h'; }
    var dias = Math.floor(horas / 24);
    return 'hace ' + dias + ' d';
  }

  // ------------------------------------------------------------------
  // Normalización de la respuesta de la API
  // ------------------------------------------------------------------

  /**
   * Acepta varios formatos posibles del endpoint:
   *   [...] | {notificaciones:[...]} | {data:[...]} | {exito, notificaciones:[...]}
   */
  function normalizarNotificaciones(data) {
    if (Array.isArray(data)) { return data; }
    if (data && Array.isArray(data.notificaciones)) { return data.notificaciones; }
    if (data && Array.isArray(data.data)) { return data.data; }
    return [];
  }

  // ------------------------------------------------------------------
  // Badge (integración con el widget principal)
  // ------------------------------------------------------------------

  /** Cuenta las notificaciones no leídas de una lista normalizada. */
  function contarNoLeidas(lista) {
    return (lista || []).filter(function (n) {
      return !n.leida && !n.leido;
    }).length;
  }

  /** Actualiza el badge del botón del widget (si el widget principal existe). */
  function actualizarBadge(cantidad) {
    if (typeof window.AsistenteWidget !== 'undefined' &&
        window.AsistenteWidget &&
        typeof window.AsistenteWidget.actualizarBadge === 'function') {
      window.AsistenteWidget.actualizarBadge(cantidad);
    }
  }

  // ------------------------------------------------------------------
  // Lista desplegable de notificaciones
  // ------------------------------------------------------------------

  /** Cierra la lista desplegable si está abierta. */
  function cerrarLista() {
    var el = document.getElementById('asst-notif-lista');
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
    listaVisible = false;
    document.removeEventListener('click', cerrarSiClickFuera, true);
  }

  /** Cierra la lista cuando el clic ocurre fuera de ella y fuera del widget. */
  function cerrarSiClickFuera(ev) {
    var lista = document.getElementById('asst-notif-lista');
    if (lista && !lista.contains(ev.target)) {
      cerrarLista();
    }
  }

  /**
   * Muestra (o alterna) la lista de notificaciones dentro de la ventana
   * del widget. Si el widget principal no existe, la ancla al body.
   */
  function mostrarLista() {
    if (listaVisible) {
      cerrarLista();
      return;
    }
    listaVisible = true;

    var ventana = document.getElementById('asst-ventana');
    var contenedor = ventana || document.body;

    var lista = document.createElement('div');
    lista.id = 'asst-notif-lista';
    lista.className = 'asst-notif-lista';
    if (!ventana) {
      lista.classList.add('asst-notif-lista-flotante');
    }

    // Encabezado estático propio
    var titulo = document.createElement('div');
    titulo.className = 'asst-notif-titulo';
    titulo.textContent = 'Notificaciones';
    lista.appendChild(titulo);

    if (!ultimaLista.length) {
      var vacio = document.createElement('div');
      vacio.className = 'asst-notif-vacia';
      vacio.textContent = 'No tienes notificaciones nuevas.';
      lista.appendChild(vacio);
    } else {
      ultimaLista.forEach(function (notif) {
        lista.appendChild(crearItemNotificacion(notif));
      });
    }

    contenedor.appendChild(lista);

    // Cerrar al hacer clic fuera (en el siguiente tick para no cerrar de inmediato)
    setTimeout(function () {
      document.addEventListener('click', cerrarSiClickFuera, true);
    }, 0);
  }

  /**
   * Crea el elemento visual de una notificación. Todo el texto dinámico
   * se inserta con textContent (anti-XSS).
   */
  function crearItemNotificacion(notif) {
    var item = document.createElement('button');
    item.type = 'button';
    var leida = !!(notif.leida || notif.leido);
    item.className = 'asst-notif-item' + (leida ? ' asst-notif-leida' : '');

    var mensaje = document.createElement('div');
    mensaje.className = 'asst-notif-mensaje';
    mensaje.textContent = notif.mensaje || notif.texto || notif.titulo || '(sin mensaje)';
    item.appendChild(mensaje);

    var fecha = document.createElement('div');
    fecha.className = 'asst-notif-fecha';
    fecha.textContent = fechaRelativa(notif.fecha || notif.fecha_creacion || notif.created_at);
    item.appendChild(fecha);

    item.addEventListener('click', function (ev) {
      ev.stopPropagation();
      marcarLeida(notif, item);
    });

    return item;
  }

  /**
   * POST /api/asistente/notificaciones/:id/leida — marca la notificación
   * como leída en el servidor y la actualiza visualmente de inmediato.
   */
  function marcarLeida(notif, itemEl) {
    // Marcar visualmente de forma optimista
    if (!itemEl.classList.contains('asst-notif-leida')) {
      itemEl.classList.add('asst-notif-leida');
    }
    notif.leida = true;
    actualizarBadge(contarNoLeidas(ultimaLista));

    var id = notif.id;
    if (id == null) { return; }

    fetchAuth('/api/asistente/notificaciones/' + encodeURIComponent(id) + '/leida', {
      method: 'POST',
      body: JSON.stringify({})
    }).catch(function (err) {
      console.warn('[AsistenteNotificaciones] Error al marcar notificación leída:', err);
    });
  }

  // ------------------------------------------------------------------
  // Polling
  // ------------------------------------------------------------------

  /**
   * Consulta GET /api/asistente/notificaciones, guarda la lista y
   * actualiza el badge con el número de no leídas.
   */
  function actualizar() {
    if (!obtenerToken()) { return Promise.resolve([]); }
    return fetchAuth('/api/asistente/notificaciones')
      .then(function (data) {
        ultimaLista = normalizarNotificaciones(data);
        actualizarBadge(contarNoLeidas(ultimaLista));
        return ultimaLista;
      })
      .catch(function (err) {
        console.warn('[AsistenteNotificaciones] Error al consultar notificaciones:', err);
        return [];
      });
  }

  /** Inicia el polling cada 60 segundos (y una consulta inmediata inicial). */
  function iniciar() {
    try {
      if (!obtenerToken()) {
        console.warn('[AsistenteNotificaciones] Sin token de sesión; polling no iniciado.');
        return;
      }
      actualizar(); // consulta inmediata
      if (timerPolling) { clearInterval(timerPolling); }
      timerPolling = setInterval(actualizar, INTERVALO_POLLING_MS);
    } catch (err) {
      console.warn('[AsistenteNotificaciones] Error al iniciar el polling:', err);
    }
  }

  // ------------------------------------------------------------------
  // API pública y auto-inicialización
  // ------------------------------------------------------------------

  window.AsistenteNotificaciones = {
    actualizar: actualizar,
    mostrarLista: mostrarLista,
    cerrarLista: cerrarLista,
    contarNoLeidas: contarNoLeidas,
    iniciar: iniciar
  };

  function autoInicializar() {
    try {
      iniciar();
    } catch (err) {
      console.warn('[AsistenteNotificaciones] Error al inicializar:', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInicializar);
  } else {
    autoInicializar();
  }
})();
