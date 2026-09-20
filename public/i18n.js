async function loadLanguage(lang) {
    const res = await fetch(`./locales/${lang}.json`);
    const translations = await res.json();

    document.querySelectorAll("[data-i18n]").forEach(e => {
        const key = e.getAttribute("data-i18n");
        if (translations[key]) {
            e.textContent = translations[key];
        }
    });
}

function setLanguage(lang) {
    localStorage.setItem("prefferedLang", lang);
    loadLanguage(lang);
}

const supportedLang = ["en", "ru"];
var lang = navigator.language.slice(0, 2);
if (!supportedLang.includes(lang)) {
    lang = "en"; //flaback2
}

const saved = localStorage.getItem("preferredLang");
lang = saved || lang;
loadLanguage(lang);