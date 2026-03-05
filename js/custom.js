/* ============================================
   Return Rover — Form Logic
   ============================================ */

(function () {
    "use strict";

    const STEPS = [
        {
            key: "name",
            prompt: "Hi there! What's your full name?",
            validate: (v) => {
                const parts = v.trim().split(/\s+/);
                if (parts.length < 2 || parts.some((p) => p.length === 0))
                    return "Please enter your first and last name.";
                return null;
            },
        },
        {
            key: "email",
            prompt: "Great, thanks! What's your email address?",
            validate: (v) => {
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
                    return "That doesn't look like a valid email. Try again.";
                return null;
            },
        },
        {
            key: "phone",
            prompt: "Got it. What's your 10-digit phone number?",
            validate: (v) => {
                const digits = v.replace(/\D/g, "");
                if (digits.length !== 10)
                    return "Please enter exactly 10 digits.";
                return null;
            },
            format: (v) => {
                const d = v.replace(/\D/g, "");
                return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
            },
        },
        {
            key: "proofOfPurchase",
            prompt: "Last step — enter your proof of purchase filename (.jpeg, .jpg, .png, or .pdf):",
            validate: (v) => {
                const ext = v.split(".").pop().toLowerCase();
                if (!["jpeg", "jpg", "png", "pdf"].includes(ext))
                    return "Only .jpeg, .jpg, .png, or .pdf files are accepted.";
                return null;
            },
        },
    ];

    let currentStep = 0;
    const data = {};

    const messagesEl = document.getElementById("chat-messages");
    const inputEl = document.getElementById("user-input");
    const formEl = document.getElementById("chat-form");

    function addMessage(text, type) {
        const el = document.createElement("div");
        el.className = `msg ${type}`;
        el.textContent = text;
        messagesEl.appendChild(el);
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function updateProgress(step, done) {
        const steps = document.querySelectorAll("#progress-bar .step");
        steps.forEach((s, i) => {
            s.classList.remove("active", "done");
            if (i < step) s.classList.add("done");
            if (i === step && !done) s.classList.add("active");
            if (done && i === step) s.classList.add("done");
        });
    }

    function showSummary() {
        const card = document.createElement("div");
        card.className = "summary-card";

        const labels = { name: "Name", email: "Email", phone: "Phone", proofOfPurchase: "File" };
        let html = "<h3>Return Request Summary</h3>";
        for (const [key, label] of Object.entries(labels)) {
            html += `<div class="field"><span class="field-label">${label}</span><span class="field-value">${data[key]}</span></div>`;
        }
        card.innerHTML = html;
        messagesEl.appendChild(card);
        messagesEl.scrollTop = messagesEl.scrollHeight;

        addMessage("All set! We'll process your return shortly.", "success");
        inputEl.disabled = true;
        inputEl.placeholder = "Return submitted — thank you!";
    }

    function askCurrent() {
        addMessage(STEPS[currentStep].prompt, "system");
        updateProgress(currentStep, false);
        inputEl.focus();
    }

    function handleSubmit(e) {
        e.preventDefault();
        const raw = inputEl.value.trim();
        if (!raw) return;

        const step = STEPS[currentStep];
        addMessage(raw, "user");
        inputEl.value = "";

        const err = step.validate(raw);
        if (err) {
            addMessage(err, "error");
            inputEl.focus();
            return;
        }

        data[step.key] = step.format ? step.format(raw) : raw;
        updateProgress(currentStep, true);
        currentStep++;

        if (currentStep < STEPS.length) {
            setTimeout(() => askCurrent(), 400);
        } else {
            setTimeout(() => showSummary(), 400);
        }
    }

    // Dark mode toggle
    const toggle = document.getElementById("dark-toggle");
    function applyTheme(theme) {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("rr-theme", theme);
    }
    // Always set an explicit theme on load
    const saved = localStorage.getItem("rr-theme");
    if (saved) {
        applyTheme(saved);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        applyTheme("dark");
    } else {
        applyTheme("light");
    }
    toggle.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme");
        applyTheme(current === "dark" ? "light" : "dark");
    });

    // Init
    formEl.addEventListener("submit", handleSubmit);
    askCurrent();
})();
