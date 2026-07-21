// Global state
let currentSession = {
    sessionId: null,
    participantName: null,
    totalFiles: 0,
    currentIndex: 0,
    currentFile: null,
    hasEvaluated: false,
    hasPlayed: false,
    playCount: 0
};

// DOM elements
const nameInputScreen = document.getElementById('nameInputScreen');
const evaluationScreen = document.getElementById('evaluationScreen');
const completionScreen = document.getElementById('completionScreen');
const exitScreen = document.getElementById('exitScreen');
const participantNameInput = document.getElementById('participantName');
const statusText = document.getElementById('statusText');
const progressText = document.getElementById('progressText');
const audioPlayer = document.getElementById('audioPlayer');
const startButton = document.getElementById('startButton');

// Event listeners
participantNameInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        startExperiment();
    }
});

// Enable rating buttons only after the first full playback ends
audioPlayer.addEventListener('ended', function() {
    // Count each full playback
    currentSession.playCount = (currentSession.playCount || 0) + 1;
    if (!currentSession.hasPlayed) {
        currentSession.hasPlayed = true;
        enableRatingButtons();
    }
});

/**
 * Start the experiment with participant name
 */
async function startExperiment() {
    const name = participantNameInput.value.trim();
    
    if (!name) {
        alert('氏名を入力してください');
        return;
    }
    
    startButton.disabled = true;
    startButton.classList.add('loading');
    
    try {
        const response = await fetch('/api/init', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: name })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to initialize session');
        }
        
        const data = await response.json();
        
        // Store session info
        currentSession.sessionId = data.session_id;
        currentSession.participantName = name;
        currentSession.totalFiles = data.total_files;
        currentSession.currentIndex = 1;
        currentSession.currentFile = data.current_file;
        currentSession.hasPlayed = false;
        
        // Switch to evaluation screen
        nameInputScreen.classList.remove('active');
        evaluationScreen.classList.add('active');
        
        // Update progress and load audio
        updateProgress();
        loadAudio();
        
    } catch (error) {
        console.error('Error:', error);
        alert('エラーが発生しました：' + error.message);
    } finally {
        startButton.disabled = false;
        startButton.classList.remove('loading');
        currentSession.playCount = 0;
    }
}

/**
 * Enable rating buttons
 */
function enableRatingButtons() {
    const buttons = document.querySelectorAll('.btn-rating');
    buttons.forEach(btn => {
        btn.disabled = false;
    });
}

/**
 * Disable rating buttons
 */
function disableRatingButtons() {
    const buttons = document.querySelectorAll('.btn-rating');
    buttons.forEach(btn => {
        btn.disabled = true;
    });
}

/**
 * Load the current audio file
 */
async function loadAudio() {
    try {
        const audioUrl = `/api/audio/${currentSession.sessionId}/${currentSession.currentFile}`;
        audioPlayer.src = audioUrl;
        currentSession.hasPlayed = false;
        currentSession.playCount = 0;
        statusText.textContent = '';
        disableRatingButtons();
    } catch (error) {
        console.error('Error loading audio:', error);
        statusText.textContent = 'エラー：音声ファイルが読み込めません';
    }
}

/**
 * Submit evaluation and move to next file
 */
async function submitEvaluation(rating) {
    if (currentSession.hasEvaluated) {
        return;
    }
    
    currentSession.hasEvaluated = true;
    audioPlayer.pause();
    
    try {
        const response = await fetch(`/api/submit-evaluation/${currentSession.sessionId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ rating: rating, play_count: currentSession.playCount })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to submit evaluation');
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
            currentSession.hasEvaluated = false;
            updateProgress();
            loadAudio();
        }
        
    } catch (error) {
        console.error('Error:', error);
        currentSession.hasEvaluated = false;
        alert('エラーが発生しました：' + error.message);
    }
}

/**
 * Exit experiment
 */
async function exitExperiment() {
    if (confirm('実験を途中で終了しますか？') === false) {
        return;
    }
    // Stop audio
    audioPlayer.pause();
    audioPlayer.src = '';

    // Attempt to export results up to this point
    let exitMsg = document.getElementById('exitMessage');
    exitMsg.textContent = '途中終了処理中: 結果を出力しています...';

    try {
        if (currentSession.sessionId) {
            const response = await fetch(`/api/export-results/${currentSession.sessionId}`, {
                method: 'POST'
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Export failed');
            }

            const data = await response.json();
            if (data.success) {
                exitMsg.innerHTML = `実験を途中終了しました。出力ファイル: ${data.filename}`;
            } else {
                exitMsg.textContent = '実験途中終了：出力に失敗しました';
            }
        } else {
            exitMsg.textContent = 'セッションが見つかりません。';
        }
    } catch (error) {
        console.error('Export on exit error:', error);
        exitMsg.textContent = '出力処理中にエラーが発生しました';
    }

    // Show exit screen
    evaluationScreen.classList.remove('active');
    exitScreen.classList.add('active');

    // Reset state
    currentSession = {
        sessionId: null,
        participantName: null,
        totalFiles: 0,
        currentIndex: 0,
        currentFile: null,
        hasEvaluated: false,
        hasPlayed: false
        ,playCount: 0
    };
}

/**
 * Restart experiment (from exit screen)
 */
function restartExperiment() {
    // Reset UI
    exitScreen.classList.remove('active');
    nameInputScreen.classList.add('active');
    participantNameInput.value = '';
    participantNameInput.focus();
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
    evaluationScreen.classList.remove('active');
    completionScreen.classList.add('active');
}

/**
 * Export results to Excel
 */
async function exportResults() {
    const messageDiv = document.getElementById('completionMessage');
    messageDiv.textContent = 'Excelファイルを生成中...';
    
    try {
        const response = await fetch(`/api/export-results/${currentSession.sessionId}`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to export results');
        }
        
        const data = await response.json();
        
        if (data.success) {
            messageDiv.innerHTML = '完了: ' + data.filename + '<br><br>ファイルがサーバーの results フォルダに保存されました。';
        } else {
            throw new Error('Export failed');
        }
        
    } catch (error) {
        console.error('Error:', error);
        messageDiv.innerHTML = 'エラー: ' + error.message;
        messageDiv.style.color = '#cc0000';
    }
}

/**
 * Check WAV file count on page load
 */
window.addEventListener('load', async function() {
    try {
        const response = await fetch('/api/wav-count');
        if (response.ok) {
            const data = await response.json();
            console.log('Found ' + data.count + ' WAV files');
        }
    } catch (error) {
        console.error('Error checking WAV files:', error);
    }
});

// Prevent accidental page navigation
window.addEventListener('beforeunload', function(e) {
    if (currentSession.sessionId && !currentSession.hasEvaluated) {
        // Try to send results via Beacon as a best-effort on unload
        try {
            const url = `/api/export-results/${currentSession.sessionId}`;
            if (navigator.sendBeacon) {
                const blob = new Blob([''], { type: 'application/json' });
                navigator.sendBeacon(url, blob);
            }
        } catch (err) {
            console.warn('sendBeacon failed', err);
        }
        // Keep the default unload confirmation
        e.preventDefault();
        e.returnValue = '';
    }
});
