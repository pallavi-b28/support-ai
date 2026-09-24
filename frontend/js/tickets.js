const API_BASE_URL = "https://support-ai-1.onrender.com";


// =========================
// AUTH
// =========================

const token =
    localStorage.getItem("access_token");

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


// =========================
// ELEMENTS
// =========================

const tableBody =
    document.getElementById(
        "ticketsTableBody"
    );

const emptyState =
    document.getElementById(
        "emptyState"
    );

const ticketsError =
    document.getElementById(
        "ticketsError"
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

const ticketCount =
    document.getElementById(
        "ticketCount"
    );


// =========================
// SUMMARY ELEMENTS
// =========================

const summaryTotal =
    document.getElementById(
        "summaryTotal"
    );

const summaryOpen =
    document.getElementById(
        "summaryOpen"
    );

const summaryProgress =
    document.getElementById(
        "summaryProgress"
    );

const summaryResolved =
    document.getElementById(
        "summaryResolved"
    );


// =========================
// DATA
// =========================

let allTickets = [];


// =========================
// LOAD TICKETS
// =========================

async function loadTickets() {

    try {

        const response =
            await fetch(
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

            if (
                response.status === 401
            ) {

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
                "Unable to load tickets"
            );
        }


        allTickets =
            await response.json();


        updateSummary(
            allTickets
        );


        renderTickets(
            allTickets
        );


    } catch (error) {

        console.error(error);

        tableBody.innerHTML = "";

        ticketsError.textContent =
            "Unable to connect to SupportAI. Make sure the FastAPI server is running.";

        ticketsError.hidden =
            false;
    }
}


// =========================
// UPDATE SUMMARY
// =========================

function updateSummary(tickets) {

    summaryTotal.textContent =
        tickets.length;


    summaryOpen.textContent =
        tickets.filter(
            ticket =>
                ticket.status === "open"
        ).length;


    summaryProgress.textContent =
        tickets.filter(
            ticket =>
                ticket.status === "in_progress"
        ).length;


    summaryResolved.textContent =
        tickets.filter(
            ticket =>
                ticket.status === "resolved"
        ).length;
}


// =========================
// FILTER TICKETS
// =========================

function filterTickets() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    const selectedStatus =
        statusFilter.value;


    const selectedPriority =
        priorityFilter.value;


    const filtered =
        allTickets.filter(ticket => {

            const matchesSearch =
                !search ||
                ticket.title
                    .toLowerCase()
                    .includes(search) ||
                ticket.description
                    .toLowerCase()
                    .includes(search) ||
                ticket.category
                    .toLowerCase()
                    .includes(search);


            const matchesStatus =
                selectedStatus === "all" ||
                ticket.status === selectedStatus;


            const matchesPriority =
                selectedPriority === "all" ||
                ticket.priority === selectedPriority;


            return (
                matchesSearch &&
                matchesStatus &&
                matchesPriority
            );
        });


    renderTickets(
        filtered
    );
}


// =========================
// RENDER
// =========================

function renderTickets(tickets) {

    ticketCount.textContent =
        `${tickets.length} ${
            tickets.length === 1
                ? "ticket"
                : "tickets"
        }`;


    if (!tickets.length) {

        tableBody.innerHTML = "";

        emptyState.hidden =
            false;

        return;
    }


    emptyState.hidden =
        true;


    tableBody.innerHTML =
        tickets.map(ticket => {

            return `
                <tr>

                    <td>

                        <div class="table-ticket">

                            <div class="table-ticket-icon">
                                ◫
                            </div>

                            <div class="table-ticket-info">

                                <span
                                    class="table-ticket-title"
                                    title="${escapeHtml(ticket.title)}"
                                >
                                    ${escapeHtml(ticket.title)}
                                </span>

                                <span class="table-ticket-id">
                                    #${ticket.id}
                                </span>

                            </div>

                        </div>

                    </td>


                    <td>

                        <span class="category-text">
                            ${escapeHtml(ticket.category)}
                        </span>

                    </td>


                    <td>

                        <span
                            class="priority-badge priority-${ticket.priority}"
                        >
                            ${escapeHtml(ticket.priority)}
                        </span>

                    </td>


                    <td>

                        <span
                            class="status-badge status-${ticket.status}"
                        >
                            ${formatStatus(ticket.status)}
                        </span>

                    </td>


                    <td>
                        ${formatDate(ticket.created_at)}
                    </td>


                    <td>

                        <a
                            href="ticket-details.html?id=${ticket.id}"
                            class="view-ticket"
                        >
                            View →
                        </a>

                    </td>

                </tr>
            `;

        }).join("");
}


// =========================
// STATUS FORMAT
// =========================

function formatStatus(status) {

    if (!status) {
        return "Unknown";
    }


    return status
        .replaceAll("_", " ")
        .replace(
            /\b\w/g,
            letter =>
                letter.toUpperCase()
        );
}


// =========================
// DATE FORMAT
// =========================

function formatDate(dateString) {

    if (!dateString) {
        return "—";
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
// HTML SECURITY
// =========================

function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;
}


// =========================
// SEARCH
// =========================

searchInput.addEventListener(
    "input",
    filterTickets
);


// =========================
// STATUS FILTER
// =========================

statusFilter.addEventListener(
    "change",
    filterTickets
);


// =========================
// PRIORITY FILTER
// =========================

priorityFilter.addEventListener(
    "change",
    filterTickets
);


// =========================
// LOGOUT
// =========================

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


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

loadTickets();