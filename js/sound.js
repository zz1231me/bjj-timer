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

    // ── Type 1: 체육관 벨 ──
    function bellGym() {
        var c = getCtx();
        var now = c.currentTime;
        var master = c.createGain();
        master.connect(c.destination);
        master.gain.setValueAtTime(volumeLevel * 0.6, now);
        master.gain.exponentialRampToValueAtTime(0.001, now + 2.0);

        [830, 1245, 1660, 2490].forEach(function (freq, i) {
            var osc = c.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;
            var g = c.createGain();
            g.gain.value = 0.5 / (i + 1);
            osc.connect(g);
            g.connect(master);
            osc.start(now);
            osc.stop(now + 2.0);
        });
    }

    // ── Type 2: 부저 (삑!) ──
    function bellBuzzer() {
        var c = getCtx();
        var now = c.currentTime;
        var osc = c.createOscillator();
        osc.type = 'square';
        osc.frequency.value = 680;
        var g = c.createGain();
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(volumeLevel * 0.45, now + 0.015);
        g.gain.setValueAtTime(volumeLevel * 0.45, now + 0.65);
        g.gain.linearRampToValueAtTime(0, now + 0.72);
        osc.connect(g);
        g.connect(c.destination);
        osc.start(now);
        osc.stop(now + 0.75);

        var osc2 = c.createOscillator();
        osc2.type = 'square';
        osc2.frequency.value = 685;
        var g2 = c.createGain();
        g2.gain.setValueAtTime(0, now);
        g2.gain.linearRampToValueAtTime(volumeLevel * 0.15, now + 0.015);
        g2.gain.setValueAtTime(volumeLevel * 0.15, now + 0.65);
        g2.gain.linearRampToValueAtTime(0, now + 0.72);
        osc2.connect(g2);
        g2.connect(c.destination);
        osc2.start(now);
        osc2.stop(now + 0.75);
    }

    // ── Type 3: 호루라기 ──
    function bellWhistle() {
        var c = getCtx();
        var now = c.currentTime;
        var osc = c.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 2800;

        var vibrato = c.createOscillator();
        vibrato.frequency.value = 6;
        var vGain = c.createGain();
        vGain.gain.value = 60;
        vibrato.connect(vGain);
        vGain.connect(osc.frequency);

        var g = c.createGain();
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(volumeLevel * 0.3, now + 0.04);
        g.gain.setValueAtTime(volumeLevel * 0.3, now + 0.7);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
        osc.connect(g);
        g.connect(c.destination);
        osc.start(now);
        osc.stop(now + 0.95);
        vibrato.start(now);
        vibrato.stop(now + 0.95);

        var noise = c.createOscillator();
        noise.type = 'sawtooth';
        noise.frequency.value = 5600;
        var nGain = c.createGain();
        nGain.gain.setValueAtTime(0, now);
        nGain.gain.linearRampToValueAtTime(volumeLevel * 0.06, now + 0.04);
        nGain.gain.setValueAtTime(volumeLevel * 0.06, now + 0.7);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
        noise.connect(nGain);
        nGain.connect(c.destination);
        noise.start(now);
        noise.stop(now + 0.95);
    }

    var bellFns = [null, bellGym, bellBuzzer, bellWhistle];

    function playBell(type) {
        var fn = bellFns[type || 1];
        if (fn) fn();
    }

    function playRoundStart(type) {
        playBell(type);
    }

    function playRoundEnd(type) {
        playBell(type);
        setTimeout(function () { playBell(type); }, 400);
    }

    function playCountTick() {
        var c = getCtx();
        var now = c.currentTime;
        var osc = c.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 1800;
        var g = c.createGain();
        g.gain.setValueAtTime(volumeLevel * 0.1, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
        osc.connect(g);
        g.connect(c.destination);
        osc.start(now);
        osc.stop(now + 0.04);
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
