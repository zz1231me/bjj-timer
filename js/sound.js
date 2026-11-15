var Sound = (function () {
    var ctx = null;

    function getCtx() {
        if (!ctx) {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        return ctx;
    }

    function playTone(freq, duration, type, gain) {
        var c = getCtx();
        var osc = c.createOscillator();
        var g = c.createGain();
        osc.type = type || 'sine';
        osc.frequency.value = freq;
        g.gain.setValueAtTime(gain || 0.5, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
        osc.connect(g);
        g.connect(c.destination);
        osc.start(c.currentTime);
        osc.stop(c.currentTime + duration);
    }

    function playRoundStart() {
        playTone(880, 0.4, 'sine', 0.6);
        setTimeout(function () { playTone(1100, 0.3, 'sine', 0.5); }, 150);
    }

    function playRoundEnd() {
        playTone(440, 0.6, 'square', 0.4);
        setTimeout(function () { playTone(330, 0.8, 'square', 0.3); }, 200);
    }

    function playWarning() {
        for (var i = 0; i < 3; i++) {
            (function (delay) {
                setTimeout(function () { playTone(660, 0.12, 'sine', 0.4); }, delay);
            })(i * 250);
        }
    }

    function playFinish() {
        playTone(523, 0.3, 'sine', 0.5);
        setTimeout(function () { playTone(659, 0.3, 'sine', 0.5); }, 200);
        setTimeout(function () { playTone(784, 0.5, 'sine', 0.6); }, 400);
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
        playRoundStart: playRoundStart,
        playRoundEnd: playRoundEnd,
        playWarning: playWarning,
        playFinish: playFinish,
        unlock: unlock
    };
})();
