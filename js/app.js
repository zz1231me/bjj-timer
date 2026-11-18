(function () {
    var $ = function (id) { return document.getElementById(id); };
    var app = $('app');

    var presets = Settings.loadPresets();
    var appSettings = Settings.loadAppSettings();
    var editingPresetId = null;
    var lastTickSec = -1;
    var lastScreenOnState = null;
    var lastScheduleActive = false;

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
        countdown: $('countdown'),
        cdMinLine: $('cd-min-line'),
        cdSecLine: $('cd-sec-line'),
        timerBarFill: $('timer-bar-fill'),
        timerBarTopFill: $('timer-bar-top-fill'),
        timerBarElapsed: $('timer-bar-elapsed'),
        timerBarTotal: $('timer-bar-total'),
        btnReset: $('btn-reset'),
        btnStart: $('btn-start'),
        presetEditTitle: $('preset-edit-title'),
        peName: $('pe-name'),
        peRoundDisplay: $('pe-round-display'),
        peRestDisplay: $('pe-rest-display'),
        peWarningDisplay: $('pe-warning-display'),
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
        Object.keys(screens).forEach(function (k) { screens[k].classList.remove('active'); });
        screens[name].classList.add('active');
    }

    // ── Schedule / Screen ──
    function isScheduleActive() {
        if (!appSettings.scheduleEnabled) return false;
        var now = new Date();
        var cur = now.getHours() * 60 + now.getMinutes();
        var sp = appSettings.scheduleStart.split(':');
        var ep = appSettings.scheduleEnd.split(':');
        var sm = parseInt(sp[0]) * 60 + parseInt(sp[1]);
        var em = parseInt(ep[0]) * 60 + parseInt(ep[1]);
        return sm <= em ? (cur >= sm && cur < em) : (cur >= sm || cur < em);
    }

    function updateKeepScreenOn() {
        var timerOn = screens.timer.classList.contains('active');
        var scheduleNow = isScheduleActive();
        var shouldBeOn = timerOn || scheduleNow;

        if (lastScheduleActive && !scheduleNow && !timerOn) {
            Bridge.screenOff();
        }

        lastScheduleActive = scheduleNow;

        if (shouldBeOn !== lastScreenOnState) {
            lastScreenOnState = shouldBeOn;
            Bridge.keepScreenOn(shouldBeOn);
        }
    }

    // ── Clock ──
    function updateClock() {
        var now = new Date();
        var days = ['일', '월', '화', '수', '목', '금', '토'];
        els.dashDate.textContent =
            now.getFullYear() + '.' +
            String(now.getMonth() + 1).padStart(2, '0') + '.' +
            String(now.getDate()).padStart(2, '0') +
            ' ' + days[now.getDay()] + '요일';
        els.dashTime.textContent =
            String(now.getHours()).padStart(2, '0') + ':' +
            String(now.getMinutes()).padStart(2, '0') + ':' +
            String(now.getSeconds()).padStart(2, '0');

        if (appSettings.scheduleEnabled) {
            els.scheduleBadge.classList.remove('hidden');
            var active = isScheduleActive();
            els.scheduleText.textContent =
                appSettings.scheduleStart + ' ~ ' + appSettings.scheduleEnd +
                (active ? '  운영중' : '  대기중');
        } else {
            els.scheduleBadge.classList.add('hidden');
        }

        updateKeepScreenOn();
    }

    // ── Presets ──
    function renderPresets() {
        els.presetList.innerHTML = '';
        presets.forEach(function (p) {
            var card = document.createElement('div');
            card.className = 'preset-card';

            var accent = document.createElement('div');
            accent.className = 'preset-accent';

            var info = document.createElement('div');
            info.className = 'preset-info';

            var nm = document.createElement('div');
            nm.className = 'preset-name';
            nm.textContent = p.name;

            var times = document.createElement('div');
            times.className = 'preset-times';

            var roundMs = Settings.getRoundMs(p);
            var restMs = Settings.getRestMs(p);
            var roundLabel = document.createElement('span');
            roundLabel.className = 'preset-time preset-time-round';
            roundLabel.textContent = formatTagTime(roundMs);
            var sep = document.createElement('span');
            sep.className = 'preset-time-sep';
            sep.textContent = '/';
            var restLabel = document.createElement('span');
            restLabel.className = 'preset-time preset-time-rest';
            restLabel.textContent = formatTagTime(restMs);

            times.appendChild(roundLabel);
            times.appendChild(sep);
            times.appendChild(restLabel);
            info.appendChild(nm);
            info.appendChild(times);

            var editBtn = document.createElement('button');
            editBtn.className = 'preset-edit-btn';
            editBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>';
            editBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                openPresetEdit(p);
            });

            card.appendChild(accent);
            card.appendChild(info);
            card.appendChild(editBtn);
            card.addEventListener('click', function () {
                Sound.unlock();
                startTimer(p);
            });
            els.presetList.appendChild(card);
        });
    }

    function formatTagTime(ms) {
        var sec = Math.round(ms / 1000);
        var m = Math.floor(sec / 60);
        var s = sec % 60;
        if (m > 0 && s > 0) return m + 'm ' + s + 's';
        if (m > 0) return m + 'm';
        return s + 's';
    }

    // ── Timer ──
    function startTimer(preset) {
        els.timerPresetName.textContent = preset.name;
        lastTickSec = -1;
        Timer.configure(preset);
        showScreen('timer');
        updateKeepScreenOn();
        Sound.startKeepAlive();
    }

    function formatTime(ms) {
        var sec = Math.ceil(ms / 1000);
        var m = Math.floor(sec / 60);
        var s = sec % 60;
        return m + ':' + String(s).padStart(2, '0');
    }

    function updateTimerDisplay(status) {
        var sec = Math.ceil(status.remainingMs / 1000);
        var isRunning = status.state === Timer.State.RUNNING;
        var isResting = status.state === Timer.State.RESTING;
        var isActive = isRunning || isResting;
        var showBigSec = isActive && sec <= 60 && sec > 0;
        var isWarning = isRunning && sec <= status.warningSec && sec > 0;
        var isFinalTen = isActive && sec <= 10 && sec > 0;

        var m = Math.floor(sec / 60);
        var s = sec % 60;
        if (m > 0) {
            els.cdMinLine.innerHTML = m + '<span class="unit">m</span>';
            els.cdSecLine.textContent = String(s).padStart(2, '0');
            els.countdown.classList.add('two-line');
        } else {
            els.cdSecLine.textContent = sec > 0 ? sec : '0';
            els.countdown.classList.remove('two-line');
        }

        var pct = (status.progress * 100) + '%';
        els.timerBarFill.style.width = pct;
        if (els.timerBarTopFill) els.timerBarTopFill.style.width = pct;
        var elapsed = status.totalMs - status.remainingMs;
        els.timerBarElapsed.textContent = formatTime(elapsed);
        els.timerBarTotal.textContent = formatTime(status.totalMs);

        // 10초전 째깍 소리
        if (isFinalTen && sec !== lastTickSec) {
            lastTickSec = sec;
            if (appSettings.soundOn) Sound.playCountTick();
            if (appSettings.vibrateOn) Bridge.vibrate(30);
        }

        // 상태 클래스
        var cls = status.state;
        if (isWarning) cls = 'warning';
        else if (isResting && showBigSec) cls = 'resting-bigsec';
        else if (showBigSec) cls = 'bigsec';
        if (status.state === Timer.State.PAUSED) cls = 'paused';
        app.className = cls ? 'state-' + cls : '';

        // 상태 라벨 (제거됨, 색상으로 구분)

        // 버튼
        var btnLabels = { idle: '시작', paused: '계속' };
        els.btnStart.textContent = btnLabels[status.state] || '정지';
        els.btnReset.textContent = status.state === 'idle' ? '홈' : '리셋';
    }

    Timer.on('update', updateTimerDisplay);

    Timer.on('roundStart', function () {
        lastTickSec = -1;
        if (appSettings.soundOn) Sound.playRoundStart(appSettings.bellType);
        if (appSettings.vibrateOn) Bridge.vibrate(300);
    });
    Timer.on('restStart', function () {
        lastTickSec = -1;
        if (appSettings.soundOn) Sound.playRoundEnd(appSettings.bellType);
        if (appSettings.vibrateOn) Bridge.vibrate([200, 100, 200]);
    });

    els.btnStart.addEventListener('click', function () {
        Sound.unlock();
        var s = Timer.getState();
        if (s === Timer.State.RUNNING || s === Timer.State.RESTING) Timer.pause();
        else Timer.start();
    });

    els.btnReset.addEventListener('click', function () {
        var s = Timer.getState();
        if (s === Timer.State.IDLE) {
            Sound.stopKeepAlive();
            app.className = '';
            showScreen('dashboard');
            updateKeepScreenOn();
        } else {
            Timer.reset();
            lastTickSec = -1;
        }
    });

    // ── Preset Edit ──
    var editRoundSec = 300;
    var editRestSec = 60;
    var editWarningSec = 10;

    function formatTimeStepper(totalSec) {
        var m = Math.floor(totalSec / 60);
        var s = totalSec % 60;
        return m + ':' + String(s).padStart(2, '0');
    }

    function updateTimeDisplays() {
        els.peRoundDisplay.textContent = formatTimeStepper(editRoundSec);
        els.peRestDisplay.textContent = formatTimeStepper(editRestSec);
        els.peWarningDisplay.textContent = editWarningSec + '초';
    }

    function openPresetEdit(preset) {
        if (preset) {
            editingPresetId = preset.id;
            els.presetEditTitle.textContent = '프리셋 수정';
            els.peName.value = preset.name;
            editRoundSec = preset.roundMin * 60 + preset.roundSec;
            editRestSec = preset.restMin * 60 + preset.restSec;
            editWarningSec = preset.warningSec;
            els.btnDeletePreset.classList.remove('hidden');
        } else {
            editingPresetId = null;
            els.presetEditTitle.textContent = '프리셋 추가';
            els.peName.value = '';
            editRoundSec = 300;
            editRestSec = 60;
            editWarningSec = 10;
            els.btnDeletePreset.classList.add('hidden');
        }
        updateTimeDisplays();
        showScreen('presetEdit');
    }

    document.querySelectorAll('.ts-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var target = btn.dataset.ts;
            var delta = parseInt(btn.dataset.delta);
            if (target === 'round') {
                editRoundSec = Math.max(30, Math.min(5940, editRoundSec + delta));
            } else if (target === 'rest') {
                editRestSec = Math.max(0, Math.min(5940, editRestSec + delta));
            } else if (target === 'warning') {
                editWarningSec = Math.max(0, Math.min(60, editWarningSec + delta));
            }
            updateTimeDisplays();
        });
    });

    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

    els.btnSavePreset.addEventListener('click', function () {
        if (editRoundSec < 30) editRoundSec = 30;
        var p = {
            id: editingPresetId || Settings.generateId(),
            name: els.peName.value.trim() || '프리셋',
            roundMin: Math.floor(editRoundSec / 60),
            roundSec: editRoundSec % 60,
            restMin: Math.floor(editRestSec / 60),
            restSec: editRestSec % 60,
            warningSec: editWarningSec
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
    function getSelectedBellType() {
        var checked = document.querySelector('input[name="bell-type"]:checked');
        return checked ? parseInt(checked.value) : 1;
    }

    function setSelectedBellType(v) {
        var el = document.querySelector('input[name="bell-type"][value="' + v + '"]');
        if (el) el.checked = true;
    }

    function getSelectedBellDuration() {
        var checked = document.querySelector('input[name="bell-dur"]:checked');
        return checked ? parseInt(checked.value) : 1;
    }

    function setSelectedBellDuration(v) {
        var el = document.querySelector('input[name="bell-dur"][value="' + v + '"]');
        if (el) el.checked = true;
    }

    els.btnAppSettings.addEventListener('click', function () {
        els.asEnabled.checked = appSettings.scheduleEnabled;
        els.asStart.value = appSettings.scheduleStart;
        els.asEnd.value = appSettings.scheduleEnd;
        els.asSound.checked = appSettings.soundOn;
        els.asVolume.value = appSettings.volume;
        els.asVibrate.checked = appSettings.vibrateOn;
        setSelectedBellType(appSettings.bellType);
        setSelectedBellDuration(appSettings.bellDuration);
        showScreen('settings');
    });

    els.btnSaveAppSettings.addEventListener('click', function () {
        var vol = parseInt(els.asVolume.value) || 80;
        appSettings = {
            scheduleEnabled: els.asEnabled.checked,
            scheduleStart: els.asStart.value || '18:00',
            scheduleEnd: els.asEnd.value || '22:00',
            soundOn: els.asSound.checked,
            volume: vol,
            vibrateOn: els.asVibrate.checked,
            bellType: getSelectedBellType(),
            bellDuration: getSelectedBellDuration()
        };
        Settings.saveAppSettings(appSettings);
        Sound.setVolume(vol);
        Sound.setBellDuration(appSettings.bellDuration);
        showScreen('dashboard');
    });

    els.btnTestSound.addEventListener('click', function () {
        Sound.unlock();
        Sound.setVolume(parseInt(els.asVolume.value) || 100);
        Sound.setBellDuration(getSelectedBellDuration());
        Sound.playBell(getSelectedBellType());
    });

    document.querySelectorAll('input[name="bell-type"]').forEach(function (radio) {
        radio.addEventListener('change', function () {
            Sound.unlock();
            Sound.setVolume(parseInt(els.asVolume.value) || 100);
            Sound.setBellDuration(getSelectedBellDuration());
            Sound.playBell(parseInt(this.value));
        });
    });

    document.querySelectorAll('input[name="bell-dur"]').forEach(function (radio) {
        radio.addEventListener('change', function () {
            Sound.unlock();
            Sound.setVolume(parseInt(els.asVolume.value) || 100);
            Sound.setBellDuration(parseInt(this.value));
            Sound.playBell(getSelectedBellType());
        });
    });

    // ── Close & Stepper buttons ──
    document.querySelectorAll('[data-close]').forEach(function (btn) {
        btn.addEventListener('click', function () { showScreen('dashboard'); });
    });

    document.querySelectorAll('.stepper-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            if (!btn.dataset.target) return;
            var t = $(btn.dataset.target);
            if (!t) return;
            var d = parseInt(btn.dataset.delta);
            t.value = clamp((parseInt(t.value) || 0) + d, parseInt(t.min) || 0, parseInt(t.max) || 99);
        });
    });

    // ── Init ──
    Sound.setVolume(appSettings.volume);
    Sound.setBellDuration(appSettings.bellDuration);
    renderPresets();
    updateClock();
    setInterval(updateClock, 1000);
})();
