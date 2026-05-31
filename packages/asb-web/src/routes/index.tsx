import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div>
      <ul>
        <li>
          <Link
            to="/calc_level"
            search={{
              type: "wild",
              n: "",
              h: 0,
              s: 0,
              o: 0,
              f: 0,
              w: 0,
              m: 0,
              t: 0,
              i: 0,
            }}
          >
            個体値→レベル
          </Link>
        </li>
        <li>
          <Link to="/calc_value">レベル→個体値</Link>
        </li>
      </ul>
    </div>
  );
}
