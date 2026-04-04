<?php
require_once 'db.php';
include 'header.php';

$msg = "";
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // In a real scenario, you would use mail() or save to a database
    $msg = "Thank you! Your message has been sent successfully.";
}
?>

<div class="container">
    <div class="pro-card" style="max-width: 600px; margin: 60px auto; padding: 40px; display: block; opacity: 1; transform: none;">
        <h1 style="font-size: 2rem; margin-bottom: 10px; color: white;">Get in Touch</h1>
        <p style="color: var(--text-secondary); margin-bottom: 30px;">Have a question or a custom prompt request? Send us a message.</p>

        <?php if($msg): ?>
            <div style="background: rgba(16, 163, 127, 0.1); color: #10a37f; padding: 15px; border-radius: 10px; border: 1px solid #10a37f; margin-bottom: 25px;">
                <i class="fa-solid fa-circle-check"></i> <?php echo $msg; ?>
            </div>
        <?php endif; ?>

        <form method="POST" style="display: flex; flex-direction: column; gap: 20px;">
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <label style="font-size: 0.9rem; font-weight: 600; color: var(--text-secondary);">Full Name</label>
                <input type="text" required style="padding: 14px; border-radius: 12px; border: 1px solid var(--border-color); background: var(--surface-light); color: white; outline: none;">
            </div>

            <div style="display: flex; flex-direction: column; gap: 8px;">
                <label style="font-size: 0.9rem; font-weight: 600; color: var(--text-secondary);">Email Address</label>
                <input type="email" required style="padding: 14px; border-radius: 12px; border: 1px solid var(--border-color); background: var(--surface-light); color: white; outline: none;">
            </div>

            <div style="display: flex; flex-direction: column; gap: 8px;">
                <label style="font-size: 0.9rem; font-weight: 600; color: var(--text-secondary);">Message</label>
                <textarea required style="padding: 14px; border-radius: 12px; border: 1px solid var(--border-color); background: var(--surface-light); color: white; outline: none; min-height: 120px; resize: vertical;"></textarea>
            </div>

            <button type="submit" class="btn-token" style="padding: 16px; font-size: 1rem; margin-top: 10px;">
                <i class="fa-solid fa-paper-plane"></i> Send Message
            </button>
        </form>
    </div>
</div>

<?php include 'footer.php'; ?>
