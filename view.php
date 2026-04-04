<?php
session_start();
$conn = new mysqli('107.172.39.165', 'pma_admin', 'Pk_Pma@2024Secure!', 'promptking');

$id = $_GET['id'] ?? '';
if (empty($id)) { header("Location: index.php"); exit; }

$stmt = $conn->prepare("SELECT * FROM prompts WHERE prompt_key = ?");
$stmt->bind_param("s", $id);
$stmt->execute();
$prompt = $stmt->get_result()->fetch_assoc();

if (!$prompt) { die("Prompt not found."); }

if (isset($_POST['ajax_unlock'])) {
    if ($_POST['pin'] === $prompt['password'] || empty($prompt['password'])) {
        $_SESSION['unlocked'][$id] = true; 
        $conn->query("UPDATE prompts SET copy_count = copy_count + 1 WHERE prompt_key = '" . $conn->real_escape_string($id) . "'"); 
        echo json_encode(['success' => true]);
    } else { echo json_encode(['success' => false]); }
    exit;
}

$is_unlocked = false;
if (empty($prompt['password']) || $prompt['hide_prompt_box'] == 1 || isset($_SESSION['unlocked'][$id])) { $is_unlocked = true; }

include 'header.php';

// Fetch the Article Page AdSense unit from DB
$adsense_post = '';
$ad_res = $conn->query("SELECT setting_value FROM settings WHERE setting_key='adsense_post'");
if ($ad_res && $ad_res->num_rows > 0) { $adsense_post = $ad_res->fetch_assoc()['setting_value']; }
?>

<style>
    .rich-content { color: var(--text-primary); line-height: 1.8; font-size: 1.05rem; margin-bottom: 30px; }
    .rich-content p { margin-bottom: 15px; }
    .rich-content a { color: var(--accent-main); text-decoration: underline; transition: 0.3s; }
    .rich-content a:hover { color: white; }
    .rich-content h2, .rich-content h3, .rich-content h4 { margin: 25px 0 15px 0; color: white; line-height: 1.3;}
    .rich-content ul, .rich-content ol { margin-left: 20px; margin-bottom: 20px; }
    .rich-content li { margin-bottom: 8px; }
    .rich-content img { max-width: 100%; border-radius: 12px; margin: 15px 0; height: auto; }
    .rich-content pre { background: rgba(0,0,0,0.5); padding: 15px; border-radius: 8px; overflow-x: auto; margin-bottom: 15px; border: 1px solid var(--border-color);}
    .rich-content code { font-family: 'JetBrains Mono', monospace; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-size: 0.9em;}
</style>

<div style="max-width: 800px; margin: 40px auto; padding: 20px; width: 100%;">
    <h1 style="font-size: 2.2rem; margin-bottom: 15px; line-height: 1.3; color: white;"><?php echo htmlspecialchars($prompt['title']); ?></h1>
    
    <div style="display: flex; gap: 15px; color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 30px; border-bottom: 1px solid var(--border-color); padding-bottom: 20px;">
        <span style="color: var(--accent-main); font-weight: 600;"><i class="fa-solid fa-microchip"></i> <?php echo htmlspecialchars($prompt['ai_type']); ?></span>
        <span><i class="fa-solid fa-calendar"></i> <?php echo date("M d, Y", strtotime($prompt['created_at'])); ?></span>
        <span><i class="fa-solid fa-fire"></i> <?php echo $prompt['copy_count']; ?> Uses</span>
    </div>

    <?php 
    $ratio = $prompt['image_ratio'] ? $prompt['image_ratio'] : '16/9';
    if ($prompt['is_image_slider'] && $prompt['img_before'] && $prompt['img_after']): 
    ?>
        <div class="slider-container" style="aspect-ratio: <?php echo $ratio; ?>; border-radius: 16px; margin: 0 0 30px 0; width: 100%;">
            <img src="<?php echo htmlspecialchars($prompt['img_after']); ?>" alt="After">
            <img src="<?php echo htmlspecialchars($prompt['img_before']); ?>" class="img-before" id="before-post">
            <div class="slider-handle-wrapper" id="line-post"><div class="slider-handle-pill">◀ ▶</div></div>
            <input type="range" class="slider-handle" min="0" max="100" value="50" oninput="updateSlider('post', this.value)">
        </div>
    <?php elseif ($prompt['img_after']): ?>
        <img src="<?php echo htmlspecialchars($prompt['img_after']); ?>" style="width: 100%; border-radius: 16px; margin-bottom: 30px; aspect-ratio: <?php echo $ratio; ?>; object-fit: cover;">
    <?php endif; ?>

    <?php if(!empty($adsense_post)): ?>
        <div style="margin: 0 auto 40px auto; max-width: 100%; text-align: center; border-radius: 16px; overflow: hidden;">
            <?php echo $adsense_post; ?>
        </div>
    <?php endif; ?>

    <?php if ($prompt['hide_prompt_box'] == 0): ?>
        <div style="background: #0d0d0d; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; overflow: hidden; position: relative; margin-bottom: 40px; box-shadow: inset 0 0 20px rgba(0,0,0,0.5);">
            
            <div style="background: rgba(255,255,255,0.03); padding: 12px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; gap: 8px;">
                <div style="width: 12px; height: 12px; border-radius: 50%; background: #ff5f56;"></div>
                <div style="width: 12px; height: 12px; border-radius: 50%; background: #ffbd2e;"></div>
                <div style="width: 12px; height: 12px; border-radius: 50%; background: #27c93f;"></div>
                <div style="margin-left: auto; font-size: 0.8rem; color: var(--text-secondary); font-family: 'JetBrains Mono', monospace;">prompt.txt</div>
            </div>

            <?php if (!$is_unlocked): ?>
                <div id="blurred-text" style="padding: 30px; filter: blur(8px); user-select: none; color: #a3a3a3; font-family: 'JetBrains Mono', monospace; height: 230px; overflow: hidden; transition: 0.4s; line-height: 1.7; font-size: 0.9rem;">
                    generate a highly detailed hyperrealistic portrait of a futuristic cyberpunk city with neon lights glowing in the rain 8k resolution octane render unreal engine 5...
                </div>
                
                <div id="real-text-container" style="display: none; padding: 30px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="color: #10a37f; font-size: 1.2rem;"><i class="fa-solid fa-unlock"></i> Unlocked</h3>
                        <button onclick="copyRealText()" id="copyBtn" style="background: white; color: black; border: none; padding: 8px 16px; border-radius: 50px; font-weight: 600; cursor: pointer; transition: 0.3s; box-shadow: 0 4px 10px rgba(255,255,255,0.1);"><i class="fa-regular fa-copy"></i> Copy</button>
                    </div>
                    <div id="real-prompt" style="color: #e0e0e0; font-family: 'JetBrains Mono', monospace; font-size: 0.95rem; white-space: pre-wrap; line-height: 1.7;"><?php echo htmlspecialchars($prompt['prompt_text']); ?></div>
                </div>

                <div id="lock-overlay" style="position: absolute; inset: 0; top: 40px; background: rgba(10, 10, 10, 0.75); backdrop-filter: blur(10px); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; transition: opacity 0.4s ease, visibility 0.4s;">
                    <div style="width: 100%; max-width: 300px; text-align: center;">
                        <input type="password" id="unlock-pin" placeholder="••••" oninput="checkPinRealtime(this.value)" style="width: 200px; padding: 15px; border-radius: 50px; border: 1px solid rgba(255,255,255,0.15); background: rgba(0,0,0,0.8); color: white; text-align: center; letter-spacing: 6px; font-weight: bold; outline: none; transition: 0.3s; font-size: 1.1rem; box-shadow: inset 0 2px 5px rgba(0,0,0,0.5);">
                        <p id="pin-error" style="color: #ff4444; margin-top: 10px; display: none; font-weight: 600; font-size: 0.85rem;">Incorrect PIN!</p>
                        
                        <?php if (!empty($prompt['ig_link'])): ?>
                            <a href="<?php echo htmlspecialchars($prompt['ig_link']); ?>" target="_blank" style="margin-top: 20px; font-size: 0.9rem; color: #a3a3a3; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.3s;" onmouseover="this.style.color='#e91e63'" onmouseout="this.style.color='#a3a3a3'">
                                <i class="fa-brands fa-instagram"></i> Get PIN from Reel
                            </a>
                        <?php endif; ?>
                    </div>
                </div>

            <?php else: ?>
                <div style="padding: 30px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="color: #10a37f; font-size: 1.2rem;"><i class="fa-solid fa-unlock"></i> Unlocked</h3>
                        <button onclick="copyRealText()" id="copyBtn" style="background: white; color: black; border: none; padding: 8px 16px; border-radius: 50px; font-weight: 600; cursor: pointer; transition: 0.3s; box-shadow: 0 4px 10px rgba(255,255,255,0.1);"><i class="fa-regular fa-copy"></i> Copy</button>
                    </div>
                    <div id="real-prompt" style="color: #e0e0e0; font-family: 'JetBrains Mono', monospace; font-size: 0.95rem; white-space: pre-wrap; line-height: 1.7;"><?php echo htmlspecialchars($prompt['prompt_text']); ?></div>
                </div>
            <?php endif; ?>
        </div>
    <?php endif; ?>

    <?php if (!empty($prompt['description'])): ?>
        <div class="rich-content">
            <?php echo $prompt['description']; ?>
        </div>
    <?php else: ?>
        <p style="color: var(--text-secondary); font-size: 1.05rem;">Enjoy this premium AI prompt!</p>
    <?php endif; ?>

</div>

<script>
    const correctPin = "<?php echo addslashes($prompt['password']); ?>";

    function checkPinRealtime(val) {
        const inputField = document.getElementById('unlock-pin');
        const errorMsg = document.getElementById('pin-error');
        
        errorMsg.style.display = 'none';
        inputField.style.borderColor = 'rgba(255,255,255,0.15)';

        if (val.trim() === correctPin && correctPin !== '') {
            inputField.blur();
            inputField.style.borderColor = '#10a37f';
            
            try { confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#e50914', '#14b8a6', '#ffffff'], zIndex: 9999 }); } catch(e) {}

            document.getElementById('lock-overlay').style.opacity = '0';
            document.getElementById('lock-overlay').style.visibility = 'hidden';
            
            setTimeout(() => {
                document.getElementById('blurred-text').style.display = 'none';
                const realContainer = document.getElementById('real-text-container');
                realContainer.style.display = 'block';
                realContainer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500 });
                
                fetch('view.php?id=<?php echo urlencode($id); ?>', {
                    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'ajax_unlock=1&pin=' + encodeURIComponent(val)
                });
            }, 300);

        } else if (val.trim().length >= correctPin.length && val.trim().length > 0) {
            errorMsg.style.display = 'block';
            inputField.style.borderColor = '#ff4444';
        }
    }

    function copyRealText() {
        navigator.clipboard.writeText(document.getElementById('real-prompt').innerText).then(() => {
            const btn = document.getElementById('copyBtn');
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
            btn.style.background = '#10a37f'; btn.style.color = 'white';
            setTimeout(() => { btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy'; btn.style.background = 'white'; btn.style.color = 'black'; }, 2000);
        });
    }
</script>

<?php include 'footer.php'; ?>
