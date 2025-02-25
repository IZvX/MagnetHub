document.addEventListener('DOMContentLoaded', () => {
    const downloadButton = document.getElementById('downloadButton');
    const torrentIdInput = document.getElementById('torrentId');
    const statusDiv = document.getElementById('status');
    const torrentListDiv = document.getElementById('torrentList');

    // Connect to WebSocket
    const ws = new WebSocket('ws://localhost:8080');

    ws.addEventListener('open', () => {
        console.log('Connected to WebSocket');
    });

    ws.addEventListener('message', event => {
        const data = JSON.parse(event.data);

        switch (data.type) {
            case 'TORRENT_LIST':
                displayTorrentList(data.torrents);
                break;
            case 'TORRENT_UPDATE':
                updateTorrent(data.torrent);
                console.log('update')
                break;
            default:
                console.log('Unknown message:', data);
        }
    });

    ws.addEventListener('close', () => {
        console.log('Disconnected from WebSocket');
    });

    ws.addEventListener('error', error => {
        console.error('WebSocket error:', error);
    });


    downloadButton.addEventListener('click', () => {
        const torrentId = torrentIdInput.value;

        if (!torrentId) {
            statusDiv.textContent = 'Please enter a Torrent ID.';
            return;
        }

        // Send ADD_TORRENT message to the server
        ws.send(JSON.stringify({ type: 'ADD_TORRENT', torrentId: torrentId }));
        statusDiv.textContent = 'Adding torrent...';
        torrentIdInput.value = '';  // Clear the input
    });


    function displayTorrentList(torrents) {
        torrentListDiv.innerHTML = ''; // Clear existing list
        torrents.forEach(torrent => {
            addTorrentToUI(torrent);
        });
    }

    function addTorrentToUI(torrent) {
        const torrentDiv = document.createElement('div');
        torrentDiv.id = `torrent-${torrent.infoHash}`; // Unique ID for each torrent
        torrentDiv.setAttribute('data-torrent-id', torrent.infoHash);
        torrentDiv.classList.add('torrent-item'); // Add class for styling

        torrentDiv.innerHTML = `
            <h3>${torrent.name || 'Loading...'}</h3>
            <div class="download-progress-container">
                <div class="status-icon">
                    <i class="fa-solid fa-arrow-down-to-line"></i>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${torrent.progress * 100}%"></div>
                </div>
                <div class="download-controls">
                    <div class="round-button button-hover button pause-resume-button" id="${torrent.status != 'stopped' ? 'pause-button' : 'resume-button'}" data-torrent-id="${torrent.infoHash}"></div>
                    <div class="round-button button-hover button stop-button" data-torrent-id="${torrent.infoHash}"><i class="fas fa-stop"></i></div>
                    <div class="round-button button-hover button open-file-button" data-torrent-id="${torrent.infoHash}" style="display:${torrent.status !== 'done' ? 'none' : 'block'}"><i class="fas fa-play"></i></div>
                    <div class="round-button button-hover button open-directory-button" data-torrent-id="${torrent.infoHash}" style="display:${torrent.status !== 'done' ? 'none' : 'block'}"><i class="fas fa-folder"></i></div>
                </div>
            </div>
            <p><i class="fa-solid fa-bars-progress" style="width:32px; text-align:center;"></i> <span class="progress">${(torrent.progress * 100).toFixed(1)}%</span></p>
            <p><i class="fa-solid fa-gauge" style="width:32px; text-align:center;"></i> <span class="speed">${formatSpeed(torrent.downloadSpeed)}</span></p>
            <p><i class="fa-solid fa-timer" style="width:32px; text-align:center;"></i> <span class="time">${formatTime(torrent.timeRemaining)}</span></p>
        `;
        torrentListDiv.appendChild(torrentDiv);

        const pauseResumeButton = torrentDiv.querySelector('.pause-resume-button');
        if (pauseResumeButton) {
            pauseResumeButton.innerHTML = `${torrent.status === 'stopped' ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>'}`
            pauseResumeButton.id = `${torrent.status != 'stopped' ? 'pause-button' : 'resume-button'}`

            pauseResumeButton.addEventListener('click', (event) => {
                const torrentId = torrentDiv.getAttribute('data-torrent-id');
                if (event.target.id === 'pause-button') {
                    ws.send(JSON.stringify({ type: 'PAUSE_TORRENT', torrentId: torrentId }));
                } else {
                    ws.send(JSON.stringify({ type: 'RESUME_TORRENT', torrentId: torrentId }));
                }

            });
        }


        // Stop Button
        const stopButton = torrentDiv.querySelector('.stop-button');
        if (stopButton) {
            stopButton.addEventListener('click', (event) => {
                const torrentDiv = event.target.closest('.torrent-item');

                if (torrentDiv) {
                    const torrentId = torrentDiv.getAttribute('data-torrent-id');
                    ws.send(JSON.stringify({ type: 'STOP_TORRENT', torrentId: torrentId }));
                } else {
                    console.error("Could not find parent torrentDiv for stop button");
                }
            });
        }

        // Open File Button
        const openFileButton = torrentDiv.querySelector('.open-file-button');
        if (openFileButton) {
            openFileButton.addEventListener('click', (event) => {
                const torrentId = torrentDiv.getAttribute('data-torrent-id');
                ws.send(JSON.stringify({ type: 'OPEN_FILE', torrentId: torrentId }));
            });
        }

        // Open Directory Button
        const openDirectoryButton = torrentDiv.querySelector('.open-directory-button');
        if (openDirectoryButton) {
            openDirectoryButton.addEventListener('click', (event) => {
                const torrentId = torrentDiv.getAttribute('data-torrent-id');
                ws.send(JSON.stringify({ type: 'OPEN_DIRECTORY', torrentId: torrentId }));
            });
        }


        updateStatusIcon(torrent, torrentDiv);

    }

    // Debouncing function
    function debounce(func, delay) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }

    let lastUpdateTime = {}; // Object to store last update time for each torrent

    const updateTorrent = debounce((torrent) => {  //Debounce the update function
        const torrentDiv = document.getElementById(`torrent-${torrent.infoHash}`);
        if (!torrentDiv) {
            addTorrentToUI(torrent);
            return;
        }

        const now = Date.now();
        if (lastUpdateTime[torrent.infoHash] && now - lastUpdateTime[torrent.infoHash] < 100) {
            return; //Skip updates if less than 100ms passed since last
        }
        lastUpdateTime[torrent.infoHash] = now;

        // Get elements *once* at the start
        const progressBar = torrentDiv.querySelector('.progress-bar');
        const progressText = torrentDiv.querySelector('.progress');
        const speedText = torrentDiv.querySelector('.speed');
        const timeText = torrentDiv.querySelector('.time');
        const pauseResumeButton = torrentDiv.querySelector('.pause-resume-button');
        const openFileButton = torrentDiv.querySelector('.open-file-button');
        const openDirectoryButton = torrentDiv.querySelector('.open-directory-button');
        const statusIcon = torrentDiv.querySelector('.status-icon');

        // Update the UI
        progressBar.style.width = `${torrent.progress * 100}%`;
        if (progressText) progressText.textContent = `${(torrent.progress * 100).toFixed(1)}%`;
        if (speedText) speedText.textContent = `${formatSpeed(torrent.downloadSpeed)}`;
        if (timeText) timeText.textContent = formatTime(torrent.timeRemaining);


        //Update Status Icon (Status check has been moved out, and has it's own checks)
        updateStatusIcon(torrent, torrentDiv, statusIcon);

        // Toggle Animation Class only when STATUS changes
        if (torrentDiv.dataset.previousStatus !== torrent.status) {
            //Update buttons (status check)
            if (pauseResumeButton) {
                pauseResumeButton.innerHTML = `${torrent.status === 'stopped' ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>'}`;
                pauseResumeButton.id = `${torrent.status != 'stopped' ? 'pause-button' : 'resume-button'}`;
                }
            //Show Hide Buttons
            if(openFileButton) openFileButton.style.display = (torrent.status === 'done') ? 'block' : 'none';
            if(openDirectoryButton) openDirectoryButton.style.display = (torrent.status === 'done') ? 'block' : 'none';

            //If Status is loading, add loading animation.
            if (torrent.status === 'loading' || torrent.status === 'pending') {
                progressBar.classList.add('loading-animation');
                 if(pauseResumeButton){
                    pauseResumeButton.id = 'loading';
                    pauseResumeButton.innerHTML = `<i class="fa-regular fa-spinner-third fa-spin"></i>`;
                }

            } else {
                progressBar.classList.remove('loading-animation'); //No longer load, end animation
            }

            torrentDiv.dataset.previousStatus = torrent.status; //Store previous state for next check
        }

    }, 50);

    function formatTime(ms) {
        let seconds = Math.floor(ms / 1000);
        let minutes = Math.floor(seconds / 60);
        let hours = Math.floor(minutes / 60);

        seconds = seconds % 60;
        minutes = minutes % 60;

        let timeString = `${seconds}s`;

        if (minutes > 0) {
            timeString = `${minutes}m ${timeString}`;
        }

        if (hours > 0) {
            timeString = `${hours}h ${timeString}`;
        }

        return timeString;
    }

    function formatSpeed(speedInBytes) {
        const units = ["B", "KB", "MB", "GB", "TB"];
        let i = 0;

        if (
            speedInBytes === undefined ||
            speedInBytes === null ||
            typeof speedInBytes !== "number"
        ) {
            return "N/A";
        }

        if (Number.isNaN(speedInBytes)) {
            return "N/A";
        }
        if (speedInBytes < 0) {
            return "0.00 B/s";
        }

        let speed = speedInBytes; // Local variable to modify safely

        while (speed >= 1024 && i < units.length - 1) {
            speed /= 1024;
            i++;
        }

        try {
            return `${speed.toFixed(2)} ${units[i]}/s`;
        } catch (e) {
            console.error("Error formatting speed: ", e);
            return "N/A";
        }
    }

    function updateStatusIcon(torrent, torrentDiv, statusIcon) {
        if (!statusIcon) return; //If not yet rendered in DOM, just skip

        const progressBar = torrentDiv.querySelector('.progress-bar');

        if (torrent.progress * 100 == 100) {
            progressBar.classList.add('complete');
            statusIcon.innerHTML = `<i class="fas fa-check"></i>`;
            return;
        }

        progressBar.classList.remove('complete');
        switch (torrent.status) {
            case undefined:
                statusIcon.innerHTML = `<i class="fa-solid fa-arrow-down-to-line"></i>`;
                break;
            case "stopped":
                statusIcon.innerHTML = `<i class="fas fa-pause"></i>`;
                break;
            case 'loading':
            case 'pending':
                statusIcon.innerHTML = `<i class="fa-regular fa-spinner-third fa-spin"></i>`;
                break;
            case 'done':
                statusIcon.innerHTML = `<i class="fas fa-check"></i>`;
                break;
            default:
                statusIcon.innerHTML = `<i class="fa-solid fa-arrow-down-to-line"></i>`;
                break;
        }
    }
});