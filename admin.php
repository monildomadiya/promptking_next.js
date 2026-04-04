<?php
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
session_start();

$host = '107.172.39.165';
$db   = 'promptking';
$user = 'pma_admin'; 
$pass = 'Pk_Pma@2024Secure!';     
$admin_password = "admin"; 

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) { die("Connection failed."); }

$conn->query("CREATE TABLE IF NOT EXISTS settings (setting_key VARCHAR(50) PRIMARY KEY, setting_value LONGTEXT)");
$conn->query("ALTER TABLE settings MODIFY setting_value LONGTEXT"); // Ensure scripts can be saved properly

if (isset($_POST['login'])) {
    if ($_POST['password'] === $admin_password) {
        session_regenerate_id(true); 
        $_SESSION['is_admin'] = true;
        header("Location: admin.php"); exit;
    } else { $login_error = "Invalid Password!"; }
}
if (isset($_GET['logout'])) {
    session_destroy(); header("Location: admin.php"); exit;
}
$is_logged_in = isset($_SESSION['is_admin']) && $_SESSION['is_admin'] === true;
$view = $_GET['view'] ?? 'prompts';
$toast_msg = ""; $toast_type = "success";

if ($is_logged_in && $_SERVER['REQUEST_METHOD'] === 'POST') {
    
    if (isset($_POST['action']) && $_POST['action'] === 'save_prompt') {
        $prompt_key = !empty($_POST['prompt_key']) ? $_POST['prompt_key'] : uniqid('pr_');
        $title = $_POST['title']; $description = $_POST['description'] ?? ''; $ai_type = $_POST['ai_type']; $password = $_POST['password'];
        $hide_prompt_box = isset($_POST['hide_prompt_box']) ? 1 : 0; $ig_link = $_POST['ig_link']; $prompt_text = $_POST['prompt_text'];
        $image_ratio = $_POST['image_ratio']; $is_premium = isset($_POST['is_premium']) ? 1 : 0;
        $is_image_slider = (!empty($img_before) && !empty($img_after)) ? 1 : 0; $zero = 0;

        if (!empty($_POST['prompt_key'])) {
            $stmt = $conn->prepare("UPDATE prompts SET title=?, description=?, ai_type=?, password=?, hide_prompt_box=?, ig_link=?, prompt_text=?, img_before=?, img_after=?, image_ratio=?, is_image_slider=?, is_premium=? WHERE prompt_key=?");
            $stmt->bind_param("ssssisssssiis", $title, $description, $ai_type, $password, $hide_prompt_box, $ig_link, $prompt_text, $img_before, $img_after, $image_ratio, $is_image_slider, $is_premium, $prompt_key);
            if ($stmt->execute()) { $toast_msg = "Record updated successfully."; } else { $toast_msg = "Database Error."; $toast_type = "error"; }
        } else {
            $stmt = $conn->prepare("INSERT INTO prompts (prompt_key, title, description, ai_type, password, hide_prompt_box, ig_link, prompt_text, img_before, img_after, image_ratio, is_image_slider, is_premium, copy_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("sssssisssssiii", $prompt_key, $title, $description, $ai_type, $password, $hide_prompt_box, $ig_link, $prompt_text, $img_before, $img_after, $image_ratio, $is_image_slider, $is_premium, $zero);
            if ($stmt->execute()) { $toast_msg = "New prompt added to repository."; } else { $toast_msg = "Database Error."; $toast_type = "error"; }
        }
    }

    if (isset($_POST['action']) && $_POST['action'] === 'delete_prompt') {
        $key = $_POST['delete_id'];
        $stmt = $conn->prepare("DELETE FROM prompts WHERE prompt_key = ?"); $stmt->bind_param("s", $key); $stmt->execute();
        $stmt2 = $conn->prepare("DELETE FROM user_likes WHERE prompt_key = ?"); $stmt2->bind_param("s", $key); $stmt2->execute();
        $toast_msg = "Prompt record obliterated."; $toast_type = "error";
    }

    if (isset($_POST['action']) && $_POST['action'] === 'save_blog') {
        $b_id = !empty($_POST['blog_id']) ? intval($_POST['blog_id']) : 0;
        $b_title = $_POST['blog_title']; $b_slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $b_title))); 
        $b_content = $_POST['blog_content']; $b_image = $_POST['blog_image'];

        if ($b_id > 0) {
            $stmt = $conn->prepare("UPDATE blogs SET title=?, slug=?, content=?, featured_image=? WHERE id=?");
            $stmt->bind_param("ssssi", $b_title, $b_slug, $b_content, $b_image, $b_id);
            if ($stmt->execute()) { $toast_msg = "Blog post updated successfully."; } else { $toast_msg = "Database Error."; $toast_type = "error"; }
        } else {
            $stmt = $conn->prepare("INSERT INTO blogs (title, slug, content, featured_image) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("ssss", $b_title, $b_slug, $b_content, $b_image);
            if ($stmt->execute()) { $toast_msg = "Blog post published successfully!"; } else { $toast_msg = "Database Error."; $toast_type = "error"; }
        }
    }

    if (isset($_POST['action']) && $_POST['action'] === 'delete_blog') {
        $id = intval($_POST['delete_id']);
        $stmt = $conn->prepare("DELETE FROM blogs WHERE id = ?"); $stmt->bind_param("i", $id); $stmt->execute();
        $toast_msg = "Blog post deleted."; $toast_type = "error";
    }

    if (isset($_POST['action']) && $_POST['action'] === 'upload_logo') {
        $width = (int)$_POST['logo_width'];
        if ($width > 0) {
            $stmt = $conn->prepare("INSERT INTO settings (setting_key, setting_value) VALUES ('logo_width', ?) ON DUPLICATE KEY UPDATE setting_value=?");
            $str_width = (string)$width; $stmt->bind_param("ss", $str_width, $str_width); $stmt->execute();
        }

        if (isset($_FILES['site_logo']) && $_FILES['site_logo']['error'] === 0) {
            $ext = strtolower(pathinfo($_FILES['site_logo']['name'], PATHINFO_EXTENSION));
            if (in_array($ext, ['png', 'jpg', 'jpeg', 'svg', 'webp'])) {
                foreach (glob("logo.*") as $old) { unlink($old); }
                if (move_uploaded_file($_FILES["site_logo"]["tmp_name"], "logo." . $ext)) { $toast_msg = "Branding & Logo successfully updated!"; }
                else { $toast_msg = "Failed to upload logo."; $toast_type = "error"; }
            } else { $toast_msg = "Invalid format! Only SVG, PNG, JPG allowed."; $toast_type = "error"; }
        } else { $toast_msg = "Branding settings saved successfully!"; }
    }

    if (isset($_POST['action']) && $_POST['action'] === 'save_ads') {
        $ad_slots = ['adsense_header', 'adsense_home', 'adsense_post'];
        foreach ($ad_slots as $slot) {
            if (isset($_POST[$slot])) {
                $val = $_POST[$slot];
                $stmt = $conn->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value=?");
                $stmt->bind_param("sss", $slot, $val, $val);
                $stmt->execute();
            }
        }
        $toast_msg = "Monetization settings securely saved!";
    }
}

$site_logo_files = glob("logo.*");
$main_site_logo = (!empty($site_logo_files)) ? $site_logo_files[0] . '?v=' . time() : 'https://via.placeholder.com/150x50?text=No+Logo';

$settings_data = ['logo_width' => '180', 'adsense_header' => '', 'adsense_home' => '', 'adsense_post' => ''];
$set_res = $conn->query("SELECT setting_key, setting_value FROM settings");
if ($set_res) {
    while($s_row = $set_res->fetch_assoc()) {
        $settings_data[$s_row['setting_key']] = $s_row['setting_value'];
    }
}

$total_prompts = 0; $total_copies = 0; $total_users = 0;
if ($is_logged_in) {
    $total_prompts = $conn->query("SELECT COUNT(*) as c FROM prompts")->fetch_assoc()['c'];
    $total_copies = $conn->query("SELECT SUM(copy_count) as c FROM prompts")->fetch_assoc()['c'] ?? 0;
    $total_users = $conn->query("SELECT COUNT(*) as c FROM users")->fetch_assoc()['c'];
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PromptKing | Premium Admin</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=JetBrains+Mono&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.3/tinymce.min.js" referrerpolicy="origin"></script>
    <script>
      tinymce.init({
        selector: '#blogContent, #promptDescription', skin: 'oxide-dark', content_css: 'dark',
        plugins: 'anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount',
        toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat',
        height: 400, promotion: false, setup: function (editor) { editor.on('change', function () { editor.save(); }); }
      });
    </script>
    <style>
        :root { --bg-color: #000000; --surface-color: #121212; --surface-light: #1e1e1e; --text-primary: #ffffff; --text-secondary: #999999; --accent-main: #e50914; --accent-hover: #b80710; --border-color: rgba(255, 255, 255, 0.15); --success: #10a37f; --warning: #f59e0b; --tag-chatgpt: #10a37f; --tag-gemini: #4285f4; --tag-mj: #a855f7; --radius-lg: 24px; }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Poppins', sans-serif; }
        body { background: var(--bg-color); color: var(--text-primary); height: 100vh; width: 100vw; overflow: hidden; display: flex; }
        .login-wrapper { position: fixed; inset: 0; background: var(--bg-color); display: flex; align-items: center; justify-content: center; z-index: 9999; }
        .login-box { background: var(--surface-color); padding: 50px; border-radius: 30px; border: 1px solid var(--border-color); text-align: center; width: 100%; max-width: 400px; box-shadow: 0 30px 60px rgba(0,0,0,0.8); }
        .login-input { width: 100%; padding: 15px; border-radius: 12px; border: 1px solid var(--border-color); background: var(--surface-light); color: white; margin: 20px 0; outline: none; text-align: center; letter-spacing: 2px; }
        .login-input:focus { border-color: var(--accent-main); }
        .btn-login { width: 100%; padding: 15px; background: var(--accent-main); color: white; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; transition: 0.3s; }
        .sidebar { width: 300px; background-color: var(--surface-color); padding: 30px 20px; display: flex; flex-direction: column; border-right: 1px solid var(--border-color); overflow-y: auto; z-index: 10; }
        .main-content { flex: 1; display: flex; flex-direction: column; overflow-y: auto; background-color: var(--bg-color); position: relative; }
        .nav-item { display: flex; align-items: center; gap: 15px; padding: 14px 20px; border-radius: 16px; color: var(--text-secondary); font-weight: 600; font-size: 0.95rem; cursor: pointer; margin-bottom: 8px; transition: 0.3s; border: 1px solid transparent; text-decoration: none;}
        .nav-item:hover { color: var(--text-primary); background: rgba(255,255,255,0.05); }
        .nav-item.active { background-color: rgba(229, 9, 20, 0.1); color: var(--accent-main); border-color: rgba(229, 9, 20, 0.3); }
        .sidebar-bottom { margin-top: auto; padding-top: 20px; border-top: 1px solid var(--border-color);}
        .header { padding: 30px 40px; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(to bottom, rgba(18,18,18,1) 0%, transparent 100%); position: sticky; top: 0; z-index: 5; }
        .page-content { padding: 0 40px 40px 40px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .stat-card { background: var(--surface-color); padding: 25px; border-radius: var(--radius-lg); border: 1px solid var(--border-color); display: flex; align-items: center; gap: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .stat-icon { width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; }
        .stat-info h3 { font-size: 2rem; color: var(--text-primary); margin-bottom: 5px; line-height:1;}
        .stat-info p { font-size: 0.9rem; color: var(--text-secondary); font-weight: 500; }
        .table-header { display: flex; justify-content: flex-end; align-items: center; margin-bottom: 20px; }
        .btn-action { padding: 12px 24px; background-color: var(--accent-main); color: white; border: none; border-radius: 20px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.3s; }
        .btn-action:hover { background-color: var(--accent-hover); transform: translateY(-2px); }
        .data-table { width: 100%; border-collapse: separate; border-spacing: 0 8px; text-align: left; }
        .data-table th { padding: 10px 20px; font-size: 0.85rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; }
        .data-table td { padding: 18px 20px; background: var(--surface-color); color: var(--text-primary); font-size: 0.95rem; border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); }
        .data-table td:first-child { border-left: 1px solid var(--border-color); border-top-left-radius: 16px; border-bottom-left-radius: 16px; }
        .data-table td:last-child { border-right: 1px solid var(--border-color); border-top-right-radius: 16px; border-bottom-right-radius: 16px; }
        .data-table tr:hover td { background: var(--surface-light); }
        .tag { padding: 6px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 600; border: 1px solid; text-transform: uppercase;}
        .tag.chatgpt { color: var(--tag-chatgpt); border-color: rgba(16, 163, 127, 0.4); background: rgba(16, 163, 127, 0.1);}
        .tag.gemini { color: var(--tag-gemini); border-color: rgba(66, 133, 244, 0.4); background: rgba(66, 133, 244, 0.1);}
        .tag.midjourney { color: var(--tag-mj); border-color: rgba(168, 85, 247, 0.4); background: rgba(168, 85, 247, 0.1);}
        .action-icons { display: flex; gap: 10px; }
        .icon-btn { width: 36px; height: 36px; border-radius: 10px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1rem; background: var(--surface-light); color: var(--text-secondary); transition: 0.3s; border: 1px solid var(--border-color); }
        .icon-edit:hover { background: var(--success); color: white; border-color: var(--success); }
        .icon-duplicate:hover { background: var(--warning); color: white; border-color: var(--warning); }
        .icon-delete:hover { background: var(--accent-main); color: white; border-color: var(--accent-main); }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; opacity: 0; pointer-events: none; transition: 0.4s; }
        .modal-overlay.active { opacity: 1; pointer-events: all; }
        .modal-card { background: var(--surface-color); padding: 40px; border-radius: 30px; width: 100%; max-width: 900px; transform: translateY(40px) scale(0.95); transition: 0.4s; border: 1px solid var(--border-color); max-height: 90vh; overflow-y: auto; box-shadow: 0 30px 60px rgba(0,0,0,0.8); }
        .modal-overlay.active .modal-card { transform: translateY(0) scale(1); }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 25px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .form-group.full { grid-column: span 2; }
        .form-group label { font-size: 0.9rem; font-weight: 600; color: var(--text-secondary); }
        .form-input { padding: 14px 18px; border-radius: 12px; border: 1px solid var(--border-color); background: var(--surface-light); color: var(--text-primary); font-size: 0.95rem; outline: none; }
        .form-input:focus { border-color: var(--accent-main); }
        textarea.form-input { resize: vertical; min-height: 120px; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem;}
        .modal-actions { display: flex; justify-content: flex-end; gap: 15px; margin-top: 35px; }
        .btn-cancel { padding: 12px 24px; background: transparent; border: 1px solid var(--border-color); color: var(--text-secondary); border-radius: 20px; cursor: pointer; font-weight: 600; }
        .btn-cancel:hover { background: var(--surface-light); color: var(--text-primary); }
        .toast-container { position: fixed; top: 30px; left: 50%; transform: translateX(-50%); display: flex; flex-direction: column; gap: 10px; z-index: 2000; pointer-events: none; }
        .toast { background: var(--surface-light); color: var(--text-primary); padding: 14px 20px; border-radius: 16px; font-size: 0.9rem; font-weight: 500; transform: translateY(-20px); opacity: 0; transition: 0.4s; display: flex; align-items: center; gap: 12px; border: 1px solid var(--border-color); }
        .toast.success i { color: var(--success); }
        .toast.error i { color: var(--accent-main); }
        .toast.show { transform: translateY(0); opacity: 1; }
    </style>
</head>
<body>

<?php if (!$is_logged_in): ?>
    <div class="login-wrapper">
        <div class="login-box">
            <i class="fa-solid fa-lock" style="font-size: 3rem; color: var(--accent-main); margin-bottom: 20px;"></i>
            <h2>Secure Admin</h2>
            <?php if(isset($login_error)) echo "<p style='color:var(--accent-main); margin-top:10px;'>$login_error</p>"; ?>
            <form method="POST">
                <input type="password" name="password" class="login-input" placeholder="Enter Master PIN" required>
                <button type="submit" name="login" class="btn-login">Unlock Dashboard</button>
            </form>
        </div>
    </div>
<?php else: ?>

    <div class="toast-container" id="toastContainer"></div>

    <div class="modal-overlay" id="promptModal">
        <div class="modal-card">
            <h2 id="modalTitle" style="color: var(--text-primary); font-size: 1.8rem; margin-bottom: 5px;">Add New Prompt</h2>
            <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 20px;">Configure repository data for the main app feed.</p>
            <form method="POST" id="promptForm">
                <input type="hidden" name="action" value="save_prompt">
                <input type="hidden" name="prompt_key" id="pKey" value="">
                <div class="form-grid">
                    <div class="form-group full"><label>Prompt Title</label><input type="text" name="title" id="pTitle" class="form-input" required></div>
                    <div class="form-group full"><label>Tutorial / Description / Blog Content</label><textarea name="description" id="promptDescription"></textarea></div>
                    <div class="form-group"><label>AI Category</label><select name="ai_type" id="pCategory" class="form-input"><option value="ChatGPT">ChatGPT</option><option value="Gemini">Gemini</option><option value="Midjourney">Midjourney</option></select></div>
                    <div class="form-group" style="flex-direction: row; align-items: center; gap: 12px; background: rgba(255, 193, 7, 0.1); padding: 16px; border-radius: 12px; border: 1px solid rgba(255, 193, 7, 0.3);"><input type="checkbox" name="is_premium" id="pIsPremium" checked style="width: 20px; height: 20px; accent-color: #FFC107;" onchange="togglePinField(this.checked)"><label for="pIsPremium" style="margin: 0; cursor: pointer; color: #FFC107; font-weight: bold;">Premium Content</label></div>
                    <div class="form-group" id="pinGroup"><label>Unlock Password (PIN)</label><input type="text" name="password" id="pPassword" class="form-input" placeholder="e.g. 1234"></div>
                    <div class="form-group full" style="flex-direction: row; align-items: center; gap: 12px; background: rgba(245, 158, 11, 0.1); padding: 16px; border-radius: 12px; border: 1px solid rgba(245, 158, 11, 0.3);"><input type="checkbox" name="hide_prompt_box" id="pHidePromptBox" style="width: 20px; height: 20px; accent-color: var(--warning);"><label for="pHidePromptBox" style="margin: 0; cursor: pointer; color: var(--text-primary);">Hide Locked Prompt Box entirely</label></div>
                    <div class="form-group full"><label>Instagram Reel URL</label><input type="text" name="ig_link" id="pIgUrl" class="form-input" placeholder="https://instagram.com/reel/..."></div>
                    <div class="form-group full"><label>The Actual Raw Prompt Text</label><textarea name="prompt_text" id="pText" class="form-input" required></textarea></div>
                    <div class="form-group full" style="border-top: 1px solid var(--border-color); padding-top: 25px; margin-top: 10px;"><label style="color: var(--text-primary); font-size: 1.1rem;"><i class="fa-solid fa-image" style="color: var(--accent-main);"></i> Image Slider Settings</label></div>
                    <div class="form-group"><label>Before Image URL</label><input type="text" name="img_before" id="pImageBefore" class="form-input"></div>
                    <div class="form-group"><label>After Image URL</label><input type="text" name="img_after" id="pImageAfter" class="form-input"></div>
                    <div class="form-group full"><label>Image Aspect Ratio</label><select name="image_ratio" id="pImageRatio" class="form-input"><option value="4 / 5" selected>4:5 (Portrait)</option><option value="16 / 9">16:9 (Landscape)</option><option value="1 / 1">1:1 (Square)</option><option value="4 / 3">4:3 (Classic Photo)</option><option value="9 / 16">9:16 (Vertical Reel)</option></select></div>
                </div>
                <div class="modal-actions"><button type="button" class="btn-cancel" onclick="closePromptModal()">Cancel</button><button type="submit" class="btn-action" id="saveBtn">Save Prompt</button></div>
            </form>
        </div>
    </div>

    <div class="modal-overlay" id="blogModal">
        <div class="modal-card" style="max-width: 1000px;"> 
            <h2 id="blogModalTitle" style="color: var(--text-primary); font-size: 1.8rem; margin-bottom: 20px;">Write Blog Post</h2>
            <form method="POST" id="blogForm">
                <input type="hidden" name="action" value="save_blog"><input type="hidden" name="blog_id" id="bId" value="">
                <div class="form-grid" style="margin-top: 0;">
                    <div class="form-group full"><label>Post Title</label><input type="text" name="blog_title" id="bTitle" class="form-input" required></div>
                    <div class="form-group full"><label>Featured Image URL</label><input type="text" name="blog_image" id="bImage" class="form-input"></div>
                    <div class="form-group full"><label>Post Content</label><textarea name="blog_content" id="blogContent"></textarea></div>
                </div>
                <div class="modal-actions"><button type="button" class="btn-cancel" onclick="closeBlogModal()">Cancel</button><button type="submit" class="btn-action" id="blogSaveBtn">Publish Post</button></div>
            </form>
        </div>
    </div>

    <form id="deleteForm" method="POST" style="display:none;"><input type="hidden" name="action" id="deleteAction" value=""><input type="hidden" name="delete_id" id="deleteId"></form>

    <aside class="sidebar">
        <div class="logo" style="display: flex; align-items: center; justify-content: center; margin-bottom: 40px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 30px;"><img src="<?php echo $main_site_logo; ?>" alt="Logo" style="width: 180px; height: auto; object-fit: contain;"></div>
        <nav class="nav-menu">
            <a href="admin.php?view=prompts" class="nav-item <?php echo $view === 'prompts' ? 'active' : ''; ?>"><i class="fa-solid fa-table-list"></i> Manage Prompts</a>
            <a href="admin.php?view=blogs" class="nav-item <?php echo $view === 'blogs' ? 'active' : ''; ?>"><i class="fa-solid fa-pen-nib"></i> Manage Blog</a>
            <a href="admin.php?view=ads" class="nav-item <?php echo $view === 'ads' ? 'active' : ''; ?>"><i class="fa-solid fa-sack-dollar"></i> Monetization</a>
            <a href="admin.php?view=settings" class="nav-item <?php echo $view === 'settings' ? 'active' : ''; ?>"><i class="fa-solid fa-gear"></i> Settings</a>
            <a class="nav-item" href="index.php" target="_blank"><i class="fa-solid fa-globe"></i> View Live Site</a>
        </nav>
        <div class="sidebar-bottom"><a class="nav-item" href="admin.php?logout=true" style="color: var(--accent-main);"><i class="fa-solid fa-arrow-right-from-bracket"></i> Logout</a></div>
    </aside>

    <main class="main-content">
        <header class="header">
            <div><h2 style="color: var(--text-primary); font-size: 1.6rem; font-weight: 700;"><?php if($view === 'blogs') echo 'Blog Engine'; elseif($view === 'settings') echo 'Site Settings'; elseif($view === 'ads') echo 'Ad Monetization'; else echo 'Prompt Repository'; ?></h2><p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 4px;">Monitor and update your database</p></div>
            <div style="display: flex; gap: 15px; align-items: center; background: var(--surface-color); padding: 8px 16px; border-radius: 30px; border: 1px solid var(--border-color);"><span style="color: var(--text-primary); font-size: 0.9rem; font-weight: 600;">Admin Active</span><div style="width: 32px; height: 32px; border-radius: 50%; background: var(--accent-main); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold;">A</div></div>
        </header>

        <div class="page-content">
            <?php if ($view === 'prompts'): ?>
                <div class="stats-grid">
                    <div class="stat-card"><div class="stat-icon" style="background: rgba(16, 163, 127, 0.1); color: var(--success);"><i class="fa-solid fa-wand-magic-sparkles"></i></div><div class="stat-info"><h3><?php echo $total_prompts; ?></h3><p>Total Prompts</p></div></div>
                    <div class="stat-card"><div class="stat-icon" style="background: rgba(229, 9, 20, 0.1); color: var(--accent-main);"><i class="fa-solid fa-fire"></i></div><div class="stat-info"><h3><?php echo $total_copies; ?></h3><p>Total Copies</p></div></div>
                    <div class="stat-card"><div class="stat-icon" style="background: rgba(245, 158, 11, 0.1); color: var(--warning);"><i class="fa-solid fa-users"></i></div><div class="stat-info"><h3><?php echo $total_users; ?></h3><p>Registered Users</p></div></div>
                </div>
                <div class="table-header"><button class="btn-action" onclick="openPromptModal()"><i class="fa-solid fa-plus"></i> Create New Prompt</button></div>
                <table class="data-table">
                    <thead><tr><th>Identifier</th><th>Title</th><th>AI Model</th><th>Engagement</th><th style="text-align: right; padding-right: 30px;">Actions</th></tr></thead>
                    <tbody>
                        <?php
                        $result = $conn->query("SELECT * FROM prompts ORDER BY created_at DESC");
                        if ($result->num_rows > 0) {
                            while($row = $result->fetch_assoc()) {
                                $tagClass = 'chatgpt'; $ai = strtolower($row['ai_type']); if(strpos($ai, 'gemini') !== false) $tagClass = 'gemini'; if(strpos($ai, 'midjourney') !== false) $tagClass = 'midjourney';
                                $safeData = htmlspecialchars(json_encode($row), ENT_QUOTES, 'UTF-8');
                                echo "<tr><td style=\"font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; color: var(--text-secondary);\">#" . substr($row['prompt_key'], -6) . "</td><td style=\"font-weight: 600; max-width: 300px;\"><div style=\"display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;\">" . htmlspecialchars($row['title']) . "</div></td><td><span class='tag $tagClass'>" . htmlspecialchars($row['ai_type']) . "</span></td><td style=\"font-weight: 600;\"><i class='fa-solid fa-fire' style='color:var(--accent-main); margin-right:5px;'></i> " . $row['copy_count'] . "</td><td><div class='action-icons' style='justify-content: flex-end;'><button class='icon-btn icon-edit' onclick='editPrompt($safeData)' title='Edit'><i class='fa-solid fa-pen'></i></button><button class='icon-btn icon-duplicate' onclick='duplicatePrompt($safeData)' title='Duplicate'><i class='fa-solid fa-copy'></i></button><button class='icon-btn icon-delete' onclick='triggerDelete(\"" . $row['prompt_key'] . "\", \"prompt\")' title='Delete'><i class='fa-solid fa-trash'></i></button></div></td></tr>";
                            }
                        } else { echo "<tr><td colspan='5' style='text-align:center; padding:40px; color:var(--text-secondary);'>No prompts found in database.</td></tr>"; }
                        ?>
                    </tbody>
                </table>
            <?php elseif ($view === 'blogs'): ?>
                <div class="table-header"><button class="btn-action" onclick="openBlogModal()"><i class="fa-solid fa-plus"></i> Write New Post</button></div>
                <table class="data-table">
                    <thead><tr><th>Image</th><th>Title</th><th>Date Published</th><th style="text-align: right; padding-right: 30px;">Actions</th></tr></thead>
                    <tbody>
                        <?php
                        $blog_result = $conn->query("SELECT * FROM blogs ORDER BY created_at DESC");
                        if ($blog_result && $blog_result->num_rows > 0) {
                            while($b_row = $blog_result->fetch_assoc()) {
                                $safeBlogData = htmlspecialchars(json_encode($b_row), ENT_QUOTES, 'UTF-8');
                                $img = !empty($b_row['featured_image']) ? htmlspecialchars($b_row['featured_image']) : 'https://via.placeholder.com/80?text=No+Img';
                                echo "<tr><td style=\"width: 80px;\"><img src='$img' style='width:60px; height:60px; object-fit:cover; border-radius:10px;'></td><td style=\"font-weight: 600; max-width: 400px;\">" . htmlspecialchars($b_row['title']) . "</td><td style=\"color: var(--text-secondary); font-size: 0.85rem;\">" . date("M d, Y", strtotime($b_row['created_at'])) . "</td><td><div class='action-icons' style='justify-content: flex-end;'><button type='button' class='icon-btn icon-edit' onclick='editBlog($safeBlogData)' title='Edit'><i class='fa-solid fa-pen'></i></button><button type='button' class='icon-btn icon-delete' onclick='triggerDelete(" . $b_row['id'] . ", \"blog\")' title='Delete'><i class='fa-solid fa-trash'></i></button></div></td></tr>";
                            }
                        } else { echo "<tr><td colspan='4' style='text-align:center; padding:40px; color:var(--text-secondary);'>No blog posts yet. Start writing!</td></tr>"; }
                        ?>
                    </tbody>
                </table>
            <?php elseif ($view === 'ads'): ?>
                <div class="stats-grid"><div class="stat-card" style="grid-column: 1 / -1;"><div class="stat-info" style="width: 100%;"><h3 style="font-size: 1.5rem; margin-bottom: 20px;">Google AdSense Configuration</h3>
                    <form method="POST" style="background: var(--surface-light); padding: 30px; border-radius: 16px; border: 1px solid var(--border-color);">
                        <input type="hidden" name="action" value="save_ads">
                        
                        <div class="form-group full" style="margin-bottom: 25px;">
                            <label style="color: var(--text-primary); font-size: 1.1rem;"><i class="fa-solid fa-code" style="color: var(--accent-main); margin-right: 8px;"></i> Global AdSense Header Script</label>
                            <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 10px;">Paste your main Google Publisher tag here. It will be loaded securely in the header of all pages.</p>
                            <textarea name="adsense_header" class="form-input" style="height: 120px; font-family: monospace;" placeholder="<script async src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXX' crossorigin='anonymous'></script>"><?php echo htmlspecialchars($settings_data['adsense_header'] ?? ''); ?></textarea>
                        </div>
                        
                        <div class="form-group full" style="margin-bottom: 25px;">
                            <label style="color: var(--text-primary); font-size: 1.1rem;"><i class="fa-solid fa-pager" style="color: var(--accent-main); margin-right: 8px;"></i> Homepage / Feed Ad Unit</label>
                            <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 10px;">Paste the specific Ad Unit script to display immediately above the prompt grid.</p>
                            <textarea name="adsense_home" class="form-input" style="height: 120px; font-family: monospace;" placeholder="<ins class='adsbygoogle' style='display:block' data-ad-client='ca-pub-XXXX' data-ad-slot='XXXX'></ins>"><?php echo htmlspecialchars($settings_data['adsense_home'] ?? ''); ?></textarea>
                        </div>

                        <div class="form-group full" style="margin-bottom: 25px;">
                            <label style="color: var(--text-primary); font-size: 1.1rem;"><i class="fa-solid fa-file-lines" style="color: var(--accent-main); margin-right: 8px;"></i> Single Post / Article Ad Unit</label>
                            <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 10px;">Paste the specific Ad Unit script to display dynamically inside individual prompt pages and blog articles.</p>
                            <textarea name="adsense_post" class="form-input" style="height: 120px; font-family: monospace;" placeholder="<ins class='adsbygoogle' style='display:block' data-ad-client='ca-pub-XXXX' data-ad-slot='XXXX'></ins>"><?php echo htmlspecialchars($settings_data['adsense_post'] ?? ''); ?></textarea>
                        </div>
                        
                        <button type="submit" class="btn-action" style="margin-top: 10px;"><i class="fa-solid fa-cloud-arrow-up"></i> Save Monetization Settings</button>
                    </form>
                </div></div></div>
            <?php elseif ($view === 'settings'): ?>
                <div class="stats-grid"><div class="stat-card" style="grid-column: 1 / -1;"><div class="stat-info" style="width: 100%;"><h3 style="font-size: 1.5rem; margin-bottom: 20px;">Branding Options</h3>
                    <form method="POST" enctype="multipart/form-data" style="background: var(--surface-light); padding: 30px; border-radius: 16px; border: 1px solid var(--border-color);"><input type="hidden" name="action" value="upload_logo"><div class="form-group" style="margin-bottom: 20px;"><label style="display: block; margin-bottom: 15px; color: var(--text-primary); font-size: 1.1rem;">Upload Main Site Logo</label><div style="display: flex; gap: 25px; align-items: flex-start; flex-wrap: wrap;"><div style="width: 140px; height: 100px; background: #000; border-radius: 12px; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 1px solid rgba(255,255,255,0.2);"><img src="<?php echo $main_site_logo; ?>" alt="Current Logo" style="max-width: 90%; max-height: 90%; object-fit: contain;"></div><div style="flex: 1; min-width: 250px;"><input type="file" name="site_logo" accept=".svg, .png, .jpg, .jpeg, .webp" class="form-input" style="width: 100%; background: rgba(0,0,0,0.5); padding: 12px; margin-bottom: 15px;"><label style="color: var(--text-primary); font-size: 0.9rem;">Public Logo Width (in pixels)</label><input type="number" name="logo_width" value="<?php echo htmlspecialchars($settings_data['logo_width']); ?>" class="form-input" required style="width: 100px; padding: 10px; margin-top: 5px; margin-bottom: 5px;"> px<p style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 8px;">Adjust this number to make the logo larger or smaller on the public-facing header.</p></div></div></div><button type="submit" class="btn-action" style="margin-top: 20px;"><i class="fa-solid fa-cloud-arrow-up"></i> Save Branding</button></form>
                </div></div></div>
            <?php endif; ?>
        </div>
    </main>

    <script>
        function openPromptModal() { document.getElementById('promptModal').classList.add('active'); togglePinField(document.getElementById('pIsPremium').checked); }
        function closePromptModal() { document.getElementById('promptModal').classList.remove('active'); document.getElementById('promptForm').reset(); document.getElementById('pKey').value = ''; if(tinymce.get('promptDescription')) tinymce.get('promptDescription').setContent(''); document.getElementById('modalTitle').innerText = "Add New Prompt"; document.getElementById('saveBtn').innerText = "Save Prompt"; togglePinField(true); }
        function togglePinField(checked) { const group = document.getElementById('pinGroup'); group.style.display = checked ? 'flex' : 'none'; if(!checked) document.getElementById('pPassword').value = ''; }
        function editPrompt(data) { document.getElementById('pKey').value = data.prompt_key; document.getElementById('pTitle').value = data.title; if(tinymce.get('promptDescription')) tinymce.get('promptDescription').setContent(data.description || ''); document.getElementById('pCategory').value = data.ai_type; document.getElementById('pPassword').value = data.password; document.getElementById('pHidePromptBox').checked = data.hide_prompt_box == 1; document.getElementById('pIsPremium').checked = data.is_premium == 1; togglePinField(data.is_premium == 1); document.getElementById('pIgUrl').value = data.ig_link; document.getElementById('pText').value = data.prompt_text; document.getElementById('pImageBefore').value = data.img_before; document.getElementById('pImageAfter').value = data.img_after; document.getElementById('pImageRatio').value = data.image_ratio; document.getElementById('modalTitle').innerText = "Edit Prompt"; document.getElementById('saveBtn').innerText = "Update Prompt"; openPromptModal(); }
        function duplicatePrompt(data) { editPrompt(data); document.getElementById('pKey').value = ''; document.getElementById('pTitle').value = data.title + " (Clone)"; document.getElementById('modalTitle').innerText = "Duplicate Prompt"; document.getElementById('saveBtn').innerText = "Save Clone"; }
        function openBlogModal() { document.getElementById('blogModal').classList.add('active'); }
        function closeBlogModal() { document.getElementById('blogModal').classList.remove('active'); document.getElementById('blogForm').reset(); document.getElementById('bId').value = ''; if(tinymce.get('blogContent')) tinymce.get('blogContent').setContent(''); document.getElementById('blogModalTitle').innerText = "Write Blog Post"; document.getElementById('blogSaveBtn').innerText = "Publish Post"; }
        function editBlog(data) { document.getElementById('bId').value = data.id; document.getElementById('bTitle').value = data.title; document.getElementById('bImage').value = data.featured_image; if(tinymce.get('blogContent')) tinymce.get('blogContent').setContent(data.content || ''); document.getElementById('blogModalTitle').innerText = "Edit Blog Post"; document.getElementById('blogSaveBtn').innerText = "Update Post"; openBlogModal(); }
        function triggerDelete(id, type) { if(confirm("CRITICAL WARNING: This will permanently delete this item. Are you sure?")) { document.getElementById('deleteAction').value = type === 'blog' ? 'delete_blog' : 'delete_prompt'; document.getElementById('deleteId').value = id; document.getElementById('deleteForm').submit(); } }
        function showToast(message, type = "success") { const container = document.getElementById('toastContainer'); const toast = document.createElement('div'); toast.className = `toast ${type}`; let icon = type === 'success' ? '<i class="fa-solid fa-circle-check"></i>' : '<i class="fa-solid fa-triangle-exclamation"></i>'; toast.innerHTML = `${icon} <span>${message}</span>`; container.appendChild(toast); setTimeout(() => toast.classList.add('show'), 10); setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 3000); }
        <?php if(!empty($toast_msg)): ?> window.onload = () => showToast("<?php echo $toast_msg; ?>", "<?php echo $toast_type; ?>"); <?php endif; ?>
    </script>
<?php endif; ?>
</body>
</html>
