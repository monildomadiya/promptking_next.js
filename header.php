<?php
if (session_status() === PHP_SESSION_NONE) { session_start(); }
$is_user_logged_in = isset($_SESSION['user_id']);

$header_avatar = 'https://ui-avatars.com/api/?name=User&background=e50914&color=fff&bold=true';
$logo_width = "180"; 
$user_display_name = "User"; 
$adsense_header_script = "";

if ($is_user_logged_in || true) { 
    global $conn; 
    if ($conn) {
        $conn->query("CREATE TABLE IF NOT EXISTS settings (setting_key VARCHAR(50) PRIMARY KEY, setting_value LONGTEXT)");
        
        $set_res = $conn->query("SELECT setting_key, setting_value FROM settings");
        if ($set_res) {
            while ($s_row = $set_res->fetch_assoc()) {
                if ($s_row['setting_key'] === 'logo_width') $logo_width = $s_row['setting_value'];
                if ($s_row['setting_key'] === 'adsense_header') $adsense_header_script = $s_row['setting_value'];
            }
        }

        if ($is_user_logged_in) {
            $uid = $conn->real_escape_string($_SESSION['user_id']);
            $u_res = $conn->query("SELECT name, avatar_url FROM users WHERE id='$uid'");
            if ($u_res && $u_row = $u_res->fetch_assoc()) {
                if (!empty($u_row['name'])) { $user_display_name = htmlspecialchars($u_row['name']); }
                if (!empty($u_row['avatar_url'])) {
                    $header_avatar = htmlspecialchars($u_row['avatar_url']);
                } else {
                    $encoded_name = urlencode($user_display_name);
                    $header_avatar = "https://ui-avatars.com/api/?name={$encoded_name}&background=e50914&color=fff&bold=true";
                }
            }
        }
    }
}

$site_logo_files = glob("logo.*");
$main_site_logo = (!empty($site_logo_files)) ? $site_logo_files[0] . '?v=' . filemtime($site_logo_files[0]) : '';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>PromptKing | Enterprise AI Library</title>
    
    <link rel="preconnect" href="https://cdnjs.cloudflare.com">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://www.gstatic.com">

    <?php if (!empty($main_site_logo)): ?>
    <link rel="preload" as="image" href="<?php echo $main_site_logo; ?>" fetchpriority="high">
    <?php endif; ?>
    <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=JetBrains+Mono&display=swap">

    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet" media="print" onload="this.media='all'">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=JetBrains+Mono&display=swap" rel="stylesheet" media="all">
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js" defer></script>

    <script type="module">
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
        import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

        const firebaseConfig = {
            apiKey: "AIzaSyD8IymN_rCvEzV88FtYcKCHmh_ZAqsGYqQ",
            authDomain: "promptking-3b87c.firebaseapp.com",
            databaseURL: "https://promptking-3b87c-default-rtdb.firebaseio.com",
            projectId: "promptking-3b87c",
            storageBucket: "promptking-3b87c.firebasestorage.app",
            messagingSenderId: "65170646998",
            appId: "1:65170646998:web:de9d8a399a1d372f4f2677",
            measurementId: "G-L06PJWWZHE"
        };

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const provider = new GoogleAuthProvider();

        window.loginWithGoogle = () => {
            signInWithPopup(auth, provider).then((result) => {
                const user = result.user;
                fetch('api.php?action=login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ uid: user.uid, name: user.displayName, email: user.email, picture: user.photoURL })
                }).then(() => window.location.reload());
            }).catch((error) => { console.error("Login Failed:", error); });
        };

        window.logoutUser = () => {
            signOut(auth).then(() => { fetch('api.php?action=logout').then(() => window.location.reload()); });
        };
        
        window.isLoggedIn = <?php echo $is_user_logged_in ? 'true' : 'false'; ?>;
    </script>

    <?php echo !empty($adsense_header_script) ? $adsense_header_script : ''; ?>

    <style>
        :root {
            --bg-color: #050505; --surface-color: #121212; --surface-light: #1a1a1a;
            --text-primary: #ffffff; --text-secondary: #a0a0a0; --accent-main: #e50914; 
            --border-color: rgba(255, 255, 255, 0.1); --app-bottom-nav-height: 70px;
            --success: #10a37f;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Poppins', sans-serif; -webkit-tap-highlight-color: transparent; }
        body { background-color: var(--bg-color); color: var(--text-primary); min-height: 100vh; display: flex; flex-direction: column; padding-bottom: var(--app-bottom-nav-height); }
        a { text-decoration: none; color: inherit; transition: 0.3s; }

        header { background: rgba(5, 5, 5, 0.85); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-bottom: 1px solid var(--border-color); padding: 15px 20px; position: sticky; top: 0; z-index: 1000; }
        .nav-wrapper { max-width: 1400px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
        .logo { display: flex; align-items: center; justify-content: center; }
        .logo img { width: <?php echo htmlspecialchars($logo_width); ?>px; height: auto; aspect-ratio: auto; max-height: 80px; object-fit: contain; transition: 0.3s; content-visibility: auto; }
        
        @media (max-width: 767px) { .nav-wrapper { justify-content: center; } }
        
        .desktop-nav { display: none; align-items: center; }
        @media (min-width: 768px) { .desktop-nav { display: flex; } body { padding-bottom: 0; } }

        .user-profile-pill { display: flex; align-items: center; gap: 12px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255,255,255,0.1); padding: 6px 20px 6px 6px; border-radius: 50px; cursor: pointer; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .user-profile-pill:hover { background: rgba(229, 9, 20, 0.1); border-color: rgba(229, 9, 20, 0.5); box-shadow: 0 0 20px rgba(229, 9, 20, 0.3); transform: translateY(-2px) scale(1.02); }
        .profile-avatar { width: 42px; height: 42px; border-radius: 50%; overflow: hidden; border: 2px solid transparent; transition: 0.4s; box-shadow: 0 4px 10px rgba(0,0,0,0.3); }
        .user-profile-pill:hover .profile-avatar { border-color: var(--accent-main); }
        .profile-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .profile-info { display: flex; flex-direction: column; justify-content: center; align-items: flex-start; }
        .profile-greeting { font-size: 0.65rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; line-height: 1; margin-bottom: 4px; }
        .profile-name { font-size: 0.95rem; font-weight: 700; color: white; line-height: 1; display: flex; align-items: center; }

        .btn-auth { background: linear-gradient(135deg, #ffffff, #e0e0e0); color: black; padding: 10px 24px; border-radius: 30px; font-weight: 700; cursor: pointer; border: none; display: flex; align-items: center; gap: 10px; transition: 0.3s; box-shadow: 0 4px 15px rgba(255,255,255,0.1);}
        .btn-auth:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(255,255,255,0.2); }

        .profile-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 2000; opacity: 0; pointer-events: none; transition: 0.4s; }
        .profile-modal-overlay.active { opacity: 1; pointer-events: all; }
        .profile-card { background: var(--surface-color); padding: 40px; border-radius: 30px; width: 100%; max-width: 450px; transform: translateY(40px) scale(0.95); transition: 0.4s; border: 1px solid var(--border-color); box-shadow: 0 30px 60px rgba(0,0,0,0.8); text-align: center; position: relative; }
        .profile-modal-overlay.active .profile-card { transform: translateY(0) scale(1); }
        .close-profile { position: absolute; top: 20px; right: 25px; color: var(--text-secondary); font-size: 1.5rem; cursor: pointer; transition: 0.3s; }
        .close-profile:hover { color: white; }
        .avatar-upload-container { position: relative; width: 120px; height: 120px; margin: 0 auto 25px auto; border-radius: 50%; overflow: hidden; border: 3px solid var(--surface-light); cursor: pointer; }
        .avatar-upload-container img { width: 100%; height: 100%; object-fit: cover; transition: 0.3s; }
        .avatar-upload-container:hover img { filter: brightness(0.5); }
        .avatar-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: white; opacity: 0; transition: 0.3s; font-size: 1.5rem; }
        .avatar-upload-container:hover .avatar-overlay { opacity: 1; }
        .avatar-upload-container input[type="file"] { display: none; }
        .profile-form-group { text-align: left; margin-bottom: 20px; }
        .profile-form-group label { display: block; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;}
        .profile-input { width: 100%; padding: 14px 18px; border-radius: 12px; border: 1px solid var(--border-color); background: var(--surface-light); color: white; font-size: 1rem; outline: none; transition: 0.3s;}
        .profile-input:focus { border-color: var(--accent-main); }
        .profile-input:disabled { opacity: 0.6; cursor: not-allowed; }
        .profile-actions { display: flex; gap: 15px; margin-top: 30px; }
        .btn-save-profile { flex: 2; background: var(--success); color: white; border: none; padding: 14px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: 0.3s; }
        .btn-save-profile:hover { opacity: 0.9; }
        .btn-logout-profile { flex: 1; background: transparent; border: 1px solid var(--accent-main); color: var(--accent-main); padding: 14px; border-radius: 12px; font-weight: 600; cursor: pointer; transition: 0.3s; }
        .btn-logout-profile:hover { background: var(--accent-main); color: white; }

        .filter-btn { background: var(--surface-color); border: 1px solid var(--border-color); color: var(--text-secondary); padding: 10px 24px; border-radius: 12px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: 0.3s; white-space: nowrap; }
        .filter-btn:hover { border-color: rgba(255,255,255,0.3); }
        .filter-btn.active { background: var(--accent-main); border-color: var(--accent-main); color: white; }
        
        #cardContainer, #skeletonContainer { column-count: 1; column-gap: 20px; width: 100%; padding-top: 10px; }
        @media (min-width: 769px) { #cardContainer, #skeletonContainer { column-count: 3; } } 
        @media (min-width: 1251px) { #cardContainer, #skeletonContainer { column-count: 3; } } 
        
        .pro-card { background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 20px; padding: 18px; width: 100%; box-sizing: border-box; transition: all 0.4s ease; animation: fadeUp 0.6s ease-out forwards; opacity: 0; transform: translateY(20px); display: block; margin-bottom: 25px; break-inside: avoid; page-break-inside: avoid; -webkit-column-break-inside: avoid; overflow: hidden; }
        .pro-card:hover { transform: translateY(-5px); border-color: rgba(255,255,255,0.25); box-shadow: 0 15px 35px rgba(0,0,0,0.6); }
        @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }
        
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .badge { border: 1px solid var(--border-color); padding: 5px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .badge.chatgpt { color: #10a37f; background: rgba(16, 163, 127, 0.05); border-color: rgba(16, 163, 127, 0.3); }
        .badge.gemini { color: #4285f4; background: rgba(66, 133, 244, 0.05); border-color: rgba(66, 133, 244, 0.3); }
        .badge.midjourney { color: #a855f7; background: rgba(168, 85, 247, 0.05); border-color: rgba(168, 85, 247, 0.3); }
        .card-title { font-size: 1.15rem; font-weight: 600; margin-bottom: 15px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        
        .slider-container { width: calc(100% + 36px); margin: -18px -18px 18px -18px; position: relative; overflow: hidden; border-bottom: 1px solid var(--border-color); background: #1a1a1a; border-radius: 20px 20px 0 0; }
        .slider-container img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; transition: opacity 0.5s ease; }
        .img-before { z-index: 2; clip-path: inset(0 50% 0 0); -webkit-clip-path: inset(0 50% 0 0); } 
        .slider-handle-wrapper { position: absolute; top: 0; bottom: 0; left: 50%; width: 2px; background: white; z-index: 3; transform: translateX(-50%); pointer-events: none; box-shadow: 0 0 10px rgba(0,0,0,0.5); }
        .slider-handle-pill { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; color: black; border-radius: 20px; padding: 8px 6px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 900; letter-spacing: -2px; box-shadow: 0 2px 5px rgba(0,0,0,0.5); }
        .slider-handle { position: absolute; inset: 0; z-index: 10; opacity: 0; cursor: ew-resize; width: 100%; height: 100%; margin: 0; -webkit-appearance: none; appearance: none;}

        /* --- PREMIUM TERMINAL PROMPT BOX --- */
        .prompt-area { background: #0d0d0d; border-radius: 16px; position: relative; overflow: hidden; display: flex; flex-direction: column; margin-bottom: 15px; border: 1px solid rgba(255,255,255,0.08); transition: 0.3s; min-height: 220px; box-shadow: inset 0 0 20px rgba(0,0,0,0.5); }
        .prompt-header { background: rgba(255,255,255,0.03); padding: 10px 15px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; gap: 6px; z-index: 2; }
        .prompt-dot { width: 10px; height: 10px; border-radius: 50%; }
        .dot-red { background: #ff5f56; } .dot-yel { background: #ffbd2e; } .dot-grn { background: #27c93f; }
        .prompt-header-text { margin-left: auto; font-size: 0.75rem; color: var(--text-secondary); font-family: 'JetBrains Mono', monospace; }
        
        .prompt-text-container { position: relative; flex: 1; width: 100%; display: flex; align-items: center; justify-content: center; }
        .prompt-text { position: absolute; inset: 0; padding: 20px; font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; color: #a3a3a3; line-height: 1.7; filter: blur(8px); -webkit-filter: blur(8px); user-select: none; transition: 0.5s ease; z-index: 1; }
        .prompt-area.unlocked .prompt-text { filter: blur(0); -webkit-filter: blur(0); user-select: text; overflow-y: auto; z-index: 20; color: #e0e0e0; }
        
        .lock-overlay { position: absolute; inset: 0; background: rgba(10, 10, 10, 0.75); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; z-index: 10; transition: opacity 0.4s, visibility 0.4s; }
        .prompt-area.unlocked .lock-overlay { opacity: 0; visibility: hidden; pointer-events: none; }

        .pass-input { width: 100%; max-width: 200px; padding: 12px 15px; border-radius: 50px; border: 1px solid rgba(255,255,255,0.15); background: rgba(0,0,0,0.8); color: white; text-align: center; font-family: monospace; letter-spacing: 4px; font-size: 1rem; outline: none; transition: 0.3s; box-shadow: inset 0 2px 5px rgba(0,0,0,0.5); }
        .pass-input:focus { border-color: var(--accent-main); box-shadow: 0 0 15px rgba(229, 9, 20, 0.2), inset 0 2px 5px rgba(0,0,0,0.5); }
        .pass-input::placeholder { letter-spacing: 1px; color: #666; font-size: 0.85rem; font-family: 'Poppins', sans-serif;}
        
        .btn-copy-home { display: none; width: 100%; background: white; color: black; border: none; padding: 12px; border-radius: 50px; font-weight: 700; cursor: pointer; margin-top: 15px; transition: 0.3s; box-shadow: 0 4px 15px rgba(255,255,255,0.1); }
        .prompt-area.unlocked ~ .btn-copy-home { display: block; animation: fadeUp 0.4s ease forwards; }

        .skeleton { background: linear-gradient(90deg, var(--surface-light) 25%, #2a2a2a 50%, var(--surface-light) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite linear; border-radius: 8px; }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .skeleton-card { background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 20px; padding: 18px; width: 100%; box-sizing: border-box; display: block; margin-bottom: 25px; break-inside: avoid; page-break-inside: avoid; -webkit-column-break-inside: avoid; overflow: hidden; }
        .skeleton-img { width: calc(100% + 36px); margin: -18px -18px 15px -18px; height: 220px; border-radius: 20px 20px 0 0; }
        .skeleton-header { display: flex; justify-content: space-between; margin-bottom: 15px; }
        .skeleton-badge { height: 26px; width: 70px; border-radius: 8px; }
        .skeleton-icon { height: 24px; width: 24px; border-radius: 50%; }
        .skeleton-title { height: 24px; width: 80%; margin-bottom: 15px; }
        .skeleton-prompt { height: 230px; width: 100%; border-radius: 12px; margin-bottom: 15px; }
        .skeleton-footer { height: 44px; width: 100%; border-radius: 10px; }
    </style>
</head>
<body>

<header>
    <div class="nav-wrapper">
        <a href="index.php" class="logo">
            <?php if (!empty($main_site_logo)): ?>
                <img src="<?php echo $main_site_logo; ?>" alt="PromptKing">
            <?php else: ?>
                <i class="fa-solid fa-layer-group" style="color:var(--accent-main); margin-right:8px; font-size:1.5rem;"></i> PromptKing
            <?php endif; ?>
        </a>
        <nav class="desktop-nav">
            <?php if ($is_user_logged_in): ?>
                <div class="user-profile-pill" onclick="openProfileModal()">
                    <div class="profile-avatar"><img src="<?php echo $header_avatar; ?>" id="nav-avatar" alt="Profile" loading="lazy"></div>
                    <div class="profile-info">
                        <span class="profile-greeting">Welcome back,</span>
                        <span class="profile-name"><span id="nav-user-name-display"><?php echo $user_display_name; ?></span> <i class="fa-solid fa-chevron-down" style="font-size: 0.7rem; margin-left: 6px; color: var(--accent-main);"></i></span>
                    </div>
                </div>
            <?php else: ?>
                <button onclick="window.loginWithGoogle()" class="btn-auth"><img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" style="width: 18px;" loading="lazy"> Sign In</button>
            <?php endif; ?>
        </nav>
    </div>
</header>

<?php if ($is_user_logged_in): ?>
<div class="profile-modal-overlay" id="profileModal">
    <div class="profile-card">
        <i class="fa-solid fa-xmark close-profile" onclick="closeProfileModal()"></i>
        <h2 style="margin-bottom: 30px; font-size: 1.8rem;">Profile Settings</h2>
        
        <form id="profileForm">
            <div class="avatar-upload-container" onclick="document.getElementById('avatarInput').click()">
                <img id="modalAvatarPreview" src="<?php echo $header_avatar; ?>" alt="Avatar" loading="lazy">
                <div class="avatar-overlay"><i class="fa-solid fa-camera"></i></div>
                <input type="file" id="avatarInput" name="avatar" accept="image/png, image/jpeg, image/jpg, image/webp">
            </div>

            <div class="profile-form-group">
                <label>Display Name</label>
                <input type="text" id="profileName" name="name" class="profile-input" required>
            </div>

            <div class="profile-form-group">
                <label>Email Address</label>
                <input type="email" id="profileEmail" class="profile-input" disabled>
            </div>

            <div class="profile-actions">
                <button type="button" class="btn-logout-profile" onclick="window.logoutUser()">Logout</button>
                <button type="submit" class="btn-save-profile" id="saveProfileBtn">Save Changes</button>
            </div>
        </form>
    </div>
</div>

<script>
    function openProfileModal() {
        document.getElementById('profileModal').classList.add('active');
        fetch('api.php?action=get_profile').then(res => res.json()).then(data => {
            if(!data.error) {
                document.getElementById('profileName').value = data.name;
                document.getElementById('profileEmail').value = data.email;
                if (data.avatar_url) document.getElementById('modalAvatarPreview').src = data.avatar_url;
            }
        });
    }
    function closeProfileModal() { document.getElementById('profileModal').classList.remove('active'); }

    document.getElementById('avatarInput').addEventListener('change', function(e) {
        if(e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) { document.getElementById('modalAvatarPreview').src = e.target.result; }
            reader.readAsDataURL(e.target.files[0]);
        }
    });

    document.getElementById('profileForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', document.getElementById('profileName').value);
        const avatarFile = document.getElementById('avatarInput').files[0];
        if(avatarFile) formData.append('avatar', avatarFile);

        const btn = document.getElementById('saveProfileBtn');
        btn.innerText = 'Saving...';

        fetch('api.php?action=update_profile', { method: 'POST', body: formData }).then(res => res.json()).then(data => {
            if(data.status === 'success') {
                btn.innerHTML = '<i class="fa-solid fa-check"></i> Saved!';
                if(data.new_avatar) {
                    document.getElementById('nav-avatar').src = data.new_avatar;
                    document.getElementById('modalAvatarPreview').src = data.new_avatar;
                }
                const newName = document.getElementById('profileName').value;
                const headerNameText = document.getElementById('nav-user-name-display');
                if(headerNameText) headerNameText.innerText = newName;
                setTimeout(() => { btn.innerText = 'Save Changes'; closeProfileModal(); }, 1500);
            } else { alert(data.error || "Error updating profile"); btn.innerText = 'Save Changes'; }
        });
    });
</script>
<?php endif; ?>
