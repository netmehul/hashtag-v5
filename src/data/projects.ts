export type Project = {
  /** used in the URL: /projects/:slug */
  slug: string;
  title: string;
  category: string;
  year: string;
  client: string;
  location: string;
  /** one or two sentences, shown on the details page intro */
  summary: string;
  services: string[];
  /** card image (also the video poster) */
  cover: string;
  /** optional short looping preview, plays on hover (or when in view on touch) */
  video?: string;
  /** extra images for the details page */
  gallery: string[];
};

const g = (n: number) => `/GalleryAssets/${String(n).padStart(2, "0")}.webp`;

const VIDEO = {
  a: "/WorkAssets/1258-144566586_medium.mp4",
  b: "/WorkAssets/46950-450094784_small.mp4",
  c: "/WorkAssets/13346519_1280_720_24fps.mp4",
};

/* SAMPLE CONTENT: replace with the real projects (names, clients, years, images, videos). */
export const projects: Project[] = [
  {
    slug: "launch-night",
    title: "Launch Night",
    category: "Events",
    year: "2025",
    client: "Client Name",
    location: "Dubai",
    summary: "A full-scale launch built around one moment the room would remember.",
    services: ["Concept", "Production", "Staging"],
    cover: g(1),
    video: VIDEO.a,
    gallery: [g(4), g(7), g(9)],
  },
  {
    slug: "brand-story",
    title: "Brand Story",
    category: "Brand",
    year: "2025",
    client: "Client Name",
    location: "Abu Dhabi",
    summary: "Positioning turned into a story people could walk through.",
    services: ["Strategy", "Identity", "Storytelling"],
    cover: g(2),
    gallery: [g(5), g(8), g(3)],
  },
  {
    slug: "main-stage",
    title: "Main Stage",
    category: "Exhibitions",
    year: "2024",
    client: "Client Name",
    location: "Dubai",
    summary: "Staging, light and sound designed as a single piece.",
    services: ["Exhibition design", "Staging", "AV"],
    cover: g(3),
    gallery: [g(1), g(6), g(9)],
  },
  {
    slug: "crowd-moments",
    title: "Crowd Moments",
    category: "Exhibitions",
    year: "2024",
    client: "Client Name",
    location: "Sharjah",
    summary: "The unplanned reactions that tell you an event worked.",
    services: ["Event design", "Crowd flow", "Content"],
    cover: g(4),
    gallery: [g(2), g(5), g(7)],
  },
  {
    slug: "campaign-shoot",
    title: "Campaign Shoot",
    category: "Advertising",
    year: "2025",
    client: "Client Name",
    location: "Dubai",
    summary: "Campaign imagery produced end to end, from concept to final frame.",
    services: ["Creative direction", "Photography", "Post-production"],
    cover: g(5),
    video: VIDEO.b,
    gallery: [g(8), g(1), g(6)],
  },
  {
    slug: "behind-the-scenes",
    title: "Behind the Scenes",
    category: "Events",
    year: "2024",
    client: "Client Name",
    location: "Dubai",
    summary: "The crew, the schedule and the details nobody sees on the night.",
    services: ["Production", "Logistics", "Crew"],
    cover: g(6),
    gallery: [g(3), g(9), g(4)],
  },
  {
    slug: "product-reveal",
    title: "Product Reveal",
    category: "Advertising",
    year: "2025",
    client: "Client Name",
    location: "Riyadh",
    summary: "A reveal choreographed to land exactly when the audience is ready.",
    services: ["Concept", "Film", "Launch"],
    cover: g(7),
    gallery: [g(2), g(5), g(1)],
  },
  {
    slug: "brand-activation",
    title: "Brand Activation",
    category: "Activation",
    year: "2024",
    client: "Client Name",
    location: "Dubai",
    summary: "Hands-on brand experiences that people choose to stay in.",
    services: ["Activation", "Experience design", "Staffing"],
    cover: g(8),
    video: VIDEO.c,
    gallery: [g(4), g(6), g(3)],
  },
  {
    slug: "gala-evening",
    title: "Gala Evening",
    category: "Events",
    year: "2023",
    client: "Client Name",
    location: "Abu Dhabi",
    summary: "An evening designed from the guest list outward.",
    services: ["Concept", "Production", "Hospitality"],
    cover: g(9),
    gallery: [g(7), g(2), g(8)],
  },
];

export const categories = ["All", ...Array.from(new Set(projects.map((p) => p.category)))];

export const getProject = (slug: string | undefined) => projects.find((p) => p.slug === slug);
