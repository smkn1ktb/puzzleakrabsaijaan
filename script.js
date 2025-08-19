document.addEventListener('DOMContentLoaded', () => {
    // === ELEMEN DOM ===
    const loginScreen = document.getElementById('login-screen');
    const gameScreen = document.getElementById('game-screen');
    const nameInput = document.getElementById('player-name-input');
    const startButton = document.getElementById('start-game-button');
    const playerNameDisplay = document.getElementById('player-name-display');
    const piecesContainerLeft = document.getElementById('pieces-container-left');
    const piecesContainerRight = document.getElementById('pieces-container-right');
    const puzzleBoard = document.getElementById('puzzle-board');
    const timerElement = document.getElementById('timer');
    const winModal = document.getElementById('win-modal');
    const finalTimeElement = document.getElementById('final-time');
    const winnerNameElement = document.getElementById('winner-name');
    const resetButton = document.getElementById('reset-button');
    const finishButton = document.getElementById('finish-button');
    const leaderboardList = document.getElementById('leaderboard-list');
    const hintButton = document.getElementById('hint-button');

    // === AUDIO ===
    const snapSound = new Audio('./audio/snap.mp3');
    const winSound = new Audio('./audio/win.mp3');

    // === VARIABEL GAME ===
    const PIECES_COUNT = 16;
    let selectedPiece = null;
    let timerInterval = null;
    let seconds = 0;
    let playerName = "";
    let hintUsed = false;

    // === FUNGSI PAPAN SKOR (LEADERBOARD) ===
    async function updateLeaderboard() {
        try {
            const response = await fetch('getleaderboard.php');
            const scores = await response.json();
            leaderboardList.innerHTML = '';
            if (scores.length === 0) {
                leaderboardList.innerHTML = '<li>Belum ada skor tercatat.</li>';
                return;
            }
            scores.forEach((score, index) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${index + 1}. <span class="player-name">${score.name}</span></span>
                    <span class="player-time">${score.time}</span>
                `;
                leaderboardList.appendChild(li);
            });
        } catch (error) {
            console.error('Gagal memuat papan skor:', error);
            leaderboardList.innerHTML = '<li>Gagal memuat data.</li>';
        }
    }

    // === PENGATURAN AWAL & LOGIN ===
    startButton.addEventListener('click', () => {
        playerName = nameInput.value.trim();
        if (playerName === "") {
            alert("Nama tidak boleh kosong!");
            return;
        }
        playerNameDisplay.textContent = playerName;
        loginScreen.classList.remove('active');
        gameScreen.classList.add('active');
        initializeGame();
    });

    // === FUNGSI UTAMA GAME ===
    function initializeGame() {
        resetGameStates();
        createPuzzleSlots();
        createPuzzlePieces();
        startTimer();
    }

    function createPuzzleSlots() {
        for (let i = 1; i <= PIECES_COUNT; i++) {
            const slot = document.createElement('div');
            slot.classList.add('puzzle-slot');
            slot.dataset.slotId = i;
            slot.addEventListener('click', handleSlotClick);
            puzzleBoard.appendChild(slot);
        }
    }

    function createPuzzlePieces() {
        const pieceNumbers = Array.from({ length: PIECES_COUNT }, (_, i) => i + 1);
        shuffleArray(pieceNumbers);
        piecesContainerLeft.innerHTML = '';
        piecesContainerRight.innerHTML = '';
        const prePlacedPieceId = Math.floor(Math.random() * PIECES_COUNT) + 1;
        let sidePieceCounter = 0;
        pieceNumbers.forEach((num) => {
            const piece = document.createElement('img');
            piece.classList.add('puzzle-piece');
            const pieceId = num.toString().padStart(2, '0');
            const imagePath = `./images/potongan/img-${pieceId}.jpg`;
            piece.src = imagePath;
            piece.dataset.pieceId = num;
            if (num === prePlacedPieceId) {
                const targetSlot = puzzleBoard.querySelector(`.puzzle-slot[data-slot-id="${num}"]`);
                if (targetSlot) {
                    targetSlot.appendChild(piece);
                    targetSlot.classList.add('correct');
                    piece.classList.add('pre-placed');
                }
            } else {
                piece.addEventListener('click', handlePieceClick);
                if (sidePieceCounter < Math.ceil((PIECES_COUNT - 1) / 2)) {
                    piecesContainerLeft.appendChild(piece);
                } else {
                    piecesContainerRight.appendChild(piece);
                }
                sidePieceCounter++;
            }
        });
    }

    // === FUNGSI BANTUAN (HINT) YANG DIPERBAIKI ===
    function useHint() {
        if (hintUsed) {
            console.log("Bantuan sudah digunakan.");
            return;
        }

        const sidePieces = [
            ...piecesContainerLeft.querySelectorAll('.puzzle-piece'),
            ...piecesContainerRight.querySelectorAll('.puzzle-piece')
        ];

        if (sidePieces.length === 0) {
            console.log("Tidak ada potongan di samping untuk diberi bantuan.");
            return;
        }

        const randomPiece = sidePieces[Math.floor(Math.random() * sidePieces.length)];
        const pieceId = randomPiece.dataset.pieceId;
        const targetSlot = puzzleBoard.querySelector(`.puzzle-slot[data-slot-id="${pieceId}"]`);

        // Hanya jalankan jika potongan dan slotnya ditemukan
        if (randomPiece && targetSlot) {
            console.log(`Memberi bantuan untuk potongan #${pieceId}`);
            
            // Terapkan efek berkedip
            randomPiece.classList.add('hint-active');
            targetSlot.classList.add('hint-active');

            // Hapus efek setelah beberapa detik
            setTimeout(() => {
                randomPiece.classList.remove('hint-active');
                targetSlot.classList.remove('hint-active');
            }, 2000);

            // Tandai bantuan sudah digunakan dan nonaktifkan tombol
            hintUsed = true;
            hintButton.textContent = '💡 Bantuan (0)';
            hintButton.disabled = true;
        } else {
            console.error("Gagal menemukan potongan atau slot untuk bantuan.");
        }
    }

    // === EVENT HANDLER (FUNGSI KLIK) ===
    function handlePieceClick(event) {
        event.stopPropagation();
        const clickedPiece = event.target;
        const parent = clickedPiece.parentElement;
        if (parent.classList.contains('puzzle-slot')) {
            returnPieceToContainer(clickedPiece);
            parent.classList.remove('correct');
            handlePieceSelection(clickedPiece);
            return;
        }
        handlePieceSelection(clickedPiece);
    }
    
    function handlePieceSelection(piece) {
        if (selectedPiece === piece) {
            piece.classList.remove('piece-selected');
            selectedPiece = null;
        } else {
            if (selectedPiece) {
                selectedPiece.classList.remove('piece-selected');
            }
            selectedPiece = piece;
            piece.classList.add('piece-selected');
        }
    }

    function handleSlotClick(event) {
        const clickedSlot = event.currentTarget;
        if (selectedPiece && !clickedSlot.hasChildNodes()) {
            selectedPiece.classList.remove('piece-selected');
            clickedSlot.appendChild(selectedPiece);
            if (selectedPiece.dataset.pieceId === clickedSlot.dataset.slotId) {
                clickedSlot.classList.add('correct');
                snapSound.play();
            }
            selectedPiece = null;
            checkWinCondition();
        }
    }

    // === LOGIKA GAME & KEMENANGAN ===
    async function checkWinCondition() {
        const slots = puzzleBoard.querySelectorAll('.puzzle-slot');
        if (Array.from(slots).every(slot => slot.hasChildNodes())) {
            let allCorrect = Array.from(slots).every(slot => {
                const piece = slot.querySelector('.puzzle-piece');
                return piece.dataset.pieceId === slot.dataset.slotId;
            });
            if (allCorrect) {
                winSound.play();
                clearInterval(timerInterval);
                const finalTime = formatTime(seconds);
                finalTimeElement.textContent = finalTime;
                winnerNameElement.textContent = playerName;
                winModal.style.display = 'flex';
                await saveLog(playerName, finalTime);
            }
        }
    }

    // === FUNGSI BANTU & RESET ===
    function returnPieceToContainer(piece) {
        if (piecesContainerLeft.children.length <= piecesContainerRight.children.length) {
            piecesContainerLeft.appendChild(piece);
        } else {
            piecesContainerRight.appendChild(piece);
        }
    }

    async function saveLog(name, time) {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('time', time);
        try {
            await fetch('savelog.php', { method: 'POST', body: formData });
        } catch (error) {
            console.error('Gagal menyimpan log:', error);
        }
    }
    
    function resetGameStates() {
        clearInterval(timerInterval);
        seconds = 0;
        timerElement.textContent = '00:00';
        puzzleBoard.innerHTML = '';
        winModal.style.display = 'none';
        selectedPiece = null;
        // Reset status bantuan saat game baru dimulai atau diulangi
        hintUsed = false;
        hintButton.textContent = '💡 Bantuan (1)';
        hintButton.disabled = false;
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function startTimer() {
        timerInterval = setInterval(() => {
            seconds++;
            timerElement.textContent = formatTime(seconds);
        }, 1000);
    }

    function formatTime(s) {
        const minutes = Math.floor(s / 60).toString().padStart(2, '0');
        const seconds = (s % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    }

    // === EVENT LISTENER TOMBOL ===
    resetButton.addEventListener('click', initializeGame);
    hintButton.addEventListener('click', useHint);
    finishButton.addEventListener('click', () => {
        gameScreen.classList.remove('active');
        winModal.style.display = 'none';
        loginScreen.classList.add('active');
        nameInput.value = '';
        updateLeaderboard();
    });

    // === INISIALISASI PAPAN SKOR SAAT PERTAMA KALI DIBUKA ===
    updateLeaderboard();
});