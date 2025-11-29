
// 🔍 Search functionality
document.getElementById("searchBar")?.addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase();
  document.querySelectorAll(".card").forEach((card) => {
    const username = card.dataset.username?.toLowerCase() || "";
    const caption = card.dataset.caption?.toLowerCase() || "";
    card.style.display = username.includes(query) || caption.includes(query) ? "block" : "none";
  });
});

window.addEventListener("DOMContentLoaded", () => {
  loadShowcaseContent();

  
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

  function addMediaClickListener(card) {
    card.querySelector(".media")?.addEventListener("click", () => {
      const cloned = card.querySelector(".media").cloneNode(true);
      if (cloned.tagName === "VIDEO") cloned.controls = true;

      reelMediaContainer.innerHTML = "";
      reelMediaContainer.appendChild(cloned);
      reelCaption.textContent = card.querySelector(".caption").textContent;
      reelUser.textContent = card.querySelector(".user").textContent;

      currentPostId = card.dataset.postId ? parseInt(card.dataset.postId) : null;
      currentVideoId = card.dataset.videoId ? parseInt(card.dataset.videoId) : null;

      // like status setup
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



      //  ADD at end of media click event
const shareBtn = document.getElementById("reelShareBtn");
shareBtn.onclick = () => {
  const mediaId = currentPostId || currentVideoId;
  const type = currentPostId ? "post" : "video";
  currentShareUrl = `http://localhost:5500/public-share.html?id=${mediaId}&type=${type}`;
  openShareModal(currentShareUrl, type, mediaId);
};

    });
  }

  function loadShowcaseContent() {
    const grid = document.getElementById("contentGrid");
    grid.innerHTML = "";

    fetch(`${BACKEND_URL}/api/media/posts`)
      .then(res => res.json())
      .then(posts => {
        posts.forEach(post => {
          const card = document.createElement("div");
          card.className = "card";
          card.dataset.postId = post.id;
          card.dataset.username = post.username;
          card.dataset.caption = post.caption;

          card.innerHTML = `
            <div class="like-count" id="post-like-count-${post.id}">Loading likes...</div>
            <div class="comment-count" id="post-comment-count-${post.id}">Loading comments...</div>
            <img src="${BACKEND_URL}${post.imageUrl}" class="media" />
            <p class="caption">${post.caption}</p>
            <p class="user"><a href="public-profile.html?user=${post.username}">@${post.username}</a></p>`;
          addMediaClickListener(card);
          grid.appendChild(card);
          fetchCardLikeCount(post.id, null);
          fetchCardCommentCount(post.id, null);
        });
      });

    fetch(`${BACKEND_URL}/api/media/videos`)
      .then(res => res.json())
      .then(videos => {
        videos.forEach(video => {
          const card = document.createElement("div");
          card.className = "card";
          card.dataset.videoId = video.id;
          card.dataset.username = video.username;
          card.dataset.caption = video.caption;

          card.innerHTML = `
            <div class="like-count" id="video-like-count-${video.id}">Loading likes...</div>
            <div class="comment-count" id="video-comment-count-${video.id}">Loading comments...</div>
            <video class="media"><source src="${BACKEND_URL}${video.videoUrl}" type="video/mp4"></video>
            <p class="caption">${video.caption}</p>
            <p class="user"><a href="public-profile.html?user=${video.username}">@${video.username}</a></p>`;
          addMediaClickListener(card);
          grid.appendChild(card);
          fetchCardLikeCount(null, video.id);
          fetchCardCommentCount(null, video.id);
        });
      });
  }

  function fetchLikeCount(postId, videoId) {
    const url = postId ? `${BACKEND_URL}/api/likes/post/${postId}/count` : `${BACKEND_URL}/api/likes/video/${videoId}/count`;
    const id = postId ? `post-like-count-${postId}` : `video-like-count-${videoId}`;
    fetch(url)
      .then(res => res.json())
      .then(count => {
        document.getElementById("reelLikeCount").textContent = `${count} likes`;
        document.getElementById(id).textContent = `${count} likes`;
      });
  }

  function fetchCardLikeCount(postId, videoId) {
    const url = postId ? `${BACKEND_URL}/api/likes/post/${postId}/count` : `${BACKEND_URL}/api/likes/video/${videoId}/count`;
    const id = postId ? `post-like-count-${postId}` : `video-like-count-${videoId}`;
    fetch(url)
      .then(res => res.json())
      .then(count => {
        document.getElementById(id).textContent = `${count} likes`;
      });
  }

  function fetchCardCommentCount(postId, videoId) {
    const url = postId ? `${BACKEND_URL}/api/comments/post/${postId}/count` : `${BACKEND_URL}/api/comments/video/${videoId}/count`;
    const id = postId ? `post-comment-count-${postId}` : `video-comment-count-${videoId}`;
    fetch(url)
      .then(res => res.json())
      .then(count => {
        document.getElementById(id).textContent = `${count} comments`;
      });
  }

  function fetchCommentCount(postId, videoId) {
    const url = postId ? `${BACKEND_URL}/api/comments/post/${postId}/count` : `${BACKEND_URL}/api/comments/video/${videoId}/count`;
    const id = postId ? `post-comment-count-${postId}` : `video-comment-count-${videoId}`;
    fetch(url)
      .then(res => res.json())
      .then(count => {
        document.getElementById("reelCommentCount").textContent = `${count} comments`;
        document.getElementById(id).textContent = `${count} comments`;
      });
  }

  function fetchReelComments(mediaId, mediaType) {
  const token = localStorage.getItem("token");  

  fetch(`${BACKEND_URL}/api/comments/${mediaType}/${mediaId}`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  })
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
          if (!token) return;

          fetch(`${BACKEND_URL}/api/comments/${comment.id}/reply`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ content: replyText })
          })
            .then(() => fetchReelComments(mediaId, mediaType));
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

  function updateLikeCount(change) {
    const el = document.getElementById("reelLikeCount");
    const current = parseInt(el.textContent.split(" ")[0]) || 0;
    el.textContent = `${current + change} likes`;
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
    ? `${BACKEND_URL}${f.profilePictureUrl}`
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
        console.error("❌ Share failed:", err);
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
