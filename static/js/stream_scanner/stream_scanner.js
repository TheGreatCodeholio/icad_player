// Importing necessary classes
import {io} from "https://cdn.socket.io/4.7.5/socket.io.esm.min.js";
import {QueueManager} from "./components/QueueManager.js";
import {UIManager} from "./components/UIManager.js";
import {SocketManager} from "./components/SocketManager.js";
import {AudioPlayer} from "./components/AudioPlayerController.js";
import {AudioDataManager} from "./components/AudioDataManager.js";

export class Scanner {
    constructor() {
        this.queueManager = new QueueManager();
        this.audioDataManager = new AudioDataManager();
        this.uiManager = new UIManager();
        this.audioPlayer = new AudioPlayer('audio-player', this.queueManager, this.uiManager, this.audioDataManager);
        this.socketManager = new SocketManager({
            io: io,
            onNewAudioCallback: (audioData) => this.onNewAudio(audioData),
            onListenerCountCallback: (listenerData) => this.uiManager.updateListenerCount(listenerData)
        });

        this.initClock();
    }

    initClock() {
        setInterval(this.uiManager.displayTime, 1000)
        this.uiManager.displayTime();
    }

    onNewAudio(audioData) {
        // Handle new audio data received via Socket.IO
        console.log("New Audio File From Socket IO")

        if (audioData.short_name === "bradford-pa") {
            this.queueManager.addToQueue(audioData);

            if (!this.audioPlayer.isPlaying) {
                if (!this.queueManager.isEmpty()) {
                    this.audioPlayer.playNext()
                }

                this.uiManager.updateQueueCount(this.queueManager.getQueueSize())

            }
        }
    }
}