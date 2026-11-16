export type Service = {
  id: string;
  title: string;
  /** shown as a two-line caption under the image */
  text: string;
  image: string;
};

export const services: Service[] = [
  {
    id: "01",
    title: "Events & Exhibitions",
    text: "Live experiences built to bring people together, from launches to large-scale expos.",
    image: "/images/whatWeDo/Event_2x.webp",
  },
  {
    id: "02",
    title: "Advertising & Marketing",
    text: "Campaigns with a clear idea behind them, made to be noticed and remembered.",
    image: "/images/whatWeDo/Advertising_2x.webp",
  },
  {
    id: "03",
    title: "Brand Strategies",
    text: "Positioning and storytelling that give your brand a voice people recognise.",
    image: "/images/whatWeDo/Brand_2x.webp",
  },
  {
    id: "04",
    title: "Digital Marketing",
    text: "Performance-minded digital work that connects your brand to the right audience.",
    image: "/images/whatWeDo/Digital Marketing_2x.webp",
  },
  {
    id: "05",
    title: "Promo & Activation",
    text: "On-ground promotions and brand activations that turn footfall into lasting engagement.",
    image: "/images/whatWeDo/PROMO & ACTIVATION_2x.webp",
  },
  {
    id: "06",
    title: "Social Media",
    text: "Content and community management that keeps your brand present, relevant and social.",
    image: "/images/whatWeDo/Social media_2x.webp",
  },
];