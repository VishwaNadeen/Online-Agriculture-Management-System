import { useMemo, useState } from "react";
import Filters from "../components/Filters.jsx";
import SortBar from "../components/SortBar.jsx";
import PersonCard from "../components/PersonCard.jsx";
import { people as seed } from "../data/consultors.jsx";

export default function Directory() {
  // In a real app you'd fetch from your API. For now we use local seed data.
  const [data] = useState(seed);

  const [filters, setFilters] = useState({
    role: "All",
    category: "All",
    state: "All",
    city: "All",
    q: "",
  });
  const [sortBy, setSortBy] = useState("rating_desc");

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return data
      .filter((p) => (filters.role === "All" ? true : p.role === filters.role))
      .filter((p) =>
        filters.category === "All" ? true : p.category === filters.category
      )
      .filter((p) =>
        filters.state === "All" ? true : p.state === filters.state
      )
      .filter((p) => (filters.city === "All" ? true : p.city === filters.city))
      .filter((p) => {
        if (!q) return true;
        const target = (p.name + " " + p.skills.join(" ")).toLowerCase();
        return target.includes(q);
      });
  }, [data, filters]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sortBy) {
      case "experience_desc":
        arr.sort((a, b) => b.experience - a.experience);
        break;
      case "price_asc":
        arr.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        arr.sort((a, b) => b.price - a.price);
        break;
      case "name_asc":
        arr.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "rating_desc":
      default:
        arr.sort((a, b) => b.rating - a.rating);
    }
    return arr;
  }, [filtered, sortBy]);

  return (
    <div >
      <div >
        <Filters filters={filters} onChange={setFilters} dataset={data} />
      </div>
      <div >
        <SortBar count={sorted.length} sortBy={sortBy} setSortBy={setSortBy} />
        <div>
          {sorted.map((p) => (
            <PersonCard key={p.id} p={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
