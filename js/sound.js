var Sound = (function () {
    var ctx;
    var volumeLevel = 0.8;

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
        volumeLevel = Math.max(0, Math.min(1, v / 100));
    }

    function makeBeep(freq, duration, startTime) {
        var c = getCtx();
        var t = startTime || c.currentTime;
        var vol = volumeLevel * 0.55;
        var osc = c.createOscillator();
        osc.type = 'square';
        osc.frequency.value = freq;
        var g = c.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol, t + 0.005);
        g.gain.setValueAtTime(vol, t + duration - 0.03);
        g.gain.linearRampToValueAtTime(0, t + duration);
        osc.connect(g);
        g.connect(c.destination);
        osc.start(t);
        osc.stop(t + duration + 0.01);
    }

    function makeDing(duration, startTime) {
        var c = getCtx();
        var t = startTime || c.currentTime;
        var vol = volumeLevel * 0.8;
        var osc1 = c.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.value = 1047;
        var osc2 = c.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = 2094;
        var g1 = c.createGain();
        g1.gain.setValueAtTime(vol, t);
        g1.gain.exponentialRampToValueAtTime(vol * 0.3, t + duration * 0.3);
        g1.gain.exponentialRampToValueAtTime(0.001, t + duration);
        var g2 = c.createGain();
        g2.gain.setValueAtTime(vol * 0.5, t);
        g2.gain.exponentialRampToValueAtTime(0.001, t + duration * 0.6);
        osc1.connect(g1); g1.connect(c.destination);
        osc2.connect(g2); g2.connect(c.destination);
        osc1.start(t); osc1.stop(t + duration + 0.01);
        osc2.start(t); osc2.stop(t + duration * 0.6 + 0.01);
    }

    // ═══════════════════════════════════
    // Type 1: 벨 (띵!)
    // 시작: 짧은 띵!  종료: 길게 띵~~~~~
    // ═══════════════════════════════════
    function bell1Start() {
        makeDing(0.6);
    }
    function bell1End() {
        makeDing(2.5);
    }

    // ═══════════════════════════════════
    // Type 2: 부저 (삐!)
    // 시작: 짧은 삐!  종료: 길게 삐────!
    // ═══════════════════════════════════
    function bell2Start() {
        makeBeep(880, 0.3);
    }
    function bell2End() {
        makeBeep(880, 1.5);
    }

    // ═══════════════════════════════════
    // Type 3: 더블비프 (삑삑!)
    // 시작: 삑!  종료: 삑삑삑!
    // ═══════════════════════════════════
    function bell3Start() {
        makeBeep(1200, 0.15);
    }
    function bell3End() {
        var c = getCtx();
        var now = c.currentTime;
        makeBeep(1200, 0.15, now);
        makeBeep(1200, 0.15, now + 0.25);
        makeBeep(1200, 0.15, now + 0.5);
    }

    var startFns = [null, bell1Start, bell2Start, bell3Start];
    var endFns = [null, bell1End, bell2End, bell3End];

    function playBell(type) {
        var fn = startFns[type || 1];
        if (fn) fn();
    }

    function playRoundStart(type) {
        var fn = startFns[type || 1];
        if (fn) fn();
    }

    function playRoundEnd(type) {
        var fn = endFns[type || 1];
        if (fn) fn();
    }

    function playCountTick() {
        var c = getCtx();
        var now = c.currentTime;
        var vol = volumeLevel * 0.25;
        var osc = c.createOscillator();
        osc.type = 'square';
        osc.frequency.value = 1000;
        var g = c.createGain();
        g.gain.setValueAtTime(vol, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(g);
        g.connect(c.destination);
        osc.start(now);
        osc.stop(now + 0.06);
    }

    return {
        unlock: unlock,
        setVolume: setVolume,
        playBell: playBell,
        playRoundStart: playRoundStart,
        playRoundEnd: playRoundEnd,
        playCountTick: playCountTick
    };
})();
