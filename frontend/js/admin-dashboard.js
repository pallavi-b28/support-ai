const API_BASE_URL = "http://127.0.0.1:8000";


// =========================================
// AUTHENTICATION
// =========================================

const token =
    localStorage.getItem("access_token");

const storedUser =
    localStorage.getItem("user");


if (!token || !storedUser) {

    window.location.href = "login.html";

}


let user;

try {

    user = JSON.parse(storedUser);

} catch (error) {

    localStorage.clear();

    window.location.href = "login.html";

}


// Only admin can access this page

if (user && user.role !== "admin") {

    if (user.role === "agent") {

        window.location.href =
            "agent-dashboard.html";

    } else {

        window.location.href =
            "dashboard.html";

    }

}


// =========================================
// DOM ELEMENTS
// =========================================

const adminName =
    document.getElementById("adminName");

const welcomeName =
    document.getElementById("welcomeName");

const profileAvatar =
    document.getElementById("profileAvatar");

const lastUpdated =
    document.getElementById("lastUpdated");

const dashboardError =
    document.getElementById("dashboardError");


// =========================================
// DISPLAY ADMIN
// =========================================

if (user) {

    const name =
        user.name || "Admin";

    adminName.textContent = name;

    welcomeName.textContent = name;

    profileAvatar.textContent =
        name.charAt(0).toUpperCase();

}


// =========================================
// FETCH DASHBOARD
// =========================================

async function loadDashboard() {

    dashboardError.hidden = true;

    try {

        const response = await fetch(
            `${API_BASE_URL}/admin/dashboard`,
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${token}`
                }
            }
        );


        if (response.status === 401) {

            localStorage.clear();

            window.location.href =
                "login.html";

            return;

        }


        if (response.status === 403) {

            throw new Error(
                "You do not have admin access."
            );

        }


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Failed to load dashboard"
            );

        }


        updateDashboard(data);


        const now =
            new Date();

        lastUpdated.textContent =
            `Updated ${now.toLocaleTimeString(
                [],
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            )}`;


    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

        dashboardError.textContent =
            error.message ||
            "Unable to load dashboard data.";

        dashboardError.hidden = false;

    }

}


// =========================================
// UPDATE DASHBOARD
// =========================================

function updateDashboard(data) {

    // =========================
    // USERS
    // =========================

    const users =
        data.users || {};

    setText(
        "totalUsers",
        users.total || 0
    );

    setText(
        "totalCustomers",
        users.customers || 0
    );

    setText(
        "totalAgents",
        users.agents || 0
    );


    // =========================
    // TICKETS
    // =========================

    const tickets =
        data.tickets || {};

    setText(
        "totalTickets",
        tickets.total || 0
    );

    setText(
        "openTickets",
        tickets.open || 0
    );

    setText(
        "progressTickets",
        tickets.in_progress || 0
    );

    setText(
        "resolvedTickets",
        tickets.resolved || 0
    );

    setText(
        "closedTickets",
        tickets.closed || 0
    );


    // =========================
    // RATING
    // =========================

    const average =
        data.ratings?.average;

    if (
        average !== null &&
        average !== undefined
    ) {

        setText(
            "averageRating",
            Number(average).toFixed(1)
        );

    } else {

        setText(
            "averageRating",
            "—"
        );

    }


    // =========================
    // CATEGORY
    // =========================

    renderChart(
        "categoryChart",
        data.tickets_by_category || {}
    );


    // =========================
    // PRIORITY
    // =========================

    renderChart(
        "priorityChart",
        data.tickets_by_priority || {}
    );


    // =========================
    // AI COUNT
    // =========================

    const aiCategories =
        data.ai_tickets_by_category || {};

    const aiPriorities =
        data.ai_tickets_by_priority || {};


    let aiTotal = 0;

    Object.values(
        aiCategories
    ).forEach(value => {

        aiTotal += Number(value);

    });


    setText(
        "aiTicketCount",
        aiTotal
    );


    // =========================
    // AI CHARTS
    // =========================

    renderChart(
        "aiCategoryChart",
        aiCategories
    );


    renderChart(
        "aiPriorityChart",
        aiPriorities
    );

}


// =========================================
// SET TEXT HELPER
// =========================================

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(elementId);

    if (element) {

        element.textContent = value;

    }

}


// =========================================
// RENDER BAR CHART
// =========================================

function renderChart(
    elementId,
    data
) {

    const container =
        document.getElementById(elementId);


    if (!container) {
        return;
    }


    container.innerHTML = "";


    const entries =
        Object.entries(data);


    if (entries.length === 0) {

        container.innerHTML = `
            <div class="chart-loading">
                No data available yet.
            </div>
        `;

        return;

    }


    // Find maximum value

    const maxValue =
        Math.max(
            ...entries.map(
                ([, value]) =>
                    Number(value)
            ),
            1
        );


    entries.forEach(
        ([label, value]) => {

            const numericValue =
                Number(value);


            const percentage =
                (
                    numericValue /
                    maxValue
                ) * 100;


            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "chart-row";


            row.innerHTML = `

                <span class="chart-label">
                    ${formatLabel(label)}
                </span>

                <div class="chart-bar-container">

                    <div
                        class="chart-bar"
                        style="width: ${percentage}%"
                    ></div>

                </div>

                <span class="chart-value">
                    ${numericValue}
                </span>

            `;


            container.appendChild(row);

        }
    );

}


// =========================================
// FORMAT LABEL
// =========================================

function formatLabel(label) {

    if (!label) {
        return "Unknown";
    }


    return label
        .replaceAll("_", " ")
        .replace(/\b\w/g, char =>
            char.toUpperCase()
        );

}


// =========================================
// LOGOUT
// =========================================

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


// =========================================
// REFRESH
// =========================================

const refreshButton =
    document.getElementById(
        "refreshButton"
    );


if (refreshButton) {

    refreshButton.addEventListener(
        "click",
        async () => {

            refreshButton.disabled = true;

            refreshButton.textContent =
                "↻ Loading...";


            await loadDashboard();


            refreshButton.disabled = false;

            refreshButton.textContent =
                "↻ Refresh";

        }
    );

}


// =========================================
// INITIAL LOAD
// =========================================

loadDashboard();