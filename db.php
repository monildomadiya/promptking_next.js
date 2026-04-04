<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$host = '107.172.39.165';
$db   = 'promptking';
$user = 'pma_admin'; 
$pass = 'Pk_Pma@2024Secure!';     

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
try {
    $conn = new mysqli($host, $user, $pass, $db);
    $conn->set_charset("utf8mb4");
} catch(Exception $e) {
    error_log($e->getMessage());
    die("A connection error occurred. Please try again later.");
}
?>
