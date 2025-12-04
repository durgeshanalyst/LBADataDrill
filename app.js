// --- COMPLETE APP.JS REWRITE ---

const app = {
    state: {
        user: null,
        currentTrack: 'sql', 
        currentProblem: null,
        
        // Filters
        filterTopic: 'All',
        filterDifficulty: 'All',
        filterStatus: 'All',
        filterCompany: 'All',    // NEW: Company Filter
        projectFilter: 'All',    // NEW: Project Category Filter
        
        // User Progress & Status
        solvedProblemIds: new Set(), 
        isPremiumUser: false,    // NEW: Freemium Flag (Default: Free)
        
        // System
        db: null,
        auth: null,
        mode: 'local',
        lastView: 'landing' // For Back Button Memory
    },

    async init() {
        // Check config existence
        if (typeof GOOGLE_SHEET_API === 'undefined') {
            alert("CRITICAL: config.js missing or variables undefined.");
            return;
        }

        themeManager.init();
        
        // Initialize CodeMirror Editor
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
            if(document.getElementById('problem-list')) document.getElementById('problem-list').innerHTML = '<div class="text-gray-500 p-4 text-xs">Loading data...</div>';
            
            // Fetch Data
            const response = await fetch(GOOGLE_SHEET_API);
            problemsDB = await response.json();
            
            this.initDailyChallenge();
            this.renderCompanyFilter();

            // --- ROUTING LOGIC ---
            const hash = window.location.hash;
            
            if (hash === '#projects') {
                router.navigate('projects');
            } 
            else if (hash === '#leaderboard') {
                router.navigate('leaderboard');
            }
            else if (hash === '#profile') {
                router.navigate('profile');
            }
            else if (hash.startsWith('#problem=')) {
                // Deep Link Logic
                const id = hash.split('=')[1];
                const problem = problemsDB.find(p => String(p.id) === String(id));
                
                if (problem) {
                    // Decide track based on problem type
                    this.state.currentTrack = problem.type;
                    this.renderTopicFilters(); 
                    this.applyFilters(); 
                    this.loadProblem(id);
                    router.navigate('playground');
                } else {
                    router.navigate('landing');
                }
            } else {
                router.navigate('landing');
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

    initDailyChallenge() {
        const card = document.getElementById('daily-challenge-card');
        if (!card || problemsDB.length === 0) return;

        // Filter only practice problems for daily challenge (No projects)
        const practiceProblems = problemsDB.filter(p => !p.category || p.category === 'Practice');
        if (practiceProblems.length === 0) return;

        // Simple daily seed
        const todayStr = new Date().toDateString();
        // ... (Logic kept simple, you can expand if needed)
    },

    initAuth() {
        if (typeof firebaseConfig !== 'undefined' && firebaseConfig.apiKey && window.firebaseModules) {
            try {
                const fb = window.firebaseModules;
                const appInst = fb.initializeApp(firebaseConfig);
                this.state.auth = fb.getAuth(appInst);
                this.state.db = fb.getFirestore(appInst);
                this.state.mode = 'firebase';
                fb.onAuthStateChanged(this.state.auth, async (user) => {
                    this.state.user = user;
                    
                    // CHECK PREMIUM STATUS FROM FIRESTORE
                    if(user) {
                        try {
                            const userRef = fb.doc(app.state.db, 'users', user.uid);
                            const docSnap = await fb.getDoc(userRef);
                            if (docSnap.exists() && docSnap.data().isPremium) {
                                this.state.isPremiumUser = true;
                            } else {
                                this.state.isPremiumUser = false;
                            }
                        } catch(e) { console.error("Auth check error", e); }
                        
                        this.fetchUserProgress();
                    } else {
                        this.state.isPremiumUser = false;
                    }
                    
                    authManager.updateUI(user);
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
        
        // Reset filters
        this.state.filterTopic = 'All';
        this.state.filterDifficulty = 'All';
        this.state.filterStatus = 'All';
        this.state.filterCompany = 'All';
        
        // Render Filters
        this.renderTopicFilters(); 
        this.renderCompanyFilter();
        this.applyFilters(); 
        
        // Auto-select first problem
        const filtered = this.getFilteredProblems();
        if(filtered.length > 0) {
            this.loadProblem(filtered[0].id);
        }
        
        router.navigate('playground');
        setTimeout(() => { if(this.editor) this.editor.refresh(); }, 100);
    },

    setDifficulty(val) { this.state.filterDifficulty = val; this.applyFilters(); },
    setTopic(val) { this.state.filterTopic = val; this.applyFilters(); },
    setStatus(val) { this.state.filterStatus = val; this.applyFilters(); },
    setCompany(val) { this.state.filterCompany = val; this.applyFilters(); },

    applyFilters() {
        const problems = this.getFilteredProblems();
        this.renderSidebar(problems);
    },

    getFilteredProblems() {
        return problemsDB.filter(p => {
            // 1. Exclude Projects from sidebar (Standard Practice Only)
            const isPractice = !p.category || p.category === 'Practice';
            if (!isPractice) return false;

            // 2. Standard Filters
            const matchType = p.type === this.state.currentTrack;
            const matchDiff = this.state.filterDifficulty === 'All' || p.difficulty === this.state.filterDifficulty;
            const matchTopic = this.state.filterTopic === 'All' || p.topic === this.state.filterTopic;
            
            // 3. Status Filter
            let matchStatus = true;
            const isSolved = this.state.solvedProblemIds.has(p.id);
            if (this.state.filterStatus === 'Solved') matchStatus = isSolved;
            if (this.state.filterStatus === 'Unsolved') matchStatus = !isSolved;

            // 4. NEW: Company Filter
            const matchCompany = this.state.filterCompany === 'All' || (p.companies && p.companies.includes(this.state.filterCompany));

            return matchType && matchDiff && matchTopic && matchStatus && matchCompany;
        });
    },

    renderTopicFilters() {
        const select = document.getElementById('topic-select');
        if(!select) return;
        select.innerHTML = '<option value="All">Topic: All</option>';

        const trackProblems = problemsDB.filter(p => p.type === this.state.currentTrack && (!p.category || p.category === 'Practice'));
        const topics = new Set();
        trackProblems.forEach(p => { if (p.topic) topics.add(p.topic); });
        
        const sortedTopics = Array.from(topics).sort();
        sortedTopics.forEach(topic => {
            const option = document.createElement('option');
            option.value = topic;
            option.innerText = topic;
            if (topic === this.state.filterTopic) option.selected = true;
            select.appendChild(option);
        });
    },

    renderCompanyFilter() {
        const container = document.getElementById('sidebar-filters');
        if (!container) return;

        const existing = document.getElementById('company-select-wrapper');
        if(existing) existing.remove();

        const companies = new Set();
        problemsDB.forEach(p => {
            if (p.companies) {
                p.companies.split(',').forEach(c => companies.add(c.trim()));
            }
        });

        if(companies.size === 0) return;

        const div = document.createElement('div');
        div.id = 'company-select-wrapper';
        div.innerHTML = `
            <select onchange="app.setCompany(this.value)" class="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs rounded p-1.5 focus:outline-none focus:border-brand-accent mt-2">
                <option value="All">Company: All</option>
                ${Array.from(companies).sort().map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
        `;
        container.appendChild(div);
    },

    renderSidebar(problems) {
        const list = document.getElementById('problem-list');
        if(!list) return;
        list.innerHTML = '';
        if (problems.length === 0) {
            list.innerHTML = '<div class="p-4 text-xs text-gray-500 italic">No problems found.</div>';
            return;
        }
        problems.forEach(p => {
            const item = document.createElement('div');
            item.id = `prob-item-${p.id}`;
            
            const isActive = this.state.currentProblem && this.state.currentProblem.id === p.id;
            
            // Clean Styles
            item.className = `p-3 border-l-2 transition cursor-pointer ${isActive ? 'border-brand-accent bg-indigo-50 dark:bg-white/5' : 'border-transparent hover:bg-gray-50 dark:hover:bg-white/5'}`;
            
            const isPremium = p.isPremium === true || String(p.isPremium).toUpperCase() === 'TRUE';
            const isLocked = isPremium && !this.state.isPremiumUser;
            const isSolved = this.state.solvedProblemIds.has(p.id);
            
            const icon = isSolved 
                ? '<i class="fa-solid fa-check text-green-500 mr-2 text-[10px]"></i>' 
                : '<i class="fa-regular fa-circle text-gray-300 dark:text-gray-600 mr-2 text-[10px]"></i>';
            
            const lock = isLocked ? '<i class="fa-solid fa-lock text-amber-500 ml-auto text-[10px]"></i>' : '';
            const badge = (!isLocked && p.companies) ? `<span class="ml-auto text-[9px] bg-gray-100 dark:bg-white/10 px-1 rounded text-gray-500">${p.companies.split(',')[0]}</span>` : '';

            item.innerHTML = `
                <div class="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    ${icon}
                    <span class="truncate w-32 ${isLocked ? 'text-gray-400' : 'font-medium'}">${p.title}</span>
                    ${lock}
                    ${badge}
                </div>
                <div class="flex items-center gap-2 mt-1 ml-5">
                    <span class="w-1.5 h-1.5 rounded-full ${p.difficulty === 'Easy' ? 'bg-green-500' : p.difficulty === 'Medium' ? 'bg-amber-500' : 'bg-red-500'}"></span>
                    <span class="text-[10px] text-gray-400 truncate">${p.topic || 'General'}</span>
                </div>
            `;
            item.onclick = () => this.loadProblem(p.id);
            list.appendChild(item);
        });
    },

    loadProblem(id) {
        const problem = problemsDB.find(p => String(p.id) === String(id)); 
        if(!problem) return;

        // --- FREEMIUM CHECK ---
        const isPremium = problem.isPremium === true || String(problem.isPremium).toUpperCase() === 'TRUE';
        if (isPremium && !this.state.isPremiumUser) {
            paymentManager.triggerModal(problem.title);
            return;
        }

        window.location.hash = `problem=${id}`;
        this.state.currentProblem = problem;
        this.updateSidebarSelection(id);
        
        // Auto-close sidebar on mobile for cleaner view
        if(window.innerWidth < 768) {
            ui.sidebarOpen = false;
            ui.applySidebarState();
        }

        // Render Description
        const container = document.getElementById('problem-desc-container');
        if(container) {
            container.innerHTML = `
                <h1 class="text-xl font-bold text-gray-900 dark:text-white mb-2">${problem.title}</h1>
                <div class="flex gap-2 mb-4">
                    <span class="px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-xs font-bold text-gray-600 dark:text-gray-300">${problem.difficulty}</span>
                    <span class="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-500/10 text-xs font-bold text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">${problem.topic || 'General'}</span>
                </div>
                <div class="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed">
                    ${problem.description}
                </div>
            `;
            
            // SQL Schema Rendering
            if (problem.type === 'sql') {
                this.renderSchema(problem);
            }
        }

        if(this.editor) {
            this.editor.setValue(problem.starter || '');
            const mode = problem.type === 'sql' ? 'text/x-sql' : 'python';
            this.editor.setOption('mode', mode);
        }
        
        if(document.getElementById('lang-indicator')) document.getElementById('lang-indicator').innerText = problem.type.toUpperCase();
        if(document.getElementById('console-output')) document.getElementById('console-output').innerHTML = '';
        if(document.getElementById('save-status')) document.getElementById('save-status').innerText = '';
    },

    renderSchema(problem) {
        try {
            alasql('DROP DATABASE IF EXISTS temp_load_db');
            alasql('CREATE DATABASE temp_load_db');
            alasql('USE temp_load_db');
            
            if (problem.setup_sql) {
                const stmts = problem.setup_sql.split(';');
                for(let stmt of stmts) {
                    if(stmt.trim()) try { alasql(stmt); } catch(e) {}
                }
                
                const tables = alasql('SHOW TABLES');
                if (tables.length > 0) {
                    const container = document.getElementById('problem-desc-container');
                    let html = '<div class="mt-6 pt-4 border-t border-gray-200 dark:border-white/10"><h3 class="font-bold text-sm text-gray-500 uppercase mb-3">Database Schema</h3>';
                    
                    tables.forEach(t => {
                        const tableName = t.tableid;
                        const cols = alasql(`SHOW COLUMNS FROM ${tableName}`);
                        html += `
                            <div class="mb-3 p-3 bg-gray-50 dark:bg-white/5 rounded border border-gray-200 dark:border-white/5">
                                <div class="font-bold text-xs mb-2 flex items-center gap-2 text-gray-700 dark:text-white">
                                    <i class="fa-solid fa-table text-gray-400"></i> ${tableName}
                                </div>
                                <div class="space-y-1">
                                    ${cols.map(c => `
                                        <div class="flex justify-between text-[10px] font-mono text-gray-500">
                                            <span>${c.columnid}</span>
                                            <span class="text-brand-accent">${c.type || 'INT'}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `;
                    });
                    
                    // Show Sample Output if solution exists
                    if (problem.solution_sql) {
                        try {
                            const result = alasql(problem.solution_sql);
                            if (Array.isArray(result) && result.length > 0) {
                                html += '<h3 class="font-bold text-sm text-gray-500 uppercase mb-2 mt-4">Expected Output</h3>';
                                html += ui.generateTableHtml(result.slice(0, 5), 'border-purple-200 dark:border-purple-900/30');
                            }
                        } catch(e) {}
                    }

                    container.innerHTML += html + '</div>';
                }
            }
            alasql('DROP DATABASE IF EXISTS temp_load_db');
        } catch (e) {
            console.error("Schema Render Error", e);
        }
    },

    updateSidebarSelection(activeId) {
        document.querySelectorAll('#problem-list > div').forEach(el => {
            el.className = el.className.replace('border-brand-accent bg-indigo-50 dark:bg-white/5', 'border-transparent');
        });
        const activeItem = document.getElementById(`prob-item-${activeId}`);
        if(activeItem) {
            activeItem.className = activeItem.className.replace('border-transparent', 'border-brand-accent bg-indigo-50 dark:bg-white/5');
        }
    },

    // --- PROJECTS LOGIC ---
    filterProjects(type) {
        this.state.projectFilter = type;
        this.renderProjects();
    },

    renderProjects() {
        const grid = document.getElementById('projects-grid');
        if(!grid) return;
        
        const projects = problemsDB.filter(p => p.category && p.category.includes('Project') && 
            (this.state.projectFilter === 'All' || p.category.includes(this.state.projectFilter))
        );

        if(projects.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-center text-gray-500 py-10">No projects match the criteria.</div>';
            return;
        }

        grid.innerHTML = projects.map(p => {
            const isPremium = p.isPremium === true || String(p.isPremium).toUpperCase() === 'TRUE';
            const isLocked = isPremium && !this.state.isPremiumUser;
            
            const lockOverlay = isLocked ? `
                <div class="absolute inset-0 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center rounded-xl text-center p-4">
                    <div class="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-2">
                        <i class="fa-solid fa-lock text-yellow-600 dark:text-yellow-500 text-xl"></i>
                    </div>
                    <h3 class="text-gray-900 dark:text-white font-bold text-sm">Premium Project</h3>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-3">Upgrade to access.</p>
                    <button onclick="paymentManager.triggerModal('${p.title}')" class="px-4 py-1.5 bg-brand-dark dark:bg-white text-white dark:text-black text-xs font-bold rounded-full shadow-lg hover:transform hover:scale-105 transition">Unlock Now</button>
                </div>
            ` : '';

            const isGuided = p.category.includes('Guided');
            const diffColor = p.difficulty === 'Easy' ? 'text-green-600 border-green-200' : p.difficulty === 'Medium' ? 'text-amber-600 border-amber-200' : 'text-red-600 border-red-200';
            const typeBadge = isGuided ? 'text-purple-600 border-purple-200' : 'text-orange-600 border-orange-200';

            return `
            <div class="relative group bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-white/5 rounded-xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                ${lockOverlay}
                
                <div class="flex justify-between items-start mb-4">
                    <div class="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500 text-lg">
                        <i class="fa-solid fa-briefcase"></i>
                    </div>
                    <div class="flex gap-2">
                         <span class="px-2 py-1 rounded text-[10px] font-bold uppercase border bg-gray-50 dark:bg-white/5 ${typeBadge}">${isGuided ? 'Guided' : 'Unguided'}</span>
                         <span class="px-2 py-1 rounded text-[10px] font-bold uppercase border bg-gray-50 dark:bg-white/5 ${diffColor}">${p.difficulty}</span>
                    </div>
                </div>
                
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-brand-accent transition">${p.title}</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-6 line-clamp-2">${p.description ? p.description.replace(/<[^>]*>?/gm, '') : 'No description.'}</p>
                
                <div class="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
                     <div class="flex gap-2 items-center">
                        ${p.type === 'sql' ? '<i class="fa-solid fa-database text-orange-500" title="SQL"></i>' : '<i class="fa-brands fa-python text-blue-500" title="Python"></i>'}
                        <span class="text-xs text-gray-400 font-mono">${p.id}</span>
                     </div>
                     <button onclick="app.loadProblem('${p.id}'); router.navigate('playground');" class="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">Start Project &rarr;</button>
                </div>
            </div>
            `;
        }).join('');
    }
};

const paymentManager = {
    unlockPro() {
        this.triggerModal('DataDrill Pro Lifetime');
    },
    triggerModal(itemName) {
        if(!app.state.user) { authManager.login(); return; }
        
        const options = {
            "key": typeof RAZORPAY_KEY_ID !== 'undefined' ? RAZORPAY_KEY_ID : '', 
            "amount": "49900", // 499 INR
            "currency": "INR",
            "name": "DataDrill Pro",
            "description": "Unlock: " + itemName,
            "image": "LBA.png",
            "handler": function (response){
                paymentManager.handleSuccess(response);
            },
            "prefill": { "name": app.state.user.displayName, "email": app.state.user.email },
            "theme": { "color": "#6366f1" }
        };
        
        if(!options.key) {
            alert("Razorpay Key Missing in config.js");
            return;
        }
        
        const rzp1 = new Razorpay(options);
        rzp1.open();
    },
    async handleSuccess(response) {
        if(app.state.mode === 'firebase') {
            const fb = window.firebaseModules;
            try {
                const userRef = fb.doc(app.state.db, 'users', app.state.user.uid);
                await fb.setDoc(userRef, { isPremium: true }, { merge: true });
                app.state.isPremiumUser = true;
                
                alert("🎉 Payment Successful! Welcome to Pro.");
                authManager.updateUI(app.state.user);
                
                // Refresh views
                if(app.state.currentProblem) app.loadProblem(app.state.currentProblem.id);
                app.applyFilters(); 
                app.renderProjects();
            } catch(e) { console.error("Update failed", e); }
        } else {
            alert("Payment simulated (Local Mode). Refresh to reset.");
            app.state.isPremiumUser = true;
            app.applyFilters();
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
            app.state.isPremiumUser = false; 
            this.updateUI(mockUser);
        }
    },
    logout() {
        if (app.state.mode === 'firebase') {
            window.firebaseModules.signOut(app.state.auth);
        } else {
            localStorage.removeItem('mockUser');
            app.state.user = null;
            app.state.isPremiumUser = false;
            this.updateUI(null);
        }
        router.navigate('landing');
    },
    checkLocalAuth() {
        const saved = localStorage.getItem('mockUser');
        if (saved) {
            app.state.user = JSON.parse(saved);
            app.state.isPremiumUser = false;
            this.updateUI(app.state.user);
        }
    },
    updateUI(user) {
        if (user) {
            document.getElementById('btn-login').classList.add('hidden');
            document.getElementById('user-profile-menu').classList.remove('hidden');
            document.getElementById('user-profile-menu').classList.add('flex');
            
            if(app.state.isPremiumUser) {
                document.getElementById('btn-upgrade-nav').classList.add('hidden');
                const badge = document.getElementById('pro-badge');
                if(badge) badge.classList.remove('hidden');
            } else {
                document.getElementById('btn-upgrade-nav').classList.remove('hidden');
                document.getElementById('btn-upgrade-nav').classList.add('flex');
            }
            
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
            document.getElementById('btn-upgrade-nav').classList.add('hidden');
        }
    },
    async loadLeaderboard() {
        // ... (Keep existing implementation logic)
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
                if(index === 0) medal = '🥇'; if(index === 1) medal = '🥈'; if(index === 2) medal = '🥉';
                const safeName = encodeURIComponent(u.displayName || 'User');
                const displayPhoto = u.photoURL || `https://ui-avatars.com/api/?name=${safeName}&background=random`;

                const tr = document.createElement('tr');
                tr.className = "hover:bg-gray-100 dark:hover:bg-gray-800 transition";
                tr.innerHTML = `
                    <td class="px-6 py-4 font-bold text-gray-500">${medal || (index + 1)}</td>
                    <td class="px-6 py-4 flex items-center gap-3">
                        <img src="${displayPhoto}" class="w-8 h-8 rounded-full object-cover">
                        <span class="font-medium text-gray-900 dark:text-white">${u.displayName || 'Unknown'}</span>
                    </td>
                    <td class="px-6 py-4 text-right font-bold text-brand-accent">${u.solvedCount || 0}</td>
                `;
                tbody.appendChild(tr);
            });
        } catch(e) { console.error(e); loading.innerText = "Failed to load leaderboard."; }
    },
    async loadProfileData() {
        // ... (Keep existing implementation logic)
        if (!app.state.user) { alert("Please login."); router.navigate('landing'); return; }
        const user = app.state.user;
        
        if(document.getElementById('profile-view-name')) document.getElementById('profile-view-name').innerText = user.displayName;
        const profileImg = document.getElementById('profile-view-avatar');
        if(profileImg) profileImg.src = user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`;

        // Load History
        const history = await persistence.getHistory(app.state.user.uid);
        const uniqueSolved = new Set(history.filter(h => h.status === 'Passed').map(h => h.problemId)).size;
        
        if(document.getElementById('stat-solved')) document.getElementById('stat-solved').innerText = uniqueSolved;
        
        // Render Chart & Badges if containers exist
        ui.renderActivityChart(history);
        if (typeof badgeManager !== 'undefined') badgeManager.render(history);

        // Render Table
        const tbody = document.getElementById('history-table-body');
        if(!tbody) return;
        tbody.innerHTML = '';
        
        if(history.length === 0) {
            if(document.getElementById('empty-history')) document.getElementById('empty-history').classList.remove('hidden');
        } else {
            if(document.getElementById('empty-history')) document.getElementById('empty-history').classList.add('hidden');
            history.sort((a,b) => b.timestamp - a.timestamp).slice(0, 10).forEach(h => {
                const tr = document.createElement('tr');
                tr.className = "hover:bg-gray-50 dark:hover:bg-white/5 transition";
                tr.innerHTML = `
                    <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">${h.problemTitle}</td>
                    <td class="px-6 py-4">
                        ${h.status === 'Passed' ? '<span class="text-green-600"><i class="fa-solid fa-check"></i> Passed</span>' : '<span class="text-red-600"><i class="fa-solid fa-xmark"></i> Failed</span>'}
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
        // Handled in HTML classes generally, but logic kept for safety
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
        this.applySidebarState();
    },
    applySidebarState() {
        const sidebar = document.getElementById('app-sidebar');
        const resizer = document.getElementById('resizer-sidebar');
        if(this.sidebarOpen) {
            sidebar.style.width = '250px'; 
            sidebar.style.display = 'flex';
            if(resizer) resizer.style.display = 'block';
        } else {
            sidebar.style.width = '0px'; 
            sidebar.style.display = 'none';
            if(resizer) resizer.style.display = 'none';
        }
        setTimeout(() => app.editor && app.editor.refresh(), 200);
    },
    injectSidebarToggle() {
        // Replaced by navbar button in this new design, but kept for compatibility
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
        return `
            <div class="overflow-x-auto border ${customClass} rounded bg-white dark:bg-gray-900/50 mb-1">
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
        // ... (Keep existing implementation logic)
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
    },
    renderActivityChart(history) {
        // ... (Keep existing implementation logic)
        const container = document.getElementById('activity-chart-container');
        if (!container) return;

        const activityMap = {};
        history.forEach(h => {
            const date = new Date(h.timestamp).toISOString().split('T')[0];
            activityMap[date] = (activityMap[date] || 0) + 1;
        });

        let html = '<div class="flex gap-1 flex-wrap justify-center max-w-2xl mx-auto">';
        
        for (let i = 90; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const count = activityMap[dateStr] || 0;
            
            let colorClass = 'bg-gray-200 dark:bg-gray-800'; 
            let title = `${dateStr}: No activity`;
            
            if (count > 0) {
                if (count >= 7) {
                    colorClass = 'bg-green-800 dark:bg-green-600 shadow-sm shadow-green-900/50';
                    title = `${dateStr}: ${count} submissions (On Fire!)`;
                } else {
                    colorClass = 'bg-green-400 dark:bg-green-500';
                    title = `${dateStr}: ${count} submissions`;
                }
            }
            
            html += `<div class="w-3 h-3 rounded-sm ${colorClass} hover:ring-1 ring-offset-1 ring-blue-500 transition cursor-help" title="${title}"></div>`;
        }
        
        html += '</div>';
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
    }
};

const router = {
    history: [],
    navigate(viewId) {
        // History Logic for Back Button
        if (viewId === 'playground' && app.state.lastView !== 'playground') {
            this.history.push(app.state.lastView);
        }
        app.state.lastView = viewId;

        ['view-landing', 'view-playground', 'view-leaderboard', 'view-profile', 'view-projects'].forEach(id => {
            document.getElementById(id).classList.add('hidden-view');
        });
        document.getElementById(`view-${viewId}`).classList.remove('hidden-view');
        
        if(viewId === 'profile') authManager.loadProfileData();
        if(viewId === 'leaderboard') authManager.loadLeaderboard();
        if(viewId === 'projects') app.renderProjects();
        
        if(viewId === 'playground') {
             setTimeout(() => {
                 const consolePanel = document.getElementById('console-panel');
                 const parent = consolePanel ? consolePanel.parentElement : null;
                 if (consolePanel && parent) {
                     const halfHeight = parent.clientHeight / 2;
                     consolePanel.style.height = `${halfHeight}px`;
                     if(app.editor) app.editor.refresh();
                 }
             }, 50);
             // Show sidebar toggle in mobile navbar logic if needed, 
             // but here we have persistent layout.
        }

        // URL Hash
        if (viewId === 'landing') window.location.hash = 'landing';
        if (viewId === 'leaderboard') window.location.hash = 'leaderboard';
        if (viewId === 'profile') window.location.hash = 'profile';
        if (viewId === 'projects') window.location.hash = 'projects';
    },
    back() {
        const prev = this.history.pop() || 'landing';
        this.navigate(prev);
    }
};

const verifier = {
    cleanValue(val) {
        if (val === null || val === undefined) return null;
        if (typeof val === 'string') return val.trim();
        return val;
    },
    normalizeDataset(dataset) {
        if (!Array.isArray(dataset)) return [];
        return dataset.map(row => {
            const cleanRow = {};
            const keys = Object.keys(row).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
            keys.forEach(key => {
                cleanRow[key.toLowerCase()] = this.cleanValue(row[key]);
            });
            return cleanRow;
        }).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    },
    compare(actual, expected) {
        try {
            const normActual = this.normalizeDataset(actual);
            const normExpected = this.normalizeDataset(expected);
            const isMatch = JSON.stringify(normActual) === JSON.stringify(normExpected);
            if (!isMatch) {
                console.log("Verifier Mismatch Details:");
                console.log("Normalized User Output:", normActual);
                console.log("Normalized Expected Output:", normExpected);
            }
            return isMatch;
        } catch (e) {
            console.error("Verifier System Error:", e);
            return false;
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
                if(!passed) { this.log("❌ FAILED: Solution did not pass tests.", true); }
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
                alasql('DROP DATABASE IF EXISTS testdb'); alasql('CREATE DATABASE testdb'); alasql('USE testdb');
                if (problem.setup_sql) {
                     const stmts = problem.setup_sql.split(';');
                     for(let stmt of stmts) if(stmt.trim()) try { alasql(stmt); } catch(e) {}
                }
                let expectedResult;
                try { expectedResult = alasql(problem.solution_sql); } catch(e) { this.log("Config Error: Solution SQL invalid.", true); return false; }

                alasql('DROP DATABASE IF EXISTS testdb'); alasql('CREATE DATABASE testdb'); alasql('USE testdb');
                if (problem.setup_sql) {
                     const stmts = problem.setup_sql.split(';');
                     for(let stmt of stmts) if(stmt.trim()) try { alasql(stmt); } catch(e) {}
                }
                const actualResult = alasql(code);

                const isMatch = verifier.compare(actualResult, expectedResult);
                if (isMatch) { return true; } 
                else { 
                    this.log("❌ Wrong Answer"); 
                    this.log("YOUR OUTPUT", false, "text-red-600 dark:text-red-400 font-bold mt-2 mb-1");
                    if(Array.isArray(actualResult) && actualResult.length > 0) this.logTable(actualResult, 'border-red-500 dark:border-red-500');
                    else this.log("[] (Empty)", false, "text-red-500");

                    this.log("EXPECTED OUTPUT", false, "text-green-600 dark:text-green-400 font-bold mt-2 mb-1");
                    if(Array.isArray(expectedResult) && expectedResult.length > 0) this.logTable(expectedResult, 'border-green-500 dark:border-green-500');
                    else this.log("[] (Empty)", false, "text-green-500");
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
                } catch(e) { console.error("Leaderboard update failed:", e); }
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

const starManager = {
    getStarData(track) {
        if (!problemsDB || problemsDB.length === 0) return { count: 0, total: 0, stars: 0 };
        // Count only practice problems
        const trackProblems = problemsDB.filter(p => p.type === track && (!p.category || p.category === 'Practice'));
        const total = trackProblems.length;
        if (total === 0) return { count: 0, total: 0, stars: 0 };

        let solvedCount = 0;
        trackProblems.forEach(p => { if (app.state.solvedProblemIds.has(p.id)) solvedCount++; });

        const percentage = (solvedCount / total) * 100;
        let stars = 0;
        if (percentage === 0) stars = 0;
        else if (percentage <= 20) stars = 1;
        else if (percentage <= 40) stars = 2;
        else if (percentage <= 60) stars = 3;
        else if (percentage <= 80) stars = 4;
        else stars = 5;

        return { count: solvedCount, total, stars };
    },
    generateStarHTML(stars) {
        let html = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= stars) html += '<i class="fa-solid fa-star text-yellow-400 text-[10px] drop-shadow-sm"></i>';
            else html += '<i class="fa-regular fa-star text-gray-300 dark:text-gray-600 text-[10px]"></i>';
        }
        return html;
    },
    render() {
        if (!app.state.user) {
            const existing = document.getElementById('navbar-stars');
            if (existing) existing.innerHTML = '';
            return;
        }
        let container = document.getElementById('navbar-stars');
        if (!container) {
            container = document.createElement('div');
            container.id = 'navbar-stars';
            container.className = "hidden md:flex items-center gap-3 mr-2 px-3 py-1 bg-gray-50 dark:bg-gray-800/50 rounded-full border border-gray-100 dark:border-gray-700/50";
            const themeBtn = document.getElementById('theme-btn');
            if (themeBtn && themeBtn.parentElement) { themeBtn.parentElement.insertBefore(container, themeBtn); }
        }
        container.innerHTML = '';

        let tracksToShow = [];
        if (app.state.currentTrack) { tracksToShow = [app.state.currentTrack]; } 
        else { 
            const allTracks = new Set(problemsDB.map(p => p.type));
            tracksToShow = Array.from(allTracks);
        }

        tracksToShow.forEach(track => {
            const data = this.getStarData(track);
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