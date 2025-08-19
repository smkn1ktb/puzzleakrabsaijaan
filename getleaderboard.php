<?php
header('Content-Type: application/json'); // Beritahu browser bahwa ini adalah data JSON

$log_file = 'log.txt';
$scores = [];

// Cek apakah file log ada dan bisa dibaca
if (file_exists($log_file) && is_readable($log_file)) {
    $lines = file($log_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    foreach ($lines as $line) {
        // Gunakan regular expression untuk mengekstrak nama dan waktu
        if (preg_match('/Nama: (.*?), Waktu: (.*?)$/', $line, $matches)) {
            $scores[] = [
                'name' => trim($matches[1]),
                'time' => trim($matches[2])
            ];
        }
    }

    // Urutkan skor berdasarkan waktu (ascending)
    usort($scores, function($a, $b) {
        return strcmp($a['time'], $b['time']);
    });

    // Ambil 5 skor teratas
    $top_scores = array_slice($scores, 0, 5);
    
    echo json_encode($top_scores);

} else {
    // Jika file tidak ada, kirim array JSON kosong
    echo json_encode([]);
}
?>