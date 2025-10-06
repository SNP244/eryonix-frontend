const BACKEND_URL = "http://localhost:8080";

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const type = params.get("type"); // "post" or "video"

  if (!id || !type) {
    alert("Invalid share link.");
    return;
  }

  const url = `${BACKEND_URL}/api/share/${type}/${id}`; 


  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error("Media not found.");
      return res.json();
    })
    .then(data => {
      renderSharedMedia(data, type);
      document.getElementById("reelView").classList.remove("reel-hidden"); 
    })
    .catch(err => {
      console.error("❌ Failed to load shared content", err);
      document.body.innerHTML = "<h2>Unable to load shared content</h2>";
    });
});

function renderSharedMedia(data, type) {
  const reelMediaContainer = document.getElementById("reelMediaContainer");
  const reelCaption = document.getElementById("reelCaption");
  const reelUser = document.getElementById("reelUser");

  // Clear previous content
  reelMediaContainer.innerHTML = "";

  if (type === "video") {
    const video = document.createElement("video");
    video.src = `${BACKEND_URL}${data.videoUrl}`;
    video.controls = true;
    video.autoplay = true;
    video.className = "reel-video";
    reelMediaContainer.appendChild(video);
  } else {
    const img = document.createElement("img");
    img.src = `${BACKEND_URL}${data.imageUrl}`;
    img.className = "reel-image";
    reelMediaContainer.appendChild(img);
  }

  reelCaption.textContent = data.caption || "";
  reelUser.textContent = `By @${data.username || "Unknown"}`;
}

//  Close button functionality
document.addEventListener("click", function (e) {
  if (e.target.id === "reelCloseBtn") {
    document.getElementById("reelView").classList.add("reel-hidden");
  }
});
