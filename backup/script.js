// Utils
const el = id => document.getElementById(id);
const qAll = sel => document.querySelectorAll(sel);

// Core State
let currEquip = "";
let activeJobIdx = null;
let jobList = [];
let sessionName = null;
let sessionPhone = null; 
let picArray = [];
let authMode = "signup";
let userDb = {}; 
let isEditing = false;
let isWorker = false;

const MASTER_PIN = "8919782479";

const drawPencil = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`;
const drawCheck = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
const drawCam = `<svg class="inline-cam-svg" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>`;

// Store management (Fix for mobile reloads)
const storeSync = () => {
    let payload = { n: sessionName, p: sessionPhone, db: userDb, w: isWorker };
    localStorage.setItem('hew_cache', JSON.stringify(payload));
};

const restoreSync = () => {
    try {
        let str = localStorage.getItem('hew_cache');
        if(!str) return;
        let obj = JSON.parse(str);
        sessionName = obj.n || null;
        sessionPhone = obj.p || null;
        userDb = obj.db || {};
        isWorker = obj.w || false;

        if (sessionPhone && sessionName) {
            el("triggerLogin").style.display = "none";
            el("userBoxArea").style.display = "block";
            el("txtName").textContent = sessionName;
            el("txtPhone").textContent = "+91 " + sessionPhone;
            el("userLetter").textContent = sessionName.charAt(0).toUpperCase();
        }

        if (isWorker) {
            el("triggerLogin").style.display = "none";
            el("userBoxArea").style.display = "none";
            switchTab("workerTab");
        }
    } catch(e) {}
};

const backupForm = () => {
    let draft = {
        eq: currEquip,
        vEq: el("inpEquip").value,
        vType: el("selEquipType").value,
        vCus: el("inpCustom").value,
        prob: el("txtProblem").value,
        pics: picArray,
        showCard: el("formDetailsBlock").style.display !== "none"
    };
    sessionStorage.setItem('hew_draft', JSON.stringify(draft));
};

const recoverForm = () => {
    try {
        let s = sessionStorage.getItem('hew_draft');
        if(!s) return;
        let d = JSON.parse(s);
        currEquip = d.eq || "";
        picArray = d.pics || [];
        
        if (d.showCard && currEquip) {
            qAll(".equip-item").forEach(item => {
                if(item.querySelector("h3").textContent === currEquip) item.classList.add("picked");
            });
            
            el("inpEquip").value = d.vEq || currEquip;
            el("txtProblem").value = d.prob || "";
            el("inpCustom").value = d.vCus || "";
            
            let tWrap = el("wrapTypeSel");
            let cWrap = el("wrapCustomEquip");
            let sel = el("selEquipType");
            
            if (currEquip === "Others") {
                tWrap.style.display = "none";
                cWrap.style.display = "block";
            } else {
                tWrap.style.display = "block";
                cWrap.style.display = "none";
                let opts = [];
                if (currEquip === "Gearbox") opts = ["Helical Gearbox", "Bevel Gearbox", "Horizontal", "Vertical"];
                else if (currEquip === "Pump") opts = ["Water Pump", "Hydraulic Pump", "Vacuum", "Pressure", "Chemical"];
                else if (currEquip === "Lathe") opts = ["Centre Lathe", "Bench Lathe", "Engine Lathe"];
                else if (currEquip === "Slotting") opts = ["Key Slot", "Gear Slot", "Internal Slot"];
                else if (currEquip === "Welding") opts = ["Arc Welding", "Gas Welding", "MIG Welding"];
                
                sel.innerHTML = '<option value="">Select type</option>';
                opts.forEach(x => {
                    let op = document.createElement("option");
                    op.value = x; op.textContent = x;
                    if(x === d.vType) op.selected = true;
                    sel.appendChild(op);
                });
            }
            
            el("formDetailsBlock").style.display = "block";
            buildThumbs();
            setTimeout(() => el("formDetailsBlock").scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
        }
    } catch(e) {}
};

const flushJobs = () => { try { localStorage.setItem('hew_jobs', JSON.stringify(jobList)); } catch(e){} };
const fetchJobs = () => { try { let j = localStorage.getItem('hew_jobs'); if(j) jobList = JSON.parse(j); } catch(e){} };

// Boot
window.addEventListener('DOMContentLoaded', () => {
    restoreSync();
    fetchJobs();
    recoverForm();
    renderDash();
    checkWorkerMenu();
});

window.addEventListener('pageshow', () => { restoreSync(); recoverForm(); });
document.addEventListener('visibilitychange', () => {
    if(document.visibilityState === 'visible') { restoreSync(); recoverForm(); }
});

// UI Comps
const notifyUser = (msg, flag = "success") => {
    let t = el("glbToast");
    t.textContent = msg;
    t.className = "alert-toast " + (flag==="error"?"err-mode":flag==="info"?"inf-mode":"");
    void t.offsetWidth;
    t.classList.add("visible");
    setTimeout(() => t.classList.remove("visible"), 2800);
};

const uiShowModal = (id) => {
    let m = el(id);
    m.style.display = "flex";
    void m.offsetWidth;
    m.classList.add("show");
};

const uiHideModal = (id) => {
    let m = el(id);
    m.classList.remove("show");
    setTimeout(() => m.style.display = "none", 350);
};

const uiShowLb = (src) => {
    let lb = el("lbOverlay");
    el("lbImg").src = src;
    lb.style.display = "flex";
    setTimeout(() => lb.classList.add("show"), 10); 
};

const uiCloseLb = () => {
    let lb = el("lbOverlay");
    lb.classList.remove("show");
    setTimeout(() => lb.style.display = "none", 300);
};

// Keyboard handling
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
        ['clientAuthDlg', 'statusEditDlg', 'mediaChoiceDlg', 'workerAuthDlg', 'proprietorDlg', 'infoDlg'].forEach(id => {
            let m = el(id);
            if(m && m.classList.contains('show')) uiHideModal(id);
        });
        if(el('lbOverlay').classList.contains('show')) uiCloseLb();
        el("userMenuDrop").classList.remove("show");
        hideGear();
    }
});

// Menu logic
const uiToggleGear = (e) => {
    if(e) e.stopPropagation();
    el("mainGearMenu").classList.toggle("show");
    el("mainGearIcon").classList.toggle("rotated");
};

const hideGear = () => {
    el("mainGearMenu").classList.remove("show");
    el("mainGearIcon").classList.remove("rotated");
};

const checkWorkerMenu = () => {
    el("workerAccessOpt").style.display = sessionPhone ? "none" : "block";
};

const initWorkerFlow = () => {
    hideGear();
    if(isWorker) return switchTab("workerTab");
    uiShowModal("workerAuthDlg");
    el("wAuthPhoneBox").style.display = "block";
    el("wAuthCodeBox").style.display = "none";
    el("wPhoneVal").value = "";
    el("wCodeVal").value = "";
};

// Worker auth
const requestWorkerCode = () => {
    let p = el("wPhoneVal").value.trim();
    if(p.length < 10) return notifyUser("Please enter a valid 10-digit phone number", "error");
    if(p !== MASTER_PIN) return notifyUser("Not Found!", "error");
    
    el("wAuthPhoneBox").style.display = "none";
    el("wAuthCodeBox").style.display = "block";
    notifyUser("OTP sent successfully", "info");
};

const confirmWorkerCode = () => {
    let c = el("wCodeVal").value;
    if(c.length < 4) return notifyUser("Please enter a 4-digit OTP", "error");
    
    isWorker = true;
    storeSync();
    el("triggerLogin").style.display = "none";
    el("userBoxArea").style.display = "none";
    
    uiHideModal("workerAuthDlg");
    notifyUser("Worker Login Successful");
    switchTab("workerTab");
};

const exitWorkerMode = () => {
    isWorker = false;
    storeSync();
    
    if (sessionPhone) {
        el("triggerLogin").style.display = "none";
        el("userBoxArea").style.display = "block";
    } else {
        el("triggerLogin").style.display = "block";
        el("userBoxArea").style.display = "none";
    }
    checkWorkerMenu();
    switchTab("clientTab");
    notifyUser("Logged out successfully");
};

// Client Menu
const uiToggleUserMenu = (e) => {
    if(e) e.stopPropagation();
    el("userMenuDrop").classList.toggle("show");
};

window.addEventListener('click', (e) => {
    if(!e.target.closest('.user-box')) el("userMenuDrop").classList.remove("show");
    if(!e.target.closest('.gear-wrap')) hideGear();
});

const handleNameEdit = () => {
    let nSpan = el("txtName");
    let btn = el("btnEditName");
    let field = el("valEditName");

    if (!isEditing) {
        field.style.display = "block";
        field.value = sessionName;
        nSpan.style.display = "none";
        btn.innerHTML = drawCheck;
        btn.classList.add("editing");
        field.focus();
        field.select();
        isEditing = true;
    } else {
        let str = field.value.trim();
        if (str.length >= 2) {
            sessionName = str;
            nSpan.textContent = str;
            el("userLetter").textContent = str.charAt(0).toUpperCase();
            if(sessionPhone) userDb[sessionPhone] = str;
            storeSync();
            notifyUser("Name updated successfully");
        } else {
            return notifyUser("Name must be at least 2 characters", "error");
        }
        field.style.display = "none";
        nSpan.style.display = "inline";
        btn.innerHTML = drawPencil;
        btn.classList.remove("editing");
        isEditing = false;
    }
};

const processLogout = () => {
    sessionName = null;
    sessionPhone = null;
    storeSync();
    el("triggerLogin").style.display = "block";
    el("userBoxArea").style.display = "none";
    el("userMenuDrop").classList.remove("show");
    checkWorkerMenu();
    notifyUser("Logged out successfully");
};

// Auth Flows
const startAuthFlow = () => {
    uiShowModal("clientAuthDlg");
    swapToReg();
};

const swapToLogin = () => {
    authMode = "login";
    el("authHeading").textContent = "Login";
    el("regBlock").style.display = "none";
    el("loginBlock").style.display = "block";
    el("clientCodeBlock").style.display = "none";
};

const swapToReg = () => {
    authMode = "signup";
    el("authHeading").textContent = "Sign Up";
    el("regBlock").style.display = "block";
    el("loginBlock").style.display = "none";
    el("clientCodeBlock").style.display = "none";
    el("newNameVal").value = "";
    el("newPhoneVal").value = "";
    el("existPhoneVal").value = "";
    el("clientOtpVal").value = "";
};

const reqClientCode = (mode) => {
    authMode = mode;
    if (mode === "signup") {
        let n = el("newNameVal").value.trim();
        let p = el("newPhoneVal").value;
        if(n.length < 2) return notifyUser("Please enter your name", "error");
        if(p.length < 10) return notifyUser("Please enter a valid 10-digit phone number", "error");
        el("regBlock").style.display = "none";
    } else {
        let p = el("existPhoneVal").value;
        if(p.length < 10) return notifyUser("Please enter a valid 10-digit phone number", "error");
        if(!userDb[p]) return notifyUser("Number not registered. Please Sign Up first", "error");
        el("loginBlock").style.display = "none";
    }
    el("clientCodeBlock").style.display = "block";
    notifyUser("OTP sent successfully", "info");
};

const verifyClientCode = () => {
    let code = el("clientOtpVal").value;
    if(code.length < 4) return notifyUser("Please enter a 4-digit OTP", "error");
    
    if (authMode === "signup") {
        sessionName = el("newNameVal").value.trim();
        sessionPhone = el("newPhoneVal").value;
        userDb[sessionPhone] = sessionName;
    } else {
        sessionPhone = el("existPhoneVal").value;
        sessionName = userDb[sessionPhone];
    }
    storeSync();
    
    el("triggerLogin").style.display = "none";
    el("userBoxArea").style.display = "block";
    el("txtName").textContent = sessionName;
    el("txtPhone").textContent = "+91 " + sessionPhone;
    el("userLetter").textContent = sessionName.charAt(0).toUpperCase();
    
    checkWorkerMenu();
    uiHideModal("clientAuthDlg");
    notifyUser("Login successful");
};

// Camera/Gallery
const fireCamera = () => { backupForm(); uiHideModal("mediaChoiceDlg"); setTimeout(() => el("sysCam").click(), 300); };
const fireGallery = () => { backupForm(); uiHideModal("mediaChoiceDlg"); setTimeout(() => el("sysGal").click(), 300); };

const readPics = (ev) => {
    let fList = ev.target.files;
    if (!fList || fList.length === 0) return;
    recoverForm(); 
    
    Array.from(fList).forEach(f => {
        let r = new FileReader();
        r.onload = (e) => {
            picArray.push(e.target.result);
            buildThumbs();
            backupForm();
        };
        r.readAsDataURL(f);
    });
    ev.target.value = "";
};

const buildThumbs = () => {
    let box = el("thumbArea");
    box.innerHTML = "";
    picArray.forEach((imgSrc, i) => {
        let d = document.createElement("div");
        d.className = "thumb-box";
        d.innerHTML = `<img src="${imgSrc}" alt="media"><button class="del-img-btn" onclick="dropImg(${i})">✕</button>`;
        box.appendChild(d);
    });
};

const dropImg = (i) => { picArray.splice(i, 1); buildThumbs(); backupForm(); };

// Selecting Service
const pickEquip = (node, tag) => {
    qAll(".equip-item").forEach(s => s.classList.remove("picked"));
    node.classList.add("picked");
    currEquip = tag;
    el("inpEquip").value = tag;
    
    let cBlock = el("formDetailsBlock");
    cBlock.style.display = "none";
    void cBlock.offsetWidth;
    cBlock.style.display = "block";
    
    setTimeout(() => cBlock.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);

    let tWrap = el("wrapTypeSel");
    let cWrap = el("wrapCustomEquip");
    let sel = el("selEquipType");
    sel.innerHTML = '<option value="">Select type</option>';

    if (tag === "Others") {
        tWrap.style.display = "none";
        cWrap.style.display = "block";
    } else {
        tWrap.style.display = "block";
        cWrap.style.display = "none";
        let opts = [];
        if(tag==="Gearbox") opts=["Helical Gearbox", "Bevel Gearbox", "Horizontal", "Vertical"];
        else if(tag==="Pump") opts=["Water Pump", "Hydraulic Pump", "Vacuum", "Pressure", "Chemical"];
        else if(tag==="Lathe") opts=["Centre Lathe", "Bench Lathe", "Engine Lathe"];
        else if(tag==="Slotting") opts=["Key Slot", "Gear Slot", "Internal Slot"];
        else if(tag==="Welding") opts=["Arc Welding", "Gas Welding", "MIG Welding"];
        
        opts.forEach(o => {
            let op = document.createElement("option");
            op.value = o; op.textContent = o;
            sel.appendChild(op);
        });
    }
    backupForm();
};

const submitJobRequest = () => {
    if (!sessionPhone) {
        notifyUser("Please Sign In / Sign Up first", "error");
        setTimeout(() => startAuthFlow(), 600);
        return;
    }
    let tVal = currEquip === "Others" ? el("inpCustom").value.trim() : el("selEquipType").value;
    let pText = el("txtProblem").value.trim();
    
    if (!currEquip) return notifyUser("Please select equipment", "error");
    if (!tVal) return notifyUser("Please select / enter equipment type", "error");
    if (!pText) return notifyUser("Please describe the problem", "error");

    jobList.push({
        id: `HEW-${Date.now().toString().slice(-4)}`,
        client: sessionName, contact: sessionPhone,
        eq: currEquip, type: tVal, desc: pText,
        media: [...picArray], phase: "New", ts: new Date().toLocaleString()
    });

    flushJobs();

    el("txtProblem").value = "";
    el("selEquipType").value = "";
    el("inpCustom").value = "";
    picArray = [];
    buildThumbs();
    el("formDetailsBlock").style.display = "none";
    qAll(".equip-item").forEach(s => s.classList.remove("picked"));
    currEquip = "";
    
    sessionStorage.removeItem('hew_draft');
    
    notifyUser("Submitted Successfully");
    renderDash();
};

const switchTab = (tabId) => {
    if (tabId === "workerTab" && !isWorker) {
        notifyUser("Please login as Worker first", "error");
        initWorkerFlow();
        return;
    }
    qAll(".view-section").forEach(p => p.classList.remove("active"));
    el(tabId).classList.add("active");
    if (tabId === "workerTab") renderDash();
};

const renderDash = () => {
    let area = el("jobListArea");
    area.innerHTML = "";
    
    let arr = jobList;
    el("cTotal").textContent = arr.length;
    el("cPending").textContent = arr.filter(x => x.phase !== "Completed").length;
    el("cDone").textContent = arr.filter(x => x.phase === "Completed").length;

    if (arr.length === 0) {
        area.innerHTML = "<p>No repair requests yet.</p>";
        return;
    }

    arr.forEach((item, idx) => {
        let card = document.createElement("div");
        card.className = "job-card";
        let c = item.media ? item.media.length : 0;
        
        card.innerHTML = `
            <div class="job-head">
                <div>
                    <div class="client-name">${item.client}</div>
                    <div class="client-contact">+91 ${item.contact}</div>
                </div>
                <span class="job-status">${item.phase}</span>
            </div>
            <div class="job-body">
                <strong>Equipment:</strong> ${item.eq} <br>
                <strong>Type:</strong> ${item.type} <br>
                <strong>Problem:</strong> ${item.desc.substring(0, 80)}${item.desc.length > 80 ? "..." : ""} <br>
                <strong>Images Attached:</strong> ${c} ${drawCam} <br>
                <strong>Date:</strong> ${item.ts}
            </div>
            <button class="btn-readmore" onclick="expandJob(${idx})">View Full Problem</button>
        `;
        area.appendChild(card);
    });
};

const expandJob = (idx) => {
    activeJobIdx = idx;
    let job = jobList[idx];
    let htm = "";
    
    if (job.media && job.media.length > 0) {
        htm = `<p style="margin-top:15px;"><strong>Attached Images:</strong> (Click to zoom)</p><div class="proof-images">`;
        job.media.forEach(src => {
            htm += `<img src="${src}" onclick="uiShowLb(this.src)" alt="Problem Data">`;
        });
        htm += `</div>`;
    }
    
    el("jobFullDetails").innerHTML = `
        <p><strong>Customer Name:</strong> ${job.client}</p>
        <p><strong>Customer Phone:</strong> +91 ${job.contact}</p>
        <p style="margin-top:10px;"><strong>Equipment:</strong> ${job.eq}</p>
        <p><strong>Equipment Type:</strong> ${job.type}</p>
        <p style="margin-top:10px;"><strong>Customer Problem:</strong></p>
        <div style="background:#f4f6f8; padding:15px; border-radius:8px; margin-top:8px; line-height:1.6;">${job.desc}</div>
        ${htm}
        <p style="margin-top:15px;"><strong>Submitted:</strong> ${job.ts}</p>
    `;
    el("statusPicker").value = job.phase;
    uiShowModal("statusEditDlg");
};

const saveJobStatus = () => {
    if (activeJobIdx === null) return;
    jobList[activeJobIdx].phase = el("statusPicker").value;
    flushJobs();
    uiHideModal("statusEditDlg");
    renderDash();
    notifyUser("Status Updated");
};