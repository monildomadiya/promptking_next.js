<style>
    .mobile-bottom-nav { display: flex; position: fixed; bottom: 0; left: 0; width: 100%; height: var(--app-bottom-nav-height); background: rgba(18, 18, 18, 0.95); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); border-top: 1px solid var(--border-color); justify-content: space-around; align-items: center; z-index: 2000; padding-bottom: env(safe-area-inset-bottom); }
    @media (min-width: 768px) { .mobile-bottom-nav { display: none; } }
    
    .nav-item { color: var(--text-secondary); font-size: 1.2rem; display: flex; flex-direction: column; align-items: center; gap: 4px; transition: 0.3s; }
    .nav-item span { font-size: 0.65rem; font-weight: 600; }
    .nav-item.active { color: var(--accent-main); transform: translateY(-3px); }
</style>

<div class="mobile-bottom-nav">
    <a href="index.php" class="nav-item <?php echo basename($_SERVER['PHP_SELF']) == 'index.php' ? 'active' : ''; ?>">
        <i class="fa-solid fa-house"></i><span>Home</span>
    </a>
    <a href="blog.php" class="nav-item <?php echo basename($_SERVER['PHP_SELF']) == 'blog.php' ? 'active' : ''; ?>">
        <i class="fa-solid fa-book-open"></i><span>Blog</span>
    </a>
    <a href="javascript:void(0)" onclick="window.isLoggedIn ? openProfileModal() : window.loginWithGoogle()" class="nav-item">
        <i class="fa-solid fa-user"></i><span>Profile</span>
    </a>
</div>

<footer style="padding: 40px 20px; text-align: center; color: var(--text-secondary); font-size: 0.85rem; border-top: 1px solid var(--border-color); margin-top: auto; background: var(--bg-color);">
    <div style="margin-bottom: 15px; display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">
        <a href="about.php">About Us</a>
        <a href="blog.php">Blog</a>
        <a href="privacy.php">Privacy Policy</a>
        <a href="terms.php">Terms & Conditions</a>
        <a href="disclaimer.php">Disclaimer</a>
    </div>
    <p>&copy; <?php echo date("Y"); ?> PromptKing. All rights reserved.</p>
</footer>

<script>
    let currentCategory = 'all';

    function setFilter(category, btnElement) {
        currentCategory = category;
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        btnElement.classList.add('active');
        filterCards();
    }

    function filterCards() {
        const searchQuery = document.getElementById('searchInput').value.toLowerCase().trim();
        const cards = document.querySelectorAll('.pro-card');
        let visibleCount = 0;

        cards.forEach(card => {
            const titleElement = card.querySelector('.card-title');
            if(!titleElement) return; 

            const title = titleElement.innerText.toLowerCase();
            const cardCategory = card.getAttribute('data-category');
            const isLiked = card.getAttribute('data-liked') === 'true'; 
            
            const matchesSearch = title.includes(searchQuery);
            let matchesCategory = false;
            if (currentCategory === 'all') { matchesCategory = true; } 
            else if (currentCategory === 'liked') { matchesCategory = isLiked; } 
            else { matchesCategory = cardCategory.includes(currentCategory); }

            if (matchesSearch && matchesCategory) {
                card.style.display = ''; visibleCount++;
            } else { card.style.display = 'none'; }
        });
        
        let emptyState = document.getElementById('emptyStateMsg');
        if(visibleCount === 0 && currentCategory === 'liked') {
            if(!emptyState) {
                emptyState = document.createElement('p');
                emptyState.id = 'emptyStateMsg';
                emptyState.style = 'color: gray; text-align: center; grid-column: 1/-1; padding: 40px;';
                emptyState.innerText = "You haven't liked any prompts yet!";
                document.getElementById('cardContainer').appendChild(emptyState);
            }
            emptyState.style.display = 'block';
        } else if(emptyState) { emptyState.style.display = 'none'; }
    }

    function updateSlider(id, value) {
        const beforeImg = document.getElementById('before-' + id);
        const line = document.getElementById('line-' + id);
        if(beforeImg && line) {
            beforeImg.style.clipPath = `inset(0 ${100 - value}% 0 0)`;
            beforeImg.style.webkitClipPath = `inset(0 ${100 - value}% 0 0)`;
            line.style.left = value + '%';
        }
    }

    function triggerBoxConfetti(boxElement) {
        try {
            const rect = boxElement.getBoundingClientRect();
            const originX = (rect.left + (rect.width / 2)) / window.innerWidth;
            const originY = (rect.top + (rect.height / 2)) / window.innerHeight;
            confetti({ particleCount: 120, spread: 80, origin: { x: originX, y: originY }, colors: ['#e50914', '#14b8a6', '#ffffff'], zIndex: 9999 }); 
        } catch(e) {}
    }

    function checkAutoUnlock(key, correctPin, typedValue) {
        const box = document.getElementById('box-' + key);
        const errorMsg = document.getElementById('error-' + key);
        const inputField = document.getElementById('input-' + key);
        
        errorMsg.style.display = 'none';
        inputField.style.borderColor = 'rgba(255,255,255,0.15)';

        if (typedValue.trim() === correctPin.trim() && correctPin.trim() !== '') {
            inputField.blur(); 
            inputField.style.borderColor = '#10a37f';
            box.classList.add('unlocked');
            triggerBoxConfetti(box); 
        } else if (typedValue.trim().length >= correctPin.trim().length && typedValue.trim() !== '') {
            errorMsg.style.display = 'block';
            inputField.style.borderColor = '#ff4444';
        }
    }

    function copyHomeText(key) {
        const text = document.getElementById('text-' + key).innerText;
        navigator.clipboard.writeText(text).then(() => {
            const btn = document.getElementById('copy-' + key);
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
            btn.style.background = '#10a37f'; btn.style.color = 'white';
            setTimeout(() => { btn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy Prompt'; btn.style.background = 'white'; btn.style.color = 'black'; }, 2000);
        });
    }

    function toggleLike(promptKey, iconElement) {
        if (!window.isLoggedIn) {
            if(typeof window.loginWithGoogle === 'function') { window.loginWithGoogle(); } else { alert("Please sign in to like prompts."); }
            return;
        }

        const isCurrentlyLiked = iconElement.classList.contains('fa-solid');
        const cardElement = iconElement.closest('.pro-card'); 
        
        if (isCurrentlyLiked) {
            iconElement.classList.remove('fa-solid'); iconElement.classList.add('fa-regular');
            iconElement.style.color = 'var(--text-secondary)';
            if(cardElement) cardElement.setAttribute('data-liked', 'false'); 
        } else {
            iconElement.classList.remove('fa-regular'); iconElement.classList.add('fa-solid');
            iconElement.style.color = 'var(--accent-main)';
            if(cardElement) cardElement.setAttribute('data-liked', 'true'); 
        }
        
        if(currentCategory === 'liked' && isCurrentlyLiked) { filterCards(); }

        fetch('api.php?action=toggle_like', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: promptKey }) })
        .then(response => response.json()).then(data => {
            if(data.error) {
                if (isCurrentlyLiked) {
                    iconElement.classList.remove('fa-regular'); iconElement.classList.add('fa-solid');
                    iconElement.style.color = 'var(--accent-main)'; if(cardElement) cardElement.setAttribute('data-liked', 'true');
                } else {
                    iconElement.classList.remove('fa-solid'); iconElement.classList.add('fa-regular');
                    iconElement.style.color = 'var(--text-secondary)'; if(cardElement) cardElement.setAttribute('data-liked', 'false');
                }
                alert("Something went wrong saving your like.");
            }
        });
    }
</script>
</body>
</html>
