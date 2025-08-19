<?php
// Atur zona waktu sesuai lokasi Anda (WITA)
date_default_timezone_set('Asia/Makassar');

// Cek apakah ada data nama dan waktu yang dikirim
if (isset($_POST['name']) && isset($_POST['time'])) {

    // Ambil data dan bersihkan untuk keamanan
    $name = trim(htmlspecialchars($_POST['name']));
    $time = trim(htmlspecialchars($_POST['time']));
    $timestamp = date('Y-m-d H:i:s'); // Format waktu: TAHUN-BULAN-TANGGAL JAM:MENIT:DETIK

    // Format data yang akan ditulis ke file log
    $log_entry = "[$timestamp] - Nama: $name, Waktu: $time" . PHP_EOL;

    // Tentukan nama file log
    $log_file = 'log.txt';

    // Tulis data ke file
    file_put_contents($log_file, $log_entry, FILE_APPEND);

    echo "Log saved.";

} else {
    // Jika data tidak lengkap, kirim pesan error
    echo "Error: Missing data.";
}
?>