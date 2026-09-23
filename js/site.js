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
        let policies = [];

        const rituals = [
            {
                title: "Classic Trio Hair Wash",
                time: "30 Min",
                category: "Hair Ritual",
                image: "images/decorative/ritual-hair-wash.webp",
                description: "Combine Amla, Reetha, and Shikakai in equal parts with warm water to create a chemical-free cleansing hair wash."
            },
            {
                title: "Purifying Clay & Neem Mask",
                time: "15 Min",
                category: "Skin Ritual",
                image: "images/decorative/ritual-clay-mask.webp",
                description: "Mix Multani Mitti with a pinch of Neem Powder and pure rose water for a cooling, deep-cleansing facial pack."
            },
            {
                title: "Cooling Hibiscus Scalp Pack",
                time: "20 Min",
                category: "Scalp Ritual",
                image: "images/decorative/ritual-scalp-pack.webp",
                description: "Blend Hibiscus powder with plain yogurt to soothe the scalp and add natural moisture to dry hair strands."
            },
            {
                title: "Rose & Mulethi Glow Blend",
                time: "15 Min",
                category: "DIY Herbal Rituals",
                image: "images/decorative/ritual-glow-blend.webp",
                description: "Mix equal parts Rose Petal powder and Mulethi powder with raw milk or floral water for a soothing skin routine."
            }
        ];

        // Shopping Cart State
        let cart = [];

        /* ==================================================================
         * Marketplace links (Module 22)
         *
         * HerbalVan does not process purchases: there is no checkout, no
         * payment, and no order. Every buy button is a link to a marketplace
         * the owner configured, and a product with no configured link simply
         * has no buy button.
         * ================================================================== */

        const MARKETPLACES = [
            { key: 'meesho', label: 'Meesho' },
            { key: 'amazon', label: 'Amazon' },
            { key: 'flipkart', label: 'Flipkart' }
        ];

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

        /** The marketplace links a product really has, in display order. */
        function marketplacesFor(product) {
            if (!product || !product.marketplace) return [];

            return MARKETPLACES
                .filter(marketplace => isSafeHttpUrl(product.marketplace[marketplace.key]))
                .map(marketplace => ({ label: marketplace.label, url: product.marketplace[marketplace.key] }));
        }

        /** Small pill buttons for the marketplaces a product is listed on. */
        function marketplaceButtonsMarkup(product, { size = 'sm' } = {}) {
            const links = marketplacesFor(product);

            if (links.length === 0) return '';

            const classes = size === 'lg'
                ? 'text-xs font-bold text-white bg-brand-forest hover:bg-brand-darkText px-4 py-2.5 rounded-full transition-colors'
                : 'text-[11px] font-bold text-brand-forest bg-brand-ivory hover:bg-brand-cream border border-brand-sandDark/60 px-3 py-1.5 rounded-full transition-colors';

            return links.map(link => `
                            <a href="${link.url}" target="_blank" rel="noopener noreferrer nofollow"
                               class="${classes}">Buy on ${link.label}</a>`).join('');
        }

        function renderProducts(itemsToRender = products) {
            const grid = document.getElementById('product-grid');
            if (!grid) return;
            grid.innerHTML = '';

            itemsToRender.forEach(product => {
                const card = document.createElement('div');
                card.className = "bg-white rounded-3xl p-5 border border-brand-sandDark/70 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group";

                // The best seller badge comes from the database selection
                // (best_seller -> generated data), never from the markup.
                const bestSellerBadge = product.isBestSeller ? `
                            <span class="absolute top-3 right-3 bg-brand-forest text-brand-cream font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm z-10" data-best-seller="true">
                                <i class="fa-solid fa-star text-[9px] mr-0.5"></i> Best Seller
                            </span>` : '';

                // Marketplace buttons only appear when the owner has filled in a
                // real link; an empty or unsafe link is left out entirely.
                const marketplaceRow = marketplacesFor(product).length > 0 ? `
                    <div class="flex flex-wrap gap-2 pt-3 mt-3 border-t border-brand-sandDark/40">
                        ${marketplaceButtonsMarkup(product)}
                    </div>` : '';

                const imageAlt = product.imageData && product.imageData.alt ? product.imageData.alt : product.name;
                const imageSrcset = product.imageSrcset ? ` srcset="${product.imageSrcset}" sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 90vw"` : '';
                const imageMarkup = product.image
                    ? `<img src="${product.image}"${imageSrcset} alt="${imageAlt}" loading="lazy" width="400" height="400" class="w-full h-48 object-cover rounded-xl group-hover:scale-105 transition-transform duration-500">`
                    : `<div class="w-full h-48 rounded-xl bg-brand-cream/50 flex items-center justify-center text-xs font-semibold text-gray-500">Image coming soon</div>`;

                card.innerHTML = `
                    <div>
                        <div class="relative bg-brand-ivory rounded-2xl p-4 mb-4 overflow-hidden text-center border border-brand-beige">
                            <span class="absolute top-3 left-3 bg-brand-botanicalDark text-white font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm z-10">
                                100% NATURAL
                            </span>${bestSellerBadge}
                            ${imageMarkup}
                            <button data-action="open-quick-view" data-product-id="${product.id}" class="absolute bottom-3 right-3 bg-white/90 hover:bg-white text-brand-forest w-9 h-9 rounded-full shadow-md flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity" title="Quick View">
                                <i class="fa-solid fa-eye"></i>
                            </button>
                        </div>

                        <div class="flex items-center gap-1 text-brand-botanicalDark text-xs mb-1">
                            <i class="fa-solid fa-leaf"></i><span class="font-bold text-gray-700 ml-1">${product.category}</span>
                            <span class="text-gray-500 text-[10px] ml-auto font-semibold">${product.weight}</span>
                        </div>

                        <h3 class="font-serif-heading font-bold text-lg text-brand-forest line-clamp-1 mb-1.5 group-hover:text-brand-botanicalDark transition-colors">
                            ${product.name}
                        </h3>
                        <p class="text-xs text-gray-600 line-clamp-2 mb-4">
                            ${product.shortDescription || product.description}
                        </p>
                    </div>

                    <div>
                        <div class="flex items-center justify-between pt-3 border-t border-brand-sandDark/40">
                            <div>
                                <span class="text-xl font-extrabold text-brand-forest">₹${product.price}.00</span>
                            </div>
                            <button data-action="add-to-cart" data-product-id="${product.id}" class="bg-brand-forest hover:bg-brand-darkText text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all">
                                <i class="fa-solid fa-plus text-[10px]"></i> Add
                            </button>
                        </div>
                        ${marketplaceRow}
                    </div>
                `;
                grid.appendChild(card);
            });
        }

        function renderRituals() {
            const previewGrid = document.getElementById('rituals-grid');
            const allGrid = document.getElementById('all-rituals-grid');

            if (previewGrid) {
                previewGrid.innerHTML = '';
                rituals.forEach(r => {
                    const card = document.createElement('div');
                    card.className = "bg-brand-ivory rounded-3xl p-4 border border-brand-sandDark/70 flex flex-col justify-between group hover:bg-brand-cream/40 transition-all";
                    card.innerHTML = `
                        <div>
                            <div class="relative rounded-2xl overflow-hidden mb-3 h-40">
                                <img src="${r.image}" alt="${r.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                                <span class="absolute bottom-2 left-2 bg-brand-forest/90 text-white text-[10px] px-2.5 py-1 rounded-full backdrop-blur-sm">
                                    <i class="fa-regular fa-clock mr-1"></i>${r.time}
                                </span>
                            </div>
                            <span class="text-[10px] font-extrabold text-brand-botanicalDark uppercase tracking-wider">${r.category}</span>
                            <h4 class="font-serif-heading font-bold text-base text-brand-forest mb-1 mt-0.5">${r.title}</h4>
                            <p class="text-xs text-gray-600 mb-3 leading-relaxed">${r.description}</p>
                        </div>
                        <div class="flex justify-between items-center text-xs font-bold text-brand-botanicalDark pt-2 border-t border-brand-sandDark/40">
                            <span>Herbal Routine</span>
                            <button data-action="toast" data-message="Ritual: ${r.title}" class="hover:underline">Explore Ritual &rarr;</button>
                        </div>
                    `;
                    previewGrid.appendChild(card);
                });
            }

            if (allGrid) {
                allGrid.innerHTML = '';
                rituals.forEach(r => {
                    const card = document.createElement('div');
                    card.className = "bg-white p-6 rounded-3xl border border-brand-sandDark/70 flex flex-col md:flex-row gap-6 items-center shadow-sm";
                    card.innerHTML = `
                        <img src="${r.image}" alt="${r.title}" loading="lazy" decoding="async" class="w-full md:w-48 h-48 object-cover rounded-2xl shrink-0">
                        <div class="space-y-2">
                            <span class="text-xs font-extrabold text-brand-botanicalDark uppercase tracking-wider">${r.category} &bull; ${r.time}</span>
                            <h3 class="font-serif-heading font-bold text-xl text-brand-forest">${r.title}</h3>
                            <p class="text-xs sm:text-sm text-gray-600 leading-relaxed">${r.description}</p>
                            <button data-action="toast" data-message="Starting ritual: ${r.title}" class="mt-2 bg-brand-forest text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-brand-botanicalDark transition-colors">
                                Explore Step-By-Step
                            </button>
                        </div>
                    `;
                    allGrid.appendChild(card);
                });
            }
        }

        function renderIngredientsCatalogue() {
            const grid = document.getElementById('ingredients-catalogue-grid');
            if (!grid) return;
            grid.innerHTML = '';

            products.forEach(p => {
                const card = document.createElement('div');
                card.className = "bg-white p-6 rounded-3xl border border-brand-sandDark/70 hover:shadow-lg transition-all space-y-3";
                card.innerHTML = `
                    <div class="flex items-center gap-4">
                        <img src="${p.image}" alt="${p.name}" class="w-16 h-16 object-cover rounded-2xl border border-brand-beige">
                        <div>
                            <span class="text-[10px] font-bold text-brand-botanicalDark uppercase">${p.category}</span>
                            <h4 class="font-serif-heading font-bold text-lg text-brand-forest">${p.name}</h4>
                            <span class="text-xs text-gray-500">${p.weight} Pack</span>
                        </div>
                    </div>
                    <p class="text-xs text-gray-600 leading-relaxed">${p.description}</p>
                    <div class="pt-2 border-t border-brand-sandDark/40 flex justify-between items-center text-xs">
                        <span class="font-bold text-brand-forest">₹${p.price}.00</span>
                        <button data-action="open-quick-view" data-product-id="${p.id}" class="text-brand-botanicalDark font-bold hover:underline">View Botanicals &rarr;</button>
                    </div>
                `;
                grid.appendChild(card);
            });
        }

        function addToCart(productId) {
            const product = products.find(p => p.id === productId);
            if (!product) return;

            const existing = cart.find(item => item.id === productId);
            if (existing) {
                existing.quantity += 1;
            } else {
                cart.push({ ...product, quantity: 1 });
            }

            updateCartUI();
            toggleCartDrawer(true);
            showToast(`Added ${product.name} to cart`);
        }

        function updateCartQuantity(productId, change) {
            const item = cart.find(i => i.id === productId);
            if (!item) return;

            item.quantity += change;
            if (item.quantity <= 0) {
                cart = cart.filter(i => i.id !== productId);
            }

            updateCartUI();
        }

        function updateCartUI() {
            const countBadge = document.getElementById('cart-count-badge');
            const itemsList = document.getElementById('cart-items-list');
            const subtotalElem = document.getElementById('cart-subtotal');
            const totalElem = document.getElementById('cart-total');

            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            if (countBadge) countBadge.innerText = totalItems;
            if (subtotalElem) subtotalElem.innerText = `₹${subtotal.toFixed(2)}`;
            if (totalElem) totalElem.innerText = `₹${subtotal.toFixed(2)}`;

            if (!itemsList) return;

            if (cart.length === 0) {
                itemsList.innerHTML = `
                    <div class="text-center py-12 space-y-3">
                        <i class="fa-solid fa-basket-shopping text-4xl text-gray-300"></i>
                        <p class="text-gray-500 font-bold text-sm">Your basket is currently empty.</p>
                        <button data-action="toggle-cart" class="bg-brand-botanicalDark text-white font-bold px-6 py-2 rounded-full text-xs">Start Browsing Herbs</button>
                    </div>
                `;
                return;
            }

            itemsList.innerHTML = '';
            cart.forEach(item => {
                const div = document.createElement('div');
                div.className = "flex items-center justify-between gap-4 p-3 bg-brand-ivory rounded-2xl border border-brand-sandDark/60";
                div.innerHTML = `
                    <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-xl shrink-0 border border-brand-beige">
                    <div class="flex-1 min-w-0">
                        <h4 class="font-bold text-xs text-brand-forest truncate">${item.name}</h4>
                        <div class="text-xs font-bold text-brand-botanicalDark mt-0.5">₹${item.price}.00</div>
                    </div>
                    <div class="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-brand-sandDark/60">
                        <button data-action="cart-decrease" data-product-id="${item.id}" class="text-gray-500 hover:text-brand-botanicalDark font-bold text-xs p-1" aria-label="Remove one from the basket">-</button>
                        <span class="text-xs font-extrabold text-brand-forest w-4 text-center">${item.quantity}</span>
                        <button data-action="cart-increase" data-product-id="${item.id}" class="text-gray-500 hover:text-brand-botanicalDark font-bold text-xs p-1" aria-label="Add one more to the basket">+</button>
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
                const close = menu.querySelector('[data-action="toggle-mobile-menu"]');
                if (close) close.focus();
            } else {
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
                const input = document.getElementById('search-input');
                if (input) input.focus();
            } else {
                restoreTrigger('search');
            }

            setExpanded('search-button', shouldOpen);
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

        /** The panel a keyboard user is currently inside, if any. */
        function openOverlay() {
            const quickView = document.getElementById('quickview-modal');
            if (isShown(quickView)) return { element: quickView, close: closeQuickView };

            const search = document.getElementById('search-modal');
            if (isShown(search)) return { element: search, close: () => toggleSearchModal(false) };

            const menu = document.getElementById('mobile-menu');
            if (isShown(menu)) return { element: menu, close: () => toggleMobileMenu(false) };

            const cart = document.getElementById('cart-drawer');
            if (isShown(cart)) return { element: cart, close: () => toggleCartDrawer(false) };

            return null;
        }

        /** Keeps Tab inside the modal panels (quick view and search). */
        function trapFocus(event) {
            const container = document.querySelector('#quickview-modal:not(.hidden) [role="dialog"], #search-modal:not(.hidden) [role="dialog"]');
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

        function quickSearch(keyword) {
            const input = document.getElementById('search-input');
            if (input) {
                input.value = keyword;
                handleLiveSearch();
            }
        }

        function openQuickView(id) {
            const product = products.find(p => p.id === id);
            if (!product) return;

            const modal = document.getElementById('quickview-modal');
            const container = document.getElementById('quickview-content');

            container.innerHTML = `
                <div>
                    <img src="${product.image}" alt="${product.name}" class="w-full h-64 sm:h-80 object-cover rounded-2xl bg-brand-ivory border border-brand-sandDark/60">
                </div>
                <div class="space-y-4 flex flex-col justify-between">
                    <div>
                        <span class="bg-brand-sageLight text-brand-forest text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border border-brand-sage/40">100% Pure Botanical</span>
                        <h3 id="quickview-heading" class="font-serif-heading font-black text-2xl text-brand-forest mt-2">${product.name}</h3>
                        <p class="text-xs text-gray-600 mt-1">${product.description}</p>
                        
                        <div class="mt-4 p-4 bg-brand-ivory rounded-2xl space-y-2 border border-brand-sandDark/60">
                            <div class="font-bold text-xs text-brand-forest">Ingredients & Usage</div>
                            <p class="text-[11px] text-gray-600"><strong>Ingredients:</strong> ${product.ingredients}</p>
                            <p class="text-[11px] text-gray-600"><strong>How To Use:</strong> ${product.howToUse}</p>
                        </div>
                    </div>

                    <div class="pt-4 border-t border-brand-sandDark/40">
                        <div class="flex items-center justify-between mb-4">
                            <div>
                                <span class="text-2xl font-black text-brand-forest">₹${product.price}.00</span>
                            </div>
                            <span class="text-xs font-bold text-gray-500">${product.weight} Pack</span>
                        </div>
                        ${product.publishedReviewCount > 0 ? `
                        <p class="text-xs text-gray-500 mb-3">
                            <i class="fa-solid fa-star text-brand-amber"></i>
                            ${product.publishedReviewCount} published review${product.publishedReviewCount === 1 ? '' : 's'} for this herb
                        </p>` : ''}
                        <button data-action="add-to-cart" data-product-id="${product.id}" data-close-quick-view="true" class="w-full bg-brand-botanicalDark hover:bg-brand-botanical text-white font-extrabold py-3 rounded-full text-sm shadow-md transition-all">
                            Add To Cart &bull; ₹${product.price}.00
                        </button>
                        ${marketplacesFor(product).length > 0 ? `
                        <div class="flex flex-wrap gap-2 mt-3">
                            ${marketplaceButtonsMarkup(product, { size: 'lg' })}
                        </div>
                        <p class="text-[10px] text-gray-500 mt-2">Payment and delivery are handled by the marketplace you choose.</p>` : `
                        <p class="text-[10px] text-gray-500 mt-2">No marketplace link is set up for this herb yet, so there is nothing to buy from this page.</p>`}
                    </div>
                </div>
            `;

            modal.classList.remove('hidden');

            // Focus follows the dialog in, and goes back to the card that opened
            // it on close (Module 40).
            rememberTrigger('quickview');
            const panel = modal.querySelector('[role="dialog"]');
            if (panel) {
                panel.setAttribute('tabindex', '-1');
                panel.focus();
            }
        }

        function closeQuickView() {
            const modal = document.getElementById('quickview-modal');
            if (modal) modal.classList.add('hidden');
            restoreTrigger('quickview');
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

        function navigateTo(viewId) {
            const views = document.querySelectorAll('.view-section');
            views.forEach(v => v.classList.add('hidden'));

            if (viewId === 'home') {
                document.getElementById('home-view').classList.remove('hidden');
            } else if (viewId === 'shop') {
                document.getElementById('home-view').classList.remove('hidden');
                scrollToElement(document.getElementById('products-section'));
                renderProducts(products);
            } else if (viewId === 'ingredients') {
                document.getElementById('ingredients-view').classList.remove('hidden');
                renderIngredientsCatalogue();
            } else if (viewId === 'rituals') {
                document.getElementById('rituals-view').classList.remove('hidden');
                renderRituals();
            } else if (viewId === 'story') {
                document.getElementById('story-view').classList.remove('hidden');
            } else if (viewId === 'faq') {
                document.getElementById('home-view').classList.remove('hidden');
                scrollToElement(document.getElementById('faq-section'));
            }

            scrollToTop();
        }

        function filterCategoryAndNavigate(catName) {
            navigateTo('shop');
            const filtered = products.filter(p => p.category.toLowerCase() === catName.toLowerCase() || (catName === 'Herbal Powders' && p.category === 'Herbal Powders'));
            renderProducts(filtered.length > 0 ? filtered : products);
        }

        function filterTab(category, btnElement) {
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.className = "tab-btn bg-white hover:bg-brand-beige text-brand-forest font-bold px-5 py-2 rounded-full text-xs sm:text-sm whitespace-nowrap transition-all border border-brand-sandDark/80";
            });
            btnElement.className = "tab-btn bg-brand-forest text-white font-bold px-5 py-2 rounded-full text-xs sm:text-sm whitespace-nowrap shadow-sm transition-all";

            if (category === 'All Products') {
                renderProducts(products);
            } else {
                const filtered = products.filter(p => p.category === category);
                renderProducts(filtered);
            }
        }

        /**
         * The buy step of the basket (Module 22).
         *
         * There is no checkout and no payment on this website, so instead of
         * promising one, the basket hands the customer to the marketplace the
         * owner configured for each product.
         */
        function triggerCheckout() {
            if (cart.length === 0) {
                showToast('Your herbal basket is empty. Please add items!');
                return;
            }

            const withLinks = cart
                .map(item => ({ item, links: marketplacesFor(item) }))
                .filter(entry => entry.links.length > 0);

            if (withLinks.length === 0) {
                showToast('Buying happens on the marketplace: no purchase links are configured yet.');
                return;
            }

            renderBasketMarketplaceLinks(withLinks);
        }

        /** Lists the marketplace links for the basket inside the drawer. */
        function renderBasketMarketplaceLinks(entries) {
            const host = document.getElementById('cart-marketplace-links');

            if (!host) return;

            host.innerHTML = `
                <p class="text-[11px] font-bold text-brand-forest mb-2">Continue on the marketplace</p>
                ${entries.map(({ item, links }) => `
                    <div class="flex items-center justify-between gap-2 text-xs py-1">
                        <span class="text-gray-600 truncate">${item.name} &times; ${item.quantity}</span>
                        <span class="flex gap-2">${links.map(link => `
                            <a href="${link.url}" target="_blank" rel="noopener noreferrer nofollow"
                               class="font-bold text-brand-forest underline hover:text-brand-botanicalDark">${link.label}</a>`).join('')}
                        </span>
                    </div>`).join('')}
                <p class="text-[10px] text-gray-500 mt-2">Payment, delivery, and returns are handled by the marketplace. HerbalVan takes no payment on this website.</p>`;

            host.classList.remove('hidden');
        }

        function openAccountModal() {
            // There is no account system, and there is not going to be one: the
            // site has no login, no orders, and no customer records. The icon is
            // part of the approved design, so it stays and says so plainly rather
            // than promising a login that does not exist.
            showToast('HerbalVan has no account system — buying happens on the marketplace.');
        }

        function showToast(message) {
            const toast = document.createElement('div');
            toast.className = "fixed bottom-6 right-6 bg-brand-forest text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-2 animate-bounce border border-brand-botanical/40";
            toast.innerHTML = `<i class="fa-solid fa-leaf text-brand-cream" aria-hidden="true"></i> ${message}`;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
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
            navigate: (element) => navigateTo(element.dataset.target),
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
            'close-quick-view': () => closeQuickView(),
            'basket-to-marketplace': () => triggerCheckout(),
            'open-account': () => openAccountModal(),
            'dismiss-announcement': () => {
                const bar = document.getElementById('announcement-bar');
                if (bar) bar.remove();
            },
            'filter-category': (element) => filterCategoryAndNavigate(element.dataset.category),
            // The "All Products" tab carries an empty category, so it is the
            // absence of a value that means "everything" — the same default the
            // per-button listener used to apply.
            'filter-tab': (element) => filterTab(element.dataset.category || 'All Products', element),
            'quick-search': (element) => quickSearch(element.dataset.query),
            toast: (element) => showToast(element.dataset.message),
            'open-quick-view': (element) => openQuickView(actionProductId(element)),
            'add-to-cart': (element) => {
                const id = actionProductId(element);
                if (id === null) return;

                addToCart(id);

                if (element.dataset.closeQuickView === 'true') closeQuickView();
            },
            'cart-increase': (element) => updateCartQuantity(actionProductId(element), 1),
            'cart-decrease': (element) => updateCartQuantity(actionProductId(element), -1),
            'toggle-faq': (element) => toggleFAQ(element)
        };

        document.addEventListener('click', (event) => {
            const element = event.target.closest('[data-action]');
            if (!element) return;

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

        /** The newsletter form has no server: it acknowledges and stops there. */
        const newsletterForm = document.getElementById('newsletter-form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', (event) => {
                event.preventDefault();
                showToast('Thank you for subscribing to HerbalVan!');
            });
        }

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
                    renderPolicies();
                    renderRituals();
                    updateCartUI();
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
            'data/faqs.json',
            'data/policies.json'
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

            const [settingsFile, categoriesFile, productsFile, bestSellerFile, reviewsFile, faqsFile, policiesFile] = payloads;

            siteSettings = settingsFile.item || {};
            categories = categoriesFile.items || [];
            products = productsFile.items || [];
            bestSeller = bestSellerFile.item || null;
            reviews = reviewsFile.items || [];
            faqs = faqsFile.items || [];
            policies = policiesFile.items || [];

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
            // Shop tabs
            const tabs = document.querySelector('[data-category-tabs]');

            if (tabs) {
                const activeClass = "tab-btn bg-brand-forest text-white font-bold px-5 py-2 rounded-full text-xs sm:text-sm whitespace-nowrap shadow-sm transition-all";
                const idleClass = "tab-btn bg-white hover:bg-brand-beige text-brand-forest font-bold px-5 py-2 rounded-full text-xs sm:text-sm whitespace-nowrap transition-all border border-brand-sandDark/80";

                // The generated tabs carry the same `data-action="filter-tab"` as
                // the ones already in the markup, so one delegated listener serves
                // both — including the tabs that are still on the page before this
                // script runs, and if the data never loads at all.
                tabs.innerHTML = `<button type="button" class="${activeClass}" data-action="filter-tab" data-category="">All Products</button>`;

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

            // Desktop navigation
            replaceCategoryItems('[data-category-nav]', category => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'nav-link hover:text-brand-botanicalDark transition-colors';
                button.textContent = category.name;
                button.addEventListener('click', () => filterCategoryAndNavigate(category.name));
                return button;
            });

            // Mobile menu
            replaceCategoryItems('[data-category-mobile]', category => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'text-left text-gray-600 pl-4 hover:text-brand-botanicalDark';
                button.textContent = `• ${category.name}`;
                button.addEventListener('click', () => {
                    filterCategoryAndNavigate(category.name);
                    toggleMobileMenu();
                });
                return button;
            });

            // Footer shop column
            replaceCategoryItems('[data-category-footer]', category => {
                const item = document.createElement('li');
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'hover:text-brand-cream transition-colors';
                button.textContent = category.name;
                button.addEventListener('click', () => filterCategoryAndNavigate(category.name));
                item.appendChild(button);
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
            setText('[data-best-seller-price]', `₹${bestSeller.price}.00`);
            setText('[data-best-seller-weight]', bestSeller.weight ? `${bestSeller.weight} Pure Herb` : null);

            const addButton = host.querySelector('[data-best-seller-add]');

            if (addButton) {
                addButton.setAttribute('data-action', 'add-to-cart');
                addButton.setAttribute('data-product-id', String(bestSeller.id));
                addButton.setAttribute('aria-label', `Add ${bestSeller.name} to cart`);
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
                    ? `<button type="button" data-action="open-quick-view" data-product-id="${product.id}" class="hover:text-brand-botanicalDark transition-colors">${product.name}</button>`
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

        /**
         * Policy pages (Module 21).
         *
         * Only published policies are linked. An unpublished policy has nothing
         * to show, so its link is removed instead of opening a placeholder.
         */
        function renderPolicies() {
            const section = document.getElementById('policy-view');
            const body = document.querySelector('[data-policy-body]');
            const title = document.querySelector('[data-policy-title]');
            const meta = document.querySelector('[data-policy-meta]');

            const links = {
                privacy: 'Privacy Policy',
                terms: 'Terms & Conditions',
                refund: 'Refund Policy',
                shipping: 'Shipping Policy'
            };

            document.querySelectorAll('[data-policy-link]').forEach(link => {
                const type = link.dataset.policyLink;
                const published = policies.find(policy => policy.type === type);

                if (!published) {
                    link.remove();
                    return;
                }

                link.removeAttribute('onclick');
                link.setAttribute('href', '#');
                link.addEventListener('click', (event) => {
                    event.preventDefault();
                    openPolicy(type);
                });
            });

            function openPolicy(type) {
                const policy = policies.find(row => row.type === type);

                if (!section || !body || !policy) return;

                title.textContent = policy.title || links[type] || 'Policy';
                meta.textContent = `Version ${policy.version} · updated ${String(policy.updatedAt || '').slice(0, 10)}`;
                body.innerHTML = policy.content || '';

                document.querySelectorAll('.view-section').forEach(view => view.classList.add('hidden'));
                section.classList.remove('hidden');
                scrollToTop();
            }

            // The generated content is stored HTML sanitized by the CMS.
            window.openPolicy = openPolicy;
        }

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
