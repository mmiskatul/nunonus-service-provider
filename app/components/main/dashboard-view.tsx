const statCards = [
  {
    icon: "✎",
    trend: "+12.5%",
    label: "Total Revenue",
    value: "$4,285,120",
    sub: "vs. $3.8M last month"
  },
  {
    icon: "◍",
    trend: "+5.2%",
    label: "Active Users",
    value: "85,420",
    sub: "Daily active sessions peak"
  },
  {
    icon: "⌂",
    trend: "+5.2%",
    label: "Active Vendors",
    value: "85,40",
    sub: "Daily active sessions peak"
  },
  {
    icon: "☑",
    trend: "+8.1%",
    label: "Total Bookings",
    value: "12,300",
    sub: "Across all 52 vendors"
  },
  {
    icon: "☺",
    trend: "0.0%",
    label: "Customer Satisfaction",
    value: "4.82/5",
    sub: "Based on 12K reviews"
  }
];

const barHeights = [38, 55, 42, 68, 60, 84, 95, 78, 90, 74, 82, 98];
const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

const vendors = [
  { code: "AL", name: "Azure Luxury Resorts", category: "Hospitality", rating: "4.9", revenue: "$1,240,500", status: "TOP PERFORMER" },
  { code: "SA", name: "SkyHigh Airways", category: "Aviation", rating: "4.7", revenue: "$890,200", status: "STEADY" },
  { code: "GT", name: "Global Travels Co.", category: "Tours", rating: "4.2", revenue: "$450,100", status: "AT RISK" },
  { code: "UV", name: "Urban Velocity", category: "Car Rentals", rating: "4.5", revenue: "$312,000", status: "STEADY" }
];

function statusClass(status: string) {
  if (status === "TOP PERFORMER") return "badge green";
  if (status === "AT RISK") return "badge orange";
  return "badge blue";
}

export function DashboardView() {
  return (
    <div className="dashboard-grid">
      <section className="stats-grid">
        {statCards.map((card) => (
          <article key={card.label} className="card">
            <div>
              <span className="stat-icon">{card.icon}</span>
              <span className="stat-trend">{card.trend}</span>
            </div>
            <div className="stat-label">{card.label}</div>
            <h2 className="stat-value">{card.value}</h2>
            <div className="stat-sub">{card.sub}</div>
          </article>
        ))}
      </section>

      <section className="charts-row">
        <article className="card">
          <div className="panel-head">
            <h3 className="panel-title">Revenue Growth Over Time</h3>
            <div className="pills">
              <span className="pill">Weekly</span>
              <span className="pill active">Monthly</span>
            </div>
          </div>
          <div className="bars">
            {barHeights.map((height, index) => (
              <div key={`${months[index]}-${height}`} className="bar" style={{ height: `${height}%` }} />
            ))}
          </div>
          <div className="months">
            {months.map((month) => (
              <span key={month}>{month}</span>
            ))}
          </div>
        </article>

        <article className="card">
          <div className="panel-head">
            <h3 className="panel-title">Booking Insights</h3>
          </div>
          <div className="donut-wrap">
            <div className="donut">
              <div className="donut-text">
                <h4 className="donut-total">12.3k</h4>
                <p className="donut-sub">TOTAL</p>
              </div>
            </div>
          </div>
          <ul className="legend">
            <li>
              <span>
                <span className="dot" style={{ background: "#2d4bb1" }} />
                Hotels & Stays
              </span>
              <strong>45%</strong>
            </li>
            <li>
              <span>
                <span className="dot" style={{ background: "#7f93e6" }} />
                Flight Bundles
              </span>
              <strong>32%</strong>
            </li>
            <li>
              <span>
                <span className="dot" style={{ background: "#d9deef" }} />
                Local Tours
              </span>
              <strong>23%</strong>
            </li>
          </ul>
        </article>
      </section>

      <section className="card">
        <div className="panel-head">
          <h3 className="panel-title">Vendor Performance Snapshot</h3>
          <a href="#">View All Vendors</a>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Vendor Name</th>
                <th>Category</th>
                <th>Ratings</th>
                <th>Revenue</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr key={vendor.name}>
                  <td>
                    <strong>{vendor.code}</strong> {vendor.name}
                  </td>
                  <td>{vendor.category}</td>
                  <td>⭐ {vendor.rating}</td>
                  <td>
                    <strong>{vendor.revenue}</strong>
                  </td>
                  <td>
                    <span className={statusClass(vendor.status)}>{vendor.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
