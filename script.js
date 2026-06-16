const loginForm = document.querySelector("[data-login-form]");
const loginStatus = document.querySelector("[data-login-status]");
const autoRevealKey = "pcaAutoRevealMain";
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

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
