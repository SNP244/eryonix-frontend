document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");

    // Handle both ID variations found in different HTML files
    const signupBtn = document.getElementById("signupBtn") || document.getElementById("navSignupBtn");
    const profileImage = document.getElementById("profileImage");
    const logoutBtn = document.getElementById("logoutBtn");
    const getStartedBtn = document.getElementById("getStartedBtn");
    const joinUsBtn = document.getElementById("joinUsBtn");

    // Helper to show/hide elements
    const show = (el) => { if (el) el.style.display = "inline-block"; };
    const hide = (el) => { if (el) el.style.display = "none"; };
    const removeClass = (el, cls) => { if (el) el.classList.remove(cls); };
    const addClass = (el, cls) => { if (el) el.classList.add(cls); };

    if (!token) {
        // User is NOT logged in
        show(signupBtn);
        hide(profileImage);
        hide(logoutBtn);
        removeClass(getStartedBtn, "d-none");
        removeClass(joinUsBtn, "d-none");
        return;
    }

    // User is logged in -> fetch profile
    fetch(`${BACKEND_URL}/api/users/profile`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    })
        .then(res => {
            if (!res.ok) throw new Error("Unauthorized");
            return res.json();
        })
        .then(user => {
            // Auth successful
            hide(signupBtn);
            show(profileImage);
            show(logoutBtn);
            addClass(getStartedBtn, "d-none");
            addClass(joinUsBtn, "d-none");

            if (user.profilePictureUrl) {
                profileImage.src = `${BACKEND_URL}${user.profilePictureUrl}`;
            } else {
                profileImage.src = "assets/images/default-avatar.png";
            }

            // Profile click -> go to profile page
            profileImage.onclick = () => {
                window.location.href = "profile.html";
            };

            // Logout click -> clear token and redirect
            logoutBtn.onclick = () => {
                localStorage.removeItem("token");
                localStorage.removeItem("username"); // Also clear username if stored
                window.location.href = "index.html";
            };
        })
        .catch(err => {
            console.error("Auth check failed:", err);
            // Fallback if token is invalid/expired
            localStorage.removeItem("token");
            show(signupBtn);
            hide(profileImage);
            hide(logoutBtn);
            removeClass(getStartedBtn, "d-none");
            removeClass(joinUsBtn, "d-none");
        });
});
