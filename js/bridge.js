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
            if (Array.isArray(ms)) {
                window.AndroidBridge.vibratePattern(ms.join(','));
            } else {
                window.AndroidBridge.vibrate(ms);
            }
            return;
        }
        if (navigator.vibrate) {
            navigator.vibrate(ms);
        }
    }

    function requestAudioFocus() {
        if (isAndroidWebView()) {
            try { return window.AndroidBridge.requestAudioFocus(); } catch (e) {}
        }
        return false;
    }

    function abandonAudioFocus() {
        if (isAndroidWebView()) {
            try { window.AndroidBridge.abandonAudioFocus(); } catch (e) {}
        }
    }

    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible' && wakeLockSentinel === null) {
            requestWebWakeLock();
        }
    });

    function setDeviceVolume(percent) {
        if (isAndroidWebView()) {
            try {
                var max = window.AndroidBridge.getMaxVolume();
                var level = Math.round(max * percent / 100);
                window.AndroidBridge.setVolume(level);
            } catch (e) {}
        }
    }

    function screenOff() {
        if (isAndroidWebView()) {
            try { window.AndroidBridge.screenOff(); } catch (e) {}
        }
    }

    function setMusicVolume(percent) {
        if (isAndroidWebView()) {
            try { window.AndroidBridge.setMusicVolumePercent(percent); } catch (e) {}
        }
    }

    function boostForBell() {
        if (isAndroidWebView()) {
            try { window.AndroidBridge.boostForBell(); } catch (e) {}
        }
    }

    function reduceMusicAfterBell() {
        if (isAndroidWebView()) {
            try { window.AndroidBridge.reduceMusicAfterBell(); } catch (e) {}
        }
    }

    function getDeviceVolume() {
        if (isAndroidWebView()) {
            try {
                var cur = window.AndroidBridge.getVolume();
                var max = window.AndroidBridge.getMaxVolume();
                return max > 0 ? Math.round(cur * 100 / max) : 80;
            } catch (e) {}
        }
        return -1;
    }

    return {
        isAndroidWebView: isAndroidWebView,
        keepScreenOn: keepScreenOn,
        screenOff: screenOff,
        setMusicVolume: setMusicVolume,
        boostForBell: boostForBell,
        reduceMusicAfterBell: reduceMusicAfterBell,
        setFullscreen: setFullscreen,
        vibrate: vibrate,
        requestAudioFocus: requestAudioFocus,
        abandonAudioFocus: abandonAudioFocus,
        setDeviceVolume: setDeviceVolume,
        getDeviceVolume: getDeviceVolume
    };
})();
