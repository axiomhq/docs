// Make all links on the page to the marketing site open in the same tab.
if (document.querySelectorAll("a")) {
    const links = document.querySelectorAll("a");

    for (i = 0; i < links.length; i++){
        const link = links[i];
        let linkHref = link.getAttribute("href");
        
        if (linkHref.match("axiom.co")) {
            link.removeAttribute("target");
        }
    }
}

// Make top-left logo link to marketing site. The event listener is necessary to replace Mintlify’s default event listener.
if (document.querySelector("#sidebar a")) {
    const logoLink = document.querySelector("#sidebar a");

    if (logoLink.getAttribute("href") == "/" || logoLink.getAttribute("href") == "/docs") {
        logoLink.addEventListener("click", function(){document.location.href = "https://axiom.co/";});
        logoLink.setAttribute("href", "https://axiom.co/");
    }
}

// Add docs satisfaction survey to each page.
const scriptId = 'tally-embed';
if (!document.getElementById(scriptId)) {
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://tally.so/widgets/embed.js';
    script.async = true;
    document.body.appendChild(script);
}

window.TallyConfig = {
    formId: 'nWbloa',
    popup: {
        open: {
            trigger: 'time',
            ms: 10000, // 10 seconds
        },
        "hideTitle": true,
        "autoClose": 3000,
        "showOnce": true,
        "doNotShowAfterSubmit": true,
        "hiddenFields": {
            ref: window.location.href,
        },
    },
};
