const API_BASE_URL = "https://support-ai-1.onrender.com";


// =========================
// AUTH CHECK
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
// ELEMENTS
// =========================

const form =
    document.getElementById("createTicketForm");

const titleInput =
    document.getElementById("title");

const categoryInput =
    document.getElementById("category");

const priorityInput =
    document.getElementById("priority");

const descriptionInput =
    document.getElementById("description");

const imageInput =
    document.getElementById("image");

const uploadArea =
    document.getElementById("uploadArea");

const uploadPlaceholder =
    document.getElementById("uploadPlaceholder");

const imagePreviewContainer =
    document.getElementById(
        "imagePreviewContainer"
    );

const imagePreview =
    document.getElementById("imagePreview");

const imageName =
    document.getElementById("imageName");

const imageSize =
    document.getElementById("imageSize");

const removeImage =
    document.getElementById("removeImage");

const titleCount =
    document.getElementById("titleCount");

const descriptionCount =
    document.getElementById(
        "descriptionCount"
    );

const formError =
    document.getElementById("formError");

const submitButton =
    document.getElementById(
        "submitTicketButton"
    );

const submitButtonText =
    document.getElementById(
        "submitButtonText"
    );

const submitLoader =
    document.getElementById(
        "submitLoader"
    );


// =========================
// TITLE COUNTER
// =========================

titleInput.addEventListener(
    "input",
    () => {

        titleCount.textContent =
            `${titleInput.value.length} / 200`;

    }
);


// =========================
// DESCRIPTION COUNTER
// =========================

descriptionInput.addEventListener(
    "input",
    () => {

        descriptionCount.textContent =
            `${descriptionInput.value.length} / 3000`;

    }
);


// =========================
// IMAGE SELECTION
// =========================

imageInput.addEventListener(
    "change",
    () => {

        const file =
            imageInput.files[0];

        if (!file) {
            return;
        }

        handleImage(file);
    }
);


// =========================
// HANDLE IMAGE
// =========================

function handleImage(file) {

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp"
    ];


    if (!allowedTypes.includes(file.type)) {

        showError(
            "Only JPG, JPEG, PNG and WEBP images are allowed."
        );

        imageInput.value = "";

        return;
    }


    const maxSize =
        5 * 1024 * 1024;


    if (file.size > maxSize) {

        showError(
            "Image size must be less than 5 MB."
        );

        imageInput.value = "";

        return;
    }


    hideError();


    const reader =
        new FileReader();


    reader.onload = (event) => {

        imagePreview.src =
            event.target.result;

        imageName.textContent =
            file.name;

        imageSize.textContent =
            formatFileSize(file.size);


        uploadPlaceholder.hidden =
            true;

        imagePreviewContainer.hidden =
            false;

        uploadArea.classList.add(
            "has-image"
        );
    };


    reader.readAsDataURL(file);
}


// =========================
// FILE SIZE
// =========================

function formatFileSize(bytes) {

    if (bytes < 1024) {
        return `${bytes} B`;
    }


    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }


    return `${(
        bytes /
        (1024 * 1024)
    ).toFixed(1)} MB`;
}


// =========================
// REMOVE IMAGE
// =========================

removeImage.addEventListener(
    "click",
    (event) => {

        event.preventDefault();

        event.stopPropagation();

        imageInput.value = "";

        imagePreview.src = "";

        imageName.textContent =
            "";

        imageSize.textContent =
            "";


        uploadPlaceholder.hidden =
            false;

        imagePreviewContainer.hidden =
            true;

        uploadArea.classList.remove(
            "has-image"
        );

        hideError();
    }
);


// =========================
// DRAG AND DROP
// =========================

uploadArea.addEventListener(
    "dragover",
    (event) => {

        event.preventDefault();

        uploadArea.classList.add(
            "dragging"
        );
    }
);


uploadArea.addEventListener(
    "dragleave",
    () => {

        uploadArea.classList.remove(
            "dragging"
        );
    }
);


uploadArea.addEventListener(
    "drop",
    (event) => {

        event.preventDefault();

        uploadArea.classList.remove(
            "dragging"
        );


        const file =
            event.dataTransfer.files[0];


        if (!file) {
            return;
        }


        /*
         * DataTransfer allows us to place the
         * dropped file into the file input.
         */

        try {

            const dataTransfer =
                new DataTransfer();

            dataTransfer.items.add(file);

            imageInput.files =
                dataTransfer.files;

        } catch (error) {

            console.warn(
                "Could not assign dropped file.",
                error
            );
        }


        handleImage(file);
    }
);


// =========================
// FORM SUBMIT
// =========================

form.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        hideError();


        // -------------------------
        // VALIDATION
        // -------------------------

        const title =
            titleInput.value.trim();

        const category =
            categoryInput.value;

        const priority =
            priorityInput.value;

        const description =
            descriptionInput.value.trim();


        if (!title) {

            showError(
                "Please enter a ticket title."
            );

            titleInput.focus();

            return;
        }


        if (title.length < 5) {

            showError(
                "Ticket title should contain at least 5 characters."
            );

            titleInput.focus();

            return;
        }


        if (!category) {

            showError(
                "Please select a category."
            );

            categoryInput.focus();

            return;
        }


        if (!priority) {

            showError(
                "Please select a priority."
            );

            priorityInput.focus();

            return;
        }


        if (!description) {

            showError(
                "Please describe the issue."
            );

            descriptionInput.focus();

            return;
        }


        if (description.length < 10) {

            showError(
                "Please provide a little more detail about the issue."
            );

            descriptionInput.focus();

            return;
        }


        // -------------------------
        // LOADING STATE
        // -------------------------

        setLoading(true);


        try {

            // -------------------------
            // CREATE TICKET
            // -------------------------

            const response =
                await fetch(
                    `${API_BASE_URL}/tickets/`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${token}`
                        },

                        body: JSON.stringify({
                            title: title,
                            description: description,
                            category: category,
                            priority: priority
                        })
                    }
                );


            const data =
                await response.json();


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
                    data.detail ||
                    "Unable to create ticket."
                );
            }


            // -------------------------
            // UPLOAD IMAGE
            // -------------------------

            const selectedFile =
                imageInput.files[0];


            if (selectedFile) {

                const imageFormData =
                    new FormData();


                imageFormData.append(
                    "image",
                    selectedFile
                );


                const imageResponse =
                    await fetch(
                        `${API_BASE_URL}/tickets/${data.id}/image`,
                        {
                            method: "POST",

                            headers: {
                                "Authorization":
                                    `Bearer ${token}`
                            },

                            body: imageFormData
                        }
                    );


                const imageData =
                    await imageResponse.json();


                if (!imageResponse.ok) {

                    console.warn(
                        "Ticket created but image upload failed:",
                        imageData
                    );
                }
            }


            // -------------------------
            // SUCCESS
            // -------------------------

            window.location.href =
                `ticket-details.html?id=${data.id}`;


        } catch (error) {

            console.error(error);

            showError(
                error.message ||
                "Something went wrong while creating the ticket."
            );

            setLoading(false);
        }
    }
);


// =========================
// LOADING STATE
// =========================

function setLoading(isLoading) {

    submitButton.disabled =
        isLoading;

    submitLoader.hidden =
        !isLoading;


    if (isLoading) {

        submitButtonText.textContent =
            "Creating ticket...";

    } else {

        submitButtonText.textContent =
            "Create ticket";
    }
}


// =========================
// ERROR
// =========================

function showError(message) {

    formError.textContent =
        message;

    formError.hidden =
        false;
}


function hideError() {

    formError.textContent =
        "";

    formError.hidden =
        true;
}


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