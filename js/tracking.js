/**
 * ==============================================================================
 * CAMI'S LASHES - GOOGLE TAG (gtag.js) & CONVERSION TRACKING ARCHITECTURE
 * ==============================================================================
 * Módulo centralizado de analítica y conversiones para Google Ads y GA4.
 * Carga asíncrona, sin bloqueo de renderizado y con delegación global de eventos.
 * ==============================================================================
 */

(function () {
    'use strict';

    // 1. CONFIGURACIÓN CENTRALIZADA DE IDENTIFICADORES
    // 👉 Cuando tengas tus IDs reales, SOLO reemplaza estas 3 variables:
    window.CAMI_TRACKING_CONFIG = {
        ADS_ID: 'AW-18439040516',             // Tu ID oficial de Google Ads
        ADS_CONVERSION_LABEL: '0FMbCLKlgf4cEITctdhE', // Etiqueta oficial: Reserva Cita WhatsApp
        GA4_ID: 'G-XXXXXXXXXX',              // Tu ID de GA4 (Ejemplo: 'G-A1B2C3D4E5')
        DEBUG_MODE: true                     // true para ver en consola (F12) cada evento disparado
    };

    const cfg = window.CAMI_TRACKING_CONFIG;

    // 2. INICIALIZACIÓN SEGURA DE DATALAYER & GTAG
    window.dataLayer = window.dataLayer || [];
    function gtag() {
        window.dataLayer.push(arguments);
    }
    window.gtag = gtag;

    gtag('js', new Date());

    // 3. INYECCIÓN ASÍNCRONA DINÁMICA DE GTAG.JS (No bloqueante)
    const primaryId = (cfg.ADS_ID && !cfg.ADS_ID.includes('XXXX')) ? cfg.ADS_ID : 
                      ((cfg.GA4_ID && !cfg.GA4_ID.includes('XXXX')) ? cfg.GA4_ID : 'AW-XXXXXXXXXX');

    // Evitar doble inyección si ya existe en el DOM
    if (!document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${primaryId}`;
        document.head.appendChild(script);
    }

    // Configurar endpoints de Ads y GA4
    if (cfg.ADS_ID && !cfg.ADS_ID.includes('XXXX')) {
        gtag('config', cfg.ADS_ID);
    }
    if (cfg.GA4_ID && !cfg.GA4_ID.includes('XXXX')) {
        gtag('config', cfg.GA4_ID, { send_page_view: true });
    }

    // 4. FUNCIÓN DISPARADORA DE CONVERSIÓN UNIVERSAL
    window.trackCamiConversion = function (conversionType, details, callback) {
        details = details || {};
        const sendTo = `${cfg.ADS_ID}/${cfg.ADS_CONVERSION_LABEL}`;
        const hasValidAds = cfg.ADS_ID && !cfg.ADS_ID.includes('XXXX') && 
                            cfg.ADS_CONVERSION_LABEL && !cfg.ADS_CONVERSION_LABEL.includes('XXXX');

        let callbackExecuted = false;
        function safeCallback() {
            if (!callbackExecuted && typeof callback === 'function') {
                callbackExecuted = true;
                callback();
            }
        }

        // Timeout de seguridad: si Google tarda o hay bloqueadores, no congelamos la navegación
        const timeoutId = setTimeout(safeCallback, 400);

        // A) Evento de Conversión para Google Ads
        if (hasValidAds) {
            gtag('event', 'conversion', {
                'send_to': sendTo,
                'value': details.value || 1.0,
                'currency': 'MXN',
                'event_callback': function () {
                    clearTimeout(timeoutId);
                    safeCallback();
                }
            });
        } else {
            safeCallback();
        }

        // B) Evento Estándar de Generación de Leads para GA4
        gtag('event', 'generate_lead', {
            'event_category': details.category || 'Conversion',
            'event_label': details.label || conversionType,
            'service_name': details.service || 'General',
            'location_context': details.context || 'Sitio Web',
            'value': details.value || 1.0,
            'currency': 'MXN'
        });

        // C) Feedback en Consola para pruebas y depuración
        if (cfg.DEBUG_MODE) {
            console.log(
                `%c🎯 [Cami's Lashes Tracker] Conversión: "${conversionType}"`,
                'background: #C5A059; color: #121212; font-weight: bold; padding: 4px 8px; border-radius: 4px;',
                {
                    send_to: hasValidAds ? sendTo : `[PLACEHOLDER: ${sendTo}]`,
                    details: details,
                    ga4_active: !cfg.GA4_ID.includes('XXXX')
                }
            );
        }
    };

    // 4.1 FUNCIÓN OFICIAL DE REPORTE DE CONVERSIÓN DE GOOGLE ADS (Reconocimiento automático de Google)
    window.gtag_report_conversion = function (url) {
        var callback = function () {
            if (typeof (url) !== 'undefined' && url) {
                window.location = url;
            }
        };
        gtag('event', 'conversion', {
            'send_to': `${cfg.ADS_ID}/${cfg.ADS_CONVERSION_LABEL}`,
            'event_callback': callback
        });
        return false;
    };

    // 5. EVENT DELEGATION GLOBAL: RASTREO AUTOMÁTICO DE WHATSAPP Y CTAS
    document.addEventListener('DOMContentLoaded', function () {
        // Listener global de clics
        document.body.addEventListener('click', function (e) {
            // Buscar si el elemento clickeado o alguno de sus ancestros es un enlace o botón CTA calificado
            const targetLink = e.target.closest('a[href*="wa.me"], a[href*="whatsapp.com"], .m-btn-wa, #spaModalBookBtn, .btn-academic-hero-primary, [data-track-conversion]');
            
            if (!targetLink) return;

            // Extraer metadata del contexto del clic
            const href = targetLink.getAttribute('href') || '';
            const isWhatsApp = href.includes('wa.me') || href.includes('whatsapp.com');
            const buttonText = (targetLink.innerText || targetLink.textContent || '').trim();

            // Detectar servicio si el botón está dentro de una tarjeta
            const parentCard = targetLink.closest('.mixed-highlight-card');
            let serviceName = '';
            let categoryName = '';

            if (parentCard) {
                const titleEl = parentCard.querySelector('h4');
                const catEl = parentCard.querySelector('.m-card-cat');
                if (titleEl) serviceName = titleEl.innerText.trim();
                if (catEl) categoryName = catEl.innerText.trim();
            } else if (targetLink.id === 'spaModalBookBtn') {
                const modalTitle = document.getElementById('spaModalTitle');
                if (modalTitle) serviceName = modalTitle.innerText.trim();
                categoryName = 'Boutique & Spa Modal';
            } else if (targetLink.closest('.spa-panel') || targetLink.closest('.spa-expanded-content')) {
                categoryName = 'Boutique & Spa Hero';
            } else if (targetLink.closest('.academy-panel') || targetLink.closest('.academy-expanded-content') || targetLink.closest('#academicEnrollForm')) {
                categoryName = 'Academia Presencial';
            }

            const conversionDetails = {
                category: categoryName || (isWhatsApp ? 'WhatsApp Lead' : 'CTA Click'),
                service: serviceName || 'General',
                label: buttonText.substring(0, 50),
                url: href
            };

            // Disparar conversión
            window.trackCamiConversion(
                isWhatsApp ? 'whatsapp_click' : 'cta_button_click',
                conversionDetails
            );
        }, true); // UseCapture para garantizar captura incluso si el evento detiene la propagación

        // Listener para formularios
        const forms = document.querySelectorAll('#academicEnrollForm, #chatLeadForm');
        forms.forEach(function (form) {
            form.addEventListener('submit', function () {
                window.trackCamiConversion('form_submission', {
                    category: 'Form Lead',
                    service: form.id === 'academicEnrollForm' ? 'Inscripción Academia' : 'Chat Lead',
                    label: form.id
                });
            });
        });

        if (cfg.DEBUG_MODE) {
            console.log(
                '%c✨ [Cami\'s Lashes Tracker] Inicializado con éxito. Listo para capturar conversiones en segundo plano.',
                'color: #C5A059; font-weight: bold;'
            );
        }
    });

})();
