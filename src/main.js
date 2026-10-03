import './style.css';

// ============================================================
// UTILITIES
// ============================================================

const el = (id) => document.getElementById(id);
const qAll = (sel) => document.querySelectorAll(sel);

// ============================================================
// CORE STATE
// ============================================================

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

// Worker demo credentials
const MASTER_PIN = "8919782479";
const WORKER_OTP = "8919";

// ============================================================
// ICONS
// ============================================================

const drawPencil = `
<svg xmlns="http://www.w3.org/2000/svg"
width="18" height="18" viewBox="0 0 24 24"
fill="none" stroke="currentColor" stroke-width="2"
stroke-linecap="round" stroke-linejoin="round">
<path d="M12 20h9"></path>
<path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
</svg>`;

const drawCheck = `
<svg xmlns="http://www.w3.org/2000/svg"
width="26" height="26" viewBox="0 0 24 24"
fill="none" stroke="currentColor" stroke-width="3"
stroke-linecap="round" stroke-linejoin="round">
<polyline points="20 6 9 17 4 12"></polyline>
</svg>`;

const drawCam = `
<svg class="inline-cam-svg"
xmlns="http://www.w3.org/2000/svg"
width="16" height="16"
viewBox="0 0 24 24"
fill="none" stroke="currentColor"
stroke-width="2"
stroke-linecap="round"
stroke-linejoin="round">
<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
<circle cx="12" cy="13" r="4"></circle>
</svg>`;

// ============================================================
// LOCAL STORAGE
// ============================================================

const storeSync = () => {

    const payload = {
        n: sessionName,
        p: sessionPhone,
        db: userDb,
        w: isWorker
    };

    localStorage.setItem(
        "hew_cache",
        JSON.stringify(payload)
    );
};

const restoreSync = () => {

    try {

        const str = localStorage.getItem("hew_cache");

        if (!str) return;

        const obj = JSON.parse(str);

        sessionName = obj.n || null;
        sessionPhone = obj.p || null;
        userDb = obj.db || {};
        isWorker = obj.w || false;

        if (sessionPhone && sessionName) {

            const loginBtn = el("triggerLogin");
            const userBox = el("userBoxArea");

            if (loginBtn) {
                loginBtn.style.display = "none";
            }

            if (userBox) {
                userBox.style.display = "block";
            }

            if (el("txtName")) {
                el("txtName").textContent = sessionName;
            }

            if (el("txtPhone")) {
                el("txtPhone").textContent =
                    "+91 " + sessionPhone;
            }

            if (el("userLetter")) {
                el("userLetter").textContent =
                    sessionName.charAt(0).toUpperCase();
            }
        }

        if (isWorker) {

            const loginBtn = el("triggerLogin");
            const userBox = el("userBoxArea");

            if (loginBtn) {
                loginBtn.style.display = "none";
            }

            if (userBox) {
                userBox.style.display = "none";
            }

            switchTab("workerTab");
        }

    } catch (e) {

        console.warn("Could not restore session");

    }
};

// ============================================================
// FORM DRAFT
// ============================================================

const backupForm = () => {

    try {

        const draft = {

            eq: currEquip,

            vEq: el("inpEquip")
                ? el("inpEquip").value
                : "",

            vType: el("selEquipType")
                ? el("selEquipType").value
                : "",

            vCus: el("inpCustom")
                ? el("inpCustom").value
                : "",

            prob: el("txtProblem")
                ? el("txtProblem").value
                : "",

            pics: picArray,

            showCard:
                el("formDetailsBlock") &&
                el("formDetailsBlock").style.display !== "none"
        };

        sessionStorage.setItem(
            "hew_draft",
            JSON.stringify(draft)
        );

    } catch (e) {

        console.warn("Could not save form draft");

    }
};

const recoverForm = () => {

    try {

        const s =
            sessionStorage.getItem("hew_draft");

        if (!s) return;

        const d = JSON.parse(s);

        currEquip = d.eq || "";
        picArray = d.pics || [];

        if (d.showCard && currEquip) {

            qAll(".equip-item").forEach(item => {

                const heading =
                    item.querySelector("h3");

                if (
                    heading &&
                    heading.textContent === currEquip
                ) {

                    item.classList.add("picked");

                }

            });

            if (el("inpEquip")) {
                el("inpEquip").value =
                    d.vEq || currEquip;
            }

            if (el("txtProblem")) {
                el("txtProblem").value =
                    d.prob || "";
            }

            if (el("inpCustom")) {
                el("inpCustom").value =
                    d.vCus || "";
            }

            const tWrap =
                el("wrapTypeSel");

            const cWrap =
                el("wrapCustomEquip");

            const sel =
                el("selEquipType");

            if (
                tWrap &&
                cWrap &&
                sel
            ) {

                if (currEquip === "Others") {

                    tWrap.style.display = "none";
                    cWrap.style.display = "block";

                } else {

                    tWrap.style.display = "block";
                    cWrap.style.display = "none";

                    let opts = [];

                    if (currEquip === "Gearbox") {

                        opts = [
                            "Helical Gearbox",
                            "Bevel Gearbox",
                            "Horizontal",
                            "Vertical"
                        ];

                    } else if (currEquip === "Pump") {

                        opts = [
                            "Water Pump",
                            "Hydraulic Pump",
                            "Vacuum",
                            "Pressure",
                            "Chemical"
                        ];

                    } else if (currEquip === "Lathe") {

                        opts = [
                            "Centre Lathe",
                            "Bench Lathe",
                            "Engine Lathe"
                        ];

                    } else if (currEquip === "Slotting") {

                        opts = [
                            "Key Slot",
                            "Gear Slot",
                            "Internal Slot"
                        ];

                    } else if (currEquip === "Welding") {

                        opts = [
                            "Arc Welding",
                            "Gas Welding",
                            "MIG Welding"
                        ];
                    }

                    sel.innerHTML =
                        '<option value="">Select type</option>';

                    opts.forEach(x => {

                        const op =
                            document.createElement("option");

                        op.value = x;
                        op.textContent = x;

                        if (x === d.vType) {
                            op.selected = true;
                        }

                        sel.appendChild(op);

                    });
                }
            }

            if (el("formDetailsBlock")) {

                el("formDetailsBlock").style.display =
                    "block";

            }

            buildThumbs();

        }

    } catch (e) {

        console.warn("Could not recover draft");

    }
};

// ============================================================
// JOB STORAGE
// ============================================================

const flushJobs = () => {

    try {

        localStorage.setItem(
            "hew_jobs",
            JSON.stringify(jobList)
        );

    } catch (e) {

        console.warn(
            "Could not save jobs locally"
        );

    }
};

// ============================================================
// FETCH JOBS FROM BACKEND
// ============================================================

const fetchJobs = async () => {

    try {

        const res = await fetch(
            "https://harsha-engineering-works.onrender.com/api/jobs"
        );

        if (res.ok) {

            const data =
                await res.json();

            if (
                data.success &&
                Array.isArray(data.data)
            ) {

                jobList = data.data;

                flushJobs();

                renderDash();

                return;
            }
        }

    } catch (e) {

        console.warn(
            "Backend jobs offline, using local storage cache"
        );
    }

    try {

        const j =
            localStorage.getItem("hew_jobs");

        if (j) {

            jobList =
                JSON.parse(j);

        }

    } catch (e) {

        console.warn(
            "Could not load local jobs"
        );

    }

    renderDash();
};

// ============================================================
// BOOT
// ============================================================

window.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "Harsha Engineering Works frontend loaded."
        );

        restoreSync();

        fetchJobs();

        recoverForm();

        checkWorkerMenu();

    }
);

window.addEventListener(
    "pageshow",
    () => {

        restoreSync();
        recoverForm();

    }
);

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.visibilityState === "visible"
        ) {

            restoreSync();
            recoverForm();

        }

    }
);

// ============================================================
// NOTIFICATION
// ============================================================

const notifyUser = (
    msg,
    flag = "success"
) => {

    const t =
        el("glbToast");

    if (!t) {

        console.log(msg);

        return;
    }

    t.textContent =
        msg;

    t.className =
        "alert-toast " +
        (
            flag === "error"
                ? "err-mode"
                : flag === "info"
                    ? "inf-mode"
                    : ""
        );

    void t.offsetWidth;

    t.classList.add(
        "visible"
    );

    setTimeout(() => {

        t.classList.remove(
            "visible"
        );

    }, 2800);
};

// ============================================================
// MODALS
// ============================================================

const uiShowModal = (id) => {

    const m =
        el(id);

    if (!m) return;

    m.style.display =
        "flex";

    void m.offsetWidth;

    m.classList.add(
        "show"
    );
};

const uiHideModal = (id) => {

    const m =
        el(id);

    if (!m) return;

    m.classList.remove(
        "show"
    );

    setTimeout(() => {

        m.style.display =
            "none";

    }, 250);
};

// ============================================================
// IMAGE LIGHTBOX
// Supports both possible IDs
// ============================================================

const uiShowLb = (src) => {

    const img =
        el("lbImg");

    const box =
        el("imgLightBox") ||
        el("lbOverlay");

    if (!img || !box) return;

    img.src =
        src;

    box.style.display =
        "flex";

    box.classList.add("show");
};

const uiCloseLb = () => {

    const box =
        el("imgLightBox") ||
        el("lbOverlay");

    if (!box) return;

    box.classList.remove(
        "show"
    );

    box.style.display =
        "none";
};

// ============================================================
// GEAR MENU
// ============================================================

const uiToggleGear = (e) => {

    if (e) {
        e.stopPropagation();
    }

    const m =
        el("mainGearMenu");

    const ic =
        el("mainGearIcon");

    if (!m || !ic) return;

    m.classList.toggle(
        "show"
    );

    ic.classList.toggle(
        "rotated"
    );
};

const hideGear = () => {

    const m =
        el("mainGearMenu");

    const ic =
        el("mainGearIcon");

    if (m) {

        m.classList.remove(
            "show"
        );

    }

    if (ic) {

        ic.classList.remove(
            "rotated"
        );

    }
};

// ============================================================
// WORKER MENU
// ============================================================

const checkWorkerMenu = () => {

    const btn =
        el("workerAccessOpt");

    if (!btn) return;

    if (isWorker) {

        btn.style.display =
            "none";

    } else {

        btn.style.display =
            sessionPhone
                ? "none"
                : "block";
    }
};

// ============================================================
// WORKER LOGIN
// ============================================================
// HTML IDs:
// workerAuthDlg
// wAuthPhoneBox
// wPhoneVal
// wAuthCodeBox
// wCodeVal
// ============================================================

const initWorkerFlow = () => {

    hideGear();

    if (isWorker) {

        switchTab(
            "workerTab"
        );

        return;
    }

    const phone =
        el("wPhoneVal");

    const code =
        el("wCodeVal");

    const phoneBox =
        el("wAuthPhoneBox");

    const codeBox =
        el("wAuthCodeBox");

    if (!phone || !code || !phoneBox || !codeBox) {

        console.error(
            "Worker login HTML elements not found."
        );

        notifyUser(
            "Worker login interface error",
            "error"
        );

        return;
    }

    phone.value = "";
    code.value = "";

    phoneBox.style.display =
        "block";

    codeBox.style.display =
        "none";

    uiShowModal(
        "workerAuthDlg"
    );
};

const requestWorkerCode = () => {

    const input =
        el("wPhoneVal");

    if (!input) {

        notifyUser(
            "Worker phone field not found",
            "error"
        );

        return;
    }

    const phone =
        input.value.trim();

    if (phone.length < 10) {

        notifyUser(
            "Please enter a valid 10-digit worker contact",
            "error"
        );

        return;
    }

    if (phone !== MASTER_PIN) {

        notifyUser(
            "Access Denied: Invalid Worker Contact",
            "error"
        );

        return;
    }

    const phoneBox =
        el("wAuthPhoneBox");

    const codeBox =
        el("wAuthCodeBox");

    if (phoneBox) {
        phoneBox.style.display =
            "none";
    }

    if (codeBox) {
        codeBox.style.display =
            "block";
    }

    notifyUser(
        "OTP sent successfully",
        "info"
    );
};

const confirmWorkerCode = () => {

    const input =
        el("wCodeVal");

    if (!input) {

        notifyUser(
            "Worker OTP field not found",
            "error"
        );

        return;
    }

    const code =
        input.value.trim();

    if (code.length < 4) {

        notifyUser(
            "Please enter a 4-digit OTP",
            "error"
        );

        return;
    }

    if (code !== WORKER_OTP) {

        notifyUser(
            "Authentication Failed: Incorrect OTP",
            "error"
        );

        return;
    }

    isWorker =
        true;

    storeSync();

    uiHideModal(
        "workerAuthDlg"
    );

    const loginBtn =
        el("triggerLogin");

    const userBox =
        el("userBoxArea");

    if (loginBtn) {
        loginBtn.style.display =
            "none";
    }

    if (userBox) {
        userBox.style.display =
            "none";
    }

    checkWorkerMenu();

    switchTab(
        "workerTab"
    );

    notifyUser(
        "Worker Login Successful"
    );
};

const exitWorkerMode = () => {

    isWorker =
        false;

    storeSync();

    const loginBtn =
        el("triggerLogin");

    const userBox =
        el("userBoxArea");

    if (sessionPhone) {

        if (loginBtn) {
            loginBtn.style.display =
                "none";
        }

        if (userBox) {
            userBox.style.display =
                "block";
        }

    } else {

        if (loginBtn) {
            loginBtn.style.display =
                "block";
        }

        if (userBox) {
            userBox.style.display =
                "none";
        }
    }

    checkWorkerMenu();

    switchTab(
        "clientTab"
    );

    notifyUser(
        "Switched back to Client Mode"
    );
};

// ============================================================
// USER PROFILE MENU
// ============================================================

const uiToggleUserMenu = (e) => {

    if (e) {
        e.stopPropagation();
    }

    const menu =
        el("userMenuDrop");

    if (!menu) return;

    menu.classList.toggle(
        "show"
    );
};

window.addEventListener(
    "click",
    (e) => {

        const userMenu =
            el("userMenuDrop");

        if (
            userMenu &&
            !e.target.closest(".user-box")
        ) {

            userMenu.classList.remove(
                "show"
            );
        }

        if (
            !e.target.closest(".gear-wrap")
        ) {

            hideGear();

        }
    }
);

// ============================================================
// EDIT NAME
// ============================================================

const handleNameEdit = () => {

    const nSpan =
        el("txtName");

    const btn =
        el("btnEditName");

    const field =
        el("valEditName");

    if (!nSpan || !btn || !field) {
        return;
    }

    if (!isEditing) {

        field.style.display =
            "block";

        field.value =
            sessionName || "";

        nSpan.style.display =
            "none";

        btn.innerHTML =
            drawCheck;

        btn.classList.add(
            "editing"
        );

        field.focus();
        field.select();

        isEditing =
            true;

    } else {

        const str =
            field.value.trim();

        if (str.length < 2) {

            notifyUser(
                "Name must be at least 2 characters",
                "error"
            );

            return;
        }

        sessionName =
            str;

        nSpan.textContent =
            str;

        if (el("userLetter")) {

            el("userLetter").textContent =
                str.charAt(0).toUpperCase();

        }

        if (sessionPhone) {

            userDb[sessionPhone] =
                str;

            fetch(
                "https://harsha-engineering-works.onrender.com/api/auth/update-name",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            phone:
                                sessionPhone,
                            name:
                                sessionName
                        })
                }
            ).catch(() => {});
        }

        storeSync();

        notifyUser(
            "Name updated successfully"
        );

        field.style.display =
            "none";

        nSpan.style.display =
            "inline";

        btn.innerHTML =
            drawPencil;

        btn.classList.remove(
            "editing"
        );

        isEditing =
            false;
    }
};

// ============================================================
// LOGOUT
// ============================================================

const processLogout = () => {

    sessionName =
        null;

    sessionPhone =
        null;

    isWorker =
        false;

    storeSync();

    if (el("triggerLogin")) {

        el("triggerLogin").style.display =
            "block";

    }

    if (el("userBoxArea")) {

        el("userBoxArea").style.display =
            "none";

    }

    if (el("userMenuDrop")) {

        el("userMenuDrop").classList.remove(
            "show"
        );

    }

    checkWorkerMenu();

    switchTab(
        "clientTab"
    );

    notifyUser(
        "Logged out successfully"
    );
};

// ============================================================
// CUSTOMER AUTH
// ============================================================

const startAuthFlow = () => {

    uiShowModal(
        "clientAuthDlg"
    );

    swapToReg();
};

const swapToLogin = () => {

    authMode =
        "login";

    if (el("authHeading")) {

        el("authHeading").textContent =
            "Login";

    }

    if (el("regBlock")) {

        el("regBlock").style.display =
            "none";

    }

    if (el("loginBlock")) {

        el("loginBlock").style.display =
            "block";

    }

    if (el("clientCodeBlock")) {

        el("clientCodeBlock").style.display =
            "none";

    }
};

const swapToReg = () => {

    authMode =
        "signup";

    if (el("authHeading")) {

        el("authHeading").textContent =
            "Sign Up";

    }

    if (el("regBlock")) {

        el("regBlock").style.display =
            "block";

    }

    if (el("loginBlock")) {

        el("loginBlock").style.display =
            "none";

    }

    if (el("clientCodeBlock")) {

        el("clientCodeBlock").style.display =
            "none";

    }

    if (el("newNameVal")) {
        el("newNameVal").value = "";
    }

    if (el("newPhoneVal")) {
        el("newPhoneVal").value = "";
    }

    if (el("existPhoneVal")) {
        el("existPhoneVal").value = "";
    }

    if (el("clientOtpVal")) {
        el("clientOtpVal").value = "";
    }
};

// ============================================================
// SEND CUSTOMER OTP
// ============================================================

const reqClientCode = async (mode) => {

    authMode =
        mode;

    let n = "";
    let p = "";

    if (mode === "signup") {

        n =
            el("newNameVal")
                .value
                .trim();

        p =
            el("newPhoneVal")
                .value
                .trim();

        if (n.length < 2) {

            return notifyUser(
                "Please enter your name",
                "error"
            );
        }

        if (p.length !== 10) {

            return notifyUser(
                "Please enter a valid 10-digit phone number",
                "error"
            );
        }

    } else {

        p =
            el("existPhoneVal")
                .value
                .trim();

        if (p.length !== 10) {

            return notifyUser(
                "Please enter a valid 10-digit phone number",
                "error"
            );
        }
    }

    try {

        notifyUser(
            "Sending OTP...",
            "info"
        );

        const res =
            await fetch(
                "https://harsha-engineering-works.onrender.com/api/auth/send-otp",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            phone: p,
                            mode: mode,
                            name: n
                        })
                }
            );

        const data =
            await res.json();

        if (!data.success) {

            return notifyUser(
                data.message ||
                "Failed to send OTP",
                "error"
            );
        }

        if (mode === "signup") {

            el("regBlock").style.display =
                "none";

        } else {

            el("loginBlock").style.display =
                "none";
        }

        el("clientCodeBlock").style.display =
            "block";

        if (data.devOtp) {

            notifyUser(
                `OTP Sent! (Dev code: ${data.devOtp})`,
                "info"
            );

            el("clientOtpVal").value =
                data.devOtp;

        } else {

            notifyUser(
                "OTP sent via SMS to your phone!",
                "info"
            );
        }

    } catch (err) {

        console.warn(
            "OTP backend unavailable",
            err
        );

        if (mode === "signup") {

            el("regBlock").style.display =
                "none";

        } else {

            if (!userDb[p]) {

                return notifyUser(
                    "Number not registered. Please Sign Up first",
                    "error"
                );
            }

            el("loginBlock").style.display =
                "none";
        }

        el("clientCodeBlock").style.display =
            "block";

        notifyUser(
            "OTP sent (Offline mode)",
            "info"
        );
    }
};

// ============================================================
// VERIFY CUSTOMER OTP
// ============================================================

const verifyClientCode = async () => {

    const code =
        el("clientOtpVal")
            .value
            .trim();

    if (code.length < 4) {

        return notifyUser(
            "Please enter a 4-digit OTP",
            "error"
        );
    }

    const p =
        authMode === "signup"
            ? el("newPhoneVal").value.trim()
            : el("existPhoneVal").value.trim();

    const n =
        authMode === "signup"
            ? el("newNameVal").value.trim()
            : "";

    try {

        const res =
            await fetch(
                "https://harsha-engineering-works.onrender.com/api/auth/verify-otp",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            phone: p,
                            otp: code,
                            name: n,
                            mode: authMode
                        })
                }
            );

        const data =
            await res.json();

        if (!data.success) {

            return notifyUser(
                data.message ||
                "Invalid OTP",
                "error"
            );
        }

        sessionName =
            data.user.name;

        sessionPhone =
            data.user.phone;

        userDb[sessionPhone] =
            sessionName;

    } catch (err) {

        console.warn(
            "OTP verification backend unavailable"
        );

        if (authMode === "signup") {

            sessionName =
                el("newNameVal")
                    .value
                    .trim();

            sessionPhone =
                el("newPhoneVal")
                    .value
                    .trim();

            userDb[sessionPhone] =
                sessionName;

        } else {

            sessionPhone =
                el("existPhoneVal")
                    .value
                    .trim();

            sessionName =
                userDb[sessionPhone] ||
                "Customer";
        }
    }

    storeSync();

    if (el("triggerLogin")) {

        el("triggerLogin").style.display =
            "none";

    }

    if (el("userBoxArea")) {

        el("userBoxArea").style.display =
            "block";

    }

    if (el("txtName")) {

        el("txtName").textContent =
            sessionName;

    }

    if (el("txtPhone")) {

        el("txtPhone").textContent =
            "+91 " + sessionPhone;

    }

    if (el("userLetter")) {

        el("userLetter").textContent =
            sessionName
                .charAt(0)
                .toUpperCase();

    }

    checkWorkerMenu();

    uiHideModal(
        "clientAuthDlg"
    );

    notifyUser(
        "Login successful"
    );
};

// ============================================================
// CAMERA / GALLERY
// ============================================================

const fireCamera = () => {

    backupForm();

    uiHideModal(
        "mediaChoiceDlg"
    );

    setTimeout(() => {

        const cam =
            el("sysCam");

        if (cam) {
            cam.click();
        }

    }, 300);
};

const fireGallery = () => {

    backupForm();

    uiHideModal(
        "mediaChoiceDlg"
    );

    setTimeout(() => {

        const gal =
            el("sysGal");

        if (gal) {
            gal.click();
        }

    }, 300);
};

// ============================================================
// READ IMAGES
// ============================================================

const readPics = (ev) => {

    const fList =
        ev.target.files;

    if (
        !fList ||
        fList.length === 0
    ) {
        return;
    }

    Array.from(fList).forEach(f => {

        const r =
            new FileReader();

        r.onload = (e) => {

            picArray.push(
                e.target.result
            );

            buildThumbs();

            backupForm();
        };

        r.readAsDataURL(f);
    });

    ev.target.value =
        "";
};

// ============================================================
// IMAGE THUMBNAILS
// ============================================================

const buildThumbs = () => {

    const box =
        el("thumbArea");

    if (!box) return;

    box.innerHTML =
        "";

    picArray.forEach(
        (imgSrc, i) => {

            const d =
                document.createElement(
                    "div"
                );

            d.className =
                "thumb-box";

            d.innerHTML = `
                <img
                    src="${imgSrc}"
                    alt="media"
                >

                <button
                    class="del-img-btn"
                    onclick="dropImg(${i})"
                >×</button>
            `;

            box.appendChild(d);
        }
    );
};

const dropImg = (i) => {

    picArray.splice(
        i,
        1
    );

    buildThumbs();

    backupForm();
};

// ============================================================
// EQUIPMENT SELECTION
// ============================================================

const pickEquip = (
    node,
    tag
) => {

    qAll(".equip-item")
        .forEach(
            s =>
                s.classList.remove(
                    "picked"
                )
        );

    if (node) {

        node.classList.add(
            "picked"
        );

    }

    currEquip =
        tag;

    if (el("inpEquip")) {

        el("inpEquip").value =
            tag;

    }

    const cBlock =
        el("formDetailsBlock");

    if (!cBlock) return;

    cBlock.style.display =
        "none";

    void cBlock.offsetWidth;

    cBlock.style.display =
        "block";

    setTimeout(() => {

        cBlock.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }, 200);

    const tWrap =
        el("wrapTypeSel");

    const cWrap =
        el("wrapCustomEquip");

    const sel =
        el("selEquipType");

    if (!tWrap || !cWrap || !sel) {
        return;
    }

    sel.innerHTML =
        '<option value="">Select type</option>';

    if (tag === "Others") {

        tWrap.style.display =
            "none";

        cWrap.style.display =
            "block";

    } else {

        tWrap.style.display =
            "block";

        cWrap.style.display =
            "none";

        let opts = [];

        if (tag === "Gearbox") {

            opts = [
                "Helical Gearbox",
                "Bevel Gearbox",
                "Horizontal",
                "Vertical"
            ];

        } else if (tag === "Pump") {

            opts = [
                "Water Pump",
                "Hydraulic Pump",
                "Vacuum",
                "Pressure",
                "Chemical"
            ];

        } else if (tag === "Lathe") {

            opts = [
                "Centre Lathe",
                "Bench Lathe",
                "Engine Lathe"
            ];

        } else if (tag === "Slotting") {

            opts = [
                "Key Slot",
                "Gear Slot",
                "Internal Slot"
            ];

        } else if (tag === "Welding") {

            opts = [
                "Arc Welding",
                "Gas Welding",
                "MIG Welding"
            ];
        }

        opts.forEach(o => {

            const op =
                document.createElement(
                    "option"
                );

            op.value =
                o;

            op.textContent =
                o;

            sel.appendChild(
                op
            );
        });
    }

    backupForm();
};

// ============================================================
// SUBMIT REPAIR REQUEST
// ============================================================

const submitJobRequest = async () => {

    if (!sessionPhone) {

        notifyUser(
            "Please Sign In / Sign Up first",
            "error"
        );

        setTimeout(
            () => startAuthFlow(),
            600
        );

        return;
    }

    const tVal =
        currEquip === "Others"
            ? el("inpCustom").value.trim()
            : el("selEquipType").value;

    const pText =
        el("txtProblem")
            .value
            .trim();

    if (!currEquip) {

        return notifyUser(
            "Please select equipment",
            "error"
        );
    }

    if (!tVal) {

        return notifyUser(
            "Please select / enter equipment type",
            "error"
        );
    }

    if (!pText) {

        return notifyUser(
            "Please describe the problem",
            "error"
        );
    }

    const newJob = {

        id:
            `HEW-${Date.now()
                .toString()
                .slice(-4)}`,

        client:
            sessionName,

        contact:
            sessionPhone,

        eq:
            currEquip,

        type:
            tVal,

        desc:
            pText,

        media:
            [...picArray],

        phase:
            "New",

        ts:
            new Date()
                .toLocaleString()
    };

    try {

        notifyUser(
            "Submitting request...",
            "info"
        );

        const res =
            await fetch(
                "https://harsha-engineering-works.onrender.com/api/jobs",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            newJob
                        )
                }
            );

        const data =
            await res.json();

        if (
            data.success &&
            data.data
        ) {

            jobList.unshift(
                data.data
            );

        } else {

            jobList.unshift(
                newJob
            );
        }

    } catch (err) {

        console.warn(
            "Backend unavailable. Saving locally."
        );

        jobList.unshift(
            newJob
        );
    }

    flushJobs();

    if (el("txtProblem")) {
        el("txtProblem").value =
            "";
    }

    if (el("selEquipType")) {
        el("selEquipType").value =
            "";
    }

    if (el("inpCustom")) {
        el("inpCustom").value =
            "";
    }

    picArray = [];

    buildThumbs();

    if (el("formDetailsBlock")) {

        el("formDetailsBlock")
            .style.display =
            "none";

    }

    qAll(".equip-item")
        .forEach(
            s =>
                s.classList.remove(
                    "picked"
                )
        );

    currEquip =
        "";

    sessionStorage.removeItem(
        "hew_draft"
    );

    notifyUser(
        "Submitted Successfully"
    );

    renderDash();
};

// ============================================================
// TAB SWITCHING
// ============================================================

const switchTab = (
    tabId
) => {

    if (
        tabId === "workerTab" &&
        !isWorker
    ) {

        notifyUser(
            "Please login as Worker first",
            "error"
        );

        initWorkerFlow();

        return;
    }

    qAll(".view-section")
        .forEach(
            p =>
                p.classList.remove(
                    "active"
                )
        );

    const tab =
        el(tabId);

    if (!tab) return;

    tab.classList.add(
        "active"
    );

    if (
        tabId === "workerTab"
    ) {

        fetchJobs();
    }
};

// ============================================================
// WORKER DASHBOARD
// ============================================================

const renderDash = () => {

    const area =
        el("jobListArea");

    if (!area) return;

    area.innerHTML =
        "";

    const arr =
        jobList;

    if (el("cTotal")) {

        el("cTotal").textContent =
            arr.length;

    }

    if (el("cPending")) {

        el("cPending").textContent =
            arr.filter(
                x =>
                    x.phase !==
                    "Completed"
            ).length;

    }

    if (el("cDone")) {

        el("cDone").textContent =
            arr.filter(
                x =>
                    x.phase ===
                    "Completed"
            ).length;

    }

    if (arr.length === 0) {

        area.innerHTML =
            "<p>No repair requests yet.</p>";

        return;
    }

    arr.forEach(
        (item, idx) => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "job-card";

            const c =
                item.media
                    ? item.media.length
                    : 0;

            const description =
                item.desc || "";

            card.innerHTML = `

                <div class="job-head">

                    <div>

                        <div class="client-name">
                            ${item.client || "Customer"}
                        </div>

                        <div class="client-contact">
                            +91 ${item.contact || ""}
                        </div>

                    </div>

                    <span class="job-status">
                        ${item.phase || "New"}
                    </span>

                </div>

                <div class="job-body">

                    <strong>
                        Equipment:
                    </strong>
                    ${item.eq || ""}
                    <br>

                    <strong>
                        Type:
                    </strong>
                    ${item.type || ""}
                    <br>

                    <strong>
                        Problem:
                    </strong>
                    ${description.substring(0, 80)}
                    ${
                        description.length > 80
                            ? "..."
                            : ""
                    }
                    <br>

                    <strong>
                        Images Attached:
                    </strong>
                    ${c}
                    ${drawCam}
                    <br>

                    <strong>
                        Date:
                    </strong>
                    ${item.ts || ""}

                </div>

                <button
                    class="btn-readmore"
                    onclick="expandJob(${idx})"
                >
                    View Full Problem
                </button>
            `;

            area.appendChild(
                card
            );
        }
    );
};

// ============================================================
// VIEW FULL JOB
// ============================================================

const expandJob = (
    idx
) => {

    activeJobIdx =
        idx;

    const job =
        jobList[idx];

    if (!job) return;

    let htm =
        "";

    if (
        job.media &&
        job.media.length > 0
    ) {

        htm = `

            <p style="margin-top:15px;">

                <strong>
                    Attached Images:
                </strong>

                (Click to zoom)

            </p>

            <div class="proof-images">
        `;

        job.media.forEach(
            src => {

                htm += `

                    <img
                        src="${src}"
                        onclick="uiShowLb(this.src)"
                        alt="Problem Data"
                    >

                `;
            }
        );

        htm += `
            </div>
        `;
    }

    if (el("jobFullDetails")) {

        el("jobFullDetails")
            .innerHTML = `

            <p>
                <strong>
                    Customer Name:
                </strong>
                ${job.client || ""}
            </p>

            <p>
                <strong>
                    Customer Phone:
                </strong>
                +91 ${job.contact || ""}
            </p>

            <p style="margin-top:10px;">
                <strong>
                    Equipment:
                </strong>
                ${job.eq || ""}
            </p>

            <p>
                <strong>
                    Equipment Type:
                </strong>
                ${job.type || ""}
            </p>

            <p style="margin-top:10px;">
                <strong>
                    Customer Problem:
                </strong>
            </p>

            <div
                style="
                    background:#f4f6f8;
                    padding:15px;
                    border-radius:8px;
                    margin-top:8px;
                    line-height:1.6;
                "
            >
                ${job.desc || ""}
            </div>

            ${htm}

            <p style="margin-top:15px;">
                <strong>
                    Submitted:
                </strong>
                ${job.ts || ""}
            </p>
        `;
    }

    if (el("statusPicker")) {

        el("statusPicker").value =
            job.phase || "New";

    }

    uiShowModal(
        "statusEditDlg"
    );
};

// ============================================================
// SAVE JOB STATUS
// ============================================================

const saveJobStatus = async () => {

    if (
        activeJobIdx === null
    ) {

        return;
    }

    const currentJob =
        jobList[activeJobIdx];

    if (!currentJob) return;

    const newPhase =
        el("statusPicker").value;

    currentJob.phase =
        newPhase;

    try {

        const res =
            await fetch(
                `https://harsha-engineering-works.onrender.com/api/jobs/${currentJob.id}/status`,
                {
                    method: "PATCH",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            phase:
                                newPhase
                        })
                }
            );

        const data =
            await res.json();

        if (
            data.success &&
            data.data
        ) {

            jobList[activeJobIdx] =
                data.data;

        }

    } catch (err) {

        console.warn(
            "Could not update status on backend, saved locally"
        );
    }

    flushJobs();

    uiHideModal(
        "statusEditDlg"
    );

    renderDash();

    notifyUser(
        "Status Updated"
    );

    activeJobIdx =
        null;
};

// ============================================================
// ESC KEY SUPPORT
// ============================================================

document.addEventListener(
    "keydown",
    (e) => {

        if (
            e.key !== "Escape" &&
            e.key !== "Esc"
        ) {
            return;
        }

        // Close normal modals
        [
            "clientAuthDlg",
            "statusEditDlg",
            "mediaChoiceDlg",
            "workerAuthDlg",
            "proprietorDlg",
            "infoDlg"
        ].forEach(id => {

            const modal =
                el(id);

            if (
                modal &&
                (
                    modal.classList.contains("show") ||
                    modal.style.display === "flex"
                )
            ) {

                uiHideModal(id);

            }
        });

        // Close image lightbox
        const lightbox =
            el("imgLightBox") ||
            el("lbOverlay");

        if (lightbox) {

            const isVisible =
                lightbox.classList.contains("show") ||
                lightbox.style.display === "flex";

            if (isVisible) {

                uiCloseLb();

            }
        }

        // Close user menu
        const userMenu =
            el("userMenuDrop");

        if (userMenu) {

            userMenu.classList.remove(
                "show"
            );

        }

        // Close gear menu
        hideGear();

    }
);

// ============================================================
// CLICK OUTSIDE MODAL TO CLOSE
// ============================================================

qAll(".modal-overlay").forEach(
    modal => {

        modal.addEventListener(
            "click",
            (e) => {

                if (
                    e.target === modal
                ) {

                    if (modal.id) {

                        uiHideModal(
                            modal.id
                        );

                    }

                }

            }
        );

    }
);

// ============================================================
// EXPOSE FUNCTIONS TO HTML ONCLICK
// ============================================================

Object.assign(
    window,
    {

        uiToggleGear,

        uiShowModal,

        uiHideModal,

        uiShowLb,

        uiCloseLb,

        initWorkerFlow,

        switchTab,

        startAuthFlow,

        uiToggleUserMenu,

        handleNameEdit,

        processLogout,

        pickEquip,

        readPics,

        submitJobRequest,

        exitWorkerMode,

        requestWorkerCode,

        confirmWorkerCode,

        fireCamera,

        fireGallery,

        reqClientCode,

        swapToLogin,

        swapToReg,

        verifyClientCode,

        saveJobStatus,

        expandJob,

        dropImg,

        notifyUser

    }
);

// ============================================================
// EXPLICIT GLOBAL REFERENCES
// ============================================================

window.uiToggleGear =
    uiToggleGear;

window.uiShowModal =
    uiShowModal;

window.uiHideModal =
    uiHideModal;

window.uiShowLb =
    uiShowLb;

window.uiCloseLb =
    uiCloseLb;

window.initWorkerFlow =
    initWorkerFlow;

window.switchTab =
    switchTab;

window.startAuthFlow =
    startAuthFlow;

window.uiToggleUserMenu =
    uiToggleUserMenu;

window.handleNameEdit =
    handleNameEdit;

window.processLogout =
    processLogout;

window.pickEquip =
    pickEquip;

window.readPics =
    readPics;

window.submitJobRequest =
    submitJobRequest;

window.exitWorkerMode =
    exitWorkerMode;

window.requestWorkerCode =
    requestWorkerCode;

window.confirmWorkerCode =
    confirmWorkerCode;

window.fireCamera =
    fireCamera;

window.fireGallery =
    fireGallery;

window.reqClientCode =
    reqClientCode;

window.swapToLogin =
    swapToLogin;

window.swapToReg =
    swapToReg;

window.verifyClientCode =
    verifyClientCode;

window.saveJobStatus =
    saveJobStatus;

window.expandJob =
    expandJob;

window.dropImg =
    dropImg;

window.notifyUser =
    notifyUser;

// ============================================================
// FINAL CONSOLE MESSAGE
// ============================================================

console.log(
    "main.js loaded successfully."
);

console.log(
    "All HTML button functions are available."
);
document.documentElement.classList.remove("loading");