export class UIManager {
    constructor({onPlayLastSelected, onPlayDeniedBeep}) {
        // Initialize UI elements by IDs
        this.scannerDisplay = document.getElementById('scanner_display');
        this.indicatorLight = document.getElementById('notification_light');
        this.toneIndicator = document.getElementById('tones_light')
        this.listenerCount = document.getElementById('listener_count');
        this.queueCount = document.getElementById('queue_count');
        this.channelFrequencyElement = document.getElementById('channel_frequency');
        this.errorsCountElement = document.getElementById('errors_count');
        this.spikeCountElement = document.getElementById('spike_count');
        this.unitIdElement = document.getElementById('unit_id');
        this.transcriptContainer = document.getElementById('transcriptContainer');
        this.segmentSpan = document.getElementById('segment_transcript');
        this.progressBar = document.querySelector('.progress-bar');
        this.timeLeftDisplay = document.querySelector('.time-left');
        this.onPlayLastSelected = onPlayLastSelected;
        this.onPlayDeniedBeep = onPlayDeniedBeep;
    }

    updateListenerCount(count) {
        if (this.listenerCount) {
            this.listenerCount.innerHTML = `<span><i
                                            class="fa-solid fa-user"></i>: </span>${count}`;
        }
    }

    updateQueueCount(count) {
        if (this.queueCount) {
            this.queueCount.innerHTML = `<span><i
                                            class="fa-sharp fa-solid fa-walkie-talkie"></i>: </span>${count}`;
        }
    }

    updateAudioMetaData(currentAudioData) {
        // Helper function to set text content by element ID
        const setTextContentById = (elementId, text) => {
            const element = document.getElementById(elementId);
            if (element) element.textContent = text;
        };

        // Convert frequency to MHz and format
        const frequencyMHz = (currentAudioData.freq / 1000000).toFixed(4) + ' MHz';

        //update System Information
        setTextContentById('system_name', currentAudioData.short_name)

        // Update talkgroup information
        setTextContentById('tg_alpha', currentAudioData.talkgroup_tag);
        setTextContentById('tg_name', currentAudioData.talkgroup_description);
        setTextContentById('tg_id', `TGID: ${currentAudioData.talkgroup}`);

        // Update group and service type
        setTextContentById('tg_group', currentAudioData.talkgroup_group);
        setTextContentById('tg_service_type', currentAudioData.talkgroup_group_tag);

        // Update frequency
        setTextContentById('channel_frequency', `F: ${frequencyMHz}`);

        // Format and update start time
        const formattedStartTime = new Date(currentAudioData.start_time * 1000).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        setTextContentById('call_start_time', formattedStartTime);

    }

    updateFrequencyAndUnit(currentTime, currentAudioData) {
        // Update frequency, spike, errors and Unit UI

        if (currentAudioData.freqList && currentAudioData.freqList.length > 0) {
            // Find the active frequency entry based on the current playback time
            const activeFrequency = currentAudioData.freqList.find(freq =>
                currentTime >= freq.pos && currentTime <= (freq.pos + freq.len)
            );

            if (activeFrequency) {
                // Update frequency
                const frequencyInMHz = (activeFrequency.freq / 1000000).toFixed(4); // Convert to MHz and format
                this.channelFrequencyElement.innerHTML = `F: ${frequencyInMHz} MHz`;

                // Update error and spike counts
                this.errorsCountElement.innerHTML = `E: ${activeFrequency.error_count} &nbsp`;
                this.spikeCountElement.innerHTML = `S: ${activeFrequency.spike_count}`;
            }
        }

        // Update unit ID or tag
        if (currentAudioData.srcList && currentAudioData.srcList.length > 0) {
            const sortedSrcList = currentAudioData.srcList.sort((a, b) => a.pos - b.pos);

            // Find the active src entry
            let activeSrc = sortedSrcList.find((src, index) => {
                const nextSrc = sortedSrcList[index + 1];
                return currentTime >= src.pos && (!nextSrc || currentTime < nextSrc.pos);
            });

            if (activeSrc) {
                const unitDisplay = activeSrc.tag.trim() !== "" ? activeSrc.tag : activeSrc.src;
                this.unitIdElement.textContent = `UID: ${unitDisplay}`;
            }
        }
    }

    resetMetaDataElements() {
        this.unitIdElement.innerHTML = `UID: 0`
        this.errorsCountElement.innerHTML = `E: 0 &nbsp`;
        this.spikeCountElement.innerHTML = `S: 0`;
    }

    updateProgressBar(currentTime, duration) {
        this.progressBar.style.display = 'flex'
        const progressPercent = (currentTime / duration) * 100;
        this.progressBar.style.width = `${progressPercent}%`;
    }

    resetProgressBar() {
        this.progressBar.style.width = `0%`;
        this.timeLeftDisplay.textContent = '0:00'
        this.timeLeftDisplay.style.color = '#1f1f1f'
        this.progressBar.style.display = 'none'
    }

    updateElapsedTime(currentTime) {
        let timeText = '0:00';
        this.timeLeftDisplay.style.color = '#b7c2c0'

        if (!isNaN(currentTime) && currentTime >= 0) {
            const minutes = Math.floor(currentTime / 60);
            let seconds = Math.floor(currentTime % 60);
            seconds = seconds < 10 ? '0' + seconds : seconds;
            timeText = `${minutes}:${seconds}`;
        }

        this.timeLeftDisplay.textContent = timeText;
    }

    updateRemainingTime(currentTime, duration) {
        const remainingTime = duration - currentTime;
        let timeText = '0:00';

        if (!isNaN(remainingTime) && remainingTime >= 0) {
            const minutes = Math.floor(remainingTime / 60);
            let seconds = Math.floor(remainingTime % 60);
            seconds = seconds < 10 ? '0' + seconds : seconds;
            timeText = `${minutes}:${seconds}`;
        }

        this.timeLeftDisplay.textContent = timeText;
    }

    updateSegmentText(currentTime, segments) {
        for (let segment of segments) {
            if (currentTime >= segment.start && currentTime <= segment.end) {
                this.segmentSpan.textContent = segment.text;
                break;
            }
        }
    }

    resetSegmentText() {
        this.segmentSpan.textContent = '...'
    }

    updateLastPlayedFiles(lastPlayed) {
        const lastPlayedDiv = document.getElementById('last_played');
        lastPlayedDiv.innerHTML = '';

        for (let i = 0; i < 5; i++) {
            const newRow = document.createElement('div');
            newRow.className = 'row mb-1 last_played_item';

            if (i < lastPlayed.length) {
                const audioData = lastPlayed[i];
                newRow.innerHTML = `
                <div class="col-3">
                    <p class="text-center audio_list_text" data-bs-toggle="tooltip" data-bs-placement="top" title="${new Date(audioData.start_time * 1000).toLocaleTimeString()}"><i class="fa-solid fa-play"></i> ${new Date(audioData.start_time * 1000).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                })}</p>
                </div>
                <div class="col-3">
                    <p class="text-center audio_list_text" data-bs-toggle="tooltip" data-bs-placement="top" title="${audioData.talkgroup_description}">${audioData.talkgroup_description}</p>
                </div>
                <div class="col-3">
                    <p class="text-center audio_list_text" data-bs-toggle="tooltip" data-bs-placement="top" title="${audioData.talkgroup_group}">${audioData.talkgroup_group}</p>
                </div>
                <div class="col-3">
                    <p class="text-center audio_list_text" data-bs-toggle="tooltip" data-bs-placement="top" title="${audioData.talkgroup_group_tag}">${audioData.talkgroup_group_tag}</p>
                </div>
                <hr style="color: #2d2d2d; margin: 0 0 0 0;">
            `;
                newRow.addEventListener('click', function () {
                    if (!isAudioPaused()) {
                        console.log("Play Selected Last Played")
                    } else {
                        this.onPlayDeniedBeep();
                    }
                });
            } else {
                newRow.innerHTML = `
                <div class="col-3">
                    <p class="text-center audio_list_text">&nbsp;</p>
                </div>
                <div class="col-3">
                    <p class="text-center audio_list_text">&nbsp;</p>
                </div>
                <div class="col-3">
                    <p class="text-center audio_list_text">&nbsp;</p>
                </div>
                <div class="col-3">
                    <p class="text-center audio_list_text">&nbsp;</p>
                </div>
                <hr style="color: #2d2d2d; margin: 0 0 0 0;">
            `;
            }
            lastPlayedDiv.appendChild(newRow);
        }
    }

    toggleButtonIndicatorAndText({indicatorId, isActive, textElementId, elementText}) {
        const indicator = document.getElementById(indicatorId);
        let textElement;

        if (textElementId) {
            textElement = document.getElementById(textElementId);
        }

        // Toggle the indicator classes based on isActive flag
        if (isActive) {
            indicator.classList.add('scanner-indicator_enabled');
            indicator.classList.remove('scanner-indicator_disabled');
        } else {
            indicator.classList.remove('scanner-indicator_enabled');
            indicator.classList.add('scanner-indicator_disabled');
        }

        if (textElement && elementText !== undefined) {
            textElement.innerText = elementText;
        }
    }

    displayTime() {
        // Get the current time
        const now = new Date();

        // Get the hours, minutes, and seconds
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');

        // Determine whether it's AM or PM
        const amPm = hours >= 12 ? 'PM' : 'AM';

        // Convert 24-hour format to 12-hour format
        hours = hours % 12;
        hours = hours ? hours : 12; // If hour is 0, set it to 12
        hours = hours.toString().padStart(2, '0');

        // Display the time on the page
        const timeElement = document.getElementById('24_hr_clock');
        timeElement.textContent = `${hours}:${minutes}:${seconds} ${amPm}`;
    }

    toggleTranscript() {

        this.transcriptContainer.classList.toggle('open');

        if (this.transcriptContainer.classList.contains('open')) {
            console.log('Toggle Transcript On')
            this.toggleButtonIndicatorAndText({
                indicatorId: 'transcriptButton_indicator',
                isActive: true,
                textElementId: null,
                elementText: null
            });
        } else {
            console.log('Toggle Transcript Off')
            this.toggleButtonIndicatorAndText({
                indicatorId: 'transcriptButton_indicator',
                isActive: false,
                textElementId: null,
                elementText: null
            })
        }
    }

    toggleActiveCall(active) {
        const action = active ? 'add' : 'remove';
        this.indicatorLight.classList[action]('scanner_notification_active_call');
        this.indicatorLight.classList[action === 'add' ? 'remove' : 'add']('scanner_notification_inactive_call');
        this.scannerDisplay.classList[action]('scanner_display_active_call');
        this.scannerDisplay.classList[action === 'add' ? 'remove' : 'add']('scanner_display_inactive_call');
    }

    toggleActiveTones(active) {
        const action = active ? 'add' : 'remove';
        this.toneIndicator.classList[action]('scanner_notification_active_call_tones');
        this.toneIndicator.classList[action === 'add' ? 'remove' : 'add']('scanner_notification_inactive_call_tones');
        this.toneIndicator.classList[action]('fa-fade');
    }
}