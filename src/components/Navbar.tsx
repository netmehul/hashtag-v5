
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
    `text-sm transition-colors duration-200 ${
      isActive
        ? "font-semibold text-neutral-950"
        : "text-neutral-500 hover:text-neutral-950"
    }`; 

  return (
    <header
      className={`fixed inset-x-2 top-2 z-50 text-neutral-950 transition-transform duration-500 ease-in-out ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
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

        {/* Desktop navigation */}
        <div className="hidden  bg-white/90 backdrop-blur-md md:pl-6 md:pr-2 py-2 rounded-xl items-center uppercase font-mono gap-8 md:flex">
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

        {/* Mobile menu button */}
        <button
          type="button"
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsMenuOpen((open) => !open)}
          className="relative z-50 flex size-11 items-center justify-center rounded-full border border-black/10 transition-colors hover:bg-neutral-100 md:hidden"
        >
          <span className="sr-only">
            {isMenuOpen ? "Close menu" : "Open menu"}
          </span>

          <span className="flex w-5 flex-col items-center gap-1.25">
            <span
              className={`h-0.5 w-5 bg-neutral-950 transition-transform duration-300 ${
                isMenuOpen ? "translate-y-[3.5px] rotate-45" : ""
              }`}
            />
            <span
              className={`h-0.5 w-5 bg-neutral-950 transition-transform duration-300 ${
                isMenuOpen ? "translate-y-[-3.5px] -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </nav>

      {/* Mobile navigation panel */}
      <div
        id="mobile-navigation"
        aria-hidden={!isMenuOpen}
        className={`absolute inset-x-0 top-full overflow-hidden border-b border-black/10 bg-white/95 backdrop-blur-md transition-[opacity,transform,visibility] duration-300 ease-out md:hidden ${
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
                    ? "bg-neutral-100 font-semibold text-neutral-950"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
                }`
              }
              style={{
                transitionDelay: isMenuOpen ? `${index * 50}ms` : "0ms",
              }}
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
