var Timer = (function () {
    var State = {
        IDLE: 'idle',
        RUNNING: 'running',
        PAUSED: 'paused',
        RESTING: 'resting',
        FINISHED: 'finished'
    };

    var state = State.IDLE;
    var currentRound = 0;
    var remainingMs = 0;
    var totalMs = 0;
    var endTime = 0;
    var rafId = null;
    var warningFired = false;
    var preset = null;
    var callbacks = {};

    function on(event, fn) {
        callbacks[event] = fn;
    }

    function emit(event, data) {
        if (callbacks[event]) callbacks[event](data);
    }

    function configure(p) {
        preset = p;
        remainingMs = Settings.getRoundMs(p);
        totalMs = remainingMs;
        currentRound = 0;
        state = State.IDLE;
        warningFired = false;
        emit('update', getStatus());
    }

    function start() {
        if (state === State.FINISHED) return;

        if (state === State.IDLE) {
            currentRound = 1;
            remainingMs = Settings.getRoundMs(preset);
            totalMs = remainingMs;
            state = State.RUNNING;
            warningFired = false;
            emit('roundStart', { round: currentRound });
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
        currentRound = 0;
        remainingMs = Settings.getRoundMs(preset);
        totalMs = remainingMs;
        warningFired = false;
        emit('update', getStatus());
    }

    function tick() {
        rafId = requestAnimationFrame(function () {
            remainingMs = Math.max(0, endTime - Date.now());

            if (!warningFired && state === State.RUNNING) {
                var warningMs = Settings.getWarningMs(preset);
                if (warningMs > 0 && remainingMs <= warningMs && remainingMs > 0) {
                    warningFired = true;
                    emit('warning', { remaining: remainingMs });
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
            if (currentRound >= preset.rounds) {
                state = State.FINISHED;
                emit('finish', { round: currentRound });
                emit('update', getStatus());
                return;
            }
            state = State.RESTING;
            remainingMs = Settings.getRestMs(preset);
            totalMs = remainingMs;
            warningFired = false;
            endTime = Date.now() + remainingMs;
            emit('restStart', { round: currentRound });
            emit('update', getStatus());
            tick();
        } else if (state === State.RESTING) {
            currentRound++;
            state = State.RUNNING;
            remainingMs = Settings.getRoundMs(preset);
            totalMs = remainingMs;
            warningFired = false;
            endTime = Date.now() + remainingMs;
            emit('roundStart', { round: currentRound });
            emit('update', getStatus());
            tick();
        }
    }

    function getStatus() {
        return {
            state: state,
            currentRound: currentRound,
            totalRounds: preset ? preset.rounds : 0,
            remainingMs: remainingMs,
            totalMs: totalMs,
            progress: totalMs > 0 ? remainingMs / totalMs : 1,
            isWarning: warningFired && state === State.RUNNING
        };
    }

    function getState() {
        return state;
    }

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
