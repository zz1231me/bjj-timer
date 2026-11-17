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
    var preset = null;
    var callbacks = {};

    function on(event, fn) { callbacks[event] = fn; }
    function emit(event, data) { if (callbacks[event]) callbacks[event](data); }

    function configure(p) {
        preset = p;
        remainingMs = Settings.getRoundMs(p);
        totalMs = remainingMs;
        state = State.IDLE;
        emit('update', getStatus());
    }

    function start() {
        if (state === State.IDLE) {
            remainingMs = Settings.getRoundMs(preset);
            totalMs = remainingMs;
            state = State.RUNNING;
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
        emit('update', getStatus());
    }

    function tick() {
        rafId = requestAnimationFrame(function () {
            remainingMs = Math.max(0, endTime - Date.now());
            if (remainingMs <= 0) { onPeriodEnd(); return; }
            emit('update', getStatus());
            tick();
        });
    }

    var transitionDelay = 1000;

    function onPeriodEnd() {
        if (state === State.RUNNING) {
            var restMs = Settings.getRestMs(preset);
            emit('restStart');
            emit('update', getStatus());
            if (restMs <= 0) {
                setTimeout(function () {
                    if (state !== State.RUNNING) return;
                    remainingMs = Settings.getRoundMs(preset);
                    totalMs = remainingMs;
                    endTime = Date.now() + remainingMs;
                    emit('roundStart');
                    emit('update', getStatus());
                    tick();
                }, transitionDelay);
                return;
            }
            state = State.RESTING;
            remainingMs = restMs;
            totalMs = remainingMs;
            setTimeout(function () {
                if (state !== State.RESTING) return;
                endTime = Date.now() + remainingMs;
                emit('update', getStatus());
                tick();
            }, transitionDelay);
        } else if (state === State.RESTING) {
            emit('roundStart');
            emit('update', getStatus());
            state = State.RUNNING;
            remainingMs = Settings.getRoundMs(preset);
            totalMs = remainingMs;
            setTimeout(function () {
                if (state !== State.RUNNING) return;
                endTime = Date.now() + remainingMs;
                emit('update', getStatus());
                tick();
            }, transitionDelay);
        }
    }

    function getStatus() {
        return {
            state: state,
            remainingMs: remainingMs,
            totalMs: totalMs,
            progress: totalMs > 0 ? remainingMs / totalMs : 1,
            warningSec: preset ? preset.warningSec : 10
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
