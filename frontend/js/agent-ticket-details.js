const API_BASE_URL = "http://127.0.0.1:8000";


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


let currentUser;


try {

    currentUser =
        JSON.parse(storedUser);

} catch (error) {

    localStorage.clear();

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
// TICKET ID
// =========================================

const urlParams =
    new URLSearchParams(
        window.location.search
    );


const ticketId =
    urlParams.get("id");


if (!ticketId) {

    window.location.href =
        "agent-dashboard.html";

}


// =========================================
// ELEMENTS
// =========================================

const pageLoading =
    document.getElementById(
        "pageLoading"
    );

const pageError =
    document.getElementById(
        "pageError"
    );

const errorMessage =
    document.getElementById(
        "errorMessage"
    );

const retryButton =
    document.getElementById(
        "retryButton"
    );

const ticketLayout =
    document.getElementById(
        "ticketLayout"
    );


const ticketTitle =
    document.getElementById(
        "ticketTitle"
    );

const ticketCreated =
    document.getElementById(
        "ticketCreated"
    );

const headerStatus =
    document.getElementById(
        "headerStatus"
    );


const ticketDescription =
    document.getElementById(
        "ticketDescription"
    );


const screenshotSection =
    document.getElementById(
        "screenshotSection"
    );

const ticketImage =
    document.getElementById(
        "ticketImage"
    );

const ticketImageLink =
    document.getElementById(
        "ticketImageLink"
    );


const ticketIdElement =
    document.getElementById(
        "ticketId"
    );

const ticketStatus =
    document.getElementById(
        "ticketStatus"
    );

const ticketCategory =
    document.getElementById(
        "ticketCategory"
    );

const ticketPriority =
    document.getElementById(
        "ticketPriority"
    );

const customerId =
    document.getElementById(
        "customerId"
    );

const assignedAgent =
    document.getElementById(
        "assignedAgent"
    );

const createdDate =
    document.getElementById(
        "createdDate"
    );


const statusSelect =
    document.getElementById(
        "statusSelect"
    );

const updateStatusButton =
    document.getElementById(
        "updateStatusButton"
    );

const statusButtonText =
    document.getElementById(
        "statusButtonText"
    );

const statusSpinner =
    document.getElementById(
        "statusSpinner"
    );

const statusMessage =
    document.getElementById(
        "statusMessage"
    );


const analyzeButton =
    document.getElementById(
        "analyzeButton"
    );

const analyzeButtonText =
    document.getElementById(
        "analyzeButtonText"
    );

const analyzeSpinner =
    document.getElementById(
        "analyzeSpinner"
    );


const aiResults =
    document.getElementById(
        "aiResults"
    );

const aiEmpty =
    document.getElementById(
        "aiEmpty"
    );

const aiCategory =
    document.getElementById(
        "aiCategory"
    );

const aiPriority =
    document.getElementById(
        "aiPriority"
    );

const aiResponse =
    document.getElementById(
        "aiResponse"
    );


const copyResponseButton =
    document.getElementById(
        "copyResponseButton"
    );


const messages =
    document.getElementById(
        "messages"
    );


const messageInput =
    document.getElementById(
        "messageInput"
    );

const sendMessageButton =
    document.getElementById(
        "sendMessageButton"
    );

const sendButtonText =
    document.getElementById(
        "sendButtonText"
    );

const sendSpinner =
    document.getElementById(
        "sendSpinner"
    );


const logoutButton =
    document.getElementById(
        "logoutButton"
    );


// =========================================
// AUTH HEADERS
// =========================================

function getAuthHeaders() {

    return {
        "Authorization":
            `Bearer ${token}`,

        "Content-Type":
            "application/json"
    };

}


// =========================================
// API REQUEST
// =========================================

async function apiRequest(
    url,
    options = {}
) {

    const response =
        await fetch(
            `${API_BASE_URL}${url}`,
            {
                ...options,

                headers: {
                    ...getAuthHeaders(),
                    ...(options.headers || {})
                }
            }
        );


    if (response.status === 401) {

        localStorage.clear();

        window.location.href =
            "login.html";

        return null;

    }


    let data = null;


    try {

        data =
            await response.json();

    } catch (error) {

        // Response has no JSON body

    }


    if (!response.ok) {

        throw new Error(
            data?.detail ||
            "Something went wrong."
        );

    }


    return data;

}


// =========================================
// LOAD TICKET
// =========================================

async function loadTicket() {

    showLoading();


    try {

        const ticket =
            await apiRequest(
                `/agent/tickets/${ticketId}`
            );


        if (!ticket) {
            return;
        }


        renderTicket(ticket);


        await loadComments();


    } catch (error) {

        console.error(
            "Ticket loading error:",
            error
        );


        showError(
            error.message
        );

    }

}


// =========================================
// RENDER TICKET
// =========================================

function renderTicket(ticket) {

    pageLoading.hidden = true;

    pageError.hidden = true;

    ticketLayout.hidden = false;


    // TITLE

    ticketTitle.textContent =
        ticket.title;


    // CREATED

    const created =
        formatDateTime(
            ticket.created_at
        );


    ticketCreated.textContent =
        `Created ${created}`;


    createdDate.textContent =
        formatDate(
            ticket.created_at
        );


    // DESCRIPTION

    ticketDescription.textContent =
        ticket.description;


    // HEADER STATUS

    headerStatus.textContent =
        formatText(
            ticket.status
        );


    headerStatus.className =
        "header-status";


    headerStatus.classList.add(
        `header-${ticket.status}`
    );


    // INFO

    ticketIdElement.textContent =
        `#${ticket.id}`;


    ticketStatus.textContent =
        formatText(
            ticket.status
        );


    ticketCategory.textContent =
        formatText(
            ticket.category
        );


    ticketPriority.textContent =
        formatText(
            ticket.priority
        );


    customerId.textContent =
        `#${ticket.customer_id}`;


    if (ticket.agent_id) {

        assignedAgent.textContent =
            `Agent #${ticket.agent_id}`;

    } else {

        assignedAgent.textContent =
            "Not Assigned";

    }


    // STATUS SELECT

    statusSelect.value =
        ticket.status;


    // IMAGE

    if (ticket.image) {

        const imageUrl =
            ticket.image.startsWith("http")
                ? ticket.image
                : `${API_BASE_URL}${ticket.image}`;


        ticketImage.src =
            imageUrl;


        ticketImageLink.href =
            imageUrl;


        screenshotSection.hidden =
            false;

    } else {

        screenshotSection.hidden =
            true;

    }


    // AI RESULTS

    renderAI(ticket);


    // JOURNEY

    updateJourney(
        ticket.status
    );

}


// =========================================
// AI RENDER
// =========================================

function renderAI(ticket) {

    if (
        ticket.ai_category ||
        ticket.ai_priority ||
        ticket.ai_response
    ) {

        aiEmpty.hidden = true;

        aiResults.hidden = false;


        aiCategory.textContent =
            formatText(
                ticket.ai_category
            );


        aiPriority.textContent =
            formatText(
                ticket.ai_priority
            );


        aiResponse.textContent =
            ticket.ai_response ||
            "No suggested response available.";

    } else {

        aiResults.hidden = true;

        aiEmpty.hidden = false;

    }

}


// =========================================
// RUN AI ANALYSIS
// =========================================

async function analyzeTicket() {

    analyzeButton.disabled =
        true;

    analyzeButtonText.textContent =
        "Analyzing...";

    analyzeSpinner.hidden =
        false;


    try {

        const result =
            await apiRequest(
                `/ai/tickets/${ticketId}/analyze`,
                {
                    method: "POST"
                }
            );


        if (!result) {
            return;
        }


        aiEmpty.hidden =
            true;

        aiResults.hidden =
            false;


        aiCategory.textContent =
            formatText(
                result.category
            );


        aiPriority.textContent =
            formatText(
                result.priority
            );


        aiResponse.textContent =
    result.response ||
    "No suggested response generated.";


        showStatusMessage(
            "AI analysis completed successfully.",
            "success"
        );


    } catch (error) {

        console.error(
            "AI analysis error:",
            error
        );


        alert(
            error.message ||
            "AI analysis failed."
        );

    } finally {

        analyzeButton.disabled =
            false;

        analyzeButtonText.textContent =
            "Analyze ticket";

        analyzeSpinner.hidden =
            true;

    }

}


// =========================================
// LOAD COMMENTS
// =========================================

async function loadComments() {

    try {

        const comments =
            await apiRequest(
                `/tickets/${ticketId}/comments`
            );


        if (!comments) {
            return;
        }


        renderComments(
            comments
        );


    } catch (error) {

        console.error(
            "Comments error:",
            error
        );


        messages.innerHTML = "";


        const errorElement =
            document.createElement(
                "div"
            );


        errorElement.className =
            "messages-empty";


        errorElement.textContent =
            "Unable to load conversation.";


        messages.appendChild(
            errorElement
        );

    }

}


// =========================================
// RENDER COMMENTS
// =========================================

function renderComments(comments) {

    messages.innerHTML = "";


    if (
        !Array.isArray(comments) ||
        comments.length === 0
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "messages-empty";


        empty.textContent =
            "No messages yet. Send the first response to the customer.";


        messages.appendChild(
            empty
        );


        return;

    }


    comments.forEach(
        comment => {

            const message =
                document.createElement(
                    "div"
                );


            const isAgent =
                Number(comment.user_id) ===
                Number(currentUser.id);


            message.className =
                `message ${
                    isAgent
                        ? "agent-message"
                        : "customer-message"
                }`;


            const meta =
                document.createElement(
                    "div"
                );


            meta.className =
                "message-meta";


            const author =
                document.createElement(
                    "span"
                );


            author.className =
                "message-author";


            author.textContent =
                isAgent
                    ? "You"
                    : `Customer #${comment.user_id}`;


            const time =
                document.createElement(
                    "span"
                );


            time.className =
                "message-time";


            time.textContent =
                formatDateTime(
                    comment.created_at
                );


            meta.appendChild(
                author
            );

            meta.appendChild(
                time
            );


            const text =
                document.createElement(
                    "p"
                );


            text.className =
                "message-text";


            text.textContent =
                comment.message;


            message.appendChild(
                meta
            );

            message.appendChild(
                text
            );


            messages.appendChild(
                message
            );

        }
    );


    messages.scrollTop =
        messages.scrollHeight;

}


// =========================================
// SEND COMMENT
// =========================================

async function sendMessage() {

    const message =
        messageInput.value.trim();


    if (!message) {

        alert(
            "Please enter a response."
        );

        messageInput.focus();

        return;

    }


    sendMessageButton.disabled =
        true;

    sendButtonText.textContent =
        "Sending...";

    sendSpinner.hidden =
        false;


    try {

        await apiRequest(
            `/tickets/${ticketId}/comments`,
            {
                method: "POST",

                body: JSON.stringify({
                    message: message
                })
            }
        );


        messageInput.value = "";


        await loadComments();


    } catch (error) {

        console.error(
            "Send message error:",
            error
        );


        alert(
            error.message ||
            "Unable to send response."
        );

    } finally {

        sendMessageButton.disabled =
            false;

        sendButtonText.textContent =
            "Send response";

        sendSpinner.hidden =
            true;

    }

}


// =========================================
// UPDATE STATUS
// =========================================

async function updateStatus() {

    const newStatus =
        statusSelect.value;


    updateStatusButton.disabled =
        true;

    statusButtonText.textContent =
        "Updating...";

    statusSpinner.hidden =
        false;


    try {

        const params =
            new URLSearchParams();


        params.append(
            "status",
            newStatus
        );


        const response =
            await fetch(
                `${API_BASE_URL}/agent/tickets/${ticketId}/status?${params.toString()}`,
                {
                    method: "PUT",

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


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Unable to update status."
            );

        }


        renderTicket(
            data
        );


        showStatusMessage(
            "Ticket status updated successfully.",
            "success"
        );


    } catch (error) {

        console.error(
            "Status update error:",
            error
        );


        showStatusMessage(
            error.message,
            "error"
        );


    } finally {

        updateStatusButton.disabled =
            false;

        statusButtonText.textContent =
            "Update status";

        statusSpinner.hidden =
            true;

    }

}


// =========================================
// JOURNEY
// =========================================

function updateJourney(status) {

    const steps = [
        "open",
        "in_progress",
        "resolved",
        "closed"
    ];


    const currentIndex =
        steps.indexOf(status);


    document
        .querySelectorAll(
            ".journey-step"
        )
        .forEach(
            (step, index) => {

                step.classList.remove(
                    "active",
                    "completed"
                );


                if (
                    currentIndex >= 0 &&
                    index < currentIndex
                ) {

                    step.classList.add(
                        "completed"
                    );

                }


                if (
                    currentIndex >= 0 &&
                    index === currentIndex
                ) {

                    step.classList.add(
                        "active"
                    );

                }

            }
        );

}


// =========================================
// COPY AI RESPONSE
// =========================================

async function copyAIResponse() {

    const text =
        aiResponse.textContent.trim();


    if (!text) {
        return;
    }


    try {

        await navigator.clipboard.writeText(
            text
        );


        const originalText =
            copyResponseButton.textContent;


        copyResponseButton.textContent =
            "Copied";


        setTimeout(
            () => {

                copyResponseButton.textContent =
                    originalText;

            },
            1500
        );


    } catch (error) {

        alert(
            "Unable to copy the response."
        );

    }

}


// =========================================
// STATUS MESSAGE
// =========================================

function showStatusMessage(
    message,
    type
) {

    statusMessage.textContent =
        message;

    statusMessage.className =
        `action-message ${type}`;

    statusMessage.hidden =
        false;


    setTimeout(
        () => {

            statusMessage.hidden =
                true;

        },
        3500
    );

}


// =========================================
// LOADING STATE
// =========================================

function showLoading() {

    pageLoading.hidden =
        false;

    pageError.hidden =
        true;

    ticketLayout.hidden =
        true;

}


// =========================================
// ERROR STATE
// =========================================

function showError(message) {

    pageLoading.hidden =
        true;

    ticketLayout.hidden =
        true;

    pageError.hidden =
        false;


    errorMessage.textContent =
        message ||
        "Unable to load ticket.";

}


// =========================================
// FORMAT TEXT
// =========================================

function formatText(value) {

    if (!value) {
        return "—";
    }


    return String(value)
        .replaceAll(
            "_",
            " "
        )
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


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

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
// FORMAT DATE + TIME
// =========================================

function formatDateTime(dateString) {

    if (!dateString) {
        return "—";
    }


    const date =
        new Date(dateString);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";

    }


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


// =========================================
// EVENT LISTENERS
// =========================================

if (analyzeButton) {

    analyzeButton.addEventListener(
        "click",
        analyzeTicket
    );

}


if (sendMessageButton) {

    sendMessageButton.addEventListener(
        "click",
        sendMessage
    );

}


if (updateStatusButton) {

    updateStatusButton.addEventListener(
        "click",
        updateStatus
    );

}


if (copyResponseButton) {

    copyResponseButton.addEventListener(
        "click",
        copyAIResponse
    );

}


if (retryButton) {

    retryButton.addEventListener(
        "click",
        loadTicket
    );

}


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
// KEYBOARD SHORTCUT
// =========================================

if (messageInput) {

    messageInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" &&
                event.ctrlKey
            ) {

                event.preventDefault();

                sendMessage();

            }

        }
    );

}


// =========================================
// START
// =========================================

loadTicket();