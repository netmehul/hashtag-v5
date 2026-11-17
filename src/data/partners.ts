export type Partner = {
  id: string;
  /** used as the accessible name of the logo: replace with the real company names */
  name: string;
  /** file in /public */
  src: string;
  /** optional link, opens in a new tab */
  href?: string;
};

export const partners: Partner[] = [
  { id: "01", name: "Partner 01", src: "/partner-logo/partner-logo-01.svg" },
  { id: "02", name: "Partner 02", src: "/partner-logo/partner-logo-02.svg" },
  { id: "03", name: "Partner 03", src: "/partner-logo/partner-logo-03.svg" },
  { id: "04", name: "Partner 04", src: "/partner-logo/partner-logo-04.svg" },
  { id: "05", name: "Partner 05", src: "/partner-logo/partner-logo-05.svg" },
  { id: "06", name: "Partner 06", src: "/partner-logo/partner-logo-06.svg" },
  { id: "07", name: "Partner 07", src: "/partner-logo/partner-logo-07.svg" },
  { id: "08", name: "Partner 08", src: "/partner-logo/partner-logo-08.svg" },
  { id: "09", name: "Partner 09", src: "/partner-logo/partner-logo-09.svg" },
  { id: "10", name: "Partner 10", src: "/partner-logo/partner-logo-10.svg" },
  { id: "11", name: "Partner 11", src: "/partner-logo/partner-logo-11.svg" },
  { id: "12", name: "Partner 12", src: "/partner-logo/partner-logo-12.svg" },
  { id: "13", name: "Partner 13", src: "/partner-logo/partner-logo-13.svg" },
  { id: "14", name: "Partner 14", src: "/partner-logo/partner-logo-14.svg" },
  { id: "15", name: "Partner 15", src: "/partner-logo/partner-logo-15.svg" },
  { id: "16", name: "Partner 16", src: "/partner-logo/partner-logo-16.svg" },
  { id: "17", name: "Partner 17", src: "/partner-logo/partner-logo-17.svg" },
  { id: "18", name: "Partner 18", src: "/partner-logo/partner-logo-18.svg" },
];
