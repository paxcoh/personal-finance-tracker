document.addEventListener("DOMContentLoaded", () => {
    // Icons initialization
    lucide.createIcons();

    const tSignIn = document.getElementById("toggle-signin");
    const tSignUp = document.getElementById("toggle-signup");
    const tBg = document.getElementById("toggle-bg");

    const formLogin = document.getElementById("form-login");
    const formSignup = document.getElementById("form-signup");

    const lError = document.getElementById("login-error");
    const sError = document.getElementById("signup-error");

    // Toggle Forms Transition
    tSignIn.addEventListener("click", () => {
        tBg.style.transform = "translateX(0%)";
        tSignIn.classList.replace("text-slate-400", "text-white");
        tSignUp.classList.replace("text-white", "text-slate-400");

        formSignup.classList.add("hidden", "opacity-0", "translate-x-12");
        formLogin.classList.remove("hidden");
        setTimeout(() => {
            formLogin.classList.remove("opacity-0", "-translate-x-12");
        }, 50);
    });

    tSignUp.addEventListener("click", () => {
        tBg.style.transform = "translateX(100%)";
        tSignUp.classList.replace("text-slate-400", "text-white");
        tSignIn.classList.replace("text-white", "text-slate-400");

        formLogin.classList.add("hidden", "opacity-0", "-translate-x-12");
        formSignup.classList.remove("hidden");
        setTimeout(() => {
            formSignup.classList.remove("opacity-0", "translate-x-12");
        }, 50);
    });

    // Password Visibility Toggle
    document.querySelectorAll(".toggle-password-visibility").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const input = e.currentTarget.previousElementSibling;
            const icon = e.currentTarget.querySelector("i");
            if (input.type === "password") {
                input.type = "text";
                icon.setAttribute("data-lucide", "eye-off");
            } else {
                input.type = "password";
                icon.setAttribute("data-lucide", "eye");
            }
            lucide.createIcons();
        });
    });

    // Password Strength Meter Indicators
    const signupPass = document.getElementById("signup-password");
    const labelStrength = document.getElementById("strength-label");
    const b1 = document.getElementById("bar-1");
    const b2 = document.getElementById("bar-2");
    const b3 = document.getElementById("bar-3");

    signupPass.addEventListener("input", () => {
        const val = signupPass.value;
        let score = 0;

        if (val.length >= 6) score++;
        if (/[A-Z]/.test(val) && /[0-9]/.test(val)) score++;
        if (/[^A-Za-z0-9]/.test(val)) score++;

        // Reset
        [b1, b2, b3].forEach(b => b.className = "h-full w-1/3 bg-slate-800 transition-colors");

        if (val.length === 0) {
            labelStrength.textContent = "Empty";
            labelStrength.className = "text-slate-500";
        } else if (score === 1) {
            labelStrength.textContent = "Weak";
            labelStrength.className = "text-red-400";
            b1.classList.replace("bg-slate-800", "bg-red-500");
        } else if (score === 2) {
            labelStrength.textContent = "Medium";
            labelStrength.className = "text-amber-400";
            b1.classList.replace("bg-slate-800", "bg-amber-500");
            b2.classList.replace("bg-slate-800", "bg-amber-500");
        } else if (score >= 3) {
            labelStrength.textContent = "Strong";
            labelStrength.className = "text-emerald-400";
            b1.classList.replace("bg-slate-800", "bg-emerald-500");
            b2.classList.replace("bg-slate-800", "bg-emerald-500");
            b3.classList.replace("bg-slate-800", "bg-emerald-500");
        }
    });

    // Action Form: LOGIN SUBMIT
    formLogin.addEventListener("submit", async (e) => {
        e.preventDefault();
        lError.classList.add("hidden");
        setLoading(formLogin, true);

        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (res.ok) {
                window.location.href = "/index.html"; // Route to Dashboard on success
            } else {
                lError.querySelector(".msg").textContent = data.error;
                lError.classList.remove("hidden");
            }
        } catch {
            lError.querySelector(".msg").textContent = "Network error. Try again.";
            lError.classList.remove("hidden");
        } finally {
            setLoading(formLogin, false);
        }
    });

    // Action Form: SIGNUP SUBMIT
    formSignup.addEventListener("submit", async (e) => {
        e.preventDefault();
        sError.classList.add("hidden");
        setLoading(formSignup, true);

        const name = document.getElementById("signup-name").value;
        const email = document.getElementById("signup-email").value;
        const password = document.getElementById("signup-password").value;

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            const data = await res.json();
            if (res.ok) {
                window.location.href = "/index.html";
            } else {
                sError.querySelector(".msg").textContent = data.error;
                sError.classList.remove("hidden");
            }
        } catch {
            sError.querySelector(".msg").textContent = "Connection lost. Try again.";
            sError.classList.remove("hidden");
        } finally {
            setLoading(formSignup, false);
        }
    });

    function setLoading(form, isLoading) {
        const btn = form.querySelector('button[type="submit"]');
        const text = btn.querySelector('.btn-text');
        const spinner = btn.querySelector('.loading-spinner');

        if (isLoading) {
            btn.disabled = true;
            text.classList.add("opacity-50");
            spinner.classList.remove("hidden");
        } else {
            btn.disabled = false;
            text.classList.remove("opacity-50");
            spinner.classList.add("hidden");
        }
    }
});