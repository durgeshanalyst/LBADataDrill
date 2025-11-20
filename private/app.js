/*************************************************************************
 *  obfuscator.io to generate the final and protected app.js
 * date: 11/20/25
 * 
 * 
 * 
 * **************************************************************************/ 
// --- APPLICATION LOGIC ---

const app = {
    state: {
        user: null,
        currentTrack: null,
        currentProblem: null,
        currentFilter: 'All',
        db: null,
        auth: null,
        mode: 'local'
    },

    async init() {
        // 1. Initialize Theme
        themeManager.init();

        // 2. Initialize Editor
        this.editor = CodeMirror.fromTextArea(document.getElementById('code-editor'), {
            lineNumbers: true, 
            theme: themeManager.isDark() ? 'dracula' : 'eclipse',
            tabSize: 4, 
            indentUnit: 4, 
            lineWrapping: true
        });

        // 3. Load Problems
        try {
            document.getElementById('problem-list').innerHTML = '<div class="text-gray-500 p-4">Loading problems...</div>';
            const response = await fetch(GOOGLE_SHEET_API);
            problemsDB = await response.json();
            this.updateLandingCounts();
        } catch (e) {
            console.error("Failed", e);
            document.getElementById('problem-list').innerHTML = '<div class="text-red-500 p-4">Error loading problems.</div>';
        }

        this.initEngines();
        this.initAuth();
        ui.initResizers();
        router.navigate('landing');
    },

    updateLandingCounts() {
        const pyCount = problemsDB.filter(p => p.type === 'python').length;
        const sqlCount = problemsDB.filter(p => p.type === 'sql').length;
        const pyEl = document.getElementById('python-count');
        const sqlEl = document.getElementById('sql-count');
        if (pyEl) pyEl.innerText = `${pyCount} Problems`;
        if (sqlEl) sqlEl.innerText = `${sqlCount} Problems`;
    },

    initAuth() {
        if (firebaseConfig.apiKey && window.firebaseModules) {
            try {
                const fb = window.firebaseModules;
                const appInst = fb.initializeApp(firebaseConfig);
                this.state.auth = fb.getAuth(appInst);
                this.state.db = fb.getFirestore(appInst);
                this.state.mode = 'firebase';
                fb.onAuthStateChanged(this.state.auth, (user) => {
                    this.state.user = user;
                    authManager.updateUI(user);
                });
            } catch(e) { console.error("Firebase Init Failed:", e); }
        } else {
            authManager.checkLocalAuth();
        }
    },

    async initEngines() {
        if (!window.pyodide && typeof loadPyodide !== 'undefined') {
            try { window.pyodide = await loadPyodide(); } catch (e) { }
        }
    },

    selectTrack(track) {
        this.state.currentTrack = track;
        this.renderTopicFilters(); 
        this.filterProblems('All'); 
        if(this.getFilteredProblems('All').length > 0) {
            this.loadProblem(this.getFilteredProblems('All')[0].id);
        }
        router.navigate('playground');
        setTimeout(() => { if(this.editor) this.editor.refresh(); }, 100);
    },

    renderTopicFilters() {
        const container = document.getElementById('topic-filters');
        container.innerHTML = '';
        const trackProblems = problemsDB.filter(p => p.type === this.state.currentTrack);
        const topics = new Set(['All']);
        trackProblems.forEach(p => { if (p.topic) topics.add(p.topic); });

        topics.forEach(topic => {
            const btn = document.createElement('button');
            btn.className = `topic-tag px-2 py-1 text-[10px] border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:text-white transition mb-1 mr-1`;
            btn.innerText = topic;
            btn.onclick = () => {
                document.querySelectorAll('.topic-tag').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                app.filterProblems(topic);
            };
            if (topic === 'All') btn.classList.add('active');
            container.appendChild(btn);
        });
    },

    getFilteredProblems(filter) {
        let p = problemsDB.filter(p => p.type === this.state.currentTrack);
        if (filter !== 'All') p = p.filter(p => p.topic === filter);
        return p;
    },

    filterProblems(filter) {
        this.state.currentFilter = filter;
        const problems = this.getFilteredProblems(filter);
        this.renderSidebar(problems);
    },

    renderSidebar(problems) {
        const list = document.getElementById('problem-list');
        list.innerHTML = '';
        if (problems.length === 0) {
            list.innerHTML = '<div class="p-4 text-xs text-gray-500 italic">No problems found.</div>';
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

            item.innerHTML = `
                <div class="flex justify-between items-center">
                    <span>${p.title}</span>
                    <span class="w-2 h-2 rounded-full ${diffColor}" title="${p.difficulty}"></span>
                </div>
                <div class="text-[10px] text-gray-400 dark:text-gray-500 mt-1">${p.topic || 'General'}</div>
            `;
            item.onclick = () => this.loadProblem(p.id);
            list.appendChild(item);
        });
    },

    loadProblem(id) {
        const problem = problemsDB.find(p => String(p.id) === String(id)); 
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

        if (problem.type === 'sql' && problem.setup_sql) {
            htmlContent += schemaUtils.generateHTML(problem.setup_sql);
        }

        document.getElementById('problem-desc-container').innerHTML = htmlContent;

        this.editor.setValue(problem.starter);
        const mode = problem.type === 'sql' ? 'text/x-sql' : 'python';
        this.editor.setOption('mode', mode);
        
        document.getElementById('lang-indicator').innerText = problem.type.toUpperCase();
        document.getElementById('console-output').innerHTML = '';
        document.getElementById('save-status').innerText = '';
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

// --- THEME MANAGER ---
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

// --- SCHEMA UTILS ---
const schemaUtils = {
    generateHTML(sql) {
        const tableRegex = /CREATE\s+TABLE\s+(\w+)\s*\(([^)]+)\)/gi;
        let match;
        let html = '<div class="mt-8 border-t border-gray-200 dark:border-gray-700 pt-4"><h3 class="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-4">Database Schema</h3>';

        let found = false;
        while ((match = tableRegex.exec(sql)) !== null) {
            found = true;
            const tableName = match[1];
            const columnsStr = match[2];
            const columns = columnsStr.split(',').map(c => {
                const parts = c.trim().split(/\s+/);
                return { name: parts[0], type: parts.slice(1).join(' ') };
            });
            html += `
                <div class="mb-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900/50 p-4">
                    <div class="flex items-center gap-2 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                        <i class="fa-solid fa-table text-blue-500 dark:text-blue-400"></i>
                        <span class="font-bold text-gray-800 dark:text-white">${tableName}</span>
                    </div>
                    <div class="grid grid-cols-1 gap-y-1">
                        ${columns.map(col => `
                            <div class="flex justify-between text-xs font-mono">
                                <span class="text-gray-600 dark:text-gray-300">${col.name}</span>
                                <span class="text-gray-400 dark:text-gray-500 uppercase">${col.type}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        html += '</div>';
        return found ? html : '';
    }
};

// --- UI MANAGER ---
const ui = {
    sidebarOpen: true,
    consoleOpen: true,
    toggleSidebar() {
        const sidebar = document.getElementById('app-sidebar');
        this.sidebarOpen = !this.sidebarOpen;
        if (this.sidebarOpen) {
            sidebar.style.width = '250px'; sidebar.classList.remove('w-0', 'p-0'); sidebar.classList.add('p-4', 'border-r');
        } else {
            sidebar.style.width = '0px'; sidebar.classList.add('w-0', 'p-0'); sidebar.classList.remove('p-4', 'border-r');
        }
        setTimeout(() => app.editor.refresh(), 300);
    },
    toggleConsole() {
        const panel = document.getElementById('console-panel');
        this.consoleOpen = !this.consoleOpen;
        panel.style.height = this.consoleOpen ? '200px' : '40px';
    },
    initResizers() {
        const resizerConsole = document.getElementById('resizer-console');
        const consolePanel = document.getElementById('console-panel');
        if(resizerConsole) {
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
                    app.editor.refresh();
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
                    if (newW > 150 && newW < 500) sidebar.style.width = `${newW}px`;
                };
                const onMouseUp = () => {
                    document.body.style.cursor = 'default';
                    window.removeEventListener('mousemove', onMouseMove);
                    window.removeEventListener('mouseup', onMouseUp);
                    app.editor.refresh();
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
                    app.editor.refresh();
                };
                window.addEventListener('mousemove', onMouseMove);
                window.addEventListener('mouseup', onMouseUp);
            });
        }
    }
};

// --- ROUTER ---
const router = {
    navigate(viewId) {
        ['view-landing', 'view-playground', 'view-profile'].forEach(id => {
            document.getElementById(id).classList.add('hidden-view');
        });
        document.getElementById(`view-${viewId}`).classList.remove('hidden-view');
        if(viewId === 'profile') authManager.loadProfileData();
    }
};

// --- AUTH MANAGER ---
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
            document.getElementById('user-name').innerText = user.displayName || "Student";
            const avatarUrl = user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=random`;
            document.getElementById('user-avatar').src = avatarUrl;
        } else {
            document.getElementById('btn-login').classList.remove('hidden');
            document.getElementById('user-profile-menu').classList.add('hidden');
            document.getElementById('user-profile-menu').classList.remove('flex');
        }
    },
    async loadProfileData() {
        if (!app.state.user) {
            alert("Please login to view profile");
            router.navigate('landing');
            return;
        }
        const user = app.state.user;
        const avatarUrl = user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}&background=random`;
        document.getElementById('profile-view-name').innerText = user.displayName;
        document.getElementById('profile-view-avatar').src = avatarUrl;

        const history = await persistence.getHistory(app.state.user.uid);
        const uniqueSolved = new Set(history.filter(h => h.status === 'Passed').map(h => h.problemId)).size;
        document.getElementById('stat-solved').innerText = uniqueSolved;
        document.getElementById('stat-rate').innerText = Math.round((uniqueSolved / problemsDB.length) * 100) + '%';
        const tbody = document.getElementById('history-table-body');
        tbody.innerHTML = '';
        if(history.length === 0) {
            document.getElementById('empty-history').classList.remove('hidden');
        } else {
            document.getElementById('empty-history').classList.add('hidden');
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

// --- VERIFIER ---
const verifier = {
    normalizeSQL(result) {
        if (!Array.isArray(result)) return [];
        const sortedKeys = result.map(row => {
            return Object.keys(row).sort().reduce((obj, key) => {
                obj[key] = row[key];
                return obj;
            }, {});
        });
        return sortedKeys.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    },
    compare(actual, expected) {
        const normActual = this.normalizeSQL(actual);
        const normExpected = this.normalizeSQL(expected);
        return JSON.stringify(normActual) === JSON.stringify(normExpected);
    }
};

// --- RUNNER ---
const runner = {
    log(msg, isError = false, customClass = '') {
        const div = document.getElementById('console-output');
        if (div) {
            let colorClass = isError ? 'text-red-500 dark:text-red-400' : 'text-gray-700 dark:text-gray-300';
            if (customClass) colorClass = customClass;
            div.innerHTML += `<div class="${colorClass} border-b border-gray-200 dark:border-gray-800 py-1 font-mono text-xs">> ${msg}</div>`;
            div.scrollTop = div.scrollHeight;
        }
    },
    logTable(data) {
        const div = document.getElementById('console-output');
        if (!div || !Array.isArray(data) || data.length === 0) return;
        const limit = 10;
        const slicedData = data.slice(0, limit);
        const headers = Object.keys(slicedData[0]);
        let html = `
            <div class="overflow-x-auto my-2 border border-gray-300 dark:border-gray-700 rounded">
                <table class="min-w-full text-xs text-left text-gray-700 dark:text-gray-300">
                    <thead class="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 uppercase font-medium">
                        <tr>${headers.map(h => `<th class="px-4 py-2 border-b border-gray-300 dark:border-gray-700">${h}</th>`).join('')}</tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
                        ${slicedData.map(row => `
                            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                ${headers.map(h => `<td class="px-4 py-2 whitespace-nowrap font-mono">${row[h] !== null ? row[h] : '<span class="text-gray-400 dark:text-gray-600">NULL</span>'}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        if (data.length > limit) html += `<div class="text-[10px] text-gray-500 italic px-2 pb-2">... showing first ${limit} of ${data.length} rows</div>`;
        div.innerHTML += html;
        div.scrollTop = div.scrollHeight;
    },
    setLoading(isLoading) {
        const btn = document.getElementById('run-btn');
        if (!btn) return;
        if (isLoading) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i>Running...';
            btn.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-play mr-1"></i> Run';
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
                        problemId: problem.id,
                        problemTitle: problem.title,
                        track: problem.type,
                        code: code,
                        status: passed ? 'Passed' : 'Failed',
                        timestamp: Date.now()
                    });
                    document.getElementById('save-status').innerText = "Saved to Portal";
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
        if (!window.pyodide) { this.log("⚠️ Python engine is still loading... wait 5s", true); return false; }
        try {
            let outputCaptured = false;
            window.pyodide.setStdout({ batched: (msg) => { this.log(msg); outputCaptured = true; }});
            const result = await window.pyodide.runPythonAsync(code); 
            if (!isSubmission) {
                if (result !== undefined) {
                    this.log("Result: " + result, false, "text-blue-600 dark:text-blue-400 font-bold");
                } else if (!outputCaptured) {
                    this.log("ℹ️ Code ran successfully.", false, "text-yellow-600 dark:text-yellow-500");
                    this.log("   (Tip: Use print() to see output)", false, "text-yellow-700 dark:text-yellow-600 italic");
                }
            }
            if (isSubmission) {
                this.log("\n--- Verifying Solution ---");
                if (!problem.test_code) { this.log("⚠️ No test code found.", true); return false; }
                await window.pyodide.runPythonAsync(code + "\n" + problem.test_code);
                const output = document.getElementById('console-output').innerText;
                return output.includes("✅ Passed");
            }
            return true; 
        } catch (err) {
            this.log(err, true);
            return false;
        }
    },
    runSQL(code, problem, isSubmission) {
        if (typeof alasql === 'undefined') { this.log("⚠️ SQL Engine not loaded.", true); return false; }
        try { alasql('DROP DATABASE IF EXISTS testdb'); alasql('CREATE DATABASE testdb'); alasql('USE testdb'); } catch (e) { this.log("System Error (DB Init): " + e.message, true); return false; }
        if (problem.setup_sql) { try { alasql(problem.setup_sql); } catch (e) { this.log("Setup Error: " + e.message, true); return false; } }
        try {
            const userResult = alasql(code);
            if(Array.isArray(userResult)) {
                if(userResult.length === 0) { this.log("Query executed. Result: [] (Empty)"); } 
                else { this.log("Query Result:", false, "text-blue-600 dark:text-blue-400"); this.logTable(userResult); }
            } else {
                this.log("Query Executed Successfully.");
            }
            if(isSubmission) {
                this.log("\n--- Verifying Solution ---");
                alasql('DROP DATABASE IF EXISTS testdb'); alasql('CREATE DATABASE testdb'); alasql('USE testdb');
                if (problem.setup_sql) alasql(problem.setup_sql);
                let expectedResult;
                try { expectedResult = alasql(problem.solution_sql); } catch(e) { this.log("Configuration Error: Solution SQL is invalid.", true); return false; }
                alasql('DROP DATABASE IF EXISTS testdb'); alasql('CREATE DATABASE testdb'); alasql('USE testdb');
                if (problem.setup_sql) alasql(problem.setup_sql);
                const actualResult = alasql(code);
                if (verifier.compare(actualResult, expectedResult)) { this.log("✅ Passed! Good job."); return true; } 
                else { this.log("❌ Failed. Result does not match expected output.", true); return false; }
            }
            return true;
        } catch(e) { this.log("SQL Error: " + e.message, true); return false; }
    }
};

// --- PERSISTENCE ---
const persistence = {
    async saveSubmission(data) {
        if (app.state.mode === 'firebase') {
            const fb = window.firebaseModules;
            await fb.addDoc(fb.collection(app.state.db, "submissions"), data);
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

window.onload = app.init.bind(app);