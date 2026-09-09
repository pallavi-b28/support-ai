const API_BASE_URL =
    "http://127.0.0.1:8000";


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

const usersTableBody =
    document.getElementById(
        "usersTableBody"
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

const roleFilter =
    document.getElementById(
        "roleFilter"
    );


// =========================================
// ADMIN PROFILE
// =========================================

if (currentUser) {

    const name =
        currentUser.name ||
        "Admin";

    adminName.textContent =
        name;

    profileAvatar.textContent =
        name
            .charAt(0)
            .toUpperCase();

}


// =========================================
// USERS DATA
// =========================================

let allUsers = [];


// =========================================
// LOAD USERS
// =========================================

async function loadUsers() {

    hideError();

    usersTableBody.innerHTML = `
        <tr>
            <td
                colspan="5"
                class="loading-cell"
            >
                Loading users...
            </td>
        </tr>
    `;

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/admin/users`,
                {
                    method: "GET",

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
                "Unable to load users."
            );

        }


        allUsers =
            Array.isArray(data)
                ? data
                : [];


        updateSummary();

        renderUsers();

    } catch (error) {

        console.error(
            "Users error:",
            error
        );

        usersTableBody.innerHTML = "";

        showError(
            error.message ||
            "Unable to load users."
        );

    }

}


// =========================================
// SUMMARY
// =========================================

function updateSummary() {

    const total =
        allUsers.length;


    const customers =
        allUsers.filter(
            user =>
                user.role === "customer"
        ).length;


    const agents =
        allUsers.filter(
            user =>
                user.role === "agent"
        ).length;


    setText(
        "totalUsers",
        total
    );

    setText(
        "totalCustomers",
        customers
    );

    setText(
        "totalAgents",
        agents
    );

}


// =========================================
// FILTER USERS
// =========================================

function getFilteredUsers() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    const selectedRole =
        roleFilter.value;


    return allUsers.filter(
        user => {

            const name =
                user.name
                    ?.toLowerCase() ||
                "";

            const email =
                user.email
                    ?.toLowerCase() ||
                "";


            const matchesSearch =
                !search ||
                name.includes(search) ||
                email.includes(search) ||
                String(user.id)
                    .includes(search);


            const matchesRole =
                selectedRole === "all" ||
                user.role === selectedRole;


            return (
                matchesSearch &&
                matchesRole
            );

        }
    );

}


// =========================================
// RENDER USERS
// =========================================

function renderUsers() {

    const users =
        getFilteredUsers();


    resultCount.textContent =
        `${users.length} ${
            users.length === 1
                ? "user"
                : "users"
        }`;


    usersTableBody.innerHTML = "";


    if (users.length === 0) {

        emptyState.hidden =
            false;

        return;

    }


    emptyState.hidden =
        true;


    users.forEach(
        user => {

            const row =
                document.createElement(
                    "tr"
                );


            const name =
                user.name ||
                "Unknown User";


            const email =
                user.email ||
                "—";


            const role =
                user.role ||
                "unknown";


            row.innerHTML = `

                <td>

                    <div class="user-cell">

                        <div class="user-avatar">

                            ${escapeHtml(
                                name
                                    .charAt(0)
                                    .toUpperCase()
                            )}

                        </div>

                        <div class="user-name">

                            <strong>
                                ${escapeHtml(
                                    name
                                )}
                            </strong>

                            <small>
                                SupportAI account
                            </small>

                        </div>

                    </div>

                </td>


                <td>
                    ${escapeHtml(
                        email
                    )}
                </td>


                <td>

                    <span
                        class="role-badge role-${role}"
                    >
                        ${formatLabel(
                            role
                        )}
                    </span>

                </td>


                <td>

                    <span class="user-id">
                        #${user.id}
                    </span>

                </td>


                <td>
                    ${formatDate(
                        user.created_at
                    )}
                </td>

            `;


            usersTableBody.appendChild(
                row
            );

        }
    );

}


// =========================================
// FILTER EVENTS
// =========================================

searchInput.addEventListener(
    "input",
    renderUsers
);

roleFilter.addEventListener(
    "change",
    renderUsers
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

loadUsers();