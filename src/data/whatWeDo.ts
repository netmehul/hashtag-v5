export type Service = {
  id: string;
  title: string;
  text: string;
  image: string;
  /** the two floating words shown on the image for this service */
  tags: [string, string];
  /** optional pill colours [word1, word2]; falls back to the red / olive defaults */
  tagColors?: [string, string];
};

export const services: Service[] = [
  {
    id: "01",
    title: "Events & Exhibitions",
    text: "Live experiences built to bring people together, from launches to large-scale expos.",
    image: "/images/whatWeDo/Event_2x.webp",
    tags: ["Launches", "Expos"],
  },
  {
    id: "02",
    title: "Advertising & Marketing",
    text: "Campaigns with a clear idea behind them, made to be noticed and remembered.",
    image: "/images/whatWeDo/Advertising_2x.webp",
    tags: ["Campaigns", "Reach"],
  },
  {
    id: "03",
    title: "Brand Strategies",
    text: "Positioning and storytelling that give your brand a voice people recognise.",
    image: "/images/whatWeDo/Brand_2x.webp",
    tags: ["Identity", "Voice"],
  },
  {
    id: "04",
    title: "Digital Marketing",
    text: "Performance-minded digital work that connects your brand to the right audience.",
    image: "/images/whatWeDo/Digital Marketing_2x.webp",
    tags: ["Growth", "Audience"],
  },
  {
    id: "05",
    title: "Promo & Activation",
    text: "Performance-minded digital work that connects your brand to the right audience.",
    image: "/images/whatWeDo/PROMO & ACTIVATION_2x.webp",
    tags: ["Pop-ups", "Footfall"],
  },
  {
    id: "06",
    title: "Social Media",
    text: "Performance-minded digital work that connects your brand to the right audience.",
    image: "/images/whatWeDo/Social media_2x.webp",
    tags: ["Content", "Community"],
  },
];