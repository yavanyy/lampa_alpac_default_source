/**
 * Lampa macOS Trackpad Navigation
 * Version: 1.0.0
 *
 * Converts horizontal two-finger trackpad gestures into Lampa
 * controller commands: left / right.
 *
 * Vertical scrolling remains unchanged.
 */
(function () {
    'use strict';

    var FLAG = '__lampaMacTrackpadNavigation';
    var THRESHOLD = 45;
    var AXIS_RATIO = 1.15;
    var GESTURE_END_DELAY = 180;

    if (window[FLAG]) return;
    window[FLAG] = true;

    var accumulatedX = 0;
    var gestureTriggered = false;
    var gestureTimer = null;

    function resetGesture() {
        accumulatedX = 0;
        gestureTriggered = false;
        gestureTimer = null;
    }

    function isEditableTarget(target) {
        if (!target || !target.closest) return false;

        return Boolean(
            target.closest(
                'input, textarea, select, [contenteditable="true"], .simple-keyboard'
            )
        );
    }

    function isHorizontalGesture(event) {
        var x = Number(event.deltaX) || 0;
        var y = Number(event.deltaY) || 0;

        // Pinch-to-zoom on macOS is commonly exposed as Ctrl + wheel.
        if (event.ctrlKey) return false;

        return (
            Math.abs(x) >= 2 &&
            Math.abs(x) > Math.abs(y) * AXIS_RATIO
        );
    }

    function moveLampa(direction) {
        try {
            if (
                window.Lampa &&
                Lampa.Controller &&
                typeof Lampa.Controller.move === 'function'
            ) {
                Lampa.Controller.move(direction);
                return true;
            }
        } catch (error) {
            console.error('[Lampa macOS Trackpad] Controller error:', error);
        }

        // Fallback for builds where the public Controller object is unavailable.
        try {
            var key = direction === 'right' ? 'ArrowRight' : 'ArrowLeft';

            document.dispatchEvent(
                new KeyboardEvent('keydown', {
                    key: key,
                    code: key,
                    bubbles: true,
                    cancelable: true
                })
            );

            document.dispatchEvent(
                new KeyboardEvent('keyup', {
                    key: key,
                    code: key,
                    bubbles: true,
                    cancelable: true
                })
            );

            return true;
        } catch (error) {
            console.error('[Lampa macOS Trackpad] Keyboard fallback error:', error);
        }

        return false;
    }

    function onWheel(event) {
        if (isEditableTarget(event.target)) return;
        if (!isHorizontalGesture(event)) return;

        // Stop Lampa's built-in wheel handler from treating a horizontal
        // trackpad gesture as vertical scrolling.
        event.preventDefault();
        event.stopPropagation();

        if (typeof event.stopImmediatePropagation === 'function') {
            event.stopImmediatePropagation();
        }

        accumulatedX += Number(event.deltaX) || 0;

        if (gestureTimer) clearTimeout(gestureTimer);
        gestureTimer = setTimeout(resetGesture, GESTURE_END_DELAY);

        // One navigation step per physical swipe. Momentum events from the
        // MacBook trackpad are ignored until the gesture has ended.
        if (
            !gestureTriggered &&
            Math.abs(accumulatedX) >= THRESHOLD
        ) {
            gestureTriggered = true;

            // Positive deltaX means scrolling toward content on the right.
            moveLampa(accumulatedX > 0 ? 'right' : 'left');
        }
    }

    document.addEventListener('wheel', onWheel, {
        capture: true,
        passive: false
    });

    console.log('[Lampa macOS Trackpad] Plugin started, version 1.0.0');
})();
