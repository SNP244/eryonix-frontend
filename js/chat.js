

const token = localStorage.getItem("token");

if (!token) {
  alert("Please log in first.");
  window.location.href = "login.html";
}

const currentUser = getUsernameFromToken(token);
let selectedUser = null;
let replyParentId = null;
const shareModal = document.getElementById("shareModal");
const closeShareModal = document.getElementById("closeShareModal");
const cancelShareBtn = document.getElementById("cancelShare");
const sendShareBtn = document.getElementById("sendShare");
const followersList = document.getElementById("followersList");
const shareMessageInput = document.getElementById("shareMessage");

const chatList = document.getElementById("chatList");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const sendMessageBtn = document.getElementById("sendMessageBtn");
const chatUsername = document.getElementById("chatUsername");
const chatSearch = document.getElementById("chatSearch");
const recordControls = document.getElementById("recordingControls");
let mediaRecorder, audioChunks = [], wavesurfer;
let micPlugin = null;

let shareContext = { id: null, type: null, url: "" };


function getUsernameFromToken(token) {
  const payload = JSON.parse(atob(token.split(".")[1]));
  return payload.sub;
}

function fetchConversations() {
  fetch(`${BACKEND_URL}/api/follow/followers/${currentUser}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(renderChatList)
    .catch(err => console.error("Failed to fetch followers:", err));
}

function renderChatList(followers) {
  chatList.innerHTML = "";

  if (followers.length === 0) {
    chatList.innerHTML = "<p class='p-2 text-muted'>No followers to chat with.</p>";
    return;
  }

  followers.forEach(f => {
    const div = document.createElement("div");
    div.className = "chat-user";
    div.dataset.username = f.username;
    div.dataset.userid = f.id;

    const img = f.profilePictureUrl
      ? (f.profilePictureUrl.startsWith("http") ? f.profilePictureUrl : `${BACKEND_URL}${f.profilePictureUrl}`)
      : "assets/img/default-avatar.png";
    div.innerHTML = `
      <img src="${img}" alt="User">
      <div class="chat-user-info">
        <div class="name">@${f.username}</div>
        <div class="last-message">Click to chat</div>
      </div>
    `;

    div.addEventListener("click", () => {
      document.querySelectorAll(".chat-user").forEach(u => u.classList.remove("active"));
      div.classList.add("active");
      selectedUser = { username: f.username, id: f.id };
      chatUsername.innerText = `Chatting with @${selectedUser.username}`;
      loadMessages(selectedUser.id);
    });

    chatList.appendChild(div);
  });
}

function loadMessages(otherUserId) {
  fetch(`${BACKEND_URL}/api/messages/${otherUserId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(messages => {
      chatMessages.innerHTML = "";
      let lastDate = null;

      messages.forEach(msg => {
        const messageDate = new Date(msg.timestamp).toDateString();
        if (messageDate !== lastDate) {
          const dateLabel = document.createElement("div");
          dateLabel.className = "date-label";
          dateLabel.textContent = formatDateForLabel(msg.timestamp);
          chatMessages.appendChild(dateLabel);
          lastDate = messageDate;
        }

        const isSentByCurrentUser = msg.sender.username === currentUser;

        const wrapper = document.createElement("div");
        wrapper.classList.add("message-wrapper", isSentByCurrentUser ? "sent" : "received");

        const bubble = document.createElement("div");
        bubble.classList.add("chat-bubble", isSentByCurrentUser ? "sent" : "received");

        const content = document.createElement("div");






        if (msg.sharedMediaType === "post" || msg.sharedMediaType === "video") {
          //  Shared post or shared video → only open
          content.innerHTML = `
    <div class="shared-preview" style="cursor:pointer; color:#007bff; text-decoration:underline;">
      📎 Shared ${msg.sharedMediaType} — Click to open
    </div>
  `;
          content.querySelector(".shared-preview").addEventListener("click", () => {
            const mediaId = Number(msg.sharedMediaId || msg.sharedMediaUrl);
            loadReelModal(mediaId, msg.sharedMediaType);
          });

        } else if (msg.sharedMediaType) {
          // Uploaded files (gallery, camera, pdf, audio, etc.) → open + download
          const fullUrl = msg.content.startsWith("http") ? msg.content : `${BACKEND_URL}${msg.content}`;
          let label = "📎 Open File";
          if (msg.sharedMediaType === "image") label = "🖼️ Open Image";
          else if (msg.sharedMediaType === "video") label = "🎬 Open Video";
          else if (msg.sharedMediaType === "audio") label = "🎧 Play Audio";
          else if (msg.sharedMediaType === "pdf") label = "📄 Open PDF";

          content.innerHTML = `
    <div class="file-actions">
      <a class="open-link" href="${fullUrl}" target="_blank" rel="noopener noreferrer">${label}</a>
      <button class="download-btn" type="button" style="margin-left:8px;">⬇️ Download</button>
    </div>
  `;

          // Add download handler
          content.querySelector(".download-btn").addEventListener("click", async (e) => {
            e.preventDefault();
            try {
              // For Cloudinary URLs (external), don't send Authorization header
              // For backend URLs, include Authorization header
              const isCloudinaryUrl = fullUrl.includes("cloudinary.com");
              
              let blob;
              if (isCloudinaryUrl) {
                // Direct download for Cloudinary URLs without Authorization header
                const res = await fetch(fullUrl);
                if (!res.ok) throw new Error(`Download failed: ${res.status}`);
                blob = await res.blob();
              } else {
                // Backend URLs need Authorization
                const res = await fetch(fullUrl, { headers: { Authorization: `Bearer ${token}` } });
                if (!res.ok) throw new Error(`Download failed: ${res.status}`);
                blob = await res.blob();
              }
              
              // Create download link
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = fullUrl.split("/").pop() || "download";
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.URL.revokeObjectURL(url);
            } catch (err) {
              console.error("Download failed:", err);
              alert("Download failed: " + err.message);
            }
          });
        }
        else {
          const urlRegex = /(https?:\/\/[^\s]+)/g;
          const safeText = msg.content.replace(urlRegex, url => `<a href="${url}" target="_blank" style="color:#007bff; text-decoration:underline;">${url}</a>`);
          content.innerHTML = safeText;
        }

        const timestamp = document.createElement("div");
        timestamp.className = "timestamp";
        timestamp.textContent = new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        bubble.appendChild(content);
        bubble.appendChild(timestamp);
        wrapper.appendChild(bubble);
        chatMessages.appendChild(wrapper);
      });

      chatMessages.scrollTop = chatMessages.scrollHeight;
    })
    .catch(err => console.error("Error loading messages:", err));
}

function formatDateForLabel(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  else if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  else return date.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
}

function sendMessage(content, sharedMediaUrl = null, sharedMediaType = null) {
  if (!selectedUser) return;

  const messageData = {
    receiverId: selectedUser.id,
    content,
    sharedMediaUrl,
    sharedMediaType
  };

  fetch(`${BACKEND_URL}/api/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(messageData)
  })
    .then(res => res.ok && loadMessages(selectedUser.id))
    .catch(() => alert("Failed to send message."));
}

async function uploadMedia(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BACKEND_URL}/api/messages/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });
  if (!res.ok) throw new Error("Upload failed");
  return await res.json();
}

document.addEventListener("DOMContentLoaded", () => {
  fetchConversations();

  sendMessageBtn.addEventListener("click", () => {
    const text = chatInput.value.trim();
    if (!text || !selectedUser) return;
    sendMessage(text);
    chatInput.value = "";
  });

  chatSearch.addEventListener("input", () => {
    const query = chatSearch.value.toLowerCase();
    document.querySelectorAll(".chat-user").forEach(div => {
      const name = div.dataset.username.toLowerCase();
      div.style.display = name.includes(query) ? "flex" : "none";
    });
  });

  document.querySelector(".attachment-toggle").addEventListener("click", () => {
    document.querySelector(".attachment-options").classList.toggle("show");
  });

  document.querySelector(".attachment-options div:nth-child(1)").addEventListener("click", () => document.getElementById("galleryInput").click());
  document.querySelector(".attachment-options div:nth-child(2)").addEventListener("click", () => document.getElementById("cameraInput").click());
  document.querySelector(".attachment-options div:nth-child(3)").addEventListener("click", () => {
    // Close the attachment options
    document.querySelector(".attachment-options").classList.remove("show");

    if (!navigator.geolocation) {
      alert("Geolocation not supported by your browser.");
      return;
    }

    // Optional: Show temporary message or loading indicator here if needed

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const locationUrl = `🌍 Location: https://maps.google.com/?q=${coords.latitude},${coords.longitude}`;
        sendMessage(locationUrl);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          alert("Location access was denied. Please enable location services.");
        } else {
          alert("Failed to get location.");
        }
      },
      { timeout: 10000 }
    );
  });


  document.querySelector(".attachment-options div:nth-child(4)").addEventListener("click", () => recordControls.style.display = "flex");

  document.getElementById("galleryInput").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const result = await uploadMedia(file);
      sendMessage(result.mediaUrl, null, result.mediaType);

      //  Hide plus options after sending
      document.querySelector(".attachment-options").classList.remove("show");
    } catch {
      alert("Failed to upload gallery file");
    }
  });


  document.getElementById("cameraInput").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const result = await uploadMedia(file);
      sendMessage(result.mediaUrl, null, result.mediaType);

      //  Hide plus options after sending
      document.querySelector(".attachment-options").classList.remove("show");
    } catch { alert("Failed to upload camera image"); }
  });


  document.getElementById("audioInput").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const result = await uploadMedia(file);
      sendMessage(result.mediaUrl, null, result.mediaType);
      document.querySelector(".attachment-options").classList.remove("show");
    } catch { alert("Failed to upload audio"); }
  });



  // ---------- Recording UI helpers & toggle handler (replace your existing startVoiceBtn handler) ----------
  const micBtn = document.querySelector("#startVoiceBtn");
  const recordingStatus = document.getElementById("recordingStatus");
  let recordTimerInterval = null;
  let recordSeconds = 0;
  let autoStopTimer = null;

  function startRecordingUI() {
    micBtn.classList.add("mic-recording");
    recordControls.style.display = "flex";
    recordingStatus.style.display = "block";
    recordSeconds = 0;
    recordingStatus.textContent = `🎙 Recording... 0s`;
    recordTimerInterval = setInterval(() => {
      recordSeconds++;
      recordingStatus.textContent = `🎙 Recording... ${recordSeconds}s`;
    }, 1000);
  }

  function stopRecordingUI() {
    micBtn.classList.remove("mic-recording");
    if (recordTimerInterval) { clearInterval(recordTimerInterval); recordTimerInterval = null; }
    recordingStatus.textContent = "";
    recordingStatus.style.display = "none";
    recordControls.style.display = "none";
    if (autoStopTimer) { clearTimeout(autoStopTimer); autoStopTimer = null; }
  }

  micBtn.addEventListener("click", async () => {
    try {
      // If already recording, stop immediately (user toggle)
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        // immediate feedback (onstop will finalize uploading UI)
        stopRecordingUI();
        return;
      }

      // Request mic permission & get stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Prepare MediaRecorder
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      // Clean up any previous wavesurfer / plugin
      if (micPlugin) {
        try { micPlugin.stop(); } catch (_) { }
        micPlugin = null;
      }
      if (wavesurfer) {
        try { wavesurfer.destroy(); } catch (_) { }
        wavesurfer = null;
      }

      // Create WaveSurfer + microphone plugin (v6 style)
      wavesurfer = WaveSurfer.create({
        container: "#waveform",
        waveColor: "lightgray",
        progressColor: "#4CAF50",
        height: 40,
        interact: false,
        plugins: [
          WaveSurfer.microphone.create()
        ]
      });

      micPlugin = wavesurfer.microphone;

      micPlugin.on("deviceReady", function (stream) {
        console.log("Device ready!", stream);
      });
      micPlugin.on("deviceError", function (code) {
        console.warn("Device error: " + code);
      });

      // Start the visualizer plugin
      micPlugin.start();

      // MediaRecorder handlers
      mediaRecorder.ondataavailable = (event) => audioChunks.push(event.data);

      mediaRecorder.onstart = () => {
        // show recording UI + timer
        startRecordingUI();
      };

      mediaRecorder.onstop = async () => {
        // stop visual UI immediately
        stopRecordingUI();

        // show uploading text while file is uploaded
        recordingStatus.style.display = "block";
        recordingStatus.textContent = "Uploading...";

        const blob = new Blob(audioChunks, { type: "audio/webm" });
        const file = new File([blob], "voice_message.webm", { type: "audio/webm" });

        try {
          const result = await uploadMedia(file); // uses your uploadMedia()
          sendMessage(result.mediaUrl, null, result.mediaType);
          document.querySelector(".attachment-options").classList.remove("show");
        } catch (err) {
          alert("Failed to upload audio");
          console.error("Upload error:", err);
        }

        // cleanup the plugin + wavesurfer
        try { micPlugin && micPlugin.stop(); } catch (_) { }
        micPlugin = null;
        try { wavesurfer && wavesurfer.destroy(); } catch (_) { }
        wavesurfer = null;

        // show 'Sent' briefly
        recordingStatus.textContent = "Sent";
        setTimeout(() => {
          recordingStatus.style.display = "none";
          recordingStatus.textContent = "";
        }, 1200);
      };

      // Start recording
      mediaRecorder.start();

      // Optional auto-stop after 100s (adjust if needed)
      autoStopTimer = setTimeout(() => {
        if (mediaRecorder && mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      }, 100000);

    } catch (err) {
      console.error("Microphone error:", err);
      alert("Microphone error: " + (err.message || err));
      stopRecordingUI();
    }
  });
  // ---------- end replacement ----------














});
function buildShareUrl(type, id) {

  return `${BACKEND_URL}/api/share/${type}/${id}`;
}


sendShareBtn.addEventListener("click", async () => {
  const checked = Array.from(document.querySelectorAll(".share-recipient:checked"));
  if (checked.length === 0) {
    alert("Select at least one follower to send.");
    return;
  }

  if (!shareContext.id || !shareContext.type) {
    alert("Nothing to share. Open a post/video and try again.");
    return;
  }

  // Optional note the user typed
  const extraNote = (shareMessageInput.value || "").trim();

  // Disable button while sending
  sendShareBtn.disabled = true;
  sendShareBtn.textContent = "Sending...";

  try {
    // First: send the shared media “card”
    const sharePayloads = checked.map(cb => {
      const receiverId = cb.getAttribute("data-id");
      return fetch(`${BACKEND_URL}/api/messages/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          receiverId,
          content: "",
          sharedMediaUrl: String(shareContext.id),
          sharedMediaType: shareContext.type
        })
      });
    });

    const shareResults = await Promise.all(sharePayloads);
    const allOk = shareResults.every(r => r.ok);
    if (!allOk) throw new Error("One or more share requests failed");

    // Second (optional): send the text note as a separate message
    if (extraNote) {
      const notePayloads = checked.map(cb => {
        const receiverId = cb.getAttribute("data-id");
        return fetch(`${BACKEND_URL}/api/messages/send`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            receiverId,
            content: extraNote,
            sharedMediaUrl: null,
            sharedMediaType: null
          })
        });
      });
      const noteResults = await Promise.all(notePayloads);
      const allNotesOk = noteResults.every(r => r.ok);
      if (!allNotesOk) {
        console.warn("Some note messages failed to send");
      }
    }

    alert("Shared successfully!");
    shareModal.classList.add("hidden");
  } catch (err) {
    console.error("Share failed:", err);
    alert("Failed to share.");
  } finally {
    sendShareBtn.disabled = false;
    sendShareBtn.textContent = "Send";
  }
});


function loadReelModal(mediaId, mediaType) {
  console.log("Opening shared media modal:", mediaType, mediaId);

  const reelView = document.getElementById("reelView");
  const container = document.getElementById("reelMediaContainer");
  const commentsContainer = document.getElementById("reelCommentsList");
  const captionEl = document.getElementById("reelCaption");
  const userEl = document.getElementById("reelUser");
  const likeCountEl = document.getElementById("reelLikeCount");
  const commentInput = document.getElementById("reelCommentInput");
  const commentSubmit = document.getElementById("reelCommentSubmit");

  reelView.classList.remove("reel-hidden");
  reelView.style.display = "flex";


  //  Reset comment state when opening a new reel
  replyParentId = null;
  document.getElementById("reelCommentsList").innerHTML = "";
  document.getElementById("reelCommentInput").value = "";

  // Ensure comments section is hidden by default
  const reelCommentsContainer = document.getElementById("reelCommentsContainer");
  if (reelCommentsContainer) reelCommentsContainer.classList.add("hidden");

  // Ensure actions bar is visible again
  const reelActions = document.getElementById("reelActions");
  if (reelActions) reelActions.style.display = "flex";


  fetch(`${BACKEND_URL}/api/share/${mediaType}/${mediaId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(media => {
      // Clear old content
      container.innerHTML = "";
      commentsContainer.innerHTML = "";

      // --- Media element ---
      let mediaEl;
      if (mediaType === "post") {
        mediaEl = document.createElement("img");
        const imageUrl = (media.mediaUrl || "").startsWith("http") ? media.mediaUrl : `${BACKEND_URL}${media.mediaUrl || ""}`;
        mediaEl.src = imageUrl;
      } else if (mediaType === "video") {
        mediaEl = document.createElement("video");
        const videoUrl = (media.mediaUrl || "").startsWith("http") ? media.mediaUrl : `${BACKEND_URL}${media.mediaUrl || ""}`;
        mediaEl.src = videoUrl;
        mediaEl.controls = true;
      }

      mediaEl.className = "reel-media";
      container.appendChild(mediaEl);

      // --- Caption & username ---
      captionEl.textContent = media.caption || "";
      userEl.textContent = `@${media.username || "Unknown"}`;

      // --- Likes & comments count ---
      likeCountEl.textContent = `${media.likesCount || 0} likes`;
      document.getElementById("reelCommentCount").textContent = `${media.commentsCount || 0} comments`;

      if (reelCommentBtn) {
        reelCommentBtn.onclick = () => {
          const isHidden = reelCommentsContainer.classList.toggle("hidden");
          // if comments are now visible (hidden===false) hide the action icons, otherwise show them
          document.getElementById("reelActions").style.display = isHidden ? "flex" : "none";
        };
      }




      // --- Set context for Share modal (so we know what we’re sharing)
      shareContext.id = mediaId;
      shareContext.type = mediaType;

      // Build a front-end/public URL for external share 
      shareContext.url = buildShareUrl(mediaType, mediaId);

      // --- Share button (paper-plane icon) opens Share modal
      const reelShareBtn = document.getElementById("reelShareBtn");
      if (reelShareBtn) {
        reelShareBtn.onclick = () => {
          openShareModal({
            url: shareContext.url,
            caption: media.caption || "",
          });
        };
      }



      // --- Render comments (full with replies & reply UI) ---
      const commentsListEl = commentsContainer;
      commentsListEl.innerHTML = "";
      (media.comments || []).forEach(c => renderCommentWithReplies(c, commentsListEl));

      // --- Like button ---
      // --- Like button (profile-like behavior) ---
      const likeBtn = document.getElementById("reelLikeBtn");

      // Build URLs
      const likeStatusUrl = mediaType === "post"
        ? `${BACKEND_URL}/api/likes/post/${mediaId}/liked`
        : `${BACKEND_URL}/api/likes/video/${mediaId}/liked`;

      const likeToggleUrl = mediaType === "post"
        ? `${BACKEND_URL}/api/likes/post/${mediaId}`
        : `${BACKEND_URL}/api/likes/video/${mediaId}`;

      // Initialize button state (is liked?)
      fetch(likeStatusUrl, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(isLiked => {
          if (likeBtn) likeBtn.textContent = isLiked ? "❤️" : "🤍";
        })
        .catch(err => console.error("Failed to fetch like status", err));

      // Initialize like count
      fetchLikeCount(mediaType, mediaId);

      // Toggle handler
      likeBtn.onclick = async () => {
        try {
          // get current status
          const statusRes = await fetch(likeStatusUrl, { headers: { Authorization: `Bearer ${token}` } });
          const isLiked = await statusRes.json();

          const method = isLiked ? "DELETE" : "POST";
          const toggleRes = await fetch(likeToggleUrl, { method, headers: { Authorization: `Bearer ${token}` } });

          if (!toggleRes.ok) throw new Error("Toggle failed");

          // refresh status + count
          const newStatusRes = await fetch(likeStatusUrl, { headers: { Authorization: `Bearer ${token}` } });
          const nowLiked = await newStatusRes.json();

          if (likeBtn) likeBtn.textContent = nowLiked ? "❤️" : "🤍";
          fetchLikeCount(mediaType, mediaId);

          if (nowLiked) {
            triggerHeartBlast();
            triggerConfettiRain();
          }
        } catch (err) {
          console.error("Error toggling like:", err);
          alert("Error toggling like. See console.");
        }
      };



      // --- Comment submit ---
      commentSubmit.onclick = async () => {
        const text = commentInput.value.trim();
        if (!text) return;

        // Decide the API endpoint depending on whether it's a reply
        let url = replyParentId
          ? `${BACKEND_URL}/api/comments/${replyParentId}/reply`
          : `${BACKEND_URL}/api/comments`;

        try {
          const res = await fetch(url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(
              replyParentId
                ? { content: text } // for replies
                : {
                  mediaId: mediaId,
                  mediaType: mediaType.toUpperCase(),
                  content: text
                }
            )

          });

          if (res.ok) {
            commentInput.value = "";
            replyParentId = null; // reset reply state
            reloadComments(mediaType, mediaId);
          } else {
            console.warn("Comment failed", res.status);
            alert("Failed to post comment.");
          }
        } catch (err) {
          console.error("Failed to post comment:", err);
          alert("Error posting comment.");
        }
      };


    })
    .catch(err => {
      console.error("Failed to load shared media:", err);
      alert(" Failed to load shared media");
    });
}

// Helper: render a single comment + load its replies and attach reply handlers
function renderCommentWithReplies(comment, commentsList) {
  const commentDiv = document.createElement("div");
  commentDiv.classList.add("reel-comment-item");

  commentDiv.innerHTML = `
  <p><strong>@${comment.username}</strong>: ${comment.content}</p>
  <a href="#" class="reply-link text-primary small ms-2" data-id="${comment.id}">Reply</a>
  <div class="reply-input-container hidden" id="reply-input-${comment.id}">
    <input type="text" class="form-control mb-1 reply-input" placeholder="Write a reply...">
    <button class="btn btn-sm btn-primary reply-submit" data-id="${comment.id}">Post</button>
  </div>
  <div class="replies" id="replies-${comment.id}"></div>
`;


  commentsList.appendChild(commentDiv);

  // load replies for this comment
  fetch(`${BACKEND_URL}/api/comments/replies/${comment.id}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(replies => {
      const repliesContainer = commentDiv.querySelector(`#replies-${comment.id}`);
      (replies || []).forEach(r => {
        const replyP = document.createElement("p");
        replyP.classList.add("ms-3", "text-secondary");
        replyP.innerHTML = `<strong>@${r.username}</strong>: ${r.content}`;
        repliesContainer.appendChild(replyP);
      });
    })
    .catch(err => console.warn("Failed to load replies:", err));

  // reply toggle
  const replyLink = commentDiv.querySelector(".reply-link");
  const replyBox = commentDiv.querySelector(`#reply-input-${comment.id}`);
  replyLink.addEventListener("click", (e) => {
    e.preventDefault(); //  prevent page reload
    replyBox.classList.toggle("hidden");
  });


  // reply submit
  const replySubmit = commentDiv.querySelector(".reply-submit");
  const replyInput = commentDiv.querySelector(".reply-input");
  replySubmit.addEventListener("click", async () => {
    const replyText = replyInput.value.trim();
    if (!replyText) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/comments/${comment.id}/reply`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ content: replyText })
      });
      const newReply = await res.json();
      const replyP = document.createElement("p");
      replyP.classList.add("ms-3", "text-secondary");
      replyP.innerHTML = `<strong>@${newReply.username}</strong>: ${newReply.content}`;
      commentDiv.querySelector(`#replies-${comment.id}`).appendChild(replyP);
      replyInput.value = "";
      replyBox.classList.add("hidden");
    } catch (err) {
      console.error("Failed to post reply:", err);
      alert("Failed to post reply.");
    }
  });
}


async function reloadComments(mediaType, mediaId) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/share/${mediaType}/${mediaId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const media = await res.json();

    const container = document.getElementById("reelCommentsList");
    container.innerHTML = "";

    (media.comments || []).forEach(c => {
      renderCommentWithReplies(c, container);
    });

    // update count
    const countEl = document.getElementById("reelCommentCount");
    if (countEl) countEl.textContent = (media.comments || []).length + " comments";
  } catch (err) {
    console.error("Failed to reload comments:", err);
  }
}






// ---------- Like count helper ----------
function fetchLikeCount(mediaType, mediaId) {
  const likeCountEl = document.getElementById("reelLikeCount");
  const url = mediaType === "post"
    ? `${BACKEND_URL}/api/likes/post/${mediaId}/count`
    : `${BACKEND_URL}/api/likes/video/${mediaId}/count`;

  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then(res => res.json())
    .then(count => {
      if (likeCountEl) likeCountEl.textContent = `${count} likes`;
    })
    .catch(err => console.error("Failed to fetch like count", err));
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

function openShareModal({ url, caption }) {
  // Clear message each time
  shareMessageInput.value = "";

  // Load followers list into checkboxes
  loadFollowersForShare();

  // Update external share targets
  updateExternalShareLinks(url, caption);

  shareModal.classList.remove("hidden");
}

function loadFollowersForShare() {
  followersList.innerHTML = "<p>Loading followers...</p>";

  // Reuse the same endpoint you already use for chat list:
  fetch(`${BACKEND_URL}/api/follow/followers/${currentUser}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(users => {
      if (!Array.isArray(users) || users.length === 0) {
        followersList.innerHTML = "<p>No followers found.</p>";
        return;
      }

      followersList.innerHTML = "";
      users.forEach(u => {
        const row = document.createElement("label");
        row.classList.add("follower-item");
        row.style.display = "flex";
        row.style.alignItems = "center";
        row.style.gap = "10px";
        row.style.margin = "6px 0";

        // ✅ Profile image with fallback
        const img = u.profilePictureUrl
          ? (u.profilePictureUrl.startsWith("http") ? u.profilePictureUrl : `${BACKEND_URL}${u.profilePictureUrl}`)
          : "assets/img/default-avatar.png";

        row.innerHTML = `
    
    <img src="${img}" alt="profile" class="follower-avatar" 
         style="width:35px; height:35px; border-radius:50%; object-fit:cover;">
    <span class="follower-name"> @${u.username}</span>
  `;

        followersList.appendChild(row);
      });

    })
    .catch(err => {
      console.error("Failed to load followers for share:", err);
      followersList.innerHTML = "<p>Error loading followers.</p>";
    });
}

function updateExternalShareLinks(shareUrl, caption) {
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(caption || "");

  // Copy link
  const copyBtn = document.getElementById("copyLinkBtn");
  if (copyBtn) {
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert("Link copied!");
      } catch (e) {
        console.error("Copy failed:", e);
        alert("Failed to copy link");
      }
    };
  }

  // WhatsApp
  const wa = document.getElementById("whatsappShare");
  if (wa) wa.href = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;

  // X/Twitter
  const tw = document.getElementById("twitterShare");
  if (tw) tw.href = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;

  // Facebook
  const fb = document.getElementById("facebookShare");
  if (fb) fb.href = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

  // LinkedIn
  const li = document.getElementById("linkedinShare");
  if (li) li.href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
}
closeShareModal.addEventListener("click", () => {
  shareModal.classList.add("hidden");
});
cancelShareBtn.addEventListener("click", () => {
  shareModal.classList.add("hidden");
});



// Close modal
document.getElementById("reelCloseBtn").addEventListener("click", () => {
  document.getElementById("reelView").style.display = "none";
});          