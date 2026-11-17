import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import CTAButton from "../components/CTAButton"

const navLinks = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Projects", to: "/projects" },
  { label: "Clients", to: "/clients"},
];

function Navbar() {
  const [isVisible, setIsVisible] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Hide on scroll down, reveal on scroll up.
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;

      ticking = true;

      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const difference = currentScrollY - lastScrollY;

        if (currentScrollY < 80) {
          setIsVisible(true);
        } else if (difference > 5) {
          setIsVisible(false);
          setIsMenuOpen(false);
        } else if (difference < -5) {
          setIsVisible(true);
        }

        lastScrollY = currentScrollY;
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Close the menu with Escape.
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

const linkClasses = ({ isActive }: { isActive: boolean }) =>
  `px-3.5 py-1.5 text-sm transition-colors duration-300 ${
    isActive
      ? "text-accent border-b border-white"
      : "text-accent/60 hover:text-white"
  }`;

  const hiddenOnScroll = isVisible ? "translate-y-0" : "-translate-y-full";

  return (
    <>
      <header
        className={`fixed inset-x-2 top-2 z-50 text-neutral-950 transition-transform duration-500 ease-in-out ${hiddenOnScroll}`}
      >
        <nav
          aria-label="Main navigation"
          className="mx-auto flex max-w-[1920px] items-center justify-between"
        >
          {/* Logo */}
          <Link
            to="/"
            aria-label="Hashtag Eventz home"
            className="relative z-50 shrink-0 px-2 py-2 rounded-xl"
          >
            <img
              src="/logoIcon.svg"
              alt="Hashtag Eventz"
              className="w-10 sm:w-10 md:w-15"
            />
          </Link>
        </nav>

        {/* Mobile navigation panel (always dark, so it reads on any page) */}
        <div
          id="mobile-navigation"
          aria-hidden={!isMenuOpen}
          className={`absolute inset-x-0 top-full overflow-hidden rounded-xl border border-white/10 bg-black/90 text-white backdrop-blur-md transition-[opacity,transform,visibility] duration-300 ease-out md:hidden ${
            isMenuOpen
              ? "visible translate-y-0 opacity-100"
              : "invisible -translate-y-2 opacity-0"
          }`}
        >
          <div className="flex flex-col gap-1 px-5 py-5">
            {navLinks.map((link, index) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                tabIndex={isMenuOpen ? 0 : -1}
                className={({ isActive }) =>
                  `rounded-lg px-4 py-3 text-lg transition-colors duration-200 ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-white/60 hover:bg-white/10 hover:text-white"
                  }`
                }
                style={{
                  transitionDelay: isMenuOpen ? `${index * 50}ms` : "0ms",
                }}
              >
                {link.label}
              </NavLink>
            ))}

            {/* Same CTA as desktop */}
            <div
              className="px-4 pt-4"
              style={{
                transitionDelay: isMenuOpen ? `${navLinks.length * 50}ms` : "0ms",
              }}
            >
              <CTAButton size="sm" to="/contact">
                Start a Project
              </CTAButton>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu button.
          Same technique as the desktop links: its own fixed layer with
          mix-blend-difference, so the icon is white on dark pages and flips
          to dark on light sections instead of disappearing. */}
      <div
        className={`pointer-events-none fixed inset-x-2 top-2 z-50 flex h-14 items-center justify-end text-white mix-blend-difference transition-transform duration-500 ease-in-out md:hidden ${hiddenOnScroll}`}
      >
        <button
          type="button"
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsMenuOpen((open) => !open)}
          className="pointer-events-auto flex size-11 items-center justify-center rounded-full border border-white/40 transition-colors duration-300 hover:bg-white/15"
        >
          <span className="sr-only">
            {isMenuOpen ? "Close menu" : "Open menu"}
          </span>

          <span className="flex w-5 flex-col items-center gap-1.25">
            <span
              className={`h-0.5 w-5 bg-white transition-transform duration-300 ${
                isMenuOpen ? "translate-y-[3.5px] rotate-45" : ""
              }`}
            />
            <span
              className={`h-0.5 w-5 bg-white transition-transform duration-300 ${
                isMenuOpen ? "translate-y-[-3.5px] -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </div>

      {/* Desktop */}
      <div
        className={`pointer-events-none fixed text-white/60 inset-x-2 top-2 z-50 hidden h-19 items-center mix-blend-difference transition-transform duration-500 ease-in-out md:flex ${hiddenOnScroll}`}
      >
        <div className="mx-auto flex w-full max-w-[1920px] justify-end">
          <div className="pointer-events-auto flex items-center gap-3 rounded-xl py-2 font-normal uppercase md:pl-6 md:pr-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                className={linkClasses}
              >
                {link.label}
              </NavLink>
            ))}

            <CTAButton size="sm" to="/contact">
              Start a Project
            </CTAButton>
          </div>
        </div>
      </div>
    </>
  );
}

export default Navbar;