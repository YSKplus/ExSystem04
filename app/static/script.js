// Global state
let currentSession = {
  sessionId: null,
  participantName: null,
  totalFiles: 0,
  currentIndex: 0,
  currentFile: null,
  isPlaying: false,
  hasEvaluated: false,
};

// DOM elements
const nameInputScreen = document.getElementById("nameInputScreen");
const evaluationScreen = document.getElementById("evaluationScreen");
const completionScreen = document.getElementById("completionScreen");
const participantNameInput = document.getElementById("participantName");
const playButton = document.getElementById("playButton");
const statusText = document.getElementById("statusText");
const progressText = document.getElementById("progressText");
const audioPlayer = document.getElementById("audioPlayer");
const repeatButton = document.getElementById("repeatButton");
const startButton = document.getElementById("startButton");

// Event listeners
participantNameInput.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    startExperiment();
  }
});

audioPlayer.addEventListener("play", function () {
  currentSession.isPlaying = true;
  playButton.disabled = true;
  statusText.textContent = "再生中...";
  statusText.style.color = "#ff6b6b";
});

audioPlayer.addEventListener("ended", function () {
  currentSession.isPlaying = false;
  playButton.disabled = false;
  currentSession.hasEvaluated = false;
  statusText.textContent = "再生完了。評価を選択してください。";
  statusText.style.color = "#51cf66";
});

audioPlayer.addEventListener("error", function () {
  playButton.disabled = false;
  statusText.textContent = "エラー：音声ファイルが読み込めません";
  statusText.style.color = "#ff6b6b";
  console.error("Audio error:", audioPlayer.error);
});

/**
 * Start the experiment with participant name
 */
async function startExperiment() {
  const name = participantNameInput.value.trim();

  if (!name) {
    alert("氏名を入力してください");
    return;
  }

  startButton.disabled = true;
  startButton.classList.add("loading");

  try {
    const response = await fetch("/api/init", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to initialize session");
    }

    const data = await response.json();

    // Store session info
    currentSession.sessionId = data.session_id;
    currentSession.participantName = name;
    currentSession.totalFiles = data.total_files;
    currentSession.currentIndex = 1;
    currentSession.currentFile = data.current_file;

    // Switch to evaluation screen
    nameInputScreen.classList.remove("active");
    evaluationScreen.classList.add("active");

    // Update progress and load audio
    updateProgress();
    loadAndPrepareAudio();
  } catch (error) {
    console.error("Error:", error);
    alert("エラーが発生しました：" + error.message);
  } finally {
    startButton.disabled = false;
    startButton.classList.remove("loading");
  }
}

/**
 * Load and prepare the current audio file
 */
async function loadAndPrepareAudio() {
  try {
    const audioUrl = `/api/audio/${currentSession.sessionId}/${currentSession.currentFile}`;
    audioPlayer.src = audioUrl;
    audioPlayer.preload = "auto";
    playButton.disabled = false;
    statusText.textContent = "クリックして再生してください";
    statusText.style.color = "#888";
  } catch (error) {
    console.error("Error loading audio:", error);
    statusText.textContent = "エラー：音声ファイルが読み込めません";
    statusText.style.color = "#ff6b6b";
  }
}

/**
 * Play the audio
 */
function playAudio() {
  if (audioPlayer.src) {
    // Reset and play
    audioPlayer.currentTime = 0;
    audioPlayer.play().catch((error) => {
      console.error("Playback error:", error);
      statusText.textContent = "エラー：再生に失敗しました";
      statusText.style.color = "#ff6b6b";
    });
  }
}

/**
 * Repeat the audio (without submitting evaluation)
 */
function repeatAudio() {
  if (!currentSession.isPlaying) {
    playAudio();
  }
}

/**
 * Submit evaluation and move to next file
 */
async function submitEvaluation(rating) {
  if (currentSession.isPlaying || currentSession.hasEvaluated) {
    return;
  }

  currentSession.hasEvaluated = true;

  try {
    const response = await fetch(
      `/api/submit-evaluation/${currentSession.sessionId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating: rating }),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to submit evaluation");
    }

    const data = await response.json();

    if (data.finished) {
      // All files evaluated - export results
      showCompletionScreen();
      await exportResults();
    } else {
      // Move to next file
      currentSession.currentIndex += 1;
      currentSession.currentFile = data.next_file;
      updateProgress();
      loadAndPrepareAudio();
    }
  } catch (error) {
    console.error("Error:", error);
    currentSession.hasEvaluated = false;
    alert("エラーが発生しました：" + error.message);
  }
}

/**
 * Update progress display
 */
function updateProgress() {
  progressText.textContent = `進捗: ${currentSession.currentIndex} / ${currentSession.totalFiles}`;
}

/**
 * Show completion screen
 */
function showCompletionScreen() {
  evaluationScreen.classList.remove("active");
  completionScreen.classList.add("active");
}

/**
 * Export results to Excel
 */
async function exportResults() {
  const messageDiv = document.getElementById("completionMessage");
  messageDiv.textContent = "Excelファイルを生成中...";

  try {
    const response = await fetch(
      `/api/export-results/${currentSession.sessionId}`,
      {
        method: "POST",
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to export results");
    }

    const data = await response.json();

    if (data.success) {
      messageDiv.innerHTML = `<strong>完了:</strong><br>${data.filename}<br><br>ファイルがサーバーの results フォルダに保存されました。`;

      // Show download button if needed
      const downloadButton = document.getElementById("downloadButton");
      downloadButton.style.display = "inline-block";
    } else {
      throw new Error("Export failed");
    }
  } catch (error) {
    console.error("Error:", error);
    messageDiv.innerHTML = `<strong>エラー:</strong><br>${error.message}`;
    messageDiv.style.color = "#ff6b6b";
  }
}

/**
 * Download results (if supported)
 */
function downloadResults() {
  // This would require additional backend support
  // For now, files are saved server-side in the results folder
  alert(
    "結果のExcelファイルはサーバーの results フォルダに保存されています。\nFTPまたはファイルマネージャーでダウンロードしてください。",
  );
}

/**
 * Check WAV file count on page load
 */
window.addEventListener("load", async function () {
  try {
    const response = await fetch("/api/wav-count");
    if (response.ok) {
      const data = await response.json();
      console.log(`Found ${data.count} WAV files`);
    }
  } catch (error) {
    console.error("Error checking WAV files:", error);
  }
});

// Prevent accidental page navigation
window.addEventListener("beforeunload", function (e) {
  if (currentSession.sessionId && !currentSession.hasEvaluated) {
    e.preventDefault();
    e.returnValue = "";
  }
});
