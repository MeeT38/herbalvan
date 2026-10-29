/*
 * Google Analytics 4 for the published website (Module 68).
 *
 * The site is static and served by GitHub Pages, so the browser is the only
 * thing that can report a visit. This file is the whole client half:
 *
 * 1. It does nothing at all unless the build wrote a Measurement ID meta tag.
 *    Switched off, the page downloads this file (3 KB) and that is the end of it.
 * 2. It asks before collecting anything. No Google script is fetched, and no
 *    cookie is written, until the visitor presses "Accept".
 * 3. It sends one page view per page, a section view when a home-page view
 *    changes, and an event for the controls that mean something in this shop:
 *    add to basket, buy on a marketplace, category filter, search, FAQ, share,
 *    pack size, and product opens.
 *
 * The consent choice is remembered in `localStorage`, which is this site's own
 * storage — not a cookie, and not sent anywhere. A visitor can change it from
 * "Cookie settings" in the footer.
 *
 * `window.gtag` is created here before the Google script is appended, so events
 * queue in `dataLayer` in the usual way and no request happens earlier than the
 * visitor allowed. The policy on every page permits exactly
 * `https://www.googletagmanager.com` as a script and Google's measurement hosts
 * as connections; the build writes it only while analytics is switched on.
 */
(() => {
    'use strict';

    const CONSENT_KEY = 'herbalvan:analytics-consent';
    const STATE = { loaded: false, measurementId: '' };
    const PRIVACY_SIGNAL = navigator.doNotTrack === '1'
        || window.doNotTrack === '1'
        || navigator.globalPrivacyControl === true;

    const meta = document.querySelector('meta[name="analytics-measurement-id"]');
    const measurementId = (meta?.getAttribute('content') || '').trim().toUpperCase();

    // The same shape the CMS validator enforces. A malformed ID is treated as
    // "analytics is off" rather than handed to Google.
    if (!/^G-[A-Z0-9]{4,20}$/.test(measurementId)) return;

    STATE.measurementId = measurementId;

    const banner = document.getElementById('analytics-consent');
    const settingsButton = document.getElementById('analytics-settings');

    function storedChoice() {
        try {
            return localStorage.getItem(CONSENT_KEY);
        } catch {
            return null;
        }
    }

    function remember(choice) {
        try {
            localStorage.setItem(CONSENT_KEY, choice);
        } catch {
            // Storage can be unavailable in private mode. The choice still holds
            // for this page; the next page asks again rather than failing.
        }
    }

    function showBanner() {
        if (!banner || PRIVACY_SIGNAL) return;
        banner.classList.remove('hidden');
    }

    function hideBanner() {
        banner?.classList.add('hidden');
    }

    function track(name, parameters) {
        if (!STATE.loaded || typeof window.gtag !== 'function') return;
        window.gtag('event', name, parameters);
    }

    function pageType() {
        const file = location.pathname.split('/').pop() || 'index.html';

        if (/^product-.+\.html$/i.test(file)) return 'product';
        if (/^collection-.+\.html$/i.test(file)) return 'collection';
        if (/^policy-.+\.html$/i.test(file)) return 'policy';
        return 'home';
    }

    function sendPageView() {
        track('page_view', {
            page_title: document.title,
            page_location: location.href,
            page_path: `${location.pathname}${location.search}`,
            page_type: pageType()
        });
    }

    /**
     * The product the control belongs to, from the name the button already gives
     * a screen reader ("Add Amla Powder to the basket") or the heading of the card
     * it sits in. Nothing is invented when neither exists.
     */
    function productName(element) {
        const label = element.getAttribute('aria-label') || '';
        const fromLabel = label.match(/^(?:Add|Remove) (.+?) (?:to|from) the basket$/i);

        if (fromLabel) return fromLabel[1].trim();

        const container = element.closest('article');
        const heading = container?.querySelector('h1, h2, h3')
            || (pageType() === 'product' ? document.querySelector('main h1') : null);

        return (heading?.textContent || '').trim();
    }

    function productItem(element) {
        const container = element.closest('article');
        const itemId = element.dataset.productId
            || container?.querySelector('[data-product-id]')?.dataset.productId
            || (pageType() === 'product'
                ? document.querySelector('[data-action="add-to-cart"][data-product-id]')?.dataset.productId
                : '')
            || '';
        const name = productName(element);
        const item = {};

        if (itemId) item.item_id = itemId;
        if (name) item.item_name = name;

        return item;
    }

    function breadcrumbCategory() {
        const link = document.querySelector('nav[aria-label="Breadcrumb"] a:nth-of-type(2)');
        return (link?.textContent || '').trim();
    }

    function sendProductView() {
        if (pageType() !== 'product') return;

        const button = document.querySelector('[data-action="add-to-cart"][data-product-id]');
        const heading = document.querySelector('main h1');
        const item = {};

        if (button?.dataset.productId) item.item_id = button.dataset.productId;
        if (heading?.textContent) item.item_name = heading.textContent.trim();

        const category = breadcrumbCategory();
        if (category) item.item_category = category;

        if (Object.keys(item).length > 0) {
            track('view_item', { items: [item] });
        }
    }

    function loadGoogleAnalytics() {
        if (STATE.loaded || PRIVACY_SIGNAL) return;

        STATE.loaded = true;

        window.dataLayer = window.dataLayer || [];
        window.gtag = function gtag() {
            window.dataLayer.push(arguments);
        };

        window.gtag('js', new Date());
        window.gtag('config', STATE.measurementId, {
            send_page_view: false,
            // This shop needs visits and clicks, not advertising audiences.
            allow_google_signals: false,
            allow_ad_personalization_signals: false
        });

        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(STATE.measurementId)}`;
        document.head.appendChild(script);

        sendPageView();
        sendProductView();
    }

    function choose(choice) {
        remember(choice);
        hideBanner();

        if (choice === 'granted') loadGoogleAnalytics();
    }

    function start() {
        if (settingsButton) settingsButton.hidden = false;

        // A browser-level privacy signal wins over a stored choice: no banner,
        // no script, and no request.
        if (PRIVACY_SIGNAL) return;

        const choice = storedChoice();

        if (choice === 'granted') {
            loadGoogleAnalytics();
            return;
        }

        if (choice !== 'denied') showBanner();
    }

    document.addEventListener('click', (event) => {
        const consentButton = event.target.closest('[data-analytics-consent]');

        if (consentButton) {
            choose(consentButton.getAttribute('data-analytics-consent'));
            return;
        }

        if (event.target.closest('[data-analytics-settings]')) {
            showBanner();
            return;
        }

        if (!STATE.loaded) return;

        const buyLink = event.target.closest('[data-buy-link]');

        if (buyLink) {
            const item = productItem(buyLink);
            const parameters = {
                marketplace: buyLink.dataset.buyLink || 'unknown',
                link_url: buyLink.href
            };

            if (Object.keys(item).length > 0) parameters.items = [item];

            track('buy_click', parameters);
            return;
        }

        const productLink = event.target.closest('a[href^="product-"]');

        if (productLink) {
            const item = productItem(productLink);
            if (Object.keys(item).length > 0) track('select_item', { items: [item] });
            return;
        }

        const element = event.target.closest('[data-action]');
        if (!element) return;
        if (element.closest('[data-analytics-consent]')) return;

        const action = element.dataset.action;

        switch (action) {
            case 'add-to-cart': {
                const item = productItem(element);
                if (Object.keys(item).length > 0) track('add_to_cart', { items: [item] });
                break;
            }
            case 'remove-from-cart': {
                const item = productItem(element);
                if (Object.keys(item).length > 0) track('remove_from_cart', { items: [item] });
                break;
            }
            case 'filter-tab':
                track('filter_category', { category: element.dataset.category || 'All Products' });
                break;
            case 'quick-search':
                track('search', { search_term: element.dataset.query || '' });
                break;
            case 'select-variant':
                track('select_variant', {
                    variant_id: element.dataset.variantId || '',
                    variant: (element.textContent || '').trim()
                });
                break;
            case 'navigate':
                if (element.dataset.target) {
                    track('section_view', {
                        section: element.dataset.target,
                        page_location: `${location.origin}${location.pathname}#${element.dataset.target}`
                    });
                }
                break;
            case 'toggle-cart': {
                const drawer = document.getElementById('cart-drawer');
                if (drawer?.classList.contains('invisible')) track('view_cart');
                break;
            }
            case 'toggle-search': {
                const panel = document.getElementById('search-modal');
                if (panel?.classList.contains('hidden')) track('search_open');
                break;
            }
            case 'toggle-faq':
                track('faq_open', { question: (element.textContent || '').trim().slice(0, 120) });
                break;
            case 'share-product':
                track('share');
                break;
            case 'view-product-image':
            case 'gallery-step':
                track('view_product_image');
                break;
            default:
                break;
        }
    });

    start();
})();
