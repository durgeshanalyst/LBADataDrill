// badges.js
const badgeManager = {
    badges: [
        { id: 'sql_novice', track: 'sql', count: 1, title: 'SQL Novice', color: '#60A5FA' }, // Blue
        { id: 'sql_intermediate', track: 'sql', count: 10, title: 'SQL Analyst', color: '#3B82F6' },
        { id: 'sql_expert', track: 'sql', count: 25, title: 'SQL Master', color: '#1E40AF' },
        { id: 'py_novice', track: 'python', count: 1, title: 'Python Starter', color: '#FCD34D' }, // Yellow
        { id: 'py_intermediate', track: 'python', count: 10, title: 'Python Coder', color: '#F59E0B' },
        { id: 'py_expert', track: 'python', count: 25, title: 'Algo Expert', color: '#B45309' }
    ],

    generateSVG(badge, userName) {
        // SVG Template with Branding
        return `
        <svg width="300" height="150" xmlns="http://www.w3.org/2000/svg" style="background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <defs>
                <linearGradient id="grad_${badge.id}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:${badge.color};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#111827;stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#grad_${badge.id})" rx="10" ry="10"/>
            
            <text x="15" y="25" font-family="Arial, sans-serif" font-size="10" fill="white" opacity="0.8">POWERED BY LETSBEANALYST</text>
            
            <text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white">${badge.title}</text>
            
            <text x="50%" y="80%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="white">Awarded to: ${userName}</text>
            
            <circle cx="260" cy="30" r="15" fill="white" opacity="0.2"/>
            <text x="260" y="34" text-anchor="middle" font-size="14" fill="white">★</text>
        </svg>`.trim();
    },

    render(history) {
        const container = document.getElementById('badges-container');
        if (!container) return;

        // 1. Calculate Counts
        const counts = { sql: 0, python: 0 };
        const passedIds = new Set();
        
        history.forEach(h => {
            if (h.status === 'Passed' && !passedIds.has(h.problemId)) {
                passedIds.add(h.problemId);
                if (h.track === 'sql' || h.track === 'python') {
                    counts[h.track]++;
                }
            }
        });

        // 2. Determine Earned Badges
        const earned = this.badges.filter(b => counts[b.track] >= b.count);

        if (earned.length === 0) {
            container.innerHTML = `
                <div class="p-6 text-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                    <p class="text-gray-500">Solve problems to earn branded badges!</p>
                </div>`;
            return;
        }

        // 3. Render
        const userName = app.state.user ? app.state.user.displayName : 'Student';
        
        let html = `
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Your Certifications</h3>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        `;

        earned.forEach(b => {
            const svg = this.generateSVG(b, userName);
            // Convert SVG to Base64 for Image Source
            const base64 = btoa(unescape(encodeURIComponent(svg)));
            const imgSrc = `data:image/svg+xml;base64,${base64}`;

            html += `
                <div class="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition group">
                    <div class="mb-3 overflow-hidden rounded-lg border border-gray-100 dark:border-gray-700">
                        <img src="${imgSrc}" class="w-full h-auto object-contain" alt="${b.title}">
                    </div>
                    <div class="flex gap-2 mt-2">
                        <button onclick="badgeManager.copyImage('${imgSrc}')" class="flex-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 rounded transition">
                            <i class="fa-regular fa-copy"></i> Signature
                        </button>
                        <a href="https://www.linkedin.com/feed/?shareActive=true&text=I%20just%20earned%20the%20${encodeURIComponent(b.title)}%20badge%20on%20DataDrill%20by%20LetsBeAnalyst!%20%23DataScience%20%23Learning" target="_blank" class="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded transition text-center">
                            <i class="fa-brands fa-linkedin"></i> Share
                        </a>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    },

    async copyImage(src) {
        try {
            const response = await fetch(src);
            const blob = await response.blob();
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob }) // Note: Clipboard API often requires PNG, SVG might need conversion logic in production
            ]);
            alert("Badge copied! You can paste it into your email signature.");
        } catch (err) {
            // Fallback for simple SVG copy if ClipboardItem fails (often happens with SVGs directly)
            // Just notify user to Right Click -> Copy Image
            alert("Right-click the badge image and select 'Copy Image' to add it to your email signature.");
        }
    }
};