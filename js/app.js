(function () {
    var $ = function (id) { return document.getElementById(id); };
    var app = $('app');

    var presets = Settings.loadPresets();
    var appSettings = Settings.loadAppSettings();
    var editingPresetId = null;

    var screens = {
        dashboard: $('screen-dashboard'),
        timer: $('screen-timer'),
        presetEdit: $('screen-preset-edit'),
        settings: $('screen-settings')
    };

    var els = {
        dashDate: $('dash-date'),
        dashTime: $('dash-time'),
        scheduleBadge: $('schedule-badge'),
        scheduleText: $('schedule-text'),
        presetList: $('preset-list'),
        btnAddPreset: $('btn-add-preset'),
        btnAppSettings: $('btn-app-settings'),
        btnBack: $('btn-back'),
        timerPresetName: $('timer-preset-name'),
        statusLabel: $('status-label'),
        countdown: $('countdown'),
        timerBarFill: $('timer-bar-fill'),
        timerBarElapsed: $('timer-bar-elapsed'),
        timerBarTotal: $('timer-bar-total'),
        btnReset: $('btn-reset'),
        btnStart: $('btn-start'),
        presetEditTitle: $('preset-edit-title'),
        peName: $('pe-name'),
        peRoundMin: $('pe-round-min'),
        peRoundSec: $('pe-round-sec'),
        peRestMin: $('pe-rest-min'),
        peRestSec: $('pe-rest-sec'),
        peRounds: $('pe-rounds'),
        peWarning: $('pe-warning'),
        btnDeletePreset: $('btn-delete-preset'),
        btnSavePreset: $('btn-save-preset'),
        asEnabled: $('as-enabled'),
        asStart: $('as-start'),
        asEnd: $('as-end'),
        asSound: $('as-sound'),
        asVolume: $('as-volume'),
        asVibrate: $('as-vibrate'),
        btnTestSound: $('btn-test-sound'),
        btnSaveAppSettings: $('btn-save-app-settings')
    };

    function showScreen(name) {
        Object.keys(screens).forEach(function (k) {
            screens[k].classList.remove('active');
        });
        screens[name].classList.add('active');
    }

    // ── Clock ──
    function updateClock() {
        var now = new Date();
        var days = ['일', '월', '화', '수', '목', '금', '토'];
        els.dashDate.textContent =
            now.getFullYear() + '.' +
            (now.getMonth() + 1 < 10 ? '0' : '') + (now.getMonth() + 1) + '.' +
            (now.getDate() < 10 ? '0' : '') + now.getDate() +
            ' ' + days[now.getDay()] + '요일';

        var h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
        els.dashTime.textContent =
            (h < 10 ? '0' : '') + h + ':' +
            (m < 10 ? '0' : '') + m + ':' +
            (s < 10 ? '0' : '') + s;

        if (appSettings.scheduleEnabled) {
            els.scheduleBadge.classList.remove('hidden');
            var cur = h * 60 + m;
            var sp = appSettings.scheduleStart.split(':');
            var ep = appSettings.scheduleEnd.split(':');
            var sm = parseInt(sp[0]) * 60 + parseInt(sp[1]);
            var em = parseInt(ep[0]) * 60 + parseInt(ep[1]);
            var active = sm <= em ? (cur >= sm && cur < em) : (cur >= sm || cur < em);
            els.scheduleText.textContent =
                appSettings.scheduleStart + ' ~ ' + appSettings.scheduleEnd +
                (active ? '  운영중' : '  대기중');
        } else {
            els.scheduleBadge.classList.add('hidden');
        }
    }

    // ── Presets ──
    function renderPresets() {
        els.presetList.innerHTML = '';
        presets.forEach(function (p) {
            var card = document.createElement('div');
            card.className = 'preset-card';

            var icon = document.createElement('div');
            icon.className = 'preset-icon';
            icon.textContent = '▶';

            var info = document.createElement('div');
            info.className = 'preset-info';
            var nm = document.createElement('div');
            nm.className = 'preset-name';
            nm.textContent = p.name;
            var dt = document.createElement('div');
            dt.className = 'preset-detail';
            dt.textContent = Settings.formatPresetDetail(p);
            info.appendChild(nm);
            info.appendChild(dt);

            var editBtn = document.createElement('button');
            editBtn.className = 'preset-edit-btn';
            editBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
            editBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                openPresetEdit(p);
            });

            card.appendChild(icon);
            card.appendChild(info);
            card.appendChild(editBtn);

            card.addEventListener('click', function () {
                Sound.unlock();
                startTimer(p);
            });

            els.presetList.appendChild(card);
        });
    }

    // ── Timer ──
    function startTimer(preset) {
        els.timerPresetName.textContent = preset.name;
        els.timerBarTotal.textContent = formatTime(Settings.getRoundMs(preset));
        Timer.configure(preset);
        showScreen('timer');
        Bridge.keepScreenOn(true);
    }

    function formatTime(ms) {
        var totalSec = Math.ceil(ms / 1000);
        var min = Math.floor(totalSec / 60);
        var sec = totalSec % 60;
        return min + ':' + (sec < 10 ? '0' : '') + sec;
    }

    function updateTimerDisplay(status) {
        els.countdown.textContent = formatTime(status.remainingMs);
        els.timerBarFill.style.width = (status.progress * 100) + '%';

        var elapsed = status.totalMs - status.remainingMs;
        els.timerBarElapsed.textContent = formatTime(elapsed);
        els.timerBarTotal.textContent = formatTime(status.totalMs);

        var cls = status.state;
        if (status.isWarning) cls = 'warning';
        if (status.state === Timer.State.PAUSED) cls = 'paused';
        app.className = cls ? 'state-' + cls : '';

        var labels = {
            idle: '준비',
            running: '스파링',
            paused: '일시정지',
            resting: '휴식',
            finished: '종료'
        };
        els.statusLabel.textContent = status.isWarning ? '경고' : (labels[status.state] || '');

        var btnLabels = { idle: '시작', finished: '시작', paused: '계속' };
        els.btnStart.textContent = btnLabels[status.state] || '정지';
    }

    Timer.on('update', updateTimerDisplay);

    Timer.on('roundStart', function () {
        if (appSettings.soundOn) Sound.playBell();
        if (appSettings.vibrateOn) Bridge.vibrate(300);
    });
    Timer.on('restStart', function () {
        if (appSettings.soundOn) Sound.playRoundEnd();
        if (appSettings.vibrateOn) Bridge.vibrate([200, 100, 200]);
    });
    Timer.on('warning', function () {
        if (appSettings.soundOn) Sound.playWarning();
        if (appSettings.vibrateOn) Bridge.vibrate(100);
    });
    Timer.on('finish', function () {
        if (appSettings.soundOn) Sound.playFinish();
        if (appSettings.vibrateOn) Bridge.vibrate([300, 100, 300, 100, 500]);
        setTimeout(function () { Bridge.keepScreenOn(false); }, 5000);
    });

    els.btnStart.addEventListener('click', function () {
        Sound.unlock();
        var s = Timer.getState();
        if (s === Timer.State.RUNNING || s === Timer.State.RESTING) Timer.pause();
        else Timer.start();
    });

    els.btnReset.addEventListener('click', function () { Timer.reset(); });

    els.btnBack.addEventListener('click', function () {
        Timer.reset();
        Bridge.keepScreenOn(false);
        app.className = '';
        showScreen('dashboard');
    });

    // ── Preset Edit ──
    function openPresetEdit(preset) {
        if (preset) {
            editingPresetId = preset.id;
            els.presetEditTitle.textContent = '프리셋 수정';
            els.peName.value = preset.name;
            els.peRoundMin.value = preset.roundMin;
            els.peRoundSec.value = preset.roundSec;
            els.peRestMin.value = preset.restMin;
            els.peRestSec.value = preset.restSec;
            els.peRounds.value = preset.rounds;
            els.peWarning.value = preset.warningSec;
            els.btnDeletePreset.classList.remove('hidden');
        } else {
            editingPresetId = null;
            els.presetEditTitle.textContent = '프리셋 추가';
            els.peName.value = '';
            els.peRoundMin.value = 5;
            els.peRoundSec.value = 0;
            els.peRestMin.value = 1;
            els.peRestSec.value = 0;
            els.peRounds.value = 5;
            els.peWarning.value = 10;
            els.btnDeletePreset.classList.add('hidden');
        }
        showScreen('presetEdit');
    }

    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

    els.btnSavePreset.addEventListener('click', function () {
        var p = {
            id: editingPresetId || Settings.generateId(),
            name: els.peName.value.trim() || '프리셋',
            roundMin: clamp(parseInt(els.peRoundMin.value) || 0, 0, 99),
            roundSec: clamp(parseInt(els.peRoundSec.value) || 0, 0, 59),
            restMin: clamp(parseInt(els.peRestMin.value) || 0, 0, 99),
            restSec: clamp(parseInt(els.peRestSec.value) || 0, 0, 59),
            rounds: clamp(parseInt(els.peRounds.value) || 1, 1, 99),
            warningSec: clamp(parseInt(els.peWarning.value) || 0, 0, 60)
        };
        if (editingPresetId) {
            var idx = presets.findIndex(function (x) { return x.id === editingPresetId; });
            if (idx >= 0) presets[idx] = p;
        } else {
            presets.push(p);
        }
        Settings.savePresets(presets);
        renderPresets();
        showScreen('dashboard');
    });

    els.btnDeletePreset.addEventListener('click', function () {
        if (!editingPresetId) return;
        presets = presets.filter(function (x) { return x.id !== editingPresetId; });
        Settings.savePresets(presets);
        renderPresets();
        showScreen('dashboard');
    });

    els.btnAddPreset.addEventListener('click', function () { openPresetEdit(null); });

    // ── App Settings ──
    els.btnAppSettings.addEventListener('click', function () {
        els.asEnabled.checked = appSettings.scheduleEnabled;
        els.asStart.value = appSettings.scheduleStart;
        els.asEnd.value = appSettings.scheduleEnd;
        els.asSound.checked = appSettings.soundOn;
        els.asVolume.value = appSettings.volume;
        els.asVibrate.checked = appSettings.vibrateOn;
        showScreen('settings');
    });

    els.btnSaveAppSettings.addEventListener('click', function () {
        appSettings = {
            scheduleEnabled: els.asEnabled.checked,
            scheduleStart: els.asStart.value || '18:00',
            scheduleEnd: els.asEnd.value || '22:00',
            soundOn: els.asSound.checked,
            volume: parseInt(els.asVolume.value) || 80,
            vibrateOn: els.asVibrate.checked
        };
        Settings.saveAppSettings(appSettings);
        Sound.setVolume(appSettings.volume);
        showScreen('dashboard');
    });

    els.btnTestSound.addEventListener('click', function () {
        Sound.unlock();
        Sound.setVolume(parseInt(els.asVolume.value) || 80);
        Sound.playBell();
    });

    // ── Close & Stepper buttons ──
    document.querySelectorAll('[data-close]').forEach(function (btn) {
        btn.addEventListener('click', function () { showScreen('dashboard'); });
    });

    document.querySelectorAll('.stepper-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var t = $(btn.dataset.target);
            var d = parseInt(btn.dataset.delta);
            t.value = clamp((parseInt(t.value) || 0) + d, parseInt(t.min) || 0, parseInt(t.max) || 99);
        });
    });

    // ── Init ──
    Sound.setVolume(appSettings.volume);
    renderPresets();
    updateClock();
    setInterval(updateClock, 1000);
})();
