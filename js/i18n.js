/* ram. — bilingual (த / En) engine
   data-i18n replaces text; data-i18n-attr="attr:key;attr:key" replaces attributes.
   English source text is harvested from the HTML (single source); dictionary holds only Tamil.
   Follows browser language; manual toggle saved in localStorage['lang'].

   Two rules for maintainers:
   1) render() uses textContent, so data-i18n elements must contain plain text only
      (to include icons/SVG, put data-i18n on an inner plain-text <span>).
   2) Call order: init() (set language) → content in place → apply() (harvest English then render) →
      only then can setLang() be called; calling setLang before apply does nothing because enCache is empty. */
(function () {
  "use strict";

  var TA = {
    /* footer */
    "footer": "© 2026 ram. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.",

    /* site name */
    "site.name": "ராம்.",

    /* home */
    "home.bubbleAria": "புதிய வாழ்த்துக்கு கிளிக் செய்யவும்",

    /* about */
    "about.l1": "ஒரு சாதாரண நபர்",
    "about.l2": "எனக்கு கதை சொல்லவும் பொருட்கள் உருவாக்கவும் பிடிக்கும். பெரும்பாலும் சிறிய யோசனைகள், சிறிய பரிசோதனைகள்.",
    "about.l3": "நான் காப்பிரைட்டராக தொடங்கி, உள்ளடக்க மேலாளராக மாறி, இப்போது சமூக ஊடக பிராண்ட் உத்தியாளராக பணியாற்றுகிறேன்.",
    "about.l4a": "எனக்கு இசையும் திரைப்படங்களும் பிடிக்கும். விமர்சனங்கள் எழுதுவதில் நான் மோசமானவன். அதனால் நான் தரக்கூடிய சிறந்தது",
    "about.l4b": "அல்லது \"வேண்டாம்.\" எப்படியோ அதுதான் அதிக நேர்மையாக உணர்கிறது.",
    "about.l5": "எனக்கு பயணம் செய்ய பிடிக்கும், நான் விரும்பும் அளவுக்கு இன்னும் பல இடங்களுக்கு செல்லவில்லை. ஒரு நீண்ட பட்டியல் காத்திருக்கிறது.",
    "about.l6": "சில நாட்கள் எதையும் கண்டுபிடிக்க முடியும் என நினைக்கிறேன். சில நாட்கள் எல்லாம் டேப் மற்றும் ஆசையால் ஒட்டப்பட்டது போல உணர்கிறது. இரண்டு பதிப்புகளும் உண்மையானவை.",
    "about.l7": "சில இரவுகள் எதிர்காலம் ஏற்கனவே இங்கே வந்துவிட்டது போல கனவு காண்கிறேன். சில நாட்கள் அந்த நாளை கடக்க மட்டுமே முயற்சிக்கிறேன்.",
    "about.l8": "மற்றவர்கள் தங்கள் இணையதளங்களில் சிறிய குறிப்புகளை எழுதுவதைப் பார்த்தேன், அதனால் நானும் சிலவற்றை விட்டுச் செல்லலாம் என நினைத்தேன்.",
    "about.l10": "இதுவரை படித்ததற்கு நன்றி :)",

    /* about 履历 */
    "resume.eduHead": "education கல்வி",
    "resume.edu1": "முதுநிலை வணிக நிர்வாகம்",
    "resume.org1": "புதுச்சேரி பல்கலைக்கழகம்",
    "resume.workHead": "now at தற்போது",
    "resume.role1": "சமூக ஊடக உத்தியாளர்",
    "resume.org2": "Freshworks Inc"
  };

  var GREETINGS = {
    en: [
      "hi there :)", "glad you clicked. keep going", "here are a few things about me",
      "started by writing radio ads for a living", "i once worked in tamil cinema",
      "yes, i worked in publishing too", "fast company once wrote about me",
      "the economic times did too", "i paid for my own mba",
      "i've been writing content since before ai", "a viral post got me my job",
      "currently at freshworks"
    ],
    ta: [
      "வணக்கம் :)", "கிளிக் பண்ணிட்டீங்கலா . நல்லது.", "என்ன பத்தி என்னத்த சொல்றது...",
      "ரேடியோ விளம்பரம் எழுதித்தான் ஆரம்பிச்சேன்", "ஒரு காலத்துல தமிழ் சினிமாவிலும் வேலை பார்த்திருக்கேன்",
      "ஆமா, publishing-கிலும் வேலை பார்த்திருக்கேன்", "ஒரு தடவை Fast Company என்னைப் பத்தி எழுதியிருக்கு",
      "Economic Times-லும் வந்திருக்கேன்", "என் MBA-வை நானே சம்பாதிச்சுப் படிச்சேன்",
      "AI வர்றதுக்கு முன்னாடியே content எழுதிட்டு இருந்தேன்", "ஒரு viral post-தான் எனக்கு இந்த வேலை வாங்கித் தந்தது",
      "இப்போ Freshworks-ல இருக்கேன்"
    ]
  };

  var enCache = {};      // harvested English source text
  var current = "en";

  function detectLang() {
    try {
      var saved = localStorage.getItem("lang");
      if (saved === "ta" || saved === "en") return saved;
    } catch (_) {}
    var nav = (navigator.language || navigator.userLanguage || "").toLowerCase();
    return nav.indexOf("ta") === 0 ? "ta" : "en";
  }

  function eachAttr(el, fn) {
    el.getAttribute("data-i18n-attr").split(";").forEach(function (pair) {
      var bits = pair.split(":");
      if (bits.length < 2 || !bits[0].trim()) return;
      fn(bits[0].trim(), bits[1].trim());
    });
  }

  function harvest(root) {
    root.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (!(key in enCache)) enCache[key] = el.textContent;
    });
    root.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      eachAttr(el, function (attr, key) {
        var ck = "@" + attr + "@" + key;
        if (!(ck in enCache)) enCache[ck] = el.getAttribute(attr) || "";
      });
    });
  }

  function render(root) {
    root.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      el.textContent = (current === "ta" && TA[key] != null)
        ? TA[key] : (enCache[key] != null ? enCache[key] : el.textContent);
    });
    root.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      eachAttr(el, function (attr, key) {
        var ck = "@" + attr + "@" + key;
        var val = (current === "ta" && TA[key] != null)
          ? TA[key] : (enCache[ck] != null ? enCache[ck] : el.getAttribute(attr));
        el.setAttribute(attr, val);
      });
    });
  }

  function updateToggle() {
    document.querySelectorAll(".lang-btn").forEach(function (b) {
      var on = b.getAttribute("data-lang") === current;
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  var I18N = {
    get current() { return current; },
    init: function () {
      current = detectLang();
      document.documentElement.lang = current;
    },
    apply: function (root) {
      root = root || document;
      harvest(root);
      render(root);
    },
    setLang: function (lang) {
      if (lang !== "ta" && lang !== "en") return;
      current = lang;
      try { localStorage.setItem("lang", lang); } catch (_) {}
      document.documentElement.lang = lang;
      render(document);
      updateToggle();
      document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: lang } }));
    },
    greetings: function () { return GREETINGS[current] || GREETINGS.en; },
    bindToggle: function (root) {
      (root || document).querySelectorAll(".lang-btn").forEach(function (b) {
        b.addEventListener("click", function () { I18N.setLang(b.getAttribute("data-lang")); });
      });
      updateToggle();
    }
  };

  window.I18N = I18N;
})();
