<?php
session_start();
$conn = new mysqli('107.172.39.165', 'pma_admin', 'Pk_Pma@2024Secure!', 'promptking');
if ($conn->connect_error) { die("Connection failed."); }
include 'header.php';
?>

<div style="max-width: 1200px; margin: 40px auto; padding: 20px; width: 100%;">
    
    <div style="text-align: center; margin-bottom: 50px;">
        <h1 style="font-size: 2.8rem; margin-bottom: 10px; color: white;">The <span style="color: var(--accent-main);">PromptKing</span> Blog</h1>
        <p style="color: var(--text-secondary); font-size: 1.1rem; max-width: 600px; margin: 0 auto;">Read our latest tutorials, insights, and AI generation strategies to level up your workflow.</p>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 30px;">
        <?php
        $result = $conn->query("SELECT * FROM blogs ORDER BY created_at DESC");
        
        if ($result && $result->num_rows > 0) {
            while($row = $result->fetch_assoc()) {
                $img = !empty($row['featured_image']) ? htmlspecialchars($row['featured_image']) : 'https://via.placeholder.com/600x400/121212/ffffff?text=PromptKing+Article';
                
                echo '
                <a href="article.php?id='.$row['id'].'" style="background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 20px; overflow: hidden; display: flex; flex-direction: column; transition: 0.3s; text-decoration: none;" onmouseover="this.style.transform=\'translateY(-8px)\'; this.style.borderColor=\'rgba(255,255,255,0.3)\'; this.style.boxShadow=\'0 15px 35px rgba(0,0,0,0.6)\'" onmouseout="this.style.transform=\'translateY(0)\'; this.style.borderColor=\'var(--border-color)\'; this.style.boxShadow=\'none\'">
                    
                    <div style="width: 100%; height: 220px; overflow: hidden;">
                        <img src="'.$img.'" style="width: 100%; height: 100%; object-fit: cover; transition: 0.5s;" onmouseover="this.style.transform=\'scale(1.05)\'" onmouseout="this.style.transform=\'scale(1)\'" loading="lazy">
                    </div>
                    
                    <div style="padding: 25px; flex: 1; display: flex; flex-direction: column;">
                        <div style="display: flex; gap: 15px; margin-bottom: 12px; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                            <span style="color: var(--accent-main);"><i class="fa-solid fa-calendar" style="margin-right: 4px;"></i> '.date("M d, Y", strtotime($row['created_at'])).'</span>
                        </div>
                        
                        <h2 style="font-size: 1.3rem; color: white; margin-bottom: 15px; line-height: 1.4;">'.htmlspecialchars($row['title']).'</h2>
                        <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6; margin-bottom: 25px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">'.htmlspecialchars(strip_tags($row['content'])).'</p>
                        <span style="color: white; font-weight: 600; font-size: 0.9rem; margin-top: auto; display: flex; align-items: center; gap: 8px;">Read Full Article <i class="fa-solid fa-arrow-right" style="font-size: 0.8rem; color: var(--accent-main);"></i></span>
                    </div>
                </a>';
            }
        } else {
            echo "<div style='grid-column: 1/-1; padding: 60px; text-align: center; background: var(--surface-color); border: 1px dashed var(--border-color); border-radius: 20px;'><i class='fa-solid fa-pen-nib' style='font-size: 3rem; color: var(--text-secondary); margin-bottom: 20px;'></i><h3 style='color: white; font-size: 1.5rem; margin-bottom: 10px;'>No Articles Yet</h3><p style='color: var(--text-secondary);'>Check back soon for the latest AI generation strategies!</p></div>";
        }
        ?>
    </div>
</div>

<?php include 'footer.php'; ?>
