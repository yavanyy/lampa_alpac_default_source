/**
 * Lampa — Alpac default source
 * Version 2.0.0
 *
 * Automatically opens the Alpac source when the main Watch button
 * would otherwise show Lampa's "Source" selection menu.
 *
 * Designed to survive late initialization/replacement of Lampa.Select.show,
 * which can happen in desktop/Windows clients.
 */
(function () {
    'use strict';

    var PLUGIN_NAME = 'Alpac default source';
    var CHECK_INTERVAL = 750;

    function normalize(value) {
        return String(value == null ? '' : value)
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();
    }

    function safeCall(fn, fallback) {
        try {
            return fn();
        } catch (error) {
            return fallback;
        }
    }

    function buttonInfo(item) {
        var btn = item && item.btn;
        var parts = [
            item && item.title,
            item && item.subtitle
        ];

        if (btn) {
            parts.push(safeCall(function () { return btn.text(); }, ''));
            parts.push(safeCall(function () { return btn.attr('class'); }, ''));
            parts.push(safeCall(function () { return btn.data('subtitle'); }, ''));
            parts.push(safeCall(function () { return btn.prop('outerHTML'); }, ''));
        }

        return normalize(parts.join(' '));
    }

    function findAlpacItem(params) {
        var items = params && params.items;

        if (!items || typeof items.length !== 'number') return null;

        for (var i = 0; i < items.length; i++) {
            var item = items[i];

            // Entries in Lampa's main Source menu contain the original
            // source button in `item.btn`. Internal Alpac menus normally do not.
            if (item && item.btn && buttonInfo(item).indexOf('alpac') !== -1) {
                return item;
            }
        }

        return null;
    }

    function launchAlpac(item, params) {
        var btn = item && item.btn;

        // This is the same event Lampa itself triggers after selecting
        // a source from the Source menu.
        if (btn && typeof btn.trigger === 'function') {
            btn.trigger('hover:enter');
            return true;
        }

        if (params && typeof params.onSelect === 'function') {
            params.onSelect(item);
            return true;
        }

        return false;
    }

    function installHook() {
        if (!window.Lampa || !Lampa.Select || typeof Lampa.Select.show !== 'function') {
            return;
        }

        var currentShow = Lampa.Select.show;

        if (currentShow.__alpacDefaultSourceHook) {
            return;
        }

        function hookedShow(params) {
            try {
                var alpac = findAlpacItem(params);

                if (alpac) {
                    var originalThis = this;
                    var originalArguments = arguments;

                    setTimeout(function () {
                        try {
                            if (!launchAlpac(alpac, params)) {
                                currentShow.apply(originalThis, originalArguments);
                            }
                        } catch (error) {
                            console.error('[' + PLUGIN_NAME + '] Launch error:', error);
                            currentShow.apply(originalThis, originalArguments);
                        }
                    }, 0);

                    return;
                }
            } catch (error) {
                console.error('[' + PLUGIN_NAME + '] Hook error:', error);
            }

            return currentShow.apply(this, arguments);
        }

        hookedShow.__alpacDefaultSourceHook = true;
        hookedShow.__alpacDefaultSourceOriginal = currentShow;

        Lampa.Select.show = hookedShow;

        console.log('[' + PLUGIN_NAME + '] Select hook installed');
    }

    function start() {
        installHook();

        // Reinstall the hook if the desktop client or another plugin
        // replaces Lampa.Select.show after this plugin has loaded.
        setInterval(installHook, CHECK_INTERVAL);

        console.log('[' + PLUGIN_NAME + '] Plugin started, version 2.0.0');
    }

    start();
})();
