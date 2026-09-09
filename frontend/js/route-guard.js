// =========================================
// SUPPORTAI ROUTE GUARD
// =========================================

(function () {

    const token =
        localStorage.getItem("access_token");

    const storedUser =
        localStorage.getItem("user");


    // =====================================
    // NOT LOGGED IN
    // =====================================

    if (!token || !storedUser) {

        window.location.href =
            "login.html";

        return;
    }


    let user;

    try {

        user =
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

        return;
    }


    // =====================================
    // CURRENT PAGE
    // =====================================

    const page =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();


    // =====================================
    // CUSTOMER PAGES
    // =====================================

    const customerPages = [
        "dashboard.html",
        "tickets.html",
        "create-ticket.html",
        "ticket-details.html"
    ];


    // =====================================
    // AGENT PAGES
    // =====================================

    const agentPages = [
        "agent-dashboard.html",
        "agent-tickets.html",
        "agent-ticket-details.html"
    ];


    // =====================================
    // ADMIN PAGES
    // =====================================

    const adminPages = [
        "admin-dashboard.html",
        "admin-tickets.html",
        "admin-users.html",
        "admin-agents.html"
    ];


    // =====================================
    // CUSTOMER ACCESS
    // =====================================

    if (
        customerPages.includes(page) &&
        user.role !== "customer"
    ) {

        if (user.role === "agent") {

            window.location.href =
                "agent-dashboard.html";

        } else if (
            user.role === "admin"
        ) {

            window.location.href =
                "admin-dashboard.html";

        } else {

            window.location.href =
                "login.html";
        }

        return;
    }


    // =====================================
    // AGENT ACCESS
    // =====================================

    if (
        agentPages.includes(page) &&
        user.role !== "agent" &&
        user.role !== "admin"
    ) {

        if (user.role === "customer") {

            window.location.href =
                "dashboard.html";

        } else {

            window.location.href =
                "login.html";
        }

        return;
    }


    // =====================================
    // ADMIN ACCESS
    // =====================================

    if (
        adminPages.includes(page) &&
        user.role !== "admin"
    ) {

        if (user.role === "agent") {

            window.location.href =
                "agent-dashboard.html";

        } else if (
            user.role === "customer"
        ) {

            window.location.href =
                "dashboard.html";

        } else {

            window.location.href =
                "login.html";
        }

        return;
    }

})();