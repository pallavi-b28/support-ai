const API_BASE_URL = "http://127.0.0.1:8000";


// =========================================================
// PASSWORD VISIBILITY
// =========================================================

const passwordToggle = document.getElementById("passwordToggle");
const passwordInput = document.getElementById("password");

if (passwordToggle && passwordInput) {

    passwordToggle.addEventListener("click", () => {

        if (passwordInput.type === "password") {

            passwordInput.type = "text";

            passwordToggle.textContent = "Hide";

            passwordToggle.setAttribute(
                "aria-label",
                "Hide password"
            );

        } else {

            passwordInput.type = "password";

            passwordToggle.textContent = "Show";

            passwordToggle.setAttribute(
                "aria-label",
                "Show password"
            );
        }
    });
}


// =========================================================
// LOGIN
// =========================================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        const loginButton =
            document.getElementById("loginButton");

        const loginButtonText =
            document.getElementById("loginButtonText");

        const loginLoader =
            document.getElementById("loginLoader");

        const loginError =
            document.getElementById("loginError");


        // Clear previous error
        loginError.hidden = true;
        loginError.textContent = "";


        // Disable button
        loginButton.disabled = true;

        loginButtonText.textContent = "Signing in...";

        loginLoader.hidden = false;


        try {

            /*
             * FastAPI OAuth2PasswordRequestForm
             * expects:
             *
             * username
             * password
             */

            const formData = new URLSearchParams();

            formData.append(
                "username",
                email
            );

            formData.append(
                "password",
                password
            );


            const response = await fetch(
                `${API_BASE_URL}/auth/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded"
                    },

                    body: formData
                }
            );


            const data = await response.json();


            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    "Invalid email or password"
                );
            }


            // =================================================
            // SAVE AUTHENTICATION DATA
            // =================================================

            localStorage.setItem(
                "access_token",
                data.access_token
            );


            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );


            // =================================================
            // ROLE BASED REDIRECT
            // =================================================

            if (data.user.role === "admin") {

                window.location.href =
                    "admin-dashboard.html";

            } else if (data.user.role === "agent") {

                window.location.href =
                    "agent-dashboard.html";

            } else {

                window.location.href =
                    "dashboard.html";
            }


        } catch (error) {

            loginError.textContent =
                error.message;

            loginError.hidden = false;

        } finally {

            loginButton.disabled = false;

            loginButtonText.textContent =
                "Sign in";

            loginLoader.hidden = true;
        }

    });
}