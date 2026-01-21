// =============================================================================
// Code Placeholder Replacement System
// =============================================================================
// Automatically adds a configuration bar below code snippets containing 
// placeholders (AXIOM_DOMAIN, DATASET_NAME, API_TOKEN). Values persist in 
// sessionStorage and never leave the client.

(function() {
    // Check if sessionStorage is available
    var storageAvailable = (function() {
        try {
            var test = "__storage_test__";
            sessionStorage.setItem(test, test);
            sessionStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    })();
    
    var STORAGE_KEY = "axiom-docs-placeholders";
    var PLACEHOLDERS = {
        "AXIOM_DOMAIN": { 
            label: "Edge domain", 
            placeholder: "us-east-1.aws.edge.axiom.co",
            help: 'The base domain of your edge deployment. For more information, see <a class="link" href="/reference/edge-deployments">Edge deployments</a>.',
            type: "select",
            options: [
                { value: "", label: "Select edge deployment..." },
                { value: "us-east-1.aws.edge.axiom.co", label: "US East 1 (AWS)" },
                { value: "eu-central-1.aws.edge.axiom.co", label: "EU Central 1 (AWS)" }
            ]
        },
        "API_TOKEN": { 
            label: "API token", 
            placeholder: "xaat-api-token",
            help: "The Axiom API token you have generated. For added security, store the API token in an environment variable."
        },
        "DATASET_NAME": { 
            label: "Dataset name", 
            placeholder: "dataset-name",
            help: "The name of the Axiom dataset where you send your data."
        },
        "ORGANIZATION_ID": { 
            label: "Organization ID", 
            placeholder: "org-id",
            help: 'The ID of your Axiom organization. For more information, see <a class="link" href="/reference/tokens#determine-organization-id">Determine organization ID</a>.'
        }
    };
    var PLACEHOLDER_PATTERNS = Object.keys(PLACEHOLDERS);
    
    var originalCodeContent = new WeakMap();
    var originalCodeHTML = new WeakMap();
    
    // Generate unique IDs using timestamp + random
    function generateUniqueId(key) {
        return "axiom-" + key.toLowerCase().replace(/_/g, "-") + "-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
    }
    
    function loadStoredValues() {
        if (!storageAvailable) return {};
        try {
            var stored = sessionStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            return {};
        }
    }
    
    function saveValues(values) {
        if (!storageAvailable) return;
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
            var inputId = generateUniqueId(key);
            
            // Outer wrapper for the entire field including help text
            var fieldContainer = document.createElement("div");
            fieldContainer.className = "axiom-placeholder-field-container";
            
            // Row with label and input/select
            var fieldRow = document.createElement("div");
            fieldRow.className = "axiom-placeholder-field flex items-center gap-3";
            
            var fieldLabel = document.createElement("label");
            fieldLabel.textContent = config.label;
            fieldLabel.className = "axiom-placeholder-label text-sm font-medium text-neutral-800 dark:text-neutral-300 min-w-[100px]";
            fieldLabel.setAttribute("for", inputId);
            
            var inputElement;
            
            if (config.type === "select" && config.options) {
                // Create dropdown for select-type fields
                inputElement = document.createElement("select");
                inputElement.id = inputId;
                inputElement.name = inputId;
                inputElement.setAttribute("data-key", key);
                inputElement.className = "axiom-placeholder-input flex-1 px-3 py-2 text-sm font-mono border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer";
                
                config.options.forEach(function(opt) {
                    var option = document.createElement("option");
                    option.value = opt.value;
                    option.textContent = opt.label;
                    if (values[key] === opt.value) {
                        option.selected = true;
                    }
                    inputElement.appendChild(option);
                });
                
                inputElement.addEventListener("change", function() {
                    var vals = loadStoredValues();
                    if (inputElement.value) {
                        vals[key] = inputElement.value;
                    } else {
                        delete vals[key];
                    }
                    saveValues(vals);
                    updateAllCodeBlocks();
                    updateAllBars();
                });
            } else {
                // Create text input for regular fields
                inputElement = document.createElement("input");
                inputElement.type = "text";
                inputElement.id = inputId;
                inputElement.name = inputId;
                inputElement.placeholder = config.placeholder;
                inputElement.value = values[key] || "";
                inputElement.setAttribute("data-key", key);
                inputElement.className = "axiom-placeholder-input flex-1 px-3 py-2 text-sm font-mono border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500";
                inputElement.autocomplete = "off";
                inputElement.setAttribute("data-1p-ignore", "true");
                inputElement.setAttribute("data-lpignore", "true");
                
                inputElement.addEventListener("input", function() {
                    var vals = loadStoredValues();
                    if (inputElement.value.trim()) {
                        vals[key] = inputElement.value;
                    } else {
                        delete vals[key];
                    }
                    saveValues(vals);
                    updateAllCodeBlocks();
                    updateAllBars();
                });
            }
            
            fieldRow.appendChild(fieldLabel);
            fieldRow.appendChild(inputElement);
            fieldContainer.appendChild(fieldRow);
            
            // Help text below the input
            if (config.help) {
                var helpText = document.createElement("p");
                helpText.innerHTML = config.help;
                helpText.className = "axiom-placeholder-help text-neutral-500 dark:text-neutral-400";
                fieldContainer.appendChild(helpText);
            }
            
            bar.appendChild(fieldContainer);
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
            // Sync input and select values across all bars
            var fields = bar.querySelectorAll("input[data-key], select[data-key]");
            fields.forEach(function(field) {
                var key = field.getAttribute("data-key");
                var newVal = values[key] || "";
                if (field.value !== newVal && document.activeElement !== field) {
                    field.value = newVal;
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
        var hasStoredValues = Object.keys(values).length > 0;
        var codeBlocks = document.querySelectorAll("pre");
        var processedCount = 0;
        
        // Track which .code-block containers have been processed this run
        var processedContainers = new Set();
        
        codeBlocks.forEach(function(preElement) {
            var codeBlockContainer = preElement.closest(".code-block");
            
            // Skip if no .code-block container (not a proper code block)
            if (!codeBlockContainer) return;
            
            // Skip if we already processed this container in this run
            if (processedContainers.has(codeBlockContainer)) return;
            processedContainers.add(codeBlockContainer);
            
            var codeElement = preElement.querySelector("code") || preElement;
            
            // Check if this code element is already tracked in our WeakMap
            // This is the authoritative check - DOM attributes can persist across
            // SPA navigation but the actual element reference will be new
            var isAlreadyTracked = originalCodeContent.has(codeElement);
            
            // Check if a bar already exists for this code block
            var existingBar = codeBlockContainer.nextElementSibling;
            var hasExistingBar = existingBar && existingBar.classList.contains("axiom-placeholder-bar");
            
            // If we have a bar but the code element isn't tracked, the DOM was replaced
            // during SPA navigation - remove the orphaned bar and re-process
            if (hasExistingBar && !isAlreadyTracked) {
                existingBar.remove();
                codeBlockContainer.removeAttribute("data-placeholder-processed");
                hasExistingBar = false;
            }
            
            // Skip if already fully processed (tracked in WeakMap AND has bar)
            if (isAlreadyTracked && hasExistingBar) {
                return;
            }
            
            var text = codeElement.textContent;
            var placeholdersInCode = getPlaceholdersInText(text);
            
            // Only show configurator for code blocks with actual placeholder strings
            if (placeholdersInCode.length === 0) return;
            
            // Mark as processed
            codeBlockContainer.setAttribute("data-placeholder-processed", "true");
            
            // Store original content (both text and HTML for syntax-highlighted code)
            if (!isAlreadyTracked) {
                originalCodeContent.set(codeElement, text);
                originalCodeHTML.set(codeElement, codeElement.innerHTML);
            }
            
            // Intercept copy button to copy replaced content
            interceptCopyButton(codeBlockContainer, codeElement);
            
            // Create config bar below the code block if it doesn't exist
            if (!hasExistingBar) {
                createConfigBar(preElement, codeElement, placeholdersInCode);
                processedCount++;
            }
            
            // Apply stored values
            if (hasStoredValues) {
                updateCodeBlock(codeElement, values);
            }
        });
        
        updateAllBars();
        
        // Return status for retry logic
        return { processed: processedCount, hasStoredValues: hasStoredValues };
    }
    
    // Intercept the copy button to copy replaced content
    function interceptCopyButton(codeBlockContainer, codeElement) {
        // Find copy button - it's usually a button inside the code block header
        var copyButtons = codeBlockContainer.querySelectorAll("button[data-testid='copy-code-button']");
        
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
    
    // Show feedback when the code is copied to the clipboard
    function showCopyFeedback(btn) {
        // Store original button content
        var originalHTML = btn.innerHTML;
        
        // Show copied state in checkmark
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>';
        
        // Update the tooltip text
        var tooltip = btn.parentElement && btn.parentElement.querySelector(".text-tooltip-foreground");
        var originalTooltipText = null;
        if (tooltip) {
            originalTooltipText = tooltip.textContent;
            tooltip.textContent = "Copied!";
        }
        
        // Revert after delay
        setTimeout(function() {
            btn.innerHTML = originalHTML;
            if (tooltip && originalTooltipText !== null) {
                tooltip.textContent = originalTooltipText;
            }
        }, 2000);
    }
    
    // Clean up orphaned bars (bars whose code block was removed/re-rendered)
    function cleanupOrphanedBars() {
        var bars = document.querySelectorAll(".axiom-placeholder-bar");
        bars.forEach(function(bar) {
            var prevSibling = bar.previousElementSibling;
            // Remove bar if it's not preceded by a code block
            if (!prevSibling || !prevSibling.classList.contains("code-block")) {
                bar.remove();
                return;
            }
            // Also check if the code element in the preceding block is still tracked
            var codeElement = prevSibling.querySelector("code") || prevSibling.querySelector("pre");
            if (codeElement && !originalCodeContent.has(codeElement)) {
                // The code element was replaced - remove the orphaned bar
                bar.remove();
                prevSibling.removeAttribute("data-placeholder-processed");
            }
        });
    }
    
    function init() {
        // Process on initial page load
        processCodeBlocks();

        // Watch for new code blocks (SPA navigation, theme switch, etc.)
        var debounceTimer = null;
        var observer = new MutationObserver(function(mutations) {
            // Check if any code blocks were added or if main content changed
            var shouldReprocess = mutations.some(function(mutation) {
                return Array.from(mutation.addedNodes).some(function(node) {
                    if (node.nodeType !== 1) return false;
                    // Check for code blocks
                    if (node.classList && node.classList.contains("code-block")) return true;
                    if (node.querySelector && node.querySelector(".code-block")) return true;
                    // Check for main content container changes (SPA navigation)
                    if (node.tagName === "MAIN" || node.querySelector && node.querySelector("main")) return true;
                    if (node.tagName === "ARTICLE" || node.querySelector && node.querySelector("article")) return true;
                    return false;
                });
            });
            
            if (shouldReprocess) {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(function() {
                    cleanupOrphanedBars();
                    processCodeBlocks();
                }, 100);
            }
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Handle browser back/forward navigation
        window.addEventListener("popstate", function() {
            // Delay slightly to let the DOM update
            setTimeout(function() {
                cleanupOrphanedBars();
                processCodeBlocks();
            }, 150);
        });
        
        // Handle clicks on navigation links (left nav, right nav TOC, etc.)
        // This catches SPA navigation that might not trigger MutationObserver properly
        document.addEventListener("click", function(e) {
            var link = e.target.closest("a");
            if (!link) return;
            
            var href = link.getAttribute("href");
            if (!href) return;
            
            // Check if it's an internal navigation link (not external)
            var isInternal = href.startsWith("/") || href.startsWith("#") || 
                            (link.hostname === location.hostname);
            
            if (isInternal) {
                // Delay to let the SPA router update the DOM
                setTimeout(function() {
                    cleanupOrphanedBars();
                    processCodeBlocks();
                }, 200);
                
                // Also check again after a longer delay for slower renders
                setTimeout(function() {
                    cleanupOrphanedBars();
                    processCodeBlocks();
                }, 500);
            }
        });
    }
    
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
