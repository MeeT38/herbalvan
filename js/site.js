        // ------------------------------------------------------------------
        // Website data (Modules 15-18)
        // ------------------------------------------------------------------
        // Written to data/*.json by the build (scripts/build/generate-data.js).
        // The browser only ever reads these files - never SQLite.
        //
        // products, categories, reviews, faqs: published/active content only.
        // settings: the single settings row. bestSeller: the active selection,
        // or null, in which case the homepage simply has no best seller.
        let products = [];
        let categories = [];
        let siteSettings = {};
        let bestSeller = null;
        let reviews = [];
        let faqs = [];

        // The hard-coded "herbal rituals" list that used to feed two sections and a
        // whole view was removed in Module 48, when the owner asked for those
        // sections to go. It was never database content, so nothing is lost from
        // the CMS; the four ritual pictures it referred to are no longer referenced
        // by any page.

        // Shopping Cart State
        let cart = [];

        /* ==================================================================
         * Buy links (Modules 22 and 48)
         *
         * HerbalVan does not process purchases: there is no checkout, no
         * payment, and no order anywhere on this site. Every buy button is a
         * link the owner configured in the CMS, and the CMS refuses to publish
         * a product that has none — a product with no way to buy it would be a
         * dead end for the visitor.
         * ================================================================== */

        /**
         * Only absolute http(s) links are ever rendered. The CMS validates on
         * write, and this guards the built data as well: a `javascript:` or
         * `data:` value can never become a clickable link on the page.
         */
        function isSafeHttpUrl(value) {
            if (!value || typeof value !== 'string') return false;

            try {
                const parsed = new URL(value);
                return parsed.protocol === 'http:' || parsed.protocol === 'https:';
            } catch {
                return false;
            }
        }

        /**
         * The buy links a product really has, in the order the build chose.
         * The order lives in the generated data so the page never has to guess
         * which shop the owner prefers.
         */
        function purchaseLinksFor(product) {
            const links = Array.isArray(product?.purchaseLinks) ? product.purchaseLinks : [];

            return links
                .filter(link => link && typeof link.label === 'string' && isSafeHttpUrl(link.url))
                .map(link => ({ label: link.label, url: link.url }));
        }

        /** The link the card's main button uses: the owner's first choice. */
        function primaryBuyLink(product) {
            return purchaseLinksFor(product)[0] ?? null;
        }

        /**
         * The small line under a price: "+ Meesho delivery charge", or
         * "+ delivery charges" when a product is listed in more than one shop.
         * Written by the build, not guessed here.
         *
         * Empty when the owner has switched prices off (Module 52): the delivery line
         * only means anything under a price, and the owner asked for the two to go
         * together.
         */
        function deliveryNoteMarkup(product) {
            if (!pricesAreShown()) return '';

            return product && product.deliveryNote
                ? `<span class="block text-[10px] text-gray-500 font-semibold mt-0.5">${product.deliveryNote}</span>`
                : '';
        }

        /**
         * Whether prices may be shown at all (Module 52).
         *
         * Shown unless the owner has switched them off, so the site keeps working if
         * the data predates the setting — and one place decides, rather than a check
         * repeated in every renderer that happens to print a price.
         */
        function pricesAreShown() {
            return siteSettings.showPrices !== false;
        }

        /**
         * One price, one shape: `₹199.00`.
         *
         * The card, the basket, the search results, and the showcase each built
         * this string themselves, and the product page added a second ₹ on top of
         * it (Module 50). One function means a price cannot be right in one place
         * and wrong in another, and a price with paise cannot produce `₹199.5.00`.
         * The build formats the same way in `scripts/build/pages.js`.
         */
        function formatPrice(price) {
            const value = Number(price);

            return Number.isFinite(value) ? `₹${value.toFixed(2)}` : '';
        }

        /**
         * A price, or nothing at all (Module 52).
         *
         * Every place that prints a price calls this, so switching prices off cannot
         * leave one of them behind. The markup around it stays where it is: the
         * element simply has no text.
         */
        function priceMarkup(price) {
            return pricesAreShown() ? formatPrice(price) : '';
        }

        /**
         * The card's price block — price and delivery line — or nothing (Module 52).
         *
         * A wrapper of its own so that hiding the price also removes the space it
         * was holding, rather than leaving an empty row pushing the buy button away
         * from the description.
         */
        function cardPriceBlock(product) {
            const price = priceMarkup(product.price);

            if (!price) return '';

            return `<div class="mb-3">
                            <span class="text-xl font-extrabold text-brand-forest">${price}</span>
                            ${deliveryNoteMarkup(product)}
                        </div>`;
        }

        /** The basket line for one item's price, or nothing (Module 52). */
        function cartPriceBlock(item) {
            const price = priceMarkup(item.price);

            if (!price) return '';

            return `<div class="text-xs font-bold text-brand-botanicalDark mt-0.5">${price}</div>`
                + deliveryNoteMarkup(item);
        }

        /**
         * One picture frame, one shape: square, always.
         *
         * Product photographs arrive in every ratio there is — 1200×1200, 1774×887,
         * 945×1182 in this shop's own library — so a frame with a fixed height
         * cropped each of them differently and the grid looked like three different
         * shops. Every product picture is now drawn in a square frame: `object-cover`
         * fills it for cards, thumbnails, the basket and the search results, and the
         * product page's large view uses `object-contain` (see `website/templates/`),
         * because there the whole product has to be visible.
         */
        function productImageFrame(inner, { className = '' } = {}) {
            return `<div class="aspect-square w-full overflow-hidden rounded-xl bg-brand-ivory flex items-center justify-center ${className}">${inner}</div>`;
        }

        /**
         * Buy buttons for a product. `lg` is the product details view, where
         * these are the main call to action; the card uses the compact form.
         */
        function buyButtonsMarkup(product, { size = 'sm' } = {}) {
            const links = purchaseLinksFor(product);

            if (links.length === 0) return '';

            return links.map(link => {
                const classes = size === 'lg'
                    ? 'w-full flex items-center justify-center gap-2 bg-brand-botanicalDark hover:bg-brand-botanical text-white font-extrabold px-5 py-3.5 rounded-2xl text-sm shadow-md transition-all active:scale-[0.99]'
                    : 'flex-1 flex items-center justify-center gap-1.5 bg-brand-botanicalDark hover:bg-brand-botanical text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm transition-all active:scale-[0.98]';

                return `<a href="${link.url}" target="_blank" rel="noopener noreferrer nofollow"
                           class="${classes}" data-buy-link="${link.label.toLowerCase()}">Buy on ${link.label}</a>`;
            }).join('');
        }

        /**
         * Draws the catalogue.
         *
         * The cards here and the cards the build writes into the collection pages
         * (`scripts/build/pages.js`) are two renderers of one shape, because this
         * one has to run in the browser when a tab or a search changes the list.
         * What keeps them in step is the contract the build checks: a card links
         * to `product-<slug>.html`, offers `data-buy-link` for the shop, and carries
         * an add-to-basket button — the same three things in both places.
         */
        function renderProducts(itemsToRender = products) {
            const grid = document.getElementById('product-grid');
            if (!grid) return;
            grid.innerHTML = '';

            itemsToRender.forEach(product => {
                const card = document.createElement('article');
                card.className = 'bg-white rounded-3xl p-5 border border-brand-sandDark/70 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group';

                // The best seller badge comes from the database selection
                // (best_seller -> generated data), never from the markup.
                const bestSellerBadge = product.isBestSeller ? `
                            <span class="absolute top-3 right-3 bg-brand-forest text-brand-cream font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm z-10" data-best-seller="true">
                                <i class="fa-solid fa-star text-[9px] mr-0.5"></i> Best Seller
                            </span>` : '';

                // The "100% NATURAL" badge is printed only while the owner has it
                // switched on in Site Settings (Module 48; off by default).
                const naturalBadge = siteSettings.productBadgeEnabled ? `
                            <span class="absolute top-3 left-3 bg-brand-botanicalDark text-white font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm z-10">
                                100% NATURAL
                            </span>` : '';

                const buy = primaryBuyLink(product);

                // A buy button is the card's main action. The CMS will not publish
                // a product without a link, so this normally always renders; if the
                // data ever arrives without one, the button is left out rather than
                // shown pointing nowhere.
                const buyButton = buy
                    ? `<a href="${buy.url}" target="_blank" rel="noopener noreferrer nofollow"
                          data-buy-link="${buy.label.toLowerCase()}"
                          class="flex-1 flex items-center justify-center gap-1.5 bg-brand-botanicalDark hover:bg-brand-botanical text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm transition-all active:scale-[0.98]">
                           <i class="fa-solid fa-bag-shopping text-[10px]" aria-hidden="true"></i> Buy on ${buy.label}
                       </a>`
                    : '';

                const imageAlt = product.imageData && product.imageData.alt ? product.imageData.alt : product.name;
                const imageSrcset = product.imageSrcset ? ` srcset="${product.imageSrcset}" sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 90vw"` : '';
                const imageMarkup = product.image
                    ? `<img src="${product.image}"${imageSrcset} alt="${imageAlt}" loading="lazy" width="800" height="800" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">`
                    : '<span class="text-xs font-semibold text-gray-500">Image coming soon</span>';

                card.innerHTML = `
                    <a href="product-${product.slug}.html" class="block">
                        <div class="relative bg-brand-ivory rounded-2xl p-4 mb-4 overflow-hidden text-center border border-brand-beige">
                            ${naturalBadge}${bestSellerBadge}
                            ${productImageFrame(imageMarkup)}
                        </div>

                        <div class="flex items-center gap-1 text-brand-botanicalDark text-xs mb-1">
                            <i class="fa-solid fa-leaf" aria-hidden="true"></i><span class="font-bold text-gray-700 ml-1">${product.category}</span>
                            <span class="text-gray-500 text-[10px] ml-auto font-semibold">${product.weight}</span>
                        </div>

                        <h3 class="font-serif-heading font-bold text-lg text-brand-forest line-clamp-1 mb-1.5 group-hover:text-brand-botanicalDark transition-colors">
                            ${product.name}
                        </h3>
                        <p class="text-xs text-gray-600 line-clamp-2 mb-4">
                            ${product.shortDescription || product.description}
                        </p>
                    </a>

                    <div class="pt-3 border-t border-brand-sandDark/40">
                        ${cardPriceBlock(product)}
                        <div class="flex items-center gap-2">
                            ${buyButton}
                            <button data-action="add-to-cart" data-product-id="${product.id}" aria-label="Add ${product.name} to the basket" title="Add to basket" class="shrink-0 w-10 h-10 flex items-center justify-center bg-brand-ivory hover:bg-brand-cream text-brand-forest border border-brand-sandDark/70 rounded-xl transition-colors active:scale-95">
                                <i class="fa-solid fa-plus text-xs" aria-hidden="true"></i>
                            </button>
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
        }

        /* renderRituals() / renderIngredientsCatalogue() lived here (Module 48):
           both views, their sections, and the markup they filled were removed at
           the owner's request, so the renderers went with them. */

        /**
         * Adds a product to the basket (Module 53, owner request).
         *
         * The drawer used to open on every add, which interrupted whatever the visitor
         * was reading — and on a product page it covered the page they had just decided
         * to buy from. It stays shut now. The confirmation is the cart button bumping,
         * the count going up, and a line of text: on screen as a toast, and spoken
         * through the live region for anyone who cannot see either.
         */
        function addToCart(productId) {
            const product = products.find(p => p.id === productId);
            if (!product) return;

            if (cart.some(item => item.id === productId)) {
                // The basket is a shortlist, not an order (Module 48): a product is
                // either in it or not. Quantity is chosen on the shop's own page.
                bumpCart();
                showToast(`${product.name} is already in your basket`);
                return;
            }

            cart.push({ ...product });

            updateCartUI();
            bumpCart();
            showToast(`Added ${product.name} to your basket`);
        }

        /**
         * The cart button's one-shot confirmation: a bump, and a pop on the count.
         *
         * The class is removed and the layout is read before it goes back on, because
         * adding a class that is already there changes nothing — and a visitor who adds
         * two products in a row should see it twice. Skipped entirely when the visitor
         * has asked for reduced motion.
         */
        function bumpCart() {
            if (prefersReducedMotion()) return;

            for (const [id, className] of [
                ['cart-button', 'cart-bump'],
                ['cart-count-badge', 'cart-count-pop']
            ]) {
                const element = document.getElementById(id);

                if (!element) continue;

                element.classList.remove(className);
                void element.offsetWidth;
                element.classList.add(className);
            }
        }

        function removeFromCart(productId) {
            const item = cart.find(entry => entry.id === productId);
            if (!item) return;

            cart = cart.filter(entry => entry.id !== productId);
            updateCartUI();
            showToast(`Removed ${item.name} from your basket`);
        }

        function updateCartUI() {
            const countBadge = document.getElementById('cart-count-badge');
            const itemsList = document.getElementById('cart-items-list');

            if (countBadge) countBadge.innerText = cart.length;

            if (!itemsList) return;

            if (cart.length === 0) {
                itemsList.innerHTML = `
                    <div class="text-center py-12 space-y-3">
                        <i class="fa-solid fa-basket-shopping text-4xl text-gray-300" aria-hidden="true"></i>
                        <p class="text-gray-500 font-bold text-sm">Your basket is currently empty.</p>
                        <button data-action="toggle-cart" class="bg-brand-botanicalDark text-white font-bold px-6 py-2 rounded-full text-xs">Start Browsing Herbs</button>
                    </div>
                `;
                return;
            }

            itemsList.innerHTML = '';

            cart.forEach(item => {
                const div = document.createElement('div');
                div.className = "p-3 bg-brand-ivory rounded-2xl border border-brand-sandDark/60";
                div.innerHTML = `
                    <div class="flex items-center gap-4">
                        <div class="w-16 shrink-0">${productImageFrame(`<img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover">`)}</div>
                        <div class="flex-1 min-w-0">
                            <h4 class="font-bold text-xs text-brand-forest truncate">${item.name}</h4>
                            ${cartPriceBlock(item)}
                        </div>
                        <button data-action="remove-from-cart" data-product-id="${item.id}"
                                class="shrink-0 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-brand-forest rounded-lg"
                                aria-label="Remove ${item.name} from the basket" title="Remove from basket">
                            <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                        </button>
                    </div>
                    <div class="flex items-center gap-2 mt-3">
                        ${buyButtonsMarkup(item)}
                    </div>
                `;
                itemsList.appendChild(div);
            });
        }

        function toggleCartDrawer(openState) {
            const drawer = document.getElementById('cart-drawer');
            const backdrop = document.getElementById('cart-backdrop');
            const panel = document.getElementById('cart-panel');

            if (!drawer || !backdrop || !panel) return;

            const isOpen = !drawer.classList.contains('invisible');
            const shouldOpen = openState === true || (!isOpen && openState !== false);

            if (shouldOpen) {
                rememberTrigger('cart');
                lockPageScroll('cart', true);
                drawer.classList.remove('invisible');
                setTimeout(() => {
                    backdrop.classList.remove('opacity-0');
                    panel.children[0].classList.remove('translate-x-full');

                    /*
                     * The keyboard follows the drawer in. This only works because
                     * the drawer itself no longer transitions `visibility`: while
                     * a visibility transition is running the panel still computes
                     * to `hidden` and `focus()` is silently ignored, which would
                     * leave the keyboard on the page behind an open drawer
                     * (Module 40).
                     */
                    const close = panel.querySelector('[data-action="toggle-cart"]');
                    if (close) close.focus();
                }, 10);
            } else {
                backdrop.classList.add('opacity-0');
                panel.children[0].classList.add('translate-x-full');
                lockPageScroll('cart', false);
                setTimeout(() => {
                    drawer.classList.add('invisible');
                }, 300);
                restoreTrigger('cart');
            }

            setExpanded('cart-button', shouldOpen);
        }

        function toggleMobileMenu(openState) {
            const menu = document.getElementById('mobile-menu');
            if (!menu) return;

            const isOpen = !menu.classList.contains('hidden');
            const shouldOpen = openState === true || (!isOpen && openState !== false);

            menu.classList.toggle('hidden', !shouldOpen);

            if (shouldOpen) {
                rememberTrigger('menu');
                lockPageScroll('menu', true);
                const close = menu.querySelector('[data-action="toggle-mobile-menu"]');
                if (close) close.focus();
            } else {
                lockPageScroll('menu', false);
                restoreTrigger('menu');
            }

            setExpanded('menu-button', shouldOpen);
        }

        function toggleSearchModal(openState) {
            const modal = document.getElementById('search-modal');
            if (!modal) return;

            const isOpen = !modal.classList.contains('hidden');
            const shouldOpen = openState === true || (!isOpen && openState !== false);

            modal.classList.toggle('hidden', !shouldOpen);

            if (shouldOpen) {
                rememberTrigger('search');
                lockPageScroll('search', true);
                const input = document.getElementById('search-input');
                if (input) input.focus();
            } else {
                resetSearch();
                lockPageScroll('search', false);
                restoreTrigger('search');
            }

            setExpanded('search-button', shouldOpen);
        }

        /**
         * Puts the search back to the state it opens in, and gives the catalogue
         * back to the category the visitor had chosen.
         *
         * The search filters the product grid as you type, and that grid lives on
         * the page behind the panel. Closing the panel without this left the shop
         * section showing whatever was last typed: searching for something that
         * does not exist left the catalogue with no products at all, and searching
         * for one herb left a single card, with nothing on screen explaining either.
         * The field is cleared for the same reason — a query kept behind a closed
         * panel is a trap, not a convenience.
         */
        function resetSearch() {
            const input = document.getElementById('search-input');
            const list = document.getElementById('search-result-list');
            const suggestions = document.getElementById('search-results');
            const summary = document.getElementById('search-results-summary');

            if (input) input.value = '';

            if (list) {
                list.innerHTML = '';
                list.hidden = true;
            }

            if (suggestions) suggestions.hidden = false;

            if (summary) {
                summary.textContent = '';
                summary.classList.add('hidden');
            }

            // Back to the category that was on screen, not necessarily everything.
            applyCategoryFilter(activeCategory);
        }

        /*
         * Overlay keyboard behaviour (Module 40).
         *
         * Every panel remembers the control that opened it and hands focus back
         * on close, and Escape closes whichever panel is open — without that, a
         * keyboard user can open the quick view and then only leave it with the
         * mouse. Tab is kept inside the two modal panels; the two side panels
         * are ordinary drawers with a visible close button.
         */
        const overlayTriggers = new Map();

        function rememberTrigger(name) {
            const active = document.activeElement;
            if (active && active !== document.body) overlayTriggers.set(name, active);
        }

        function restoreTrigger(name) {
            const trigger = overlayTriggers.get(name);
            overlayTriggers.delete(name);
            if (trigger && document.contains(trigger)) trigger.focus();
        }

        function setExpanded(buttonId, expanded) {
            const button = document.getElementById(buttonId);
            if (button) button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        }

        function isShown(element) {
            return Boolean(element)
                && !element.classList.contains('hidden')
                && !element.classList.contains('invisible');
        }

        /*
         * Holds the page behind an open modal still.
         *
         * Both centred panels scroll their own content, but a wheel over the dimmed
         * backdrop — or a scroll that reaches the end of the list inside the panel —
         * carried on into the page underneath. That read as "the list is not
         * scrolling, the site is", which is exactly how the search panel behaved.
         *
         * The width of the scrollbar is added as padding while it is hidden, so
         * removing it does not shift the whole page sideways.
         */
        const SCROLLABLE_OVERLAYS = new Set();

        function lockPageScroll(name, locked) {
            if (locked) {
                SCROLLABLE_OVERLAYS.add(name);
            } else {
                SCROLLABLE_OVERLAYS.delete(name);
            }

            // Another overlay may still be open; only the last one out unlocks.
            if (SCROLLABLE_OVERLAYS.size > 0) {
                const gap = window.innerWidth - document.documentElement.clientWidth;
                document.body.style.overflow = 'hidden';
                document.body.style.paddingRight = gap > 0 ? `${gap}px` : '';
                return;
            }

            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }

        /** The panel a keyboard user is currently inside, if any. */
        function openOverlay() {
            const search = document.getElementById('search-modal');
            if (isShown(search)) return { element: search, close: () => toggleSearchModal(false) };

            const menu = document.getElementById('mobile-menu');
            if (isShown(menu)) return { element: menu, close: () => toggleMobileMenu(false) };

            const cart = document.getElementById('cart-drawer');
            if (isShown(cart)) return { element: cart, close: () => toggleCartDrawer(false) };

            return null;
        }

        /** Keeps Tab inside the modal panel that is open. */
        function trapFocus(event) {
            const container = document.querySelector('#search-modal:not(.hidden) [role="dialog"]');
            if (!container) return;

            const items = [...container.querySelectorAll(
                'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
            )].filter((element) => element.offsetParent !== null || element === document.activeElement);

            if (items.length === 0) return;

            const first = items[0];
            const last = items[items.length - 1];

            if (event.shiftKey && (document.activeElement === first || document.activeElement === container)) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                const overlay = openOverlay();
                if (overlay) {
                    event.preventDefault();
                    overlay.close();
                }
                return;
            }

            if (event.key === 'Tab') trapFocus(event);
        });

        /**
         * Scrolls without animation when the reader has asked for reduced motion
         * (Module 40). The movement is decoration; landing on the section is not.
         */
        function prefersReducedMotion() {
            return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        }

        function scrollToElement(element) {
            if (!element) return;
            element.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
        }

        function scrollToTop() {
            window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
        }

        function handleLiveSearch() {
            const input = document.getElementById('search-input');
            if (!input) return;

            const query = input.value.trim().toLowerCase();

            // Module 33: search the fields that describe a product — its name, its
            // category, its short description (the line shown on every card), and
            // its ingredients, which is what a visitor looking for a remedy
            // actually types. The long description stays in the haystack so the
            // original behaviour is not lost.
            const results = products.filter(product => [
                product.name,
                product.category,
                product.shortDescription,
                product.ingredients,
                product.description
            ].some(field => String(field || '').toLowerCase().includes(query)));

            renderProducts(results);
            renderSearchResults(results, query);

            // An empty query is not a search: the full catalogue comes back and the
            // grid says nothing about matches.
            const summary = document.getElementById('search-results-summary');

            if (!summary) return;

            if (query.length === 0) {
                summary.textContent = '';
                summary.classList.add('hidden');
                return;
            }

            summary.classList.remove('hidden');
            summary.textContent = results.length === 0
                ? `No products match “${input.value.trim()}”. Try a herb name such as Amla, Reetha, or Multani Mitti.`
                : `${results.length} product${results.length === 1 ? '' : 's'} match “${input.value.trim()}”.`;
        }

        /**
         * Lists the matches inside the search panel.
         *
         * The catalogue grid is filtered as well, but that grid sits behind the
         * open panel, so on its own it looked like the search had found nothing:
         * the summary said “1 product matches” and the panel stayed empty. The
         * matches therefore appear here, where the visitor is looking, and each
         * one opens that product's details.
         */
        function renderSearchResults(results, query) {
            const host = document.getElementById('search-result-list');
            const suggestions = document.getElementById('search-results');

            if (!host) return;

            if (query.length === 0) {
                host.innerHTML = '';
                host.hidden = true;
                if (suggestions) suggestions.hidden = false;
                return;
            }

            // Nothing found: the summary already says so, and the suggestions stay
            // visible so the visitor is not left at a dead end.
            if (results.length === 0) {
                host.innerHTML = '';
                host.hidden = true;
                if (suggestions) suggestions.hidden = false;
                return;
            }

            if (suggestions) suggestions.hidden = true;
            host.hidden = false;

            host.innerHTML = results.map((product) => {
                // Read once: the row prints the price in one place, and with prices
                // switched off there is nothing to print (Module 52).
                const price = priceMarkup(product.price);

                return `
                <a href="product-${product.slug}.html"
                        class="w-full flex items-center gap-3 p-2.5 rounded-2xl border border-brand-sandDark/60 hover:border-brand-botanical hover:bg-brand-sageLight/60 transition-colors text-left">
                    <span class="w-12 shrink-0">${productImageFrame(product.image
                        ? `<img src="${product.image}" alt="" class="w-full h-full object-cover" loading="lazy">`
                        : '')}</span>
                    <span class="flex-1 min-w-0">
                        <span class="block font-bold text-sm text-brand-forest truncate">${product.name}</span>
                        <span class="block text-[11px] text-gray-600 truncate">${product.category} · ${product.weight || ''}</span>
                    </span>
                    ${price
                        ? `<span class="font-extrabold text-sm text-brand-forest shrink-0">${price}</span>`
                        : ''}
                </a>
            `;
            }).join('');
        }

        function quickSearch(keyword) {
            const input = document.getElementById('search-input');
            if (input) {
                input.value = keyword;
                handleLiveSearch();
            }
        }

        /*
         * The product details view lived here as a popup (Modules 33 and 48).
         *
         * It was replaced by real pages — `product-<slug>.html` — at the owner's
         * request: a page can be linked to, shared, and indexed, and the popup could
         * do none of those. Everything it showed (gallery, delivery note, reviews,
         * buy buttons) is written into the page by the build instead, from the same
         * data, so there is nothing left here to keep in step.
         */

        /**
         * Swaps the large picture when a thumbnail is chosen, and marks which one
         * is showing so the choice is visible rather than only remembered.
         * Used by the product pages the build generates.
         */
        function showProductImage(button) {
            const main = document.getElementById('product-main-image');

            if (!main || !button.dataset.imageSrc) return;

            main.src = button.dataset.imageSrc;
            main.srcset = button.dataset.imageSrcset || '';

            if (button.dataset.imageAlt) main.alt = button.dataset.imageAlt;

            button.parentElement?.querySelectorAll('[data-action="view-product-image"]').forEach(other => {
                const isCurrent = other === button;

                other.setAttribute('aria-current', isCurrent ? 'true' : 'false');
                other.classList.toggle('ring-2', isCurrent);
                other.classList.toggle('ring-brand-botanical', isCurrent);
            });
        }

        function toggleFAQ(button) {
            const answer = button.nextElementSibling;
            const icon = button.querySelector('i');
            
            if (answer.classList.contains('hidden')) {
                answer.classList.remove('hidden');
                icon.style.transform = 'rotate(180deg)';
                button.setAttribute('aria-expanded', 'true');
            } else {
                answer.classList.add('hidden');
                icon.style.transform = 'rotate(0deg)';
                button.setAttribute('aria-expanded', 'false');
            }
        }

        /*
         * Shows one of the views that still exist (Module 48), and only that.
         *
         * There used to be five on this page. The ingredients dictionary and the
         * rituals guide were removed at the owner's request, and the policy view
         * went in Module 49 when policies became real pages, so two are left: the
         * home view (with the catalogue) and Our Story. A request for a view that
         * is gone therefore falls back to home rather than blanking the page — the
         * footer and the menu are generated from data and can outlive a removal.
         */
        function navigateTo(viewId) {
            const views = document.querySelectorAll('.view-section');
            views.forEach(view => view.classList.add('hidden'));

            if (viewId === 'shop') {
                document.getElementById('home-view').classList.remove('hidden');
                scrollToElement(document.getElementById('products-section'));
                applyCategoryFilter(activeCategory);
                return;
            }

            const target = document.getElementById(`${viewId}-view`);

            if (target) {
                target.classList.remove('hidden');
            } else {
                document.getElementById('home-view').classList.remove('hidden');

                // A section inside the home view (the FAQ, for example) is reached
                // by scrolling to it rather than by showing a view of its own.
                scrollToElement(document.getElementById(viewId === 'faq' ? 'faq-section' : viewId));
                return;
            }

            scrollToTop();
        }

        /*
         * Shows whatever the address asked for after the page has loaded.
         *
         * The menu on the generated pages (Module 49) sends a visitor back with an
         * address like `index.html#story-view`, because a link that only works
         * through this script is not a link. Nothing here is new behaviour — it is
         * the same two steps the in-page menu uses, applied to the fragment the
         * browser was given.
         */
        function applyAddressFragment() {
            const id = location.hash.replace(/^#/, '');

            if (!id) return;

            const target = document.getElementById(id);

            if (!target) return;

            if (target.classList.contains('view-section')) {
                navigateTo(id.endsWith('-view') ? id.slice(0, -'-view'.length) : id);
                return;
            }

            scrollToElement(target);
        }

        /*
         * The category the catalogue is currently showing ('' means everything).
         *
         * One variable, because the catalogue can be filtered from four places —
         * the tab row, the header menu, the mobile menu, and the footer — and they
         * used to disagree: a footer link filtered the products but left the tab
         * row highlighting "All Products". The live search also filters the grid,
         * so this is what the grid is put back to when the search panel closes.
         */
        let activeCategory = '';

        /** Shows one category of the catalogue, and keeps the tab row in step. */
        function applyCategoryFilter(category) {
            const wanted = String(category ?? '').trim();

            activeCategory = wanted === 'All Products' ? '' : wanted;

            document.querySelectorAll('[data-category-tabs] .tab-btn, .tab-btn').forEach(button => {
                const isActive = (button.dataset.category ?? '') === activeCategory;

                button.className = isActive
                    ? "tab-btn bg-brand-forest text-white font-bold px-5 py-2 rounded-full text-xs sm:text-sm whitespace-nowrap shadow-sm transition-all"
                    : "tab-btn bg-white hover:bg-brand-beige text-brand-forest font-bold px-5 py-2 rounded-full text-xs sm:text-sm whitespace-nowrap transition-all border border-brand-sandDark/80";

                if (button.dataset.action === 'filter-tab') {
                    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
                }
            });

            // An empty or unknown category shows the whole catalogue rather than
            // nothing, which is what the tab row promises with "All Products".
            const filtered = activeCategory
                ? products.filter(p => p.category.toLowerCase() === activeCategory.toLowerCase())
                : products;

            renderProducts(filtered.length > 0 ? filtered : products);
        }

        function filterTab(category) {
            applyCategoryFilter(category);
        }

        /**
         * Removes the hand-off step and the account notice (Module 48).
         *
         * The basket used to end in a "Continue To Marketplace" button that listed
         * the links again, and the header had an account icon that opened a notice
         * saying there is no account system. The owner asked for both to go: the buy
         * buttons now sit on each basket line, where the decision is actually made,
         * and the account icon is gone from the markup. There is still no checkout
         * and no payment anywhere on this site.
         */

        /**
         * Shares the page the button sits on (Module 49).
         *
         * Giving every product its own address is what makes this possible: the
         * native share sheet where the device has one, and a copy of the address
         * where it does not. Deliberately no third-party widget and no request to
         * another host — the policy every page carries allows none of that, and a
         * share button that needs someone else's server is a button that breaks.
         *
         * Cancelling the share sheet rejects with `AbortError`, which is not a
         * failure and must not be reported as one.
         */
        async function shareCurrentPage(button) {
            const url = window.location.href;
            const title = document.title;

            if (navigator.share) {
                try {
                    await navigator.share({ title, url });
                    return;
                } catch (error) {
                    if (error && error.name === 'AbortError') return;
                    // Anything else (a browser that refuses without a gesture, a
                    // device with no target app) falls through to copying.
                }
            }

            const copied = await copyToClipboard(url);

            if (copied) {
                showToast('Link copied — paste it anywhere.');
                return;
            }

            // Last resort: put the address in front of them rather than in a toast
            // that disappears before it can be read.
            showToast(url);
        }

        /** Copies text, with a fallback for browsers without the clipboard API. */
        async function copyToClipboard(text) {
            if (navigator.clipboard?.writeText) {
                try {
                    await navigator.clipboard.writeText(text);
                    return true;
                } catch {
                    // Fall through to the older mechanism below.
                }
            }

            try {
                const field = document.createElement('textarea');
                field.value = text;
                field.setAttribute('readonly', 'readonly');
                field.style.position = 'fixed';
                field.style.opacity = '0';
                document.body.appendChild(field);
                field.select();
                const ok = document.execCommand('copy');
                field.remove();
                return ok;
            } catch {
                return false;
            }
        }

        function showToast(message) {
            const toast = document.createElement('div');
            toast.className = "fixed bottom-6 right-6 bg-brand-forest text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-2 animate-bounce border border-brand-botanical/40";
            toast.innerHTML = `<i class="fa-solid fa-leaf text-brand-cream" aria-hidden="true"></i> ${message}`;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);

            /*
             * The same sentence, for anyone who cannot see the toast (Module 53).
             *
             * The toast itself is not a live region: it is created with its content
             * already inside it, which is the case screen readers are least reliable
             * about announcing. Writing into a region that is already on the page, and
             * that was empty until now, is the pattern that works.
             */
            const status = document.getElementById('live-status');

            if (status) status.textContent = message;
        }

        /* ==================================================================
         * Interaction binding (Modules 29 and 31)
         *
         * The published page runs under `script-src 'self'`, and that blocks
         * inline event handlers: `onclick="…"` is dropped by the browser with no
         * visible sign, so a page built from them looks correct and does nothing.
         *
         * Every control therefore carries a `data-action` attribute, and one
         * listener on the document dispatches it. Markup rendered later — product
         * cards, the basket, the FAQ, the quick view — needs no re-binding, and
         * the page needs no inline script at all.
         * ================================================================== */

        /** Reads an element's `data-product-id`, which is always a whole number. */
        function actionProductId(element) {
            const id = Number(element.dataset.productId);
            return Number.isFinite(id) ? id : null;
        }

        const ACTIONS = {
            /*
             * The menu asks for a view of the home page, which only exists there.
             * On every other page the link's own address (index.html, with a
             * fragment when a view was asked for) is the answer, so the browser is
             * left to follow it rather than being interrupted with an action that
             * has no view to show. That silence is what used to make the logo and
             * the menu do nothing at all outside the home page.
             */
            navigate: (element, event) => {
                if (!document.getElementById('home-view')) return;

                event.preventDefault();
                navigateTo(element.dataset.target);
            },
            'toggle-mobile-menu': (element, event) => {
                // The backdrop only closes the menu when the backdrop itself is
                // clicked. This replaces the inline `event.stopPropagation()` that
                // used to sit on the panel inside it — with one listener on the
                // document, stopping propagation would stop the menu responding.
                if (element.dataset.backdrop === 'true' && event.target !== element) return;
                toggleMobileMenu();
            },
            'toggle-cart': () => toggleCartDrawer(),
            'toggle-search': () => toggleSearchModal(),
            'dismiss-announcement': () => {
                const bar = document.getElementById('announcement-bar');
                if (bar) bar.remove();
            },
            // The "All Products" tab carries an empty category, so it is the
            // absence of a value that means "everything" — the same default the
            // per-button listener used to apply.
            'filter-tab': (element) => filterTab(element.dataset.category || 'All Products'),
            'quick-search': (element) => quickSearch(element.dataset.query),
            toast: (element) => showToast(element.dataset.message),
            'add-to-cart': (element) => {
                const id = actionProductId(element);
                if (id === null) return;

                addToCart(id);
            },
            'remove-from-cart': (element) => removeFromCart(actionProductId(element)),
            'view-product-image': (element) => showProductImage(element),
            'share-product': (element) => shareCurrentPage(element),
            'toggle-faq': (element) => toggleFAQ(element)
        };

        document.addEventListener('click', (event) => {
            const element = event.target.closest('[data-action]');
            if (!element) return;

            /*
             * A real link wins over the action around it.
             *
             * A product card is clickable as a whole (Module 48) and contains a
             * "Buy on Meesho" link. Without this, clicking that link would open
             * the product details *and* leave for the shop. Only a link nested
             * *inside* the action element counts — clicking the element itself
             * still runs its action, and many controls are anchors themselves.
             */
            const clickedLink = event.target.closest('a[href]');

            if (clickedLink && clickedLink !== element && element.contains(clickedLink)) return;

            const action = ACTIONS[element.dataset.action];

            // An unknown action is ignored rather than throwing, so a typo in the
            // markup cannot stop every other control on the page from working.
            if (!action) return;

            // Most controls are links with `href="#"`. Their default action jumps
            // to the top of the page, which fights the smooth scroll these actions
            // perform, so the default is suppressed for them.
            if (element.tagName === 'A' && element.getAttribute('href') === '#') event.preventDefault();

            action(element, event);

            if (element.dataset.closeMenu === 'true') toggleMobileMenu();
        });

        /** Live search listens for typing, which is not a click. */
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.addEventListener('input', handleLiveSearch);

        /*
         * The newsletter form and its acknowledgement lived here. The whole section
         * was removed at the owner's request (Module 48), so there is no form left to
         * listen to and no "thank you for subscribing" that promises an email list
         * nobody runs.
         */

        // Initialize App on Window Load
        window.onload = function() {
            loadWebsiteData()
                .then(() => {
                    renderSettings();
                    renderContact();
                    renderCategories();
                    renderBestSeller();
                    renderProducts();
                    renderReviews();
                    renderFaqs();
                    updateCartUI();

                    // Last, because it may scroll: every section has to be in its
                    // final place before the page can be moved to one of them.
                    applyAddressFragment();
                })
                .catch(error => {
                    // The page stays usable without data: the layout, hero, and
                    // static sections still render, and the grids say what happened.
                    console.error('Could not load website data', error);
                    showDataProblem();
                });
        }

        /* ==================================================================
         * Generated data (Modules 15-18)
         *
         * Everything below reads the JSON written by the build. There is no
         * database call anywhere in this file.
         * ================================================================== */

        const DATA_FILES = [
            'data/settings.json',
            'data/categories.json',
            'data/products.json',
            'data/best-seller.json',
            'data/reviews.json',
            'data/faqs.json'
        ];

        /**
         * Loads every generated file. `cache: 'no-store'` keeps local preview
         * honest after a rebuild, which matters more here than saving a request.
         */
        async function loadWebsiteData() {
            const responses = await Promise.all(
                DATA_FILES.map(file => fetch(file, { cache: 'no-store' }))
            );

            const payloads = await Promise.all(
                responses.map((response, index) => {
                    if (!response.ok) {
                        throw new Error(`${DATA_FILES[index]} returned ${response.status}`);
                    }
                    return response.json();
                })
            );

            const [settingsFile, categoriesFile, productsFile, bestSellerFile, reviewsFile, faqsFile] = payloads;

            siteSettings = settingsFile.item || {};
            categories = categoriesFile.items || [];
            products = productsFile.items || [];
            bestSeller = bestSellerFile.item || null;
            reviews = reviewsFile.items || [];
            faqs = faqsFile.items || [];

            return true;
        }

        /** Replaces the hardcoded announcement bar, brand names, and contact details. */
        function renderSettings() {
            const bar = document.getElementById('announcement-bar');

            if (bar) {
                const text = (siteSettings.announcementText || '').trim();

                if (!siteSettings.announcementEnabled || text.length === 0) {
                    // Off, or nothing written yet: the bar is removed rather than
                    // left empty or filled with a placeholder.
                    bar.remove();
                } else {
                    const message = bar.querySelector('[data-announcement-text]');
                    if (message) message.textContent = text;

                    const badge = bar.querySelector('[data-announcement-badge]');
                    if (badge) badge.textContent = (siteSettings.siteName || 'HerbalVan').toUpperCase();
                }
            }

            document.querySelectorAll('[data-site-name]').forEach(node => {
                const name = siteSettings.siteName;

                if (!name) return;

                node.textContent = node.dataset.siteName === 'upper' ? name.toUpperCase() : name;
            });

            /*
             * The owner's own logo, when they have uploaded one (Module 47).
             *
             * The logo and the monogram are two separate elements, not two children
             * of one badge (Module 50): the logo is a transparent wordmark and is
             * shown at its own width with no panel or circle behind it, so squeezing
             * it into a 40px badge was what made it unreadable. Exactly one of the two
             * is shown, and with no logo set the approved monogram design stays.
             */
            const logo = siteSettings.logo;

            document.querySelectorAll('[data-site-logo]').forEach(img => {
                const fallback = img.parentElement?.querySelector('[data-logo-fallback]');

                if (!logo?.src) {
                    img.hidden = true;
                    img.removeAttribute('src');
                    if (fallback) fallback.hidden = false;
                    return;
                }

                if (logo.srcset) img.srcset = logo.srcset;
                img.src = logo.src;
                // The site name is a better name than nothing when the owner has not
                // written alt text for the logo; an unlabelled brand image helps nobody.
                img.alt = logo.alt || siteSettings.siteName || 'HerbalVan';
                if (logo.width) img.width = logo.width;
                if (logo.height) img.height = logo.height;
                img.hidden = false;
                if (fallback) fallback.hidden = true;
            });

            document.querySelectorAll('[data-contact-email]').forEach(node => {
                const email = siteSettings.supportEmail || siteSettings.contactEmail;

                if (!email) {
                    // No invented contact details: the line is removed instead.
                    node.remove();
                    return;
                }

                const icon = node.querySelector('i');
                node.innerHTML = '';
                if (icon) node.appendChild(icon);

                const link = document.createElement('a');
                link.href = `mailto:${email}`;
                link.textContent = email;
                link.className = 'hover:text-brand-cream transition-colors';
                node.appendChild(link);            });

            const socials = {
                instagram: siteSettings.instagramUrl,
                facebook: siteSettings.facebookUrl,
                youtube: siteSettings.youtubeUrl
            };

            Object.entries(socials).forEach(([network, url]) => {
                const link = document.querySelector(`[data-social="${network}"]`);

                if (!link) return;

                if (!isSafeHttpUrl(url)) {
                    // No invented or unsafe links: the icon is removed until a real
                    // http(s) profile exists.
                    link.remove();
                    return;
                }

                link.setAttribute('href', url);
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');

                // The markup carries a placeholder action that explains the link is
                // not set up yet. Once a real profile exists it has to go, or
                // clicking the icon would follow the link *and* pop that message —
                // the same cleanup the old inline handler needed.
                link.removeAttribute('data-action');
                link.removeAttribute('data-message');
                link.removeAttribute('data-prevent');
            });
        }

        /**
         * Swaps the marked, hardcoded category elements for the generated ones.
         *
         * Marked elements can sit inside a wrapper (the footer uses `<li>`), so
         * each one is lifted to the level of the container's direct children
         * before inserting and removing. That way a generated node replaces a
         * whole row instead of nesting inside one, and spacing classes on the
         * parent keep working.
         */
        function replaceCategoryItems(containerSelector, createNode) {
            const container = document.querySelector(containerSelector);

            if (!container) return;

            const marked = [...container.querySelectorAll('[data-category-item]')];

            if (marked.length === 0) return;

            const rows = [...new Set(marked.map(node => {
                let current = node;

                while (current.parentElement && current.parentElement !== container) {
                    current = current.parentElement;
                }

                return current;
            }))];

            const anchor = rows[0];

            categories.forEach(category => {
                container.insertBefore(createNode(category), anchor);
            });

            rows.forEach(row => row.remove());
        }

        /**
         * Renders every category list from the database: the shop tabs, the
         * desktop navigation, the mobile menu, and the footer column.
         */
        function renderCategories() {
            // Shop tabs stay buttons: they filter the grid in place, which is what
            // the owner asked for on the home page.
            const tabs = document.querySelector('[data-category-tabs]');

            if (tabs) {
                const activeClass = "tab-btn bg-brand-forest text-white font-bold px-5 py-2 rounded-full text-xs sm:text-sm whitespace-nowrap shadow-sm transition-all";
                const idleClass = "tab-btn bg-white hover:bg-brand-beige text-brand-forest font-bold px-5 py-2 rounded-full text-xs sm:text-sm whitespace-nowrap transition-all border border-brand-sandDark/80";

                tabs.innerHTML = `<button type="button" class="${activeClass}" data-action="filter-tab" data-category="All Products">All Products</button>`;

                categories.forEach(category => {
                    const button = document.createElement('button');

                    button.type = 'button';
                    button.className = idleClass;
                    button.dataset.action = 'filter-tab';
                    button.dataset.category = category.name;
                    button.textContent = category.name;
                    tabs.appendChild(button);
                });
            }

            /*
             * Everything else is a real link to the generated collection page
             * (Module 49), so the menu, the mobile list, and the footer work with
             * JavaScript switched off, and every collection has one address that can
             * be shared and crawled. The markup carries the same links as a fallback,
             * and the build fails if a link has no page — which is what makes
             * hard-coding these addresses safe.
             */
            const collectionLink = (category, className) => {
                const link = document.createElement('a');

                link.className = className;
                link.href = `collection-${category.slug}.html`;
                link.textContent = category.name;
                return link;
            };

            replaceCategoryItems('[data-category-nav]', category => collectionLink(
                category,
                'nav-link hover:text-brand-botanicalDark transition-colors'
            ));

            replaceCategoryItems('[data-category-mobile]', category => collectionLink(
                category,
                'text-left text-gray-600 pl-4 hover:text-brand-botanicalDark'
            ));

            replaceCategoryItems('[data-category-footer]', category => {
                const item = document.createElement('li');

                item.appendChild(collectionLink(category, 'hover:text-brand-cream transition-colors'));
                return item;
            });
        }

        /**
         * Homepage best seller (Module 18).
         *
         * Flow: best_seller table -> generated best-seller.json -> this card.
         * Nothing is ranked or calculated, and when no product is selected the
         * card is removed so the homepage keeps working without it.
         */
        function renderBestSeller() {
            const host = document.querySelector('[data-best-seller]');

            if (!host) return;

            if (!bestSeller) {
                // Graceful fallback: no best seller means no showcase, not a blank card.
                host.remove();
                return;
            }

            const setText = (selector, value) => {
                const node = host.querySelector(selector);
                if (node && value !== null && value !== undefined && value !== '') node.textContent = value;
            };

            const image = host.querySelector('[data-best-seller-image]');
            if (image) {
                const alt = bestSeller.imageData && bestSeller.imageData.alt
                    ? bestSeller.imageData.alt
                    : bestSeller.name;

                if (bestSeller.image) {
                    image.setAttribute('src', bestSeller.image);
                    if (bestSeller.imageSrcset) {
                        image.setAttribute('srcset', bestSeller.imageSrcset);
                        image.setAttribute('sizes', '(min-width: 1024px) 28vw, 90vw');
                    }
                }

                image.setAttribute('alt', alt);
                image.setAttribute('loading', 'eager');
            }

            setText('[data-best-seller-name]', bestSeller.name);
            setText('[data-best-seller-category]', bestSeller.category);
            setText('[data-best-seller-description]', bestSeller.shortDescription || bestSeller.description);
            setText('[data-best-seller-price]', priceMarkup(bestSeller.price));
            setText('[data-best-seller-weight]', bestSeller.weight ? `${bestSeller.weight} Pure Herb` : null);

            const addButton = host.querySelector('[data-best-seller-add]');

            if (addButton) {
                addButton.setAttribute('data-action', 'add-to-cart');
                addButton.setAttribute('data-product-id', String(bestSeller.id));
                addButton.setAttribute('aria-label', `Add ${bestSeller.name} to your basket`);
            }

            // The showcase links to the best seller's own page, like every card does.
            host.querySelectorAll('[data-best-seller-link]').forEach(link => {
                link.setAttribute('href', `product-${bestSeller.slug}.html`);
            });

            // The same buy button the cards use, so the showcase sends the visitor
            // to the shop rather than only into the basket (Module 48).
            const buyHost = host.querySelector('[data-best-seller-buy]');

            if (buyHost) {
                buyHost.innerHTML = buyButtonsMarkup(bestSeller);
            }

            const note = host.querySelector('[data-best-seller-note]');

            if (note) {
                if (bestSeller.deliveryNote) {
                    note.textContent = bestSeller.deliveryNote;
                    note.hidden = false;
                } else {
                    note.hidden = true;
                }
            }

            const badge = host.querySelector('[data-best-seller-badge]');
            if (badge) {
                badge.textContent = `${(siteSettings.siteName || 'HerbalVan').toUpperCase()} BESTSELLER`;
            }
        }

        /* ==================================================================
         * Reviews, FAQ, policies, contact (Modules 19-21)
         * ================================================================== */

        /** Initials for the review avatar, e.g. "Asha Verma" -> "AV". */
        function initialsFor(name) {
            const parts = String(name || '').trim().split(/\s+/).filter(Boolean);

            if (parts.length === 0) return 'HV';

            return parts.slice(0, 2).map(part => part[0].toUpperCase()).join('');
        }

        /** Solid stars for the rating, outline stars for the rest. */
        function starsMarkup(rating) {
            const value = Math.max(0, Math.min(5, Number(rating) || 0));
            const solid = '<i class="fa-solid fa-star"></i>'.repeat(value);
            const outline = '<i class="fa-regular fa-star"></i>'.repeat(5 - value);

            return `<span class="sr-only">${value} out of 5</span>${solid}${outline}`;
        }

        /**
         * Customer reviews (Module 19).
         *
         * Published reviews only, each one shown against its own product. The
         * "Verified" wording appears only when the owner really set the flag —
         * the page never claims a verification that is not stored.
         */
        function renderReviews() {
            const section = document.querySelector('[data-reviews-section]');
            const grid = document.querySelector('[data-reviews-grid]');

            if (!section || !grid) return;

            if (reviews.length === 0) {
                // No published reviews means no section: an empty "Real Herbal
                // Experiences" block would be worse than no block at all.
                section.remove();
                return;
            }

            const avatarColors = ['bg-brand-botanicalDark', 'bg-brand-forest', 'bg-brand-amber'];

            grid.innerHTML = reviews.map((review, index) => {
                const product = products.find(item => item.id === review.productId);
                const productLine = product
                    ? `<a href="product-${product.slug}.html" class="hover:text-brand-botanicalDark transition-colors">${product.name}</a>`
                    : `${review.productName}`;
                const verification = review.verified ? 'Verified Customer Review' : 'Customer Review';

                return `
                        <div class="bg-white p-6 rounded-3xl shadow-sm border border-brand-sandDark/60 flex flex-col justify-between" data-review-id="${review.id}">
                            <div class="space-y-3">
                                <div class="flex text-brand-amber text-xs" aria-label="${review.rating} out of 5">
                                    ${starsMarkup(review.rating)}
                                </div>
                                <p class="text-gray-700 text-sm italic font-medium leading-relaxed">
                                    "${review.reviewText}"
                                </p>
                            </div>
                            <div class="pt-6 border-t border-gray-100 mt-4 flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full ${avatarColors[index % avatarColors.length]} text-white font-bold flex items-center justify-center text-sm">${initialsFor(review.customerName)}</div>
                                <div>
                                    <div class="font-bold text-sm text-brand-forest">${review.customerName}</div>
                                    <div class="text-xs text-gray-500">${verification} · ${productLine}</div>
                                </div>
                            </div>
                        </div>`;
            }).join('');
        }

        /** FAQ accordion (Module 20): active questions only, in sort order. */
        function renderFaqs() {
            const section = document.getElementById('faq-section');
            const container = document.querySelector('[data-faq-container]');

            if (!section || !container) return;

            if (faqs.length === 0) {
                section.remove();
                return;
            }

            container.innerHTML = faqs.map(faq => `
                        <div class="border border-brand-sandDark/80 rounded-2xl overflow-hidden">
                            <button data-action="toggle-faq" aria-expanded="false" class="w-full p-5 text-left font-bold text-brand-forest text-base sm:text-lg flex justify-between items-center bg-brand-ivory hover:bg-brand-cream/40 transition-colors">
                                <span>${faq.question}</span>
                                <i class="fa-solid fa-chevron-down text-brand-botanical transition-transform"></i>
                            </button>
                            <div class="faq-answer hidden p-5 bg-white border-t border-brand-sandDark/40 text-sm text-gray-600 leading-relaxed">
                                ${faq.answer}
                            </div>
                        </div>`).join('');
        }

        /*
         * The in-page policy view lived here (Module 21).
         *
         * Policies are real pages now — `policy-privacy.html`, `policy-terms.html`
         * and so on (Module 49) — so the footer links straight at them and the
         * published text is written into the page by the build. Nothing about a
         * policy is rendered in the browser any more.
         */

        /**
         * Contact details (Module 21): every public location reads the same
         * settings row, and a location with no value is removed.
         */
        function renderContact() {
            const host = document.querySelector('[data-contact-line]');

            if (!host) return;

            const entries = [];

            const email = siteSettings.supportEmail || siteSettings.contactEmail;
            if (email) entries.push(`<a href="mailto:${email}" class="hover:text-white transition-colors">${email}</a>`);

            if (siteSettings.phone) {
                const phone = siteSettings.phone;
                entries.push(`<a href="tel:${phone.replace(/[^+0-9]/g, '')}" class="hover:text-white transition-colors">${phone}</a>`);
            }

            if (siteSettings.whatsapp) {
                const whatsapp = siteSettings.whatsapp.replace(/[^0-9]/g, '');
                entries.push(`<a href="https://wa.me/${whatsapp}" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors">WhatsApp</a>`);
            }

            if (entries.length === 0) {
                // Nothing invented: with no contact details the line is not shown.
                host.remove();
                return;
            }

            host.innerHTML = `<i class="fa-solid fa-headset mr-1.5 text-brand-botanical"></i>${entries.join('<span class="mx-1.5 text-brand-sage/50">·</span>')}`;
            host.classList.remove('hidden');
        }

        /** Announces a data problem in the product grid instead of failing silently. */
        function showDataProblem() {
            const grid = document.getElementById('product-grid');

            if (grid) {
                grid.innerHTML = `<p class="col-span-full text-sm text-gray-600 bg-brand-ivory border border-brand-sandDark/60 rounded-2xl p-6">
                    The product list could not be loaded. Run <code>npm run build</code> to regenerate the website data, then reload this page.
                </p>`;
            }
        }
