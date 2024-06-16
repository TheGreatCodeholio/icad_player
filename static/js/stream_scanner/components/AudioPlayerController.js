export class AudioPlayer {
    constructor(audioElementId, queueManager, uiManager, audioDataManager) {
        this.audioPlayerElement = document.getElementById(audioElementId);
        this.queueManager = queueManager;
        this.uiManager = uiManager;
        this.audiodDataManager = audioDataManager;

        this.isPlaying = false
        this.currentAudioData = null;

        // Setting up an event listener for when an audio track ends
        this.audioPlayerElement.addEventListener('ended', () => {
            this.resetAudio();
            this.playNext()
        });

        this.audioPlayerElement.addEventListener('timeupdate', () => {
            const duration = this.audioPlayerElement.duration || 100; // Fallback to 100 if duration is NaN or undefined
            const currentTime = this.audioPlayerElement.currentTime || 100; // Fallback to 100 if currentTime is NaN or undefined

            // Update UI elements through UIManager
            this.uiManager.updateProgressBar(currentTime, duration);
            this.uiManager.updateElapsedTime(currentTime);
            this.uiManager.updateFrequencyAndUnit(currentTime, this.currentAudioData)

        });

    }

    setSource(src) {
        this.audioPlayerElement.src = src;
    }

    playAudio() {
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

    playNext() {
        // Assuming getNext Track in the Queue
        if (!this.isPlaying) {

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

                //Set the Audio Player Source from Call Metadata
                this.setSource(nextTrack.audio_m4a_url);

                // Start Playback
                this.playAudio();
            } else {
                console.log("No tracks in the queue.");
            }
        }
    }

    resetAudio() {
        this.isPlaying = false;
        this.uiManager.toggleActiveCall(false);
        this.uiManager.resetProgressBar();
        this.uiManager.toggleActiveTones(false);
    }

}
