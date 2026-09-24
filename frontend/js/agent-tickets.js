const API_BASE_URL = "https://support-ai-1.onrender.com";


// =========================================
// AUTHENTICATION
// =========================================

const token = localStorage.getItem(
    "access_token"
);

const storedUser =
    localStorage.getItem("user");

if (!token || !storedUser) {

    window.location.href =
        "login.html";
}

let currentUser;

try {

    currentUser =
        JSON.parse(storedUser);

} catch (error) {

    localStorage.removeItem(
        "access_token"
    );

    localStorage.removeItem(
        "user"
    );

    window.location.href =
        "login.html";
}


// =========================================
// ROLE CHECK
// =========================================

if (
    currentUser &&
    currentUser.role !== "agent" &&
    currentUser.role !== "admin"
) {

    window.location.href =
        "dashboard.html";
}


// =========================================
// ELEMENTS
// =========================================

const agentName =
    document.getElementById(
        "agentName"
    );

const profileAvatar =
    document.getElementById(
        "profileAvatar"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );

const loadingState =
    document.getElementById(
        "loadingState"
    );

const ticketsSection =
    document.getElementById(
        "ticketsSection"
    );

const ticketsTableBody =
    document.getElementById(
        "ticketsTableBody"
    );

const emptyState =
    document.getElementById(
        "emptyState"
    );

const errorMessage =
    document.getElementById(
        "errorMessage"
    );

const searchInput =
    document.getElementById(
        "searchInput"
    );

const statusFilter =
    document.getElementById(
        "statusFilter"
    );

const priorityFilter =
    document.getElementById(
        "priorityFilter"
    );

const categoryFilter =
    document.getElementById(
        "categoryFilter"
    );

const resultCount =
    document.getElementById(
        "resultCount"
    );


// =========================================
// PROFILE
// =========================================

if (currentUser) {

    agentName.textContent =
        currentUser.name || "Agent";

    profileAvatar.textContent =
        (
            currentUser.name ||
            "A"
        )
        .charAt(0)
        .toUpperCase();
}


// =========================================
// STATE
// =========================================

let tickets = [];


// =========================================
// LOGOUT
// =========================================

logoutButton.addEventListener(
    "click",
    () => {

        localStorage.removeItem(
            "access_token"
        );

        localStorage.removeItem(
            "user"
        );

        window.location.href =
            "login.html";
    }
);


// =========================================
// LOAD TICKETS
// =========================================

async function loadTickets() {

    loadingState.hidden = false;

    ticketsSection.hidden = true;

    errorMessage.hidden = true;

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/agent/tickets`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        if (response.status === 401) {

            localStorage.removeItem(
                "access_token"
            );

            localStorage.removeItem(
                "user"
            );

            window.location.href =
                "login.html";

            return;
        }


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Unable to load tickets."
            );
        }


        tickets = data || [];


        updateSummary();

        renderTickets();


        loadingState.hidden = true;

        ticketsSection.hidden = false;


    } catch (error) {

        loadingState.hidden = true;

        errorMessage.textContent =
            error.message ||
            "Unable to load assigned tickets.";

        errorMessage.hidden = false;
    }
}


// =========================================
// UPDATE SUMMARY
// =========================================

function updateSummary() {

    const total =
        tickets.length;

    const open =
        tickets.filter(
            ticket =>
                ticket.status === "open"
        ).length;

    const active =
        tickets.filter(
            ticket =>
                ticket.status === "in_progress"
        ).length;

    const resolved =
        tickets.filter(
            ticket =>
                ticket.status === "resolved" ||
                ticket.status === "closed"
        ).length;


    document.getElementById(
        "totalTickets"
    ).textContent = total;


    document.getElementById(
        "openTickets"
    ).textContent = open;


    document.getElementById(
        "activeTickets"
    ).textContent = active;


    document.getElementById(
        "resolvedTickets"
    ).textContent = resolved;
}


// =========================================
// FILTER TICKETS
// =========================================

function getFilteredTickets() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();

    const status =
        statusFilter.value;

    const priority =
        priorityFilter.value;

    const category =
        categoryFilter.value;


    return tickets.filter(
        ticket => {

            const matchesSearch =
                !search ||

                String(ticket.id)
                    .includes(search) ||

                (ticket.title || "")
                    .toLowerCase()
                    .includes(search) ||

                (ticket.description || "")
                    .toLowerCase()
                    .includes(search);


            const matchesStatus =
                status === "all" ||
                ticket.status === status;


            const matchesPriority =
                priority === "all" ||
                (
                    ticket.priority ||
                    ""
                ).toLowerCase() === priority;


            const matchesCategory =
                category === "all" ||
                (
                    ticket.category ||
                    ""
                ).toLowerCase() === category;


            return (
                matchesSearch &&
                matchesStatus &&
                matchesPriority &&
                matchesCategory
            );
        }
    );
}


// =========================================
// RENDER TICKETS
// =========================================

function renderTickets() {

    const filteredTickets =
        getFilteredTickets();


    ticketsTableBody.innerHTML = "";


    resultCount.textContent =
        `${filteredTickets.length} ${
            filteredTickets.length === 1
                ? "ticket"
                : "tickets"
        }`;


    if (filteredTickets.length === 0) {

        emptyState.hidden = false;

        return;
    }


    emptyState.hidden = true;


    filteredTickets.forEach(
        ticket => {

            const row =
                document.createElement(
                    "tr"
                );


            const statusBadge =
                getStatusBadge(
                    ticket.status
                );


            const priorityBadge =
                getPriorityBadge(
                    ticket.priority
                );


            const category =
                capitalize(
                    ticket.category ||
                    "other"
                );


            const customer =
                ticket.customer_id
                    ? `Customer #${ticket.customer_id}`
                    : "Unknown";


            const aiIndicator =
                ticket.ai_category
                    ? `
                        <span class="ai-badge">
                            <span class="ai-dot"></span>
                            Analyzed
                        </span>
                      `
                    : `
                        <span>
                            —
                        </span>
                      `;


            const createdDate =
                formatDate(
                    ticket.created_at
                );


            row.innerHTML = `

                <td>

                    <div class="ticket-id">
                        #${ticket.id}
                    </div>

                    <div
                        class="ticket-title"
                        title="${escapeHtml(
                            ticket.title || ""
                        )}"
                    >
                        ${escapeHtml(
                            ticket.title ||
                            "Untitled ticket"
                        )}
                    </div>

                </td>


                <td>
                    ${customer}
                </td>


                <td>
                    ${category}
                </td>


                <td>
                    ${priorityBadge}
                </td>


                <td>
                    ${statusBadge}
                </td>


                <td>
                    ${aiIndicator}
                </td>


                <td>
                    ${createdDate}
                </td>


                <td>

                    <a
                        href="agent-ticket-details.html?id=${ticket.id}"
                        class="view-button"
                    >
                        View
                    </a>

                </td>
            `;


            ticketsTableBody.appendChild(
                row
            );
        }
    );
}


// =========================================
// STATUS BADGE
// =========================================

function getStatusBadge(status) {

    const normalized =
        (
            status ||
            "open"
        ).toLowerCase();


    let className =
        "badge-open";

    let label =
        "Open";


    if (
        normalized ===
        "in_progress"
    ) {

        className =
            "badge-progress";

        label =
            "In Progress";

    } else if (
        normalized ===
        "resolved"
    ) {

        className =
            "badge-resolved";

        label =
            "Resolved";

    } else if (
        normalized ===
        "closed"
    ) {

        className =
            "badge-closed";

        label =
            "Closed";
    }


    return `
        <span class="badge ${className}">
            ${label}
        </span>
    `;
}


// =========================================
// PRIORITY BADGE
// =========================================

function getPriorityBadge(priority) {

    const normalized =
        (
            priority ||
            "medium"
        ).toLowerCase();


    const labels = {
        critical: "Critical",
        high: "High",
        medium: "Medium",
        low: "Low"
    };


    const label =
        labels[normalized] ||
        capitalize(normalized);


    const className =
        [
            "critical",
            "high",
            "medium",
            "low"
        ].includes(normalized)
            ? `badge-${normalized}`
            : "badge-medium";


    return `
        <span class="badge ${className}">
            ${label}
        </span>
    `;
}


// =========================================
// FORMAT DATE
// =========================================

function formatDate(dateValue) {

    if (!dateValue) {
        return "—";
    }


    const date =
        new Date(dateValue);


    if (Number.isNaN(
        date.getTime()
    )) {

        return "—";
    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


// =========================================
// CAPITALIZE
// =========================================

function capitalize(value) {

    if (!value) {
        return "";
    }

    return value.charAt(0)
        .toUpperCase() +
        value.slice(1);
}


// =========================================
// ESCAPE HTML
// =========================================

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// =========================================
// FILTER EVENTS
// =========================================

searchInput.addEventListener(
    "input",
    renderTickets
);

statusFilter.addEventListener(
    "change",
    renderTickets
);

priorityFilter.addEventListener(
    "change",
    renderTickets
);

categoryFilter.addEventListener(
    "change",
    renderTickets
);


// =========================================
// INITIAL LOAD
// =========================================

loadTickets();