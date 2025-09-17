import { useMemo } from "react";
export function Filters({ filters, onChange, dataset }) {
  const { role, category, state, city, q } = filters;

  // Build dropdown options from dataset (and dependent city list by state)
  const { roles, categories, states, citiesForState } = useMemo(() => {
    const rolesSet = new Set();
    const catSet = new Set();
    const stateSet = new Set();
    const citySet = new Set();

    dataset.forEach(p => {
      rolesSet.add(p.role);
      catSet.add(p.category);
      stateSet.add(p.state);
      if (!state || p.state === state) citySet.add(p.city);
    });

    return {
      roles: ["All", ...Array.from(rolesSet).sort()],
      categories: ["All", ...Array.from(catSet).sort()],
      states: ["All", ...Array.from(stateSet).sort()],
      citiesForState: ["All", ...Array.from(citySet).sort()],
    };
  }, [dataset, state]);

  const update = (key, value) => onChange({ ...filters, [key]: value });
  const clearAll = () =>
    onChange({ role: "All", category: "All", state: "All", city: "All", q: "" });

  return (
    <aside className="panel">
      <div className="field">
        <label className="label">Search</label>
        <input
          className="input"
          placeholder="Search by name or skill..."
          value={q}
          onChange={(e) => update("q", e.target.value)}
        />
      </div>

      <div className="field">
        <label className="label">Role</label>
        <select
          className="select"
          value={role}
          onChange={(e) => update("role", e.target.value)}
        >
          {roles.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="label">Category</label>
        <select
          className="select"
          value={category}
          onChange={(e) => update("category", e.target.value)}
        >
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="label">State / Province</label>
        <select
          className="select"
          value={state}
          onChange={(e) => update("state", e.target.value)}
        >
          {states.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="label">City</label>
        <select
          className="select"
          value={city}
          onChange={(e) => update("city", e.target.value)}
        >
          {citiesForState.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <button className="clearBtn" onClick={clearAll}>Clear filters</button>
    </aside>
  );
}

/**
 * SortBar
 * Props:
 * - count: number of results
 * - sortBy: string ("rating_desc" | "experience_desc" | "price_asc" | "price_desc" | "name_asc")
 * - setSortBy: (value) => void
 */
export function SortBar({ count, sortBy, setSortBy }) {
  return (
    <div className="panel sortBar">
      <div className="badge">
        {count} result{count === 1 ? "" : "s"}
      </div>
      <div className="sortControls">
        <label className="label" style={{ margin: 0 }}>Sort by</label>
        <select
          className="select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="rating_desc">Rating (high → low)</option>
          <option value="experience_desc">Experience (high → low)</option>
          <option value="price_asc">Price (low → high)</option>
          <option value="price_desc">Price (high → low)</option>
          <option value="name_asc">Name (A → Z)</option>
        </select>
      </div>
    </div>
  );
}

/**
 * PersonCard
 * Props:
 * - p: { name, role, category, state, city, rating, experience, skills[], price }
 */
export function PersonCard({ p }) {
  return (
    <div className="card">
      <div className="badge">{p.role}</div>
      <h3>{p.name}</h3>
      <div className="meta">
        <span className="pill">{p.category}</span>
        <span className="pill">{p.state} • {p.city}</span>
        <span className="pill">⭐ {p.rating.toFixed(1)}</span>
        <span className="pill">{p.experience} yrs</span>
      </div>
      <div className="kv">
        <div><strong>Skills:</strong> {p.skills.join(", ")}</div>
        <div className="price">LKR {p.price.toLocaleString()}</div>
      </div>
    </div>
  );
}