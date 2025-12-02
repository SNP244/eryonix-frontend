const BACKEND_URL = window.BACKEND_URL || "https://eryonix-backend.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    // Handle both ID variants
    const signupBtn = document.getElementById("navSignupBtn") || document.getElementById("signupBtn");
    const profileImage = document.getElementById("profileImage");
    const logoutBtn = document.getElementById("logoutBtn");
    const getStartedBtn = document.getElementById("getStartedBtn");
    const joinUsBtn = document.getElementById("joinUsBtn");

    // Don't return early - some pages may not have all elements
    if (!signupBtn && !profileImage && !logoutBtn) {
        console.warn("No auth elements found on this page");
        return;
    }

    if (!token) {
        if (signupBtn) signupBtn.style.display = "inline-block";
        if (profileImage) profileImage.style.display = "none";
        if (logoutBtn) logoutBtn.style.display = "none";
        if (getStartedBtn) getStartedBtn.classList.remove("d-none");
        if (joinUsBtn) joinUsBtn.classList.remove("d-none");
        return;
    }

    // If token exists, keep signup hidden (it should be hidden by CSS default)
    // and wait for profile fetch to show profile/logout

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
            // Hide signup just in case
            if (signupBtn) signupBtn.style.display = "none";
            if (getStartedBtn) getStartedBtn.classList.add("d-none");
            if (joinUsBtn) joinUsBtn.classList.add("d-none");

            if (profileImage) {
                if (user.profilePictureUrl) {
                    // Check if URL is absolute (Cloudinary) or relative
                    profileImage.src = user.profilePictureUrl.startsWith("http")
                        ? user.profilePictureUrl
                        : `${BACKEND_URL}${user.profilePictureUrl}`;
                } else {
                    profileImage.src = "assets/images/default-avatar.png";
                }

                // Show elements once we know we are good
                profileImage.style.display = "inline-block";

                profileImage.onclick = () => {
                    window.location.href = "profile.html";
                };
            }

            if (logoutBtn) {
                logoutBtn.style.display = "inline-block";
                logoutBtn.onclick = () => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("username");
                    window.location.href = "index.html";
                };
            }
        })
        .catch(err => {
            console.error("Auth error:", err);
            // Fallback to logged out state
            if (signupBtn) signupBtn.style.display = "inline-block";
            if (profileImage) profileImage.style.display = "none";
            if (logoutBtn) logoutBtn.style.display = "none";
            if (getStartedBtn) getStartedBtn.classList.remove("d-none");
            if (joinUsBtn) joinUsBtn.classList.remove("d-none");
        });
});
