// ゲーム設定
const UNITS = {
    math: [
        { id: 'addition', name: '足し算', file: 'questions/math/addition.json' },
        { id: 'subtraction', name: '引き算', file: 'questions/math/subtraction.json' },
        { id: 'multiplication', name: '掛け算', file: 'questions/math/multiplication.json' },
        { id: 'division', name: '割り算', file: 'questions/math/division.json' },
        { id: 'word-problems', name: '文章題', file: 'questions/math/word-problems.json' }
    ],
    japanese: [
        { id: 'kanji-reading', name: '漢字の読み', file: 'questions/japanese/kanji-reading.json' },
        { id: 'kanji-writing', name: '漢字の書き', file: 'questions/japanese/kanji-writing.json' },
        { id: 'vocabulary', name: '語彙・言葉', file: 'questions/japanese/vocabulary.json' },
        { id: 'proverbs', name: 'ことわざ', file: 'questions/japanese/proverbs.json' }
    ],
    science: [
        { id: 'plants', name: '植物', file: 'questions/science/plants.json' },
        { id: 'animals', name: '動物', file: 'questions/science/animals.json' },
        { id: 'weather', name: '天気', file: 'questions/science/weather.json' },
        { id: 'body', name: '人体', file: 'questions/science/body.json' },
        { id: 'experiments', name: '実験・観察', file: 'questions/science/experiments.json' }
    ],
    social: [
        { id: 'geography', name: '地理', file: 'questions/social/geography.json' },
        { id: 'local-study', name: '地域学習', file: 'questions/social/local-study.json' },
        { id: 'history', name: '歴史', file: 'questions/social/history.json' },
        { id: 'life', name: 'くらし', file: 'questions/social/life.json' }
    ]
};

// ゲーム状態
let currentSubject = '';
let currentUnit = '';
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let combo = 0;
let maxCombo = 0;
let correctCount = 0;
let wrongCount = 0;
let bgmEnabled = true;
let audioContext = null;
let bgmAudio = null;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    loadHighScore();
    initAudio();
});

// 音声初期化
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.log('Audio not supported');
    }
}

// BGMトグル
document.getElementById('bgmToggle').addEventListener('click', () => {
    bgmEnabled = !bgmEnabled;
    document.getElementById('bgmToggle').textContent = bgmEnabled ? '🔊' : '🔇';
});

// ハイスコア読み込み
function loadHighScore() {
    const highScore = localStorage.getItem('highScore') || 0;
    document.getElementById('highScore').textContent = highScore;
}

// ハイスコア保存
function saveHighScore(newScore) {
    const currentHigh = parseInt(localStorage.getItem('highScore') || 0);
    if (newScore > currentHigh) {
        localStorage.setItem('highScore', newScore);
        loadHighScore();
    }
}

// 画面切り替え
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// 科目選択画面表示
function showSubjectSelect() {
    showScreen('subjectScreen');
    playSound('click');
}

// 単元選択画面表示
function showUnitSelect(subject) {
    currentSubject = subject;
    const units = UNITS[subject];
    
    const titles = {
        math: '算数の単元を選んでね！',
        japanese: '国語の単元を選んでね！',
        science: '理科の単元を選んでね！',
        social: '社会の単元を選んでね！'
    };
    
    document.getElementById('unitScreenTitle').textContent = titles[subject];
    
    const unitGrid = document.getElementById('unitGrid');
    unitGrid.innerHTML = '';
    
    units.forEach(unit => {
        const btn = document.createElement('button');
        btn.className = 'unit-btn';
        btn.onclick = () => startGame(unit.file);
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'unit-name';
        nameDiv.textContent = unit.name;
        
        const progressDiv = document.createElement('div');
        progressDiv.className = 'unit-progress';
        progressDiv.textContent = '100問';
        
        btn.appendChild(nameDiv);
        btn.appendChild(progressDiv);
        unitGrid.appendChild(btn);
    });
    
    showScreen('unitScreen');
    playSound('click');
}

// ゲーム開始
async function startGame(questionFile) {
    try {
        const response = await fetch(questionFile);
        const data = await response.json();
        currentQuestions = shuffleArray([...data.questions]).slice(0, 10); // 10問ランダム出題
        
        score = 0;
        combo = 0;
        maxCombo = 0;
        correctCount = 0;
        wrongCount = 0;
        currentQuestionIndex = 0;
        
        showScreen('gameScreen');
        updateGameUI();
        showQuestion();
        playSound('start');
    } catch (error) {
        console.error('Failed to load questions:', error);
        alert('問題の読み込みに失敗しました');
    }
}

// 配列シャッフル
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// ゲームUI更新
function updateGameUI() {
    document.getElementById('currentScore').textContent = score;
    document.getElementById('comboCount').textContent = combo;
    document.getElementById('questionNumber').textContent = currentQuestionIndex + 1;
    document.getElementById('totalQuestions').textContent = currentQuestions.length;
    
    const comboDisplay = document.getElementById('comboDisplay');
    if (combo > 0) {
        comboDisplay.classList.remove('hidden');
    } else {
        comboDisplay.classList.add('hidden');
    }
}

// 問題表示
function showQuestion() {
    if (currentQuestionIndex >= currentQuestions.length) {
        showResult();
        return;
    }
    
    const question = currentQuestions[currentQuestionIndex];
    document.getElementById('questionText').textContent = question.question;
    document.getElementById('hintText').textContent = question.hint || '';
    
    const choicesContainer = document.getElementById('choicesContainer');
    choicesContainer.innerHTML = '';
    
    question.choices.forEach((choice, index) => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.textContent = choice;
        btn.onclick = () => checkAnswer(index, question.correct);
        choicesContainer.appendChild(btn);
    });
    
    // キャラクター表情リセット
    const character = document.getElementById('gameCharacter');
    character.classList.remove('happy', 'sad');
}

// 答えチェック
function checkAnswer(selectedIndex, correctIndex) {
    const buttons = document.querySelectorAll('.choice-btn');
    buttons.forEach(btn => btn.disabled = true);
    
    const isCorrect = selectedIndex === correctIndex;
    const selectedButton = buttons[selectedIndex];
    const character = document.getElementById('gameCharacter');
    
    if (isCorrect) {
        // 正解
        selectedButton.classList.add('correct');
        character.classList.add('happy');
        combo++;
        maxCombo = Math.max(maxCombo, combo);
        
        const comboMultiplier = 1 + (combo - 1) * 0.5;
        const points = Math.floor(10 * comboMultiplier);
        score += points;
        correctCount++;
        
        playSound('correct');
        createSparkles();
        
    } else {
        // 不正解
        selectedButton.classList.add('wrong');
        buttons[correctIndex].classList.add('correct');
        character.classList.add('sad');
        combo = 0;
        wrongCount++;
        
        playSound('wrong');
        createPoop();
        shakeScreen();
    }
    
    updateGameUI();
    
    setTimeout(() => {
        currentQuestionIndex++;
        showQuestion();
    }, 2000);
}

// キラキラエフェクト
function createSparkles() {
    const container = document.getElementById('poopContainer');
    const emojis = ['✨', '⭐', '🌟', '💫', '🎉'];
    
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            sparkle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            sparkle.style.left = Math.random() * 100 + '%';
            sparkle.style.top = Math.random() * 50 + '%';
            sparkle.style.setProperty('--tx', (Math.random() - 0.5) * 200 + 'px');
            sparkle.style.setProperty('--ty', (Math.random() - 0.5) * 200 + 'px');
            container.appendChild(sparkle);
            
            setTimeout(() => sparkle.remove(), 1000);
        }, i * 50);
    }
}

// うんこエフェクト
function createPoop() {
    const container = document.getElementById('poopContainer');
    const poops = ['💩', '💩', '💩'];
    
    poops.forEach((emoji, i) => {
        setTimeout(() => {
            const poop = document.createElement('div');
            poop.className = 'poop';
            poop.textContent = emoji;
            poop.style.left = (30 + Math.random() * 40) + '%';
            poop.style.top = '30%';
            container.appendChild(poop);
            
            setTimeout(() => poop.remove(), 2000);
        }, i * 200);
    });
}

// 画面シェイク
function shakeScreen() {
    document.body.classList.add('shake');
    setTimeout(() => document.body.classList.remove('shake'), 500);
}

// 結果表示
function showResult() {
    document.getElementById('finalScore').textContent = score + '点';
    document.getElementById('correctCount').textContent = correctCount + '問';
    document.getElementById('wrongCount').textContent = wrongCount + '問';
    document.getElementById('maxCombo').textContent = combo + '連続';
    
    const accuracy = Math.round((correctCount / currentQuestions.length) * 100);
    let message = '';
    
    if (accuracy === 100) {
        message = '完璧！すごすぎる！🏆';
    } else if (accuracy >= 80) {
        message = 'すばらしい！よくできました！⭐';
    } else if (accuracy >= 60) {
        message = 'がんばったね！この調子！💪';
    } else {
        message = 'もう一度チャレンジしてみよう！📚';
    }
    
    document.getElementById('resultMessage').textContent = message;
    
    saveHighScore(score);
    showScreen('resultScreen');
    playSound('result');
}

// もう一度プレイ
function playAgain() {
    showUnitSelect(currentSubject);
    playSound('click');
}

// ゲーム終了
function quitGame() {
    if (confirm('ゲームをやめますか？')) {
        showScreen('startScreen');
        playSound('click');
    }
}

// 効果音再生（簡易版）
function playSound(type) {
    if (!bgmEnabled || !audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch(type) {
        case 'correct':
            oscillator.frequency.value = 800;
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            break;
        case 'wrong':
            oscillator.frequency.value = 200;
            oscillator.type = 'sawtooth';
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
            break;
        case 'click':
            oscillator.frequency.value = 600;
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
        case 'start':
        case 'result':
            oscillator.frequency.value = 400;
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
            break;
    }
}
