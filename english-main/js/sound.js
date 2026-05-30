// ============================================================
// sound.js — 音效管理器
// ============================================================

const soundManager = {
    audioCtx: null,
    muted: false,
    bgm: null,
    bgmInitialized: false,

    init: function () {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        this.initBGM();
    },

    initBGM: function () {
        if (this.bgmInitialized) return;
        this.bgmInitialized = true;
        
        this.bgm = new Audio("gay.mp3");
        this.bgm.loop = true;
        this.bgm.volume = 0.25; // 適合的背景音樂音量，避免蓋過音效
        
        if (!this.muted) {
            this.bgm.play().catch(err => {
                console.log("BGM 自動播放被瀏覽器阻擋，將在玩家點擊後播放：", err);
            });
        }
    },

    toggleMute: function () {
        this.muted = !this.muted;
        const btn = document.getElementById('mute-btn');
        if (btn) {
            btn.innerText = this.muted ? '🔇 音效: 關' : '🔊 音效: 開';
        }
        if (this.bgm) {
            if (this.muted) {
                this.bgm.pause();
            } else {
                this.bgm.play().catch(err => console.log("BGM 恢復播放失敗：", err));
            }
        }
    },

    playTone: function (freq, type, duration, vol = 0.1) {
        if (this.muted || !this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + duration);
    },

    playNoise: function (duration, vol = 0.1) {
        if (this.muted || !this.audioCtx) return;
        const bufferSize = this.audioCtx.sampleRate * duration;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = this.audioCtx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);
        noise.connect(gain);
        gain.connect(this.audioCtx.destination);
        noise.start();
    },

    shoot: function (type) {
        const map = {
            'sniper':    [600, 'square',   0.15, 0.05],
            'gatling':   [150, 'sawtooth', 0.05, 0.03],
            'nuke':      [100, 'sawtooth', 0.5,  0.05],
            'multishot': [400, 'triangle', 0.1,  0.03],
            'blackhole': [100, 'sine',     0.5,  0.05],
            'railgun':   [800, 'sawtooth', 0.3,  0.08],
            'artillery': [100, 'square',   0.4,  0.05],
            'laser':     [900, 'sine',     0.1,  0.02],
            'doom':      [80,  'sawtooth', 0.6,  0.1],
            'chrono':    [300, 'sine',     0.3,  0.05]
        };
        if (type === 'cannon') {
            this.playNoise(0.2, 0.05);
        } else if (map[type]) {
            this.playTone(...map[type]);
        } else {
            this.playTone(300, 'triangle', 0.1, 0.03);
        }
    },

    explosion: function () {
        this.playNoise(0.3, 0.05);
    },

    build: function () {
        this.playTone(300, 'sine', 0.1, 0.1);
        setTimeout(() => this.playTone(450, 'sine', 0.1, 0.1), 50);
    },

    merge: function () {
        this.playTone(400, 'sine', 0.1, 0.1);
        setTimeout(() => this.playTone(600, 'sine', 0.1, 0.1), 100);
        setTimeout(() => this.playTone(800, 'sine', 0.2, 0.1), 200);
    },

    sell: function () {
        this.playTone(1200, 'sine', 0.15, 0.05);
    },

    startWave: function () {
        this.playTone(150, 'square', 0.4, 0.05);
        setTimeout(() => this.playTone(120, 'square', 0.4, 0.05), 200);
    },

    damage: function () {
        this.playTone(80, 'sawtooth', 0.3, 0.1);
    },

    coin: function () {
        this.playTone(1500, 'sine', 0.1, 0.02);
    },

    warp: function () {
        this.playNoise(1.5, 0.2);
        this.playTone(100, 'sawtooth', 1.5, 0.2);
    }
};

// 在頁面有任何點擊或按鍵互動時，自動初始化音效管理器並播放 BGM
(function() {
    const initOnInteraction = () => {
        soundManager.init();
        document.removeEventListener('click', initOnInteraction);
        document.removeEventListener('keydown', initOnInteraction);
    };
    document.addEventListener('click', initOnInteraction);
    document.addEventListener('keydown', initOnInteraction);
})();
