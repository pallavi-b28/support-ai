const API_BASE_URL =
    "https://support-ai-1.onrender.com";


// =========================================
// AUTH
// =========================================

const token =
    localStorage.getItem("access_token");

const storedUser =
    localStorage.getItem("user");


if (!token || !storedUser) {

    window.location.href =
        "login.html";

}


let user;

try {

    user =
        JSON.parse(storedUser);

} catch (error) {

    localStorage.clear();

    window.location.href =
        "login.html";

}


if (
    user &&
    user.role !== "admin"
) {

    if (user.role === "agent") {

        window.location.href =
            "agent-dashboard.html";

    } else {

        window.location.href =
            "dashboard.html";

    }

}


// =========================================
// DOM
// =========================================

const adminName =
    document.getElementById("adminName");

const profileAvatar =
    document.getElementById("profileAvatar");

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

const resultCount =
    document.getElementById(
        "resultCount"
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


// =========================================
// ADMIN NAME
// =========================================

if (user) {

    const name =
        user.name || "Admin";

    adminName.textContent =
        name;

    profileAvatar.textContent =
        name
            .charAt(0)
            .toUpperCase();

}


// =========================================
// DATA
// =========================================

let allTickets = [];

let allUsers = [];

let agents = [];

let selectedTicketId = null;


// =========================================
// LOAD TICKETS
// =========================================

async function loadTickets() {

    hideError();

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/tickets/`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        if (
            response.status === 401
        ) {

            logout();

            return;

        }


        if (
            response.status === 403
        ) {

            throw new Error(
                "Admin access required."
            );

        }


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Unable to load tickets."
            );

        }


        allTickets =
            Array.isArray(data)
                ? data
                : [];


        renderSummary();

        renderTickets();

    } catch (error) {

        console.error(error);

        showError(
            error.message ||
            "Unable to load tickets."
        );

    }

}


// =========================================
// LOAD USERS / AGENTS
// =========================================

async function loadUsers() {

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/admin/users`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        if (
            response.status === 401
        ) {

            logout();

            return;

        }


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Unable to load users."
            );

        }


        allUsers =
            Array.isArray(data)
                ? data
                : [];


        agents =
            allUsers.filter(
                currentUser =>
                    currentUser.role === "agent"
            );

    } catch (error) {

        console.error(
            "Users error:",
            error
        );

    }

}


// =========================================
// SUMMARY
// =========================================

function renderSummary() {

    const total =
        allTickets.length;

    const open =
        allTickets.filter(
            ticket =>
                ticket.status === "open"
        ).length;

    const progress =
        allTickets.filter(
            ticket =>
                ticket.status === "in_progress"
        ).length;

    const resolved =
        allTickets.filter(
            ticket =>
                ticket.status === "resolved"
        ).length;

    const closed =
        allTickets.filter(
            ticket =>
                ticket.status === "closed"
        ).length;


    setText(
        "totalTickets",
        total
    );

    setText(
        "openTickets",
        open
    );

    setText(
        "progressTickets",
        progress
    );

    setText(
        "resolvedTickets",
        resolved
    );

    setText(
        "closedTickets",
        closed
    );

}


// =========================================
// FILTER
// =========================================

function getFilteredTickets() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();

    const selectedStatus =
        statusFilter.value;

    const selectedPriority =
        priorityFilter.value;

    const selectedCategory =
        categoryFilter.value;


    return allTickets.filter(
        ticket => {

            const matchesSearch =
                !search ||
                String(ticket.id)
                    .includes(search) ||
                ticket.title
                    .toLowerCase()
                    .includes(search) ||
                ticket.description
                    .toLowerCase()
                    .includes(search);


            const matchesStatus =
                selectedStatus === "all" ||
                ticket.status === selectedStatus;


            const matchesPriority =
                selectedPriority === "all" ||
                ticket.priority === selectedPriority;


            const matchesCategory =
                selectedCategory === "all" ||
                ticket.category?.toLowerCase() ===
                    selectedCategory;


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

    const tickets =
        getFilteredTickets();


    resultCount.textContent =
        `${tickets.length} ${
            tickets.length === 1
                ? "ticket"
                : "tickets"
        }`;


    ticketsTableBody.innerHTML = "";


    if (tickets.length === 0) {

        emptyState.hidden = false;

        return;

    }


    emptyState.hidden = true;


    tickets.forEach(
        ticket => {

            const row =
                document.createElement(
                    "tr"
                );


            const customer =
                findUser(
                    ticket.customer_id
                );


            const agent =
                findUser(
                    ticket.agent_id
                );


            row.innerHTML = `

                <td>

                    <div class="ticket-title">

                        <strong>
                            ${escapeHtml(
                                ticket.title
                            )}
                        </strong>

                        <span class="ticket-number">
                            Ticket #${ticket.id}
                        </span>

                    </div>

                </td>


                <td>

                    <span class="category">
                        ${formatLabel(
                            ticket.category
                        )}
                    </span>

                </td>


                <td>

                    <span class="badge priority-${ticket.priority}">
                        ${formatLabel(
                            ticket.priority
                        )}
                    </span>

                </td>


                <td>

                    <span class="badge status-${ticket.status}">
                        ${formatLabel(
                            ticket.status
                        )}
                    </span>

                </td>


                <td>

                    ${
                        customer
                            ? escapeHtml(
                                customer.name
                            )
                            : `User #${ticket.customer_id}`
                    }

                </td>


                <td>

                    ${
                        agent
                            ? `
                                <div class="agent-cell">

                                    <div class="agent-avatar">
                                        ${agent.name
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>

                                    <span>
                                        ${escapeHtml(
                                            agent.name
                                        )}
                                    </span>

                                </div>
                              `
                            : `
                                <span class="unassigned">
                                    Not assigned
                                </span>
                              `
                    }

                </td>


                <td>
                    ${formatDate(
                        ticket.created_at
                    )}
                </td>


                <td>

                    <div class="actions">

                        <a
                            href="ticket-details.html?id=${ticket.id}"
                            class="view-btn"
                        >
                            View
                        </a>

                        <button
                            class="assign-btn-small"
                            data-ticket-id="${ticket.id}"
                        >
                            ${
                                ticket.agent_id
                                    ? "Reassign"
                                    : "Assign"
                            }
                        </button>

                    </div>

                </td>

            `;


            ticketsTableBody.appendChild(
                row
            );

        }
    );


    attachAssignButtons();

}


// =========================================
// ASSIGN BUTTONS
// =========================================

function attachAssignButtons() {

    const buttons =
        document.querySelectorAll(
            ".assign-btn-small"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const ticketId =
                        Number(
                            button.dataset.ticketId
                        );


                    openAssignModal(
                        ticketId
                    );

                }
            );

        }
    );

}


// =========================================
// ASSIGN MODAL
// =========================================

const assignModal =
    document.getElementById(
        "assignModal"
    );

const agentSelect =
    document.getElementById(
        "agentSelect"
    );

const selectedTicketTitle =
    document.getElementById(
        "selectedTicketTitle"
    );

const closeModal =
    document.getElementById(
        "closeModal"
    );

const cancelAssign =
    document.getElementById(
        "cancelAssign"
    );

const confirmAssign =
    document.getElementById(
        "confirmAssign"
    );

const assignError =
    document.getElementById(
        "assignError"
    );


function openAssignModal(
    ticketId
) {

    selectedTicketId =
        ticketId;


    const ticket =
        allTickets.find(
            item =>
                item.id === ticketId
        );


    if (!ticket) {
        return;
    }


    selectedTicketTitle.textContent =
        `#${ticket.id} — ${ticket.title}`;


    agentSelect.innerHTML = `
        <option value="">
            Select an agent
        </option>
    `;


    agents.forEach(
        agent => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                agent.id;

            option.textContent =
                `${agent.name} — ${agent.email}`;


            if (
                ticket.agent_id ===
                agent.id
            ) {

                option.selected =
                    true;

            }


            agentSelect.appendChild(
                option
            );

        }
    );


    assignError.hidden =
        true;

    assignModal.hidden =
        false;

}


function closeAssignModal() {

    assignModal.hidden =
        true;

    selectedTicketId =
        null;

}


closeModal.addEventListener(
    "click",
    closeAssignModal
);


cancelAssign.addEventListener(
    "click",
    closeAssignModal
);


assignModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            assignModal
        ) {

            closeAssignModal();

        }

    }
);


// =========================================
// CONFIRM ASSIGNMENT
// =========================================

confirmAssign.addEventListener(
    "click",
    async () => {

        const agentId =
            agentSelect.value;


        if (!agentId) {

            assignError.textContent =
                "Please select an agent.";

            assignError.hidden =
                false;

            return;

        }


        if (!selectedTicketId) {
            return;
        }


        confirmAssign.disabled =
            true;

        confirmAssign.textContent =
            "Assigning...";


        assignError.hidden =
            true;


        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/admin/tickets/${selectedTicketId}/assign?agent_id=${agentId}`,
                    {
                        method: "PUT",

                        headers: {
                            "Authorization":
                                `Bearer ${token}`
                        }
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    "Unable to assign ticket."
                );

            }


            const ticket =
                allTickets.find(
                    item =>
                        item.id ===
                        selectedTicketId
                );


            if (ticket) {

                ticket.agent_id =
                    Number(agentId);

            }


            closeAssignModal();

            renderTickets();


        } catch (error) {

            console.error(error);

            assignError.textContent =
                error.message ||
                "Unable to assign ticket.";

            assignError.hidden =
                false;

        } finally {

            confirmAssign.disabled =
                false;

            confirmAssign.textContent =
                "Assign Ticket";

        }

    }
);


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
// LOGOUT
// =========================================

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


logoutButton.addEventListener(
    "click",
    logout
);


function logout() {

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
// HELPERS
// =========================================

function findUser(
    id
) {

    if (!id) {
        return null;
    }

    return allUsers.find(
        currentUser =>
            currentUser.id === id
    ) || null;

}


function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value;

    }

}


function formatLabel(
    value
) {

    if (!value) {
        return "Unknown";
    }


    return value
        .replaceAll("_", " ")
        .replace(
            /\b\w/g,
            char =>
                char.toUpperCase()
        );

}


function formatDate(
    value
) {

    if (!value) {
        return "—";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";

    }


    return date.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


function escapeHtml(
    value
) {

    if (value === null ||
        value === undefined) {

        return "";

    }


    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function showError(
    message
) {

    errorMessage.textContent =
        message;

    errorMessage.hidden =
        false;

}


function hideError() {

    errorMessage.hidden =
        true;

}


// =========================================
// INITIAL LOAD
// =========================================

async function initialize() {

    await loadUsers();

    await loadTickets();

}


initialize();