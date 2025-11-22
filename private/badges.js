// badges.js
const badgeManager = {
    // DEFINITIONS
    badges: [
        // --- TRACK BADGES ---
        { id: 'sql_novice', type: 'track', target: 'sql', count: 1, title: 'SQL Novice', color: '#60A5FA' },
        { id: 'sql_intermediate', type: 'track', target: 'sql', count: 10, title: 'SQL Analyst', color: '#3B82F6' },
        { id: 'sql_expert', type: 'track', target: 'sql', count: 25, title: 'SQL Master', color: '#1E40AF' },
        { id: 'py_novice', type: 'track', target: 'python', count: 1, title: 'Python Starter', color: '#FCD34D' },
        { id: 'py_intermediate', type: 'track', target: 'python', count: 10, title: 'Python Coder', color: '#F59E0B' },
        { id: 'py_expert', type: 'track', target: 'python', count: 25, title: 'Algo Expert', color: '#B45309' },
        
        // --- TOPIC BADGES (Examples - Add more based on your DB topics) ---
        { id: 'topic_joins', type: 'topic', target: 'Group By', count: 3, title: 'Join Specialist', color: '#8B5CF6' }, // Purple
        { id: 'topic_agg', type: 'topic', target: 'Aggregations', count: 3, title: 'Aggregation Pro', color: '#EC4899' }, // Pink
        { id: 'topic_arrays', type: 'topic', target: 'Arrays', count: 3, title: 'Array Ninja', color: '#10B981' }    // Emerald
    ],

    // GENERATE SVG (Unchanged visual, just template)
    generateSVG(badge, userName) {
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

        // 1. Calculate Counts (Tracks & Topics)
        const counts = { tracks: {}, topics: {} };
        const passedIds = new Set();
        
        history.forEach(h => {
            // Only count unique passed problems
            if (h.status === 'Passed' && !passedIds.has(h.problemId)) {
                passedIds.add(h.problemId);
                
                // Count Track
                const track = h.track || 'unknown';
                counts.tracks[track] = (counts.tracks[track] || 0) + 1;

                // Count Topic (Look up in global problemsDB)
                if (typeof problemsDB !== 'undefined') {
                    const problem = problemsDB.find(p => String(p.id) === String(h.problemId));
                    if (problem && problem.topic) {
                        // Normalize topic (trim spaces)
                        const topicName = problem.topic.trim();
                        counts.topics[topicName] = (counts.topics[topicName] || 0) + 1;
                    }
                }
            }
        });

        // 2. Determine Earned Badges
        const earned = this.badges.filter(b => {
            if (b.type === 'track') {
                return (counts.tracks[b.target] || 0) >= b.count;
            }
            if (b.type === 'topic') {
                // Check exact topic match
                return (counts.topics[b.target] || 0) >= b.count;
            }
            return false;
        });

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
                <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-bold">${earned.length} Earned</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        `;

        earned.forEach(b => {
            const svg = this.generateSVG(b, userName);
            const base64 = btoa(unescape(encodeURIComponent(svg)));
            const imgSrc = `data:image/svg+xml;base64,${base64}`;

            // Updated LinkedIn Share Button Logic
            html += `
                <div class="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition group">
                    <div class="mb-3 overflow-hidden rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <img src="${imgSrc}" class="w-full h-auto object-contain shadow-inner" alt="${b.title}">
                    </div>
                    <div class="flex gap-2 mt-2">
                        <button onclick="badgeManager.copyImage('${imgSrc}')" class="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 rounded transition flex items-center justify-center gap-2">
                            <i class="fa-regular fa-copy"></i> Copy
                        </button>
                        <button onclick="badgeManager.shareBadge('${b.title}', '${imgSrc}')" class="flex-1 px-3 py-2 bg-[#0077b5] hover:bg-[#006396] text-white text-xs font-bold rounded transition text-center flex items-center justify-center gap-2">
                            <i class="fa-brands fa-linkedin"></i> Post
                        </button>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    },

    // Copy to Clipboard (Utility)
    async copyImage(src) {
        try {
            const response = await fetch(src);
            const blob = await response.blob();
            await navigator.clipboard.write([ new ClipboardItem({ 'image/png': blob }) ]);
            // Use simple toast or alert
            const btn = event.target.closest('button');
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
            setTimeout(() => btn.innerHTML = originalHTML, 2000);
        } catch (err) {
            alert("Right-click image -> Copy Image");
        }
    },

    // NEW: Smart LinkedIn Share Flow
    async shareBadge(title, imgSrc) {
        // 1. Copy Image First
        try {
            const response = await fetch(imgSrc);
            const blob = await response.blob();
            await navigator.clipboard.write([ new ClipboardItem({ 'image/png': blob }) ]);
            alert(`Image Copied! 📋\n\n1. LinkedIn will open.\n2. Paste (Ctrl+V) the image into your post.\n3. Share your success!`);
        } catch (e) {
            alert("Could not auto-copy image. Please right-click the badge, 'Copy Image', then click Share again.");
            return;
        }

        // 2. Open LinkedIn with Pre-filled Text
        const text = `I just earned the ${title} certification on DataDrill by LetsBeAnalyst! 🚀\n\nPracticing SQL and Python daily to master data analytics.\n\n#DataScience #SQL #Python #Learning #DataDrill`;
        const url = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    }
};