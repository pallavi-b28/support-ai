const API_BASE_URL = "https://support-ai-1.onrender.com";


// =========================================
// AUTH CHECK
// =========================================

const token = localStorage.getItem("access_token");
const storedUser = localStorage.getItem("user");

if (!token || !storedUser) {
    window.location.href = "login.html";
}

let currentUser;

try {
    currentUser = JSON.parse(storedUser);
} catch (error) {
    localStorage.clear();
    window.location.href = "login.html";
}


// =========================================
// ROLE CHECK
// =========================================

if (
    currentUser &&
    currentUser.role !== "agent" &&
    currentUser.role !== "admin"
) {
    window.location.href = "dashboard.html";
}


// =========================================
// ELEMENTS
// =========================================

const agentName = document.getElementById("agentName");
const agentAvatar = document.getElementById("agentAvatar");

const totalTickets =
    document.getElementById("totalTickets");

const openTickets =
    document.getElementById("openTickets");

const inProgressTickets =
    document.getElementById("inProgressTickets");

const resolvedTickets =
    document.getElementById("resolvedTickets");

const closedTickets =
    document.getElementById("closedTickets");

const averageRating =
    document.getElementById("averageRating");

const aiAnalyzedTickets =
    document.getElementById("aiAnalyzedTickets");

const dashboardLoading =
    document.getElementById("dashboardLoading");

const dashboardError =
    document.getElementById("dashboardError");

const dashboardErrorMessage =
    document.getElementById("dashboardErrorMessage");

const retryButton =
    document.getElementById("retryButton");

const ticketTableWrapper =
    document.getElementById("ticketTableWrapper");

const ticketTableBody =
    document.getElementById("ticketTableBody");

const emptyState =
    document.getElementById("emptyState");

const priorityDistribution =
    document.getElementById("priorityDistribution");

const categoryDistribution =
    document.getElementById("categoryDistribution");

const logoutButton =
    document.getElementById("logoutButton");


// =========================================
// AUTH HEADERS
// =========================================

function getAuthHeaders() {

    return {
        "Authorization": `Bearer ${token}`
    };

}


// =========================================
// INITIAL AGENT INFO
// =========================================

function loadAgentInfo() {

    if (!currentUser) {
        return;
    }

    const name =
        currentUser.name || "Agent";

    agentName.textContent = name;

    const firstLetter =
        name.charAt(0).toUpperCase();

    agentAvatar.textContent =
        firstLetter;

}


// =========================================
// API REQUEST
// =========================================

async function apiRequest(url) {

    const response = await fetch(
        `${API_BASE_URL}${url}`,
        {
            method: "GET",
            headers: getAuthHeaders()
        }
    );

    if (response.status === 401) {

        localStorage.clear();

        window.location.href =
            "login.html";

        return null;
    }

    if (!response.ok) {

        let errorMessage =
            "Unable to load dashboard data.";

        try {

            const errorData =
                await response.json();

            errorMessage =
                errorData.detail ||
                errorMessage;

        } catch (error) {
            // Keep default message
        }

        throw new Error(errorMessage);
    }

    return await response.json();

}


// =========================================
// LOAD DASHBOARD
// =========================================

async function loadDashboard() {

    showLoading();

    try {

        const dashboardData =
            await apiRequest(
                "/agent/dashboard"
            );

        if (!dashboardData) {
            return;
        }

        renderDashboard(
            dashboardData
        );


        const tickets =
            await apiRequest(
                "/agent/tickets"
            );

        if (!tickets) {
            return;
        }

        renderTickets(tickets);

    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

        showError(
            error.message
        );

    }

}


// =========================================
// RENDER DASHBOARD STATS
// =========================================

function renderDashboard(data) {

    const tickets =
        data.tickets || {};


    totalTickets.textContent =
        tickets.total ?? 0;

    openTickets.textContent =
        tickets.open ?? 0;

    inProgressTickets.textContent =
        tickets.in_progress ?? 0;

    resolvedTickets.textContent =
        tickets.resolved ?? 0;

    closedTickets.textContent =
        tickets.closed ?? 0;


    if (
        data.average_rating !== null &&
        data.average_rating !== undefined
    ) {

        averageRating.textContent =
            `${data.average_rating} / 5`;

    } else {

        averageRating.textContent =
            "—";

    }


    aiAnalyzedTickets.textContent =
        data.ai_analyzed_tickets ?? 0;


    renderDistribution(
        priorityDistribution,
        data.tickets_by_priority || {}
    );


    renderDistribution(
        categoryDistribution,
        data.tickets_by_category || {}
    );

}


// =========================================
// RENDER TICKETS
// =========================================

function renderTickets(tickets) {

    dashboardLoading.hidden = true;
    dashboardError.hidden = true;


    if (
        !Array.isArray(tickets) ||
        tickets.length === 0
    ) {

        ticketTableWrapper.hidden = true;
        emptyState.hidden = false;

        return;
    }


    emptyState.hidden = true;
    ticketTableWrapper.hidden = false;


    ticketTableBody.innerHTML = "";


    // Show latest 5 tickets on dashboard

    const recentTickets =
        tickets.slice(0, 5);


    recentTickets.forEach(ticket => {

        const row =
            document.createElement("tr");


        const titleCell =
            document.createElement("td");

        titleCell.className =
            "ticket-title-cell";


        const title =
            document.createElement("span");

        title.className =
            "ticket-title";

        title.textContent =
            ticket.title;


        const id =
            document.createElement("span");

        id.className =
            "ticket-id";

        id.textContent =
            `Ticket #${ticket.id}`;


        titleCell.appendChild(title);
        titleCell.appendChild(id);


        // CATEGORY

        const categoryCell =
            document.createElement("td");

        categoryCell.textContent =
            formatText(
                ticket.category
            );


        // PRIORITY

        const priorityCell =
            document.createElement("td");

        const priorityBadge =
            document.createElement("span");

        priorityBadge.className =
            `ticket-badge priority-${ticket.priority}`;

        priorityBadge.textContent =
            formatText(
                ticket.priority
            );

        priorityCell.appendChild(
            priorityBadge
        );


        // STATUS

        const statusCell =
            document.createElement("td");

        const statusBadge =
            document.createElement("span");

        statusBadge.className =
            `ticket-badge status-${ticket.status}`;

        statusBadge.textContent =
            formatText(
                ticket.status
            );

        statusCell.appendChild(
            statusBadge
        );


        // CREATED DATE

        const createdCell =
            document.createElement("td");

        createdCell.textContent =
            formatDate(
                ticket.created_at
            );


        // VIEW BUTTON

        const actionCell =
            document.createElement("td");

        const viewButton =
            document.createElement("a");

        viewButton.className =
            "ticket-view-button";

        viewButton.href =
            `agent-ticket-details.html?id=${ticket.id}`;

        viewButton.textContent =
            "→";

        viewButton.setAttribute(
            "aria-label",
            `Open ticket ${ticket.id}`
        );


        actionCell.appendChild(
            viewButton
        );


        // ADD CELLS

        row.appendChild(
            titleCell
        );

        row.appendChild(
            categoryCell
        );

        row.appendChild(
            priorityCell
        );

        row.appendChild(
            statusCell
        );

        row.appendChild(
            createdCell
        );

        row.appendChild(
            actionCell
        );


        ticketTableBody.appendChild(
            row
        );

    });

}


// =========================================
// DISTRIBUTION CHART
// =========================================

function renderDistribution(
    container,
    data
) {

    container.innerHTML = "";


    const entries =
        Object.entries(data);


    if (entries.length === 0) {

        const empty =
            document.createElement("div");

        empty.className =
            "distribution-empty";

        empty.textContent =
            "No data available yet.";

        container.appendChild(
            empty
        );

        return;
    }


    const maxValue =
        Math.max(
            ...entries.map(
                ([, value]) => Number(value)
            ),
            1
        );


    entries
        .sort((a, b) => b[1] - a[1])
        .forEach(
            ([label, value]) => {

                const row =
                    document.createElement("div");

                row.className =
                    "distribution-row";


                const labelElement =
                    document.createElement("span");

                labelElement.className =
                    "distribution-label";

                labelElement.textContent =
                    formatText(label);


                const bar =
                    document.createElement("div");

                bar.className =
                    "distribution-bar";


                const fill =
                    document.createElement("div");

                fill.className =
                    "distribution-fill";


                const percentage =
                    (
                        Number(value) /
                        maxValue
                    ) * 100;


                fill.style.width =
                    `${percentage}%`;


                bar.appendChild(fill);


                const count =
                    document.createElement("span");

                count.className =
                    "distribution-count";

                count.textContent =
                    value;


                row.appendChild(
                    labelElement
                );

                row.appendChild(
                    bar
                );

                row.appendChild(
                    count
                );


                container.appendChild(
                    row
                );

            }
        );

}


// =========================================
// FORMAT TEXT
// =========================================

function formatText(value) {

    if (!value) {
        return "—";
    }


    return value
        .replaceAll("_", " ")
        .replace(
            /\b\w/g,
            character =>
                character.toUpperCase()
        );

}


// =========================================
// FORMAT DATE
// =========================================

function formatDate(dateString) {

    if (!dateString) {
        return "—";
    }


    const date =
        new Date(dateString);


    if (Number.isNaN(date.getTime())) {
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
// LOADING STATE
// =========================================

function showLoading() {

    dashboardLoading.hidden = false;

    dashboardError.hidden = true;

    ticketTableWrapper.hidden = true;

    emptyState.hidden = true;

}


// =========================================
// ERROR STATE
// =========================================

function showError(message) {

    dashboardLoading.hidden = true;

    ticketTableWrapper.hidden = true;

    emptyState.hidden = true;

    dashboardError.hidden = false;

    dashboardErrorMessage.textContent =
        message ||
        "Something went wrong while loading the dashboard.";

}


// =========================================
// RETRY
// =========================================

if (retryButton) {

    retryButton.addEventListener(
        "click",
        () => {

            loadDashboard();

        }
    );

}


// =========================================
// LOGOUT
// =========================================

if (logoutButton) {

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

}


// =========================================
// START
// =========================================

loadAgentInfo();

loadDashboard();