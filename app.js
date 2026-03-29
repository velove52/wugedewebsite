// =========================
// 1. 全局状态
// =========================
const songs = [];
let currentSongIndex = -1;
let currentVolume = 0.7;
let previousVolume = currentVolume;
let isDraggingProgress = false;
let isDraggingVolume = false;
let volumePopoverFrame = null;
let activeReplyMessageId = null;
let playerBarHideTimer = null;
let isPointerNearBottom = false;
let isPointerOverPlayerBar = false;
let currentMessageAuthor = localStorage.getItem("messageWallAuthor") || "匿名用户";
let pendingMessageImage = null;
let isMessageSubmitting = false;

const stickyPaletteClasses = ["note-1", "note-2", "note-3", "note-4"];
const messageWallData = [];
const API_BASE_URL = window.location.protocol === "file:" ? "http://127.0.0.1:3000" : "";

// =========================
// 2. 获取页面元素
// =========================
const audioEl = document.getElementById("audioPlayer");
const songListEl = document.getElementById("songList");
const songCountEl = document.getElementById("songCount");
const playerTitleEl = document.getElementById("playerTitle");
const playerTitleMarqueeEl = document.getElementById("playerTitleMarquee");
const playerTitleTextEl = document.getElementById("playerTitleText");
const playerTitleTextGhostEl = document.getElementById("playerTitleTextGhost");
const playerArtistEl = document.getElementById("playerArtist");
const totalTimeEl = document.getElementById("totalTime");
const currentTimeEl = document.getElementById("currentTime");
const playerBarEl = document.getElementById("playerBar");
const progressBarEl = document.getElementById("progressBar");
const progressInnerEl = document.getElementById("progressInner");
const progressThumbEl = document.getElementById("progressThumb");
const playPauseBtn = document.getElementById("playPauseBtn");
const playAllBtn = document.getElementById("playAllBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const titleEl = document.getElementById("title");
const volumeControlEl = document.querySelector(".volume-control");
const volumeBtn = document.getElementById("volumeBtn");
const volumeBarEl = document.getElementById("volumeBar");
const volumeInnerEl = document.getElementById("volumeInner");
const volumeThumbEl = document.getElementById("volumeThumb");
const messageFormEl = document.getElementById("messageForm");
const messageUserEntryEl = document.getElementById("messageUserEntry");
const messageUserNameEl = document.getElementById("messageUserName");
const messageInputEl = document.getElementById("messageInput");
const messageImageInputEl = document.getElementById("messageImageInput");
const messageImageTipEl = document.getElementById("messageImageTip");
const messageImagePreviewEl = document.getElementById("messageImagePreview");
const messageListEl = document.getElementById("messageList");

function getPlayIconSvg() {
  return `
    <svg class="control-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 6.5v11l9-5.5-9-5.5z" fill="currentColor"></path>
    </svg>
  `;
}

function getSongListPlayIconSvg() {
  return `
    <svg class="song-play-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 6.5v11l9-5.5-9-5.5z" fill="currentColor"></path>
    </svg>
  `;
}

function getPauseIconSvg() {
  return `
    <svg class="control-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 6h3v12H8zM13 6h3v12h-3z" fill="currentColor"></path>
    </svg>
  `;
}

function getSongListPauseIconSvg() {
  return `
    <svg class="song-play-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 6h3v12H8zM13 6h3v12h-3z" fill="currentColor"></path>
    </svg>
  `;
}

function getVolumeIconSvg(volume) {
  if (volume <= 0) {
    return `
      <svg class="volume-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 10h4l5-4v12l-5-4H5z" fill="currentColor"></path>
        <path d="M17 8 21 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
        <path d="M21 8 17 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
      </svg>
    `;
  }

  if (volume < 0.5) {
    return `
      <svg class="volume-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 10h4l5-4v12l-5-4H5z" fill="currentColor"></path>
        <path d="M17 9.5a3 3 0 0 1 0 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
      </svg>
    `;
  }

  return `
    <svg class="volume-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 10h4l5-4v12l-5-4H5z" fill="currentColor"></path>
      <path d="M17 9a4 4 0 0 1 0 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
      <path d="M19.5 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
    </svg>
  `;
}

function updatePlayPauseButton() {
  const isPlaying = !audioEl.paused && !audioEl.ended;
  playPauseBtn.innerHTML = isPlaying ? getPauseIconSvg() : getPlayIconSvg();
  const label = isPlaying ? "暂停" : "播放";
  playPauseBtn.setAttribute("aria-label", label);
  playPauseBtn.setAttribute("title", label);
  updateSongListButtonsState();
}

function updateVolumeButton() {
  volumeBtn.innerHTML = getVolumeIconSvg(currentVolume);
  const volumePercent = Math.round(currentVolume * 100);
  const label = currentVolume === 0 ? "当前已静音" : `当前音量 ${volumePercent}%`;
  volumeBtn.setAttribute("aria-label", label);
  volumeBtn.setAttribute("title", label);
}

// =========================
// 3. 工具函数
// =========================
function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "--:--";
  }

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatMessageText(text) {
  return escapeHtml(text).replace(/\n/g, "<br>");
}

function getApiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

function getAssetUrl(path) {
  if (!path) {
    return "";
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${API_BASE_URL}${path}`;
}

async function parseApiResponse(response) {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = payload.error || "请求失败，请稍后重试。";
    throw new Error(errorMessage);
  }

  return payload;
}

function getDisplayName(name) {
  return name && name.trim() ? name.trim() : "匿名";
}

function getSubmitAuthorName() {
  return currentMessageAuthor === "匿名用户" ? "匿名" : currentMessageAuthor;
}

function askNickname() {
  const rawName = window.prompt("请输入你的昵称，留空将以“匿名”发布：", "");
  if (rawName === null) {
    return null;
  }

  return getDisplayName(rawName);
}

function updateMessageAuthorUI() {
  messageUserNameEl.textContent = currentMessageAuthor;
  localStorage.setItem("messageWallAuthor", currentMessageAuthor);
}

function setUploadTip(message, isError = false) {
  messageImageTipEl.textContent = message;
  messageImageTipEl.classList.toggle("is-error", isError);
}

function renderMessageImagePreview() {
  if (!pendingMessageImage) {
    messageImagePreviewEl.hidden = true;
    messageImagePreviewEl.innerHTML = "";
    setUploadTip("支持图片，大小不能超过 3MB");
    return;
  }

  messageImagePreviewEl.hidden = false;
  messageImagePreviewEl.innerHTML = `
    <img src="${pendingMessageImage.previewUrl}" alt="${escapeHtml(pendingMessageImage.fileName)}">
    <button type="button" class="message-image-remove" id="messageImageRemove">移除图片</button>
  `;
  setUploadTip(`已选择：${pendingMessageImage.fileName}`);
}

function resetPendingMessageImage() {
  if (pendingMessageImage?.previewUrl) {
    URL.revokeObjectURL(pendingMessageImage.previewUrl);
  }

  pendingMessageImage = null;
  messageImageInputEl.value = "";
  renderMessageImagePreview();
}

async function handleImageSelection(file) {
  if (!file) {
    resetPendingMessageImage();
    return;
  }

  const maxSize = 3 * 1024 * 1024;
  if (file.size > maxSize) {
    resetPendingMessageImage();
    setUploadTip("图片不能超过 3MB，请重新选择。", true);
    return;
  }

  try {
    pendingMessageImage = {
      fileName: file.name,
      file,
      previewUrl: URL.createObjectURL(file)
    };
    renderMessageImagePreview();
  } catch (error) {
    resetPendingMessageImage();
    setUploadTip("图片读取失败，请重试。", true);
  }
}

function buildMessageImageHtml(image, className = "message-media") {
  if (!image) {
    return "";
  }

  return `<img class="${className}" src="${escapeHtml(getAssetUrl(image.url))}" alt="${escapeHtml(image.fileName || "留言图片")}">`;
}

function buildReplyListHtml(replies) {
  if (!replies.length) {
    return "";
  }

  return `
    <div class="reply-list">
      ${replies
        .map((reply) => {
          return `
            <div class="reply-item">
              <p class="reply-text">${formatMessageText(reply.text)}</p>
              ${buildMessageImageHtml(reply.image, "message-media")}
              <span class="reply-meta">${escapeHtml(reply.author)} · ${escapeHtml(reply.createdLabel)}</span>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderReplyForm(messageId) {
  if (activeReplyMessageId !== messageId) {
    return "";
  }

  return `
    <form class="reply-form" data-reply-form="${messageId}">
      <textarea
        class="reply-input"
        name="replyText"
        rows="3"
        maxlength="500"
        placeholder="写下你的回复..."
      ></textarea>
      <div class="reply-upload-row">
        <label class="message-upload-btn" for="replyImageInput-${messageId}">上传图片</label>
        <input
          id="replyImageInput-${messageId}"
          class="message-image-input"
          type="file"
          name="replyImage"
          accept="image/*"
        >
        <span class="message-upload-tip">支持图片，大小不能超过 3MB</span>
      </div>
      <div class="reply-form-actions">
        <button type="button" class="reply-cancel-btn" data-reply-cancel="${messageId}">取消</button>
        <button type="submit" class="reply-submit-btn">发布回复</button>
      </div>
    </form>
  `;
}

function renderMessages() {
  if (messageWallData.length === 0) {
    messageListEl.innerHTML = '<div class="message-empty">还没有留言，来贴上第一张便签吧。</div>';
    return;
  }

  messageListEl.innerHTML = messageWallData
    .map((message, index) => {
      const paletteClass = stickyPaletteClasses[index % stickyPaletteClasses.length];

      return `
        <article class="message-note ${paletteClass}" data-message-id="${message.id}">
          <p class="message-text">${formatMessageText(message.text)}</p>
          ${buildMessageImageHtml(message.image)}
          <span class="message-meta">${escapeHtml(message.author)} · ${escapeHtml(message.createdLabel)}</span>
          <div class="message-actions">
            <span class="message-meta">${message.replies.length} 条回复</span>
            <button type="button" class="message-reply-btn" data-reply-toggle="${message.id}">回复</button>
          </div>
          ${buildReplyListHtml(message.replies)}
          ${renderReplyForm(message.id)}
        </article>
      `;
    })
    .join("");

  if (activeReplyMessageId !== null) {
    const activeReplyInput = messageListEl.querySelector(`[data-reply-form="${activeReplyMessageId}"] .reply-input`);
    if (activeReplyInput) {
      activeReplyInput.focus();
    }
  }
}

function replaceMessages(messages) {
  messageWallData.splice(0, messageWallData.length, ...messages);
}

async function fetchMessagesFromServer() {
  const payload = await parseApiResponse(await fetch(getApiUrl("/api/messages")));
  replaceMessages(payload.data || []);
  renderMessages();
}

async function fetchSongsFromServer() {
  const payload = await parseApiResponse(await fetch(getApiUrl("/api/songs")));
  const nextSongs = Array.isArray(payload.data) ? payload.data : [];

  songs.splice(0, songs.length, ...nextSongs.map((song) => ({
    ...song,
    duration: song.duration ?? null
  })));

  renderSongs();
}

async function uploadImageToServer(file) {
  const formData = new FormData();
  formData.append("image", file);

  const payload = await parseApiResponse(
    await fetch(getApiUrl("/api/uploads"), {
      method: "POST",
      body: formData
    })
  );

  return payload.data;
}

function clearPlayerBarHideTimer() {
  if (playerBarHideTimer !== null) {
    clearTimeout(playerBarHideTimer);
    playerBarHideTimer = null;
  }
}

function showPlayerBar(duration = null) {
  clearPlayerBarHideTimer();
  playerBarEl.classList.add("is-visible");

  if (duration === null) {
    return;
  }

  playerBarHideTimer = window.setTimeout(() => {
    playerBarHideTimer = null;

    if (isPointerNearBottom || isPointerOverPlayerBar) {
      return;
    }

    if (!audioEl.paused && !audioEl.ended) {
      playerBarEl.classList.remove("is-visible");
      return;
    }

    playerBarEl.classList.remove("is-visible");
  }, duration);
}

function schedulePlayerBarHide(delay) {
  clearPlayerBarHideTimer();
  playerBarHideTimer = window.setTimeout(() => {
    playerBarHideTimer = null;

    if (isPointerNearBottom || isPointerOverPlayerBar) {
      return;
    }

    playerBarEl.classList.remove("is-visible");
  }, delay);
}

function syncPlayerBarWithPointer(clientY) {
  const nearBottomThreshold = 140;
  const nextNearBottom = clientY >= window.innerHeight - nearBottomThreshold;

  if (nextNearBottom) {
    isPointerNearBottom = true;
    showPlayerBar(null);
    return;
  }

  if (isPointerNearBottom) {
    isPointerNearBottom = false;

    if (!isPointerOverPlayerBar) {
      schedulePlayerBarHide(3000);
    }
  }
}

function updatePageTitle(index) {
  titleEl.textContent = `${songs[index].title} - ${songs[index].artist} | 吴易云音乐`;
}

function updatePlayerTitleMarquee() {
  requestAnimationFrame(() => {
    const shouldScroll = playerTitleTextEl.scrollWidth > playerTitleEl.clientWidth;
    playerTitleEl.classList.toggle("is-scrolling", shouldScroll);
    playerTitleTextGhostEl.textContent = shouldScroll ? playerTitleTextEl.textContent : "";
  });
}

function setPlayerTitle(title) {
  playerTitleTextEl.textContent = title;
  playerTitleTextGhostEl.textContent = "";
  updatePlayerTitleMarquee();
}

function updateProgressUI() {
  const duration = Number.isFinite(audioEl.duration) ? audioEl.duration : 0;
  const currentTime = Number.isFinite(audioEl.currentTime) ? audioEl.currentTime : 0;
  const percent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const clampedPercent = Math.max(0, Math.min(100, percent));

  progressInnerEl.style.width = `${clampedPercent}%`;
  progressThumbEl.style.left = `${clampedPercent}%`;
  currentTimeEl.textContent = formatTime(currentTime);
  totalTimeEl.textContent = formatTime(duration);
}

function updateVolumeUI() {
  const volumePercent = Math.max(0, Math.min(100, currentVolume * 100));
  volumeInnerEl.style.height = `${volumePercent}%`;
  volumeThumbEl.style.bottom = `${volumePercent}%`;
  updateVolumeButton();
}

async function safePlay() {
  try {
    await audioEl.play();
  } catch (error) {
    updatePlayPauseButton();
  }
}

// =========================
// 4. 渲染歌曲列表
// =========================
function renderSongs() {
  songCountEl.textContent = `${songs.length} 首歌曲`;

  songListEl.innerHTML = songs
    .map((song, index) => {
      const isCurrentSong = index === currentSongIndex;
      const isCurrentSongPlaying = isCurrentSong && !audioEl.paused && !audioEl.ended;
      const actionLabel = isCurrentSongPlaying ? `暂停 ${song.title}` : `播放 ${song.title}`;
      const iconSvg = isCurrentSongPlaying ? getSongListPauseIconSvg() : getSongListPlayIconSvg();

      return `
        <tr data-index="${index}">
          <td>${index + 1}</td>
          <td class="song-action-cell">
            <button class="play-btn" data-index="${index}" aria-label="${actionLabel}" title="${actionLabel}">
              ${iconSvg}
            </button>
          </td>
          <td>${song.title}</td>
          <td>${song.artist}</td>
          <td>${song.album}</td>
          <td>${song.duration ? formatTime(song.duration) : "--:--"}</td>
        </tr>
      `;
    })
    .join("");

  bindPlayButtons();
  highlightCurrentRow();
}

function updateSongListButtonsState() {
  const playButtons = document.querySelectorAll(".play-btn");
  const isPlaying = !audioEl.paused && !audioEl.ended;

  playButtons.forEach((btn) => {
    const index = Number(btn.dataset.index);
    const song = songs[index];
    if (!song) {
      return;
    }

    const isCurrentSong = index === currentSongIndex;
    const shouldShowPause = isCurrentSong && isPlaying;
    const label = shouldShowPause ? `暂停 ${song.title}` : `播放 ${song.title}`;

    btn.innerHTML = shouldShowPause ? getSongListPauseIconSvg() : getSongListPlayIconSvg();
    btn.setAttribute("aria-label", label);
    btn.setAttribute("title", label);
  });
}

// =========================
// 5. 绑定歌曲列表按钮
// =========================
function bindPlayButtons() {
  const playButtons = document.querySelectorAll(".play-btn");

  playButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = Number(btn.dataset.index);

      if (index === currentSongIndex) {
        togglePlayPause();
        return;
      }

      playSong(index);
    });
  });
}

// =========================
// 6. 播放指定歌曲
// =========================
function playSong(index) {
  const song = songs[index];
  if (!song) return;

  currentSongIndex = index;
  setPlayerTitle(song.title);
  playerArtistEl.textContent = song.artist;
  currentTimeEl.textContent = "00:00";
  totalTimeEl.textContent = song.duration ? formatTime(song.duration) : "--:--";
  const coverSrc = song.coverSrc ? getAssetUrl(song.coverSrc) : "";

  audioEl.src = encodeURI(getAssetUrl(song.audioSrc));
  audioEl.load();
  audioEl.volume = currentVolume;
  if (coverSrc) {
    const playlistCoverImg = document.querySelector("#playlistCover img");
    if (playlistCoverImg) {
      playlistCoverImg.src = coverSrc;
    }
  }

  updateProgressUI();
  updatePlayPauseButton();
  highlightCurrentRow();
  updatePageTitle(index);
  showPlayerBar(2000);
  safePlay();
}

// =========================
// 7. 当前歌曲高亮
// =========================
function highlightCurrentRow() {
  const rows = document.querySelectorAll("#songList tr");

  rows.forEach((row, index) => {
    row.classList.toggle("playing", index === currentSongIndex);
  });
}

// =========================
// 8. 播放控制
// =========================
function togglePlayPause() {
  if (currentSongIndex === -1) {
    playSong(0);
    return;
  }

  if (audioEl.paused) {
    safePlay();
  } else {
    audioEl.pause();
  }
}

function playPrevSong() {
  if (songs.length === 0) return;

  if (currentSongIndex <= 0) {
    playSong(songs.length - 1);
  } else {
    playSong(currentSongIndex - 1);
  }
}

function playNextSong() {
  if (songs.length === 0) return;

  if (currentSongIndex >= songs.length - 1) {
    playSong(0);
  } else {
    playSong(currentSongIndex + 1);
  }
}

function playAllSongs() {
  if (songs.length > 0) {
    playSong(0);
  }
}

// =========================
// 9. 进度与音量
// =========================
function setProgressFromRatio(ratio) {
  if (currentSongIndex === -1) return;
  if (!Number.isFinite(audioEl.duration) || audioEl.duration <= 0) return;

  const clampedRatio = Math.max(0, Math.min(1, ratio));
  audioEl.currentTime = audioEl.duration * clampedRatio;
  updateProgressUI();
}

function setProgressFromClientX(clientX) {
  const rect = progressBarEl.getBoundingClientRect();
  const ratio = (clientX - rect.left) / rect.width;
  setProgressFromRatio(ratio);
}

function setVolume(ratio) {
  currentVolume = Math.max(0, Math.min(1, ratio));
  audioEl.volume = currentVolume;

  if (currentVolume > 0) {
    previousVolume = currentVolume;
  }

  updateVolumeUI();
}

function setVolumeFromClientY(clientY) {
  const rect = volumeBarEl.getBoundingClientRect();
  const ratio = (rect.bottom - clientY) / rect.height;
  setVolume(ratio);
}

function keepVolumePopoverOpen() {
  if (volumePopoverFrame !== null) {
    cancelAnimationFrame(volumePopoverFrame);
    volumePopoverFrame = null;
  }

  volumeControlEl.classList.add("is-active");
}

function syncVolumePopoverState() {
  if (volumePopoverFrame !== null) {
    cancelAnimationFrame(volumePopoverFrame);
  }

  volumePopoverFrame = requestAnimationFrame(() => {
    volumePopoverFrame = null;

    if (isDraggingVolume || volumeControlEl.matches(":hover")) {
      keepVolumePopoverOpen();
      return;
    }

    volumeControlEl.classList.remove("is-active");
  });
}

function toggleMute() {
  if (currentVolume === 0) {
    setVolume(previousVolume || 0.7);
    return;
  }

  previousVolume = currentVolume;
  setVolume(0);
}

// =========================
// 10. 事件绑定
// =========================
playPauseBtn.addEventListener("click", togglePlayPause);
playAllBtn.addEventListener("click", playAllSongs);
prevBtn.addEventListener("click", playPrevSong);
nextBtn.addEventListener("click", playNextSong);
volumeBtn.addEventListener("click", toggleMute);
volumeBtn.addEventListener("blur", syncVolumePopoverState);
volumeControlEl.addEventListener("pointerenter", keepVolumePopoverOpen);
volumeControlEl.addEventListener("pointerleave", syncVolumePopoverState);
playerBarEl.addEventListener("pointerenter", () => {
  isPointerOverPlayerBar = true;
  showPlayerBar(null);
});
playerBarEl.addEventListener("pointerleave", () => {
  isPointerOverPlayerBar = false;

  if (!isPointerNearBottom) {
    schedulePlayerBarHide(3000);
  }
});

progressBarEl.addEventListener("pointerdown", (event) => {
  isDraggingProgress = true;
  setProgressFromClientX(event.clientX);
  showPlayerBar(null);
});

volumeBarEl.addEventListener("pointerdown", (event) => {
  isDraggingVolume = true;
  keepVolumePopoverOpen();
  setVolumeFromClientY(event.clientY);
  showPlayerBar(null);
});

window.addEventListener("pointermove", (event) => {
  syncPlayerBarWithPointer(event.clientY);

  if (isDraggingProgress) {
    setProgressFromClientX(event.clientX);
  }

  if (isDraggingVolume) {
    setVolumeFromClientY(event.clientY);
  }
});

window.addEventListener("pointerup", () => {
  isDraggingProgress = false;
  isDraggingVolume = false;
  syncVolumePopoverState();
});

window.addEventListener("keydown", (event) => {
  const target = event.target;
  const tagName = target instanceof HTMLElement ? target.tagName : "";
  const isEditable = target instanceof HTMLElement && target.isContentEditable;
  const isTypingField = tagName === "INPUT" || tagName === "TEXTAREA" || isEditable;

  if (event.code !== "Space" || isTypingField) {
    return;
  }

  event.preventDefault();
  togglePlayPause();
});

window.addEventListener("resize", updatePlayerTitleMarquee);

messageFormEl.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (isMessageSubmitting) {
    return;
  }

  const text = messageInputEl.value.trim();
  if (!text && !pendingMessageImage) {
    messageInputEl.focus();
    return;
  }

  isMessageSubmitting = true;

  try {
    let uploadedImage = null;
    if (pendingMessageImage?.file) {
      uploadedImage = await uploadImageToServer(pendingMessageImage.file);
    }

    await parseApiResponse(
      await fetch(getApiUrl("/api/messages"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          authorName: getSubmitAuthorName(),
          content: text,
          imageUrl: uploadedImage?.url || null,
          imageName: uploadedImage?.fileName || null
        })
      })
    );

    messageInputEl.value = "";
    resetPendingMessageImage();
    activeReplyMessageId = null;
    await fetchMessagesFromServer();
  } catch (error) {
    window.alert(error.message || "留言发布失败，请稍后重试。");
  } finally {
    isMessageSubmitting = false;
  }
});

messageUserEntryEl.addEventListener("click", () => {
  const nextName = window.prompt("请输入你的名字，留空将显示为“匿名用户”：", currentMessageAuthor === "匿名用户" ? "" : currentMessageAuthor);
  if (nextName === null) {
    return;
  }

  const trimmedName = nextName.trim();
  currentMessageAuthor = trimmedName ? trimmedName : "匿名用户";
  updateMessageAuthorUI();
});

messageImageInputEl.addEventListener("change", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  await handleImageSelection(target.files?.[0] || null);
});

messageImagePreviewEl.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  if (target.id === "messageImageRemove") {
    resetPendingMessageImage();
  }
});

messageListEl.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const replyToggleId = target.dataset.replyToggle;
  if (replyToggleId) {
    const messageId = Number(replyToggleId);
    activeReplyMessageId = activeReplyMessageId === messageId ? null : messageId;
    renderMessages();
    return;
  }

  const replyCancelId = target.dataset.replyCancel;
  if (replyCancelId) {
    activeReplyMessageId = null;
    renderMessages();
  }
});

messageListEl.addEventListener("submit", async (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  const messageIdRaw = form.dataset.replyForm;
  if (!messageIdRaw) {
    return;
  }

  event.preventDefault();
  const replyInput = form.elements.namedItem("replyText");
  if (!(replyInput instanceof HTMLTextAreaElement)) {
    return;
  }

  const replyText = replyInput.value.trim();
  const replyImageInput = form.elements.namedItem("replyImage");
  const imageFile = replyImageInput instanceof HTMLInputElement ? replyImageInput.files?.[0] || null : null;

  if (!replyText && !imageFile) {
    replyInput.focus();
    return;
  }

  try {
    let uploadedImage = null;

    if (imageFile) {
      const maxSize = 3 * 1024 * 1024;
      if (imageFile.size > maxSize) {
        window.alert("回复图片不能超过 3MB。");
        return;
      }

      uploadedImage = await uploadImageToServer(imageFile);
    }

    await parseApiResponse(
      await fetch(getApiUrl(`/api/messages/${messageIdRaw}/replies`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          authorName: getSubmitAuthorName(),
          content: replyText,
          imageUrl: uploadedImage?.url || null,
          imageName: uploadedImage?.fileName || null
        })
      })
    );

    activeReplyMessageId = Number(messageIdRaw);
    await fetchMessagesFromServer();
  } catch (error) {
    window.alert(error.message || "回复发布失败，请稍后重试。");
  }
});

audioEl.addEventListener("play", updatePlayPauseButton);
audioEl.addEventListener("play", () => {
  showPlayerBar(2000);
});
audioEl.addEventListener("pause", updatePlayPauseButton);
audioEl.addEventListener("pause", () => {
  if (!isPointerNearBottom && !isPointerOverPlayerBar) {
    playerBarEl.classList.remove("is-visible");
  }
});
audioEl.addEventListener("timeupdate", () => {
  updateProgressUI();
});
audioEl.addEventListener("loadedmetadata", () => {
  if (currentSongIndex !== -1) {
    songs[currentSongIndex].duration = audioEl.duration;
  }

  updateProgressUI();
  renderSongs();
});
audioEl.addEventListener("ended", playNextSong);
audioEl.addEventListener("error", () => {
  updatePlayPauseButton();
});

// =========================
// 11. 页面初始化
// =========================
audioEl.volume = currentVolume;
updatePlayPauseButton();
updateVolumeUI();
updateMessageAuthorUI();
renderMessageImagePreview();
setPlayerTitle("还没有播放歌曲");
fetchMessagesFromServer().catch((error) => {
  renderMessages();
  window.alert(error.message || "留言墙加载失败，请确认后端服务已启动。");
});
fetchSongsFromServer().catch((error) => {
  renderSongs();
  window.alert(error.message || "歌曲列表加载失败，请确认后端服务已启动。");
});
