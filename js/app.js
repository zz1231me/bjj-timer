(function () {
    var $ = function (id) { return document.getElementById(id); };
    var app = $('app');

    // ── State ──

    var presets = Settings.loadPresets();
    var appSettings = Settings.loadAppSettings();
    var editingPresetId = null;
    var clockInterval = null;

    // ── Elements ──

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
        roundCurrent: $('round-current'),
        roundTotal: $('round-total'),
        statusLabel: $('status-label'),
        countdown: $('countdown'),
        progressFill: $('progress-fill'),
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

    // ── Navigation ──

    function showScreen(name) {
        Object.keys(screens).forEach(function (k) {
            screens[k].classList.remove('active');
        });
        screens[name].classList.add('active');
    }

    // ── Dashboard Clock ──

    function updateClock() {
        var now = new Date();
        var days = ['일', '월', '화', '수', '목', '금', '토'];
        var y = now.getFullYear();
        var m = now.getMonth() + 1;
        var d = now.getDate();
        var day = days[now.getDay()];
        els.dashDate.textContent = y + '년 ' + m + '월 ' + d + '일 (' + day + ')';

        var h = now.getHours();
        var mi = now.getMinutes();
        var s = now.getSeconds();
        els.dashTime.textContent =
            (h < 10 ? '0' : '') + h + ':' +
            (mi < 10 ? '0' : '') + mi + ':' +
            (s < 10 ? '0' : '') + s;

        updateScheduleBadge(now);
    }

    function updateScheduleBadge(now) {
        if (!appSettings.scheduleEnabled) {
            els.scheduleBadge.classList.add('hidden');
            return;
        }
        els.scheduleBadge.classList.remove('hidden');
        var currentMin = now.getHours() * 60 + now.getMinutes();
        var startParts = appSettings.scheduleStart.split(':');
        var endParts = appSettings.scheduleEnd.split(':');
        var startMin = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
        var endMin = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);

        var active = startMin <= endMin
            ? (currentMin >= startMin && currentMin < endMin)
            : (currentMin >= startMin || currentMin < endMin);

        els.scheduleText.textContent = '⏰ ' + appSettings.scheduleStart + ' ~ ' + appSettings.scheduleEnd +
            (active ? ' (운영중)' : ' (대기)');
    }

    // ── Preset List ──

    function renderPresets() {
        els.presetList.innerHTML = '';
        presets.forEach(function (p) {
            var card = document.createElement('div');
            card.className = 'preset-card';

            var info = document.createElement('div');
            info.className = 'preset-info';

            var name = document.createElement('div');
            name.className = 'preset-name';
            name.textContent = p.name;

            var detail = document.createElement('div');
            detail.className = 'preset-detail';
            detail.textContent = Settings.formatPresetDetail(p);

            info.appendChild(name);
            info.appendChild(detail);

            var playBtn = document.createElement('button');
            playBtn.className = 'preset-play';
            playBtn.innerHTML = '&#9654;';
            playBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                Sound.unlock();
                startTimer(p);
            });

            var editBtn = document.createElement('button');
            editBtn.className = 'preset-edit';
            editBtn.innerHTML = '&#9998;';
            editBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                openPresetEdit(p);
            });

            card.appendChild(info);
            card.appendChild(playBtn);
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

    function setTimerStateClass(stateName) {
        app.className = stateName ? 'state-' + stateName : '';
    }

    function updateTimerDisplay(status) {
        els.roundCurrent.textContent = status.currentRound || '-';
        els.roundTotal.textContent = status.totalRounds;
        els.countdown.textContent = formatTime(status.remainingMs);
        els.progressFill.style.width = (status.progress * 100) + '%';

        var stateClass = status.state;
        if (status.isWarning) stateClass = 'warning';
        if (status.state === Timer.State.PAUSED) stateClass = 'paused';
        setTimerStateClass(stateClass);

        var labels = {
            idle: '준비',
            running: '스파링!',
            paused: '일시정지',
            resting: '휴식',
            finished: '종료!'
        };
        els.statusLabel.textContent = status.isWarning ? '경고!' : (labels[status.state] || '');

        if (status.state === Timer.State.IDLE || status.state === Timer.State.FINISHED) {
            els.btnStart.textContent = '시작';
        } else if (status.state === Timer.State.PAUSED) {
            els.btnStart.textContent = '계속';
        } else {
            els.btnStart.textContent = '정지';
        }
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
        var state = Timer.getState();
        if (state === Timer.State.RUNNING || state === Timer.State.RESTING) {
            Timer.pause();
        } else {
            Timer.start();
        }
    });

    els.btnReset.addEventListener('click', function () {
        Timer.reset();
    });

    els.btnBack.addEventListener('click', function () {
        Timer.reset();
        Bridge.keepScreenOn(false);
        setTimerStateClass(null);
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

    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

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

    els.btnAddPreset.addEventListener('click', function () {
        openPresetEdit(null);
    });

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

    // ── Close buttons ──

    document.querySelectorAll('.close-btn[data-close]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            showScreen('dashboard');
        });
    });

    // ── Adjuster buttons ──

    document.querySelectorAll('.adj-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var target = $(btn.dataset.target);
            var delta = parseInt(btn.dataset.delta);
            var val = (parseInt(target.value) || 0) + delta;
            var min = parseInt(target.min) || 0;
            var max = parseInt(target.max) || 99;
            target.value = clamp(val, min, max);
        });
    });

    // ── Init ──

    Sound.setVolume(appSettings.volume);
    renderPresets();
    updateClock();
    clockInterval = setInterval(updateClock, 1000);

})();
