import { CONTACT } from "../data/contact";

export type Brief = {
  services: string[];
  budget: string;
  timeline: string;
  message: string;
  link: string;
  name: string;
  email: string;
  company: string;
  phone: string;
};

/**
 * Sends the project brief.
 *
 * 1. If VITE_FORM_ENDPOINT is set in your .env, the brief is POSTed there as JSON.
 *    This works with Formspree, Getform, Basin, a serverless function, or your own API:
 *        VITE_FORM_ENDPOINT=https://formspree.io/f/xxxxxxx
 * 2. Otherwise it opens the visitor's email app with the brief already written out,
 *    addressed to CONTACT.email (data/contact.ts).
 *
 * Returns "sent" when the endpoint accepted it, or "mailto" for the email fallback.
 */
export async function submitBrief(b: Brief): Promise<"sent" | "mailto"> {
  const endpoint = import.meta.env.VITE_FORM_ENDPOINT as string | undefined;

  if (endpoint) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        ...b,
        services: b.services.join(", "),
        _subject: `New project brief from ${b.name}`,
      }),
    });
    if (!res.ok) throw new Error(`Form endpoint answered ${res.status}`);
    return "sent";
  }

  const lines = [
    `Name: ${b.name}`,
    `Email: ${b.email}`,
    b.company ? `Company: ${b.company}` : null,
    b.phone ? `Phone: ${b.phone}` : null,
    "",
    `Services: ${b.services.join(", ")}`,
    `Budget: ${b.budget}`,
    `Timeline: ${b.timeline}`,
    b.link ? `Reference: ${b.link}` : null,
    "",
    "Brief:",
    b.message,
  ].filter((l): l is string => l !== null);

  const subject = encodeURIComponent(`New project brief from ${b.name}`);
  const body = encodeURIComponent(lines.join("\n"));
  window.location.href = `mailto:${CONTACT.email}?subject=${subject}&body=${body}`;
  return "mailto";
}
