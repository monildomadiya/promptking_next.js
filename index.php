<?php
session_start();
$conn = new mysqli('107.172.39.165', 'pma_admin', 'Pk_Pma@2024Secure!', 'promptking');
if ($conn->connect_error) { die("Connection failed"); }
include 'header.php';

// Fetch the Home Page AdSense unit from DB
$adsense_home = '';
$ad_res = $conn->query("SELECT setting_value FROM settings WHERE setting_key='adsense_home'");
if ($ad_res && $ad_res->num_rows > 0) { $adsense_home = $ad_res->fetch_assoc()['setting_value']; }
?>

<div style="max-width: 1400px; margin: 0 auto; padding: 20px; width: 100%;">

    <div style="margin: 10px 0 30px;">
        <div style="position: relative; margin-bottom: 20px; max-width: 800px;">
            <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 18px; top: 50%; transform: translateY(-50%); color: var(--text-secondary);"></i>
            <input type="text" id="searchInput" onkeyup="filterCards()" placeholder="Search prompts or IDs..." style="width: 100%; padding: 16px 20px 16px 50px; border-radius: 16px; background: var(--surface-color); border: 1px solid var(--border-color); color: white; font-size: 1rem; outline: none; transition: 0.3s;" onfocus="this.style.borderColor='var(--accent-main)'" onblur="this.style.borderColor='var(--border-color)'">
        </div>
        
        <div style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 5px; scrollbar-width: none;">
            <button class="filter-btn active" onclick="setFilter('all', this)">All</button>
            <button class="filter-btn" onclick="setFilter('chatgpt', this)">ChatGPT</button>
            <button class="filter-btn" onclick="setFilter('gemini', this)">Gemini</button>
            <button class="filter-btn" onclick="setFilter('midjourney', this)">Midjourney</button>
            <?php if (isset($_SESSION['user_id'])): ?>
                <button class="filter-btn" onclick="setFilter('liked', this)" style="border-color: rgba(229, 9, 20, 0.5);"><i class="fa-solid fa-heart" style="color: var(--accent-main); margin-right: 5px;"></i> My Likes</button>
            <?php endif; ?>
        </div>
    </div>

    <?php if(!empty($adsense_home)): ?>
        <div style="margin: 20px auto 40px auto; max-width: 100%; text-align: center; border-radius: 16px; overflow: hidden;">
            <?php echo $adsense_home; ?>
        </div>
    <?php endif; ?>

    <div id="skeletonContainer">
        <?php for($i=0; $i<6; $i++): ?>
        <div class="skeleton-card">
            <div class="skeleton skeleton-img"></div>
            <div class="skeleton-header"><div class="skeleton skeleton-badge"></div><div class="skeleton skeleton-icon"></div></div>
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-prompt"></div>
            <div class="skeleton skeleton-footer"></div>
        </div>
        <?php endfor; ?>
    </div>

    <div id="cardContainer" style="display: none;">
        <?php
        $user_likes = [];
        if (isset($_SESSION['user_id'])) {
            $uid = $conn->real_escape_string($_SESSION['user_id']);
            $likes_result = $conn->query("SELECT prompt_key FROM user_likes WHERE user_id = '$uid'");
            while($l = $likes_result->fetch_assoc()) { $user_likes[] = $l['prompt_key']; }
        }

        $result = $conn->query("SELECT * FROM prompts ORDER BY created_at DESC");
        
        if ($result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $key = $row['prompt_key'];
                $pwd = addslashes($row['password']);
                $is_liked = in_array($key, $user_likes);
                $heart_class = $is_liked ? "fa-solid fa-heart" : "fa-regular fa-heart";
                $heart_color = $is_liked ? "var(--accent-main)" : "var(--text-secondary)";
                $liked_status = $is_liked ? 'true' : 'false';

                $badgeClass = 'chatgpt';
                $ai_type_lower = strtolower($row['ai_type']);
                if(strpos($ai_type_lower, 'gemini') !== false) $badgeClass = 'gemini';
                if(strpos($ai_type_lower, 'midjourney') !== false) $badgeClass = 'midjourney';

                $is_lcp = ($result->num_rows - $result->num_rows) < 2; // Rough way to catch first 2 in loop without a counter if needed, but I'll use a counter.
                
                // I'll actually use a counter variable.
                $card_num = isset($card_num) ? $card_num + 1 : 1;
                $priority_attr = ($card_num <= 2) ? 'fetchpriority="high"' : 'loading="lazy"';

                echo '<div class="pro-card" data-category="'.$ai_type_lower.'" data-liked="'.$liked_status.'">';
                
                $ratio = $row['image_ratio'] ? $row['image_ratio'] : '16/9';
                if ($row['is_image_slider'] && $row['img_before'] && $row['img_after']) {
                    echo '
                    <div class="slider-container" style="aspect-ratio: '.$ratio.';">
                        <img src="'.htmlspecialchars($row['img_after']).'" '.$priority_attr.' style="z-index: 1;">
                        <img src="'.htmlspecialchars($row['img_before']).'" class="img-before" id="before-'.$key.'" '.$priority_attr.' style="z-index: 2;">
                        <div class="slider-handle-wrapper" id="line-'.$key.'"><div class="slider-handle-pill">◀ ▶</div></div>
                        <input type="range" class="slider-handle" min="0" max="100" value="50" oninput="updateSlider(\''.$key.'\', this.value)">
                    </div>';
                } elseif ($row['img_after']) {
                    echo '<div style="width: calc(100% + 36px); margin: -18px -18px 15px -18px; position: relative; aspect-ratio: '.$ratio.'; background: #1a1a1a;">
                        <img src="'.htmlspecialchars($row['img_after']).'" style="width: 100%; height: 100%; object-fit: cover; border-radius: 20px 20px 0 0;" '.$priority_attr.'>
                    </div>';
                }

                echo '
                    <div class="card-header">
                        <span class="badge '.$badgeClass.'">'.htmlspecialchars($row['ai_type']).'</span>
                        <i class="'.$heart_class.'" style="color: '.$heart_color.'; font-size: 1.2rem; cursor: pointer; transition: 0.3s;" onclick="toggleLike(\''.$key.'\', this)"></i>
                    </div>
                    <h3 class="card-title">'.htmlspecialchars($row['title']).'</h3>';

                if ($row['hide_prompt_box'] == 0) {
                    echo '
                    <div class="prompt-area" id="box-'.$key.'">
                        <div class="prompt-header">
                            <div class="prompt-dot dot-red"></div>
                            <div class="prompt-dot dot-yel"></div>
                            <div class="prompt-dot dot-grn"></div>
                            <div class="prompt-header-text">prompt.txt</div>
                        </div>
                        <div class="prompt-text-container">
                            <div class="prompt-text" id="text-'.$key.'">
                                '.htmlspecialchars($row['prompt_text']).'
                            </div>
                            
                            <div class="lock-overlay" style="display: flex; flex-direction: column; align-items: center;">
                                <input type="password" id="input-'.$key.'" class="pass-input" placeholder="••••" oninput="checkAutoUnlock(\''.$key.'\', \''.$pwd.'\', this.value)">
                                <p id="error-'.$key.'" style="color:#ff4444; font-size:0.75rem; margin-top:10px; display:none; font-weight:600;">Incorrect PIN</p>
                                
                                '. ($row['ig_link'] ? '
                                <a href="'.htmlspecialchars($row['ig_link']).'" target="_blank" style="margin-top: 15px; font-size: 0.85rem; color: #a3a3a3; text-decoration: none; display: flex; align-items: center; gap: 6px; transition: 0.3s;" onmouseover="this.style.color=\'#e91e63\'" onmouseout="this.style.color=\'#a3a3a3\'">
                                    <i class="fa-brands fa-instagram"></i> Get PIN from Reel
                                </a>' : '') .'
                            </div>
                        </div>
                    </div>
                    <button class="btn-copy-home" id="copy-'.$key.'" onclick="copyHomeText(\''.$key.'\')"><i class="fa-regular fa-copy"></i> Copy Prompt</button>
                    ';
                }

                echo '
                    <a href="view.php?id='.$key.'" style="color: white; font-weight: 600; font-size: 0.9rem; margin-top: 20px; display: flex; align-items: center; gap: 8px; text-decoration: none; transition: 0.3s;" onmouseover="this.style.opacity=\'0.8\'" onmouseout="this.style.opacity=\'1\'">
                        Read Full Post <i class="fa-solid fa-arrow-right" style="font-size: 0.8rem; color: var(--accent-main);"></i>
                    </a>
                </div>';
            }
        } else {
            echo "<p style='color: gray; text-align: center; grid-column: 1/-1; padding: 40px;'>No prompts found.</p>";
        }
        ?>
    </div>
</div>

<script>
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            document.getElementById('skeletonContainer').style.display = 'none';
            document.getElementById('cardContainer').style.display = ''; 
        }, 800);
    });
</script>

<?php include 'footer.php'; ?>
