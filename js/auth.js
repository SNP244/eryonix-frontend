document.addEventListener("DOMContentLoaded", function () {
    const signupForm = document.getElementById("signup-form");
    const loginForm = document.getElementById("login-form");


    //  Signup Form Logic
if (signupForm) {
    signupForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const fullname = document.getElementById("fullname").value.trim();
        const username = document.getElementById("username").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();
        const confirmPassword = document.getElementById("confirm-password").value.trim();
        const role = document.getElementById("role").value.trim(); // from <select>
        const messageDiv = document.getElementById("signup-message");

        if (!fullname || !username || !email || !password || !confirmPassword || !role) {
            showMessage(messageDiv, "All fields are required!", "red");
            return;
        }

        if (password !== confirmPassword) {
            showMessage(messageDiv, "Passwords do not match!", "red");
            return;
        }

        //  Call backend for signup
        fetch(`${BASE_URL}/api/auth/signup`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                fullname,
                username,
                email,
                password,
                role,
                skills: [],
                portfolioLink: "",
                bio: ""
            })
        })
        .then(res => {
            if (!res.ok) return res.text().then(msg => { throw new Error(msg); });
            return res.json();
        })
        .then(() => {
            showMessage(messageDiv, "Signup successful! Redirecting...", "green");
            setTimeout(() => {
                window.location.href = "login.html";
            }, 2000);
        })
        .catch(err => {
            showMessage(messageDiv, "Signup failed: " + err.message, "red");
        });
    });
}

            
    //  Login Form Logic
    if (loginForm) {
        loginForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const username = document.getElementById("login-username").value.trim();
            const password = document.getElementById("login-password").value.trim();
            const messageDiv = document.getElementById("login-message");

            if (!username || !password) {
                showMessage(messageDiv, "Please enter both username and password!", "red");
                return;
            }

            //  Call backend for login
            fetch(`${BASE_URL}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            })
            .then(res => {
                if (!res.ok) return res.text().then(msg => { throw new Error(msg); });
                return res.json();
            })
            .then(data => {
    console.log("Login response:", data); 
    localStorage.setItem("token", data.token);
    localStorage.setItem("username", data.username);
    showMessage(messageDiv, "Login successful! Redirecting...", "green");
    setTimeout(() => {
        window.location.href = "dashboard.html";
    }, 2000);
})

            .catch(err => {
                showMessage(messageDiv, "Login failed: " + err.message, "red");
            });
        });
    }

    //  Utility Function
    function showMessage(element, message, color) {
        element.innerText = message;
        element.style.color = color;
    }
});
