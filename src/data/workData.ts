export type WorkItem = {
  id: string;
  title: string;
  category: string;
  year: string;
  location: string;
  description?: string;

  // Primary media — always required
  video: string;

  // Optional poster / fallback
  image?: string;

  slug: string;
  featured?: boolean;
  tags?: string[];
};

export const workData: WorkItem[] = [
  {
    id: "work-01",
    title: "Dubai Design Week",
    category: "Brand Experience",
    year: "2026",
    location: "Dubai, UAE",
    description:
      "A contemporary brand experience bringing together design, culture, technology, and immersive storytelling.",
    video: "/WorkAssets/46950-450094784_small.mp4",
    image: "/images/work/work-showcase-poster-11.jpg",
    slug: "dubai-design-week",
    featured: true,
    tags: ["Experience", "Design", "Culture"],
  },

  {
    id: "work-02",
    title: "Abu Dhabi Corporate Summit",
    category: "Corporate Event",
    year: "2026",
    location: "Abu Dhabi, UAE",
    description:
      "A high-impact corporate experience created to connect leaders, ideas, and audiences through design and production.",
    video: "/WorkAssets/13346519_1280_720_24fps.mp4",
    image: "/images/work/work-showcase-poster-01.jpg",
    slug: "abu-dhabi-corporate-summit",
    featured: true,
    tags: ["Corporate", "Summit", "Production"],
  },

  {
    id: "work-03",
    title: "Qatar Grand Experience",
    category: "Live Experience",
    year: "2025",
    location: "Doha, Qatar",
    description:
      "An immersive live experience combining large-scale production, creative direction, and audience engagement.",
    video: "/WorkAssets/1258-144566586_medium.mp4",
    image: "/images/work/work-showcase-poster-02.jpg",
    slug: "qatar-grand-experience",
    tags: ["Live", "Experience", "Production"],
  },

  {
    id: "work-04",
    title: "Dubai Brand Activation",
    category: "Brand Activation",
    year: "2025",
    location: "Dubai, UAE",
    description:
      "A dynamic brand activation designed to turn physical spaces into memorable moments for audiences.",
    video: "/WorkAssets/1258-144566586_medium.mp4",
    image: "/images/work/work-showcase-poster-03.jpg",
    slug: "dubai-brand-activation",
    featured: true,
    tags: ["Activation", "Branding", "Experiential"],
  },

  {
    id: "work-05",
    title: "Abu Dhabi Cultural Festival",
    category: "Festival",
    year: "2025",
    location: "Abu Dhabi, UAE",
    description:
      "A large-scale cultural experience celebrating creativity, entertainment, and community through immersive environments.",
    video: "/WorkAssets/46950-450094784_small.mp4",
    image: "/images/work/work-showcase-poster-04.jpg",
    slug: "abu-dhabi-cultural-festival",
    tags: ["Festival", "Culture", "Entertainment"],
  },

  {
    id: "work-06",
    title: "Qatar Luxury Experience",
    category: "Experiential",
    year: "2024",
    location: "Doha, Qatar",
    description:
      "A premium experiential campaign blending luxury, spatial design, hospitality, and refined storytelling.",
    video: "/WorkAssets/13346519_1280_720_24fps.mp4",
    image: "/images/work/work-showcase-poster-05.jpg",
    slug: "qatar-luxury-experience",
    tags: ["Luxury", "Experiential", "Hospitality"],
  },

  {
    id: "work-07",
    title: "UAE National Experience",
    category: "National Events",
    year: "2024",
    location: "UAE",
    description:
      "A large-scale national experience bringing together visual storytelling, technology, performance, and production.",
    video: "/WorkAssets/46950-450094784_small.mp4",
    image: "/images/work/work-showcase-poster-06.jpg",
    slug: "uae-national-experience",
    featured: true,
    tags: ["National", "Experience", "Production"],
  },

  {
    id: "work-08",
    title: "Dubai Luxury Launch",
    category: "Product Launch",
    year: "2024",
    location: "Dubai, UAE",
    description:
      "A sophisticated product launch created around anticipation, visual impact, and premium guest experiences.",
    video: "/WorkAssets/13346519_1280_720_24fps.mp4",
    image: "/images/work/work-showcase-poster-07.jpg",
    slug: "dubai-luxury-launch",
    tags: ["Launch", "Luxury", "Brand Experience"],
  },
];

export const featuredWork = workData.filter(
  (project) => project.featured,
);

export const workCategories = [
  "All",
  ...Array.from(
    new Set(workData.map((project) => project.category)),
  ),
];