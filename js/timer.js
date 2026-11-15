var Timer = (function () {
    var State = {
        IDLE: 'idle',
        RUNNING: 'running',
        PAUSED: 'paused',
        RESTING: 'resting'
    };

    var state = State.IDLE;
    var remainingMs = 0;
    var totalMs = 0;
    var endTime = 0;
    var rafId = null;
    var warningFired = false;
    var lastCountSec = -1;
    var preset = null;
    var callbacks = {};

    function on(event, fn) { callbacks[event] = fn; }
    function emit(event, data) { if (callbacks[event]) callbacks[event](data); }

    function configure(p) {
        preset = p;
        remainingMs = Settings.getRoundMs(p);
        totalMs = remainingMs;
        state = State.IDLE;
        warningFired = false;
        lastCountSec = -1;
        emit('update', getStatus());
    }

    function start() {
        if (state === State.IDLE) {
            remainingMs = Settings.getRoundMs(preset);
            totalMs = remainingMs;
            state = State.RUNNING;
            warningFired = false;
            lastCountSec = -1;
            emit('roundStart');
        } else if (state === State.PAUSED) {
            if (remainingMs <= 0) return;
            state = totalMs === Settings.getRestMs(preset) ? State.RESTING : State.RUNNING;
        }
        endTime = Date.now() + remainingMs;
        tick();
    }

    function pause() {
        if (state !== State.RUNNING && state !== State.RESTING) return;
        cancelAnimationFrame(rafId);
        rafId = null;
        remainingMs = Math.max(0, endTime - Date.now());
        state = State.PAUSED;
        emit('update', getStatus());
    }

    function reset() {
        cancelAnimationFrame(rafId);
        rafId = null;
        state = State.IDLE;
        remainingMs = Settings.getRoundMs(preset);
        totalMs = remainingMs;
        warningFired = false;
        lastCountSec = -1;
        emit('update', getStatus());
    }

    function tick() {
        rafId = requestAnimationFrame(function () {
            remainingMs = Math.max(0, endTime - Date.now());
            var warningMs = Settings.getWarningMs(preset);

            if (!warningFired && state === State.RUNNING && warningMs > 0 && remainingMs <= warningMs && remainingMs > 0) {
                warningFired = true;
                emit('warningStart');
            }

            if (warningFired && state === State.RUNNING && remainingMs > 0) {
                var sec = Math.ceil(remainingMs / 1000);
                if (sec !== lastCountSec) {
                    lastCountSec = sec;
                    emit('countTick', sec);
                }
            }

            if (remainingMs <= 0) {
                onPeriodEnd();
                return;
            }
            emit('update', getStatus());
            tick();
        });
    }

    function onPeriodEnd() {
        if (state === State.RUNNING) {
            state = State.RESTING;
            remainingMs = Settings.getRestMs(preset);
            totalMs = remainingMs;
            warningFired = false;
            lastCountSec = -1;
            endTime = Date.now() + remainingMs;
            emit('restStart');
            emit('update', getStatus());
            tick();
        } else if (state === State.RESTING) {
            state = State.RUNNING;
            remainingMs = Settings.getRoundMs(preset);
            totalMs = remainingMs;
            warningFired = false;
            lastCountSec = -1;
            endTime = Date.now() + remainingMs;
            emit('roundStart');
            emit('update', getStatus());
            tick();
        }
    }

    function getStatus() {
        var warningMs = preset ? Settings.getWarningMs(preset) : 0;
        return {
            state: state,
            remainingMs: remainingMs,
            totalMs: totalMs,
            progress: totalMs > 0 ? remainingMs / totalMs : 1,
            isWarning: warningFired && state === State.RUNNING,
            countdownSec: (warningFired && state === State.RUNNING) ? Math.ceil(remainingMs / 1000) : 0
        };
    }

    function getState() { return state; }

    return {
        State: State,
        on: on,
        configure: configure,
        start: start,
        pause: pause,
        reset: reset,
        getStatus: getStatus,
        getState: getState
    };
})();
