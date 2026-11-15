(function () {
    var $ = function (id) { return document.getElementById(id); };

    var els = {
        timerScreen: $('timer-screen'),
        settingsScreen: $('settings-screen'),
        roundCurrent: $('round-current'),
        roundTotal: $('round-total'),
        statusLabel: $('status-label'),
        countdown: $('countdown'),
        progressFill: $('progress-fill'),
        btnStart: $('btn-start'),
        btnReset: $('btn-reset'),
        btnSettings: $('btn-settings'),
        btnCloseSettings: $('btn-close-settings'),
        btnSaveSettings: $('btn-save-settings'),
        setRoundMin: $('set-round-min'),
        setRoundSec: $('set-round-sec'),
        setRestMin: $('set-rest-min'),
        setRestSec: $('set-rest-sec'),
        setRounds: $('set-rounds'),
        setWarning: $('set-warning'),
        setSound: $('set-sound'),
        setVibrate: $('set-vibrate')
    };

    var currentSettings = Settings.load();

    function formatTime(ms) {
        var totalSec = Math.ceil(ms / 1000);
        var min = Math.floor(totalSec / 60);
        var sec = totalSec % 60;
        return min + ':' + (sec < 10 ? '0' : '') + sec;
    }

    function setStateClass(stateName) {
        var app = $('app');
        app.className = '';
        if (stateName) {
            app.className = 'state-' + stateName;
        }
    }

    function updateDisplay(status) {
        els.roundCurrent.textContent = status.currentRound || '-';
        els.roundTotal.textContent = status.totalRounds;
        els.countdown.textContent = formatTime(status.remainingMs);
        els.progressFill.style.width = (status.progress * 100) + '%';

        var stateClass = status.state;
        if (status.isWarning) stateClass = 'warning';
        if (status.state === Timer.State.PAUSED) stateClass = 'paused';
        setStateClass(stateClass);

        var labels = {
            idle: 'READY',
            running: 'FIGHT!',
            paused: 'PAUSED',
            resting: 'REST',
            finished: 'DONE!'
        };
        var label = status.isWarning ? 'WARNING' : (labels[status.state] || '');
        els.statusLabel.textContent = label;

        if (status.state === Timer.State.IDLE || status.state === Timer.State.FINISHED) {
            els.btnStart.textContent = 'START';
        } else if (status.state === Timer.State.PAUSED) {
            els.btnStart.textContent = 'RESUME';
        } else {
            els.btnStart.textContent = 'PAUSE';
        }
    }

    Timer.on('update', updateDisplay);

    Timer.on('roundStart', function (data) {
        if (currentSettings.soundOn) Sound.playRoundStart();
        if (currentSettings.vibrateOn) Bridge.vibrate(300);
        Bridge.keepScreenOn(true);
    });

    Timer.on('restStart', function () {
        if (currentSettings.soundOn) Sound.playRoundEnd();
        if (currentSettings.vibrateOn) Bridge.vibrate([200, 100, 200]);
    });

    Timer.on('warning', function () {
        if (currentSettings.soundOn) Sound.playWarning();
        if (currentSettings.vibrateOn) Bridge.vibrate(100);
    });

    Timer.on('finish', function () {
        if (currentSettings.soundOn) Sound.playFinish();
        if (currentSettings.vibrateOn) Bridge.vibrate([300, 100, 300, 100, 500]);
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
        Bridge.keepScreenOn(false);
    });

    els.btnSettings.addEventListener('click', function () {
        if (Timer.getState() === Timer.State.RUNNING || Timer.getState() === Timer.State.RESTING) {
            Timer.pause();
        }
        populateSettings();
        els.settingsScreen.classList.remove('hidden');
    });

    els.btnCloseSettings.addEventListener('click', function () {
        els.settingsScreen.classList.add('hidden');
    });

    els.btnSaveSettings.addEventListener('click', function () {
        currentSettings = readSettingsForm();
        Settings.save(currentSettings);
        Timer.configure(currentSettings);
        els.settingsScreen.classList.add('hidden');
    });

    function populateSettings() {
        els.setRoundMin.value = currentSettings.roundMin;
        els.setRoundSec.value = currentSettings.roundSec;
        els.setRestMin.value = currentSettings.restMin;
        els.setRestSec.value = currentSettings.restSec;
        els.setRounds.value = currentSettings.rounds;
        els.setWarning.value = currentSettings.warningSec;
        els.setSound.checked = currentSettings.soundOn;
        els.setVibrate.checked = currentSettings.vibrateOn;
    }

    function readSettingsForm() {
        return {
            roundMin: clamp(parseInt(els.setRoundMin.value) || 0, 0, 99),
            roundSec: clamp(parseInt(els.setRoundSec.value) || 0, 0, 59),
            restMin: clamp(parseInt(els.setRestMin.value) || 0, 0, 99),
            restSec: clamp(parseInt(els.setRestSec.value) || 0, 0, 59),
            rounds: clamp(parseInt(els.setRounds.value) || 1, 1, 99),
            warningSec: clamp(parseInt(els.setWarning.value) || 0, 0, 60),
            soundOn: els.setSound.checked,
            vibrateOn: els.setVibrate.checked
        };
    }

    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

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

    Timer.configure(currentSettings);
})();
