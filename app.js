// --- APPLICATION LOGIC ---

const app = {
    state: {
        user: null,
        currentTrack: null,
        currentProblem: null,
        filterTopic: 'All',
        filterDifficulty: 'All',
        filterStatus: 'All',
        solvedProblemIds: new Set(), 
        db: null,
        auth: null,
        mode: 'local'
    },

    async init() {
        // Check config
        if (typeof GOOGLE_SHEET_API === 'undefined') {
            alert("CRITICAL: config.js missing or variables undefined.");
            return;
        }

        themeManager.init();
        const editorEl = document.getElementById('code-editor');
        if(editorEl) {
            this.editor = CodeMirror.fromTextArea(editorEl, {
                lineNumbers: true, 
                theme: themeManager.isDark() ? 'dracula' : 'eclipse',
                tabSize: 4, 
                indentUnit: 4, 
                lineWrapping: true
            });
        }

        try {
            if(document.getElementById('problem-list')) document.getElementById('problem-list').innerHTML = '<div class="text-gray-500 p-4">Loading...</div>';
            const response = await fetch(GOOGLE_SHEET_API);
            problemsDB = await response.json();
            this.updateLandingCounts();
            this.initDailyChallenge();

            // --- NEW: DEEP LINKING LOGIC ---
            const hash = window.location.hash;
            if (hash.startsWith('#problem=')) {
                const id = hash.split('=')[1];
                const problem = problemsDB.find(p => String(p.id) === String(id));
                
                if (problem) {
                    // Manually setup track without auto-selecting first problem
                    this.state.currentTrack = problem.type;
                    this.state.filterTopic = 'All';
                    this.state.filterDifficulty = 'All';
                    this.state.filterStatus = 'All';
                    
                    // Render UI
                    this.renderTopicFilters(); 
                    this.applyFilters(); 
                    
                    // Load specific problem & Show View
                    this.loadProblem(id);
                    router.navigate('playground');
                } else {
                    router.navigate('landing');
                }
            } else {
                // Standard Routing
                if (hash === '#leaderboard') router.navigate('leaderboard');
                else if (hash === '#profile') router.navigate('profile');
                else router.navigate('landing');
            }

        } catch (e) {
            console.error("Failed", e);
            if(document.getElementById('problem-list')) document.getElementById('problem-list').innerHTML = '<div class="text-red-500 p-4">Error loading data.</div>';
        }

        this.initEngines();
        this.initAuth();
        ui.initResizers();
        ui.injectSidebarToggle(); 
    },

    updateLandingCounts() {
        const pyCount = problemsDB.filter(p => p.type === 'python').length;
        const sqlCount = problemsDB.filter(p => p.type === 'sql').length;
        const pyEl = document.getElementById('python-count');
        const sqlEl = document.getElementById('sql-count');
        if (pyEl) pyEl.innerText = `${pyCount} Problems`;
        if (sqlEl) sqlEl.innerText = `${sqlCount} Problems`;
    },

    initDailyChallenge() {
        const card = document.getElementById('daily-challenge-card');
        if (!card || problemsDB.length === 0) return;

        const todayStr = new Date().toDateString();
        // Seeded random based on date
        let seed = 0;
        for (let i = 0; i < todayStr.length; i++) seed = seed + todayStr.charCodeAt(i);
        
        const count = 3; 
        const indices = new Set();
        let attempts = 0;
        
        // Simple Linear Congruential Generator
        let random = seed;
        const nextRandom = () => {
            random = (random * 9301 + 49297) % 233280;
            return random;
        };

        // Pick 3 unique problems
        while(indices.size < count && indices.size < problemsDB.length && attempts < 100) {
            const idx = Math.floor(nextRandom() % problemsDB.length);
            indices.add(idx);
            attempts++;
        }

        const dailyProblems = Array.from(indices).map(i => problemsDB[i]);
        
        card.classList.remove('hidden');
        card.className = "w-full max-w-4xl mb-8 rounded-xl p-6 shadow-lg transition bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700";
        card.onclick = null;

        // Generate List HTML with Theme-Aware Colors
        let listHtml = dailyProblems.map(p => {
            const isSolved = this.state.solvedProblemIds.has(p.id);
            const icon = isSolved 
                ? '<i class="fa-solid fa-circle-check text-green-500"></i>' 
                : '<i class="fa-regular fa-circle text-gray-300 dark:text-gray-600"></i>';
            
            return `
                <div onclick="app.selectTrack('${p.type}'); setTimeout(() => app.loadProblem('${p.id}'), 100); event.stopPropagation();" 
                     class="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg cursor-pointer transition border-b border-gray-100 dark:border-gray-700/50 last:border-0 group">
                    <div class="flex items-center gap-3 overflow-hidden">
                        ${icon}
                        <span class="text-sm font-medium truncate text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">${p.title}</span>
                    </div>
                    <span class="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${p.difficulty === 'Easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : p.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}">${p.difficulty}</span>
                </div>
            `;
        }).join('');

        card.innerHTML = `
            <div class="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <i class="fa-solid fa-fire"></i>
                </div>
                <div>
                    <div class="text-xs text-purple-600 dark:text-purple-400 uppercase tracking-wider font-bold">Daily Challenge</div>
                    <div class="text-gray-900 dark:text-white font-bold text-sm">${todayStr}</div>
                </div>
            </div>
            <div class="space-y-1">
                ${listHtml}
            </div>
        `;
    },
    
    loadDailyProblem() { },

    initAuth() {
        if (typeof firebaseConfig !== 'undefined' && firebaseConfig.apiKey && window.firebaseModules) {
            try {
                const fb = window.firebaseModules;
                const appInst = fb.initializeApp(firebaseConfig);
                this.state.auth = fb.getAuth(appInst);
                this.state.db = fb.getFirestore(appInst);
                this.state.mode = 'firebase';
                fb.onAuthStateChanged(this.state.auth, (user) => {
                    this.state.user = user;
                    authManager.updateUI(user);
                    if(user) this.fetchUserProgress();
                });
            } catch(e) { console.error("Firebase Init Failed:", e); }
        } else {
            authManager.checkLocalAuth();
        }
    },

    async fetchUserProgress() {
        if (!this.state.user) return;
        try {
            const history = await persistence.getHistory(this.state.user.uid);
            const solved = new Set();
            history.forEach(sub => {
                if (sub.status === 'Passed') solved.add(sub.problemId);
            });
            this.state.solvedProblemIds = solved;
            if(this.state.currentTrack) this.applyFilters();
            this.initDailyChallenge(); 
        } catch(e) {
            console.error("Error fetching progress", e);
        }
    },

    async initEngines() {
        if (!window.pyodide && typeof loadPyodide !== 'undefined') {
            try { window.pyodide = await loadPyodide(); } catch (e) { }
        }
    },

    selectTrack(track) {
        this.state.currentTrack = track;
        if(typeof starManager !== 'undefined') starManager.render();
        this.state.filterTopic = 'All';
        this.state.filterDifficulty = 'All';
        this.state.filterStatus = 'All';
        
        const navDiff = document.getElementById('nav-difficulty');
        if(navDiff) navDiff.value = 'All';
        
        this.renderTopicFilters(); 
        this.applyFilters(); 
        
        const filtered = this.getFilteredProblems();
        if(filtered.length > 0) {
            this.loadProblem(filtered[0].id);
        }
        
        router.navigate('playground');
        setTimeout(() => { if(this.editor) this.editor.refresh(); }, 100);
    },

    setDifficulty(level) {
        this.state.filterDifficulty = level;
        this.applyFilters();
    },

    setTopic(topic) {
        this.state.filterTopic = topic;
        this.applyFilters();
    },

    setStatus(status) {
        this.state.filterStatus = status;
        this.applyFilters();
    },

    applyFilters() {
        const problems = this.getFilteredProblems();
        this.renderSidebar(problems);
    },

    getFilteredProblems() {
        return problemsDB.filter(p => {
            const matchType = p.type === this.state.currentTrack;
            const matchDiff = this.state.filterDifficulty === 'All' || p.difficulty === this.state.filterDifficulty;
            const matchTopic = this.state.filterTopic === 'All' || p.topic === this.state.filterTopic;
            
            let matchStatus = true;
            const isSolved = this.state.solvedProblemIds.has(p.id);
            if (this.state.filterStatus === 'Solved') matchStatus = isSolved;
            if (this.state.filterStatus === 'Unsolved') matchStatus = !isSolved;

            return matchType && matchDiff && matchTopic && matchStatus;
        });
    },

    renderTopicFilters() {
        const select = document.getElementById('topic-select');
        if(!select) return;
        select.innerHTML = '';

        const trackProblems = problemsDB.filter(p => p.type === this.state.currentTrack);
        const topics = new Set();
        trackProblems.forEach(p => { if (p.topic) topics.add(p.topic); });
        
        const sortedTopics = Array.from(topics).sort();
        const allOptions = ['All', ...sortedTopics];

        allOptions.forEach(topic => {
            const option = document.createElement('option');
            option.value = topic;
            option.innerText = topic === 'All' ? 'All Topics' : topic;
            if (topic === this.state.filterTopic) option.selected = true;
            select.appendChild(option);
        });
    },

    renderSidebar(problems) {
        const list = document.getElementById('problem-list');
        if(!list) return;
        list.innerHTML = '';
        if (problems.length === 0) {
            list.innerHTML = '<div class="p-4 text-xs text-gray-500 italic">No problems match filters.</div>';
            return;
        }
        problems.forEach(p => {
            const item = document.createElement('div');
            item.id = `prob-item-${p.id}`;
            
            const isActive = this.state.currentProblem && this.state.currentProblem.id === p.id;
            const baseStyles = 'p-3 cursor-pointer border-l-2 transition text-sm mb-1';
            const inactiveStyles = 'border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-yellow-500 hover:text-black dark:hover:text-white';
            const activeStyles = 'bg-gray-100 dark:bg-gray-800 border-yellow-500 text-black dark:text-white font-medium';
            
            item.className = `${baseStyles} ${isActive ? activeStyles : inactiveStyles}`;
            
            let diffColor = 'bg-gray-400';
            if(p.difficulty === 'Easy') diffColor = 'bg-green-500';
            if(p.difficulty === 'Medium') diffColor = 'bg-yellow-500';
            if(p.difficulty === 'Hard') diffColor = 'bg-red-500';

            const isSolved = this.state.solvedProblemIds.has(p.id);
            const iconHtml = isSolved 
                ? '<i class="fa-solid fa-circle-check text-green-500 mr-2"></i>' 
                : '<i class="fa-regular fa-circle text-gray-400 mr-2 text-[10px]"></i>';

            item.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex items-center overflow-hidden">
                        ${iconHtml}
                        <span class="truncate w-32">${p.title}</span>
                    </div>
                    <span class="w-2 h-2 rounded-full ${diffColor} flex-shrink-0 mt-1" title="${p.difficulty}"></span>
                </div>
                <div class="text-[10px] text-gray-400 dark:text-gray-500 mt-1 ml-5 truncate">${p.topic || 'General'}</div>
            `;
            item.onclick = () => this.loadProblem(p.id);
            list.appendChild(item);
        });
    },

    loadProblem(id) {
        const problem = problemsDB.find(p => String(p.id) === String(id)); 
        if(!problem) return;
        window.location.hash = `problem=${id}`;
        this.state.currentProblem = problem;
        this.updateSidebarSelection(id);
        
        let htmlContent = `
            <h2 class="text-2xl font-bold mb-2 text-gray-900 dark:text-white">${problem.title}</h2>
            <div class="flex gap-2 mb-4">
                <span class="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-300">${problem.difficulty}</span>
                <span class="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/50 text-xs text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800">${problem.topic || 'General'}</span>
            </div>
            <div class="mt-4 text-gray-700 dark:text-gray-300 leading-relaxed">${problem.description}</div>
        `;

        if (problem.type === 'sql') {
            try {
                alasql('DROP DATABASE IF EXISTS temp_load_db');
                alasql('CREATE DATABASE temp_load_db');
                alasql('USE temp_load_db');
                
                if (problem.setup_sql) {
                    const stmts = problem.setup_sql.split(';');
                    for(let stmt of stmts) {
                        if(stmt.trim()) {
                            try { alasql(stmt); } 
                            catch(e) { console.warn("Setup SQL Statement Warning:", e); }
                        }
                    }
                    
                    const tables = alasql('SHOW TABLES');
                    if (tables.length > 0) {
                        htmlContent += '<div class="mt-8 border-t border-gray-200 dark:border-gray-700 pt-4"><h3 class="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-4">Database Schema</h3>';
                        
                        tables.forEach(t => {
                            const tableName = t.tableid;
                            const cols = alasql(`SHOW COLUMNS FROM ${tableName}`);
                            htmlContent += `
                                <div class="mb-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900/50 p-4 shadow-sm">
                                    <div class="flex items-center gap-2 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                                        <i class="fa-solid fa-table text-blue-500 dark:text-blue-400"></i>
                                        <span class="font-bold text-gray-800 dark:text-white">${tableName}</span>
                                    </div>
                                    <div class="grid grid-cols-1 gap-y-1">
                                        ${cols.map(col => {
                                            let typeDisplay = col.type || col.dbtypeid || 'N/A';
                                            if (typeDisplay && typeof typeDisplay === 'string') {
                                                typeDisplay = typeDisplay.toUpperCase();
                                                typeDisplay = typeDisplay.replace(/\(\d+\)/, ''); 
                                            }
                                            return `
                                            <div class="flex justify-between text-xs font-mono">
                                                <span class="text-gray-600 dark:text-gray-300">${col.columnid}</span>
                                                <span class="text-blue-600 dark:text-blue-400 font-semibold">${typeDisplay}</span>
                                            </div>
                                            `;
                                        }).join('')}
                                    </div>
                                </div>
                            `;
                        });
                        htmlContent += '</div>';
                    }
                }

                if (problem.solution_sql) {
                    try {
                        const result = alasql(problem.solution_sql);
                        if (Array.isArray(result) && result.length > 0) {
                             htmlContent += '<div class="mt-6"><h3 class="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Expected Sample Output</h3>';
                             htmlContent += ui.generateTableHtml(result.slice(0, 5), 'border-purple-200 dark:border-purple-800'); 
                             htmlContent += '</div>';
                        }
                    } catch(err) { console.warn("Could not generate sample output", err); }
                }
                
                alasql('DROP DATABASE IF EXISTS temp_load_db');
            } catch (e) {
                console.error("Error generating schema metadata:", e);
            }
        }

        const container = document.getElementById('problem-desc-container');
        if(container) container.innerHTML = htmlContent;

        if(this.editor) {
            this.editor.setValue(problem.starter);
            const mode = problem.type === 'sql' ? 'text/x-sql' : 'python';
            this.editor.setOption('mode', mode);
        }
        
        if(document.getElementById('lang-indicator')) document.getElementById('lang-indicator').innerText = problem.type.toUpperCase();
        if(document.getElementById('console-output')) document.getElementById('console-output').innerHTML = '';
        if(document.getElementById('save-status')) document.getElementById('save-status').innerText = '';
    },

    updateSidebarSelection(activeId) {
        document.querySelectorAll('#problem-list > div').forEach(el => {
            el.className = 'p-3 cursor-pointer border-l-2 transition text-sm mb-1 border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-yellow-500 hover:text-black dark:hover:text-white';
        });
        const activeItem = document.getElementById(`prob-item-${activeId}`);
        if(activeItem) {
            activeItem.className = 'p-3 cursor-pointer border-l-2 transition text-sm mb-1 bg-gray-100 dark:bg-gray-800 border-yellow-500 text-black dark:text-white font-medium';
        }
    }
};

const authManager = {
    login() {
        if (app.state.mode === 'firebase') {
            const fb = window.firebaseModules;
            const provider = new fb.GoogleAuthProvider();
            fb.signInWithPopup(app.state.auth, provider).catch(e => alert(e.message));
        } else {
            const mockUser = { uid: 'local-user-1', displayName: 'Demo Student', photoURL: 'https://ui-avatars.com/api/?name=Demo+Student&background=random' };
            localStorage.setItem('mockUser', JSON.stringify(mockUser));
            app.state.user = mockUser;
            this.updateUI(mockUser);
        }
    },
    logout() {
        if (app.state.mode === 'firebase') {
            window.firebaseModules.signOut(app.state.auth);
        } else {
            localStorage.removeItem('mockUser');
            app.state.user = null;
            this.updateUI(null);
        }
        router.navigate('landing');
    },
    checkLocalAuth() {
        const saved = localStorage.getItem('mockUser');
        if (saved) {
            app.state.user = JSON.parse(saved);
            this.updateUI(app.state.user);
        }
    },
    updateUI(user) {
        if (user) {
            document.getElementById('btn-login').classList.add('hidden');
            document.getElementById('user-profile-menu').classList.remove('hidden');
            document.getElementById('user-profile-menu').classList.add('flex');
            
            const img = document.getElementById('user-avatar');
            if(img) {
                const safeName = encodeURIComponent(user.displayName || 'User');
                const fallbackUrl = `https://ui-avatars.com/api/?name=${safeName}&background=random`;
                if (user.photoURL && user.photoURL.length > 5) { img.src = user.photoURL; } 
                else { img.src = fallbackUrl; }
                img.onerror = function() { this.src = fallbackUrl; };
            }
        } else {
            document.getElementById('btn-login').classList.remove('hidden');
            document.getElementById('user-profile-menu').classList.add('hidden');
            document.getElementById('user-profile-menu').classList.remove('flex');
        }
    },
    async loadLeaderboard() {
        const tbody = document.getElementById('leaderboard-body');
        const loading = document.getElementById('leaderboard-loading');
        if(!tbody) return;
        
        tbody.innerHTML = '';
        loading.classList.remove('hidden');

        try {
            let users = [];
            if(app.state.mode === 'firebase') {
                const fb = window.firebaseModules;
                const q = fb.query(fb.collection(app.state.db, 'users'), fb.orderBy('solvedCount', 'desc'), fb.limit(50));
                const snapshot = await fb.getDocs(q);
                users = snapshot.docs.map(d => d.data());
            } else {
                users = [ { displayName: 'Alice', solvedCount: 15 }, { displayName: 'Bob', solvedCount: 10 } ];
            }

            loading.classList.add('hidden');
            
            users.forEach((u, index) => {
                let medal = '';
                if(index === 0) medal = '🥇';
                if(index === 1) medal = '🥈';
                if(index === 2) medal = '🥉';
                
                const safeName = encodeURIComponent(u.displayName || 'User');
                const fallbackUrl = `https://ui-avatars.com/api/?name=${safeName}&background=random`;
                const displayPhoto = u.photoURL || fallbackUrl;

                const tr = document.createElement('tr');
                tr.className = "hover:bg-gray-100 dark:hover:bg-gray-800 transition";
                tr.innerHTML = `
                    <td class="px-6 py-4 font-bold text-gray-500">${medal || (index + 1)}</td>
                    <td class="px-6 py-4 flex items-center gap-3">
                        <img src="${displayPhoto}" referrerpolicy="no-referrer" class="w-8 h-8 rounded-full object-cover" onerror="this.onerror=null;this.src='${fallbackUrl}';">
                        <span class="font-medium text-gray-900 dark:text-white">${u.displayName || 'Unknown'}</span>
                    </td>
                    <td class="px-6 py-4 text-right font-bold text-blue-500">${u.solvedCount || 0}</td>
                `;
                tbody.appendChild(tr);
            });
        } catch(e) {
            console.error(e);
            loading.innerText = "Failed to load leaderboard.";
        }
    },
    async loadProfileData() {
        if (!app.state.user) {
            alert("Please login to view profile");
            router.navigate('landing');
            return;
        }
        const user = app.state.user;
        const safeName = encodeURIComponent(user.displayName || 'User');
        const fallbackUrl = `https://ui-avatars.com/api/?name=${safeName}&background=random`;
        const avatarUrl = user.photoURL || fallbackUrl;
        
        if(document.getElementById('profile-view-name')) document.getElementById('profile-view-name').innerText = user.displayName;
        const profileImg = document.getElementById('profile-view-avatar');
        if(profileImg) {
            profileImg.src = avatarUrl;
            profileImg.onerror = function() { this.src = fallbackUrl; };
        }

        const history = await persistence.getHistory(app.state.user.uid);
        const uniqueSolved = new Set(history.filter(h => h.status === 'Passed').map(h => h.problemId)).size;
        
        if(document.getElementById('stat-solved')) document.getElementById('stat-solved').innerText = uniqueSolved;
        if(document.getElementById('stat-rate')) document.getElementById('stat-rate').innerText = Math.round((uniqueSolved / problemsDB.length) * 100) + '%';
        
        const tbody = document.getElementById('history-table-body');
        if(!tbody) return;
        
        tbody.innerHTML = '';
        if(history.length === 0) {
            if(document.getElementById('empty-history')) document.getElementById('empty-history').classList.remove('hidden');
        } else {
            if(document.getElementById('empty-history')) document.getElementById('empty-history').classList.add('hidden');
            history.sort((a,b) => b.timestamp - a.timestamp).forEach(h => {
                const tr = document.createElement('tr');
                tr.className = "hover:bg-gray-100 dark:hover:bg-gray-800 transition";
                tr.innerHTML = `
                    <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">${h.problemTitle}</td>
                    <td class="px-6 py-4"><span class="px-2 py-1 rounded text-xs bg-gray-200 dark:bg-gray-700 uppercase">${h.track}</span></td>
                    <td class="px-6 py-4">
                        ${h.status === 'Passed' ? '<span class="text-green-600 dark:text-green-400"><i class="fa-solid fa-check"></i> Passed</span>' : '<span class="text-red-600 dark:text-red-400"><i class="fa-solid fa-xmark"></i> Failed</span>'}
                    </td>
                    <td class="px-6 py-4 text-right text-gray-500">${new Date(h.timestamp).toLocaleDateString()}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    }
};

const themeManager = {
    init() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') { this.setLight(); } else { this.setDark(); }
    },
    isDark() { return document.documentElement.classList.contains('dark'); },
    setDark() {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        this.updateButton(true);
        if(app.editor) app.editor.setOption('theme', 'dracula');
    },
    setLight() {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        this.updateButton(false);
        if(app.editor) app.editor.setOption('theme', 'eclipse');
    },
    toggle() { if (this.isDark()) { this.setLight(); } else { this.setDark(); } },
    updateButton(isDark) {
        const btn = document.getElementById('theme-btn');
        if(btn) {
            btn.innerHTML = isDark ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun text-orange-500"></i>';
            btn.className = isDark 
                ? 'w-8 h-8 rounded-full bg-gray-800 text-yellow-400 flex items-center justify-center hover:bg-gray-700 transition'
                : 'w-8 h-8 rounded-full bg-gray-200 text-orange-500 flex items-center justify-center hover:bg-gray-300 transition';
        }
    }
};

const ui = {
    sidebarOpen: true,
    consoleOpen: true,
    toggleSidebar() {
        const sidebar = document.getElementById('app-sidebar');
        const arrow = document.getElementById('sidebar-toggle-arrow');
        if(!sidebar) return;
        this.sidebarOpen = !this.sidebarOpen;
        if (this.sidebarOpen) {
            sidebar.style.width = '250px'; sidebar.classList.remove('w-0', 'p-0'); sidebar.classList.add('p-4', 'border-r');
            if(arrow) arrow.style.transform = 'rotate(0deg)';
        } else {
            sidebar.style.width = '0px'; sidebar.classList.add('w-0', 'p-0'); sidebar.classList.remove('p-4', 'border-r');
            if(arrow) arrow.style.transform = 'rotate(180deg)';
        }
        setTimeout(() => app.editor && app.editor.refresh(), 300);
    },
    injectSidebarToggle() {
        const existing = document.getElementById('sidebar-toggle-btn');
        if(existing) existing.remove();

        const sidebar = document.getElementById('app-sidebar');
        if(sidebar && sidebar.parentElement) {
            const btn = document.createElement('button');
            btn.id = 'sidebar-toggle-btn';
            btn.className = "absolute top-1/2 -translate-y-1/2 z-40 w-6 h-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full flex items-center justify-center shadow-md text-gray-500 hover:text-blue-500 transition cursor-pointer hidden md:flex";
            btn.style.left = "238px"; 
            btn.style.transition = "left 0.3s ease";
            btn.innerHTML = '<i id="sidebar-toggle-arrow" class="fa-solid fa-chevron-left text-[10px]"></i>';
            
            btn.onclick = () => {
                ui.toggleSidebar();
                if(ui.sidebarOpen) {
                     btn.style.left = "238px";
                } else {
                     btn.style.left = "0px";
                }
            };

            const originalToggle = ui.toggleSidebar;
            ui.toggleSidebar = function() {
                const sidebar = document.getElementById('app-sidebar');
                const arrow = document.getElementById('sidebar-toggle-arrow');
                if(!sidebar) return;
                ui.sidebarOpen = !ui.sidebarOpen;
                
                if (ui.sidebarOpen) {
                    sidebar.style.width = '250px'; sidebar.classList.remove('w-0', 'p-0'); sidebar.classList.add('p-4', 'border-r');
                    if(arrow) arrow.style.transform = 'rotate(0deg)';
                    if(btn) btn.style.left = "238px";
                } else {
                    sidebar.style.width = '0px'; sidebar.classList.add('w-0', 'p-0'); sidebar.classList.remove('p-4', 'border-r');
                    if(arrow) arrow.style.transform = 'rotate(180deg)';
                    if(btn) btn.style.left = "4px";
                }
                setTimeout(() => app.editor && app.editor.refresh(), 300);
            };

            sidebar.parentElement.insertBefore(btn, sidebar.nextSibling);
        }
    },
    toggleConsole() {
        const panel = document.getElementById('console-panel');
        if(!panel) return;
        this.consoleOpen = !this.consoleOpen;
        panel.style.height = this.consoleOpen ? '200px' : '40px';
    },
    generateTableHtml(data, customClass = '') {
        if (!Array.isArray(data) || data.length === 0) return '';
        const headers = Object.keys(data[0]);
        
        // CHANGES: Removed 'my-2', reduced padding to 'px-2 py-1' for tighter look
        const borderClass = customClass || 'border-gray-300 dark:border-gray-700';
        
        return `
            <div class="overflow-x-auto border ${borderClass} rounded bg-white dark:bg-gray-900/50 mb-1">
                <table class="min-w-full text-xs text-left text-gray-700 dark:text-gray-300">
                    <thead class="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 uppercase font-medium">
                        <tr>${headers.map(h => `<th class="px-2 py-1 border-b border-gray-300 dark:border-gray-700 whitespace-nowrap">${h}</th>`).join('')}</tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
                        ${data.map(row => `
                            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                ${headers.map(h => `<td class="px-2 py-1 whitespace-nowrap font-mono border-r border-gray-100 dark:border-gray-800 last:border-0">${row[h] !== null ? row[h] : '<span class="text-gray-400">NULL</span>'}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },
    initResizers() {
        const resizerConsole = document.getElementById('resizer-console');
        const consolePanel = document.getElementById('console-panel');
        if(resizerConsole && consolePanel) {
            resizerConsole.addEventListener('mousedown', (e) => {
                e.preventDefault();
                document.body.style.cursor = 'row-resize';
                const startY = e.clientY;
                const startH = parseInt(window.getComputedStyle(consolePanel).height, 10);
                const onMouseMove = (e) => {
                    const newH = startH - (e.clientY - startY);
                    if (newH > 40 && newH < 600) consolePanel.style.height = `${newH}px`;
                };
                const onMouseUp = () => {
                    document.body.style.cursor = 'default';
                    window.removeEventListener('mousemove', onMouseMove);
                    window.removeEventListener('mouseup', onMouseUp);
                    if(app.editor) app.editor.refresh();
                };
                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
            });
        }
        const resizerSidebar = document.getElementById('resizer-sidebar');
        const sidebar = document.getElementById('app-sidebar');
        if(resizerSidebar) {
            resizerSidebar.addEventListener('mousedown', (e) => {
                e.preventDefault();
                document.body.style.cursor = 'col-resize';
                const startX = e.clientX;
                const startW = parseInt(window.getComputedStyle(sidebar).width, 10);
                const onMouseMove = (e) => {
                    const newW = startW + (e.clientX - startX);
                    if (newW > 150 && newW < 500) {
                        sidebar.style.width = `${newW}px`;
                        // Update arrow pos
                        const btn = document.getElementById('sidebar-toggle-btn');
                        if(btn) btn.style.left = `${newW - 12}px`;
                    }
                };
                const onMouseUp = () => {
                    document.body.style.cursor = 'default';
                    window.removeEventListener('mousemove', onMouseMove);
                    window.removeEventListener('mouseup', onMouseUp);
                    if(app.editor) app.editor.refresh();
                };
                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
            });
        }
        const resizerDesc = document.getElementById('resizer-desc');
        const descPanel = document.getElementById('desc-panel');
        if(resizerDesc) {
            resizerDesc.addEventListener('mousedown', (e) => {
                e.preventDefault();
                document.body.style.cursor = 'col-resize';
                const startX = e.clientX;
                const startW = parseInt(window.getComputedStyle(descPanel).width, 10);
                const onMouseMove = (e) => {
                    const newW = startW + (e.clientX - startX);
                    if (newW > 200 && newW < 800) descPanel.style.width = `${newW}px`;
                };
                const onMouseUp = () => {
                    document.body.style.cursor = 'default';
                    window.removeEventListener('mousemove', onMouseMove);
                    window.removeEventListener('mouseup', onMouseUp);
                    if(app.editor) app.editor.refresh();
                };
                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
            });
        }
    }
};

const router = {
    navigate(viewId) {
        // 1. Handle View Toggling
        ['view-landing', 'view-playground', 'view-leaderboard', 'view-profile'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.classList.add('hidden-view');
        });
        const target = document.getElementById(`view-${viewId}`);
        if(target) target.classList.remove('hidden-view');

        // 2. Specific View Logic
        if(viewId === 'profile') authManager.loadProfileData();
        if(viewId === 'leaderboard') authManager.loadLeaderboard();
        
        // --- NEW: 50/50 Split Logic for Playground ---
        if(viewId === 'playground') {
             setTimeout(() => {
                 const consolePanel = document.getElementById('console-panel');
                 const parent = consolePanel ? consolePanel.parentElement : null;
                 if (consolePanel && parent) {
                     // Calculate 50% of the parent container's height
                     const halfHeight = parent.clientHeight / 2;
                     consolePanel.style.height = `${halfHeight}px`;
                     if(app.editor) app.editor.refresh();
                 }
             }, 50); // Slight delay to ensure DOM is rendered
        }

        // 3. Sync URL Hash
        if (viewId === 'landing') window.location.hash = 'landing';
        if (viewId === 'leaderboard') window.location.hash = 'leaderboard';
        if (viewId === 'profile') window.location.hash = 'profile';
    }
};

const verifier = {
    /**
     * Cleans individual cell values for robust comparison.
     * - Trims whitespace from strings (e.g., " Item " -> "Item")
     * - Normalizes null/undefined to null
     * - (Optional) Could round numbers here if floating point math causes issues
     */
    cleanValue(val) {
        if (val === null || val === undefined) return null;
        if (typeof val === 'string') return val.trim();
        // Handle potential string-numbers (optional, remove if strict type checking is desired)
        if (!isNaN(parseFloat(val)) && isFinite(val) && typeof val === 'string') {
             // return Number(val); // Uncomment if you want "100" to equal 100
        }
        return val;
    },

    /**
     * Normalizes the entire result set:
     * 1. Lowercases all column headers (SQL case-insensitivity).
     * 2. Sorts columns alphabetically (Ignore column order).
     * 3. Sorts rows content-wise (Ignore row order).
     */
    normalizeDataset(dataset) {
        if (!Array.isArray(dataset)) return [];
        
        const normalizedRows = dataset.map(row => {
            const cleanRow = {};
            // Get keys, sort them case-insensitively to ensure stable JSON order
            const keys = Object.keys(row).sort((a, b) => 
                a.toLowerCase().localeCompare(b.toLowerCase())
            );
            
            keys.forEach(key => {
                // Lowercase the key for comparison (Revenue == revenue)
                const lowerKey = key.toLowerCase();
                cleanRow[lowerKey] = this.cleanValue(row[key]);
            });
            return cleanRow;
        });

        // Sort the rows themselves to handle unordered results (unless ORDER BY is strict, but this helps robustness)
        return normalizedRows.sort((a, b) => 
            JSON.stringify(a).localeCompare(JSON.stringify(b))
        );
    },

    compare(actual, expected) {
        try {
            const normActual = this.normalizeDataset(actual);
            const normExpected = this.normalizeDataset(expected);
            
            // Debugging: Log mismatch to console if needed
            const isMatch = JSON.stringify(normActual) === JSON.stringify(normExpected);
            if (!isMatch) {
                console.log("Verifier Mismatch Details:");
                console.log("Normalized User Output:", normActual);
                console.log("Normalized Expected Output:", normExpected);
            }
            return isMatch;
        } catch (e) {
            console.error("Verifier System Error:", e);
            return false; // Fail gracefully rather than crashing
        }
    }
};

const runner = {
    praiseWords: [
        "Magnificent!", "Outstanding!", "Brilliant!", 
        "Nailed it!", "Fantastic!", "Spot on!", 
        "Impressive!", "On fire!", "Perfect!"
    ],

    getRandomPraise() {
        return this.praiseWords[Math.floor(Math.random() * this.praiseWords.length)];
    },

    log(msg, isError = false, customClass = '') {
        const div = document.getElementById('console-output');
        if (div) {
            let className = "font-mono text-xs leading-snug "; 
            
            if (customClass) {
                className += customClass;
            } else if (msg.includes("Wrong Answer") || msg.includes("FAILED")) {
                className += "text-red-600 dark:text-red-400 font-bold my-1";
            } else if (this.praiseWords.some(word => msg.includes(word)) || msg.includes("PASSED")) {
                className += "text-green-600 dark:text-green-400 font-bold my-1 text-sm";
            } else if (msg.includes("YOUR OUTPUT") || msg.includes("EXPECTED OUTPUT")) {
                className += "text-gray-500 dark:text-gray-400 font-bold mt-2 mb-0.5 border-b border-gray-200 dark:border-gray-700 pb-0.5 block";
            } else if (isError) {
                className += "text-red-500 dark:text-red-400";
            } else {
                className += "text-gray-700 dark:text-gray-300";
            }

            div.innerHTML += `<div class="${className}">${msg}</div>`;
            div.scrollTop = div.scrollHeight;
        }
    },

    logTable(data, customBorderClass = '') {
        const div = document.getElementById('console-output');
        if (!div || !Array.isArray(data) || data.length === 0) return;
        
        const limit = 10;
        const slicedData = data.slice(0, limit);
        
        let html = `<div>`;
        const border = customBorderClass || 'border-blue-200 dark:border-blue-800';
        html += ui.generateTableHtml(slicedData, border);
        if (data.length > limit) html += `<div class="text-[10px] text-gray-500 italic pb-1">... showing first ${limit} of ${data.length} rows</div>`;
        html += `</div>`;

        div.innerHTML += html;
        div.scrollTop = div.scrollHeight;
    },

    setLoading(isLoading) {
        const btn = document.getElementById('run-btn');
        if (!btn) return;
        if (isLoading) {
            btn.disabled = true;
            btn.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            btn.disabled = false;
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    },

    async run(isSubmission = false) {
        if (!app.state.currentProblem) { alert("No problem loaded!"); return; }
        this.setLoading(true);
        
        document.getElementById('console-output').innerHTML = ''; 
        document.getElementById('save-status').innerText = '';
        
        const code = app.editor.getValue();
        const problem = app.state.currentProblem;
        
        try {
            let passed = false;
            if (problem.type === 'python') {
                passed = await this.runPython(code, problem, isSubmission);
            } else {
                passed = this.runSQL(code, problem, isSubmission);
            }
            
            if (isSubmission) {
                if (app.state.user) {
                    document.getElementById('save-status').innerText = "Saving...";
                    await persistence.saveSubmission({
                        userId: app.state.user.uid,
                        userDisplayName: app.state.user.displayName,
                        userPhoto: app.state.user.photoURL,
                        problemId: problem.id,
                        problemTitle: problem.title,
                        track: problem.type,
                        code: code,
                        status: passed ? 'Passed' : 'Failed',
                        timestamp: Date.now()
                    }, passed);
                    
                    document.getElementById('save-status').innerText = "Saved";

                    if (passed) {
                        app.state.solvedProblemIds.add(problem.id);
                        app.applyFilters(); 
                        if(typeof starManager !== 'undefined') starManager.render();
                        
                        // --- NEXT PROBLEM LOGIC ---
                        const currentIndex = problemsDB.findIndex(p => String(p.id) === String(problem.id));
                        const nextProblem = problemsDB[currentIndex + 1];
                        
                        let nextButton = '';
                        if (nextProblem) {
                            nextButton = `
                                <button onclick="app.loadProblem('${nextProblem.id}')" class="ml-auto px-3 py-1 bg-green-700 hover:bg-green-800 text-white text-[10px] font-bold uppercase rounded transition flex items-center gap-1 whitespace-nowrap shadow-sm">
                                    Next <i class="fa-solid fa-arrow-right"></i>
                                </button>
                            `;
                        } else {
                            nextButton = `<span class="ml-auto text-[10px] italic opacity-70">All done!</span>`;
                        }

                        // --- THE GREEN RECTANGLE ---
                        this.log(`
                            <div class="flex items-center gap-3 w-full p-2 mt-2 bg-green-100 dark:bg-green-900/40 border border-green-300 dark:border-green-700 rounded text-green-900 dark:text-green-100 shadow-sm">
                                <i class="fa-solid fa-circle-check text-green-600 dark:text-green-400 text-lg"></i>
                                <div class="flex flex-col leading-none">
                                    <span class="font-bold text-xs">It's Correct</span>
                                    <span class="text-[10px] opacity-80">${this.getRandomPraise()}</span>
                                </div>
                                ${nextButton}
                            </div>
                        `);
                    }
                } else {
                    alert("Please login to save your progress!");
                }
            }
        } catch (e) {
            console.error(e); 
            this.log("System Error: " + e.message, true);
        } finally {
            this.setLoading(false);
        }
    },

    submit() { this.run(true); },

    async runPython(code, problem, isSubmission) {
        if (!window.pyodide && typeof loadPyodide !== 'undefined') { try { window.pyodide = await loadPyodide(); } catch (e) {} }
        if (!window.pyodide) { this.log("⚠️ Python engine loading...", true); return false; }
        try {
            let outputCaptured = false;
            window.pyodide.setStdout({ batched: (msg) => { this.log(msg); outputCaptured = true; }});
            const result = await window.pyodide.runPythonAsync(code); 
            
            if (!isSubmission) {
                if (result !== undefined) {
                    this.log("Result: " + result, false, "text-blue-600 dark:text-blue-400 font-bold");
                } else if (!outputCaptured) {
                    this.log("ℹ️ Code ran successfully.", false, "text-yellow-600 dark:text-yellow-500");
                }
            }
            
            if (isSubmission) {
                if (!problem.test_code) { this.log("⚠️ No test code found.", true); return false; }
                
                await window.pyodide.runPythonAsync(code + "\n" + problem.test_code);
                
                const output = document.getElementById('console-output').innerText;
                const passed = output.includes("Passed"); 
                
                if(!passed) {
                    this.log("❌ FAILED: Solution did not pass tests.", true);
                }
                return passed;
            }
            return true; 
        } catch (err) {
            this.log(err, true);
            return false;
        }
    },

    runSQL(code, problem, isSubmission) {
        if (typeof alasql === 'undefined') { this.log("⚠️ SQL Engine not loaded.", true); return false; }
        
        try { alasql('DROP DATABASE IF EXISTS testdb'); alasql('CREATE DATABASE testdb'); alasql('USE testdb'); } catch (e) {}
        
        if (problem.setup_sql) { 
             const stmts = problem.setup_sql.split(';');
             for(let stmt of stmts) if(stmt.trim()) try { alasql(stmt); } catch(e) {}
        }

        try {
            const userResult = alasql(code);
            if(!isSubmission) {
                 this.log("YOUR OUTPUT:", false);
                 if(Array.isArray(userResult)) {
                    if(userResult.length === 0) { this.log("Result: [] (Empty)"); } 
                    else { this.logTable(userResult, 'border-blue-300 dark:border-blue-700'); }
                 } else {
                    this.log("Query Executed Successfully.");
                 }
                 return true;
            }

            if(isSubmission) {
                // 1. Expected
                alasql('DROP DATABASE IF EXISTS testdb'); alasql('CREATE DATABASE testdb'); alasql('USE testdb');
                if (problem.setup_sql) {
                     const stmts = problem.setup_sql.split(';');
                     for(let stmt of stmts) if(stmt.trim()) try { alasql(stmt); } catch(e) {}
                }
                let expectedResult;
                try { expectedResult = alasql(problem.solution_sql); } catch(e) { this.log("Config Error: Solution SQL invalid.", true); return false; }

                // 2. Actual
                alasql('DROP DATABASE IF EXISTS testdb'); alasql('CREATE DATABASE testdb'); alasql('USE testdb');
                if (problem.setup_sql) {
                     const stmts = problem.setup_sql.split(';');
                     for(let stmt of stmts) if(stmt.trim()) try { alasql(stmt); } catch(e) {}
                }
                const actualResult = alasql(code);

                // 3. Compare
                const isMatch = verifier.compare(actualResult, expectedResult);
                
                if (isMatch) { 
                    return true; 
                } else { 
                    this.log("❌ Wrong Answer"); 
                    
                    this.log("YOUR OUTPUT", false, "text-red-600 dark:text-red-400 font-bold mt-2 mb-1");
                    if(Array.isArray(actualResult) && actualResult.length > 0) 
                        this.logTable(actualResult, 'border-red-500 dark:border-red-500');
                    else 
                        this.log("[] (Empty)", false, "text-red-500");

                    this.log("EXPECTED OUTPUT", false, "text-green-600 dark:text-green-400 font-bold mt-2 mb-1");
                    if(Array.isArray(expectedResult) && expectedResult.length > 0) 
                        this.logTable(expectedResult, 'border-green-500 dark:border-green-500');
                    else 
                        this.log("[] (Empty)", false, "text-green-500");
                    
                    return false; 
                }
            }
            return true;
        } catch(e) { this.log("SQL Error: " + e.message, true); return false; }
    }
};

const persistence = {
    async saveSubmission(data, isPassed) {
        if (app.state.mode === 'firebase') {
            const fb = window.firebaseModules;
            await fb.addDoc(fb.collection(app.state.db, "submissions"), data);
            
            if (isPassed && !app.state.solvedProblemIds.has(data.problemId)) {
                const userRef = fb.doc(app.state.db, "users", data.userId);
                try {
                    await fb.setDoc(userRef, {
                        displayName: data.userDisplayName,
                        photoURL: data.userPhoto,
                        solvedCount: fb.increment(1)
                    }, { merge: true });
                } catch(e) {
                    console.error("Leaderboard update failed:", e);
                }
            }
        } else {
            let history = JSON.parse(localStorage.getItem('polyglot_history') || '[]');
            history.push(data);
            localStorage.setItem('polyglot_history', JSON.stringify(history));
        }
    },
    async getHistory(userId) {
        if (app.state.mode === 'firebase') {
            const fb = window.firebaseModules;
            const q = fb.query(fb.collection(app.state.db, "submissions"), fb.where("userId", "==", userId));
            const snapshot = await fb.getDocs(q);
            return snapshot.docs.map(d => d.data());
        } else {
            let history = JSON.parse(localStorage.getItem('polyglot_history') || '[]');
            return history.filter(h => h.userId === userId);
        }
    }
};

// ... (Keep existing app object, init, etc.)

// --- UPDATE: UI Utils for Charts ---
ui.renderActivityChart = function(history) {
    const container = document.getElementById('activity-chart-container');
    if (!container) return; // Ensure this div exists in HTML or inject it

    // 1. Prepare Data (Last 365 Days)
    const today = new Date();
    const activityMap = {};
    
    // Map history to "YYYY-MM-DD" counts
    history.forEach(h => {
        const date = new Date(h.timestamp).toISOString().split('T')[0];
        activityMap[date] = (activityMap[date] || 0) + 1;
    });

    // 2. Generate Grid
    let html = '<div class="flex gap-1 flex-wrap justify-center max-w-2xl mx-auto">';
    
    // Generate last 60 days for a compact "Profile View" (or 365 for full)
    const daysToShow = 90; 
    const squares = [];
    
    for (let i = daysToShow; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const count = activityMap[dateStr] || 0;
        
        // Color Logic
        let colorClass = 'bg-gray-200 dark:bg-gray-800'; // Default (0)
        let title = `${dateStr}: No activity`;
        
        if (count > 0) {
            if (count >= 7) {
                colorClass = 'bg-green-800 dark:bg-green-600 shadow-sm shadow-green-900/50'; // 7+ Questions
                title = `${dateStr}: ${count} submissions (On Fire!)`;
            } else {
                colorClass = 'bg-green-400 dark:bg-green-500'; // 1-6 Questions
                title = `${dateStr}: ${count} submissions`;
            }
        }
        
        squares.push(`<div class="w-3 h-3 rounded-sm ${colorClass} hover:ring-1 ring-offset-1 ring-blue-500 transition cursor-help" title="${title}"></div>`);
    }
    
    html += squares.join('') + '</div>';
    html += `
        <div class="flex items-center justify-end gap-2 mt-2 text-[10px] text-gray-400">
            <span>Less</span>
            <div class="w-2 h-2 rounded-sm bg-gray-200 dark:bg-gray-800"></div>
            <div class="w-2 h-2 rounded-sm bg-green-400 dark:bg-green-500"></div>
            <div class="w-2 h-2 rounded-sm bg-green-800 dark:bg-green-600"></div>
            <span>More</span>
        </div>
    `;
    
    container.innerHTML = html;
};

// --- UPDATE: Auth Manager (Profile Load) ---
authManager.loadProfileData = async function() {
    if (!app.state.user) {
        alert("Please login to view profile");
        router.navigate('landing');
        return;
    }
    const user = app.state.user;
    
    // 1. Profile Header & Avatar
    const safeName = encodeURIComponent(user.displayName || 'User');
    const fallbackUrl = `https://ui-avatars.com/api/?name=${safeName}&background=random`;
    const avatarUrl = user.photoURL || fallbackUrl;
    
    if(document.getElementById('profile-view-name')) document.getElementById('profile-view-name').innerText = user.displayName;
    const profileImg = document.getElementById('profile-view-avatar');
    if(profileImg) {
        profileImg.src = avatarUrl;
        profileImg.onerror = function() { this.src = fallbackUrl; };
    }

    // 2. Fetch History
    const history = await persistence.getHistory(app.state.user.uid);
    const uniqueSolved = new Set(history.filter(h => h.status === 'Passed').map(h => h.problemId)).size;
    
    // 3. Update Stats
    if(document.getElementById('stat-solved')) document.getElementById('stat-solved').innerText = uniqueSolved;
    if(document.getElementById('stat-rate')) document.getElementById('stat-rate').innerText = Math.round((uniqueSolved / problemsDB.length) * 100) + '%';
    
    // 4. Inject Containers if Missing (For Chart & Badges)
    const profileContainer = document.querySelector('#view-profile > div');
    if (profileContainer) {
        // Activity Chart Container
        if (!document.getElementById('activity-section')) {
            const actDiv = document.createElement('div');
            actDiv.id = 'activity-section';
            actDiv.className = "mb-8 bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm";
            actDiv.innerHTML = `
                <h3 class="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Daily Activity</h3>
                <div id="activity-chart-container"></div>
            `;
            // Insert after Stats Grid (assuming stats grid is the 2nd child)
            profileContainer.insertBefore(actDiv, profileContainer.children[2]);
        }
        
        // Badges Container
        if (!document.getElementById('badges-section')) {
            const badgeDiv = document.createElement('div');
            badgeDiv.id = 'badges-section';
            badgeDiv.className = "mb-8";
            badgeDiv.innerHTML = `<div id="badges-container"></div>`;
             // Insert after Activity
             profileContainer.insertBefore(badgeDiv, profileContainer.children[3]);
        }
    }

    // 5. Render Activity Chart
    ui.renderActivityChart(history);

    // 6. Render Badges (If BadgeManager exists)
    if (typeof badgeManager !== 'undefined') {
        badgeManager.render(history);
    }

    // 7. Render History Table (LIMIT TO LAST 5)
    const tbody = document.getElementById('history-table-body');
    if(!tbody) return;
    
    tbody.innerHTML = '';
    if(history.length === 0) {
        if(document.getElementById('empty-history')) document.getElementById('empty-history').classList.remove('hidden');
    } else {
        if(document.getElementById('empty-history')) document.getElementById('empty-history').classList.add('hidden');
        
        // SORT & SLICE 5
        const recentHistory = history.sort((a,b) => b.timestamp - a.timestamp).slice(0, 5);
        
        recentHistory.forEach(h => {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-gray-100 dark:hover:bg-gray-800 transition";
            tr.innerHTML = `
                <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">${h.problemTitle}</td>
                <td class="px-6 py-4"><span class="px-2 py-1 rounded text-xs bg-gray-200 dark:bg-gray-700 uppercase">${h.track}</span></td>
                <td class="px-6 py-4">
                    ${h.status === 'Passed' ? '<span class="text-green-600 dark:text-green-400"><i class="fa-solid fa-check"></i> Passed</span>' : '<span class="text-red-600 dark:text-red-400"><i class="fa-solid fa-xmark"></i> Failed</span>'}
                </td>
                <td class="px-6 py-4 text-right text-gray-500">${new Date(h.timestamp).toLocaleDateString()}</td>
            `;
            tbody.appendChild(tr);
        });
    }
};

// Star fetch
// --- NEW: Star Rating System ---
const starManager = {
    // 1. Calculate Stars for a specific track
    getStarData(track) {
        if (!problemsDB || problemsDB.length === 0) return { count: 0, total: 0, stars: 0 };

        // Filter problems by track
        const trackProblems = problemsDB.filter(p => p.type === track);
        const total = trackProblems.length;
        if (total === 0) return { count: 0, total: 0, stars: 0 };

        // Count solved in this track
        let solvedCount = 0;
        trackProblems.forEach(p => {
            if (app.state.solvedProblemIds.has(p.id)) solvedCount++;
        });

        // Logic: Percentage based 5-star system
        const percentage = (solvedCount / total) * 100;
        let stars = 0;
        
        if (percentage === 0) stars = 0;
        else if (percentage <= 20) stars = 1;
        else if (percentage <= 40) stars = 2;
        else if (percentage <= 60) stars = 3;
        else if (percentage <= 80) stars = 4;
        else stars = 5; // 81% - 100%

        return { count: solvedCount, total, stars };
    },

    // 2. Generate Star HTML
    generateStarHTML(stars) {
        let html = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= stars) {
                // Full Gold Star
                html += '<i class="fa-solid fa-star text-yellow-400 text-[10px] drop-shadow-sm"></i>';
            } else {
                // Empty Gray Star
                html += '<i class="fa-regular fa-star text-gray-300 dark:text-gray-600 text-[10px]"></i>';
            }
        }
        return html;
    },

    // 3. Render to Navbar
    render() {
        // Only show if user is logged in
        if (!app.state.user) {
            const existing = document.getElementById('navbar-stars');
            if (existing) existing.innerHTML = '';
            return;
        }

        // Ensure container exists in Navbar
        let container = document.getElementById('navbar-stars');
        if (!container) {
            container = document.createElement('div');
            container.id = 'navbar-stars';
            container.className = "hidden md:flex items-center gap-3 mr-2 px-3 py-1 bg-gray-50 dark:bg-gray-800/50 rounded-full border border-gray-100 dark:border-gray-700/50";
            
            // Insert before Theme Button (find parent's last few children)
            const themeBtn = document.getElementById('theme-btn');
            if (themeBtn && themeBtn.parentElement) {
                themeBtn.parentElement.insertBefore(container, themeBtn);
            }
        }

        container.innerHTML = '';

        // Determine which tracks to show
        let tracksToShow = [];
        if (app.state.currentTrack) {
            // Show only current track if inside one
            tracksToShow = [app.state.currentTrack];
        } else {
            // Show all available tracks if on landing
            const allTracks = new Set(problemsDB.map(p => p.type));
            tracksToShow = Array.from(allTracks);
        }

        tracksToShow.forEach(track => {
            const data = this.getStarData(track);
            
            // Icons for known tracks
            let icon = '<i class="fa-solid fa-code"></i>';
            if (track === 'python') icon = '<i class="fa-brands fa-python text-blue-500"></i>';
            if (track === 'sql') icon = '<i class="fa-solid fa-database text-orange-500"></i>';

            const item = document.createElement('div');
            item.className = "flex flex-col leading-none items-center px-2 border-r border-gray-200 dark:border-gray-700 last:border-0";
            item.innerHTML = `
                <div class="flex items-center gap-1 mb-0.5">
                    ${icon}
                    <span class="text-[9px] font-bold uppercase text-gray-500 dark:text-gray-400">${track}</span>
                </div>
                <div class="flex gap-0.5" title="${data.count}/${data.total} Solved">
                    ${this.generateStarHTML(data.stars)}
                </div>
            `;
            container.appendChild(item);
        });
    }
};
window.onload = app.init.bind(app);