export class AudioPlayer {
    constructor(audioElementId, queueManager, uiManager, audioDataManager) {
        this.audioPlayerElement = document.getElementById(audioElementId);
        this.queueManager = queueManager;
        this.uiManager = uiManager;
        this.audiodDataManager = audioDataManager;

        this.isLiveAudioEnabled = false
        this.isPaused = false
        this.isPlaying = false
        this.currentAudioData = null;
        this.lastReplayedIndex = null;

        // Setting up an event listener for when an audio track ends
        this.audioPlayerElement.addEventListener('ended', () => {
            this.resetAudio();
            this.playNext()
        });

        this.audioPlayerElement.addEventListener('timeupdate', () => {
            const duration = this.audioPlayerElement.duration || 100; // Fallback to 100 if duration is NaN or undefined
            const currentTime = this.audioPlayerElement.currentTime || 100; // Fallback to 100 if currentTime is NaN or undefined
            const segments = this.currentAudioData.transcript.segments; // Assuming `currentAudio` is accessible

            // Update UI elements through UIManager
            this.uiManager.updateProgressBar(currentTime, duration);
            this.uiManager.updateElapsedTime(currentTime);
            this.uiManager.updateSegmentText(currentTime, segments);
            this.uiManager.updateFrequencyAndUnit(currentTime, this.currentAudioData)

        });

    }

    setSource(src) {
        this.audioPlayerElement.src = src;
    }

    play() {
        if (this.audioPlayerElement.src) {
            this.isPaused = false;
            this.isPlaying = true;

            this.audioPlayerElement.play().catch(e => {
                console.error("Error playing audio:", e);
            });
        } else {
            console.log("No audio source set.");
        }
    }

    pause() {
        this.isPaused = true
        this.uiManager.toggleActiveCall(false);
        this.uiManager.toggleActiveTones(false);

        if (this.isPlaying) {
            this.audioPlayerElement.pause();
        }

    }

    unpause() {
        this.isPaused = false;
        this.uiManager.toggleActiveCall(true);
        if (this.audiodDataManager.checkTones(this.currentAudioData)){
            this.uiManager.toggleActiveTones(true);
        }
        if (this.isPlaying) {
            this.audioPlayerElement.play();
        } else {
            this.playNext()
        }
    }

    playNext() {
        // Assuming getNext Track in the Queue
        if (!this.isPlaying) {

            if (this.currentAudioData) {
                this.queueManager.addToPlayedFiles(this.currentAudioData)
            }

            // Get next audio in Queue
            const nextTrack = this.queueManager.getNext();

            //Update Queue length on UI
            this.uiManager.updateQueueCount(this.queueManager.getQueueSize());

            //Reset Metadata Elements Spikes Errors UID
            this.uiManager.resetMetaDataElements();

            if (nextTrack) {
                this.currentAudioData = nextTrack

                //Toggle Active Call Colors Scanner Background and Indicator
                this.uiManager.toggleActiveCall(true);

                if (this.audiodDataManager.checkTones(this.currentAudioData)) {
                    this.uiManager.toggleActiveTones(true);
                }

                //Update Scanner with Call Metadata
                this.uiManager.updateAudioMetaData(nextTrack)

                //Update Last Played List
                this.uiManager.updateLastPlayedFiles(this.queueManager.getPlayedFiles())

                //Set the Audio Player Source from Call Metadata
                this.setSource(nextTrack.audio_m4a_url);

                // Start Playback
                this.play();
            } else {
                console.log("No tracks in the queue.");
            }
        }
    }

    replayAudio() {

        // Make is playing True
        this.isPlaying = true;

        //Reset UI Elements
        this.uiManager.resetProgressBar();
        this.uiManager.resetSegmentText();

        //Toggle Active Call Colors Scanner Background and Indicator
        this.uiManager.toggleActiveCall(true);

        if (this.audiodDataManager.checkTones(this.currentAudioData)) {
            this.uiManager.toggleActiveTones(true);
        }

        //Rewind Audio Player to 0
        this.audioPlayerElement.currentTime = 0;

        //Start playing again.
        this.audioPlayerElement.play()
    }

    resetAudio() {
        this.isPlaying = false;
        this.uiManager.toggleActiveCall(false);
        this.uiManager.resetProgressBar();
        this.uiManager.resetSegmentText();
        this.uiManager.toggleActiveTones(false);
    }

    skipNext() {
        this.resetAudio()
        this.playNext();
    }

    playPrevious() {
        this.replayAudio();
    }

}
