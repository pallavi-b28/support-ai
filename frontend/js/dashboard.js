const API_BASE_URL = "http://127.0.0.1:8000";

const token = localStorage.getItem("access_token");
const storedUser = localStorage.getItem("user");


// =========================
// AUTH CHECK
// =========================

if (!token || !storedUser) {
    window.location.href = "login.html";
}


let currentUser;

try {
    currentUser = JSON.parse(storedUser);
} catch (error) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    window.location.href = "login.html";
}


// =========================
// CUSTOMER CHECK
// =========================

if (currentUser && currentUser.role !== "customer") {

    if (currentUser.role === "admin") {
        window.location.href = "admin-dashboard.html";
    }

    if (currentUser.role === "agent") {
        window.location.href = "agent-dashboard.html";
    }
}


// =========================
// USER INFORMATION
// =========================

const customerName =
    document.getElementById("customerName");

const headerUserName =
    document.getElementById("headerUserName");

const userAvatar =
    document.getElementById("userAvatar");


if (currentUser) {

    const name =
        currentUser.name || "Customer";

    customerName.textContent = name.split(" ")[0];

    headerUserName.textContent = name;

    userAvatar.textContent =
        name.charAt(0).toUpperCase();
}


// =========================
// DASHBOARD ELEMENTS
// =========================

const totalTickets =
    document.getElementById("totalTickets");

const openTickets =
    document.getElementById("openTickets");

const inProgressTickets =
    document.getElementById("inProgressTickets");

const resolvedTickets =
    document.getElementById("resolvedTickets");

const averageRating =
    document.getElementById("averageRating");

const ratedTickets =
    document.getElementById("ratedTickets");

const aiAnalyzedTickets =
    document.getElementById("aiAnalyzedTickets");

const ticketsList =
    document.getElementById("ticketsList");

const dashboardMessage =
    document.getElementById("dashboardMessage");


// =========================
// LOAD DASHBOARD
// =========================

async function loadDashboard() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/customer/dashboard`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );


        if (!response.ok) {

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

            throw new Error(
                "Unable to load dashboard"
            );
        }


        const data =
            await response.json();


        updateDashboard(data);

        await loadTickets();


    } catch (error) {

        console.error(error);

        showMessage(
            "Unable to connect to SupportAI. Make sure the FastAPI server is running."
        );
    }
}


// =========================
// UPDATE STATISTICS
// =========================

function updateDashboard(data) {

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


    if (
        data.average_rating !== null &&
        data.average_rating !== undefined
    ) {

        averageRating.textContent =
            `${data.average_rating} / 5`;

    } else {

        averageRating.textContent =
            "Not rated";
    }


    ratedTickets.textContent =
        data.rated_tickets ?? 0;


    aiAnalyzedTickets.textContent =
        data.ai_analyzed_tickets ?? 0;
}


// =========================
// LOAD TICKETS
// =========================

async function loadTickets() {

    try {

        const response = await fetch(
            `${API_BASE_URL}/tickets/my`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );


        if (!response.ok) {
            throw new Error(
                "Unable to load tickets"
            );
        }


        const tickets =
            await response.json();


        renderTickets(tickets);


    } catch (error) {

        console.error(error);

        ticketsList.innerHTML = `
            <div class="loading-state">
                Unable to load tickets.
            </div>
        `;
    }
}


// =========================
// RENDER TICKETS
// =========================

function renderTickets(tickets) {

    if (!tickets || tickets.length === 0) {

        ticketsList.innerHTML = `
            <div class="loading-state">
                <span>
                    You haven't created any tickets yet.
                </span>
            </div>
        `;

        return;
    }


    const recentTickets =
        tickets.slice(0, 5);


    ticketsList.innerHTML =
        recentTickets.map(ticket => {

            const statusClass =
                `status-${ticket.status}`;

            const date =
                formatDate(ticket.created_at);


            return `
                <div class="ticket-item">

                    <div class="ticket-info">

                        <span class="ticket-title">
                            ${escapeHtml(ticket.title)}
                        </span>

                        <span class="ticket-meta">
                            #${ticket.id}
                            ·
                            ${escapeHtml(ticket.category)}
                            ·
                            ${date}
                        </span>

                    </div>


                    <span
                        class="ticket-status ${statusClass}"
                    >
                        ${formatStatus(ticket.status)}
                    </span>

                </div>
            `;

        }).join("");
}


// =========================
// FORMAT STATUS
// =========================

function formatStatus(status) {

    if (!status) {
        return "Unknown";
    }


    return status
        .replaceAll("_", " ")
        .replace(/\b\w/g, letter =>
            letter.toUpperCase()
        );
}


// =========================
// FORMAT DATE
// =========================

function formatDate(dateString) {

    if (!dateString) {
        return "";
    }


    const date =
        new Date(dateString);


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


// =========================
// ESCAPE HTML
// =========================

function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;
}


// =========================
// SHOW MESSAGE
// =========================

function showMessage(message) {

    dashboardMessage.textContent =
        message;

    dashboardMessage.hidden =
        false;
}


// =========================
// LOGOUT
// =========================

const logoutButton =
    document.getElementById("logoutButton");


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


// =========================
// START
// =========================

loadDashboard();