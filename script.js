const loginForm = document.querySelector("[data-login-form]");
const loginStatus = document.querySelector("[data-login-status]");
const autoRevealKey = "pcaAutoRevealMain";
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const revealSelectors = [
	"#main > .post",
	"#main > .posts > article",
	"#main > .pca-band",
	".pca-card",
	".pca-event",
	".pca-member",
	".pca-partner",
	".pca-placeholder",
	".image.main",
	".image.fit",
	"ul.actions",
	"#footer > section",
].join(",");

const revealMainContent = () => {
	const main = document.querySelector("#main");

	if (!main) {
		return;
	}

	const nav = document.querySelector("#nav");
	const navOffset = nav ? Math.min(nav.offsetHeight * 0.45, 70) : 44;
	const targetTop = Math.max(0, main.getBoundingClientRect().top + window.scrollY - navOffset);

	window.scrollTo({
		top: targetTop,
		behavior: prefersReducedMotion.matches ? "auto" : "smooth",
	});
};

const setupScrollReveals = () => {
	const revealElements = Array.from(document.querySelectorAll(revealSelectors));

	revealElements.forEach((element, index) => {
		element.classList.add("pca-scroll-reveal");
		element.style.setProperty("--pca-reveal-delay", `${Math.min(index % 4, 3) * 55}ms`);
	});

	if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) {
		if (prefersReducedMotion.matches) {
			revealElements.forEach((element) => element.classList.add("is-visible"));
			return;
		}

		let ticking = false;

		const revealVisibleElements = () => {
			ticking = false;
			const revealLine = window.innerHeight * 0.88;

			revealElements.forEach((element) => {
				if (element.classList.contains("is-visible")) {
					return;
				}

				if (element.getBoundingClientRect().top < revealLine) {
					element.classList.add("is-visible");
				}
			});

			if (revealElements.every((element) => element.classList.contains("is-visible"))) {
				window.removeEventListener("scroll", queueRevealCheck);
				window.removeEventListener("resize", queueRevealCheck);
			}
		};

		const queueRevealCheck = () => {
			if (ticking) {
				return;
			}

			ticking = true;
			window.requestAnimationFrame(revealVisibleElements);
		};

		window.addEventListener("scroll", queueRevealCheck, { passive: true });
		window.addEventListener("resize", queueRevealCheck);
		queueRevealCheck();
		return;
	}

	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (!entry.isIntersecting) {
					return;
				}

				entry.target.classList.add("is-visible");
				observer.unobserve(entry.target);
			});
		},
		{
			rootMargin: "0px 0px -12% 0px",
			threshold: 0.14,
		}
	);

	revealElements.forEach((element) => observer.observe(element));
};

setupScrollReveals();

window.addEventListener("pageshow", () => {
	document.body.classList.remove("pca-page-leaving");
	document.body.classList.add("pca-page-ready");

	if (sessionStorage.getItem(autoRevealKey) === "true") {
		sessionStorage.removeItem(autoRevealKey);
		window.setTimeout(revealMainContent, prefersReducedMotion.matches ? 0 : 260);
	}
});

document.querySelectorAll('a[href]').forEach((link) => {
	link.addEventListener("click", (event) => {
		const href = link.getAttribute("href");

		if (!href || href.startsWith("#") || link.target || link.hasAttribute("download")) {
			return;
		}

		const nextUrl = new URL(href, window.location.href);
		const currentUrl = new URL(window.location.href);
		const isInternalPage = nextUrl.origin === currentUrl.origin && nextUrl.pathname.endsWith(".html");
		const isSamePageAnchor = nextUrl.pathname === currentUrl.pathname && nextUrl.hash;
		const isNavTab = Boolean(link.closest("#nav .links, #navPanel"));
		const isSamePageTab = isNavTab && nextUrl.pathname === currentUrl.pathname && !nextUrl.hash;

		if (!isInternalPage || isSamePageAnchor) {
			return;
		}

		if (isSamePageTab) {
			event.preventDefault();
			revealMainContent();
			return;
		}

		event.preventDefault();

		if (isNavTab) {
			sessionStorage.setItem(autoRevealKey, "true");
		}

		document.body.classList.add("pca-page-leaving");
		window.setTimeout(() => {
			window.location.href = nextUrl.href;
		}, 180);
	});
});

loginForm?.addEventListener("submit", (event) => {
	event.preventDefault();

	if (loginStatus) {
		loginStatus.textContent = "Login is not connected yet.";
	}
});
