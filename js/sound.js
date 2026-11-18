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

    // ═══════════════════════════════════
    // Type 5: 삐── (긴 단일 비프)
    // 1000Hz square 길게 - 삐이이이이!
    // 시작: 삐──!  종료: 삐────────!
    // ═══════════════════════════════════
    function type5Start() {
        var vol = volumeLevel * 0.8;
        makeTone(1000, 'square', 1.2, vol);
    }
    function type5End() {
        var vol = volumeLevel * 0.8;
        makeTone(1000, 'square', 3.0, vol);
    }

    // ═══════════════════════════════════
    // Type 6: 삐삐빅 (짧은 2연타 + 강조)
    // 1200Hz square 빠른 패턴 - 삐삐빅!
    // 시작: 삐빅!  종료: 삐삐빅! 삐삐빅!
    // ═══════════════════════════════════
    function type6Start() {
        var c = getCtx();
        var t = c.currentTime;
        var vol = volumeLevel * 0.8;
        makeTone(1200, 'square', 0.12, vol, t);
        makeTone(1400, 'square', 0.3, vol, t + 0.2);
    }
    function type6End() {
        var c = getCtx();
        var t = c.currentTime;
        var vol = volumeLevel * 0.8;
        for (var r = 0; r < 2; r++) {
            var base = t + r * 0.8;
            makeTone(1200, 'square', 0.1, vol, base);
            makeTone(1200, 'square', 0.1, vol, base + 0.15);
            makeTone(1400, 'square', 0.35, vol, base + 0.3);
        }
    }

    // ═══════════════════════════════════
    // Type 7: 삐빅삐빅 (교대 반복 비프)
    // 1000-1300Hz square 교대 - 삐빅삐빅!
    // 시작: 삐빅삐빅!  종료: 삐빅삐빅삐빅!
    // ═══════════════════════════════════
    function type7Start() {
        var c = getCtx();
        var t = c.currentTime;
        var vol = volumeLevel * 0.8;
        makeTone(1000, 'square', 0.15, vol, t);
        makeTone(1300, 'square', 0.15, vol, t + 0.2);
        makeTone(1000, 'square', 0.15, vol, t + 0.4);
        makeTone(1300, 'square', 0.15, vol, t + 0.6);
    }
    function type7End() {
        var c = getCtx();
        var t = c.currentTime;
        var vol = volumeLevel * 0.8;
        for (var i = 0; i < 6; i++) {
            makeTone(i % 2 === 0 ? 1000 : 1300, 'square', 0.15, vol, t + i * 0.2);
        }
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
        if (fn) withAudioFocus(fn, 1000);
    }

    function playRoundStart(type) {
        var fn = startFns[type || 1];
        if (fn) withAudioFocus(fn, 1000);
    }

    function playRoundEnd(type) {
        var fn = endFns[type || 1];
        if (fn) withAudioFocus(fn, 2500);
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

    // ── 블루투스 오디오 keep-alive ──
    // BT 스피커가 무음 시 연결 끊기 방지 → 첫 소리 잘림 방지
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
        playBell: playBell,
        playRoundStart: playRoundStart,
        playRoundEnd: playRoundEnd,
        playCountTick: playCountTick,
        startKeepAlive: startKeepAlive,
        stopKeepAlive: stopKeepAlive
    };
})();
