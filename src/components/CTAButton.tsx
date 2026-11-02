
import { Link } from "react-router-dom";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type CTAButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  width?: "fit" | "full";
  size?: "sm" | "md" | "lg";
  to?: string;
  href?: string;
  showArrow?: boolean;
};

export default function CTAButton({
  children,
  variant = "primary",
  width = "fit",
  size = "md",
  to,
  href,
  showArrow = true,
  className = "",
  type = "button",
  ...props
}: CTAButtonProps) {
  const classes = [
    "cta-button",
    `cta-button--${variant}`,
    `cta-button--${size}`,
    width === "full" ? "cta-button--full" : "cta-button--fit",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <span className="cta-button__label">{children}</span>

      {showArrow && (
        <span className="cta-button__icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7 17L17 7M7 7H17V17"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes}>
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      {...props}
    >
      {content}
    </button>
  );
}
