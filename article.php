<?php
session_start();
$conn = new mysqli('107.172.39.165', 'pma_admin', 'Pk_Pma@2024Secure!', 'promptking');

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;
if ($id === 0) { header("Location: blog.php"); exit; }

$stmt = $conn->prepare("SELECT * FROM blogs WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$blog = $stmt->get_result()->fetch_assoc();

if (!$blog) { header("Location: blog.php"); exit; }
include 'header.php';

// Fetch the Article Page AdSense unit from DB
$adsense_post = '';
$ad_res = $conn->query("SELECT setting_value FROM settings WHERE setting_key='adsense_post'");
if ($ad_res && $ad_res->num_rows > 0) { $adsense_post = $ad_res->fetch_assoc()['setting_value']; }
?>

<style>
    .rich-content { color: var(--text-primary); line-height: 1.8; font-size: 1.1rem; }
    .rich-content p { margin-bottom: 20px; }
    .rich-content a { color: var(--accent-main); text-decoration: underline; transition: 0.3s;}
    .rich-content a:hover { color: white; }
    .rich-content h1, .rich-content h2, .rich-content h3, .rich-content h4 { margin: 35px 0 15px 0; color: white; line-height: 1.3;}
    .rich-content ul, .rich-content ol { margin-left: 20px; margin-bottom: 20px; }
    .rich-content li { margin-bottom: 10px; }
    .rich-content img { max-width: 100%; border-radius: 16px; margin: 25px 0; height: auto; border: 1px solid rgba(255,255,255,0.1); }
    .rich-content pre { background: rgba(0,0,0,0.5); padding: 20px; border-radius: 12px; overflow-x: auto; margin-bottom: 20px; border: 1px solid var(--border-color);}
    .rich-content code { font-family: 'JetBrains Mono', monospace; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 6px; font-size: 0.9em; color: #ffab70;}
    .rich-content blockquote { border-left: 4px solid var(--accent-main); padding-left: 20px; margin-left: 0; font-style: italic; color: #ccc;}
</style>

<div style="max-width: 800px; margin: 40px auto; padding: 20px; width: 100%;">
    <a href="blog.php" style="color: var(--text-secondary); font-weight: 600; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 8px; margin-bottom: 25px; text-decoration: none; transition: 0.3s;" onmouseover="this.style.color='white'" onmouseout="this.style.color='var(--text-secondary)'"><i class="fa-solid fa-arrow-left"></i> Back to Blog Feed</a>

    <h1 style="font-size: 2.5rem; margin-bottom: 15px; line-height: 1.3; color: white; font-weight: 800;"><?php echo htmlspecialchars($blog['title']); ?></h1>
    <div style="display: flex; gap: 20px; color: var(--text-secondary); font-size: 0.95rem; margin-bottom: 30px; border-bottom: 1px solid var(--border-color); padding-bottom: 20px;">
        <span><i class="fa-solid fa-calendar" style="color: var(--accent-main); margin-right: 5px;"></i> <?php echo date("F j, Y", strtotime($blog['created_at'])); ?></span>
        <span><i class="fa-solid fa-user-pen" style="color: var(--accent-main); margin-right: 5px;"></i> PromptKing Admin</span>
    </div>

    <?php if (!empty($blog['featured_image'])): ?>
        <img src="<?php echo htmlspecialchars($blog['featured_image']); ?>" alt="<?php echo htmlspecialchars($blog['title']); ?>" style="width: 100%; border-radius: 20px; margin-bottom: 40px; max-height: 450px; object-fit: cover; border: 1px solid var(--border-color);">
    <?php endif; ?>

    <article class="rich-content"><?php echo $blog['content']; ?></article>

    <?php if(!empty($adsense_post)): ?>
        <div style="margin: 40px auto; max-width: 100%; text-align: center; border-radius: 16px; overflow: hidden;">
            <?php echo $adsense_post; ?>
        </div>
    <?php endif; ?>

    <div style="margin-top: 60px; padding-top: 30px; border-top: 1px solid var(--border-color); text-align: center;">
        <h3 style="color: white; margin-bottom: 15px;">Enjoyed this article?</h3>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">Explore our premium AI prompt database to put these strategies into action.</p>
        <a href="index.php" style="background: var(--accent-main); color: white; padding: 12px 24px; border-radius: 12px; font-weight: 600; text-decoration: none; display: inline-block; transition: 0.3s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">View Prompt Library</a>
    </div>
</div>

<?php include 'footer.php'; ?>
