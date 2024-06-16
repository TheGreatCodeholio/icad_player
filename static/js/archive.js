const audioArchiveButton = document.getElementById('button_7');
const archiveCloseButton = document.getElementById('archive_close');
const audioArchiveElement = document.getElementById('archive-player');

const itemsPerPageSelect = document.getElementById('items_per_page_select')

// Archive File Download Elements
const toggleSwitch = document.querySelector('#download_toggle');

// Archive Pagination Elements
const beginningLink = document.getElementById('beginning');
const previousLink = document.getElementById('previous');
const nextLink = document.getElementById('next');
const endLink = document.getElementById('end');

// Archive Filter Elements
const talkgroupSelect = document.getElementById('talkgroup_select');
const talkgroupServiceSelect = document.getElementById('talkgroup_service_select');
const toneDetectionSelect = document.getElementById('tone_select');
const transmissionStartDate = document.getElementById('start_date');

let archivePageAudio = [];
let archivePage = 1;
let archiveTotalPages = 0;
let archivePerPageOptions = [10, 20, 50, 100]; // Options for items per page
let archivePerPage = archivePerPageOptions[0]; // Start with 10 items per page

let counties = null;

let archiveFilters = {
    start_date: Math.floor(new Date().setDate(new Date().getDate() - 1) / 1000),
    end_date: Math.floor(new Date().getTime() / 1000),
    service_type: [],
    talkgroup: [],
    group: [],
    fips: [],
    county: []

}

let isArchivePlaying = false;

function updateArchiveDisplay(transmissions) {
    const transmissionList = document.getElementById('transmission_list');
    transmissionList.innerHTML = ''; // Clear existing rows

    transmissions.forEach(transmission => {
        const row = document.createElement('tr');
        row.className = 'archive_line';
        row.innerHTML = `
            <td>
                <i class="playButton fa-solid fa-play" data-src="${transmission.audio_path}"></i>
            </td>
            <td>${formatDate(transmission.transmission_time_stamp)}</td>
            <td>${formatTime(transmission.transmission_time_stamp)}</td>
            <td class="county_click">${transmission.talkgroup_county}</td>
            <td>${transmission.talkgroup_alpha_tag}</td>
            <td>${transmission.talkgroup_name}</td>
        `;

        transmissionList.appendChild(row);
    });
    const playButtons = document.querySelectorAll('.playButton');
    playButtons.forEach(button => {
        button.addEventListener('click', () => togglePlay(button));
    });
    const countyClicks = document.querySelectorAll('.county_click');
    countyClicks.forEach(click => {
        click.addEventListener('click', () => {
            countySelectChange(click.textContent);
        });
    });
}

function togglePlay(button) {

    if (isArchivePlaying) {
        audioArchiveElement.pause();
        isArchivePlaying = false;
        button.classList.remove('fa-pause');
        button.classList.add('fa-play')
    } else {
        audioArchiveElement.src = button.getAttribute("data-src");
        audioArchiveElement.play();
        isArchivePlaying = true;
        button.classList.remove('fa-play');
        button.classList.add('fa-pause')
    }
}
function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
}

function formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString();
}

function changePage(newPage) {
    if (newPage < 1 || newPage > archiveTotalPages) return;
    archivePage = newPage;
    fetchRadioTransmissions(archiveFilters, archivePage, archivePerPage);
}

function fetchFilterOptions() {
    let shouldFetchTalkgroups = ['group', 'county', 'service_type'].some(key => archiveFilters.hasOwnProperty(key) && archiveFilters[key].length > 0);

    // Construct the query parameters
    const queryParams = new URLSearchParams();
    for (const key in archiveFilters) {
        if (key !== 'start_date' && key !== 'end_date') {
            if (archiveFilters[key] && (!Array.isArray(archiveFilters[key]) || archiveFilters[key].length > 0)) {
                const value = Array.isArray(archiveFilters[key]) ? archiveFilters[key].join(',') : archiveFilters[key];
                queryParams.append(key, value);
            }
        }
    }

    let url = 'api/get-talkgroups';
    const queryString = queryParams.toString();
    if (queryString) {
        url += '?' + queryString;
    }

    console.log(url); // For debugging

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (!shouldFetchTalkgroups) {
                if (counties === null){
                    counties = new Set();
                    data.result.forEach(item => {
                    if (item.talkgroup_county) {
                        counties.add(item.talkgroup_county);
                    }
                });
                updateSelectElement('county_select', counties, archiveFilters.county);
                }
            }
            populateFilterOptions(data.result, shouldFetchTalkgroups);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function populateFilterOptions(talkgroups, includeTalkgroups = false) {
    let groups = new Set();
    let serviceTypes = new Set();
    let talkgroupOptions = [];

    talkgroups.forEach(tg => {
        if (tg.talkgroup_group) groups.add(tg.talkgroup_group);
        if (tg.talkgroup_service_type) serviceTypes.add(tg.talkgroup_service_type);
        if (includeTalkgroups && tg.talkgroup_decimal) {
            talkgroupOptions.push({
                name: tg.talkgroup_name,
                decimal: tg.talkgroup_decimal
            });
        }
    });

    // Update the filter options
    updateSelectElement('group_select', groups, archiveFilters.group);
    updateSelectElement('service_type_select', serviceTypes, archiveFilters.service_type);
    if (includeTalkgroups) {
        updateTalkgroupSelect('talkgroup_decimal_select', talkgroupOptions, archiveFilters.talkgroup);
    } else {
        updateTalkgroupSelect('talkgroup_decimal_select', [], null);
    }
}


function updateSelectElement(selectId, options, selectedValue, isNumeric = false) {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">Select ' + selectId.split('_')[0].charAt(0).toUpperCase() + selectId.split('_')[0].slice(1) + '</option>';
    Array.from(options).sort(isNumeric ? (a, b) => a - b : undefined).forEach(option => {
        const isSelected = option === selectedValue ? ' selected' : '';
        select.innerHTML += `<option value="${option}"${isSelected}>${option}</option>`;
    });
}

function updateTalkgroupSelect(selectId, options, selectedValue) {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">Select Talkgroup</option>';
    options.forEach(option => {
        const isSelected = option.decimal === archiveFilters.talkgroup ? ' selected' : '';
        select.innerHTML += `<option value="${option.decimal}"${isSelected}>${option.name}</option>`;
    });
}

function updateFiltersAndTransmissions() {
    // Update the archiveFilters object based on the current selections
    archiveFilters.county = document.getElementById('county_select').value;
    archiveFilters.group = document.getElementById('group_select').value;
    archiveFilters.service_type = document.getElementById('service_type_select').value;
    archiveFilters.talkgroup = document.getElementById('talkgroup_decimal_select').value;

    // Convert start and end dates to epoch time
    const startDate = document.getElementById('start_date').value;
    const endDate = document.getElementById('end_date').value;
    archiveFilters.start_date = startDate ? new Date(startDate).getTime() / 1000 : null;
    archiveFilters.end_date = endDate ? new Date(endDate).getTime() / 1000 : null;

    // Reset the current page to 1 when filters change
    archivePage = 1;

    console.log(archiveFilters); // For debugging

    // Fetch and display the transmissions based on the updated filters
    fetchRadioTransmissions(archiveFilters, archivePage, archivePerPage);

    // Re-fetch filter options
    fetchFilterOptions();
}

function setDefaultDateFilters() {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

    document.getElementById('start_date').value = formatDateForInput(oneDayAgo);
    document.getElementById('end_date').value = formatDateForInput(now);
}

function formatDateForInput(date) {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().slice(0, 16); // Format to 'YYYY-MM-DDTHH:mm'
}

function fetchRadioTransmissions(filters = {}, page = 1, perPage = archivePerPage) {
    // Add pagination parameters
    filters.page = page;
    filters.perPage = perPage;

    // Construct the query parameters
    const queryParams = new URLSearchParams();
    for (const key in filters) {
        // Check if the filter value is not null, not an empty string, not undefined, and not an empty array
        if (filters[key] && (!Array.isArray(filters[key]) || filters[key].length > 0)) {
            // If the filter is an array, join its elements with a comma
            const value = Array.isArray(filters[key]) ? filters[key].join(',') : filters[key];
            queryParams.append(key, value);
        }
    }

    // Construct the URL with query parameters
    let url = 'api/get-radio-transmissions';
    const queryString = queryParams.toString();
    if (queryString) {
        url += '?' + queryString;
    }
    console.log(url); // For debugging

    // Make the fetch request
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            updateArchiveDisplay(data.transmissions); // Assuming data.transmissions is the array of transmissions
            archiveTotalPages = data.totalPages; // Assuming data.totalPages gives the total number of pages
            archivePage = page;
            updatePaginationControls();
        })
        .catch(error => {
            console.error('Error:', error);
        });
}


function updatePaginationControls() {
    beginningLink.disabled = archivePage === 1;
    previousLink.disabled = archivePage === 1;
    nextLink.disabled = archivePage === archiveTotalPages;
    endLink.disabled = archivePage === archiveTotalPages;

    // Update current page display
    document.getElementById('current_page').textContent = `Page ${archivePage} of ${archiveTotalPages}`;
}

audioArchiveButton.addEventListener("click", function () {
    document.getElementById("scanner").classList.add("d-none");
    document.getElementById("archive").classList.remove("d-none");
    if (isLiveAudioEnabled) {
        if (isAudioPlaying()) {
            enqueueCurrentAudio(currentAudio, false);
        }
        if (!isPaused) {
            pauseAudio();
        }
    }
    itemsPerPageSelect.value = archivePerPage.toString();
    setDefaultDateFilters();
    fetchRadioTransmissions(archiveFilters, 1, archivePerPage);
    fetchFilterOptions();
});

archiveCloseButton.addEventListener('click', function () {
    document.getElementById("scanner").classList.remove("d-none");
    document.getElementById("archive").classList.add("d-none");
    audioArchiveElement.pause();
    audioArchiveElement.currentTime = 0;
    audioArchiveElement.src = "";
    isArchivePlaying = false;

    if (isLiveAudioEnabled) {
        if (isPaused) {
            unpauseAudio();
        }
        if (audioQueue.length > 0) {
            playNextInQueue();
        }
    }
});

audioArchiveElement.addEventListener('ended', function () {
    isArchivePlaying = false;
    const playButtons = document.querySelectorAll('.playButton');
    playButtons.forEach(button => {
        if (button.classList.contains('fa-pause')) {
            button.classList.remove('fa-pause');
            button.classList.add('fa-play');
        }
    });
});

audioArchiveElement.addEventListener('pause', function () {
    isArchivePlaying = false;
    const playButtons = document.querySelectorAll('.playButton');
    playButtons.forEach(button => {
        if (button.classList.contains('fa-pause')) {
            button.classList.remove('fa-pause');
            button.classList.add('fa-play');
        }
    });
});

// Pagination control event listeners
beginningLink.addEventListener('click', () => changePage(1));
previousLink.addEventListener('click', () => changePage(archivePage - 1));
nextLink.addEventListener('click', () => changePage(archivePage + 1));
endLink.addEventListener('click', () => changePage(archiveTotalPages));

function countySelectChange(value) {
    archiveFilters.county = this.value;
    archiveFilters.group = '';
    archiveFilters.service_type = '';
    archiveFilters.talkgroup = '';
    updateFiltersAndTransmissions();
    fetchFilterOptions();
}

document.getElementById('county_select').addEventListener('change', function () {
    countySelectChange(this.value);
});

document.getElementById('group_select').addEventListener('change', function () {
    archiveFilters.group = this.value;
    archiveFilters.service_type = '';
    archiveFilters.talkgroup = '';
    updateFiltersAndTransmissions();
    fetchFilterOptions();
});

document.getElementById('service_type_select').addEventListener('change', function () {
    archiveFilters.service_type = this.value;
    archiveFilters.talkgroup = '';
    updateFiltersAndTransmissions();
    fetchFilterOptions();
});

document.getElementById('talkgroup_decimal_select').addEventListener('change', function () {
    archiveFilters.talkgroup = this.value;
    updateFiltersAndTransmissions();
    fetchFilterOptions();
});

document.getElementById('start_date').addEventListener('change', function () {
    // Get the value from the input
    const startDateValue = this.value;

    // Create a Date object
    const startDate = new Date(startDateValue);

    // Convert to epoch time in milliseconds and then to seconds
    // Update your filters
    archiveFilters.start_date = startDate.getTime() / 1000;

    updateFiltersAndTransmissions();
});
document.getElementById('end_date').addEventListener('change', function () {
    const endDateValue = this.value;
    const endDate = new Date(endDateValue);
    archiveFilters.end_date = endDate.getTime() / 1000;

    updateFiltersAndTransmissions();
});
itemsPerPageSelect.addEventListener('change', function () {
    archivePerPage = parseInt(this.value);
    updateFiltersAndTransmissions();
});

toggleSwitch.addEventListener('change', function () {
    const playButtons = document.querySelectorAll('.playButton');
    playButtons.forEach(function (button) {
        if (toggleSwitch.checked) {
            button.classList.add('d-none');
            const audioSrc = button.getAttribute('data-src');
            const downloadLink = document.createElement('a');
            downloadLink.classList.add('downloadButton');
            downloadLink.setAttribute('href', audioSrc);
            downloadLink.setAttribute('target', '_blank');
            downloadLink.setAttribute('download', true);
            downloadLink.innerHTML = '<i class="fas fa-download"></i>';
            button.parentElement.appendChild(downloadLink);
        } else {
            const downloadButton = button.parentElement.querySelector('.downloadButton');
            if (downloadButton) {
                downloadButton.remove();
            }
            button.classList.remove('d-none');
        }
    });
});
