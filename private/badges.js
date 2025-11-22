// badges.js
const badgeManager = {
    // --- ICONS (SVG Paths) ---
    icons: {
        sql: '<path fill="white" opacity="0.9" d="M12 3C7.58 3 4 4.34 4 6v12c0 1.66 3.58 3 8 3s8-1.34 8-3V6c0-1.66-3.58-3-8-3zm0 16c-3.74 0-7-1.06-7-2.5V14c1.48 1.2 4.07 2 7 2s5.52-.8 7-2v1.5c0 1.44-3.26 2.5-7 2.5zm0-5c-3.74 0-7-1.06-7-2.5V9c1.48 1.2 4.07 2 7 2s5.52-.8 7-2v1.5c0 1.44-3.26 2.5-7 2.5zM12 5c3.74 0 7 1.06 7 2.5S15.74 10 12 10 5 8.94 5 7.5 8.26 5 12 5z"/>',
        python: '<path fill="white" opacity="0.9" d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>'
    },

    // --- BADGE DEFINITIONS ---
    badges: [
        // === TRACK BADGES (Milestones) ===
        { id: 'sql_novice', type: 'track', target: 'sql', count: 1, title: 'SQL Novice', color: '#60A5FA' },
        { id: 'sql_inter',  type: 'track', target: 'sql', count: 10, title: 'SQL Analyst', color: '#3B82F6' },
        { id: 'sql_expert', type: 'track', target: 'sql', count: 25, title: 'SQL Master', color: '#1E40AF' },
        { id: 'py_novice',  type: 'track', target: 'python', count: 1, title: 'Python Starter', color: '#FCD34D' },
        { id: 'py_inter',   type: 'track', target: 'python', count: 10, title: 'Python Coder', color: '#F59E0B' },
        { id: 'py_expert',  type: 'track', target: 'python', count: 25, title: 'Algo Expert', color: '#B45309' },

        // === TOPIC BADGES (SQL) ===
        { id: 't_select',   type: 'topic', track: 'sql', target: 'Basic Select',    count: 3, title: 'Select Starter',    color: '#6366F1' }, // Indigo
        { id: 't_where',    type: 'topic', track: 'sql', target: 'Where',           count: 3, title: 'Filter Specialist', color: '#8B5CF6' }, // Violet
        { id: 't_agg',      type: 'topic', track: 'sql', target: 'Aggregation',     count: 3, title: 'Aggregation Pro',   color: '#EC4899' }, // Pink
        { id: 't_order',    type: 'topic', track: 'sql', target: 'Order BY',        count: 3, title: 'Sorting Star',      color: '#14B8A6' }, // Teal
        { id: 't_distinct', type: 'topic', track: 'sql', target: 'Distinct',        count: 3, title: 'Unique Mind',       color: '#06B6D4' }, // Cyan
        { id: 't_join',     type: 'topic', track: 'sql', target: 'Join',            count: 3, title: 'Join Connector',    color: '#3B82F6' }, // Blue
        { id: 't_group',    type: 'topic', track: 'sql', target: 'Group By',        count: 3, title: 'Group By Guru',     color: '#8B5CF6' }, // Purple
        { id: 't_string',   type: 'topic', track: 'sql', target: 'String Function', count: 3, title: 'String Wizard',     color: '#D946EF' }, // Fuchsia
        { id: 't_null',     type: 'topic', track: 'sql', target: 'Null Handling',   count: 3, title: 'Null Ninja',        color: '#64748B' }, // Slate
        { id: 't_date',     type: 'topic', track: 'sql', target: 'Date Function',   count: 3, title: 'Time Traveler',     color: '#F43F5E' }, // Rose
        { id: 't_having',   type: 'topic', track: 'sql', target: 'Having',          count: 3, title: 'Condition Pro',     color: '#F97316' }, // Orange
        { id: 't_mixed',    type: 'topic', track: 'sql', target: 'Mixed',           count: 3, title: 'Problem Solver',    color: '#10B981' }, // Emerald

        // === TOPIC BADGES (PYTHON) ===
        { id: 't_func',     type: 'topic', track: 'python', target: 'Function',      count: 3, title: 'Function Master',   color: '#EAB308' }  // Yellow
    ],

    // --- SVG GENERATOR (With Dynamic Icons) ---
    generateSVG(badge, userName) {
        // Select icon based on track (sql vs python)
        // We assume 'track' property exists on topic badges or we infer from target
        let iconPath = this.icons.sql; // default
        if (badge.track === 'python' || badge.target === 'python') {
            iconPath = this.icons.python;
        }

        return `
        <svg width="300" height="150" xmlns="http://www.w3.org/2000/svg" style="background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <defs>
                <linearGradient id="grad_${badge.id}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:${badge.color};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#111827;stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#grad_${badge.id})" rx="10" ry="10"/>
            
            <g transform="translate(240, 10) scale(2)" opacity="0.1">
                ${iconPath}
            </g>

            <text x="15" y="25" font-family="Arial, sans-serif" font-size="10" fill="white" opacity="0.8">POWERED BY LETSBEANALYST</text>
            
            <g transform="translate(138, 40) scale(1.5)">
                 ${iconPath}
            </g>

            <text x="50%" y="85" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="white" style="text-shadow: 0 2px 4px rgba(0,0,0,0.3);">${badge.title}</text>
            
            <text x="50%" y="115" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="white" opacity="0.9">Awarded to: ${userName}</text>
        </svg>`.trim();
    },

    render(history) {
        const container = document.getElementById('badges-container');
        if (!container) return;

        // 1. Calculate Counts (Tracks & Topics)
        const counts = { tracks: {}, topics: {} };
        const passedIds = new Set();
        
        history.forEach(h => {
            if (h.status === 'Passed' && !passedIds.has(h.problemId)) {
                passedIds.add(h.problemId);
                
                // Count Track
                const track = h.track || 'unknown';
                counts.tracks[track] = (counts.tracks[track] || 0) + 1;

                // Count Topic (Look up in global problemsDB)
                if (typeof problemsDB !== 'undefined') {
                    const problem = problemsDB.find(p => String(p.id) === String(h.problemId));
                    if (problem && problem.topic) {
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
                return (counts.topics[b.target] || 0) >= b.count;
            }
            return false;
        });

        if (earned.length === 0) {
            container.innerHTML = `
                <div class="p-6 text-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                    <p class="text-gray-500 dark:text-gray-400 text-sm">Solve problems to earn branded badges!</p>
                </div>`;
            return;
        }

        // 3. Render
        const userName = app.state.user ? app.state.user.displayName : 'Student';
        
        let html = `
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Your Certifications</h3>
                <span class="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full font-bold border border-blue-200 dark:border-blue-800">${earned.length} Earned</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        `;

        earned.forEach(b => {
            const svg = this.generateSVG(b, userName);
            const base64 = btoa(unescape(encodeURIComponent(svg)));
            const imgSrc = `data:image/svg+xml;base64,${base64}`;

            html += `
                <div class="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition group">
                    <div class="mb-3 overflow-hidden rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 relative group-hover:border-blue-200 dark:group-hover:border-blue-800 transition">
                        <img src="${imgSrc}" class="w-full h-auto object-contain shadow-inner transform group-hover:scale-105 transition duration-500" alt="${b.title}">
                    </div>
                    <div class="flex gap-2 mt-2">
                        <button onclick="badgeManager.copyImage('${imgSrc}')" class="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 rounded transition flex items-center justify-center gap-1.5">
                            <i class="fa-regular fa-copy"></i> Copy
                        </button>
                        <button onclick="badgeManager.shareBadge('${b.title}', '${imgSrc}')" class="flex-1 px-3 py-2 bg-[#0077b5] hover:bg-[#006396] text-white text-xs font-bold rounded transition text-center flex items-center justify-center gap-1.5 shadow-sm">
                            <i class="fa-brands fa-linkedin"></i> Post
                        </button>
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
            await navigator.clipboard.write([ new ClipboardItem({ 'image/png': blob }) ]);
            
            // Visual Feedback
            const btn = event.target.closest('button');
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-check text-green-500"></i> Copied!';
            btn.classList.add('bg-green-50', 'dark:bg-green-900/20', 'text-green-600', 'dark:text-green-400');
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.classList.remove('bg-green-50', 'dark:bg-green-900/20', 'text-green-600', 'dark:text-green-400');
            }, 2000);
        } catch (err) {
            alert("Right-click image -> Copy Image");
        }
    },

    async shareBadge(title, imgSrc) {
        // 1. Auto Copy First
        try {
            const response = await fetch(imgSrc);
            const blob = await response.blob();
            await navigator.clipboard.write([ new ClipboardItem({ 'image/png': blob }) ]);
            alert(`Step 1: Badge copied to clipboard! 📋\nStep 2: LinkedIn will open now.\nStep 3: Press Ctrl+V (Paste) in your post.`);
        } catch (e) {
            alert("Could not auto-copy. Please Right-Click Badge -> Copy Image, then click Post again.");
            return;
        }

        // 2. Open LinkedIn
        const text = `Excited to earn the ${title} badge on DataDrill by LetsBeAnalyst! 🚀\n\nConsistently practicing to master ${title.includes('SQL') ? 'SQL' : 'Python'} analytics.\n\n#DataScience #SQL #Python #Learning #DataDrill #LetsBeAnalyst`;
        const url = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    }
};