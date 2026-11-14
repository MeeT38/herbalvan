/*
 * Google Analytics 4 bootstrap with Consent Mode v2 (Module 68).
 *
 * This file is loaded synchronously in `<head>`, **before** the
 * `googletagmanager.com/gtag/js` script the build writes next to it. That order is
 * the whole point: gtag.js reads the consent state from `dataLayer` when it runs,
 * so the default has to be queued first.
 *
 * Why the tag is on the page at all before a visitor chooses:
 *
 * - Google's own "Test your website" check (and the Google tag assistant that
 *   owners use) looks for the tag in the page source. A tag injected only after
 *   a click is invisible to it, which is what "Your Google tag wasn't detected"
 *   means for a consent-gated setup.
 * - Consent Mode is Google's supported answer: the tag is present, but with
 *   `analytics_storage: 'denied'` it **writes no cookie and stores no
 *   identifier**. Only cookieless pings are sent, which Google aggregates rather
 *   than attributing to a person.
 *
 * `analytics.js` upgrades the consent to `granted` when the visitor presses
 * Accept, and keeps it denied when they decline or when the browser sends Do Not
 * Track / Global Privacy Control.
 *
 * Advertising storage is denied permanently: this shop does not run ads, so
 * there is no reason for the tag to be allowed to use that data at all.
 */
(() => {
    'use strict';

    const CONSENT_KEY = 'herbalvan:analytics-consent';
    const MEASUREMENT_ID = /^G-[A-Z0-9]{4,20}$/;

    const meta = document.querySelector('meta[name="analytics-measurement-id"]');
    const measurementId = (meta?.getAttribute('content') || '').trim().toUpperCase();

    // No ID means analytics is switched off (or the ID is malformed): leave the
    // page exactly as it is. The `gtag/js` script beside this file still loads and
    // does nothing without a `config` call.
    if (!MEASUREMENT_ID.test(measurementId)) return;

    const privacySignal = navigator.doNotTrack === '1'
        || window.doNotTrack === '1'
        || navigator.globalPrivacyControl === true;

    window.dataLayer = window.dataLayer || [];

    window.gtag = function gtag() {
        window.dataLayer.push(arguments);
    };

    /*
     * A browser-level privacy signal wins over everything. The tag file still
     * loads because it is written into the HTML, but it is never configured, so it
     * has nothing to measure and sends no ping at all — not even a cookieless one.
     */
    if (privacySignal) {
        window.gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'denied',
            functionality_storage: 'denied',
            security_storage: 'denied'
        });

        return;
    }

    let granted = false;

    try {
        granted = localStorage.getItem(CONSENT_KEY) === 'granted';
    } catch {
        granted = false;
    }

    /*
     * `wait_for_update` gives the banner a moment to restore a stored choice
     * before the first ping, so a returning visitor is not counted as anonymous.
     */
    window.gtag('consent', 'default', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: granted ? 'granted' : 'denied',
        functionality_storage: 'granted',
        security_storage: 'granted',
        wait_for_update: 500
    });

    window.gtag('js', new Date());

    window.gtag('config', measurementId, {
        // The page view is sent by `analytics.js`, which adds `page_type` and the
        // product details to it; letting gtag send its own would double count.
        send_page_view: false,
        // Visits and clicks are wanted here, not advertising audiences.
        allow_google_signals: false,
        allow_ad_personalization_signals: false
    });
})();
