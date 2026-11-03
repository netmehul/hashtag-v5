export type Testimonial = {
  id: string;
  /** any length works: the note on the board simply grows taller to fit it */
  quote: string;
  name: string;
  role: string;
  /** shown under the name, e.g. "Marketing Director, Northwind" */
  company: string;

  /** optional photo, e.g. "/images/testimonials/aarav.webp".
   *  Used on its own if there is no video, or as the still frame before the video plays.
   *  If both `image` and `video` are missing, the note is text only. */
  image?: string;
  
  /** optional testimonial video, e.g. "/videos/testimonials/aarav.mp4".
   *  Plays muted on hover (tap on touch screens). Use a short, compressed clip. */
  video?: string;
};

/* PLACEHOLDER CONTENT: replace names, quotes, companies, photos and videos with real ones. */
export const testimonials: Testimonial[] = [
  {
    id: "01",
    quote:
      "They turned our launch into an experience people are still talking about. Flawless from the first brief to the final applause. Every detail, from the venue to the guest flow, was handled before we even knew to ask, and the whole team stayed calm when the schedule changed on the day itself.",
    name: "Aarav Mehta",
    role: "Marketing Director",
    company: "Northwind",
    // image: "/images/testimonials/aarav.webp",
    // video: "/videos/testimonials/aarav.mp4",
  },
  {
    id: "02",
    quote:
      "The campaign had a clear idea and it showed. Our reach tripled and the brand finally felt like ours.",
    name: "Sara Haddad",
    role: "Head of Brand",
    company: "Aurora Retail",
  },
  {
    id: "03",
    quote:
      "They gave our brand a voice we recognise. Every touchpoint now feels sharper, calmer and far more confident. We went from a patchwork of tones across web, packaging and events to something that sounds like one company, and our sales team noticed the difference within weeks.",
    name: "Daniel Okafor",
    role: "Founder",
    company: "Lumen Labs",
  },
  {
    id: "04",
    quote:
      "Fast, creative and obsessively organised. They activated forty cities without a single missed detail.",
    name: "Mei Tanaka",
    role: "Commercial Lead",
    company: "Kite & Co",
  },
  {
    id: "05",
    quote:
      "Social content that actually sounds human. Our community grew, and so did the conversations around us. They listened first, then wrote like people who genuinely cared about our customers, and it shows in every comment thread.",
    name: "Rhea Kapoor",
    role: "Brand Manager",
    company: "Vertex Group",
  },
];