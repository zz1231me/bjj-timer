var Settings = (function () {
    var PRESETS_KEY = 'bjj-presets';
    var APP_KEY = 'bjj-app-settings';

    var defaultPresets = [
        { id: 'p1', name: '기본 스파링', roundMin: 5, roundSec: 0, restMin: 1, restSec: 0, warningSec: 10 },
        { id: 'p2', name: '짧은 스파링', roundMin: 4, roundSec: 0, restMin: 2, restSec: 0, warningSec: 10 },
        { id: 'p3', name: '롱 스파링', roundMin: 7, roundSec: 0, restMin: 1, restSec: 0, warningSec: 15 }
    ];

    var defaultAppSettings = {
        scheduleEnabled: false,
        scheduleStart: '18:00',
        scheduleEnd: '22:00',
        soundOn: true,
        volume: 80,
        vibrateOn: true,
        bellType: 1
    };

    function loadPresets() {
        try {
            var raw = localStorage.getItem(PRESETS_KEY);
            if (raw) {
                var parsed = JSON.parse(raw);
                return parsed.map(function (p) {
                    delete p.rounds;
                    return p;
                });
            }
        } catch (e) {}
        return defaultPresets.map(function (p) { return Object.assign({}, p); });
    }

    function savePresets(presets) {
        try { localStorage.setItem(PRESETS_KEY, JSON.stringify(presets)); } catch (e) {}
    }

    function loadAppSettings() {
        try {
            var raw = localStorage.getItem(APP_KEY);
            if (raw) {
                var saved = JSON.parse(raw);
                var merged = {};
                for (var k in defaultAppSettings) {
                    merged[k] = saved.hasOwnProperty(k) ? saved[k] : defaultAppSettings[k];
                }
                return merged;
            }
        } catch (e) {}
        return Object.assign({}, defaultAppSettings);
    }

    function saveAppSettings(s) {
        try { localStorage.setItem(APP_KEY, JSON.stringify(s)); } catch (e) {}
    }

    function generateId() {
        return 'p' + Date.now().toString(36);
    }

    function getRoundMs(preset) {
        return (preset.roundMin * 60 + preset.roundSec) * 1000;
    }

    function getRestMs(preset) {
        return (preset.restMin * 60 + preset.restSec) * 1000;
    }

    function getWarningMs(preset) {
        return preset.warningSec * 1000;
    }

    function formatPresetDetail(p) {
        var round = p.roundMin + '분';
        if (p.roundSec > 0) round += p.roundSec + '초';
        var rest = p.restMin + '분';
        if (p.restSec > 0) rest += p.restSec + '초';
        return '스파링 ' + round + '  ·  대기 ' + rest;
    }

    return {
        loadPresets: loadPresets,
        savePresets: savePresets,
        loadAppSettings: loadAppSettings,
        saveAppSettings: saveAppSettings,
        generateId: generateId,
        getRoundMs: getRoundMs,
        getRestMs: getRestMs,
        getWarningMs: getWarningMs,
        formatPresetDetail: formatPresetDetail
    };
})();
