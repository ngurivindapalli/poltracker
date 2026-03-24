export interface Leader {
  name: string;
  title: string;
  country: string;
  slug: string;
  image: string;
}

export const GLOBAL_LEADERS: Leader[] = [
  {
    name: "Donald Trump",
    title: "President",
    country: "United States",
    slug: "donald-trump",
    image: "/leaders/donald-trump.jpg",
  },
  {
    name: "Keir Starmer",
    title: "Prime Minister",
    country: "United Kingdom",
    slug: "keir-starmer",
    image: "/leaders/keir-starmer.jpg",
  },
  {
    name: "Olaf Scholz",
    title: "Chancellor",
    country: "Germany",
    slug: "olaf-scholz",
    image: "/leaders/olaf-scholz.jpg",
  },
  {
    name: "Narendra Modi",
    title: "Prime Minister",
    country: "India",
    slug: "narendra-modi",
    image: "/leaders/narendra-modi.jpg",
  },
  {
    name: "Emmanuel Macron",
    title: "President",
    country: "France",
    slug: "emmanuel-macron",
    image: "/leaders/emmanuel-macron.jpg",
  },
  {
    name: "Mark Carney",
    title: "Prime Minister",
    country: "Canada",
    slug: "mark-carney",
    image: "/leaders/mark-carney.jpg",
  },
];
