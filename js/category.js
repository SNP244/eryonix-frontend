// Search functionality
document.getElementById("searchBar")?.addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase();
  document.querySelectorAll(".card").forEach((card) => {
    const username = card.dataset.username?.toLowerCase() || "";
    const caption = card.dataset.caption?.toLowerCase() || "";
    card.style.display = username.includes(query) || caption.includes(query) ? "block" : "none";
  });
});
document.addEventListener("DOMContentLoaded", async function () {



  const reelView = document.getElementById("reelView");
  const reelMediaContainer = document.getElementById("reelMediaContainer");
  const reelCaption = document.getElementById("reelCaption");
  const reelUser = document.getElementById("reelUser");
  const reelCloseBtn = document.getElementById("reelCloseBtn");
  const reelLikeBtn = document.getElementById("reelLikeBtn");
  const reelLikeCount = document.getElementById("reelLikeCount");
  const reelCommentBtn = document.getElementById("reelCommentBtn");
  const reelCommentsContainer = document.getElementById("reelCommentsContainer");
  const reelCommentSubmit = document.getElementById("reelCommentSubmit");
  const reelCommentInput = document.getElementById("reelCommentInput");

  let currentPostId = null;
  let currentVideoId = null;
  let currentShareUrl = "";

  const urlParams = new URLSearchParams(window.location.search);
  const type = urlParams.get("type");
  console.log("Current type:", type);


  const categoryHeader = document.getElementById("category-header");
  const categoryTitle = document.getElementById("category-title");
  const categoryDescription = document.getElementById("category-description");
  const categoryContent = document.getElementById("category-content");





  reelCloseBtn?.addEventListener("click", () => {
    reelView.classList.add("reel-hidden");
    reelMediaContainer.innerHTML = "";
    document.body.classList.remove("modal-open");
    currentPostId = null;
    currentVideoId = null;
  });

  reelLikeBtn?.addEventListener("click", () => {
    const token = localStorage.getItem("token");
    if (!token || reelLikeBtn.disabled) return;

    const alreadyLiked = reelLikeBtn.classList.contains("liked");
    const likeUrl = currentPostId
      ? `${BACKEND_URL}/api/likes/post/${currentPostId}`
      : `${BACKEND_URL}/api/likes/video/${currentVideoId}`;

    if (alreadyLiked) {
      reelLikeBtn.classList.remove("liked");
      reelLikeBtn.textContent = "🤍";
      updateLikeCount(-1);
      fetch(likeUrl, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      }).then(() => fetchLikeCount(currentPostId, currentVideoId))
        .catch(err => console.error("❌ Failed to unlike", err));
    } else {
      reelLikeBtn.classList.add("liked");
      reelLikeBtn.textContent = "❤️";
      updateLikeCount(1);
      triggerHeartBlast();
      triggerConfettiRain();
      fetch(likeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: "{}"
      }).then(() => fetchLikeCount(currentPostId, currentVideoId))
        .catch(err => console.error("❌ Failed to like", err));
    }
  });

  reelCommentBtn?.addEventListener("click", () => {
    const isHidden = reelCommentsContainer.classList.toggle("hidden");
    document.getElementById("reelActions").style.display = isHidden ? "flex" : "none";
  });

  reelCommentSubmit?.addEventListener("click", () => {
    const token = localStorage.getItem("token");
    const content = reelCommentInput.value.trim();
    if (!token || !content) return;

    const mediaId = currentPostId || currentVideoId;
    const mediaType = currentPostId ? "POST" : "VIDEO";

    fetch(`${BACKEND_URL}/api/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ content, mediaId, mediaType })
    })
      .then(res => res.json())
      .then(() => {
        reelCommentInput.value = "";
        fetchReelComments(mediaId, mediaType);
        const reelCountEl = document.getElementById("reelCommentCount");
        const currentCount = parseInt(reelCountEl.textContent.split(" ")[0]) || 0;
        reelCountEl.textContent = `${currentCount + 1} comments`;
      })
      .catch(err => console.error("❌ Failed to post comment", err));
  });


  const categories = {
    music: {
      title: "🎵 Music Talents",
      description: "Discover amazing musicians, singers, and composers.",
      bgColor: "#1e1e1e"
    },
    tech: {
      title: "💻 Coding & Tech",
      description: "Full-stack, AI/ML, and App Developers.",
      bgColor: "#14213d"
    },
    art: {
      title: "🎨 Art & Creativity",
      description: "Painters, Designers, Creators & more.",
      bgColor: "#7b2cbf"
    },
    science: {
      title: "📚 Science & Innovation",
      description: "Innovators and researchers changing the world.",
      bgColor: "#006d77"
    },
    content: {
      title: "📹 Content Creators",
      description: "Creative content, reels, vlogs & more.",
      bgColor: "#264653"
    },
    performing: {
      title: "🎭 Performing Arts",
      description: "Dancers, actors, stage performers.",
      bgColor: "#6a0572"
    },
    sports: {
      title: "🏆 Sports & Fitness",
      description: "Athletes, fitness freaks & sports creators.",
      bgColor: "#2a9d8f"
    }
  };

  if (!type || !categories[type]) {
    categoryTitle.textContent = "Category Not Found";
    categoryDescription.textContent = "Sorry, the category you're looking for doesn't exist.";
    return;
  }

  const selected = categories[type];
  categoryHeader.style.backgroundColor = selected.bgColor;
  categoryTitle.textContent = selected.title;
  categoryDescription.textContent = selected.description;

  try {
    const [postsRes, videosRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/media/posts/category/${type}`),
      fetch(`${BACKEND_URL}/api/media/videos/category/${type}`)
    ]);

    const posts = await postsRes.json();
    const videos = await videosRes.json();

    if (posts.length === 0 && videos.length === 0) {
      categoryContent.innerHTML = `<div class="col-12 text-center"><p class="text-muted">No content found for this category.</p></div>`;
      return;
    }

    posts.forEach((post) => {
      const col = document.createElement("div");
      col.className = "col-md-4 mb-4";
      const imageUrl = post.imageUrl.startsWith("http") ? post.imageUrl : `${BACKEND_URL}${post.imageUrl}`;
      col.innerHTML = `
    <div class="card h-100" data-post-id="${post.id}" data-username="${post.username}">
      <img src="${imageUrl}" class="card-img-top media" alt="Post image">
      <div class="card-body">
        <h5 class="card-title">
  <a href="public-profile.html?user=${post.username}" class="text-decoration-none user-link">@${post.username}</a>
</h5>

        <p class="card-text caption">${post.caption}</p>
      </div>
    </div>
  `;
      categoryContent.appendChild(col);
      addMediaClickListener(col.querySelector(".card"));
    });


    videos.forEach((video) => {
      const col = document.createElement("div");
      col.className = "col-md-4 mb-4";
      const videoUrl = video.videoUrl.startsWith("http") ? video.videoUrl : `${BACKEND_URL}${video.videoUrl}`;
      col.innerHTML = `
    <div class="card h-100" data-video-id="${video.id}" data-username="${video.username}">
      <video class="w-100 media" style="max-height: 250px;">
        <source src="${videoUrl}" type="video/mp4">
        Your browser does not support the video tag.
      </video>
      <div class="card-body">
        <h5 class="card-title">
  <a href="public-profile.html?user=${video.username}" class="text-decoration-none user-link">@${video.username}</a>
</h5>

        <p class="card-text caption">${video.caption}</p>
      </div>
    </div>
  `;
      categoryContent.appendChild(col);
      addMediaClickListener(col.querySelector(".card"));
    });


  } catch (err) {
    console.error("Error loading category content:", err);
    categoryContent.innerHTML = `<div class="col-12 text-center"><p class="text-danger">Failed to load content.</p></div>`;
  }


  function addMediaClickListener(card) {
    card.querySelector(".media")?.addEventListener("click", () => {
      const cloned = card.querySelector(".media").cloneNode(true);
      if (cloned.tagName === "VIDEO") cloned.controls = true;

      reelMediaContainer.innerHTML = "";
      reelMediaContainer.appendChild(cloned);
      reelCaption.textContent = card.querySelector(".caption").textContent;
      reelUser.textContent = card.querySelector(".user-link").textContent;

      currentPostId = card.dataset.postId ? parseInt(card.dataset.postId) : null;
      currentVideoId = card.dataset.videoId ? parseInt(card.dataset.videoId) : null;

      const token = localStorage.getItem("token");
      const loggedInUsername = localStorage.getItem("username");
      const isOwnContent =
        (card.dataset.username?.toLowerCase() || "") === (loggedInUsername?.toLowerCase() || "");

      if (!token || isOwnContent) {
        reelLikeBtn.style.opacity = "0.5";
        reelLikeBtn.disabled = true;
        reelLikeBtn.title = !token ? "Login to like" : "You cannot like your own post";
        if (isOwnContent) showOwnLikeToast();
      } else {
        reelLikeBtn.style.opacity = "1";
        reelLikeBtn.disabled = false;
        reelLikeBtn.title = "Like";

        const likeStatusUrl = currentPostId
          ? `${BACKEND_URL}/api/likes/post/${currentPostId}/liked`
          : `${BACKEND_URL}/api/likes/video/${currentVideoId}/liked`;

        fetch(likeStatusUrl, { headers: { "Authorization": `Bearer ${token}` } })
          .then(res => res.json())
          .then(isLiked => {
            if (isLiked) {
              reelLikeBtn.classList.add("liked");
              reelLikeBtn.textContent = "❤️";
            }
          });
      }

      fetchLikeCount(currentPostId, currentVideoId);
      fetchCommentCount(currentPostId, currentVideoId);
      fetchReelComments(currentPostId || currentVideoId, currentPostId ? "post" : "video");

      reelCommentsContainer.classList.add("hidden");
      document.getElementById("reelActions").style.display = "flex";
      reelView.classList.remove("reel-hidden");
      document.body.classList.add("modal-open");

      // Share
      setTimeout(() => {
        const shareBtn = document.getElementById("reelShareBtn");
        if (shareBtn) {
          shareBtn.onclick = () => {
            const mediaId = currentPostId || currentVideoId;
            const type = currentPostId ? "post" : "video";
            currentShareUrl = `http://localhost:5500/public-share.html?id=${mediaId}&type=${type}`;
            openShareModal(currentShareUrl, type, mediaId);
          };
        }
      }, 0);

    });
  }

  function updateLikeCount(change) {
    const el = document.getElementById("reelLikeCount");
    const current = parseInt(el.textContent.split(" ")[0]) || 0;
    el.textContent = `${current + change} likes`;
  }

  function fetchLikeCount(postId, videoId) {
    const url = postId
      ? `${BACKEND_URL}/api/likes/post/${postId}/count`
      : `${BACKEND_URL}/api/likes/video/${videoId}/count`;
    fetch(url)
      .then(res => res.json())
      .then(count => {
        document.getElementById("reelLikeCount").textContent = `${count} likes`;
      });
  }

  function fetchCommentCount(postId, videoId) {
    const url = postId
      ? `${BACKEND_URL}/api/comments/post/${postId}/count`
      : `${BACKEND_URL}/api/comments/video/${videoId}/count`;
    fetch(url)
      .then(res => res.json())
      .then(count => {
        document.getElementById("reelCommentCount").textContent = `${count} comments`;
      });
  }

  function fetchReelComments(mediaId, mediaType) {
    fetch(`${BACKEND_URL}/api/comments/${mediaType}/${mediaId}`)
      .then(res => res.json())
      .then(comments => {
        const container = document.getElementById("reelCommentsList");
        container.innerHTML = "";
        if (!comments.length) {
          container.innerHTML = "<p>No comments yet.</p>";
          return;
        }

        comments.forEach(comment => {
          const commentDiv = document.createElement("div");
          commentDiv.className = "comment";
          commentDiv.innerHTML = `
          <p><strong>@${comment.username}</strong>: ${comment.content}</p>
          <button class="reply-btn">Reply</button>
          <div class="reply-input hidden">
            <input type="text" placeholder="Write a reply..." class="reply-text" />
            <button class="reply-submit">Send</button>
          </div>`;
          commentDiv.querySelector(".reply-btn").addEventListener("click", () => {
            commentDiv.querySelector(".reply-input").classList.toggle("hidden");
          });
          commentDiv.querySelector(".reply-submit").addEventListener("click", () => {
            const replyText = commentDiv.querySelector(".reply-text").value.trim();
            if (!replyText) return;
            const token = localStorage.getItem("token");
            if (!token) return;
            fetch(`${BACKEND_URL}/api/comments/${comment.id}/reply`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({ content: replyText })
            }).then(() => fetchReelComments(mediaId, mediaType));
          });
          container.appendChild(commentDiv);
        });
      });
  }

  function triggerHeartBlast() {
    const heart = document.createElement("div");
    heart.className = "exploding-heart";
    heart.textContent = "💖";
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 1000);
  }

  function triggerConfettiRain() {
    const emojis = ["🎊", "✨", "💜", "💖", "❤️"];
    for (let i = 0; i < 35; i++) {
      const piece = document.createElement("div");
      piece.className = "confetti-piece";
      piece.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      piece.style.left = Math.random() * 100 + "vw";
      piece.style.fontSize = 12 + Math.random() * 12 + "px";
      piece.style.animationDelay = Math.random() * 0.3 + "s";
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 2500);
    }
  }

  function showOwnLikeToast() {
    const toast = document.createElement("div");
    toast.className = "like-toast";
    toast.textContent = "You can't like your own post!";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }




});

function openShareModal(shareUrl, mediaType, mediaId) {
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");

  if (!token || !username) return alert("Please log in to share.");

  const modal = document.getElementById("shareModal");
  modal.classList.remove("hidden");

  const followersList = document.getElementById("followersList");
  followersList.innerHTML = "<p>Loading followers...</p>";

  // Fetch followers
  fetch(`${BACKEND_URL}/api/follow/followers/${username}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(followers => {
      if (!followers.length) {
        followersList.innerHTML = "<p>No followers to share with.</p>";
        return;
      }

      followersList.innerHTML = "";
      followers.forEach(f => {
        const div = document.createElement("div");
        div.className = "follower-item";
        div.dataset.username = f.username;
        console.log("Follower image for", f.username, ":", f.profileImage);

        const profileImg = f.profilePictureUrl
          ? (f.profilePictureUrl.startsWith("http") ? f.profilePictureUrl : `${BACKEND_URL}${f.profilePictureUrl}`)
          : "assets/img/default-avatar.png";
        div.innerHTML = `
    <img src="${profileImg}" />
    <span>@${f.username}</span>`;
        div.addEventListener("click", () => div.classList.toggle("selected"));
        followersList.appendChild(div);
      });

    });

  // External share links
  const encoded = encodeURIComponent(`Check this out on Eryonix! ${shareUrl}`);
  document.getElementById("copyLinkBtn").onclick = () => {
    navigator.clipboard.writeText(shareUrl);
    alert("Link copied!");
  };
  document.getElementById("whatsappShare").href = `https://wa.me/?text=${encoded}`;
  document.getElementById("twitterShare").href = `https://twitter.com/intent/tweet?text=${encoded}`;
  document.getElementById("facebookShare").href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  document.getElementById("linkedinShare").href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

  // Set up send
  document.getElementById("sendShare").onclick = () => {
    const selected = [...document.querySelectorAll(".follower-item.selected")].map(el => el.dataset.username);
    const message = document.getElementById("shareMessage").value;

    if (!selected.length) return alert("Select at least one follower to share with.");

    fetch(`${BACKEND_URL}/api/share`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        recipients: selected,
        message,
        mediaId,
        mediaType: mediaType.toUpperCase()
      })
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to share.");
        alert("Shared successfully!");
        modal.classList.add("hidden");
      })
      .catch(err => {
        console.error(" Share failed:", err);
        alert("Something went wrong.");
      });
  };
}
document.getElementById("closeShareModal").onclick = () => {
  document.getElementById("shareModal").classList.add("hidden");
};

document.getElementById("cancelShare").onclick = () => {
  document.getElementById("shareModal").classList.add("hidden");
};

