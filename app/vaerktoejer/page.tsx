import Link from "next/link";

// Tilføj en linje her og en mappe under app/vaerktoejer/ for at få et nyt værktøj.
const tools = [
  { href: "/vaerktoejer/ris", title: "Vand til ris", description: "Gram ris → vand, kogt vægt og kulhydrat" },
  { href: "/vaerktoejer/pace", title: "Pace og tid", description: "Distance og tid → pace, eller pace → sluttid" },
  { href: "/vaerktoejer/opladning", title: "Opladning af elbil", description: "Batteriprocent → kWh, ladetid og pris" },
];

export default function ToolsPage() {
  return (
    <>
      <h1>Værktøjer</h1>
      <ul className="section-list">
        {tools.map(({ href, title, description }) => (
          <li key={href}>
            <Link href={href} className="card">
              <h2>{title}</h2>
              <span className="muted">{description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
