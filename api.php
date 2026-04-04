<?php
header('Content-Type: application/json');
session_start();

$host = '107.172.39.165';
$db   = 'promptking';
$user = 'pma_admin'; 
$pass = 'Pk_Pma@2024Secure!';     

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) { die(json_encode(["error" => "Connection failed."])); }

$action = $_GET['action'] ?? '';

// --- 1. AUTHENTICATION (SECURED) ---
if ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $stmt = $conn->prepare("INSERT INTO users (id, name, email, avatar_url) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), avatar_url=IF(avatar_url='', VALUES(avatar_url), avatar_url)");
    $stmt->bind_param("ssss", $data['uid'], $data['name'], $data['email'], $data['picture']);
    $stmt->execute();
    
    $_SESSION['user_id'] = $data['uid'];
    echo json_encode(["status" => "success"]);
    exit;
}

if ($action === 'logout') {
    session_destroy();
    echo json_encode(["status" => "success"]);
    exit;
}

// --- 2. FETCH PROMPTS & LIKES ---
if ($action === 'get_data') {
    $uid = $_SESSION['user_id'] ?? null;
    $prompts = [];
    $result = $conn->query("SELECT * FROM prompts");
    while($row = $result->fetch_assoc()) {
        $row['isImageSlider'] = (bool)$row['is_image_slider'];
        $row['hidePromptBox'] = (bool)$row['hide_prompt_box'];
        $row['copyCount'] = (int)$row['copy_count'];
        $row['aiType'] = $row['ai_type'];
        $row['key'] = $row['prompt_key'];
        $row['promptText'] = $row['prompt_text'];
        $row['imgAfter'] = $row['img_after'];
        $row['imgBefore'] = $row['img_before'];
        $row['igLink'] = $row['ig_link'];
        $row['imageRatio'] = $row['image_ratio'];
        $prompts[] = $row;
    }

    $likes = [];
    if ($uid) {
        $stmt = $conn->prepare("SELECT prompt_key FROM user_likes WHERE user_id = ?");
        $stmt->bind_param("s", $uid);
        $stmt->execute();
        $likesResult = $stmt->get_result();
        while($l = $likesResult->fetch_assoc()) { $likes[$l['prompt_key']] = true; }
    }
    echo json_encode(["prompts" => $prompts, "likes" => $likes]);
    exit;
}

// --- 3. TOGGLE LIKE ---
if ($action === 'toggle_like' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $uid = $_SESSION['user_id'] ?? null;
    if (!$uid) { echo json_encode(["error" => "Not logged in"]); exit; }
    
    $data = json_decode(file_get_contents('php://input'), true);
    $key = $data['key'];

    $stmt = $conn->prepare("SELECT * FROM user_likes WHERE user_id=? AND prompt_key=?");
    $stmt->bind_param("ss", $uid, $key);
    $stmt->execute();
    
    if ($stmt->get_result()->num_rows > 0) {
        $del_stmt = $conn->prepare("DELETE FROM user_likes WHERE user_id=? AND prompt_key=?");
        $del_stmt->bind_param("ss", $uid, $key);
        $del_stmt->execute();
        echo json_encode(["status" => "removed"]);
    } else {
        $ins_stmt = $conn->prepare("INSERT INTO user_likes (user_id, prompt_key) VALUES (?, ?)");
        $ins_stmt->bind_param("ss", $uid, $key);
        $ins_stmt->execute();
        echo json_encode(["status" => "added"]);
    }
    exit;
}

// --- 4. RECORD COPY ---
if ($action === 'record_copy' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $uid = $_SESSION['user_id'] ?? null;
    $data = json_decode(file_get_contents('php://input'), true);
    $key = $data['key'];
    
    $stmt = $conn->prepare("UPDATE prompts SET copy_count = copy_count + 1 WHERE prompt_key=?");
    $stmt->bind_param("s", $key);
    $stmt->execute();

    if ($uid) {
        $ins_stmt = $conn->prepare("INSERT IGNORE INTO user_copied (user_id, prompt_key) VALUES (?, ?)");
        $ins_stmt->bind_param("ss", $uid, $key);
        $ins_stmt->execute();
    }
    echo json_encode(["status" => "success"]);
    exit;
}

// --- 5. GET USER PROFILE ---
if ($action === 'get_profile') {
    $uid = $_SESSION['user_id'] ?? null;
    if (!$uid) { echo json_encode(["error" => "Not logged in"]); exit; }
    
    $stmt = $conn->prepare("SELECT name, email, avatar_url FROM users WHERE id=?");
    $stmt->bind_param("s", $uid);
    $stmt->execute();
    $u_data = $stmt->get_result()->fetch_assoc();
    
    if (empty($u_data['avatar_url'])) {
        $encoded_name = urlencode(!empty($u_data['name']) ? $u_data['name'] : 'User');
        $u_data['avatar_url'] = "https://ui-avatars.com/api/?name={$encoded_name}&background=e50914&color=fff&bold=true";
    }
    echo json_encode($u_data);
    exit;
}

// --- 6. UPDATE USER PROFILE ---
if ($action === 'update_profile' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $uid = $_SESSION['user_id'] ?? null;
    if (!$uid) { echo json_encode(["error" => "Not logged in"]); exit; }

    $name = trim($_POST['name'] ?? '');
    if (empty($name)) { echo json_encode(["error" => "Name cannot be empty"]); exit; }
    
    $avatar_url = null;
    if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === 0) {
        $upload_dir = 'uploads/';
        if (!is_dir($upload_dir)) { mkdir($upload_dir, 0777, true); } 
        $ext = strtolower(pathinfo($_FILES['avatar']['name'], PATHINFO_EXTENSION));
        $allowed = ['jpg', 'jpeg', 'png', 'webp'];
        if (in_array($ext, $allowed)) {
            $filename = $upload_dir . 'avatar_' . $uid . '_' . time() . '.' . $ext;
            if (move_uploaded_file($_FILES['avatar']['tmp_name'], $filename)) { $avatar_url = $filename; }
        }
    }

    if ($avatar_url !== null) {
        $stmt = $conn->prepare("UPDATE users SET name=?, avatar_url=? WHERE id=?");
        $stmt->bind_param("sss", $name, $avatar_url, $uid);
    } else {
        $stmt = $conn->prepare("UPDATE users SET name=? WHERE id=?");
        $stmt->bind_param("ss", $name, $uid);
    }
    $stmt->execute();
    
    $stmt = $conn->prepare("SELECT name, avatar_url FROM users WHERE id=?");
    $stmt->bind_param("s", $uid);
    $stmt->execute();
    $u_data = $stmt->get_result()->fetch_assoc();
    
    $new_avatar = $u_data['avatar_url'];
    if (empty($new_avatar)) {
        $encoded_name = urlencode($u_data['name']);
        $new_avatar = "https://ui-avatars.com/api/?name={$encoded_name}&background=e50914&color=fff&bold=true";
    }
    
    echo json_encode(["status" => "success", "new_avatar" => $new_avatar]);
    exit;
}
?>
