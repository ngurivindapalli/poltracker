import Link from "next/link";

const countries = [
  {
    name: "United States",
    href: "/us",
    flag: "https://flagcdn.com/w320/us.png",
    desc: "Senators, state-level views, legislation, and news.",
  },
  {
    name: "Germany",
    href: "/germany",
    flag: "https://flagcdn.com/w320/de.png",
    desc: "Bundestag member profiles (demo cache) + country news.",
  },
  {
    name: "United Kingdom",
    href: "/uk",
    flag: "https://flagcdn.com/w320/gb.png",
    desc: "UK political news feed with clean formatting.",
  },
  {
    name: "India",
    href: "/india",
    flag: "https://flagcdn.com/w320/in.png",
    desc: "Prime Minister, state leaders, and regional news.",
  },
];

export default function CountryCards() {
  return (
    <section className="section">
      <div className="container">
        <div className="sectionHeader">
          <h2>Countries</h2>
          <p>Select a country to explore members, legislation, and news.</p>
        </div>

        <div className="countryGrid">
          {countries.map((c) => (
            <Link href={c.href} key={c.name} className="countryCard">
              <div className="countryFlag">
                <img src={c.flag} alt={`${c.name} flag`} loading="lazy" />
              </div>
              <div className="countryBody">
                <div className="countryName">{c.name}</div>
                <div className="countryDesc">{c.desc}</div>
                <div className="countryLink">Open →</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
