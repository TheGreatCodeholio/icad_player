// Importing necessary classes
import {io} from "https://cdn.socket.io/4.7.5/socket.io.esm.min.js";
import {AudioPlayer} from './components/AudioPlayerController.js';
import {KeypadBeepPlayer} from "./components/KeypadBeepController.js";
import {QueueManager} from './components/QueueManager.js';
import {UIManager} from './components/UIManager.js';
import {SocketManager} from './components/SocketManager.js'; // Assumes you have a class to handle Socket.IO interactions
import {AudioDataManager} from './components/AudioDataManager.js';
export class Scanner {
    constructor() {
        this.queueManager = new QueueManager();
        this.KeyPadBeep = new KeypadBeepPlayer();
        this.uiManager = new UIManager({
            onPlayLastSelected: (audioData, index) => audioPlayer.playLast(audioData, index),
            onPlayDeniedBeep: () => this.KeyPadBeep.playBeep('denied')
        });
        this.audioDataManager = new AudioDataManager();
        this.uiManager.updateLastPlayedFiles([])
        this.audioPlayer = new AudioPlayer('audio-player', this.queueManager, this.uiManager, this.audioDataManager);
        this.socketManager = new SocketManager({
            io: io,
            onNewAudioCallback: (audioData) => this.onNewAudio(audioData),
            onListenerCountCallback: (listenerData) => this.uiManager.updateListenerCount(listenerData)
        });

        this.initButtons();
        this.initClock();
    }

    initButtons() {
        // Attach event listener to the scan button
        document.getElementById('scanButton').addEventListener('click', () => {
            this.toggleLiveAudio();
        });

        // Attach event listener to the pause button
        document.getElementById('pauseButton').addEventListener('click', () => {
            this.togglePause();
        });

        // Attach event listener to the skip button
        document.getElementById('skipNextButton').addEventListener('click', () => {
            this.skipAudio();
        });

        // Attach event listener to the avoid button
        document.getElementById('avoidButton').addEventListener('click', () => {
            this.avoidTalkgroup();
        });

        // Attach event listener to the hold TG button
        document.getElementById('holdTgButton').addEventListener('click', () => {
            this.toggleHoldTalkgroup();
        });

        // Attach event listener to the play last button
        document.getElementById('replayLastButton').addEventListener('click', () => {
            this.playLastPlayed();
        });

        // Attach event listener to the filter button
        document.getElementById('filterButton').addEventListener('click', () => {
            this.showFilterModal();
        });

        // Attach event listener to the transcript button
        document.getElementById('transcriptButton').addEventListener('click', () => {
            this.toggleTranscript();
        });
    }

    initClock() {
        setInterval(this.uiManager.displayTime, 1000)
        this.uiManager.displayTime();
    }

    toggleLiveAudio() {
        console.log('Toggle Live Audio')
        // Logic to enable/disable live audio
        if (!this.audioPlayer.isLiveAudioEnabled) {
            this.KeyPadBeep.playBeep('activate');
            this.uiManager.toggleButtonIndicatorAndText({
                indicatorId: 'scanButton_indicator',
                isActive: true,
                textElementId: null,
                elementText: null
            });

            this.audioPlayer.isLiveAudioEnabled = true;

            this.audioPlayer.playNext();
        } else {
            this.KeyPadBeep.playBeep('deactivate');
            this.uiManager.toggleButtonIndicatorAndText({
                indicatorId: 'scanButton_indicator',
                isActive: false,
                textElementId: null,
                elementText: null
            });

            this.audioPlayer.isLiveAudioEnabled = false;
        }
    }

    togglePause() {
        // Logic to pause/unpause audio
        console.log('Toggle Pause')
        if (this.audioPlayer.isLiveAudioEnabled) {
            if (this.audioPlayer.isPaused) {
                this.uiManager.toggleButtonIndicatorAndText({
                    indicatorId: 'pauseButton_indicator',
                    isActive: false,
                    textElementId: 'pause-text',
                    elementText: 'Pause'
                });
                this.audioPlayer.unpause()
            } else {
                this.uiManager.toggleButtonIndicatorAndText({
                    indicatorId: 'pauseButton_indicator',
                    isActive: true,
                    textElementId: 'pause-text',
                    elementText: 'Resume'
                });
                this.audioPlayer.pause()
            }
        } else {
            this.KeyPadBeep.playBeep('denied');
        }


    }

    skipAudio() {
        console.log('Skip Audio')
        // Logic to skip current audio
        if (this.audioPlayer.isLiveAudioEnabled) {
            this.audioPlayer.skipNext()
        } else {
            this.KeyPadBeep.playBeep('denied');
        }

    }

    avoidTalkgroup() {
        console.log('Avoid Talkgroup')
        // Logic to avoid current talkgroup
        this.KeyPadBeep.playBeep('denied');
    }

    toggleHoldTalkgroup() {
        console.log('Hold Talkgroup')
        // Logic to hold/unhold talkgroup
        this.KeyPadBeep.playBeep('denied');
    }

    playLastPlayed() {
        console.log('Play Last Played')
        // Logic to play last played audio
        if (this.audioPlayer.currentAudioData && this.audioPlayer.isLiveAudioEnabled) {
            this.audioPlayer.playPrevious()
        } else {
            this.KeyPadBeep.playBeep('denied');
        }
    }

    showFilterModal() {
        console.log('Show Filter Modal')
        // Logic to update filter modal
        this.KeyPadBeep.playBeep('denied');
    }

    toggleTranscript() {
        console.log('Toggle Transcript')
        // Logic to toggle transcript visibility
        this.uiManager.toggleTranscript();

    }

    onNewAudio(audioData) {
        // Handle new audio data received via Socket.IO
        console.log("New Audio File From Socket IO")

        if (this.audioPlayer.isLiveAudioEnabled) {
            // Add Audio To Play Queue
            this.queueManager.addToQueue(audioData);

            if (!this.audioPlayer.isPlaying) {
                if (!this.queueManager.isEmpty() && !this.audioPlayer.isPaused) {
                    this.audioPlayer.playNext()
                } else if (this.audioPlayer.isPaused) {
                    this.uiManager.updateQueueCount(this.queueManager.getQueueSize())
                }
            }
        }
    }
}

// document.addEventListener('DOMContentLoaded', () => {
//     // Initialize the application once the DOM is fully loaded
//     const app = new Scanner();
//
//     // If there are any actions you need to perform right after the app starts, you can do them here.
//     // For example, if you want to automatically load some initial data or check the state of certain resources.
//
//     // app.initialize() or similar initialization methods could be called here if you've defined them in your App class.
//     // This is also a good place to register service workers, set up global event listeners, or handle routing if needed.
// });