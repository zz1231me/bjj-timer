var Bridge = (function () {
    var wakeLockSentinel = null;

    function isAndroidWebView() {
        return typeof window.AndroidBridge !== 'undefined';
    }

    function keepScreenOn(on) {
        if (isAndroidWebView()) {
            window.AndroidBridge.keepScreenOn(on);
            return;
        }
        if (on) {
            requestWebWakeLock();
        } else {
            releaseWebWakeLock();
        }
    }

    function requestWebWakeLock() {
        if (!('wakeLock' in navigator)) return;
        navigator.wakeLock.request('screen').then(function (sentinel) {
            wakeLockSentinel = sentinel;
            sentinel.addEventListener('release', function () {
                wakeLockSentinel = null;
            });
        }).catch(function () { /* ignore */ });
    }

    function releaseWebWakeLock() {
        if (wakeLockSentinel) {
            wakeLockSentinel.release();
            wakeLockSentinel = null;
        }
    }

    function setFullscreen(on) {
        if (isAndroidWebView()) {
            window.AndroidBridge.setFullscreen(on);
            return;
        }
        if (on) {
            var el = document.documentElement;
            var rfs = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen;
            if (rfs) rfs.call(el);
        } else {
            var efs = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen;
            if (efs) efs.call(document);
        }
    }

    function vibrate(ms) {
        if (isAndroidWebView()) {
            window.AndroidBridge.vibrate(ms);
            return;
        }
        if (navigator.vibrate) {
            navigator.vibrate(ms);
        }
    }

    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible' && wakeLockSentinel === null) {
            requestWebWakeLock();
        }
    });

    return {
        isAndroidWebView: isAndroidWebView,
        keepScreenOn: keepScreenOn,
        setFullscreen: setFullscreen,
        vibrate: vibrate
    };
})();
