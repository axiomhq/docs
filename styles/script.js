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

// Make top-left logo link to marketing site. The event listener is necessary to replace Mintlify's default event listener.
if (document.querySelector("#navbar a")) {
    const logoLink = document.querySelector("#navbar a");

    if (logoLink.getAttribute("href") == "/" || logoLink.getAttribute("href") == "/docs") {
        logoLink.addEventListener("click", function(){document.location.href = "https://axiom.co/";});
        logoLink.setAttribute("href", "https://axiom.co/");
    }
}

// =============================================================================
// Code Placeholder Replacement System
// =============================================================================
// Automatically adds a configuration bar below code snippets containing 
// placeholders (AXIOM_DOMAIN, DATASET_NAME, API_TOKEN). Values persist in 
// sessionStorage and never leave the client.

(function() {
    var STORAGE_KEY = "axiom-docs-placeholders";
    var PLACEHOLDERS = {
        "AXIOM_DOMAIN": { label: "Axiom Domain", placeholder: "api.axiom.co" },
        "DATASET_NAME": { label: "Dataset Name", placeholder: "my-dataset" },
        "API_TOKEN": { label: "API Token", placeholder: "xaat-xxx..." }
    };
    var PLACEHOLDER_PATTERNS = Object.keys(PLACEHOLDERS);
    
    var originalCodeContent = new WeakMap();
    var originalCodeHTML = new WeakMap();
    
    function loadStoredValues() {
        try {
            var stored = sessionStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            return {};
        }
    }
    
    function saveValues(values) {
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(values));
        } catch (e) {}
    }
    
    function getPlaceholdersInText(text) {
        return PLACEHOLDER_PATTERNS.filter(function(p) { return text.includes(p); });
    }
    
    function replacePlaceholders(text, values) {
        var result = text;
        PLACEHOLDER_PATTERNS.forEach(function(pattern) {
            if (values[pattern]) {
                var regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                result = result.replace(regex, values[pattern]);
            }
        });
        return result;
    }
    
    function updateCodeBlock(codeElement, values) {
        var original = originalCodeContent.get(codeElement);
        if (!original) return;
        
        var originalHTML = originalCodeHTML.get(codeElement);
        
        // Always start from original content for replacements
        if (originalHTML && codeElement.children.length > 0) {
            // For syntax-highlighted code, replace in the original HTML
            var html = originalHTML;
            PLACEHOLDER_PATTERNS.forEach(function(pattern) {
                if (values[pattern]) {
                    var escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    html = html.replace(new RegExp(escapedPattern, 'g'), values[pattern]);
                }
            });
            codeElement.innerHTML = html;
        } else {
            // For plain text code blocks
            var replaced = replacePlaceholders(original, values);
            codeElement.textContent = replaced;
        }
    }
    
    function resetCodeBlock(codeElement) {
        var original = originalCodeContent.get(codeElement);
        if (original) {
            codeElement.textContent = original;
        }
    }
    
    function createConfigBar(preElement, codeElement, placeholdersInCode) {
        var values = loadStoredValues();
        
        // Create the bar container
        var bar = document.createElement("div");
        bar.className = "axiom-placeholder-bar";
        bar.style.cssText = "display: flex; align-items: center; gap: 12px; padding: 8px 12px; background: linear-gradient(to bottom, #1a1a1a, #111); border: 1px solid #333; border-top: none; border-radius: 0 0 8px 8px; margin-top: -4px; flex-wrap: wrap;";
        
        // Label
        var label = document.createElement("span");
        label.textContent = "Configure:";
        label.style.cssText = "font-size: 11px; color: #888; font-family: system-ui, sans-serif; font-weight: 500;";
        bar.appendChild(label);
        
        // Create inputs container
        var inputsContainer = document.createElement("div");
        inputsContainer.style.cssText = "display: flex; align-items: center; gap: 8px; flex-wrap: wrap; flex: 1;";
        
        placeholdersInCode.forEach(function(key) {
            var config = PLACEHOLDERS[key];
            
            var fieldWrapper = document.createElement("div");
            fieldWrapper.style.cssText = "display: flex; align-items: center; gap: 4px;";
            
            var fieldLabel = document.createElement("label");
            fieldLabel.textContent = config.label + ":";
            fieldLabel.style.cssText = "font-size: 11px; color: #666; font-family: system-ui, sans-serif; white-space: nowrap;";
            
            var input = document.createElement("input");
            input.type = "text";
            input.placeholder = config.placeholder;
            input.value = values[key] || "";
            input.setAttribute("data-key", key);
            input.style.cssText = "width: 140px; padding: 4px 8px; font-size: 11px; border: 1px solid #444; border-radius: 4px; background: #0a0a0a; color: #fff; font-family: ui-monospace, monospace;";
            input.autocomplete = "off";
            input.setAttribute("data-1p-ignore", "true");
            input.setAttribute("data-lpignore", "true");
            
            input.addEventListener("input", function() {
                var vals = loadStoredValues();
                if (input.value.trim()) {
                    vals[key] = input.value;
                } else {
                    delete vals[key];
                }
                saveValues(vals);
                updateAllCodeBlocks();
                updateAllBars();
            });
            
            fieldWrapper.appendChild(fieldLabel);
            fieldWrapper.appendChild(input);
            inputsContainer.appendChild(fieldWrapper);
        });
        
        bar.appendChild(inputsContainer);
        
        // Insert after the pre element
        preElement.parentNode.insertBefore(bar, preElement.nextSibling);
        
        // Store references
        bar._codeElement = codeElement;
        bar._placeholders = placeholdersInCode;
        
        return bar;
    }
    
    function updateAllBars() {
        var values = loadStoredValues();
        var bars = document.querySelectorAll(".axiom-placeholder-bar");
        
        bars.forEach(function(bar) {
            // Sync input values across all bars
            var inputs = bar.querySelectorAll("input[data-key]");
            inputs.forEach(function(input) {
                var key = input.getAttribute("data-key");
                var newVal = values[key] || "";
                if (input.value !== newVal && document.activeElement !== input) {
                    input.value = newVal;
                }
            });
        });
    }
    
    function updateAllCodeBlocks() {
        var values = loadStoredValues();
        var codeBlocks = document.querySelectorAll("pre code, pre");
        
        codeBlocks.forEach(function(codeBlock) {
            var codeElement = codeBlock.tagName === "CODE" ? codeBlock : codeBlock.querySelector("code") || codeBlock;
            
            if (originalCodeContent.has(codeElement)) {
                if (Object.keys(values).length > 0) {
                    updateCodeBlock(codeElement, values);
                } else {
                    resetCodeBlock(codeElement);
                }
            }
        });
    }
    
    function processCodeBlocks() {
        var values = loadStoredValues();
        var codeBlocks = document.querySelectorAll("pre");
        
        codeBlocks.forEach(function(preElement) {
            // Skip if already processed
            if (preElement.nextElementSibling && preElement.nextElementSibling.classList.contains("axiom-placeholder-bar")) return;
            
            var codeElement = preElement.querySelector("code") || preElement;
            var text = codeElement.textContent;
            var placeholdersInCode = getPlaceholdersInText(text);
            
            if (placeholdersInCode.length === 0) return;
            
            // Store original content (both text and HTML for syntax-highlighted code)
            if (!originalCodeContent.has(codeElement)) {
                originalCodeContent.set(codeElement, text);
                originalCodeHTML.set(codeElement, codeElement.innerHTML);
            }
            
            // Create config bar below the code block
            createConfigBar(preElement, codeElement, placeholdersInCode);
            
            // Apply stored values
            if (Object.keys(values).length > 0) {
                updateCodeBlock(codeElement, values);
            }
        });
        
        updateAllBars();
    }
    
    // Handle dynamic content
    var observer = new MutationObserver(function(mutations) {
        var hasNewPre = false;
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) {
                    if (node.tagName === "PRE" || (node.querySelector && node.querySelector("pre"))) {
                        hasNewPre = true;
                    }
                }
            });
        });
        if (hasNewPre) {
            setTimeout(processCodeBlocks, 50);
        }
    });
    
    function init() {
        processCodeBlocks();
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
