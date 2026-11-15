var Sound = (function () {
    var ctx = null;
    var volumeLevel = 0.8;

    function getCtx() {
        if (!ctx) {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        return ctx;
    }

    function setVolume(v) {
        volumeLevel = Math.max(0, Math.min(1, v / 100));
    }

    function tone(freq, duration, type, gain, startDelay) {
        var c = getCtx();
        var osc = c.createOscillator();
        var g = c.createGain();
        var start = c.currentTime + (startDelay || 0);
        osc.type = type || 'sine';
        osc.frequency.value = freq;
        g.gain.setValueAtTime((gain || 0.5) * volumeLevel, start);
        g.gain.exponentialRampToValueAtTime(0.001, start + duration);
        osc.connect(g);
        g.connect(c.destination);
        osc.start(start);
        osc.stop(start + duration);
    }

    function playRoundStart() {
        tone(800, 0.15, 'sine', 0.7);
        tone(1000, 0.15, 'sine', 0.7, 0.12);
        tone(1200, 0.3, 'sine', 0.8, 0.24);
    }

    function playRoundEnd() {
        tone(600, 0.2, 'sine', 0.7);
        tone(500, 0.2, 'sine', 0.6, 0.15);
        tone(400, 0.5, 'sine', 0.5, 0.30);
    }

    function playWarning() {
        for (var i = 0; i < 3; i++) {
            tone(900, 0.08, 'square', 0.4, i * 0.2);
        }
    }

    function playFinish() {
        tone(523, 0.2, 'sine', 0.6);
        tone(659, 0.2, 'sine', 0.6, 0.15);
        tone(784, 0.2, 'sine', 0.7, 0.30);
        tone(1047, 0.5, 'sine', 0.8, 0.45);
    }

    function playBell() {
        var c = getCtx();
        var now = c.currentTime;
        var master = c.createGain();
        master.gain.value = volumeLevel;
        master.connect(c.destination);

        var freqs = [800, 1600, 2400, 3200];
        var gains = [0.6, 0.3, 0.15, 0.08];
        freqs.forEach(function (f, i) {
            var osc = c.createOscillator();
            var g = c.createGain();
            osc.type = 'sine';
            osc.frequency.value = f;
            g.gain.setValueAtTime(gains[i], now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
            osc.connect(g);
            g.connect(master);
            osc.start(now);
            osc.stop(now + 1.5);
        });
    }

    function unlock() {
        try {
            var c = getCtx();
            var buf = c.createBuffer(1, 1, 22050);
            var src = c.createBufferSource();
            src.buffer = buf;
            src.connect(c.destination);
            src.start(0);
        } catch (e) { /* ignore */ }
    }

    return {
        setVolume: setVolume,
        playRoundStart: playRoundStart,
        playRoundEnd: playRoundEnd,
        playWarning: playWarning,
        playFinish: playFinish,
        playBell: playBell,
        unlock: unlock
    };
})();
