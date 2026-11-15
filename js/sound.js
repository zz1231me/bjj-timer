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

    // ── Type 1: 띵! (명확한 벨 소리) ──
    function bellDing() {
        var c = getCtx();
        var now = c.currentTime;
        var vol = volumeLevel;

        var osc1 = c.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.value = 1047;
        var g1 = c.createGain();
        g1.gain.setValueAtTime(vol * 0.8, now);
        g1.gain.exponentialRampToValueAtTime(vol * 0.4, now + 0.3);
        g1.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc1.connect(g1);
        g1.connect(c.destination);
        osc1.start(now);
        osc1.stop(now + 1.3);

        var osc2 = c.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = 2094;
        var g2 = c.createGain();
        g2.gain.setValueAtTime(vol * 0.5, now);
        g2.gain.exponentialRampToValueAtTime(vol * 0.15, now + 0.2);
        g2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc2.connect(g2);
        g2.connect(c.destination);
        osc2.start(now);
        osc2.stop(now + 0.9);
    }

    // ── Type 2: 삐── ! (길고 강한 전자 부저) ──
    function bellBeep() {
        var c = getCtx();
        var now = c.currentTime;
        var vol = volumeLevel;

        var osc = c.createOscillator();
        osc.type = 'square';
        osc.frequency.value = 1000;
        var g = c.createGain();
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(vol * 0.55, now + 0.005);
        g.gain.setValueAtTime(vol * 0.55, now + 0.7);
        g.gain.linearRampToValueAtTime(0, now + 0.75);
        osc.connect(g);
        g.connect(c.destination);
        osc.start(now);
        osc.stop(now + 0.8);
    }

    // ── Type 3: 삑삑! (짧은 2연타 비프) ──
    function bellDoubleBeep() {
        var c = getCtx();
        var now = c.currentTime;
        var vol = volumeLevel;

        function shortBeep(t) {
            var osc = c.createOscillator();
            osc.type = 'square';
            osc.frequency.value = 1500;
            var g = c.createGain();
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(vol * 0.5, t + 0.005);
            g.gain.setValueAtTime(vol * 0.5, t + 0.12);
            g.gain.linearRampToValueAtTime(0, t + 0.14);
            osc.connect(g);
            g.connect(c.destination);
            osc.start(t);
            osc.stop(t + 0.16);
        }

        shortBeep(now);
        shortBeep(now + 0.2);
    }

    var bellFns = [null, bellDing, bellBeep, bellDoubleBeep];

    function playBell(type) {
        var fn = bellFns[type || 1];
        if (fn) fn();
    }

    function playRoundStart(type) {
        playBell(type);
    }

    function playRoundEnd(type) {
        playBell(type);
        setTimeout(function () { playBell(type); }, 600);
    }

    function playCountTick() {
        var c = getCtx();
        var now = c.currentTime;
        var vol = volumeLevel;
        var osc = c.createOscillator();
        osc.type = 'square';
        osc.frequency.value = 1000;
        var g = c.createGain();
        g.gain.setValueAtTime(vol * 0.25, now);
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
