// BACKEND_URL is defined in config.js which loads first

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    const signupBtn = document.getElementById("navSignupBtn") || document.getElementById("signupBtn");
    const profileImage = document.getElementById("profileImage");
    const logoutBtn = document.getElementById("logoutBtn");
    const getStartedBtn = document.getElementById("getStartedBtn");
    const joinUsBtn = document.getElementById("joinUsBtn");

    console.log("navbar.js loaded", { token: !!token, signupBtn: !!signupBtn, profileImage: !!profileImage, logoutBtn: !!logoutBtn });

    if (!token) {
        console.log("No token found, showing signup");
        if (signupBtn) signupBtn.style.display = "inline-block";
        if (profileImage) profileImage.style.display = "none";
        if (logoutBtn) logoutBtn.style.display = "none";
        if (getStartedBtn) getStartedBtn.classList.remove("d-none");
        if (joinUsBtn) joinUsBtn.classList.remove("d-none");
        return;
    }

    console.log("Token found, fetching profile");
    fetch(`${BACKEND_URL}/api/users/profile`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    })
        .then(res => {
            console.log("Profile response status:", res.status);
            if (!res.ok) throw new Error("Unauthorized");
            return res.json();
        })
        .then(user => {
            console.log("Profile loaded successfully", user);
            if (signupBtn) signupBtn.style.display = "none";
            if (getStartedBtn) getStartedBtn.classList.add("d-none");
            if (joinUsBtn) joinUsBtn.classList.add("d-none");

            if (profileImage) {
                if (user.profilePictureUrl) {
                    profileImage.src = user.profilePictureUrl.startsWith("http")
                        ? user.profilePictureUrl
                        : `${BACKEND_URL}${user.profilePictureUrl}`;
                } else {
                    profileImage.src = "assets/images/default-avatar.png";
                }
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
            // Clear invalid token
            localStorage.removeItem("token");
            localStorage.removeItem("username");
            // Show signup
            if (signupBtn) signupBtn.style.display = "inline-block";
            if (profileImage) profileImage.style.display = "none";
            if (logoutBtn) logoutBtn.style.display = "none";
            if (getStartedBtn) getStartedBtn.classList.remove("d-none");
            if (joinUsBtn) joinUsBtn.classList.remove("d-none");
        });
});
