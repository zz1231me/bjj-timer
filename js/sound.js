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

    // ── Type 1: 체육관 벨 (Boxing ring bell - sharp metallic DING) ──
    function bellGym() {
        var c = getCtx();
        var now = c.currentTime;
        var vol = volumeLevel * 0.7;

        var master = c.createGain();
        master.gain.setValueAtTime(vol, now);
        master.gain.setValueAtTime(vol, now + 0.01);
        master.gain.exponentialRampToValueAtTime(vol * 0.3, now + 0.4);
        master.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
        master.connect(c.destination);

        var freqs = [2093, 3136];
        freqs.forEach(function (freq) {
            var osc = c.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;
            var g = c.createGain();
            g.gain.value = 0.5;
            osc.connect(g);
            g.connect(master);
            osc.start(now);
            osc.stop(now + 1.8);
        });

        var hit = c.createOscillator();
        hit.type = 'triangle';
        hit.frequency.value = 4200;
        var hitG = c.createGain();
        hitG.gain.setValueAtTime(vol * 0.4, now);
        hitG.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        hit.connect(hitG);
        hitG.connect(c.destination);
        hit.start(now);
        hit.stop(now + 0.1);
    }

    // ── Type 2: 부저 (Electronic buzzer - sharp authoritative BEEP) ──
    function bellBuzzer() {
        var c = getCtx();
        var now = c.currentTime;
        var vol = volumeLevel * 0.5;

        function beep(t) {
            var osc = c.createOscillator();
            osc.type = 'square';
            osc.frequency.value = 880;
            var osc2 = c.createOscillator();
            osc2.type = 'square';
            osc2.frequency.value = 884;

            var g = c.createGain();
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(vol, t + 0.008);
            g.gain.setValueAtTime(vol, t + 0.28);
            g.gain.linearRampToValueAtTime(0, t + 0.32);

            var g2 = c.createGain();
            g2.gain.setValueAtTime(0, t);
            g2.gain.linearRampToValueAtTime(vol * 0.3, t + 0.008);
            g2.gain.setValueAtTime(vol * 0.3, t + 0.28);
            g2.gain.linearRampToValueAtTime(0, t + 0.32);

            osc.connect(g); g.connect(c.destination);
            osc2.connect(g2); g2.connect(c.destination);
            osc.start(t); osc.stop(t + 0.35);
            osc2.start(t); osc2.stop(t + 0.35);
        }

        beep(now);
        beep(now + 0.4);
    }

    // ── Type 3: 호루라기 (Referee whistle - loud piercing) ──
    function bellWhistle() {
        var c = getCtx();
        var now = c.currentTime;
        var vol = volumeLevel * 0.35;

        var osc = c.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2600, now);
        osc.frequency.linearRampToValueAtTime(3200, now + 0.06);
        osc.frequency.setValueAtTime(3200, now + 0.6);
        osc.frequency.linearRampToValueAtTime(2400, now + 0.85);

        var vibrato = c.createOscillator();
        vibrato.frequency.value = 7;
        var vGain = c.createGain();
        vGain.gain.value = 80;
        vibrato.connect(vGain);
        vGain.connect(osc.frequency);

        var g = c.createGain();
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(vol, now + 0.03);
        g.gain.setValueAtTime(vol, now + 0.6);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
        osc.connect(g);
        g.connect(c.destination);

        var noise = c.createOscillator();
        noise.type = 'sawtooth';
        noise.frequency.value = 6400;
        var nGain = c.createGain();
        nGain.gain.setValueAtTime(0, now);
        nGain.gain.linearRampToValueAtTime(vol * 0.2, now + 0.03);
        nGain.gain.setValueAtTime(vol * 0.2, now + 0.6);
        nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
        noise.connect(nGain);
        nGain.connect(c.destination);

        osc.start(now); osc.stop(now + 0.95);
        vibrato.start(now); vibrato.stop(now + 0.95);
        noise.start(now); noise.stop(now + 0.95);
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
        setTimeout(function () { playBell(type); }, 500);
    }

    function playCountTick() {
        var c = getCtx();
        var now = c.currentTime;
        var vol = volumeLevel * 0.18;
        var osc = c.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 1200;
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
