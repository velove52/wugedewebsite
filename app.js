// =========================
// 1. 假数据：先写死在 JS 里
// =========================
const songs = [
    {
      id: 1,
      title: "晴天",
      artist: "周杰伦",
      album: "叶惠美",
      duration: 269
    },
    {
      id: 2,
      title: "稻香",
      artist: "周杰伦",
      album: "魔杰座",
      duration: 223
    },
    {
      id: 3,
      title: "后来",
      artist: "刘若英",
      album: "我等你",
      duration: 350
    },
    {
      id: 4,
      title: "夜空中最亮的星",
      artist: "逃跑计划",
      album: "世界",
      duration: 252
    },
    {
      id: 5,
      title: "平凡之路",
      artist: "朴树",
      album: "猎户星座",
      duration: 302
    }
  ];
  
  // =========================
  // 2. 全局状态
  // =========================
  let currentSongIndex = -1;
  let isPlaying = false;
  let progressTimer = null;
  let fakeCurrentTime = 0;
  let currentVolume = 0.7;
  let previousVolume = currentVolume;
  let isDraggingProgress = false;
  let isDraggingVolume = false;
  
  // =========================
  // 3. 获取页面元素
  // =========================
  const songListEl = document.getElementById("songList");
  const songCountEl = document.getElementById("songCount");
  const playerTitleEl = document.getElementById("playerTitle");
  const playerArtistEl = document.getElementById("playerArtist");
  const totalTimeEl = document.getElementById("totalTime");
  const currentTimeEl = document.getElementById("currentTime");
  const progressBarEl = document.getElementById("progressBar");
  const progressInnerEl = document.getElementById("progressInner");
  const progressThumbEl = document.getElementById("progressThumb");
  const playPauseBtn = document.getElementById("playPauseBtn");
  const playAllBtn = document.getElementById("playAllBtn");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const titleEl = document.getElementById("title");
  const volumeBtn = document.getElementById("volumeBtn");
  const volumeBarEl = document.getElementById("volumeBar");
  const volumeInnerEl = document.getElementById("volumeInner");
  const volumeThumbEl = document.getElementById("volumeThumb");

  function getPlayIconSvg() {
    return `
      <svg class="control-icon" viewBox="0 0 24 24" aria-hidden="true">
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
    playPauseBtn.innerHTML = isPlaying ? getPauseIconSvg() : getPlayIconSvg();
    const label = isPlaying ? "暂停" : "播放";
    playPauseBtn.setAttribute("aria-label", label);
    playPauseBtn.setAttribute("title", label);
  }

  function updateVolumeButton() {
    volumeBtn.innerHTML = getVolumeIconSvg(currentVolume);
    const volumePercent = Math.round(currentVolume * 100);
    const label = currentVolume === 0 ? "当前已静音" : `当前音量 ${volumePercent}%`;
    volumeBtn.setAttribute("aria-label", label);
    volumeBtn.setAttribute("title", label);
  }
  
  // =========================
  // 4. 工具函数：秒转 mm:ss
  // =========================
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  function updateProgressUI() {
    const song = songs[currentSongIndex];
    const duration = song ? song.duration : 0;
    const percent = duration > 0 ? (fakeCurrentTime / duration) * 100 : 0;
    const clampedPercent = Math.max(0, Math.min(100, percent));

    progressInnerEl.style.width = `${clampedPercent}%`;
    progressThumbEl.style.left = `${clampedPercent}%`;
    currentTimeEl.textContent = formatTime(fakeCurrentTime);
  }

  function updateVolumeUI() {
    const volumePercent = Math.max(0, Math.min(100, currentVolume * 100));
    volumeInnerEl.style.height = `${volumePercent}%`;
    volumeThumbEl.style.bottom = `${volumePercent}%`;
    updateVolumeButton();
  }
  
  // =========================
  // 5. 渲染歌曲列表
  // =========================
  function renderSongs() {
    songCountEl.textContent = `${songs.length} 首歌曲`;
  
    songListEl.innerHTML = songs
      .map((song, index) => {
        return `
          <tr data-index="${index}">
            <td>${index + 1}</td>
            <td><button class="play-btn" data-index="${index}">播放</button></td>
            <td>${song.title}</td>
            <td>${song.artist}</td>
            <td>${song.album}</td>
            <td>${formatTime(song.duration)}</td>
          </tr>
        `;
      })
      .join("");
  
    bindPlayButtons();
  }
  
  // =========================
  // 6. 绑定每首歌的播放按钮
  // =========================
  function bindPlayButtons() {
    const playButtons = document.querySelectorAll(".play-btn");

    playButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = Number(btn.dataset.index);
        playSong(index);
      });
    });
  }
  function updatetitle(index) {
    titleEl.textContent = `${songs[index].title} - ${songs[index].artist} | 吴易云音乐`;
  }

  // =========================
  // 7. 播放指定歌曲
  // =========================
  function playSong(index) {
    currentSongIndex = index;
    isPlaying = true;
    fakeCurrentTime = 0;
  
    const song = songs[index];
  
    playerTitleEl.textContent = song.title;
    playerArtistEl.textContent = song.artist;
    totalTimeEl.textContent = formatTime(song.duration);
    updateProgressUI();
    updatePlayPauseButton();
  
    highlightCurrentRow();
    startFakeProgress();
    updatetitle(index);
  }
  
  // =========================
  // 8. 高亮当前歌曲
  // =========================
  function highlightCurrentRow() {
    const rows = document.querySelectorAll("#songList tr");
  
    rows.forEach((row, index) => {
      if (index === currentSongIndex) {
        row.classList.add("playing");
      } else {
        row.classList.remove("playing");
      }
    });
  }
  
  // =========================
  // 9. 播放 / 暂停
  // =========================
  function togglePlayPause() {
    if (currentSongIndex === -1) {
      playSong(0);
      return;
    }
  
    isPlaying = !isPlaying;
    updatePlayPauseButton();
  
    if (isPlaying) {
      startFakeProgress();
    } else {
      stopFakeProgress();
    }
  }
  
  // =========================
  // 10. 模拟进度条
  // 这里先不接真实音频，只是假装在播放
  // =========================
  function startFakeProgress() {
    stopFakeProgress();
  
    const song = songs[currentSongIndex];
  
    progressTimer = setInterval(() => {
      if (!isPlaying) return;
  
      fakeCurrentTime++;
  
      if (fakeCurrentTime >= song.duration) {
        playNextSong();
        return;
      }
  
      updateProgressUI();
    }, 1000);
  }
  
  function stopFakeProgress() {
    if (progressTimer) {
      clearInterval(progressTimer);
      progressTimer = null;
    }
  }
  
  // =========================
  // 11. 上一首 / 下一首
  // =========================
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
  
  // =========================
  // 12. 播放全部
  // =========================
  function playAllSongs() {
    if (songs.length > 0) {
      playSong(0);
    }
  }

  function setProgressFromRatio(ratio) {
    if (currentSongIndex === -1) return;

    const song = songs[currentSongIndex];
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    fakeCurrentTime = Math.round(song.duration * clampedRatio);

    if (fakeCurrentTime >= song.duration) {
      fakeCurrentTime = song.duration - 1;
    }

    fakeCurrentTime = Math.max(0, fakeCurrentTime);
    updateProgressUI();
  }

  function setProgressFromClientX(clientX) {
    const rect = progressBarEl.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    setProgressFromRatio(ratio);
  }

  function setVolume(ratio) {
    currentVolume = Math.max(0, Math.min(1, ratio));
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

  function toggleMute() {
    if (currentVolume === 0) {
      setVolume(previousVolume || 0.7);
      return;
    }

    previousVolume = currentVolume;
    setVolume(0);
  }
  
  // =========================
  // 13. 绑定底部控制按钮
  // =========================
  playPauseBtn.addEventListener("click", togglePlayPause);
  playAllBtn.addEventListener("click", playAllSongs);
  prevBtn.addEventListener("click", playPrevSong);
  nextBtn.addEventListener("click", playNextSong);
  volumeBtn.addEventListener("click", toggleMute);

  progressBarEl.addEventListener("pointerdown", (event) => {
    isDraggingProgress = true;
    setProgressFromClientX(event.clientX);
  });

  volumeBarEl.addEventListener("pointerdown", (event) => {
    isDraggingVolume = true;
    setVolumeFromClientY(event.clientY);
  });

  window.addEventListener("pointermove", (event) => {
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
  });
  
  // =========================
  // 14. 页面初始化
  // =========================
  updatePlayPauseButton();
  updateVolumeUI();
  renderSongs();
