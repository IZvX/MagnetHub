

document.addEventListener("DOMContentLoaded", function () {
    const providers = {
        '1337x': 'Movies',
        'Eztv': 'All',
        'KickassTorrents': 'Movies',
        'Limetorrents': 'Movies',
        'Rarbg': 'Movies',
        'ThePirateBay': 'Video',
        'Torrent9': 'Movies',
        'TorrentProject': 'All',
        'Torrentz2': 'All',
        'Yts': 'Movies',
        'NyaaSi': 'All'
    };

    // --- Utility Function to Generate JSON ---
    function generateSettingsJson() {
        const settings = {
            webTorrent: {
                maxConns:
                    parseInt(document.getElementById("maxConnectionsInput").value) || 55,
                tracker:
                    document.getElementById("enableTrackersBtn").querySelector(".l")
                        .textContent === "Yes",
                dht:
                    document.getElementById("enableDhtBtn").querySelector(".l")
                        .textContent === "Yes",
                lsd:
                    document.getElementById("enableLsdBtn").querySelector(".l")
                        .textContent === "Yes",
                webSeeds:
                    document.getElementById("webSeedsBtn").querySelector(".l")
                        .textContent === "Yes",
                utp:
                    document.getElementById("enableUtpBtn").querySelector(".l")
                        .textContent === "Yes",
                downloadLimit:
                    parseInt(document.getElementById("downloadLimitInput").value) || -1,
                uploadLimit:
                    parseInt(document.getElementById("uploadLimitInput").value) || -1,
            },
            app: {
                showAdultContent:
                    document.getElementById("adultContentBtn").querySelector(".l")
                        .textContent === "Yes",
                enabledProviders: getEnabledProviders(), // Get enabled providers from checkboxes
                downloadPath: document.getElementById("downloadPathInput").value,
            },
        };
        console.log(JSON.stringify(settings, null, 2)); // Output to console (formatted)
        return settings; // Return the object if you need to use it programmatically.
    }

    function getEnabledProviders() {
        const enabled = {};
        const providerCheckboxes = document.querySelectorAll(
            "#providers-modal .provider input[type='checkbox']"
        );

        providerCheckboxes.forEach((checkbox) => {
            const providerName = checkbox
                .closest(".provider")
                .querySelector(".label").textContent;
            if (providerName !== "All") {
                enabled[providerName] = checkbox.checked;
            }
        });

        return enabled;
    }

    document
        .querySelector("#providers-modal .provider:first-child input[type='checkbox']")
        .addEventListener("change", function () {
            const providerCheckboxes = document.querySelectorAll(
                "#providers-modal .provider input[type='checkbox']"
            );
            const isChecked = this.checked;

            providerCheckboxes.forEach((checkbox) => {
                checkbox.checked = isChecked;
            });
            generateSettingsJson(); // Trigger JSON generation after changing checkboxes
        });

    // --- Dropdown Functionality (modified to include localStorage) ---
    const dropdownButton = document.querySelector(".dropbtn");
    const dropdownContent = document.getElementById("dropdown-content");
    const currentLanguage = document.getElementById("current-lang");

    // Load language from localStorage if available
    const storedLanguage = localStorage.getItem("selectedLanguage");
    if (storedLanguage) {
        currentLanguage.textContent = storedLanguage;
    }

    dropdownButton.addEventListener("click", function () {
        dropdownContent.classList.toggle("show");
    });

    dropdownContent.querySelectorAll("a").forEach((item) => {
        item.addEventListener("click", function () {
            const selectedLang = this.id;
            currentLanguage.textContent = selectedLang;
            dropdownContent.classList.remove("show");

            // Save language to localStorage
            localStorage.setItem("selectedLanguage", selectedLang);

            generateSettingsJson(); // Generate JSON on language change
        });
    });


    document.addEventListener("click", function (event) {
        if (
            !dropdownButton.contains(event.target) &&
            !dropdownContent.contains(event.target)
        ) {
            dropdownContent.classList.remove("show");
        }
    });

    // --- Toggle Buttons (modified) ---
    const toggleButtons = document.querySelectorAll(".btn");
    toggleButtons.forEach((btn) => {
        btn.addEventListener("click", function () {
            const label = this.querySelector(".l");
            label.textContent = label.textContent === "No" ? "Yes" : "No";
            generateSettingsJson(); // Generate JSON on button toggle
        });
    });

    // --- Input Fields ---
    const inputFields = document.querySelectorAll(
        "input[type='number'], input[type='text']"
    );
    inputFields.forEach((input) => {
        input.addEventListener("change", generateSettingsJson); // Generate JSON on input change
        input.addEventListener("keyup", generateSettingsJson); // also generate on keyup for better feedback (optional)
    });

    async function loadSettings() {
        try {
            const response = await fetch("http://localhost:3000/settings"); // Replace with your actual API endpoint
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const settings = await response.json();
            console.log("Fetched settings:", settings); // Log for debugging
            populateForm(settings);
        } catch (error) {
            console.error("Error fetching settings:", error);
            // Handle the error appropriately (e.g., display an error message)
        }
    }

    function populateForm(settings) {
        // WebTorrent settings
        document.getElementById("maxConnectionsInput").value =
            settings.webTorrent.maxConns;
        document.getElementById("enableTrackersBtn").querySelector(".l").textContent =
            settings.webTorrent.tracker ? "Yes" : "No";
        document.getElementById("enableDhtBtn").querySelector(".l").textContent =
            settings.webTorrent.dht ? "Yes" : "No";
        document.getElementById("enableLsdBtn").querySelector(".l").textContent =
            settings.webTorrent.lsd ? "Yes" : "No";
        document.getElementById("webSeedsBtn").querySelector(".l").textContent =
            settings.webTorrent.webSeeds ? "Yes" : "No";
        document.getElementById("enableUtpBtn").querySelector(".l").textContent =
            settings.webTorrent.utp ? "Yes" : "No";
        document.getElementById("downloadLimitInput").value =
            settings.webTorrent.downloadLimit;
        document.getElementById("uploadLimitInput").value =
            settings.webTorrent.uploadLimit;

        // App settings
        document.getElementById("adultContentBtn").querySelector(".l").textContent =
            settings.app.showAdultContent ? "Yes" : "No";
        document.getElementById("downloadPathInput").value = settings.app.downloadPath;

        // Populate provider checkboxes
        const providerCheckboxes = document.querySelectorAll(
            "#providers-modal .provider input[type='checkbox']"
        );
        providerCheckboxes.forEach((checkbox) => {
            const providerName = checkbox
                .closest(".provider")
                .querySelector(".label").textContent;
            if (providerName !== "All") {
                // Skip the "All" checkbox for now
                checkbox.checked = settings.app.enabledProviders[providerName] === true;
            }
        });

        // Set the "All" checkbox based on all providers being selected
        const allProvidersEnabled = Object.values(settings.app.enabledProviders).every(
            (value) => value === true
        );
        document.querySelector(
            "#providers-modal .provider:first-child input[type='checkbox']"
        ).checked = allProvidersEnabled;
    }

    async function saveSettings(settings) {
        try {
            const response = await fetch("http://localhost:3000/addSettings", {
                // Replace with your API endpoint
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(settings),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Settings saved:", data);
            // Optionally display a success message to the user
        } catch (error) {
            console.error("Error saving settings:", error);
            // Handle the error appropriately (e.g., display an error message)
        }
    }

    document.getElementById("saveSettingsBtn").addEventListener("click", () => {
        const settings = generateSettingsJson(); // Generate the JSON
        saveSettings(settings); // Save the settings to the backend
    });

    // --- Initial JSON Generation ---
    loadSettings().then(() => {
        generateSettingsJson(); // Generate JSON on page load
    }); // Fetch settings and *then* generate JSON
});

document
    .getElementById("enabledProvidersBtn")
    .addEventListener("click", () => {
        document.getElementById("providers-modal").style.display = "flex";
    });

document
    .getElementById("providers-modal")
    .querySelector(".close")
    .addEventListener("click", () => {
        document.getElementById("providers-modal").style.display = "none";
    });

document
    .getElementById("providers-modal")
    .addEventListener("click", (event) => {
        if (event.target == document.getElementById("providers-modal")) {
            document.getElementById("providers-modal").style.display = "none";
        }
    });