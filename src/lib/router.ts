import { useState, useEffect, useCallback } from "react";

export type Route =
  | "overview"
  | "tester"
  | "policy"
  | "approvals"
  | "audit"
  | "docs";

const ROUTES: Route[] = ["overview", "tester", "policy", "approvals", "audit", "docs"];

function parseHash(): Route {
  const hash = window.location.hash.replace("#/", "").replace("#", "");
  if (ROUTES.includes(hash as Route)) {
    return hash as Route;
  }
  return "overview";
}

export function useRouter() {
  const [route, setRoute] = useState<Route>(parseHash());

  useEffect(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  const navigate = useCallback((r: Route) => {
    window.location.hash = `/${r}`;
    setRoute(r);
  }, []);

  return { route, navigate };
}
