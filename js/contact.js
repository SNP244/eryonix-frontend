

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  const alertBox = document.getElementById("alertBox");

  function showAlert(message, type = "success") {
    alertBox.className = `alert alert-${type}`;
    alertBox.textContent = message;
    alertBox.classList.remove("d-none");

    // Auto-hide after 3 seconds
    setTimeout(() => {
      alertBox.classList.add("d-none");
    }, 3000);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("Form submitted!");

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const subject = document.getElementById("subject").value.trim();
    const message = document.getElementById("message").value.trim();

    // Validation
    if (!name || !email || !subject || !message) {
      showAlert("⚠️ Please fill in all fields.", "warning");
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message })
      });

      if (res.ok) {
        showAlert(" Message sent successfully!");
        form.reset();
      } else {
        showAlert("❌ Failed to send message. Please try again.", "danger");
      }
    } catch (error) {
      console.error("Error:", error);
      showAlert("❌ Server error. Try again later.", "danger");
    }
  });
});
