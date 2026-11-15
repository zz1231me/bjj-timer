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

    // ── 기본 톤 생성기 ──
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

    // ═══════════════════════════════════
    // Type 1: 삐! (고음 비프)
    // 1000Hz square - 날카롭고 명확한 전자음
    // 시작: 짧은 삐!  종료: 길게 삐────!
    // ═══════════════════════════════════
    function type1Start() {
        var vol = volumeLevel * 0.7;
        makeTone(1000, 'square', 0.8, vol);
    }
    function type1End() {
        var vol = volumeLevel * 0.7;
        makeTone(1000, 'square', 2.0, vol);
    }

    // ═══════════════════════════════════
    // Type 2: 뿌── (저음 부저)
    // 440Hz sawtooth - 거칠고 굵은 부저음
    // 시작: 짧은 뿌!  종료: 길게 뿌────!
    // ═══════════════════════════════════
    function type2Start() {
        var vol = volumeLevel * 0.6;
        makeTone(440, 'sawtooth', 0.8, vol);
    }
    function type2End() {
        var vol = volumeLevel * 0.6;
        makeTone(440, 'sawtooth', 2.0, vol);
    }

    // ═══════════════════════════════════
    // Type 3: 삑삑! (더블 비프)
    // 1200Hz square - 빠른 반복 비프
    // 시작: 삑!  종료: 삑삑삑!
    // ═══════════════════════════════════
    function type3Start() {
        var vol = volumeLevel * 0.65;
        makeTone(1200, 'square', 0.25, vol);
    }
    function type3End() {
        var c = getCtx();
        var now = c.currentTime;
        var vol = volumeLevel * 0.65;
        makeTone(1200, 'square', 0.25, vol, now);
        makeTone(1200, 'square', 0.25, vol, now + 0.35);
        makeTone(1200, 'square', 0.25, vol, now + 0.70);
    }

    // ═══════════════════════════════════
    // Type 4: 띵! (벨)
    // 1047Hz + 2094Hz sine - 깨끗한 금속 벨음
    // 시작: 짧은 띵!  종료: 길게 띵~~~~~
    // ═══════════════════════════════════
    function type4Start() {
        var c = getCtx();
        var t = c.currentTime;
        var vol = volumeLevel * 0.8;
        var osc1 = c.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.value = 1047;
        var osc2 = c.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = 2094;
        var g1 = c.createGain();
        g1.gain.setValueAtTime(vol, t);
        g1.gain.exponentialRampToValueAtTime(vol * 0.3, t + 0.3);
        g1.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
        var g2 = c.createGain();
        g2.gain.setValueAtTime(vol * 0.5, t);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        osc1.connect(g1); g1.connect(c.destination);
        osc2.connect(g2); g2.connect(c.destination);
        osc1.start(t); osc1.stop(t + 1.1);
        osc2.start(t); osc2.stop(t + 0.7);
    }
    function type4End() {
        var c = getCtx();
        var t = c.currentTime;
        var vol = volumeLevel * 0.8;
        var osc1 = c.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.value = 1047;
        var osc2 = c.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = 2094;
        var g1 = c.createGain();
        g1.gain.setValueAtTime(vol, t);
        g1.gain.exponentialRampToValueAtTime(vol * 0.3, t + 0.6);
        g1.gain.exponentialRampToValueAtTime(0.001, t + 2.0);
        var g2 = c.createGain();
        g2.gain.setValueAtTime(vol * 0.5, t);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
        osc1.connect(g1); g1.connect(c.destination);
        osc2.connect(g2); g2.connect(c.destination);
        osc1.start(t); osc1.stop(t + 2.1);
        osc2.start(t); osc2.stop(t + 1.3);
    }

    var startFns = [null, type1Start, type2Start, type3Start, type4Start];
    var endFns = [null, type1End, type2End, type3End, type4End];

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

    return {
        unlock: unlock,
        setVolume: setVolume,
        playBell: playBell,
        playRoundStart: playRoundStart,
        playRoundEnd: playRoundEnd,
        playCountTick: playCountTick
    };
})();
