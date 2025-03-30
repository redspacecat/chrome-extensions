// When the popup is loaded, initialize the event listeners for buttons and load data
window.onload = function () {
    // Attach click event listeners to "add" and "reset" buttons
    document.getElementById("add").addEventListener("click", get);
    document.getElementById("reset").addEventListener("click", reset);

    // Load any existing data into the popup
    loadData();
};

// For seeing what rules there are
// console.log(await chrome.declarativeNetRequest.getDynamicRules());

// Helper function to sort an array of objects by a specified key
function sortArrayByKey(array, key) {
    return [...array].sort((a, b) => {
        if (a[key] < b[key]) {
            return -1;
        }
        if (a[key] > b[key]) {
            return 1;
        }
        return 0;
    });
}

// Function to load rules
async function loadData() {
    // Define a template for adding rows to the table in the HTML
    let template = `<tr><td></td><td></td><td hidden></td><td></td></tr>`;

    // Fetch the rules
    let data = await chrome.declarativeNetRequest.getDynamicRules();

    // If there are rules, make the relevant UI elements visible
    if (data.length > 0) {
        document.querySelector("#data").hidden = false;
        document.querySelector("#reset").hidden = false;
        document.querySelector("#spacer").hidden = false;
    }

    // Sort the rules by their id to make sure they are always in a consistent order
    data = sortArrayByKey(data, "id");

    // Loop through each rule and add it to the table
    for (let rule of data) {
        let node = htmlToNode(template);

        // Set the shortcut (query parameter from the rule's URL filter)
        node.childNodes[0].innerText = new URLSearchParams(new URL(rule.condition.urlFilter).search).get("q");
        node.childNodes[0].addEventListener("click", function () {
            updateProperty("New Shortcut?", this, rule.id);
        });

        node.childNodes[1].style.whiteSpace = "nowrap"; // Prevent the URL from breaking on hyphens
        node.childNodes[1].innerText = rule.action.redirect.url; // Set the redirect URL for the rule
        node.childNodes[1].addEventListener("click", function () {
            updateProperty("New URL?", this, rule.id);
        });

        // Set the rule's ID in the third cell
        // This isn't displayed to the user, but so that the delete button can access it
        node.childNodes[2].innerText = rule.id;
        node.childNodes[2].style.textAlign = "center";

        // Add a "Delete" button to the last cell and attach an event listener for deletion
        node.childNodes[3].appendChild(htmlToNode(`<button class="delete">Delete</button>`));
        node.childNodes[3].addEventListener("click", function () {
            // Delete the corresponding rule when clicked
            deleteShortcut(parseInt(this.previousSibling.innerText));
        });

        // Append the newly created row to the table in the HTML
        document.getElementById("data").appendChild(node);
    }
}

// Function to update a property (either the shortcut or the URL)
async function updateProperty(type, el, id) {
    // Prompt the user for the new value
    let response = prompt(type, el.innerText);
    if (response) {
        el.innerText = response;
    } else {
        return; // Exit if the user cancels
    }

    // Prepare the new shortcut and URL values
    let shortcut;
    let url;
    if (type == "New Shortcut?") {
        shortcut = el.innerText;
        url = el.nextSibling.innerText;
    } else {
        shortcut = el.previousSibling.innerText;
        url = el.innerText;

        // Validate URL
        let m = new RegExp(/^http[s]?:\/{2}/);
        if (!m.test(url)) {
            alert("URL must specify protocol — http(s)://");
            location.reload();
            return; // Exit if the URL is invalid
        }
    }

    // Update the rules
    await chrome.declarativeNetRequest.updateDynamicRules({
        addRules: [
            {
                id: id,
                priority: 1,
                action: {
                    type: "redirect",
                    redirect: {
                        url: url,
                    },
                },
                condition: {
                    urlFilter: `https://www.google.com/search?q=${encodeURIComponent(shortcut)}&`,
                    resourceTypes: ["main_frame"],
                },
            },
        ],
        removeRuleIds: [id], // Remove the old rule first and then re add it
    });
}

// Function to handle adding a new shortcut
async function get() {
    // Prompt the user for the new URL
    let url = prompt("URL?");
    if (!url) {
        return; // Exit if no URL is provided
    }

    // Validate that the URL contains the protocol (http:// or https://)
    let m = new RegExp(/^http[s]?:\/{2}/);
    if (!m.test(url)) {
        alert("URL must specify protocol — http(s)://");
        return; // Exit if the URL is invalid
    }

    // Prompt the user for the new shortcut
    let shortcut = prompt("Shortcut?");
    if (!shortcut) {
        return; // Exit if no shortcut is provided
    }

    // Fetch the current dynamic rules to check for duplicate shortcuts
    let data = await chrome.declarativeNetRequest.getDynamicRules();
    let shortcuts = [];
    for (let rule of data) {
        shortcuts.push(new URLSearchParams(new URL(rule.condition.urlFilter).search).get("q"));
    }

    // If the shortcut already exists, alert the user and do not proceed
    if (shortcuts.includes(shortcut)) {
        alert(`The shortcut phrase "${shortcut}" is already being used`);
        return;
    }

    // Add the new shortcut and URL, generating a random ID
    addShortcut(shortcut, url, Math.floor(Math.random() * 10000000));

    // Reload the page to update the displayed data
    location.reload();
}

// Function to add a new shortcut rule to the dynamic rules
async function addShortcut(shortcut, url, id) {
    await chrome.declarativeNetRequest.updateDynamicRules({
        addRules: [
            {
                id: id,
                priority: 1,
                action: {
                    type: "redirect",
                    redirect: {
                        url: url,
                    },
                },
                condition: {
                    urlFilter: `https://www.google.com/search?q=${encodeURIComponent(shortcut)}&`, // Catch the google search for the shortcut and redirect it
                    resourceTypes: ["main_frame"],
                },
            },
        ],
    });
}

// Utility function to convert an HTML string into a DOM node
function htmlToNode(html) {
    const template = document.createElement("template");
    template.innerHTML = html;
    const nNodes = template.content.childNodes.length;
    if (nNodes !== 1) {
        throw new Error(`html parameter must represent a single node; got ${nNodes}.`);
    }
    return template.content.firstChild;
}

// Function to reset all dynamic rules (delete all shortcuts)
async function reset() {
    if (!confirm("Are you sure?")) {
        return;
    }
    // Fetch all rules to get IDs
    let data = await chrome.declarativeNetRequest.getDynamicRules();
    let ids = [];
    for (let rule of data) {
        ids.push(rule.id);
    }

    // Remove all rules by their IDs
    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: ids,
    });

    location.reload();
}

// Function to delete a specific shortcut by its ID
async function deleteShortcut(id) {
    // Remove the rule with the specified ID
    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [id],
    });

    // Reload the page to update the displayed data
    location.reload();
}
