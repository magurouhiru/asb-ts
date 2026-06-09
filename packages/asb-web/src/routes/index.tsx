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
            to="/calc"
            search={{
              mode: "value->level",
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
              level: 0,
              withDom: "false",
            }}
          >
            個体値↔レベル
          </Link>
        </li>
      </ul>
    </div>
  );
}
