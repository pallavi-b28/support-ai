const API_BASE_URL = "http://127.0.0.1:8000";

const token =
    localStorage.getItem("access_token");

const storedUser =
    localStorage.getItem("user");


if (!token || !storedUser) {
    window.location.href = "login.html";
}


let currentUser = null;


try {

    currentUser =
        JSON.parse(storedUser);

} catch (error) {

    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    window.location.href = "login.html";
}


const urlParams =
    new URLSearchParams(
        window.location.search
    );


const ticketId =
    urlParams.get("id");


if (!ticketId) {
    window.location.href = "tickets.html";
}


/* =========================
   ELEMENTS
========================= */

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


/* IMAGE */

const imageCard =
    document.getElementById("imageCard");

const ticketImage =
    document.getElementById("ticketImage");

const ticketImageInput =
    document.getElementById("ticketImageInput");

const selectedFileName =
    document.getElementById("selectedFileName");

const uploadImageButton =
    document.getElementById("uploadImageButton");

const uploadMessage =
    document.getElementById("uploadMessage");


/* AI */

const aiCard =
    document.getElementById("aiCard");

const aiCategory =
    document.getElementById("aiCategory");

const aiPriority =
    document.getElementById("aiPriority");

const aiResponse =
    document.getElementById("aiResponse");


/* COMMENTS */

const commentsList =
    document.getElementById("commentsList");

const commentForm =
    document.getElementById("commentForm");

const commentMessage =
    document.getElementById("commentMessage");

const commentButton =
    document.getElementById("commentButton");


/* RATING */

const ratingCard =
    document.getElementById("ratingCard");

const ratingStars =
    document.querySelectorAll(
        "#ratingStars button"
    );

const ratingFeedback =
    document.getElementById("ratingFeedback");

const submitRating =
    document.getElementById("submitRating");

const ratingMessage =
    document.getElementById("ratingMessage");


/* EDIT */

const editTicketButton =
    document.getElementById(
        "editTicketButton"
    );

const editTicketOverlay =
    document.getElementById(
        "editTicketOverlay"
    );

const closeEditTicket =
    document.getElementById(
        "closeEditTicket"
    );

const cancelEditTicket =
    document.getElementById(
        "cancelEditTicket"
    );

const editTicketForm =
    document.getElementById(
        "editTicketForm"
    );

const editTicketTitleInput =
    document.getElementById(
        "editTicketTitleInput"
    );

const editTicketDescription =
    document.getElementById(
        "editTicketDescription"
    );

const editTicketCategory =
    document.getElementById(
        "editTicketCategory"
    );

const editTicketPriority =
    document.getElementById(
        "editTicketPriority"
    );

const saveEditTicket =
    document.getElementById(
        "saveEditTicket"
    );

const editTicketMessage =
    document.getElementById(
        "editTicketMessage"
    );


/* DELETE */

const deleteTicketButton =
    document.getElementById(
        "deleteTicketButton"
    );

const deleteConfirmOverlay =
    document.getElementById(
        "deleteConfirmOverlay"
    );

const cancelDeleteTicket =
    document.getElementById(
        "cancelDeleteTicket"
    );

const confirmDeleteTicket =
    document.getElementById(
        "confirmDeleteTicket"
    );


/* AI ASSISTANT */

const aiAssistantOverlay =
    document.getElementById(
        "aiAssistantOverlay"
    );

const openAiAssistant =
    document.getElementById(
        "openAiAssistant"
    );

const openAiAssistantRight =
    document.getElementById(
        "openAiAssistantRight"
    );

const closeAiAssistant =
    document.getElementById(
        "closeAiAssistant"
    );

const aiAssistantMessages =
    document.getElementById(
        "aiAssistantMessages"
    );

const aiAssistantForm =
    document.getElementById(
        "aiAssistantForm"
    );

const aiAssistantInput =
    document.getElementById(
        "aiAssistantInput"
    );

const aiAssistantSend =
    document.getElementById(
        "aiAssistantSend"
    );

const suggestionButtons =
    document.querySelectorAll(
        "[data-ai-question]"
    );


const logoutButton =
    document.getElementById(
        "logoutButton"
    );


let currentTicket = null;

let selectedRating = 0;


/* =========================
   LOAD TICKET
========================= */

async function loadTicket() {

    if (!ticketId) {

        showError(
            "Ticket ID is missing."
        );

        return;
    }


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


        if (
            response.status === 401
        ) {

            logout();

            return;
        }


        if (!response.ok) {

            throw new Error(
                getErrorMessage(data) ||
                "Unable to load ticket."
            );
        }


        currentTicket =
            data;


        renderTicket(data);


        await loadComments();

        await loadRating();


        if (loadingState) {
            loadingState.hidden = true;
        }


        if (errorState) {
            errorState.hidden = true;
        }


        if (ticketContent) {
            ticketContent.hidden = false;
        }


    } catch (error) {

        console.error(
            "Ticket loading error:",
            error
        );


        showError(
            error.message ||
            "Unable to load ticket."
        );
    }
}


/* =========================
   ERROR
========================= */

function showError(message) {

    if (loadingState) {
        loadingState.hidden = true;
    }


    if (ticketContent) {
        ticketContent.hidden = true;
    }


    if (errorState) {

        errorState.textContent =
            message;

        errorState.hidden =
            false;
    }
}


/* =========================
   RENDER TICKET
========================= */

function renderTicket(ticket) {

    if (ticketIdElement) {

        ticketIdElement.textContent =
            ticket.id;
    }


    if (ticketTitle) {

        ticketTitle.textContent =
            ticket.title ||
            "Untitled ticket";
    }


    if (ticketDescription) {

        ticketDescription.textContent =
            ticket.description ||
            "No description provided.";
    }


    const formattedDate =
        formatDate(
            ticket.created_at
        );


    if (ticketCreated) {

        ticketCreated.textContent =
            `Created ${formattedDate}`;
    }


    if (sideCreated) {

        sideCreated.textContent =
            formattedDate;
    }


    const status =
        ticket.status ||
        "open";


    if (ticketStatus) {

        ticketStatus.textContent =
            formatStatus(status);

        ticketStatus.className =
            `status-badge status-${status}`;
    }


    if (sideStatus) {

        sideStatus.textContent =
            formatStatus(status);
    }


    if (sideCategory) {

        sideCategory.textContent =
            ticket.category ||
            "Other";
    }


    if (sidePriority) {

        sidePriority.textContent =
            ticket.priority ||
            "Medium";
    }


    if (sideAgent) {

        if (ticket.agent_id) {

            sideAgent.textContent =
                `Agent #${ticket.agent_id}`;

        } else {

            sideAgent.textContent =
                "Not assigned";
        }
    }


    renderTicketImage(ticket);

    renderAIAnalysis(ticket);

    updateTimeline(status);

    updateTicketActions(status);
}


/* =========================
   EDIT / DELETE VISIBILITY
========================= */

function updateTicketActions(status) {

    /*
       Customer can edit/delete
       only while ticket is open.

       Admin can also see the
       controls.

       Agents do not get customer
       edit/delete controls.
    */

    if (!editTicketButton ||
        !deleteTicketButton) {
        return;
    }


    if (
        currentUser &&
        currentUser.role === "customer"
    ) {

        if (status === "open") {

            editTicketButton.hidden =
                false;

            deleteTicketButton.hidden =
                false;

        } else {

            editTicketButton.hidden =
                true;

            deleteTicketButton.hidden =
                true;
        }

        return;
    }


    /*
       Admin can edit/delete.
    */

    if (
        currentUser &&
        currentUser.role === "admin"
    ) {

        editTicketButton.hidden =
            false;

        deleteTicketButton.hidden =
            false;

        return;
    }


    /*
       Agents cannot delete through
       this customer page.
    */

    editTicketButton.hidden =
        true;

    deleteTicketButton.hidden =
        true;
}


/* =========================
   IMAGE
========================= */

function renderTicketImage(ticket) {

    if (
        !imageCard ||
        !ticketImage
    ) {
        return;
    }


    if (ticket.image) {

        imageCard.hidden =
            false;


        let imageUrl =
            ticket.image;


        if (
            !imageUrl.startsWith(
                "http://"
            ) &&
            !imageUrl.startsWith(
                "https://"
            )
        ) {

            imageUrl =
                `${API_BASE_URL}${imageUrl}`;
        }


        ticketImage.src =
            imageUrl;


    } else {

        imageCard.hidden =
            true;
    }
}


/* =========================
   AI ANALYSIS
========================= */

function renderAIAnalysis(ticket) {

    if (!aiCard) {
        return;
    }


    if (
        ticket.ai_category ||
        ticket.ai_priority ||
        ticket.ai_response
    ) {

        aiCard.hidden =
            false;


        if (aiCategory) {

            aiCategory.textContent =
                ticket.ai_category ||
                "Not available";
        }


        if (aiPriority) {

            aiPriority.textContent =
                ticket.ai_priority ||
                "Not available";
        }


        if (aiResponse) {

            aiResponse.textContent =
                ticket.ai_response ||
                "No suggested response available.";
        }


    } else {

        aiCard.hidden =
            true;
    }
}


/* =========================
   TIMELINE
========================= */

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


    [
        timelineOpen,
        timelineProgress,
        timelineResolved,
        timelineClosed
    ].forEach(
        element => {

            if (element) {

                element.classList.remove(
                    "active"
                );
            }
        }
    );


    if (timelineOpen) {

        timelineOpen.classList.add(
            "active"
        );
    }


    if (
        status === "in_progress" ||
        status === "resolved" ||
        status === "closed"
    ) {

        if (timelineProgress) {

            timelineProgress.classList.add(
                "active"
            );
        }
    }


    if (
        status === "resolved" ||
        status === "closed"
    ) {

        if (timelineResolved) {

            timelineResolved.classList.add(
                "active"
            );
        }
    }


    if (status === "closed") {

        if (timelineClosed) {

            timelineClosed.classList.add(
                "active"
            );
        }
    }
}


/* =========================
   EDIT TICKET
========================= */

if (editTicketButton) {

    editTicketButton.addEventListener(
        "click",
        openEditTicket
    );
}


function openEditTicket() {

    if (!currentTicket) {
        return;
    }


    if (
        currentUser &&
        currentUser.role === "customer" &&
        currentTicket.status !== "open"
    ) {

        alert(
            "Resolved or closed tickets cannot be edited."
        );

        return;
    }


    if (editTicketTitleInput) {

        editTicketTitleInput.value =
            currentTicket.title || "";
    }


    if (editTicketDescription) {

        editTicketDescription.value =
            currentTicket.description || "";
    }


    if (editTicketCategory) {

        editTicketCategory.value =
            normalizeCategory(
                currentTicket.category
            );
    }


    if (editTicketPriority) {

        editTicketPriority.value =
            normalizePriority(
                currentTicket.priority
            );
    }


    clearEditMessage();


    if (editTicketOverlay) {

        editTicketOverlay.hidden =
            false;
    }


    if (editTicketTitleInput) {

        setTimeout(
            () => {
                editTicketTitleInput.focus();
            },
            100
        );
    }
}


function closeEditTicketModal() {

    if (editTicketOverlay) {

        editTicketOverlay.hidden =
            true;
    }
}


if (closeEditTicket) {

    closeEditTicket.addEventListener(
        "click",
        closeEditTicketModal
    );
}


if (cancelEditTicket) {

    cancelEditTicket.addEventListener(
        "click",
        closeEditTicketModal
    );
}


if (editTicketOverlay) {

    editTicketOverlay.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                editTicketOverlay
            ) {

                closeEditTicketModal();
            }
        }
    );
}


/* =========================
   SAVE EDIT
========================= */

if (editTicketForm) {

    editTicketForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            if (!currentTicket) {
                return;
            }


            const title =
                editTicketTitleInput
                    ? editTicketTitleInput.value.trim()
                    : "";


            const description =
                editTicketDescription
                    ? editTicketDescription.value.trim()
                    : "";


            const category =
                editTicketCategory
                    ? editTicketCategory.value
                    : "other";


            const priority =
                editTicketPriority
                    ? editTicketPriority.value
                    : "medium";


            if (!title) {

                showEditMessage(
                    "Please enter a ticket title.",
                    true
                );

                return;
            }


            if (!description) {

                showEditMessage(
                    "Please enter a ticket description.",
                    true
                );

                return;
            }


            saveEditTicket.disabled =
                true;

            cancelEditTicket.disabled =
                true;

            saveEditTicket.textContent =
                "Saving...";


            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/tickets/${ticketId}`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${token}`
                            },

                            body: JSON.stringify({
                                title:
                                    title,

                                description:
                                    description,

                                category:
                                    category,

                                priority:
                                    priority
                            })
                        }
                    );


                const data =
                    await response.json();


                if (
                    response.status === 401
                ) {

                    logout();

                    return;
                }


                if (!response.ok) {

                    throw new Error(
                        getErrorMessage(data) ||
                        "Unable to update ticket."
                    );
                }


                currentTicket =
                    data;


                renderTicket(data);


                showEditMessage(
                    "Ticket updated successfully.",
                    false
                );


                setTimeout(
                    function () {

                        closeEditTicketModal();

                    },
                    600
                );


            } catch (error) {

                console.error(
                    "Update ticket error:",
                    error
                );


                showEditMessage(
                    error.message ||
                    "Unable to update ticket.",
                    true
                );


            } finally {

                saveEditTicket.disabled =
                    false;

                cancelEditTicket.disabled =
                    false;

                saveEditTicket.textContent =
                    "Save changes";
            }
        }
    );
}


/* =========================
   EDIT MESSAGES
========================= */

function showEditMessage(
    message,
    isError
) {

    if (!editTicketMessage) {
        return;
    }


    editTicketMessage.textContent =
        message;


    editTicketMessage.className =
        "ticket-edit-message show";


    if (isError) {

        editTicketMessage.classList.add(
            "error"
        );

    } else {

        editTicketMessage.classList.add(
            "success"
        );
    }
}


function clearEditMessage() {

    if (!editTicketMessage) {
        return;
    }


    editTicketMessage.textContent =
        "";

    editTicketMessage.className =
        "ticket-edit-message";
}


/* =========================
   DELETE TICKET
========================= */

if (deleteTicketButton) {

    deleteTicketButton.addEventListener(
        "click",
        openDeleteConfirmation
    );
}


function openDeleteConfirmation() {

    if (!currentTicket) {
        return;
    }


    if (
        currentUser &&
        currentUser.role === "customer" &&
        currentTicket.status !== "open"
    ) {

        alert(
            "Only open tickets can be deleted."
        );

        return;
    }


    if (deleteConfirmOverlay) {

        deleteConfirmOverlay.hidden =
            false;
    }
}


function closeDeleteConfirmation() {

    if (deleteConfirmOverlay) {

        deleteConfirmOverlay.hidden =
            true;
    }
}


if (cancelDeleteTicket) {

    cancelDeleteTicket.addEventListener(
        "click",
        closeDeleteConfirmation
    );
}


if (deleteConfirmOverlay) {

    deleteConfirmOverlay.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                deleteConfirmOverlay
            ) {

                closeDeleteConfirmation();
            }
        }
    );
}


if (confirmDeleteTicket) {

    confirmDeleteTicket.addEventListener(
        "click",
        deleteTicket
    );
}


async function deleteTicket() {

    if (!currentTicket) {
        return;
    }


    confirmDeleteTicket.disabled =
        true;

    cancelDeleteTicket.disabled =
        true;

    confirmDeleteTicket.textContent =
        "Deleting...";


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/tickets/${ticketId}`,
                {
                    method: "DELETE",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        const data =
            await response.json();


        if (
            response.status === 401
        ) {

            logout();

            return;
        }


        if (!response.ok) {

            throw new Error(
                getErrorMessage(data) ||
                "Unable to delete ticket."
            );
        }


        closeDeleteConfirmation();


        /*
           Redirect after successful
           deletion.
        */

        window.location.href =
            "tickets.html";


    } catch (error) {

        console.error(
            "Delete ticket error:",
            error
        );


        alert(
            error.message ||
            "Unable to delete ticket."
        );


        confirmDeleteTicket.disabled =
            false;

        cancelDeleteTicket.disabled =
            false;

        confirmDeleteTicket.textContent =
            "Delete ticket";
    }
}


/* =========================
   SELECT IMAGE
========================= */

if (ticketImageInput) {

    ticketImageInput.addEventListener(
        "change",
        function () {

            const file =
                ticketImageInput.files[0];


            if (!file) {

                if (selectedFileName) {

                    selectedFileName.textContent =
                        "No file selected";
                }

                return;
            }


            if (selectedFileName) {

                selectedFileName.textContent =
                    file.name;
            }


            if (uploadMessage) {

                uploadMessage.textContent =
                    "";

                uploadMessage.hidden =
                    true;
            }
        }
    );
}


/* =========================
   UPLOAD IMAGE
========================= */

if (uploadImageButton) {

    uploadImageButton.addEventListener(
        "click",
        uploadTicketImage
    );
}


async function uploadTicketImage() {

    if (!ticketImageInput) {
        return;
    }


    const file =
        ticketImageInput.files[0];


    if (!file) {

        showUploadMessage(
            "Please select a screenshot first.",
            true
        );

        return;
    }


    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp"
    ];


    if (
        !allowedTypes.includes(
            file.type
        )
    ) {

        showUploadMessage(
            "Only JPG, JPEG, PNG and WEBP images are allowed.",
            true
        );

        return;
    }


    const maxSize =
        5 * 1024 * 1024;


    if (file.size > maxSize) {

        showUploadMessage(
            "Image size must be less than 5 MB.",
            true
        );

        return;
    }


    const formData =
        new FormData();


    /*
       IMPORTANT:
       Backend expects "image".
    */

    formData.append(
        "image",
        file
    );


    uploadImageButton.disabled =
        true;

    uploadImageButton.textContent =
        "Uploading...";


    showUploadMessage(
        "Uploading screenshot...",
        false
    );


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/tickets/${ticketId}/image`,
                {
                    method: "POST",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    },

                    body: formData
                }
            );


        const rawResponse =
            await response.text();


        let data = {};


        try {

            data =
                rawResponse
                    ? JSON.parse(
                        rawResponse
                    )
                    : {};

        } catch (error) {

            console.warn(
                "Upload response was not JSON."
            );
        }


        if (
            response.status === 401
        ) {

            logout();

            return;
        }


        if (!response.ok) {

            throw new Error(
                getErrorMessage(data) ||
                rawResponse ||
                `Upload failed with status ${response.status}.`
            );
        }


        showUploadMessage(
            "Screenshot uploaded successfully.",
            false
        );


        if (
            data.image &&
            ticketImage &&
            imageCard
        ) {

            let imageUrl =
                data.image;


            if (
                !imageUrl.startsWith(
                    "http://"
                ) &&
                !imageUrl.startsWith(
                    "https://"
                )
            ) {

                imageUrl =
                    `${API_BASE_URL}${imageUrl}`;
            }


            ticketImage.src =
                imageUrl;


            imageCard.hidden =
                false;
        }


        currentTicket =
            data;


        if (ticketImageInput) {

            ticketImageInput.value =
                "";
        }


        if (selectedFileName) {

            selectedFileName.textContent =
                "No file selected";
        }


    } catch (error) {

        console.error(
            "Image upload error:",
            error
        );


        showUploadMessage(
            error.message ||
            "Unable to upload screenshot.",
            true
        );


    } finally {

        uploadImageButton.disabled =
            false;

        uploadImageButton.textContent =
            "Upload screenshot";
    }
}


function showUploadMessage(
    message,
    isError
) {

    if (!uploadMessage) {
        return;
    }


    uploadMessage.textContent =
        message;

    uploadMessage.hidden =
        false;


    if (isError) {

        uploadMessage.style.color =
            "#ff9b9b";

    } else {

        uploadMessage.style.color =
            "#91d2ad";
    }
}


/* =========================
   COMMENTS
========================= */

async function loadComments() {

    if (!commentsList) {
        return;
    }


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


        if (
            response.status === 401
        ) {

            logout();

            return;
        }


        if (!response.ok) {

            throw new Error(
                getErrorMessage(data) ||
                "Unable to load comments."
            );
        }


        renderComments(data);


    } catch (error) {

        console.error(
            "Comments error:",
            error
        );


        commentsList.innerHTML = `
            <div class="no-comments">
                Unable to load conversation.
            </div>
        `;
    }
}


function renderComments(comments) {

    if (!commentsList) {
        return;
    }


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
        comments
            .map(
                comment => {

                    const isCurrentUser =
                        currentUser &&
                        Number(
                            comment.user_id
                        ) ===
                        Number(
                            currentUser.id
                        );


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
                                ${getInitial(author)}
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
            )
            .join("");
}


if (commentForm) {

    commentForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            if (!commentMessage) {
                return;
            }


            const message =
                commentMessage.value.trim();


            if (!message) {
                return;
            }


            if (commentButton) {

                commentButton.disabled =
                    true;

                commentButton.textContent =
                    "Sending...";
            }


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
                                message:
                                    message
                            })
                        }
                    );


                const data =
                    await response.json();


                if (
                    response.status === 401
                ) {

                    logout();

                    return;
                }


                if (!response.ok) {

                    throw new Error(
                        getErrorMessage(data) ||
                        "Unable to send message."
                    );
                }


                commentMessage.value =
                    "";


                await loadComments();


            } catch (error) {

                console.error(
                    "Comment error:",
                    error
                );


                alert(
                    error.message ||
                    "Unable to send message."
                );


            } finally {

                if (commentButton) {

                    commentButton.disabled =
                        false;

                    commentButton.textContent =
                        "Send message";
                }
            }
        }
    );
}


/* =========================
   RATING
========================= */

ratingStars.forEach(
    star => {

        star.addEventListener(
            "click",
            function () {

                if (star.disabled) {
                    return;
                }


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
                            value <=
                            selectedRating
                        );
                    }
                );
            }
        );
    }
);


if (submitRating) {

    submitRating.addEventListener(
        "click",
        submitTicketRating
    );
}


async function submitTicketRating() {

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
                            ratingFeedback
                                ? (
                                    ratingFeedback.value.trim() ||
                                    null
                                )
                                : null
                    })
                }
            );


        const data =
            await response.json();


        if (
            response.status === 401
        ) {

            logout();

            return;
        }


        if (!response.ok) {

            throw new Error(
                getErrorMessage(data) ||
                "Unable to submit rating."
            );
        }


        showRatingMessage(
            "Thank you! Your rating has been submitted.",
            false
        );


        ratingStars.forEach(
            star => {

                star.disabled =
                    true;
            }
        );


        if (ratingFeedback) {

            ratingFeedback.disabled =
                true;
        }


        submitRating.textContent =
            "Rating submitted";


    } catch (error) {

        console.error(
            "Rating error:",
            error
        );


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


async function loadRating() {

    if (!ratingCard) {
        return;
    }


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


        if (
            response.status === 404
        ) {

            return;
        }


        if (
            response.status === 401
        ) {

            logout();

            return;
        }


        const data =
            await response.json();


        if (!response.ok) {
            return;
        }


        selectedRating =
            Number(
                data.rating
            );


        ratingStars.forEach(
            star => {

                const value =
                    Number(
                        star.dataset.rating
                    );


                star.classList.toggle(
                    "selected",
                    value <=
                    selectedRating
                );


                star.disabled =
                    true;
            }
        );


        if (
            ratingFeedback &&
            data.feedback
        ) {

            ratingFeedback.value =
                data.feedback;
        }


        if (ratingFeedback) {

            ratingFeedback.disabled =
                true;
        }


        if (submitRating) {

            submitRating.disabled =
                true;

            submitRating.textContent =
                "Rating submitted";
        }


        showRatingMessage(
            "You have already rated this ticket.",
            false
        );


    } catch (error) {

        console.error(
            "Rating loading error:",
            error
        );
    }
}


/* =========================
   RATING MESSAGE
========================= */

function showRatingMessage(
    message,
    isError
) {

    if (!ratingMessage) {
        return;
    }


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


/* =========================
   AI ASSISTANT
========================= */

function openAI() {

    if (!aiAssistantOverlay) {
        return;
    }


    aiAssistantOverlay.hidden =
        false;


    if (aiAssistantInput) {

        setTimeout(
            function () {

                aiAssistantInput.focus();

            },
            100
        );
    }
}


function closeAI() {

    if (!aiAssistantOverlay) {
        return;
    }


    aiAssistantOverlay.hidden =
        true;
}


if (openAiAssistant) {

    openAiAssistant.addEventListener(
        "click",
        openAI
    );
}


if (openAiAssistantRight) {

    openAiAssistantRight.addEventListener(
        "click",
        openAI
    );
}


if (closeAiAssistant) {

    closeAiAssistant.addEventListener(
        "click",
        closeAI
    );
}


if (aiAssistantOverlay) {

    aiAssistantOverlay.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                aiAssistantOverlay
            ) {

                closeAI();
            }
        }
    );
}


document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape"
        ) {

            if (
                aiAssistantOverlay &&
                !aiAssistantOverlay.hidden
            ) {

                closeAI();
            }


            if (
                editTicketOverlay &&
                !editTicketOverlay.hidden
            ) {

                closeEditTicketModal();
            }


            if (
                deleteConfirmOverlay &&
                !deleteConfirmOverlay.hidden
            ) {

                closeDeleteConfirmation();
            }
        }
    }
);


/* =========================
   AI SUGGESTIONS
========================= */

suggestionButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            function () {

                const question =
                    button.dataset.aiQuestion ||
                    button.textContent.trim();


                if (
                    !question ||
                    !aiAssistantInput
                ) {
                    return;
                }


                aiAssistantInput.value =
                    question;


                aiAssistantInput.focus();


                aiAssistantInput.setSelectionRange(
                    aiAssistantInput.value.length,
                    aiAssistantInput.value.length
                );
            }
        );
    }
);


if (aiAssistantForm) {

    aiAssistantForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            if (!aiAssistantInput) {
                return;
            }


            const message =
                aiAssistantInput.value.trim();


            if (!message) {
                return;
            }


            await sendAIMessage(
                message
            );
        }
    );
}


async function sendAIMessage(
    message
) {

    if (
        !message ||
        !message.trim()
    ) {
        return;
    }


    const cleanMessage =
        message.trim();


    addAIMessage(
        cleanMessage,
        "user"
    );


    aiAssistantInput.value =
        "";


    if (aiAssistantSend) {

        aiAssistantSend.disabled =
            true;

        aiAssistantSend.textContent =
            "Sending...";
    }


    const thinkingElement =
        addAIMessage(
            "Thinking...",
            "bot"
        );


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/ai/tickets/${ticketId}/help`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        message:
                            cleanMessage
                    })
                }
            );


        const data =
            await response.json();


        if (
            response.status === 401
        ) {

            logout();

            return;
        }


        if (!response.ok) {

            throw new Error(
                getErrorMessage(data) ||
                "AI assistant request failed."
            );
        }


        if (thinkingElement) {

            thinkingElement.remove();
        }


        const responseText =
            data.response ||
            data.message ||
            data.answer ||
            "I couldn't generate a response.";


        addAIMessage(
            responseText,
            "bot"
        );


    } catch (error) {

        console.error(
            "AI assistant error:",
            error
        );


        if (thinkingElement) {

            thinkingElement.remove();
        }


        addAIMessage(
            error.message ||
            "Sorry, I couldn't process your request.",
            "bot"
        );


    } finally {

        if (aiAssistantSend) {

            aiAssistantSend.disabled =
                false;

            aiAssistantSend.textContent =
                "Send";
        }


        if (aiAssistantInput) {

            aiAssistantInput.focus();
        }
    }
}


function addAIMessage(
    message,
    type
) {

    if (!aiAssistantMessages) {
        return null;
    }


    const messageElement =
        document.createElement(
            "div"
        );


    if (type === "user") {

        messageElement.className =
            "ai-message ai-message-user";

    } else {

        messageElement.className =
            "ai-message ai-message-bot";
    }


    if (type !== "user") {

        const avatar =
            document.createElement(
                "div"
            );


        avatar.className =
            "ai-message-avatar";


        avatar.textContent =
            "✦";


        messageElement.appendChild(
            avatar
        );
    }


    const bubble =
        document.createElement(
            "div"
        );


    bubble.className =
        "ai-message-bubble";


    if (type !== "user") {

        const name =
            document.createElement(
                "strong"
            );


        name.textContent =
            "SupportAI";


        bubble.appendChild(
            name
        );
    }


    const paragraph =
        document.createElement(
            "p"
        );


    paragraph.textContent =
        message;


    bubble.appendChild(
        paragraph
    );


    messageElement.appendChild(
        bubble
    );


    aiAssistantMessages.appendChild(
        messageElement
    );


    aiAssistantMessages.scrollTop =
        aiAssistantMessages.scrollHeight;


    return messageElement;
}


/* =========================
   HELPERS
========================= */

function normalizeCategory(
    category
) {

    if (!category) {
        return "other";
    }


    const value =
        category
            .toString()
            .trim()
            .toLowerCase();


    const validCategories = [
        "technical",
        "billing",
        "account",
        "access",
        "other"
    ];


    if (
        validCategories.includes(
            value
        )
    ) {

        return value;
    }


    return "other";
}


function normalizePriority(
    priority
) {

    if (!priority) {
        return "medium";
    }


    const value =
        priority
            .toString()
            .trim()
            .toLowerCase();


    const validPriorities = [
        "low",
        "medium",
        "high",
        "critical"
    ];


    if (
        validPriorities.includes(
            value
        )
    ) {

        return value;
    }


    return "medium";
}


function getErrorMessage(data) {

    if (!data) {
        return "";
    }


    if (
        typeof data ===
        "string"
    ) {

        return data;
    }


    if (
        typeof data.detail ===
        "string"
    ) {

        return data.detail;
    }


    if (
        Array.isArray(
            data.detail
        )
    ) {

        return data.detail
            .map(
                item => {

                    if (
                        item &&
                        typeof item.msg ===
                        "string"
                    ) {

                        return item.msg;
                    }


                    if (
                        item &&
                        item.detail
                    ) {

                        return String(
                            item.detail
                        );
                    }


                    return JSON.stringify(
                        item
                    );
                }
            )
            .join(", ");
    }


    if (
        data.detail &&
        typeof data.detail ===
        "object"
    ) {

        return JSON.stringify(
            data.detail
        );
    }


    if (
        typeof data.message ===
        "string"
    ) {

        return data.message;
    }


    return "";
}


function formatStatus(
    status
) {

    if (!status) {
        return "Unknown";
    }


    return status
        .replaceAll(
            "_",
            " "
        )
        .replace(
            /\b\w/g,
            letter =>
                letter.toUpperCase()
        );
}


function formatDate(
    dateString
) {

    if (!dateString) {
        return "—";
    }


    const date =
        new Date(
            dateString
        );


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


function formatDateTime(
    dateString
) {

    if (!dateString) {
        return "";
    }


    const date =
        new Date(
            dateString
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";
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


function getInitial(
    name
) {

    if (!name) {
        return "U";
    }


    return name
        .charAt(0)
        .toUpperCase();
}


function escapeHtml(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;
}


/* =========================
   LOGOUT
========================= */

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


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        logout
    );
}


/* =========================
   DEBUG
========================= */

console.log(
    "SupportAI ticket-details.js loaded."
);

console.log(
    "Ticket ID:",
    ticketId
);

console.log(
    "Current user:",
    currentUser
);

console.log(
    "AI Assistant:",
    aiAssistantOverlay
);

console.log(
    "AI Suggestions:",
    suggestionButtons.length
);


/* =========================
   START
========================= */

loadTicket();