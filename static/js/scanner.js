const listenerCount = document.getElementById('listener_count');
const audioPlayer = document.getElementById('audio-player');
const scannerDisplay = document.getElementById('scanner_display');
const scanButton = document.getElementById('button_1');
const transcriptButton = document.getElementById('button_2');
const holdTgButton = document.getElementById('button_3');
const lastPlayedButton = document.getElementById('button_4');
const avoidButton = document.getElementById('button_6');
const filterButton = document.getElementById('button_9');
const skipButton = document.getElementById('button_5');
const pauseButton = document.getElementById('button_8');

const transcript = document.getElementById('transcript');

const progressBar = document.querySelector('.progress-bar');
const timeLeftDisplay = document.querySelector('.time-left');

let scanlist_name = "All";

let queue = document.getElementById('queue_count');
let queue_count = queue.querySelector("span").nextSibling;

const indicatorLight = document.getElementById('notification_light');

let isLiveAudioEnabled = false;
let isPaused = false;
let isHoldActive = false;

let currentAudio = null;

let talkgroups = [];

let audioQueue = [];
let lastPlayed = [];

let currentFilters = {
    scanlists: [],
    fips: [],
    county: [],
    service_type: [],
    group: []
};

const keypadBeepsUniden = {
    activate: [
        {
            begin: 0,
            end: 0.05,
            frequency: 1200,
            kind: "square",
        },
    ],
    deactivate: [
        {
            begin: 0,
            end: 0.1,
            frequency: 1200,
            kind: "square",
        },
        {
            begin: 0.1,
            end: 0.2,
            frequency: 925,
            kind: "square",
        },
    ],
    denied: [
        {
            begin: 0,
            end: 0.05,
            frequency: 925,
            kind: "square",
        },
        {
            begin: 0.1,
            end: 0.15,
            frequency: 925,
            kind: "square",
        },
    ],
};

let live_talkgroups = []
let held_talkgroup = null;
let avoided_talkgroups = []

let scanListMetadata = null;
let filterMetadata = null;

// Load systems on page load
window.addEventListener('load', function () {
    //fetchFilterData();
    timeLeftDisplay.textContent = `0:00`;

    //const queryParams = new URLSearchParams(window.location.search);
    //currentFilters = buildFilterObject(queryParams);

    //initLiveTalkgroups();
    setInterval(showTime, 1000);
    showTime();
    updateLastPlayedFiles();
    getCookie('avoided_talkgroups');
    loadCookieData();
});

function initLiveTalkgroups() {
    if (currentFilters.scanlists.length > 0) {
        fetchScanLists().then(scanlist_data => {
            live_talkgroups = [];
            if (scanlist_data.length > 0) {
                scanlist_data.forEach(scanList => {
                    scanList.talkgroups.forEach(talkgroup => live_talkgroups.push(talkgroup));
                });
            }
            console.log('Live Talkgroups Length:', live_talkgroups.length);
        });
    }
    fetchTalkgroups().then(talkgroup_data => {
        if (talkgroup_data && Array.isArray(talkgroup_data.result)) {
            console.log('Talkgroup Data:', talkgroup_data.result.length);
            live_talkgroups = [];
            talkgroup_data.result.forEach(talkgroup => {
                if (!currentFilters.scanlist_name) {
                    console.log('scanlist disabled');
                    live_talkgroups.push(talkgroup.talkgroup_decimal);
                }
                talkgroups.push(talkgroup);
            });
        } else {
            console.log('No result in talkgroup data', talkgroup_data);
        }
        console.log('Live Talkgroups Length:', live_talkgroups.length);
    }).catch(error => {
        console.error('Error processing talkgroup data:', error);
    });
}

function fetchFilterData() {
    let scanListUrl = 'api/get-scanlist';
    let filterUrl = 'api/get-talkgroup-metadata';

    Promise.all([
        fetch(scanListUrl).then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok for scan list');
            }
            return response.json();
        }),
        fetch(filterUrl).then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok for filter data');
            }
            return response.json();
        })
    ])
        .then(([scanListData, filterData]) => {
            // Set the global variables
            scanListMetadata = scanListData;
            filterMetadata = filterData.result;

            // Initialize filterMetadata.scanlists if it doesn't exist
            if (!filterMetadata.scanlists) {
                filterMetadata.scanlists = [];
            }

            // Merge scanListMetadata into filterMetadata.scanlists
            filterMetadata.scanlists.push(...scanListMetadata);


            // You can also process the data here as needed
            console.log('Scan List Metadata:', scanListMetadata);
            console.log('Filter Metadata:', filterMetadata);
        })
        .catch(error => {
            console.error('Failed to fetch data:', error);
            // Handle or log the error as needed
        });
}

async function fetchScanLists() {
    let scanLists = currentFilters.scanlists.join(',');
    const url = `api/get-scanlist?scanlist_name=${encodeURIComponent(scanLists)}`;
    return fetch(url).then(response => response.json())
        .catch(error => console.error('Error fetching scan lists:', error));
}

async function fetchTalkgroups() {
    let url = 'api/get-talkgroups';
    if (currentFilters.scanlists.length === 0) {
        const queryString = Object.entries(currentFilters)
            .filter(([key, value]) => key !== 'scanlists' && value.length > 0)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value.join(','))}`)
            .join('&');
        if (queryString) url += `?${queryString}`;
    }
    console.log('Fetching talkgroups:', url);

    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log('API Response:', data);  // Log the raw response
        return data;
    } catch (error) {
        console.error('Error fetching talkgroups:', error);
        throw error;  // Rethrow the error to be caught by the caller
    }
}

function changeFilter(filterType, value, action) {
    // Check if the filterType is valid
    if (!currentFilters.hasOwnProperty(filterType)) {
        console.error(`Invalid filter type: ${filterType}`);
        return;
    }

    const index = currentFilters[filterType.toLowerCase()].indexOf(value.toLowerCase());
    console.log('Index:', index)
    if (action === 'add' && index === -1) {
        // Add the value if it doesn't exist in the array
        currentFilters[filterType.toLowerCase()].push(value.toLowerCase());
    } else if (action === 'remove' && index > -1) {
        // Remove the value if it exists in the array
        currentFilters[filterType.toLowerCase()].splice(index, 1);
    }

    if (filterType === 'scanlists') {
        currentFilters.fips = [];
        currentFilters.county = [];
        currentFilters.group = [];
    }

    if (filterType === 'fips') {
        currentFilters.county = [];
    }

    if (filterType === 'county') {
        currentFilters.fips = [];
    }

    // Update UI labels and reinitialize talkgroups
    updateFilterModal();
    initLiveTalkgroups();
    updateQueue();
}

// Build filter object from query parameters
function buildFilterObject(queryParams) {
    return {
        scanlists: queryParams.has('scanlist') ? queryParams.get('scanlist').split(',') : [],
        fips: queryParams.has('fips') ? queryParams.get('fips').split(',') : [],
        county: queryParams.has('county') ? queryParams.get('county').split(',') : [],
        service_type: queryParams.has('service_type') ? queryParams.get('service_type').split(',') : [],
        group: queryParams.has('group') ? queryParams.get('group').split(',') : []
    };
}

async function playKeypadBeep(beepSequence) {
    const audioContext = new AudioContext();

    for (const beep of beepSequence) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = beep.kind;
        oscillator.frequency.value = beep.frequency;

        gainNode.gain.setValueAtTime(0, beep.begin);
        gainNode.gain.linearRampToValueAtTime(1, beep.begin + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, beep.end);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start(beep.begin);
        oscillator.stop(beep.end);
    }

    await new Promise((resolve) => setTimeout(resolve, beepSequence[beepSequence.length - 1].end * 1000));
}

function isAudioPlaying() {
    return !audioPlayer.paused && !audioPlayer.ended && audioPlayer.currentTime > 0;
}

function isAudioPaused() {
    return audioPlayer.paused && !audioPlayer.ended && audioPlayer.currentTime > 0;
}

function checkLastPlayed(audioData) {
    return lastPlayed.includes(currentAudio);
}

function toggleCallIndicatorLights(active) {
    const action = active ? 'add' : 'remove';
    indicatorLight.classList[action]('scanner_active_call');
    indicatorLight.classList[action === 'add' ? 'remove' : 'add']('scanner_inactive_call');
    scannerDisplay.classList[action]('scanner_display_active_call');
    scannerDisplay.classList[action === 'add' ? 'remove' : 'add']('scanner_display_inactive_call');
}

// Play/Stop/Pause Audio
function playAudio(audioData) {
    currentAudio = audioData;
    toggleCallIndicatorLights(true);
    updateMetaData(audioData);
    audioPlayer.src = audioData.audio_url;
    audioPlayer.play().catch(error => {
        playNextInQueue();
    });
}

function unpauseAudio() {
    toggleCallIndicatorLights(true);
    const indicator = document.getElementById('indicator_8');
    const pauseText = document.getElementById('pause-text');

    indicator.classList.remove('scanner-indicator_enabled');
    indicator.classList.add('scanner-indicator_disabled');
    if (isAudioPaused()) {
        audioPlayer.play();
    }
    isPaused = false;
    pauseText.textContent = 'Pause';
}

function pauseAudio() {
    toggleCallIndicatorLights(false);
    const indicator = document.getElementById('indicator_8');

    const pauseText = document.getElementById('pause-text');
    if (isAudioPlaying()) {
        audioPlayer.pause();
    }
    isPaused = true;
    indicator.classList.remove('scanner-indicator_disabled');
    indicator.classList.add('scanner-indicator_enabled');
    pauseText.textContent = 'Resume';
}

// Queue Functions
function enqueueCurrentAudio(audioData, isLastPlayed) {
    if (isAudioPlaying() && currentAudio && !isLastPlayed) {
        audioQueue.unshift(currentAudio);
    }
}

function playNextInQueue() {
    if (isLiveAudioEnabled && audioQueue.length > 0) {
        let nextAudio = null;

        // If hold is active, find the next audio in the queue that matches the held talkgroup
        if (isHoldActive) {
            while (audioQueue.length > 0 && !nextAudio) {
                let potentialNextAudio = audioQueue.shift();
                if (potentialNextAudio.talkgroup === held_talkgroup) {
                    nextAudio = potentialNextAudio;
                }
            }
        } else {
            // If hold is not active, just play the next audio in the queue
            while (audioQueue.length > 0 && !nextAudio) {
                let potentialNextAudio = audioQueue.shift();
                nextAudio = potentialNextAudio;
                // if (live_talkgroups.includes(potentialNextAudio.talkgroup) && !avoided_talkgroups.includes(potentialNextAudio.talkgroup)) {
                //     nextAudio = potentialNextAudio;
                // }
            }
        }
        // Play the audio if it's found
        if (nextAudio) {
            playAudio(nextAudio);
        }
        updateQueueCount();
    } else {
        audioQueue = [];
        updateQueueCount();
    }
}

function playSelectedLastPlayed(audioData, index) {
    const isCurrentAudioLastPlayed = checkLastPlayed(audioData);
    enqueueCurrentAudio(audioData, isCurrentAudioLastPlayed);
    playAudio(audioData);
    highlightCurrentPlaying(index);
}

function addToLastPlayed(audioData) {
    lastPlayed.unshift(audioData);
    if (lastPlayed.length > 6) {
        lastPlayed.pop();
    }
    updateLastPlayedFiles();

}

function updateLastPlayedFiles() {
    const lastPlayedDiv = document.getElementById('last_played');
    lastPlayedDiv.innerHTML = '';

    for (let i = 0; i < 6; i++) {
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
                    playSelectedLastPlayed(audioData, i);
                } else {
                    playKeypadBeep(keypadBeepsUniden.denied);
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


function highlightCurrentPlaying(index) {
    const lastPlayedItems = document.querySelectorAll('#last_played .row');
    lastPlayedItems.forEach((item, idx) => {
        if (idx === index) {
            item.classList.add('playing'); // Add a class to highlight
        } else {
            item.classList.remove('playing'); // Remove highlight from other items
        }
    });
}

function updateMetaData(audioData) {
    const frequencyMHz = (audioData.freq / 1000000).toFixed(4);
    const tgGroupElement = document.getElementById('tg_group');
    const tgCountyElement = document.getElementById('tg_county');
    const tgServiceTypeElement = document.getElementById('tg_service_type');
    const trID = document.getElementById('tr_id');

    document.getElementById('tg_alpha').innerText = audioData.talkgroup_tag;
    document.getElementById('tg_name').innerText = audioData.talkgroup_description;
    document.getElementById('tg_id').innerText = `TGID: ${audioData.talkgroup}`;

    tgGroupElement.innerText = audioData.talkgroup_group;
    updateMetaDataEventListener(tgGroupElement, 'group', audioData.talkgroup_group);

    //tgCountyElement.innerText = audioData.talkgroup_county;
    //updateMetaDataEventListener(tgCountyElement, 'county', audioData.talkgroup_county);

    tgServiceTypeElement.innerText = audioData.talkgroup_group_tag;
    updateMetaDataEventListener(tgServiceTypeElement, 'service_type', audioData.talkgroup_group_tag);

    document.getElementById('channel_frequency').innerText = `F: ${frequencyMHz} MHz`;
    //document.getElementById('unit_id').innerText = `UID: ${audioData.unit_id}`;
    //document.getElementById('errors_count').innerText = `E: ${audioData.error_count} `;
    //document.getElementById('spike_count').innerText = `S: ${audioData.spike_count}`;
    document.getElementById('call_start_time').innerText = new Date(audioData.start_time * 1000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function updateMetaDataEventListener(element, filterType, value) {
    // Remove any existing event listeners
    element.replaceWith(element.cloneNode(true));

    // Add new event listener
    element = document.getElementById(element.id); // Re-select the element as it was replaced
    element.addEventListener('click', () => {
        changeFilter(filterType, value, 'add');
    });
}

function updateQueue() {
    for (let i = 0; i < audioQueue.length; i++) {
        if (!live_talkgroups.includes(audioQueue[i].talkgroup)) {
            audioQueue.splice(i, 1);
        }
    }
}

function updateQueueCount() {
    queue_count.textContent = audioQueue.length;
}

//Functions for scanlist/Filter Labels Below Display
function formatText(text) {
    return text.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}


function saveAvoidedTalkgroups() {
    const data = JSON.stringify(avoided_talkgroups);
    document.cookie = `avoided_talkgroups=${encodeURIComponent(data)};path=/;max-age=31536000`; // Expires in 1 year
}

function removeAvoidedTalkgroup(talkgroupDecimal) {
    avoided_talkgroups = avoided_talkgroups.filter(tg => tg.talkgroup_decimal !== talkgroupDecimal);
    saveAvoidedTalkgroups();
}

function updateAvoidedTalkgroups() {
    const container = document.getElementById('avoided_talkgroups_container');
    container.innerHTML = ''; // Clear existing labels

    avoided_talkgroups.forEach(talkgroup => {
        if (talkgroup) {
            const label = document.createElement('span');
            label.className = 'badge filter_tag me-2';
            label.innerHTML = `${formatText(talkgroup.talkgroup_alpha_tag)} <i class="fa-solid fa-x clickable"></i>`;

            label.querySelector('.fa-x').addEventListener('click', function (event) {
                event.stopPropagation(); // Prevents triggering any parent event
                removeAvoidedTalkgroup(talkgroup.talkgroup_decimal);
                updateAvoidedTalkgroups(); // Update the display
            });

            container.appendChild(label);
        }
    });
}


function showTime() {
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

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
    return null;
}

function loadCookieData() {
    const data = getCookie('avoided_talkgroups');
    if (data) {
        avoided_talkgroups = JSON.parse(data);
        updateAvoidedTalkgroups(); // Update the display with the loaded data
    }
}

function updateFilterModal() {
    Object.keys(filterMetadata).forEach(type => {
        createFilterAccordian(type);
    });
}

function createFilterAccordian(type) {
    let filterDiv = document.getElementById(`${type}Filter`);
    filterDiv.innerHTML = ''; // Clear existing content

    if (type !== 'scanlists' && type !== 'fips') {
        let allRow = document.createElement('div');
        allRow.className = 'row g-2 mb-2'; // Bootstrap grid row with a gutter
        const allOnCol = document.createElement('div');
        allOnCol.className = 'col-2'; // 4 items per row in medium devices
        const allButton = createToggleAllOnButton(type);
        allOnCol.appendChild(allButton);
        allRow.appendChild(allOnCol);

        const allOffCol = document.createElement('div');
        allOffCol.className = 'col-2';
        const allOffButton = createToggleAllOffButton(type);
        allOffCol.appendChild(allOffButton);
        allRow.appendChild(allOffCol);

        const bufferCol = document.createElement('div');
        bufferCol.className = 'col-8';
        allRow.appendChild(bufferCol);

        filterDiv.appendChild(allRow);
    }


    let row = document.createElement('div');
    row.className = 'row g-2 mb-2'; // Bootstrap grid row with a gutter

    filterMetadata[type].forEach((filter, index) => {
        const col = document.createElement('div');
        col.className = 'col-3'; // 4 items per row in medium devices
        let is_enabled = false;
        let filter_text = 'Unknown';
        if (type === 'scanlists') {
            is_enabled = currentFilters[type].includes(filter.scan_list_name.toLowerCase())
            filter_text = filter.scan_list_name;
        } else {
            is_enabled = currentFilters[type].includes(filter.toLowerCase())
            filter_text = filter;
        }
        const button = createToggleButton(type, filter_text, is_enabled, false);
        col.appendChild(button);
        row.appendChild(col);

        // Create a new row after every 4 items
        if ((index + 1) % 4 === 0) {
            filterDiv.appendChild(row);
            row = document.createElement('div');
            row.className = 'row g-2 mb-2';
        }
    });

    if (filterMetadata[type].length % 4 !== 0) {
        filterDiv.appendChild(row);
    }

}

function createToggleButton(type, text, isEnabled, isSmall = false) {
    const button = document.createElement('button');
    button.className = 'btn btn-sm btn-secondary filter_button';
    if (isSmall) button.classList.add('small');

    let indicator = document.createElement('i');
    indicator.id = `indicator_${type}_${text.toLowerCase()}`;

    if (isEnabled) {
        indicator.classList.add('fas', 'fa-circle', 'scanner-indicator_enabled');
        button.addEventListener('click', function () {
            changeFilter(type, text, 'remove');
        });
    } else {
        button.addEventListener('click', function () {
            changeFilter(type, text, 'add');
        });
        indicator.classList.add('fas', 'fa-circle', 'scanner-indicator_disabled');
    }

    button.appendChild(indicator);
    let textSpan = document.createElement('span');
    textSpan.textContent = text;
    button.appendChild(textSpan);

    return button;
}

function createToggleAllOffButton(service_type) {
    const button = document.createElement('button');
    button.className = 'btn btn-sm btn-secondary filter_button';
    button.addEventListener('click', function () {
        changeFilter(service_type, 'all', 'remove');
        currentFilters[service_type] = [];
        updateFilterModal();
        initLiveTalkgroups();
        updateQueue();
    });
    let textSpan = document.createElement('span');
    textSpan.textContent = 'Off';
    button.appendChild(textSpan);
    return button;
}

function createToggleAllOnButton(service_type) {
    const button = document.createElement('button');
    button.className = 'btn btn-sm btn-secondary filter_button';

    button.addEventListener('click', function () {
        let new_filters = [];
        changeFilter(service_type, 'all', 'add');
        filterMetadata[service_type].forEach(filter => {
            new_filters.push(filter.toLowerCase());
        });
        currentFilters[service_type] = new_filters;
        if (service_type === 'scanlists') {
            currentFilters.fips = [];
            currentFilters.county = [];
            currentFilters.group = [];
        }
        if (service_type === 'fips') {
            currentFilters.county = [];
        }
        if (service_type === 'county') {
            currentFilters.fips = [];
        }
        updateFilterModal();
        initLiveTalkgroups();
        updateQueue();
    });

    let textSpan = document.createElement('span');
    textSpan.textContent = 'On';
    button.appendChild(textSpan);
    return button;
}

function updateFrequencyAndUnit() {
    // Update frequency
    const channelFrequencyElement = document.getElementById('channel_frequency');
    if (currentAudio.freqList && currentAudio.freqList.length > 0) {
        const lastFrequency = currentAudio.freqList[currentAudio.freqList.length - 1].freq;
        const frequencyInMHz = (lastFrequency / 1000000).toFixed(4); // Convert to MHz and format
        channelFrequencyElement.innerHTML = `<span>F: </span>${frequencyInMHz}<span> MHz</span>`;
    }

    // Update unit ID or tag
    const unitIdElement = document.getElementById('unit_id');
    if (currentAudio.srcList && currentAudio.srcList.length > 0) {
        const lastSrc = currentAudio.srcList[currentAudio.srcList.length - 1];
        const unitDisplay = lastSrc.tag.trim() !== "" ? lastSrc.tag : lastSrc.src;
        unitIdElement.innerHTML = `<span>UID: </span>${unitDisplay}`;
    }
}

socket.on('listener_count', function (count) {
    listenerCount.innerHTML = `<i class="fa-solid fa-user"></i>: ${count}`;
});

socket.on('new_audio', function (audioMetadata) {
    if (isLiveAudioEnabled) {
        //console.log('Received new audio file: ');
        const audioData = audioMetadata;
        const avoidedDecimals = new Set(avoided_talkgroups.map(tg => tg.talkgroup_decimal));
        if (!isHoldActive || (isHoldActive && audioData.talkgroup === held_talkgroup)) {
                audioQueue.push(audioData);
                updateQueueCount();

                // Check if the queue has only this new file and the player is idle
                if (audioQueue.length === 1 && !isPaused && !isAudioPlaying()) {
                    playNextInQueue();
                }
            }
        // if (live_talkgroups.includes(audioData.talkgroup) && !avoidedDecimals.has(audioData.talkgroup)) {
        //     //console.log('Adding audio file to queue.');
        //     if (!isHoldActive || (isHoldActive && audioData.talkgroup === held_talkgroup)) {
        //         audioQueue.push(audioData);
        //         updateQueueCount();
        //
        //         // Check if the queue has only this new file and the player is idle
        //         if (audioQueue.length === 1 && !isPaused && !isAudioPlaying()) {
        //             playNextInQueue();
        //         }
        //     }
        // }
    }
});

audioPlayer.addEventListener('ended', function () {
    const segmentSpan = document.getElementById('segment_transcript')
    progressBar.style.width = '100%';
    segmentSpan.textContent = '...'
    timeLeftDisplay.textContent = `0:00`;
    toggleCallIndicatorLights(false);
    const isCurrentAudioLastPlayed = checkLastPlayed(currentAudio);
    if (!isCurrentAudioLastPlayed) {
        addToLastPlayed(currentAudio);
    }
    playNextInQueue();
});

audioPlayer.addEventListener('timeupdate', function () {
    const segmentSpan = document.getElementById('segment_transcript')
    const duration = this.duration || 0; // Fallback to 0 if duration is NaN or null
    const currentTime = this.currentTime || 0; // Fallback to 0 if currentTime is NaN or null
    const progressPercent = (currentTime / duration) * 100;
    progressBar.style.width = progressPercent + '%';

    const remainingTime = duration - currentTime;

    // Calculate remaining time
    if (isNaN(remainingTime) || remainingTime < 0) {
        timeLeftDisplay.textContent = '0:00';
    } else {
        const minutes = Math.floor(remainingTime / 60);
        let seconds = Math.floor(remainingTime % 60);
        seconds = seconds < 10 ? '0' + seconds : seconds; // Add leading zero if needed

        // Update the time display
        timeLeftDisplay.textContent = `${minutes}:${seconds}`;
    }

    // Display segment text
    const segments = currentAudio.transcript.segments;
    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        if (currentTime >= segment.start && currentTime <= segment.end) {
            segmentSpan.textContent = segment.text;
            break; // Exit the loop once the matching segment is found
        }
    }
    updateFrequencyAndUnit();
});

scanButton.addEventListener('click', () => {
    const indicator = document.getElementById('indicator_1');
    if (!isLiveAudioEnabled) {
        playKeypadBeep(keypadBeepsUniden.activate);

        indicator.classList.remove('scanner-indicator_disabled');
        indicator.classList.add('scanner-indicator_enabled');
        isLiveAudioEnabled = true;
        audioPlayer.play();
        playNextInQueue();
    } else {
        playKeypadBeep(keypadBeepsUniden.deactivate);
        indicator.classList.remove('scanner-indicator_enabled');
        indicator.classList.add('scanner-indicator_disabled');
        isLiveAudioEnabled = false;
    }
});

pauseButton.addEventListener('click', () => {
    if (isLiveAudioEnabled) {
        if (!isPaused) {
            pauseAudio();
            isPaused = true;
        } else {
            unpauseAudio(); // Play the denied beep
            isPaused = false;
        }
    } else {
        playKeypadBeep(keypadBeepsUniden.denied); // Play the denied beep
    }
});

skipButton.addEventListener('click', () => {
    // Check if live audio enabled
    if (isLiveAudioEnabled) {
        playKeypadBeep(keypadBeepsUniden.activate);
        // Check if there is an audio file currently playing or paused
        if (isAudioPlaying() || isAudioPaused()) {
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
            if (isAudioPaused()) {
                const indicator = document.getElementById('indicator_8');
                const pauseText = document.getElementById('pause-text');

                indicator.classList.remove('scanner-indicator_enabled');
                indicator.classList.add('scanner-indicator_disabled');
                isPaused = false;
                pauseText.textContent = 'Pause';
            }
        }
        addToLastPlayed(currentAudio)
        if (audioQueue.length > 0) {
            playNextInQueue();
        }
    } else {
        console.log('No audio playing or empty queue.');
        playKeypadBeep(keypadBeepsUniden.denied); // Play the denied beep
    }
});

avoidButton.addEventListener('click', () => {
    if (!isHoldActive && isLiveAudioEnabled && currentAudio) {
        let current_talkgroup_decimal = currentAudio.talkgroup_decimal;
        let current_talkgroup_tag = currentAudio.talkgroup_alpha_tag;
        if (current_talkgroup_decimal && current_talkgroup_tag) {
            console.log('Avoiding talkgroup:', current_talkgroup_decimal);
            let talkgroup_data = {
                "talkgroup_decimal": current_talkgroup_decimal,
                "talkgroup_alpha_tag": current_talkgroup_tag
            }
            avoided_talkgroups.push(talkgroup_data);
            saveAvoidedTalkgroups();
            updateAvoidedTalkgroups();

            console.log('Updated Avoided Talkgroups:', avoided_talkgroups);
        } else {
            playKeypadBeep(keypadBeepsUniden.denied); // Play the denied beep
        }
    } else {
        playKeypadBeep(keypadBeepsUniden.denied); // Play the denied beep
    }

});

holdTgButton.addEventListener('click', () => {
    const indicator = document.getElementById('indicator_3');
    const holdText = document.getElementById('hold-text');
    let current_talkgroup_decimal = currentAudio.talkgroup_decimal;
    const holdTgIndicator = document.getElementById('hold_tg');
    if (current_talkgroup_decimal) {
        if (isHoldActive) {
            holdTgIndicator.innerText = '';
            indicator.classList.remove('scanner-indicator_enabled');
            indicator.classList.add('scanner-indicator_disabled');
            isHoldActive = false;
            held_talkgroup = [];
            holdText.innerText = 'Hold Talkgroup'; // Update button text or state
        } else {
            // If hold is not active, hold only the current talkgroup
            holdTgIndicator.innerText = "TG HOLD"
            holdTgIndicator.style.color = "#bebeae";
            holdTgIndicator.style.background = "#2d2d2d";
            indicator.classList.remove('scanner-indicator_disabled');
            indicator.classList.add('scanner-indicator_enabled');
            held_talkgroup = current_talkgroup_decimal;
            isHoldActive = true;
            holdText.innerText = 'Unhold'; // Update button text or state
        }
        console.log('Updated live talkgroups:', live_talkgroups);
    } else {
        playKeypadBeep(keypadBeepsUniden.denied); // Play the denied beep
    }


});

lastPlayedButton.addEventListener('click', () => {
    if (lastPlayed.length > 0) {
        enqueueCurrentAudio(currentAudio, false);
        playSelectedLastPlayed(lastPlayed[0], 0);
    }
});

filterButton.addEventListener('click', () => {
    updateFilterModal();
});

transcriptButton.addEventListener('click', function () {
    const indicator = document.getElementById('indicator_2');

    transcript.classList.toggle('open');

    if (transcript.classList.contains('open')) {
        indicator.classList.remove('scanner-indicator_disabled');
        indicator.classList.add('scanner-indicator_enabled');
    } else {
        indicator.classList.remove('scanner-indicator_enabled');
        indicator.classList.add('scanner-indicator_disabled');
    }
});