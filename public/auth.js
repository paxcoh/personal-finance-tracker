// document.addEventListener("DOMContentLoaded", () => {
//     // Render Icons
//     lucide.createIcons();

//     const tSignIn = document.getElementById("toggle-signin");
//     const tSignUp = document.getElementById("toggle-signup");
//     const tBg = document.getElementById("toggle-bg");

//     const formLogin = document.getElementById("form-login");
//     const formSignup = document.getElementById("form-signup");

//     const lError = document.getElementById("login-error");
//     const sError = document.getElementById("signup-error");

//     // Seamless Tab Toggle Controls
//     tSignIn.addEventListener("click", () => {
//         tBg.style.transform = "translateX(0%)";
//         tSignIn.classList.replace("text-slate-400", "text-white");
//         tSignUp.classList.replace("text-white", "text-slate-400");

//         formSignup.classList.add("hidden", "opacity-0", "translate-x-12");
//         formLogin.classList.remove("hidden");
//         setTimeout(() => {
//             formLogin.classList.remove("opacity-0", "-translate-x-12");
//         }, 50);
//     });

//     tSignUp.addEventListener("click", () => {
//         tBg.style.transform = "translateX(100%)";
//         tSignUp.classList.replace("text-slate-400", "text-white");
//         tSignIn.classList.replace("text-white", "text-slate-400");

//         formLogin.classList.add("hidden", "opacity-0", "-translate-x-12");
//         formSignup.classList.remove("hidden");
//         setTimeout(() => {
//             formSignup.classList.remove("opacity-0", "translate-x-12");
//         }, 50);
//     });

//     // Toggle Input Passwords Visible
//     document.querySelectorAll(".toggle-password-visibility").forEach(btn => {
//         btn.addEventListener("click", (e) => {
//             const input = e.currentTarget.previousElementSibling;
//             const icon = e.currentTarget.querySelector("i");
//             if (input.type === "password") {
//                 input.type = "text";
//                 icon.setAttribute("data-lucide", "eye-off");
//             } else {
//                 input.type = "password";
//                 icon.setAttribute("data-lucide", "eye");
//             }
//             lucide.createIcons();
//         });
//     });

//     // Dynamic Password Strength Meter logic
//     const signupPass = document.getElementById("signup-password");
//     const labelStrength = document.getElementById("strength-label");
//     const b1 = document.getElementById("bar-1");
//     const b2 = document.getElementById("bar-2");
//     const b3 = document.getElementById("bar-3");

//     signupPass.addEventListener("input", () => {
//         const val = signupPass.value;
//         let score = 0;

//         if (val.length >= 6) score++;
//         if (/[A-Z]/.test(val) && /[0-9]/.test(val)) score++;
//         if (/[^A-Za-z0-9]/.test(val)) score++;

//         [b1, b2, b3].forEach(b => b.className = "h-full w-1/3 bg-slate-900 transition-colors");

//         if (val.length === 0) {
//             labelStrength.textContent = "Empty";
//             labelStrength.className = "text-slate-500";
//         } else if (score === 1) {
//             labelStrength.textContent = "Weak";
//             labelStrength.className = "text-red-400";
//             b1.classList.replace("bg-slate-900", "bg-red-500");
//         } else if (score === 2) {
//             labelStrength.textContent = "Medium";
//             labelStrength.className = "text-amber-400";
//             b1.classList.replace("bg-slate-900", "bg-amber-500");
//             b2.classList.replace("bg-slate-900", "bg-amber-500");
//         } else if (score >= 3) {
//             labelStrength.textContent = "Strong";
//             labelStrength.className = "text-emerald-400";
//             b1.classList.replace("bg-slate-900", "bg-emerald-500");
//             b2.classList.replace("bg-slate-900", "bg-emerald-500");
//             b3.classList.replace("bg-slate-900", "bg-emerald-500");
//         }
//     });

//     // Login Form Request Handler
//     formLogin.addEventListener("submit", async (e) => {
//         e.preventDefault();
//         lError.classList.add("hidden");
//         setLoading(formLogin, true);

//         const email = document.getElementById("login-email").value;
//         const password = document.getElementById("login-password").value;

//         try {
//             const res = await fetch('/api/auth/login', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ email, password })
//             });
//             const data = await res.json();
//             if (res.ok) {
//                 // If they are admin, direct them to Admin panel. Else, direct to user ledger.
//                 if (data.user.role === 'admin') {
//                     window.location.href = "/admin.html";
//                 } else {
//                     window.location.href = "/index.html";
//                 }
//             } else {
//                 lError.querySelector(".msg").textContent = data.error;
//                 lError.classList.remove("hidden");
//             }
//         } catch {
//             lError.querySelector(".msg").textContent = "Connection issue. Please verify server status.";
//             lError.classList.remove("hidden");
//         } finally {
//             setLoading(formLogin, false);
//         }
//     });

//     // Sign up Form Request Handler
//     formSignup.addEventListener("submit", async (e) => {
//         e.preventDefault();
//         sError.classList.add("hidden");
//         setLoading(formSignup, true);

//         const name = document.getElementById("signup-name").value;
//         const email = document.getElementById("signup-email").value;
//         const password = document.getElementById("signup-password").value;

//         try {
//             const res = await fetch('/api/auth/signup', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ name, email, password })
//             });
//             const data = await res.json();
//             if (res.ok) {
//                 window.location.href = "/index.html";
//             } else {
//                 sError.querySelector(".msg").textContent = data.error;
//                 sError.classList.remove("hidden");
//             }
//         } catch {
//             sError.querySelector(".msg").textContent = "Network error. Try again.";
//             sError.classList.remove("hidden");
//         } finally {
//             setLoading(formSignup, false);
//         }
//     });

//     function setLoading(form, isLoading) {
//         const btn = form.querySelector('button[type="submit"]');
//         const text = btn.querySelector('.btn-text');
//         const spinner = btn.querySelector('.loading-spinner');

//         if (isLoading) {
//             btn.disabled = true;
//             text.classList.add("opacity-50");
//             spinner.classList.remove("hidden");
//         } else {
//             btn.disabled = false;
//             text.classList.remove("opacity-50");
//             spinner.classList.add("hidden");
//         }
//     }
// });






document.addEventListener("DOMContentLoaded", () => {
    // Render Icons
    lucide.createIcons();

    const tSignIn = document.getElementById("toggle-signin");
    const tSignUp = document.getElementById("toggle-signup");
    const tBg = document.getElementById("toggle-bg");

    const formLogin = document.getElementById("form-login");
    const formSignup = document.getElementById("form-signup");

    const lError = document.getElementById("login-error");
    const sError = document.getElementById("signup-error");

    // ============================================
    // ENHANCED TOAST NOTIFICATION SYSTEM
    // ============================================
    function showToast(message, type = 'success', title = '') {
        const container = document.getElementById('toast-container');
        const overlay = document.getElementById('toast-overlay');
        if (!container) return;

        if (overlay) {
            overlay.classList.remove('opacity-0', 'pointer-events-none');
            overlay.classList.add('opacity-100', 'pointer-events-auto');
        }

        const toastId = 'toast-' + Date.now();

        const titles = {
            success: 'Success!',
            error: 'Error!',
            info: 'Information'
        };
        
        const finalTitle = title || titles[type] || 'Notification';
        
        const configs = {
            success: {
                icon: '✅',
                bg: 'bg-emerald-500/10',
                border: 'border-emerald-500/30',
                text: 'text-emerald-600 dark:text-emerald-400',
                iconBg: 'bg-emerald-500/20',
                progress: 'bg-emerald-500',
                titleColor: 'text-emerald-700 dark:text-emerald-300'
            },
            error: {
                icon: '❌',
                bg: 'bg-red-500/10',
                border: 'border-red-500/30',
                text: 'text-red-600 dark:text-red-400',
                iconBg: 'bg-red-500/20',
                progress: 'bg-red-500',
                titleColor: 'text-red-700 dark:text-red-300'
            },
            info: {
                icon: 'ℹ️',
                bg: 'bg-indigo-500/10',
                border: 'border-indigo-500/30',
                text: 'text-indigo-600 dark:text-indigo-400',
                iconBg: 'bg-indigo-500/20',
                progress: 'bg-indigo-500',
                titleColor: 'text-indigo-700 dark:text-indigo-300'
            }
        };

        const config = configs[type] || configs.info;

        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `
            toast-item pointer-events-auto
            bg-white dark:bg-slate-900/95
            backdrop-blur-xl
            border ${config.border}
            rounded-2xl
            shadow-2xl
            p-5
            flex items-start gap-4
            min-w-[320px] max-w-[440px] w-full
            transform scale-95 translate-y-4 opacity-0
            transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)]
            relative overflow-hidden
            mx-4
        `;

        toast.innerHTML = `
            <div class="absolute top-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800">
                <div class="h-full ${config.progress} rounded-full transition-all duration-[3500ms] ease-linear" style="width: 100%"></div>
            </div>
            <div class="flex-shrink-0 w-11 h-11 rounded-xl ${config.iconBg} flex items-center justify-center text-2xl">
                ${config.icon}
            </div>
            <div class="flex-1 min-w-0">
                <h4 class="text-sm font-bold ${config.titleColor} mb-0.5">${finalTitle}</h4>
                <p class="text-sm ${config.text} opacity-90 leading-relaxed">${message}</p>
            </div>
            <button onclick="closeToast('${toastId}')" 
                    class="flex-shrink-0 w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-all duration-200 flex items-center justify-center">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        `;

        container.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.remove('scale-95', 'translate-y-4', 'opacity-0');
            toast.classList.add('scale-100', 'translate-y-0', 'opacity-100');
        });

        const progressBar = toast.querySelector('.h-full');
        if (progressBar) {
            setTimeout(() => {
                progressBar.style.width = '0%';
            }, 100);
        }

        const timeoutId = setTimeout(() => {
            closeToast(toastId);
        }, 3500);

        toast.dataset.timeoutId = timeoutId;
    }

    window.closeToast = function(toastId) {
        const toast = document.getElementById(toastId);
        if (!toast) return;

        if (toast.dataset.timeoutId) {
            clearTimeout(parseInt(toast.dataset.timeoutId));
        }

        toast.classList.remove('scale-100', 'translate-y-0', 'opacity-100');
        toast.classList.add('scale-95', '-translate-y-4', 'opacity-0');

        setTimeout(() => {
            toast.remove();
            const container = document.getElementById('toast-container');
            const overlay = document.getElementById('toast-overlay');
            if (container && container.children.length === 0) {
                if (overlay) {
                    overlay.classList.remove('opacity-100', 'pointer-events-auto');
                    overlay.classList.add('opacity-0', 'pointer-events-none');
                }
            }
        }, 400);
    }

    function closeAllToasts() {
        const container = document.getElementById('toast-container');
        if (container) {
            const toasts = container.querySelectorAll('.toast-item');
            toasts.forEach(toast => {
                window.closeToast(toast.id);
            });
        }
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllToasts();
        }
    });

    document.addEventListener('DOMContentLoaded', () => {
        const overlay = document.getElementById('toast-overlay');
        if (overlay) {
            overlay.addEventListener('click', closeAllToasts);
        }
    });

    // Seamless Tab Toggle Controls
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

    // Toggle Input Passwords Visible
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

    // Dynamic Password Strength Meter logic
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

        [b1, b2, b3].forEach(b => b.className = "h-full w-1/3 bg-slate-900 transition-colors");

        if (val.length === 0) {
            labelStrength.textContent = "Empty";
            labelStrength.className = "text-slate-500";
        } else if (score === 1) {
            labelStrength.textContent = "Weak";
            labelStrength.className = "text-red-400";
            b1.classList.replace("bg-slate-900", "bg-red-500");
        } else if (score === 2) {
            labelStrength.textContent = "Medium";
            labelStrength.className = "text-amber-400";
            b1.classList.replace("bg-slate-900", "bg-amber-500");
            b2.classList.replace("bg-slate-900", "bg-amber-500");
        } else if (score >= 3) {
            labelStrength.textContent = "Strong";
            labelStrength.className = "text-emerald-400";
            b1.classList.replace("bg-slate-900", "bg-emerald-500");
            b2.classList.replace("bg-slate-900", "bg-emerald-500");
            b3.classList.replace("bg-slate-900", "bg-emerald-500");
        }
    });

    // Login Form Request Handler
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
                showToast(`Welcome back, ${data.user.name}!`, 'success', 'Login Successful! 🎉');
                setTimeout(() => {
                    if (data.user.role === 'admin') {
                        window.location.href = "/admin.html";
                    } else {
                        window.location.href = "/index.html";
                    }
                }, 500);
            } else {
                lError.querySelector(".msg").textContent = data.error;
                lError.classList.remove("hidden");
                showToast(data.error, 'error', 'Login Failed');
            }
        } catch {
            lError.querySelector(".msg").textContent = "Connection issue. Please verify server status.";
            lError.classList.remove("hidden");
            showToast("Connection issue. Please verify server status.", 'error', 'Network Error');
        } finally {
            setLoading(formLogin, false);
        }
    });

    // Sign up Form Request Handler
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
                showToast(`Account created successfully! Welcome ${name}!`, 'success', 'Welcome Aboard! 🎉');
                setTimeout(() => {
                    window.location.href = "/index.html";
                }, 500);
            } else {
                sError.querySelector(".msg").textContent = data.error;
                sError.classList.remove("hidden");
                showToast(data.error, 'error', 'Registration Failed');
            }
        } catch {
            sError.querySelector(".msg").textContent = "Network error. Try again.";
            sError.classList.remove("hidden");
            showToast("Network error. Try again.", 'error', 'Network Error');
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