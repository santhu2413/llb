
const API = "countries.json";

const { useState, useEffect } = React;
const html = htm.bind(React.createElement);

function App() {
  const [countries, setCountries] = useState([]);
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("All");
  const [top5, setTop5] = useState(false);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(API)
      .then(r => {
        if (!r.ok) throw new Error("Failed to fetch countries.");
        return r.json();
      })
      .then(data => {
        const list = Array.isArray(data) ? data : data.countries || [];
        setCountries(list);
        setLoading(false);
      })
      .catch(() => {
        setError("Unable to load countries. Check your API link.");
        setLoading(false);
      });
  }, []);

  const get = (c, ...keys) => {
    for (const k of keys) {
      const v = c[k];
      if (v != null) return typeof v === "object" ? v.name || v.common || "" : v;
    }
    return "";
  };

  const filtered = countries.filter(c => {
    const name = get(c, "name", "country");
    const capital = get(c, "capital");
    const reg = get(c, "region");
    const sub = get(c, "subregion");

    // Typing "asia" shows every Asian country.
    const asiaSearch = search.trim().toLowerCase() === "asia";
    const matchesSearch =
      !search ||
      (asiaSearch
        ? reg.toLowerCase() === "asia"
        : [name, capital, reg, sub].some(v =>
            String(v).toLowerCase().includes(search.toLowerCase())
          ));

    return matchesSearch && (region === "All" || reg === region);
  }).sort((a, b) =>
    String(get(a, "name", "country")).localeCompare(
      String(get(b, "name", "country"))
    )
  );

  const displayed = top5
    ? [...filtered].sort((a, b) =>
        Number(get(b, "population") || 0) -
        Number(get(a, "population") || 0)
      ).slice(0, 5)
    : filtered;

  const flag = c => get(c, "flag", "flags") &&
    (typeof c.flags === "object" ? c.flags?.svg || c.flags?.png : c.flag);

  const regions = ["All", "Africa", "Americas", "Asia", "Europe", "Oceania"];

  return html`
    <main className="min-h-screen bg-base-200 p-5 md:p-10">
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-primary">
          <i className="fa-solid fa-earth-americas mr-3"></i>World Explorer
        </h1>
        <p className="mt-3 opacity-70">Discover countries around the world</p>
      </header>

      <section className="max-w-6xl mx-auto">
        <input
          className="input input-bordered w-full mb-4"
          placeholder="Search countries, capitals or type asia..."
          value=${search}
          onChange=${e => { setSearch(e.target.value); setTop5(false); }}
        />

        <div className="flex flex-wrap gap-2 justify-center mb-6">
          ${regions.map(r => html`
            <button
              key=${r}
              className=${"btn btn-sm " + (region === r ? "btn-primary" : "btn-outline")}
              onClick=${() => { setRegion(r); setTop5(false); }}
            >${r}</button>
          `)}
          <button
            className=${"btn btn-sm " + (top5 ? "btn-secondary" : "btn-outline")}
            onClick=${() => setTop5(!top5)}
          ><i className="fa-solid fa-trophy"></i> Top 5</button>
        </div>

        ${loading && html`<p className="text-center p-10">Loading countries...</p>`}
        ${error && html`<p className="alert alert-error">${error}</p>`}

        ${!loading && !error && html`
          <p className="text-sm opacity-70 mb-4">
            ${displayed.length} countries found
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            ${displayed.map((c, i) => {
              const name = get(c, "name", "country");
              const capital = get(c, "capital") || "N/A";
              const population = Number(get(c, "population") || 0);
              const reg = get(c, "region") || "N/A";
              const image = flag(c);

              return html`
                <article
                  key=${name + i}
                  className="card bg-base-100 shadow-md hover:shadow-xl transition cursor-pointer"
                  onClick=${() => setSelected(c)}
                >
                  <div className="card-body items-center text-center">
                    ${image && html`
                      <img
                        src=${image}
                        alt=${name + " flag"}
                        className="w-20 h-20 rounded-full object-cover border-4 border-base-200 shadow"
                      />
                    `}
                    <h2 className="card-title mt-2">${name}</h2>
                    <p><i className="fa-solid fa-location-dot mr-2 text-primary"></i>Capital: ${capital}</p>
                    <p><i className="fa-solid fa-users mr-2 text-primary"></i>Population: ${population.toLocaleString()}</p>
                    <span className="badge badge-primary badge-outline">${reg}</span>
                    <button className="btn btn-primary btn-sm mt-2">View Details</button>
                  </div>
                </article>
              `;
            })}
          </div>
          ${displayed.length === 0 && html`
            <p className="text-center p-10">No countries found.</p>
          `}
        `}
      </section>

      ${selected && html`
        <dialog className="modal modal-open" open>
          <div className="modal-box">
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
              onClick=${() => setSelected(null)}
            >✕</button>
            <div className="flex flex-col items-center text-center gap-3">
              ${flag(selected) && html`
                <img
                  src=${flag(selected)}
                  alt="Country flag"
                  className="w-24 h-24 rounded-full object-cover shadow"
                />
              `}
              <h3 className="text-2xl font-bold">${get(selected, "name", "country")}</h3>
              <p>Capital: ${get(selected, "capital") || "N/A"}</p>
              <p>Population: ${Number(get(selected, "population") || 0).toLocaleString()}</p>
              <p>Region: ${get(selected, "region") || "N/A"}</p>
              <p>Subregion: ${get(selected, "subregion") || "N/A"}</p>
              <p>Area: ${Number(get(selected, "area") || 0).toLocaleString()} km²</p>
              <p>Country code: ${get(selected, "cca3", "code") || "N/A"}</p>
            </div>
            <div className="modal-action">
              <button className="btn btn-primary" onClick=${() => setSelected(null)}>Close</button>
            </div>
          </div>
          <div className="modal-backdrop" onClick=${() => setSelected(null)}></div>
        </dialog>
      `}
    </main>
  `;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  html`<${App} />`
);
