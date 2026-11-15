var Settings = (function () {
    var STORAGE_KEY = 'bjj-timer-settings';

    var defaults = {
        roundMin: 5,
        roundSec: 0,
        restMin: 1,
        restSec: 0,
        rounds: 5,
        warningSec: 10,
        soundOn: true,
        vibrateOn: true
    };

    function load() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                var saved = JSON.parse(raw);
                var merged = {};
                for (var k in defaults) {
                    merged[k] = saved.hasOwnProperty(k) ? saved[k] : defaults[k];
                }
                return merged;
            }
        } catch (e) { /* ignore */ }
        return Object.assign({}, defaults);
    }

    function save(settings) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (e) { /* ignore */ }
    }

    function getRoundMs(s) {
        return (s.roundMin * 60 + s.roundSec) * 1000;
    }

    function getRestMs(s) {
        return (s.restMin * 60 + s.restSec) * 1000;
    }

    function getWarningMs(s) {
        return s.warningSec * 1000;
    }

    return {
        defaults: defaults,
        load: load,
        save: save,
        getRoundMs: getRoundMs,
        getRestMs: getRestMs,
        getWarningMs: getWarningMs
    };
})();
