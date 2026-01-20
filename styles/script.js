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
        
        // Create the bar container - uses same Tailwind classes as Mintlify's callout box
        var bar = document.createElement("div");
        bar.className = "axiom-placeholder-bar my-4 px-5 py-4 overflow-hidden rounded-2xl flex flex-col gap-3 border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-white/10";
        
        placeholdersInCode.forEach(function(key) {
            var config = PLACEHOLDERS[key];
            
            var fieldWrapper = document.createElement("div");
            fieldWrapper.className = "axiom-placeholder-field flex items-center gap-3";
            
            var fieldLabel = document.createElement("label");
            fieldLabel.textContent = config.label;
            fieldLabel.className = "axiom-placeholder-label text-sm font-medium text-neutral-800 dark:text-neutral-300 min-w-[100px]";
            
            var input = document.createElement("input");
            input.type = "text";
            input.placeholder = config.placeholder;
            input.value = values[key] || "";
            input.setAttribute("data-key", key);
            input.className = "axiom-placeholder-input flex-1 px-3 py-2 text-sm font-mono border border-neutral-200 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500";
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
            bar.appendChild(fieldWrapper);
        });
        
        // Find the .code-block container and insert after it
        var codeBlockContainer = preElement.closest(".code-block");
        if (!codeBlockContainer) {
            // No .code-block container - don't add a bar
            return null;
        }
        
        codeBlockContainer.parentNode.insertBefore(bar, codeBlockContainer.nextSibling);
        
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
        
        // Track which .code-block containers have been processed this run
        var processedContainers = new Set();
        
        codeBlocks.forEach(function(preElement) {
            var codeBlockContainer = preElement.closest(".code-block");
            
            // Skip if no .code-block container (not a proper code block)
            if (!codeBlockContainer) return;
            
            // Skip if we already processed this container in this run
            if (processedContainers.has(codeBlockContainer)) return;
            processedContainers.add(codeBlockContainer);
            
            // Check if a bar already exists for this code block
            var existingBar = codeBlockContainer.nextElementSibling;
            if (existingBar && existingBar.classList.contains("axiom-placeholder-bar")) {
                return;
            }
            
            // Also check if the code block is already marked as processed
            if (codeBlockContainer.hasAttribute("data-placeholder-processed")) {
                return;
            }
            
            var codeElement = preElement.querySelector("code") || preElement;
            var text = codeElement.textContent;
            var placeholdersInCode = getPlaceholdersInText(text);
            
            if (placeholdersInCode.length === 0) return;
            
            // Mark as processed
            codeBlockContainer.setAttribute("data-placeholder-processed", "true");
            
            // Store original content (both text and HTML for syntax-highlighted code)
            if (!originalCodeContent.has(codeElement)) {
                originalCodeContent.set(codeElement, text);
                originalCodeHTML.set(codeElement, codeElement.innerHTML);
            }
            
            // Intercept copy button to copy replaced content
            interceptCopyButton(codeBlockContainer, codeElement);
            
            // Create config bar below the code block
            createConfigBar(preElement, codeElement, placeholdersInCode);
            
            // Apply stored values
            if (Object.keys(values).length > 0) {
                updateCodeBlock(codeElement, values);
            }
        });
        
        updateAllBars();
    }
    
    // Intercept the copy button to copy replaced content
    function interceptCopyButton(codeBlockContainer, codeElement) {
        // Find copy button - it's usually a button inside the code block header
        var copyButtons = codeBlockContainer.querySelectorAll("button");
        
        copyButtons.forEach(function(btn) {
            // Skip if already intercepted
            if (btn.hasAttribute("data-copy-intercepted")) return;
            btn.setAttribute("data-copy-intercepted", "true");
            
            // Add our click handler that runs first
            btn.addEventListener("click", function(e) {
                var values = loadStoredValues();
                var hasReplacements = Object.keys(values).length > 0;
                
                if (hasReplacements) {
                    // Get the current text content (with replacements applied)
                    var textToCopy = codeElement.textContent;
                    
                    // Copy to clipboard
                    navigator.clipboard.writeText(textToCopy).then(function() {
                        showCopyFeedback(btn);
                    }).catch(function(err) {
                        // Fallback for older browsers
                        var textArea = document.createElement("textarea");
                        textArea.value = textToCopy;
                        textArea.style.position = "fixed";
                        textArea.style.left = "-9999px";
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand("copy");
                        document.body.removeChild(textArea);
                        showCopyFeedback(btn);
                    });
                    
                    // Prevent the default copy behavior
                    e.stopImmediatePropagation();
                    e.preventDefault();
                }
                // If no replacements, let the default copy behavior work
            }, true); // Use capture to run before other handlers
        });
    }
    
    // Show "Copied!" feedback on the button
    function showCopyFeedback(btn) {
        // Store original content
        var originalHTML = btn.innerHTML;
        
        // Show copied state - use currentColor to match theme
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>';
        
        // Revert after delay
        setTimeout(function() {
            btn.innerHTML = originalHTML;
        }, 2000);
    }
    
    // Clean up orphaned bars (bars whose code block was removed/re-rendered)
    function cleanupOrphanedBars() {
        var bars = document.querySelectorAll(".axiom-placeholder-bar");
        bars.forEach(function(bar) {
            var prevSibling = bar.previousElementSibling;
            if (!prevSibling || !prevSibling.classList.contains("code-block")) {
                bar.remove();
            }
        });
    }
    
    // Handle dynamic content
    var debounceTimer = null;
    var observer = new MutationObserver(function(mutations) {
        var hasChanges = false;
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) {
                    if (node.tagName === "PRE" || 
                        node.classList && node.classList.contains("code-block") ||
                        (node.querySelector && node.querySelector("pre"))) {
                        hasChanges = true;
                    }
                }
            });
            // Also check for removed nodes (theme switch removes and re-adds)
            mutation.removedNodes.forEach(function(node) {
                if (node.nodeType === 1 && node.classList && node.classList.contains("code-block")) {
                    hasChanges = true;
                }
            });
        });
        if (hasChanges) {
            // Debounce to avoid multiple rapid calls
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function() {
                cleanupOrphanedBars();
                processCodeBlocks();
            }, 100);
        }
    });
    
    function init() {
        // Clean up any existing bars first (in case of re-initialization)
        document.querySelectorAll(".axiom-placeholder-bar").forEach(function(bar) {
            bar.remove();
        });
        document.querySelectorAll("[data-placeholder-processed]").forEach(function(el) {
            el.removeAttribute("data-placeholder-processed");
        });
        
        processCodeBlocks();
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
