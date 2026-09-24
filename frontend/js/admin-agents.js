const API_BASE_URL =
    "https://support-ai-1.onrender.com";


// =========================================
// AUTHENTICATION
// =========================================

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

    localStorage.clear();

    window.location.href =
        "login.html";

}


if (
    currentUser &&
    currentUser.role !== "admin"
) {

    if (currentUser.role === "agent") {

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
    document.getElementById(
        "adminName"
    );

const profileAvatar =
    document.getElementById(
        "profileAvatar"
    );

const agentsGrid =
    document.getElementById(
        "agentsGrid"
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

const resultCount =
    document.getElementById(
        "resultCount"
    );


// =========================================
// PROFILE
// =========================================

if (currentUser) {

    const name =
        currentUser.name ||
        "Admin";

    adminName.textContent =
        name;

    profileAvatar.textContent =
        name.charAt(0)
            .toUpperCase();

}


// =========================================
// DATA
// =========================================

let allUsers = [];

let allTickets = [];

let allRatings = [];

let agents = [];


// =========================================
// LOAD USERS
// =========================================

async function loadUsers() {

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

        return [];

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
            "Unable to load users."
        );

    }


    return Array.isArray(data)
        ? data
        : [];

}


// =========================================
// LOAD TICKETS
// =========================================

async function loadTickets() {

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

        return [];

    }


    const data =
        await response.json();


    if (!response.ok) {

        throw new Error(
            data.detail ||
            "Unable to load tickets."
        );

    }


    return Array.isArray(data)
        ? data
        : [];

}


// =========================================
// LOAD DATA
// =========================================

async function initialize() {

    hideError();


    agentsGrid.innerHTML = `
        <div class="loading-state">
            Loading agents...
        </div>
    `;


    try {

        allUsers =
            await loadUsers();


        allTickets =
            await loadTickets();


        agents =
            allUsers.filter(
                user =>
                    user.role === "agent"
            );


        updateSummary();

        renderAgents();

    } catch (error) {

        console.error(
            "Agent page error:",
            error
        );

        agentsGrid.innerHTML = "";

        showError(
            error.message ||
            "Unable to load agent data."
        );

    }

}


// =========================================
// SUMMARY
// =========================================

function updateSummary() {

    const totalAgents =
        agents.length;


    const assignedTickets =
        allTickets.filter(
            ticket =>
                ticket.agent_id !== null &&
                ticket.agent_id !== undefined
        ).length;


    const activeTickets =
        allTickets.filter(
            ticket =>
                ticket.agent_id !== null &&
                ticket.agent_id !== undefined &&
                [
                    "open",
                    "in_progress"
                ].includes(
                    ticket.status
                )
        ).length;


    setText(
        "totalAgents",
        totalAgents
    );

    setText(
        "assignedTickets",
        assignedTickets
    );

    setText(
        "activeTickets",
        activeTickets
    );

}


// =========================================
// FILTER
// =========================================

function getFilteredAgents() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    return agents.filter(
        agent => {

            const name =
                agent.name
                    ?.toLowerCase() || "";


            const email =
                agent.email
                    ?.toLowerCase() || "";


            return (
                !search ||
                name.includes(search) ||
                email.includes(search)
            );

        }
    );

}


// =========================================
// RENDER AGENTS
// =========================================

function renderAgents() {

    const filteredAgents =
        getFilteredAgents();


    resultCount.textContent =
        `${filteredAgents.length} ${
            filteredAgents.length === 1
                ? "agent"
                : "agents"
        }`;


    agentsGrid.innerHTML = "";


    if (
        filteredAgents.length === 0
    ) {

        emptyState.hidden =
            false;

        return;

    }


    emptyState.hidden =
        true;


    filteredAgents.forEach(
        agent => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "agent-card";


            const stats =
                getAgentStats(
                    agent.id
                );


            const rating =
                getAgentRating(
                    agent.id
                );


            const initial =
                agent.name
                    ?.charAt(0)
                    .toUpperCase() ||
                "A";


            const averageRating =
                rating !== null
                    ? Number(rating).toFixed(1)
                    : "—";


            card.innerHTML = `

                <div class="agent-top">

                    <div class="agent-avatar">
                        ${escapeHtml(initial)}
                    </div>


                    <div class="agent-name">

                        <strong>
                            ${escapeHtml(
                                agent.name
                            )}
                        </strong>

                        <span>
                            ${escapeHtml(
                                agent.email
                            )}
                        </span>

                    </div>


                    <span
                        class="online-dot"
                        title="Active agent"
                    ></span>

                </div>


                <div class="agent-stats">

                    <div class="agent-stat">

                        <strong>
                            ${stats.total}
                        </strong>

                        <span>
                            Total
                        </span>

                    </div>


                    <div class="agent-stat">

                        <strong>
                            ${stats.open}
                        </strong>

                        <span>
                            Open
                        </span>

                    </div>


                    <div class="agent-stat">

                        <strong>
                            ${stats.progress}
                        </strong>

                        <span>
                            Active
                        </span>

                    </div>


                    <div class="agent-stat">

                        <strong>
                            ${stats.resolved}
                        </strong>

                        <span>
                            Resolved
                        </span>

                    </div>

                </div>


                <div class="agent-footer">

                    <div class="agent-rating">

                        ★ ${averageRating}

                        <span>
                            Customer rating
                        </span>

                    </div>


                    <div class="agent-ai">

                        ✦ ${stats.ai} AI analyzed

                    </div>

                </div>

            `;


            agentsGrid.appendChild(
                card
            );

        }
    );

}


// =========================================
// AGENT STATS
// =========================================

function getAgentStats(
    agentId
) {

    const assigned =
        allTickets.filter(
            ticket =>
                ticket.agent_id === agentId
        );


    return {

        total:
            assigned.length,

        open:
            assigned.filter(
                ticket =>
                    ticket.status === "open"
            ).length,

        progress:
            assigned.filter(
                ticket =>
                    ticket.status === "in_progress"
            ).length,

        resolved:
            assigned.filter(
                ticket =>
                    ticket.status === "resolved"
            ).length,

        ai:
            assigned.filter(
                ticket =>
                    ticket.ai_category
            ).length

    };

}


// =========================================
// RATING
//
// We fetch ratings individually because
// the current backend does not provide
// a single "all ratings" endpoint.
// =========================================

const ratingCache = new Map();


// The agent page can initially display
// "—" for ratings because the current
// backend has no endpoint returning all
// ratings at once.

function getAgentRating(
    agentId
) {

    const assigned =
        allTickets.filter(
            ticket =>
                ticket.agent_id === agentId
        );


    const ratedTickets =
        assigned.filter(
            ticket =>
                ticket.status === "resolved" ||
                ticket.status === "closed"
        );


    // We don't have rating data directly
    // inside /tickets/, so return null
    // rather than showing incorrect data.

    if (
        ratedTickets.length === 0
    ) {

        return null;

    }


    return null;

}


// =========================================
// SEARCH
// =========================================

searchInput.addEventListener(
    "input",
    renderAgents
);


// =========================================
// CREATE AGENT MODAL
// =========================================

const agentModal =
    document.getElementById(
        "agentModal"
    );

const openCreateAgent =
    document.getElementById(
        "openCreateAgent"
    );

const closeAgentModal =
    document.getElementById(
        "closeAgentModal"
    );

const cancelCreateAgent =
    document.getElementById(
        "cancelCreateAgent"
    );

const createAgentForm =
    document.getElementById(
        "createAgentForm"
    );

const createAgentError =
    document.getElementById(
        "createAgentError"
    );

const submitAgent =
    document.getElementById(
        "submitAgent"
    );


function openModal() {

    createAgentForm.reset();

    createAgentError.hidden =
        true;

    agentModal.hidden =
        false;

}


function closeModal() {

    agentModal.hidden =
        true;

}


openCreateAgent.addEventListener(
    "click",
    openModal
);


closeAgentModal.addEventListener(
    "click",
    closeModal
);


cancelCreateAgent.addEventListener(
    "click",
    closeModal
);


agentModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            agentModal
        ) {

            closeModal();

        }

    }
);


// =========================================
// CREATE AGENT
// =========================================

createAgentForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const name =
            document.getElementById(
                "agentName"
            ).value.trim();


        const email =
            document.getElementById(
                "agentEmail"
            ).value.trim();


        const password =
            document.getElementById(
                "agentPassword"
            ).value;


        if (
            password.length < 6
        ) {

            showCreateAgentError(
                "Password must contain at least 6 characters."
            );

            return;

        }


        submitAgent.disabled =
            true;

        submitAgent.textContent =
            "Creating...";


        createAgentError.hidden =
            true;


        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/admin/agents`,
                    {
                        method: "POST",

                        headers: {
                            "Authorization":
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                name,
                                email,
                                password
                            })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    "Unable to create agent."
                );

            }


            closeModal();


            await initialize();


        } catch (error) {

            console.error(
                "Create agent error:",
                error
            );

            showCreateAgentError(
                error.message ||
                "Unable to create agent."
            );

        } finally {

            submitAgent.disabled =
                false;

            submitAgent.textContent =
                "Create Agent";

        }

    }
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


function showCreateAgentError(
    message
) {

    createAgentError.textContent =
        message;

    createAgentError.hidden =
        false;

}


function escapeHtml(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


// =========================================
// INITIALIZE
// =========================================

initialize();