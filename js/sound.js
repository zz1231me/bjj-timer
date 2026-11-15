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

    // ── Type 1: 클래식 벨 ──
    function bellClassic() {
        var c = getCtx();
        var now = c.currentTime;
        var master = c.createGain();
        master.connect(c.destination);
        master.gain.setValueAtTime(volumeLevel * 0.5, now);
        master.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

        [800, 1200, 1600, 2400].forEach(function (freq, i) {
            var osc = c.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;
            var g = c.createGain();
            g.gain.value = 0.6 / (i + 1);
            osc.connect(g);
            g.connect(master);
            osc.start(now);
            osc.stop(now + 1.8);
        });
    }

    // ── Type 2: 전자 비프 ──
    function bellBeep() {
        var c = getCtx();
        var now = c.currentTime;
        [0, 0.18].forEach(function (d) {
            var osc = c.createOscillator();
            osc.type = 'square';
            osc.frequency.value = 1400;
            var g = c.createGain();
            g.gain.setValueAtTime(0, now + d);
            g.gain.linearRampToValueAtTime(volumeLevel * 0.25, now + d + 0.01);
            g.gain.setValueAtTime(volumeLevel * 0.25, now + d + 0.1);
            g.gain.linearRampToValueAtTime(0, now + d + 0.12);
            osc.connect(g);
            g.connect(c.destination);
            osc.start(now + d);
            osc.stop(now + d + 0.15);
        });
    }

    // ── Type 3: 에어혼 ──
    function bellHorn() {
        var c = getCtx();
        var now = c.currentTime;
        var master = c.createGain();
        master.connect(c.destination);
        master.gain.setValueAtTime(0, now);
        master.gain.linearRampToValueAtTime(volumeLevel * 0.35, now + 0.05);
        master.gain.setValueAtTime(volumeLevel * 0.35, now + 0.9);
        master.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

        var osc1 = c.createOscillator();
        osc1.type = 'sawtooth';
        osc1.frequency.value = 180;
        osc1.connect(master);
        osc1.start(now);
        osc1.stop(now + 1.4);

        var osc2 = c.createOscillator();
        osc2.type = 'sawtooth';
        osc2.frequency.value = 184;
        osc2.connect(master);
        osc2.start(now);
        osc2.stop(now + 1.4);

        var osc3 = c.createOscillator();
        osc3.type = 'sine';
        osc3.frequency.value = 360;
        var g3 = c.createGain();
        g3.gain.value = 0.3;
        osc3.connect(g3);
        g3.connect(master);
        osc3.start(now);
        osc3.stop(now + 1.4);
    }

    var bellFns = [null, bellClassic, bellBeep, bellHorn];

    function playBell(type) {
        var fn = bellFns[type || 1];
        if (fn) fn();
    }

    function playRoundStart(type) {
        playBell(type);
    }

    function playRoundEnd(type) {
        playBell(type);
        setTimeout(function () { playBell(type); }, 350);
    }

    function playCountTick() {
        var c = getCtx();
        var now = c.currentTime;
        var osc = c.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 880;
        var g = c.createGain();
        g.gain.setValueAtTime(volumeLevel * 0.18, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(g);
        g.connect(c.destination);
        osc.start(now);
        osc.stop(now + 0.1);
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
