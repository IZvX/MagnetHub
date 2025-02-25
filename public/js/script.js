document.addEventListener('DOMContentLoaded', () => {
    // Function to handle clicks on elements with the 'gotodir' attribute
    function setupClickableElements() {
        const clickableElements = document.querySelectorAll('[id][gotodir]');

        clickableElements.forEach(element => {
            element.addEventListener('click', () => {
                const targetUrl = element.getAttribute('gotodir');

                if (targetUrl) {
                    window.location.href = targetUrl;
                } else {
                    console.error(`Element with id '${element.id}' has an empty gotodir attribute.`);
                }
            });
        });
    }

    // Function to generate the sidebar HTML
    function sidebar(activePage, items) {
        let sidebarHTML = `
            <div class="verbar">
                <div class="logo">
                    <svg fill="var(--primary-accent-color)" width="800px" height="800px" viewBox="0 0 16 16" enable-background="new 0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="m10.04 11.96c-.23 0-1.15-.53-1.48-.79-.11-.08-.37-.4-.5-.44-.1-.02-.31.24-.41.24-.09 0-.51-.27-.61-.24-.13.04-1.72 1.26-1.95 1.26-1.05 0-2.08-1.27-2.08-1.27-.06 2.87 2.6 4.51 3.06 4.86.38.28 2.77.28 3.15 0 .47-.35 2.67-2.85 2.82-4.93-.42.91-.96 1.31-2 1.31zm-3.46-4.92c2.94-.02 5.66-.49 5.69-1.93.03-1.15-.64-2.5-1.24-3.41-.4-.62-.95-1.28-1.69-1.11-.7.16-1.19.87-1.91.99-.62.12-.88-.35-1.38-.61-.44-.22-.89-.16-1.24.22-.52.54-.83 1.3-1.07 2.04-.22.66-.67 1.53-.59 2.26.11.94 2.41 1.56 3.43 1.55zm6.34-2.39c1.62 2.98-3.85 3.62-6.34 3.57-1.8-.04-5.35-1.73-4.14-2.57-.99-.05-1.8.28-1.96 1.13-.21 1.12.4 1.78 1.62 2.34 1.51.72 3.39.7 5.11.75 2.11.07 4.34-.05 6.19-.91 1.05-.48 2.08-1.3 2.04-2.33-.04-1.01-1.27-1.98-2.52-1.98z"/></svg>
                </div>

                <div class="search-bar search-cont">
                    <input size="1" autocorrect="off" autocapitalize="off" autocomplete="off" spellcheck="false"
                        tabindex="-1" class="search-input" type="text" placeholder="Search..." value="">

                    <div tabindex="0" class="submit-button">
                        <svg class="icon-FT4bG" viewBox="0 0 512 512">
                            <path
                                d="M456.7 437.4000000000001l-94.1-94.1a173.25 173.25 0 0 0 34.8-104.6c0-96.3-78.4-174.7-174.7-174.7S48 142.4000000000001 48 238.79999999999973c0 96.3 78.4 174.7 174.7 174.7 37.71 0 74.406-12.21 104.6-34.8l94.1 94.1a24.96 24.96 0 0 0 12.646 6.09c4.711 0.78 9.546 0.19 13.933-1.69a25.05 25.05 0 0 0 10.823-8.94 25 25 0 0 0 4.298-13.36 25.94 25.94 0 0 0-6.4-17.5M97.9 238.79999999999973a124.67 124.67 0 0 1 32.268-83.74 124.674 124.674 0 0 1 166.653-16.49 124.7 124.7 0 0 1 48.049 75.8c6.054 30.36 0.6 61.88-15.299 88.43a124.73 124.73 0 0 1-70.722 55.26c-29.615 9-61.519 6.66-89.507-6.56A124.69 124.69 0 0 1 97.9 238.79999999999973"
                                style="fill: currentcolor"></path>
                        </svg>
                    </div>
                </div>

                <div class="verbar-item ${activePage === 'settings.html' ? 'active' : ''}" id="goto" gotodir="settings.html">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" class="settingsicon">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                            d="M13.1191 5.61336C13.0508 5.11856 12.6279 4.75 12.1285 4.75H11.8715C11.3721 4.75 10.9492 5.11856 10.8809 5.61336L10.7938 6.24511C10.7382 6.64815 10.4403 6.96897 10.0622 7.11922C10.006 7.14156 9.95021 7.16484 9.89497 7.18905C9.52217 7.3524 9.08438 7.3384 8.75876 7.09419L8.45119 6.86351C8.05307 6.56492 7.49597 6.60451 7.14408 6.9564L6.95641 7.14408C6.60452 7.49597 6.56492 8.05306 6.86351 8.45118L7.09419 8.75876C7.33841 9.08437 7.3524 9.52216 7.18905 9.89497C7.16484 9.95021 7.14156 10.006 7.11922 10.0622C6.96897 10.4403 6.64815 10.7382 6.24511 10.7938L5.61336 10.8809C5.11856 10.9492 4.75 11.372 4.75 11.8715V12.1285C4.75 12.6279 5.11856 13.0508 5.61336 13.1191L6.24511 13.2062C6.64815 13.2618 6.96897 13.5597 7.11922 13.9378C7.14156 13.994 7.16484 14.0498 7.18905 14.105C7.3524 14.4778 7.3384 14.9156 7.09419 15.2412L6.86351 15.5488C6.56492 15.9469 6.60451 16.504 6.9564 16.8559L7.14408 17.0436C7.49597 17.3955 8.05306 17.4351 8.45118 17.1365L8.75876 16.9058C9.08437 16.6616 9.52216 16.6476 9.89496 16.811C9.95021 16.8352 10.006 16.8584 10.0622 16.8808C10.4403 17.031 10.7382 17.3519 10.7938 17.7549L10.8809 18.3866C10.9492 18.8814 11.3721 19.25 11.8715 19.25H12.1285C12.6279 19.25 13.0508 18.8814 13.1191 18.3866L13.2062 17.7549C13.2618 17.3519 13.5597 17.031 13.9378 16.8808C13.994 16.8584 14.0498 16.8352 14.105 16.8109C14.4778 16.6476 14.9156 16.6616 15.2412 16.9058L15.5488 17.1365C15.9469 17.4351 16.504 17.3955 16.8559 17.0436L17.0436 16.8559C17.3955 16.504 17.4351 15.9469 17.1365 15.5488L16.9058 15.2412C16.6616 14.9156 16.6476 14.4778 16.811 14.105C16.8352 14.0498 16.8584 13.994 16.8808 13.9378C17.031 13.5597 17.3519 13.2618 17.7549 13.2062L18.3866 13.1191C18.8814 13.0508 19.25 12.6279 19.25 12.1285V11.8715C19.25 11.3721 18.8814 10.9492 18.3866 10.8809L17.7549 10.7938C17.3519 10.7382 17.031 10.4403 16.8808 10.0622C16.8584 10.006 16.8352 9.95021 16.8109 9.89496C16.6476 9.52216 16.6616 9.08437 16.9058 8.75875L17.1365 8.4512C17.4351 8.05308 17.3955 7.49599 17.0436 7.1441L16.8559 6.95642C16.504 6.60453 15.9469 6.56494 15.5488 6.86353L15.2412 7.09419C14.9156 7.33841 14.4778 7.3524 14.105 7.18905C14.0498 7.16484 13.994 7.14156 13.9378 7.11922C13.5597 6.96897 13.2618 6.64815 13.2062 6.24511L13.1191 5.61336Z">
                        </path>
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                            d="M13.25 12C13.25 12.6904 12.6904 13.25 12 13.25C11.3096 13.25 10.75 12.6904 10.75 12C10.75 11.3096 11.3096 10.75 12 10.75C12.6904 10.75 13.25 11.3096 13.25 12Z">
                        </path>
                    </svg>
                </div>
            </div>

            <div class="sidebar">
                <div class="sidebar-content">
                    ${items.map(item => `
                        <div class="sidebar-item ${activePage === item.url ? 'active' : ''}" id="goto" gotodir="${item.url}">
                            <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                                ${item.svg}
                            </svg>
                            <span>${item.label}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        return sidebarHTML;
    }

    // Define your sidebar items here
    const sidebarItems = [
        {
            label: 'Home',
            url: 'index.html',
            svg: `
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M6.75024 19.2502H17.2502C18.3548 19.2502 19.2502 18.3548 19.2502 17.2502V9.75025L12.0002 4.75024L4.75024 9.75025V17.2502C4.75024 18.3548 5.64568 19.2502 6.75024 19.2502Z">
                </path>
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M9.74963 15.7493C9.74963 14.6447 10.6451 13.7493 11.7496 13.7493H12.2496C13.3542 13.7493 14.2496 14.6447 14.2496 15.7493V19.2493H9.74963V15.7493Z">
                </path>
            `
        },
        {
            label: 'Movies',
            url: 'movies.html',
            svg: `
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M4.75 6.75C4.75 5.64543 5.64543 4.75 6.75 4.75H17.25C18.3546 4.75 19.25 5.64543 19.25 6.75V17.25C19.25 18.3546 18.3546 19.25 17.25 19.25H6.75C5.64543 19.25 4.75 18.3546 4.75 17.25V6.75Z">
                </path>
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M7.75 5V19"></path>
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M16.25 5V19"></path>
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M5 8.75H7.5"></path>
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M17 8.75H19"></path>
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M5 12H19"></path>
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M5 15.25H7.5"></path>
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M17 15.25H19"></path>
            `
        },
        {
            label: 'TV Shows',
            url: 'tv.html',
            svg: `
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M4.75 6.75C4.75 5.64543 5.64543 4.75 6.75 4.75H17.25C18.3546 4.75 19.25 5.64543 19.25 6.75V17.25C19.25 18.3546 18.3546 19.25 17.25 19.25H6.75C5.64543 19.25 4.75 18.3546 4.75 17.25V6.75Z">
                </path>
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M15.25 12L9.75 8.75V15.25L15.25 12Z"></path>
            `
        },
        {
            label: 'Library',
            url: 'library.html',
            svg: `
                <path d="M19.25 15.25V5.75C19.25 5.19772 18.8023 4.75 18.25 4.75H6.75C5.64543 4.75 4.75 5.64543 4.75 6.75V16.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M19.25 15.25H6.75C5.64543 15.25 4.75 16.1454 4.75 17.25C4.75 18.3546 5.64543 19.25 6.75 19.25H19.25V15.25Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            `
        },
        {
            label: 'Games',
            url: 'games.html',
            svg: `
                <path d="M9.00043 17.9394L10.3649 15.7254C10.5469 15.4299 10.8692 15.25 11.2162 15.25H12.7807C13.1289 15.25 13.4521 15.4312 13.6338 15.7282L14.978 17.926C15.7222 19.1562 17.1253 19.6479 18.2757 18.8622C18.9839 18.3786 19.3528 17.532 19.225 16.6836L18.315 10.6412C18.2336 10.1006 18.0266 9.6309 17.7343 9.2447C17.1567 8.34558 16.1482 7.75 15.0008 7.75H9.00554C7.86455 7.75 6.861 8.33891 6.2818 9.22957C5.9862 9.61688 5.77663 10.0889 5.69416 10.6328L4.77522 16.6933C4.64616 17.5446 5.01944 18.3939 5.7336 18.8739C6.87673 19.6423 8.27686 19.1875 9.00043 17.9394Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 7.5V4.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M9.5 12C9.5 12.2761 9.27614 12.5 9 12.5C8.72386 12.5 8.5 12.2761 8.5 12C8.5 11.7239 8.72386 11.5 9 11.5C9.27614 11.5 9.5 11.7239 9.5 12Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M15.5 12C15.5 12.2761 15.2761 12.5 15 12.5C14.7239 12.5 14.5 12.2761 14.5 12C14.5 11.7239 14.7239 11.5 15 11.5C15.2761 11.5 15.5 11.7239 15.5 12Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
            `
        },
        {
            label: 'Downloads',
            url: 'downloads.html',
            svg: `
                <path stroke="currentColor" d="M9.5 12L12 14.5L14.5 12M12 4.5V13.8912" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                <path stroke="currentColor" d="M20 16.5L19.7785 17.8288C19.6178 18.7932 18.7834 19.5 17.8057 19.5H6.19425C5.21658 19.5 4.3822 18.7932 4.22147 17.8288L4 16.5" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
            `
        }
    ];

    // Get the current page
    const currentPage = window.location.pathname.split('/').pop();

    // Render the sidebar with the items and the active page
    document.getElementById("sidebar").innerHTML = sidebar(currentPage, sidebarItems);
    setupClickableElements();

    // After rendering the sidebar, set up the click listeners

    console.log(currentPage);
});