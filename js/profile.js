const BACKEND_URL = "http://localhost:8080";


const token = localStorage.getItem("token");

function getUsernameFromToken(token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload.sub; // adjust if your token stores username in another key
}

const username = getUsernameFromToken(token);
if (!token || !username) {
  alert("Unauthorized or missing username.");
  window.location.href = "login.html";
}





let currentPostId = null;
let currentVideoId = null;
// =================== DOM Loaded ===================
document.addEventListener("DOMContentLoaded", function () {
  fetchProfile(token);
  setupTabSwitching();
  showTab("posts");
        

  

   //  ADD at end of media click event

   
const shareBtn = document.getElementById("reelShareBtn");
shareBtn.onclick = () => {
  const mediaId = currentPostId || currentVideoId;
  const type = currentPostId ? "post" : "video";
  currentShareUrl = `http://localhost:5500/public-share.html?id=${mediaId}&type=${type}`;
  openShareModal(currentShareUrl, type, mediaId);
};

  document.getElementById("reelCloseBtn").addEventListener("click", () => {
    document.getElementById("reelView").classList.add("reel-hidden");
  });



  


});

// =================== Profile ===================
function fetchProfile(token) {
  fetch(`${BACKEND_URL}/api/users/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.json())
    .then((user) => {
      displayUserProfile(user);
      fetchAndRenderPosts(token);
      fetchAndRenderVideos(token);
      loadFollowCounts(user.username, token);
    })
    .catch((err) => {
      console.error("Error fetching profile:", err);
      localStorage.removeItem("token");
      window.location.href = "login.html";
    });
}

function displayUserProfile(user) {
  document.getElementById("user-name").innerText = user.fullname || user.username;
  document.getElementById("user-bio").innerText = user.bio || "No bio provided";
  document.getElementById("user-username").innerText = user.username;
  document.getElementById("user-email").innerText = user.email || "";
  document.getElementById("user-role").innerText = user.role || "";
  document.getElementById("user-portfolio").href = user.portfolioLink || "#";
  document.getElementById("user-portfolio").innerText = user.portfolioLink ? "View Portfolio" : "Not Provided";

  if (user.profilePictureUrl) {
    document.getElementById("profile-picture").src = `${BACKEND_URL}${user.profilePictureUrl}`;
  }

  const skillsContainer = document.getElementById("user-skills");
  skillsContainer.innerHTML = "";
  if (user.skills?.length > 0) {
    user.skills.forEach((skill) => {
      const span = document.createElement("span");
      span.className = "badge bg-secondary me-1";
      span.innerText = skill;
      skillsContainer.appendChild(span);
    });
  } else {
    skillsContainer.innerHTML = "<span class='text-muted'>No skills listed</span>";
  }
  const followerLink = document.getElementById("follower-link");
  const followingLink = document.getElementById("following-link");

  if (followerLink) {
    followerLink.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("🔥 Followers clicked");
      openFollowModal("followers");
    });
  }

  if (followingLink) {
    followingLink.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("🔥 Following clicked");
      openFollowModal("following");
    });
  }
}

function loadFollowCounts(username, token) {
  fetch(`${BACKEND_URL}/api/follow/followers/${username}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.json())
    .then((followers) => {
      document.getElementById("follower-count").innerText = followers.length;
    });

  fetch(`${BACKEND_URL}/api/follow/following/${username}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.json())
    .then((following) => {
      document.getElementById("following-count").innerText = following.length;
    });
}

// =================== Posts ===================
function fetchAndRenderPosts(token) {
  fetch(`${BACKEND_URL}/api/media/my-posts`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.json())
    .then((posts) => {
      const postsContainer = document.getElementById("user-posts");
      postsContainer.innerHTML = "";
      posts.forEach((post) => {
        const postElement = renderPost(post);
        postElement.addEventListener("click", () => openReelModal(post, "post"));
        postsContainer.appendChild(postElement);
      });
    });
}

function renderPost(post) {
  const div = document.createElement("div");
  div.classList.add("post-item");
  div.innerHTML = `
    <img src="${BACKEND_URL}${post.imageUrl}" alt="Post Image" class="post-image">
    <p class="post-caption mt-2">${post.caption || ''}</p>
  `;
  return div;
}

// =================== Videos ===================
function fetchAndRenderVideos(token) {
  fetch(`${BACKEND_URL}/api/media/my-videos`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.json())
    .then((videos) => {
      const container = document.getElementById("user-videos");
      container.innerHTML = "";
      videos.forEach((video) => {
        const videoElement = renderVideo(video);
        videoElement.addEventListener("click", () => openReelModal(video, "video"));
        container.appendChild(videoElement);
      });
    });
}

function renderVideo(video) {
  const div = document.createElement("div");
  div.classList.add("video-item");
  div.innerHTML = `
    <video controls class="video-player mb-2" style="width: 100%; max-width: 480px;">
      <source src="${BACKEND_URL}${video.videoUrl}" type="video/mp4">
      Your browser does not support the video tag.
    </video>
    <p>${video.caption || ''}</p>
  `;
  return div;
}

function getUsernameFromToken(token) {
  const payload = JSON.parse(atob(token.split(".")[1]));
  return payload.sub;
}

function setupTabSwitching() {
  document.querySelectorAll(".tab-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const tab = this.dataset.tab;

      if (tab === "chat") {
        window.location.href = "chat.html";
        return;
      }

      showTab(tab);
    });
  });
}



function showTab(tab) {
  document.querySelectorAll(".tab-content").forEach((content) => content.classList.add("hidden"));
  document.getElementById(tab).classList.remove("hidden");

  document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"));
  document.querySelector(`[data-tab="${tab}"]`).classList.add("active");
  

  
}




function openFollowModal(type) {
  const token = localStorage.getItem("token");
  if (!token) return alert("Please login first");

  const username = getUsernameFromToken(token);
  if (!username) {
    alert("User not found. Please login again.");
    window.location.href = "login.html";
    return;
  }

  const modalEl = document.getElementById("followModal");
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

  const modalLabel = document.getElementById("followModalLabel");
  const modalBody = document.getElementById("followModalBody");

  modalLabel.innerText = type === "followers" ? "Followers" : "Following";
  modalBody.innerHTML = "<p>Loading...</p>";

  fetch(`${BACKEND_URL}/api/follow/${type}/${username}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(users => {
      modalBody.innerHTML = "";
      if (!users.length) {
        modalBody.innerHTML = "<p class='text-muted'>No users found.</p>";
        return;
      }

      users.forEach(user => {
        const userDiv = document.createElement("div");
        userDiv.className = "d-flex align-items-center justify-content-between p-2 mb-2 rounded user-list-item";

        // Check if current user already follows this user
        fetch(`${BACKEND_URL}/api/follow/check/${user.username}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(isFollowing => {
            userDiv.innerHTML = `
              <div class="d-flex align-items-center gap-2">
                <img src="${user.profilePictureUrl ? BACKEND_URL + user.profilePictureUrl : 'assets/images/default-user.jpg'}" 
                     class="rounded-circle" 
                     style="width: 40px; height: 40px; object-fit: cover;">
                <div>@${user.username}</div>
              </div>
              ${user.username !== username ? 
                `<button class="btn btn-sm ${isFollowing ? 'btn-outline-danger unfollow-btn' : 'btn-outline-primary follow-action-btn'}" 
                        data-username="${user.username}">
                  ${isFollowing ? 'Unfollow' : 'Follow'}
                 </button>` : ""}
            `;

            modalBody.appendChild(userDiv);

            // Setup follow/unfollow click
            const btn = userDiv.querySelector("button");
            if (btn) {
              btn.addEventListener("click", () => {
                const targetUsername = btn.dataset.username;
                const method = isFollowing ? "DELETE" : "POST";
                fetch(`${BACKEND_URL}/api/follow/${targetUsername}`, {
                  method,
                  headers: { Authorization: `Bearer ${token}` }
                })
                  .then(res => {
                    if (!res.ok) throw new Error("Action failed");
                    btn.innerText = isFollowing ? "Follow" : "Unfollow";
                    btn.classList.toggle("btn-outline-primary");
                    btn.classList.toggle("btn-outline-danger");
                    isFollowing = !isFollowing; // update state
                    // Optionally update counts live
                    loadFollowCounts(username, token);
                  })
                  .catch(err => console.error(err));
              });
            }
          })
          .catch(err => console.error("Error checking follow status:", err));
      });
    })
    .catch(err => {
      console.error("Error loading follow list:", err);
      modalBody.innerHTML = "<p class='text-danger'>Failed to load users.</p>";
    });

  modal.show();
}
      

 



// =================== Modal Reel View (from public-profile) ===================

    function openReelModal(media, type) {
  const reelView = document.getElementById("reelView");
  const mediaContainer = document.getElementById("reelMediaContainer");
  const captionEl = document.getElementById("reelCaption");
  const userEl = document.getElementById("reelUser");
  const likeBtn = document.getElementById("reelLikeBtn");
  const likeCount = document.getElementById("reelLikeCount");
  const commentCount = document.getElementById("reelCommentCount");
  const commentBtn = document.getElementById("reelCommentBtn");
  const commentsContainer = document.getElementById("reelCommentsContainer");
  const commentsList = document.getElementById("reelCommentsList");
  const commentInput = document.getElementById("reelCommentInput");
  const commentSubmit = document.getElementById("reelCommentSubmit");

  // Reset modal
  mediaContainer.innerHTML = "";
  commentsList.innerHTML = "";
  commentInput.value = "";
  commentsContainer.classList.add("hidden");

  //  Reset icons and counts
likeBtn.textContent = "🤍";
commentBtn.textContent = "💬";
likeCount.textContent = "0";
commentCount.textContent = "0 comments";
document.getElementById("reelActions").style.display = "flex";

  if (type === "post") {
  currentPostId = media.id;
  currentVideoId = null;
} else {
  currentVideoId = media.id;
  currentPostId = null;
}


  // Show media
  if (type === "post") {
    const img = document.createElement("img");
    img.src = BACKEND_URL + media.imageUrl;
    img.className = "img-fluid";
    mediaContainer.appendChild(img);
  } else {
    const video = document.createElement("video");
    video.src = BACKEND_URL + media.videoUrl;
    video.controls = true;
    video.className = "w-100";
    mediaContainer.appendChild(video);
  }

  captionEl.textContent = media.caption || "";
  userEl.textContent = "@" + media.username;

  // ===================== Like Setup =====================
  const isPost = type === "post";

  const likeStatusUrl = isPost
    ? `${BACKEND_URL}/api/likes/post/${media.id}/liked`
    : `${BACKEND_URL}/api/likes/video/${media.id}/liked`;

  const likeToggleUrl = isPost
    ? `${BACKEND_URL}/api/likes/post/${media.id}`
    : `${BACKEND_URL}/api/likes/video/${media.id}`;

  // Fetch initial like status
  fetch(likeStatusUrl, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(isLiked => {
      likeBtn.textContent = isLiked ? "❤️" : "🤍";
    })
    .catch(err => console.error("❌ Failed to fetch like status", err));

  // Fetch initial like count
  const postId = isPost ? media.id : null;
  const videoId = !isPost ? media.id : null;
  fetchLikeCount(postId, videoId);

  // Handle like/unlike toggle
  likeBtn.onclick = () => {
  fetch(likeStatusUrl, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(isLiked => {
      const method = isLiked ? "DELETE" : "POST";

      fetch(likeToggleUrl, {
        method,
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(() => {
          return fetch(likeStatusUrl, {
            headers: { Authorization: `Bearer ${token}` }
          });
        })
        .then(res => res.json())
        .then(updatedLiked => {
          likeBtn.textContent = updatedLiked ? "❤️" : "🤍";
          fetchLikeCount(postId, videoId);
          if (updatedLiked) {
            triggerHeartBlast();
            triggerConfettiRain();
          }
        })
        .catch(err => console.error("❌ Failed to toggle like", err));
    });
};


  // ===================== Comment Setup =====================
  fetch(`${BACKEND_URL}/api/comments/${type}/${media.id}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(comments => {
      commentCount.textContent = `${comments.length} comments`;
      commentsList.innerHTML = "";
      comments.forEach(c => {
  const commentDiv = document.createElement("div");
  commentDiv.classList.add("reel-comment-item");

  commentDiv.innerHTML = `
    <p><strong>@${c.username}</strong>: ${c.content}</p>
    <button class="btn btn-sm btn-link reply-btn" data-id="${c.id}">Reply</button>
    <div class="reply-input-container hidden" id="reply-input-${c.id}">
      <input type="text" class="form-control mb-1 reply-input" placeholder="Write a reply...">
      <button class="btn btn-sm btn-primary reply-submit" data-id="${c.id}">Post</button>
    </div>
    <div class="replies" id="replies-${c.id}"></div>
  `;
  commentsList.appendChild(commentDiv);

  // Load replies for this comment
  fetch(`${BACKEND_URL}/api/comments/replies/${c.id}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(replies => {
      const repliesContainer = commentDiv.querySelector(`#replies-${c.id}`);
      replies.forEach(reply => {
        const replyP = document.createElement("p");
        replyP.classList.add("ms-3", "text-secondary");
        replyP.innerHTML = `<strong>@${reply.username}</strong>: ${reply.content}`;
        repliesContainer.appendChild(replyP);
      });
    });

  // Reply button toggle
  const replyBtn = commentDiv.querySelector(".reply-btn");
  const replyBox = commentDiv.querySelector(`#reply-input-${c.id}`);
  replyBtn.addEventListener("click", () => {
    replyBox.classList.toggle("hidden");
  });

  // Reply submission
  const replySubmit = commentDiv.querySelector(".reply-submit");
  const replyInput = commentDiv.querySelector(".reply-input");
  replySubmit.addEventListener("click", () => {
    const replyText = replyInput.value.trim();
    if (!replyText) return;

    fetch(`${BACKEND_URL}/api/comments/${c.id}/reply`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ content: replyText })
    })
      .then(res => res.json())
      .then(newReply => {
        const replyP = document.createElement("p");
        replyP.classList.add("ms-3", "text-secondary");
        replyP.innerHTML = `<strong>@${newReply.username}</strong>: ${newReply.content}`;
        commentDiv.querySelector(`#replies-${c.id}`).appendChild(replyP);
        replyInput.value = "";
        replyBox.classList.add("hidden");
      });
  });
});

    })
    .catch(err => console.error("❌ Failed to load comments", err));

  commentSubmit.onclick = () => {
    const text = commentInput.value.trim();
    if (!text) return;
fetch(`${BACKEND_URL}/api/comments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
    mediaId: media.id,
    mediaType: type.toUpperCase(), // "POST" or "VIDEO"
    content: text
  })
    })
      .then(res => res.json())
      .then(newComment => {
        const p = document.createElement("p");
        p.innerHTML = `<strong>@${newComment.username}</strong>: ${newComment.content}`;
        commentsList.appendChild(p);
        commentInput.value = "";

        // Update comment count
        fetch(`${BACKEND_URL}/api/comments/${type}/${media.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(comments => {
            commentCount.textContent = `${comments.length} comments`;
          });
      })
      .catch(err => console.error("❌ Failed to submit comment", err));
  };

  // ===================== Show Modal =====================

  // Toggle comment section on  icon click
commentBtn?.addEventListener("click", () => {
  const isHidden = commentsContainer.classList.toggle("hidden");
  document.getElementById("reelActions").style.display = isHidden ? "flex" : "none";
});


  // SHARE BUTTON LOGIC 
  const shareBtn = document.getElementById("reelShareBtn");
  if (shareBtn) {
    shareBtn.onclick = () => {
      const mediaId = currentPostId || currentVideoId;
      const mediaType = currentPostId ? "post" : "video";
      const currentShareUrl = `http://localhost:5500/public-share.html?id=${mediaId}&type=${mediaType}`;
      openShareModal(currentShareUrl, mediaType, mediaId);
    };
  } 

  
  reelView.classList.remove("reel-hidden");


      
      

        
        


}

// Close modal
document.getElementById("reelCloseBtn").addEventListener("click", () => {
  document.getElementById("reelView").classList.add("reel-hidden");
});

// =================== Like Count ===================
function fetchLikeCount(postId, videoId) {
  const url = postId !== null
    ? `${BACKEND_URL}/api/likes/post/${postId}/count`
    : `${BACKEND_URL}/api/likes/video/${videoId}/count`;

  fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(count => {
      const likeCount = document.getElementById("reelLikeCount");
      if (likeCount) {
        likeCount.textContent = `${count} likes`;
      }
    })
    .catch(err => console.error("❌ Failed to fetch like count", err));
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

//Share SetUp
function openShareModal(shareUrl, mediaType, mediaId) {
  const token = localStorage.getItem("token");
  const username = getUsernameFromToken(token);


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



