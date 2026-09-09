const API_BASE_URL = "http://127.0.0.1:8000";


// =========================
// AUTHENTICATION
// =========================

const token =
    localStorage.getItem("access_token");

const storedUser =
    localStorage.getItem("user");


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
// GET TICKET ID
// =========================

const urlParams =
    new URLSearchParams(window.location.search);

const ticketId =
    urlParams.get("id");


if (!ticketId) {

    window.location.href =
        "tickets.html";
}


// =========================
// ELEMENTS
// =========================

const loadingState =
    document.getElementById("loadingState");

const errorState =
    document.getElementById("errorState");

const ticketContent =
    document.getElementById("ticketContent");

const ticketIdElement =
    document.getElementById("ticketId");

const ticketTitle =
    document.getElementById("ticketTitle");

const ticketCreated =
    document.getElementById("ticketCreated");

const ticketStatus =
    document.getElementById("ticketStatus");

const ticketDescription =
    document.getElementById("ticketDescription");

const sideStatus =
    document.getElementById("sideStatus");

const sideCategory =
    document.getElementById("sideCategory");

const sidePriority =
    document.getElementById("sidePriority");

const sideAgent =
    document.getElementById("sideAgent");

const sideCreated =
    document.getElementById("sideCreated");

const imageCard =
    document.getElementById("imageCard");

const ticketImage =
    document.getElementById("ticketImage");

const aiCard =
    document.getElementById("aiCard");

const aiCategory =
    document.getElementById("aiCategory");

const aiPriority =
    document.getElementById("aiPriority");

const aiResponse =
    document.getElementById("aiResponse");

const commentsList =
    document.getElementById("commentsList");

const commentForm =
    document.getElementById("commentForm");

const commentMessage =
    document.getElementById("commentMessage");

const commentButton =
    document.getElementById("commentButton");

const ratingCard =
    document.getElementById("ratingCard");

const ratingStars =
    document.querySelectorAll(
        "#ratingStars button"
    );

const ratingFeedback =
    document.getElementById(
        "ratingFeedback"
    );

const submitRating =
    document.getElementById(
        "submitRating"
    );

const ratingMessage =
    document.getElementById(
        "ratingMessage"
    );


// =========================
// CURRENT TICKET
// =========================

let currentTicket = null;

let selectedRating = 0;


// =========================
// LOAD TICKET
// =========================

async function loadTicket() {

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/tickets/${ticketId}`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            if (
                response.status === 401
            ) {

                logout();

                return;
            }


            throw new Error(
                data.detail ||
                "Unable to load ticket."
            );
        }


        currentTicket =
            data;


        renderTicket(
            data
        );


        await loadComments();

        await loadRating();


        loadingState.hidden =
            true;

        ticketContent.hidden =
            false;


    } catch (error) {

        console.error(error);

        loadingState.hidden =
            true;

        errorState.textContent =
            error.message ||
            "Unable to load ticket.";

        errorState.hidden =
            false;
    }
}


// =========================
// RENDER TICKET
// =========================

function renderTicket(ticket) {

    ticketIdElement.textContent =
        ticket.id;


    ticketTitle.textContent =
        ticket.title;


    ticketDescription.textContent =
        ticket.description;


    const formattedDate =
        formatDate(
            ticket.created_at
        );


    ticketCreated.textContent =
        `Created ${formattedDate}`;


    sideCreated.textContent =
        formattedDate;


    // -------------------------
    // STATUS
    // -------------------------

    const status =
        ticket.status || "open";


    ticketStatus.textContent =
        formatStatus(status);


    ticketStatus.className =
        `status-badge status-${status}`;


    sideStatus.textContent =
        formatStatus(status);


    // -------------------------
    // CATEGORY
    // -------------------------

    sideCategory.textContent =
        ticket.category || "Other";


    // -------------------------
    // PRIORITY
    // -------------------------

    sidePriority.textContent =
        ticket.priority || "Medium";


    // -------------------------
    // AGENT
    // -------------------------

    if (ticket.agent_id) {

        sideAgent.textContent =
            `Agent #${ticket.agent_id}`;

    } else {

        sideAgent.textContent =
            "Not assigned";
    }


    // -------------------------
    // IMAGE
    // -------------------------

    if (ticket.image) {

        imageCard.hidden =
            false;

        ticketImage.src =
            `${API_BASE_URL}${ticket.image}`;

    } else {

        imageCard.hidden =
            true;
    }


    // -------------------------
    // AI ANALYSIS
    // -------------------------

    if (
        ticket.ai_category ||
        ticket.ai_priority ||
        ticket.ai_response
    ) {

        aiCard.hidden =
            false;


        aiCategory.textContent =
            ticket.ai_category ||
            "Not available";


        aiPriority.textContent =
            ticket.ai_priority ||
            "Not available";


        aiResponse.textContent =
            ticket.ai_response ||
            "No suggested response available.";

    } else {

        aiCard.hidden =
            true;
    }


    // -------------------------
    // TIMELINE
    // -------------------------

    updateTimeline(
        status
    );


    // -------------------------
    // RATING
    // -------------------------

    if (
        status === "resolved" ||
        status === "closed"
    ) {

        ratingCard.hidden =
            false;
    }
}


// =========================
// TIMELINE
// =========================

function updateTimeline(status) {

    const timelineOpen =
        document.getElementById(
            "timelineOpen"
        );

    const timelineProgress =
        document.getElementById(
            "timelineProgress"
        );

    const timelineResolved =
        document.getElementById(
            "timelineResolved"
        );

    const timelineClosed =
        document.getElementById(
            "timelineClosed"
        );


    timelineOpen.classList.add(
        "active"
    );


    if (
        status === "in_progress" ||
        status === "resolved" ||
        status === "closed"
    ) {

        timelineProgress.classList.add(
            "active"
        );
    }


    if (
        status === "resolved" ||
        status === "closed"
    ) {

        timelineResolved.classList.add(
            "active"
        );
    }


    if (status === "closed") {

        timelineClosed.classList.add(
            "active"
        );
    }
}


// =========================
// LOAD COMMENTS
// =========================

async function loadComments() {

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/tickets/${ticketId}/comments`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            if (
                response.status === 401
            ) {

                logout();

                return;
            }


            throw new Error(
                data.detail ||
                "Unable to load comments."
            );
        }


        renderComments(
            data
        );


    } catch (error) {

        console.error(error);

        commentsList.innerHTML = `
            <div class="no-comments">
                Unable to load conversation.
            </div>
        `;
    }
}


// =========================
// RENDER COMMENTS
// =========================

function renderComments(comments) {

    if (
        !comments ||
        comments.length === 0
    ) {

        commentsList.innerHTML = `
            <div class="no-comments">
                No messages yet. Start the conversation below.
            </div>
        `;

        return;
    }


    commentsList.innerHTML =
        comments.map(
            comment => {

                const isCurrentUser =
                    currentUser &&
                    comment.user_id ===
                    currentUser.id;


                const author =
                    isCurrentUser
                        ? "You"
                        : `User #${comment.user_id}`;


                const role =
                    isCurrentUser
                        ? currentUser.role
                        : "Support";


                return `
                    <div class="comment-item">

                        <div class="comment-avatar">
                            ${getInitial(
                                author
                            )}
                        </div>

                        <div class="comment-content">

                            <div class="comment-top">

                                <span class="comment-author">
                                    ${escapeHtml(author)}
                                </span>

                                <span class="comment-role">
                                    ${escapeHtml(role)}
                                </span>

                                <span class="comment-date">
                                    ${formatDateTime(
                                        comment.created_at
                                    )}
                                </span>

                            </div>

                            <p class="comment-message">
                                ${escapeHtml(
                                    comment.message
                                )}
                            </p>

                        </div>

                    </div>
                `;
            }
        ).join("");
}


// =========================
// ADD COMMENT
// =========================

commentForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const message =
            commentMessage.value.trim();


        if (!message) {
            return;
        }


        commentButton.disabled =
            true;

        commentButton.textContent =
            "Sending...";


        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/tickets/${ticketId}/comments`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`
                        },

                        body: JSON.stringify({
                            message: message
                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                if (
                    response.status === 401
                ) {

                    logout();

                    return;
                }


                throw new Error(
                    data.detail ||
                    "Unable to send message."
                );
            }


            commentMessage.value =
                "";


            await loadComments();


        } catch (error) {

            alert(
                error.message ||
                "Unable to send message."
            );

        } finally {

            commentButton.disabled =
                false;

            commentButton.textContent =
                "Send message";
        }
    }
);


// =========================
// RATING STARS
// =========================

ratingStars.forEach(
    star => {

        star.addEventListener(
            "click",
            () => {

                selectedRating =
                    Number(
                        star.dataset.rating
                    );


                ratingStars.forEach(
                    item => {

                        const value =
                            Number(
                                item.dataset.rating
                            );


                        item.classList.toggle(
                            "selected",
                            value <= selectedRating
                        );
                    }
                );
            }
        );
    }
);


// =========================
// SUBMIT RATING
// =========================

submitRating.addEventListener(
    "click",
    async () => {

        if (!selectedRating) {

            showRatingMessage(
                "Please select a rating first.",
                true
            );

            return;
        }


        submitRating.disabled =
            true;

        submitRating.textContent =
            "Submitting...";


        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/tickets/${ticketId}/rating`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`
                        },

                        body: JSON.stringify({
                            rating:
                                selectedRating,

                            feedback:
                                ratingFeedback.value.trim() ||
                                null
                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    "Unable to submit rating."
                );
            }


            showRatingMessage(
                "Thank you! Your rating has been submitted.",
                false
            );


            submitRating.disabled =
                true;

            submitRating.textContent =
                "Rating submitted";


            ratingStars.forEach(
                star => {
                    star.disabled =
                        true;
                }
            );


            ratingFeedback.disabled =
                true;


        } catch (error) {

            showRatingMessage(
                error.message ||
                "Unable to submit rating.",
                true
            );


            submitRating.disabled =
                false;

            submitRating.textContent =
                "Submit rating";
        }
    }
);


// =========================
// LOAD EXISTING RATING
// =========================

async function loadRating() {

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/tickets/${ticketId}/rating`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        if (response.status === 404) {

            return;
        }


        const data =
            await response.json();


        if (!response.ok) {
            return;
        }


        selectedRating =
            data.rating;


        ratingStars.forEach(
            star => {

                const value =
                    Number(
                        star.dataset.rating
                    );


                star.classList.toggle(
                    "selected",
                    value <= selectedRating
                );


                star.disabled =
                    true;
            }
        );


        if (data.feedback) {

            ratingFeedback.value =
                data.feedback;
        }


        ratingFeedback.disabled =
            true;


        submitRating.disabled =
            true;

        submitRating.textContent =
            "Rating submitted";


        showRatingMessage(
            "You have already rated this ticket.",
            false
        );


    } catch (error) {

        console.error(
            "Rating check failed:",
            error
        );
    }
}


// =========================
// RATING MESSAGE
// =========================

function showRatingMessage(
    message,
    isError
) {

    ratingMessage.textContent =
        message;

    ratingMessage.hidden =
        false;


    if (isError) {

        ratingMessage.style.background =
            "rgba(255,70,70,0.07)";

        ratingMessage.style.color =
            "#ff9b9b";

    } else {

        ratingMessage.style.background =
            "rgba(90,210,150,0.07)";

        ratingMessage.style.color =
            "#91d2ad";
    }
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
// DATE
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
// DATE + TIME
// =========================

function formatDateTime(dateString) {

    if (!dateString) {
        return "";
    }


    const date =
        new Date(dateString);


    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


// =========================
// INITIAL
// =========================

function getInitial(name) {

    if (!name) {
        return "U";
    }


    return name
        .charAt(0)
        .toUpperCase();
}


// =========================
// HTML ESCAPE
// =========================

function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;
}


// =========================
// LOGOUT
// =========================

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


const logoutButton =
    document.getElementById(
        "logoutButton"
    );


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        logout
    );
}


// =========================
// START
// =========================

loadTicket();