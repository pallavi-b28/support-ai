const API_BASE_URL = "http://127.0.0.1:8000";


// =========================================
// PASSWORD TOGGLE
// =========================================

const passwordToggle =
    document.getElementById("passwordToggle");

const passwordInput =
    document.getElementById("password");

if (passwordToggle && passwordInput) {

    passwordToggle.addEventListener(
        "click",
        () => {

            if (passwordInput.type === "password") {

                passwordInput.type = "text";

                passwordToggle.textContent =
                    "Hide";

            } else {

                passwordInput.type = "password";

                passwordToggle.textContent =
                    "Show";
            }
        }
    );
}


// =========================================
// CONFIRM PASSWORD TOGGLE
// =========================================

const confirmPasswordToggle =
    document.getElementById(
        "confirmPasswordToggle"
    );

const confirmPasswordInput =
    document.getElementById(
        "confirmPassword"
    );

if (
    confirmPasswordToggle &&
    confirmPasswordInput
) {

    confirmPasswordToggle.addEventListener(
        "click",
        () => {

            if (
                confirmPasswordInput.type ===
                "password"
            ) {

                confirmPasswordInput.type =
                    "text";

                confirmPasswordToggle.textContent =
                    "Hide";

            } else {

                confirmPasswordInput.type =
                    "password";

                confirmPasswordToggle.textContent =
                    "Show";
            }
        }
    );
}


// =========================================
// REGISTER FORM
// =========================================

const registerForm =
    document.getElementById(
        "registerForm"
    );

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            // -------------------------------
            // GET FORM VALUES
            // -------------------------------

            const name =
                document.getElementById(
                    "name"
                ).value.trim();

            const email =
                document.getElementById(
                    "email"
                ).value.trim();

            const password =
                document.getElementById(
                    "password"
                ).value;

            const confirmPassword =
                document.getElementById(
                    "confirmPassword"
                ).value;


            // -------------------------------
            // ELEMENTS
            // -------------------------------

            const registerButton =
                document.getElementById(
                    "registerButton"
                );

            const registerButtonText =
                document.getElementById(
                    "registerButtonText"
                );

            const registerLoader =
                document.getElementById(
                    "registerLoader"
                );

            const registerError =
                document.getElementById(
                    "registerError"
                );

            const registerSuccess =
                document.getElementById(
                    "registerSuccess"
                );


            // -------------------------------
            // RESET MESSAGES
            // -------------------------------

            registerError.hidden = true;
            registerSuccess.hidden = true;

            registerError.textContent = "";
            registerSuccess.textContent = "";


            // -------------------------------
            // VALIDATION
            // -------------------------------

            if (name.length < 2) {

                registerError.textContent =
                    "Please enter your full name.";

                registerError.hidden = false;

                return;
            }


            if (password.length < 6) {

                registerError.textContent =
                    "Password must contain at least 6 characters.";

                registerError.hidden = false;

                return;
            }


            if (
                password !==
                confirmPassword
            ) {

                registerError.textContent =
                    "Passwords do not match.";

                registerError.hidden = false;

                return;
            }


            // -------------------------------
            // LOADING STATE
            // -------------------------------

            registerButton.disabled = true;

            registerButtonText.textContent =
                "Creating account...";

            registerLoader.hidden = false;


            try {

                // ---------------------------
                // SEND REQUEST
                // ---------------------------

                const response =
                    await fetch(
                        `${API_BASE_URL}/auth/register`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                name: name,
                                email: email,
                                password: password
                            })
                        }
                    );


                // ---------------------------
                // READ RESPONSE
                // ---------------------------

                const data =
                    await response.json();


                // ---------------------------
                // HANDLE ERROR
                // ---------------------------

                if (!response.ok) {

                    throw new Error(
                        data.detail ||
                        "Registration failed."
                    );
                }


                // ---------------------------
                // SUCCESS
                // ---------------------------

                registerSuccess.textContent =
                    "Account created successfully! Redirecting to login...";

                registerSuccess.hidden = false;


                // Clear password fields

                document.getElementById(
                    "password"
                ).value = "";

                document.getElementById(
                    "confirmPassword"
                ).value = "";


                // Redirect to login

                setTimeout(
                    () => {
                        window.location.href =
                            "login.html";
                    },
                    1500
                );


            } catch (error) {

                registerError.textContent =
                    error.message ||
                    "Unable to create account.";

                registerError.hidden = false;


            } finally {

                registerButton.disabled =
                    false;

                registerButtonText.textContent =
                    "Create account";

                registerLoader.hidden =
                    true;
            }
        }
    );
}