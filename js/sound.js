var Sound = (function () {
    var ctx;
    var volumeLevel = 1.0;
    var bellDuration = 1;

    function getCtx() {
        if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    }

    function unlock() {
        try {
            var c = getCtx();
            var buf = c.createBuffer(1, 1, 22050);
            var src = c.createBufferSource();
            src.buffer = buf;
            src.connect(c.destination);
            src.start(0);
        } catch (e) {}
    }

    function setVolume(v) {
        volumeLevel = Math.max(0, Math.min(1.5, v / 100));
    }

    function setBellDuration(sec) {
        bellDuration = Math.max(1, Math.min(3, sec));
    }

    function makeTone(freq, type, duration, vol, startTime) {
        var c = getCtx();
        var t = startTime || c.currentTime;
        var osc = c.createOscillator();
        osc.type = type;
        osc.frequency.value = freq;
        var g = c.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol, t + 0.008);
        g.gain.setValueAtTime(vol, t + duration - 0.04);
        g.gain.linearRampToValueAtTime(0, t + duration);
        osc.connect(g);
        g.connect(c.destination);
        osc.start(t);
        osc.stop(t + duration + 0.01);
    }

    // Type 1: 삐! (1000Hz square)
    function type1Start(dur) {
        makeTone(1000, 'square', dur, volumeLevel);
    }
    function type1End(dur) {
        makeTone(1000, 'square', dur, volumeLevel);
    }

    // Type 2: 뿌── (440Hz sawtooth)
    function type2Start(dur) {
        makeTone(440, 'sawtooth', dur, volumeLevel);
    }
    function type2End(dur) {
        makeTone(440, 'sawtooth', dur, volumeLevel);
    }

    // Type 3: 삑삑! (1200Hz repeated)
    function type3Start(dur) {
        makeTone(1200, 'square', Math.min(dur, 0.25), volumeLevel);
    }
    function type3End(dur) {
        var c = getCtx();
        var now = c.currentTime;
        var count = Math.max(1, Math.round(dur / 0.35));
        for (var i = 0; i < count; i++) {
            makeTone(1200, 'square', 0.25, volumeLevel, now + i * 0.35);
        }
    }

    // Type 4: 띵! (1047Hz + 2094Hz sine bell)
    function type4Start(dur) {
        var c = getCtx();
        var t = c.currentTime;
        var vol = volumeLevel;
        var osc1 = c.createOscillator();
        osc1.type = 'sine'; osc1.frequency.value = 1047;
        var osc2 = c.createOscillator();
        osc2.type = 'sine'; osc2.frequency.value = 2094;
        var g1 = c.createGain();
        g1.gain.setValueAtTime(vol, t);
        g1.gain.exponentialRampToValueAtTime(vol * 0.3, t + dur * 0.3);
        g1.gain.exponentialRampToValueAtTime(0.001, t + dur);
        var g2 = c.createGain();
        g2.gain.setValueAtTime(vol * 0.5, t);
        g2.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.6);
        osc1.connect(g1); g1.connect(c.destination);
        osc2.connect(g2); g2.connect(c.destination);
        osc1.start(t); osc1.stop(t + dur + 0.1);
        osc2.start(t); osc2.stop(t + dur * 0.7);
    }
    function type4End(dur) {
        type4Start(dur);
    }

    // Type 5: 삐── (1000Hz square long)
    function type5Start(dur) {
        makeTone(1000, 'square', dur, volumeLevel);
    }
    function type5End(dur) {
        makeTone(1000, 'square', dur, volumeLevel);
    }

    // Type 6: 삐삐빅 (pattern)
    function type6Start(dur) {
        var c = getCtx();
        var t = c.currentTime;
        var vol = volumeLevel;
        makeTone(1200, 'square', 0.12, vol, t);
        makeTone(1400, 'square', Math.max(0.3, dur - 0.2), vol, t + 0.2);
    }
    function type6End(dur) {
        var c = getCtx();
        var t = c.currentTime;
        var vol = volumeLevel;
        var reps = Math.max(1, Math.round(dur / 0.8));
        for (var r = 0; r < reps; r++) {
            var base = t + r * 0.8;
            makeTone(1200, 'square', 0.1, vol, base);
            makeTone(1200, 'square', 0.1, vol, base + 0.15);
            makeTone(1400, 'square', 0.35, vol, base + 0.3);
        }
    }

    // Type 7: 삐빅삐빅 (alternating)
    function type7Start(dur) {
        var c = getCtx();
        var t = c.currentTime;
        var vol = volumeLevel;
        var count = Math.max(2, Math.round(dur / 0.2));
        for (var i = 0; i < count; i++) {
            makeTone(i % 2 === 0 ? 1000 : 1300, 'square', 0.15, vol, t + i * 0.2);
        }
    }
    function type7End(dur) {
        type7Start(dur);
    }

    var startFns = [null, type1Start, type2Start, type3Start, type4Start, type5Start, type6Start, type7Start];
    var endFns = [null, type1End, type2End, type3End, type4End, type5End, type6End, type7End];
    var focusTimerId = null;

    function withAudioFocus(fn, durationMs) {
        Bridge.requestAudioFocus();
        fn();
        clearTimeout(focusTimerId);
        focusTimerId = setTimeout(function () {
            Bridge.abandonAudioFocus();
        }, durationMs + 500);
    }

    function playBell(type) {
        var fn = startFns[type || 1];
        if (fn) withAudioFocus(function () { fn(bellDuration); }, bellDuration * 1000);
    }

    function playRoundStart(type) {
        var fn = startFns[type || 1];
        if (fn) withAudioFocus(function () { fn(bellDuration); }, bellDuration * 1000);
    }

    function playRoundEnd(type) {
        var fn = endFns[type || 1];
        if (fn) withAudioFocus(function () { fn(bellDuration); }, bellDuration * 1000);
    }

    function playCountTick() {
        var c = getCtx();
        var now = c.currentTime;
        var vol = volumeLevel * 0.3;
        var osc = c.createOscillator();
        osc.type = 'square';
        osc.frequency.value = 1000;
        var g = c.createGain();
        g.gain.setValueAtTime(vol, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.connect(g);
        g.connect(c.destination);
        osc.start(now);
        osc.stop(now + 0.07);
    }

    var keepAliveId = null;

    function startKeepAlive() {
        if (keepAliveId) return;
        keepAliveId = setInterval(function () {
            try {
                var c = getCtx();
                var osc = c.createOscillator();
                var g = c.createGain();
                g.gain.value = 0.001;
                osc.connect(g);
                g.connect(c.destination);
                osc.start();
                osc.stop(c.currentTime + 0.02);
            } catch (e) {}
        }, 4000);
    }

    function stopKeepAlive() {
        if (keepAliveId) {
            clearInterval(keepAliveId);
            keepAliveId = null;
        }
    }

    return {
        unlock: unlock,
        setVolume: setVolume,
        setBellDuration: setBellDuration,
        playBell: playBell,
        playRoundStart: playRoundStart,
        playRoundEnd: playRoundEnd,
        playCountTick: playCountTick,
        startKeepAlive: startKeepAlive,
        stopKeepAlive: stopKeepAlive
    };
})();
