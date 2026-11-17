import Link from "next/link";

// Tilføj en linje her og en route under app/ for at få en ny sektion.
const sections = [
  { href: "/loeb", title: "Løb", description: "Hegnet Half – plan og log" },
  { href: "/calisthenics", title: "Calisthenics", description: "Dagens pas og log" },
];

export default function Home() {
  return (
    <ul className="section-list">
      {sections.map((section) => (
        <li key={section.href}>
          <Link href={section.href} className="card">
            <h2>{section.title}</h2>
            <span className="muted">{section.description}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
