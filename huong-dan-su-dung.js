(() => {
    "use strict";

    function showTab(tabName, activeButton) {
        const tabContents = document.querySelectorAll(".tab-content");
        tabContents.forEach((tab) => tab.classList.remove("active"));

        const navTabs = document.querySelectorAll(".nav-tab");
        navTabs.forEach((tab) => tab.classList.remove("active"));

        const selectedTab = document.getElementById(tabName);
        if (selectedTab) {
            selectedTab.classList.add("active");
        }

        if (activeButton) {
            activeButton.classList.add("active");
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function initTabs() {
        const navButtons = document.querySelectorAll(".nav-tab[data-tab]");
        navButtons.forEach((button) => {
            button.addEventListener("click", () => {
                const tabName = button.getAttribute("data-tab");
                if (tabName) {
                    showTab(tabName, button);
                }
            });
        });
    }

    function initAnchorScroll() {
        document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
            anchor.addEventListener("click", (e) => {
                e.preventDefault();
                const href = anchor.getAttribute("href");
                if (!href) {
                    return;
                }

                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                }
            });
        });
    }

    function initScrollAnimation() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: "0px 0px -50px 0px"
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = "1";
                    entry.target.style.transform = "translateY(0)";
                }
            });
        }, observerOptions);

        document.querySelectorAll(".feature-card, .step").forEach((el) => {
            el.style.opacity = "0";
            el.style.transform = "translateY(20px)";
            el.style.transition = "all 0.6s ease";
            observer.observe(el);
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        initTabs();
        initAnchorScroll();
        initScrollAnimation();
    });
})();
