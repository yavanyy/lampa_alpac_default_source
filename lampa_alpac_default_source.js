/**
 * Lampa: Alpac as default source
 * Automatically selects "Alpac Онлайн" when the main Watch button
 * opens Lampa's source selection dialog.
 *
 * Version: 1.0.0
 */
(function () {
    'use strict';

    var PLUGIN_FLAG = 'alpac_default_source_plugin';

    function normalize(value) {
        return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
    }

    function isAlpacItem(item) {
        if (!item) return false;

        var text = normalize(item.title) + ' ' + normalize(item.subtitle);

        // `btn` is present on entries in the main card's "Source" selector.
        // This avoids interfering with Alpac's internal balancer/translation menus.
        return Boolean(item.btn) && text.indexOf('alpac') !== -1;
    }

    function startPlugin() {
        if (window[PLUGIN_FLAG]) return;

        if (
            !window.Lampa ||
            !Lampa.Select ||
            typeof Lampa.Select.show !== 'function'
        ) {
            setTimeout(startPlugin, 250);
            return;
        }

        window[PLUGIN_FLAG] = true;

        var originalShow = Lampa.Select.show;

        Lampa.Select.show = function (params) {
            try {
                var items = params && Array.isArray(params.items) ? params.items : [];
                var alpac = items.find(isAlpacItem);

                if (
                    alpac &&
                    typeof params.onSelect === 'function'
                ) {
                    // Run outside the current event stack so the Watch-button
                    // handler can finish cleanly.
                    setTimeout(function () {
                        try {
                            params.onSelect(alpac);
                        } catch (error) {
                            console.error('[Alpac default source] Selection failed:', error);
                            originalShow.call(Lampa.Select, params);
                        }
                    }, 0);

                    return;
                }
            } catch (error) {
                console.error('[Alpac default source] Intercept failed:', error);
            }

            return originalShow.apply(this, arguments);
        };

        console.log('[Alpac default source] Plugin started');
    }

    startPlugin();
})();
