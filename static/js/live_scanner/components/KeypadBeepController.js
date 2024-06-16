export class KeypadBeepPlayer {
    constructor() {
        this.keypadBeepsUniden = {
            activate: [
                {begin: 0, end: 0.05, frequency: 1200, kind: "square"},
            ],
            deactivate: [
                {begin: 0, end: 0.1, frequency: 1200, kind: "square"},
                {begin: 0.1, end: 0.2, frequency: 925, kind: "square"},
            ],
            denied: [
                {begin: 0, end: 0.05, frequency: 925, kind: "square"},
                {begin: 0.1, end: 0.15, frequency: 925, kind: "square"},
            ],
        };
    }

    playBeep(type) {
        const beepSequence = this.keypadBeepsUniden[type];
        if (!beepSequence) {
            console.error('Beep type not recognized:', type);
            return;
        }

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        beepSequence.forEach(beep => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.type = beep.kind;
            oscillator.frequency.setValueAtTime(beep.frequency, audioContext.currentTime + beep.begin);

            gainNode.gain.setValueAtTime(0, audioContext.currentTime + beep.begin);
            gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime + beep.begin + 0.01);
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + beep.end);

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.start(audioContext.currentTime + beep.begin);
            oscillator.stop(audioContext.currentTime + beep.end);
        });
    }
}