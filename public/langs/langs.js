document.addEventListener('DOMContentLoaded', function() {
    let translations = {}; // Store translations from the JSON file

    async function loadTranslations(lang) {
        try {
            const response = await fetch(`langs/${lang}.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            translations = await response.json();
            translatePage(lang); // Translate after loading
        } catch (error) {
            console.error('Failed to load translations:', error);
            // Optionally, provide a default language or error message to the user
        }
    }

    function translatePage(lang) {
        const elements = document.querySelectorAll('[lang_id]');

        elements.forEach(element => {
            const langId = element.getAttribute('lang_id');
            let translationText = getTranslation(lang, langId);

            if (translationText) {
                if (element.tagName.toLowerCase() === 'input' && !element.textContent) {
                    element.placeholder = translationText;
                } else {
                    element.textContent = translationText;
                }
            } else {
                console.warn(`Translation not found for lang_id: ${langId}`);
            }
        });
    }

    function getTranslation(lang, langId) {
        if (!translations || Object.keys(translations).length === 0) {
            console.warn("Translations object is empty. Make sure translations are loaded.");
            return null; // Return null if translations are not loaded yet
        }

        const path = langId.split('.');
        let current = translations;

        for (const part of path) {
            if (current && current.hasOwnProperty(part)) {
                current = current[part];
            } else {
                return null;
            }
        }

        return current;
    }

    // Load translations for the default language (French) on page load
    loadTranslations(localStorage.getItem("selectedLanguage"));

    // Example to integrate with the dropdown in settings.html
    const dropdownContent = document.getElementById('dropdown-content');
    if(dropdownContent){
        dropdownContent.addEventListener('click', async function(event) {
            if (event.target.tagName === 'A') {
                event.preventDefault();
                const selectedLanguage = event.target.textContent.toLowerCase(); // Assuming dropdown text matches the language key
                const currentLang = document.getElementById('current-lang');
                const currentSubLang = document.getElementById('current-sub-lang');

                if(currentLang) {
                    currentLang.textContent = event.target.textContent;
                }

                if(currentSubLang && event.target.textContent === 'English'){
                    currentSubLang.textContent = event.target.textContent;
                }

                await loadTranslations(selectedLanguage); // Load new translations and then translate
            }
        });
    }

    //Update the subtitle Language
    const dropdownContentSub = document.querySelectorAll('#drop-down')[1];
    if(dropdownContentSub){
        dropdownContentSub.addEventListener('click', async function(event) {
            if (event.target.tagName === 'A') {
                event.preventDefault();
                const selectedLanguage = event.target.textContent.toLowerCase(); // Assuming dropdown text matches the language key
                const currentSubLang = document.getElementById('current-sub-lang');

                if(currentSubLang) {
                    currentSubLang.textContent = event.target.textContent;
                }

                await loadTranslations(selectedLanguage); // Load new translations and then translate
            }
        });
    }


});