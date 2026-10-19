
import { useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  Clock3,
  FileText,
  GitBranch,
  GitPullRequest,
  LayoutDashboard,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import "./App.css";

const initialPRs = [
  {
    id: 42,
    title: "Add data preprocessing pipeline",
    repo: "AgriBit",
    author: "sarah",
    quality: 92,
    value: "High",
    status: "Merged",
    label: "enhancement",
  },
  {
    id: 41,
    title: "Fix API endpoint for PR data",
    repo: "PRISM",
    author: "rahul",
    quality: 76,
    value: "Medium",
    status: "Merged",
    label: "bug",
  },
  {
    id: 40,
    title: "Update README with setup steps",
    repo: "PRISM",
    author: "devika",
    quality: 88,
    value: "Medium",
    status: "Open",
    label: "documentation",
  },
  {
    id: 39,
    title: "Improve UI responsiveness",
    repo: "frontend",
    author: "arjun",
    quality: 68,
    value: "Low",
    status: "Open",
    label: "ui",
  },
  {
    id: 38,
    title: "Add tests for PR parser",
    repo: "PRISM",
    author: "megha",
    quality: 95,
    value: "High",
    status: "Merged",
    label: "tests",
  },
];

const activity = [
  { day: "Oct 10", total: 12, merged: 7, open: 4 },
  { day: "Oct 11", total: 17, merged: 10, open: 6 },
  { day: "Oct 12", total: 15, merged: 9, open: 4 },
  { day: "Oct 13", total: 19, merged: 12, open: 9 },
  { day: "Oct 14", total: 19, merged: 12, open: 7 },
  { day: "Oct 15", total: 26, merged: 17, open: 9 },
  { day: "Oct 16", total: 26, merged: 15, open: 9 },
];

const contributors = [
  { name: "sarah", prs: 28, score: 91, initial: "S" },
  { name: "rahul", prs: 21, score: 68, initial: "R" },
  { name: "devika", prs: 14, score: 49, initial: "D" },
  { name: "arjun", prs: 11, score: 38, initial: "A" },
  { name: "megha", prs: 9, score: 28, initial: "M" },
];

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Repositories", icon: BookOpen },
  { name: "Pull Requests", icon: GitPullRequest },
  { name: "Analysis", icon: Activity },
  { name: "Reports", icon: FileText },
];

function MetricCard({
  icon: Icon,
  title,
  value,
  change,
  color,
}) {
  const down = change.startsWith("-");

  return (
    <article className={`metric-card ${color}`}>
      <div className="metric-icon">
        <Icon size={22} />
      </div>

      <div className="metric-content">
        <p>{title}</p>

        <div className="metric-value">
          <strong>{value}</strong>

          <span className={down ? "negative" : "positive"}>
            {down ? (
              <ArrowDownRight size={15} />
            ) : (
              <ArrowUpRight size={15} />
            )}
            {change.replace("-", "")}
          </span>
        </div>

        <small>vs. last 30 days</small>
      </div>
    </article>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`status-badge ${status.toLowerCase()}`}>
      {status}
    </span>
  );
}

function Sidebar({ active, setActive, mobileOpen, closeMobile }) {
  return (
    <>
      {mobileOpen && (
        <button
          className="mobile-overlay"
          onClick={closeMobile}
          aria-label="Close navigation"
        />
      )}

      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-logo">▲</div>

          <div>
            <h1>PRISM</h1>
            <p>
              Pull Request Intelligence
              <br />& Structural Metrics
            </p>
          </div>

          <button
            className="close-sidebar"
            onClick={closeMobile}
            aria-label="Close sidebar"
          >
            <X size={19} />
          </button>
        </div>

        <nav className="navigation">
          {navItems.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={`nav-item ${active === name ? "active" : ""}`}
              onClick={() => {
                setActive(name);
                closeMobile();
              }}
            >
              <Icon size={19} />
              <span>{name}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button
            className={`nav-item ${active === "Settings" ? "active" : ""}`}
            onClick={() => setActive("Settings")}
          >
            <Settings size={19} />
            <span>Settings</span>
          </button>

          <div className="sidebar-tagline">
            <Sparkles size={17} />
            <span>Better PRs. Stronger codebases.</span>
          </div>

          <small className="version">PRISM</small>
        </div>
      </aside>
    </>
  );
}

export default function App() {
  const [active, setActive] = useState("Dashboard");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [repoModal, setRepoModal] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [repositories, setRepositories] = useState([]);
  const [notice, setNotice] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const filteredPRs = useMemo(() => {
    return initialPRs.filter((pr) => {
      const matchesSearch = [
        pr.title,
        pr.repo,
        pr.author,
        pr.label,
        String(pr.id),
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesStatus =
        status === "All" || pr.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [search, status]);

  function addRepository(event) {
    event.preventDefault();

    const url = repoUrl.trim().replace(/\/$/, "");

    if (!/^https:\/\/github\.com\/[^/]+\/[^/]+$/i.test(url)) {
      setNotice(
        "Enter a valid repository URL, such as https://github.com/owner/repo"
      );
      return;
    }

    setRepositories((current) =>
      current.includes(url) ? current : [...current, url]
    );

    setRepoUrl("");
    setRepoModal(false);

    setNotice(
      "Repository added to this demo. Live GitHub data requires backend integration."
    );
  }

  return (
    <div className="app-shell">
      <Sidebar
        active={active}
        setActive={setActive}
        mobileOpen={mobileOpen}
        closeMobile={() => setMobileOpen(false)}
      />

      <main className="main-content">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={21} />
          </button>

          <label className="search-box">
            <Search size={18} />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search repositories, PRs, or users..."
            />
          </label>

          <div className="topbar-actions">
            <button
              className="icon-button"
              title="Connect GitHub repository"
              onClick={() => setRepoModal(true)}
            >
              <GitPullRequest size={18} />
            </button>

            <button
              className="icon-button"
              title="Notifications"
              onClick={() => setNotice("You are all caught up.")}
            >
              <Bell size={19} />
            </button>

            <button
              className="profile-button"
              onClick={() => setNotice("Profile menu is a demo placeholder.")}
            >
              <span className="avatar">T</span>
              <span>Tia</span>
              <ChevronDown size={14} />
            </button>
          </div>
        </header>

        {notice && (
          <div className="notice">
            <span>{notice}</span>
            <button onClick={() => setNotice("")} aria-label="Dismiss">
              <X size={16} />
            </button>
          </div>
        )}

        <section className="welcome-section">
          <div className="welcome-copy">
            <span className="eyebrow">
              <span className="live-dot" />
              PULL REQUEST INTELLIGENCE
            </span>

            <h2>
              {active === "Dashboard" ? (
                <>
                  Welcome to <span>PRISM</span>
                </>
              ) : (
                active
              )}
            </h2>

            <p>
              {active === "Dashboard"
                ? "Analyze, rank and understand pull requests with intelligent structural metrics."
                : `Explore ${active.toLowerCase()} and understand your codebase better.`}
            </p>

            <div className="welcome-features">
              <span><Check size={14} /> Code quality</span>
              <span><Check size={14} /> Contribution value</span>
              <span><Check size={14} /> Codebase health</span>
            </div>
          </div>

          <div className="connect-card">
            <div className="github-icon">
              <GitPullRequest size={18} />
            </div>

            <div>
              <h3>Connect a Repository</h3>
              <p>Analyze pull requests from your GitHub repositories.</p>

              <button
                className="primary-button"
                onClick={() => setRepoModal(true)}
              >
                <Plus size={16} /> Add Repository
              </button>
            </div>
          </div>
        </section>

        {active === "Dashboard" && (
          <>
            <section className="metrics-grid">
              <MetricCard
                icon={GitPullRequest}
                title="Total PRs Analyzed"
                value="124"
                change="12%"
                color="violet"
              />

              <MetricCard
                icon={Check}
                title="Merged PRs"
                value="89"
                change="18%"
                color="green"
              />

              <MetricCard
                icon={Clock3}
                title="Open PRs"
                value="23"
                change="-4%"
                color="amber"
              />

              <MetricCard
                icon={Users}
                title="Unique Contributors"
                value="18"
                change="20%"
                color="purple"
              />
            </section>

            <section className="charts-grid">
              <article className="panel activity-panel">
                <div className="panel-heading">
                  <div>
                    <h3>PR Activity Overview</h3>
                    <p>Pull request activity over time</p>
                  </div>

                  <div className="legend">
                    <span><i className="dot violet-dot" /> Total</span>
                    <span><i className="dot green-dot" /> Merged</span>
                    <span><i className="dot amber-dot" /> Open</span>
                  </div>
                </div>

                <div className="chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activity}>
                      <defs>
                        <linearGradient
                          id="totalFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#8275ff"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="100%"
                            stopColor="#8275ff"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        stroke="#26324b"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="day"
                        tick={{ fill: "#8290ad", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />

                      <YAxis
                        tick={{ fill: "#8290ad", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />

                      <Tooltip
                        contentStyle={{
                          background: "#111a2d",
                          border: "1px solid #344361",
                          borderRadius: 8,
                        }}
                      />

                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#8275ff"
                        strokeWidth={2.5}
                        fill="url(#totalFill)"
                      />

                      <Line
                        type="monotone"
                        dataKey="merged"
                        stroke="#36c99a"
                        strokeWidth={2}
                        dot={false}
                      />

                      <Line
                        type="monotone"
                        dataKey="open"
                        stroke="#f5bd4f"
                        strokeWidth={2}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="panel quality-panel">
                <div className="panel-heading">
                  <div>
                    <h3>PR Quality Distribution</h3>
                    <p>Illustrative quality categories</p>
                  </div>
                </div>

                <div className="quality-content">
                  <div className="donut">
                    <div>
                      <strong>124</strong>
                      <span>Total PRs</span>
                    </div>
                  </div>

                  <div className="quality-legend">
                    <div>
                      <i className="dot green-dot" />
                      <span>High Quality</span>
                      <strong>52%</strong>
                    </div>

                    <div>
                      <i className="dot amber-dot" />
                      <span>Medium Quality</span>
                      <strong>32%</strong>
                    </div>

                    <div>
                      <i className="dot red-dot" />
                      <span>Low Quality</span>
                      <strong>16%</strong>
                    </div>
                  </div>
                </div>

                <p className="muted-note">
                  Demo values · not live GitHub metrics
                </p>
              </article>
            </section>

            <section className="bottom-grid">
              <article className="panel pr-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Recent Pull Requests</h3>
                    <p>Review quality and contribution value</p>
                  </div>

                  <button
                    className="text-button"
                    onClick={() => setActive("Pull Requests")}
                  >
                    View all <ArrowRight size={15} />
                  </button>
                </div>

                <div className="table-controls">
                  <div className="mini-search">
                    <Search size={14} />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Filter pull requests..."
                    />
                  </div>

                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    aria-label="Filter by status"
                  >
                    <option>All</option>
                    <option>Merged</option>
                    <option>Open</option>
                  </select>
                </div>

                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Pull Request</th>
                        <th>Repository</th>
                        <th>Quality</th>
                        <th>Value</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredPRs.map((pr) => (
                        <tr key={pr.id}>
                          <td>#{pr.id}</td>
                          <td>
                            <button
                              className="pr-title"
                              onClick={() =>
                                setNotice(
                                  `PR #${pr.id}: ${pr.title}. Detailed analysis will be added with the backend.`
                                )
                              }
                            >
                              {pr.title}
                            </button>
                            <span className={`label-tag ${pr.label}`}>
                              {pr.label}
                            </span>
                          </td>
                          <td>{pr.repo}</td>
                          <td>
                            <span
                              className={`quality-score ${pr.quality >= 80
                                ? "good"
                                : pr.quality >= 70
                                  ? "medium"
                                  : "low"
                                }`}
                            >
                              {pr.quality}
                            </span>
                          </td>
                          <td>
                            <span className={`value-badge ${pr.value.toLowerCase()}`}>
                              {pr.value}
                            </span>
                          </td>
                          <td><StatusBadge status={pr.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredPRs.length === 0 && (
                  <p className="empty-state">
                    No pull requests match your filters.
                  </p>
                )}

                <div className="table-footer">
                  Showing {filteredPRs.length} sample pull requests
                </div>
              </article>

              <article className="panel contributors-panel">
                <div className="panel-heading">
                  <div>
                    <h3>Top Contributors</h3>
                    <p>Activity-based sample ranking</p>
                  </div>
                </div>

                <div className="contributors-list">
                  {contributors.map((person) => (
                    <div className="contributor" key={person.name}>
                      <div className="contributor-avatar">
                        {person.initial}
                      </div>

                      <div className="contributor-details">
                        <strong>{person.name}</strong>
                        <small>{person.prs} PRs</small>
                      </div>

                      <div className="progress-track">
                        <span style={{ width: `${person.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="contributor-note">
                  <ShieldCheck size={15} />
                  Quality-aware rankings are a planned feature.
                </div>
              </article>
            </section>
          </>
        )}

        {active === "Repositories" && (
          <section className="panel page-panel">
            <div className="panel-heading">
              <div>
                <h3>Your Repositories</h3>
                <p>Repositories added during this session</p>
              </div>

              <button
                className="primary-button"
                onClick={() => setRepoModal(true)}
              >
                <Plus size={16} /> Add Repository
              </button>
            </div>

            {repositories.length === 0 ? (
              <div className="empty-state">
                <Github size={32} />
                <h3>No repositories connected</h3>
                <p>Add a repository to begin configuring PRISM.</p>
              </div>
            ) : (
              repositories.map((url) => (
                <div className="repository-row" key={url}>
                  <Github size={23} />
                  <a href={url} target="_blank" rel="noreferrer">
                    {url.replace("https://github.com/", "")}
                  </a>
                  <span>Added</span>
                </div>
              ))
            )}
          </section>
        )}

        {active === "Pull Requests" && (
          <section className="panel page-panel">
            <div className="panel-heading">
              <div>
                <h3>Pull Request Explorer</h3>
                <p>Search and filter the sample PR dataset</p>
              </div>

              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option>All</option>
                <option>Merged</option>
                <option>Open</option>
              </select>
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Repository</th>
                    <th>Author</th>
                    <th>Quality</th>
                    <th>Value</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPRs.map((pr) => (
                    <tr key={pr.id}>
                      <td>#{pr.id}</td>
                      <td>{pr.title}</td>
                      <td>{pr.repo}</td>
                      <td>{pr.author}</td>
                      <td>{pr.quality}</td>
                      <td>{pr.value}</td>
                      <td><StatusBadge status={pr.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {active === "Analysis" && (
          <section className="analysis-grid">
            <article className="panel analysis-card">
              <Activity size={24} />
              <h3>Structural Quality</h3>
              <p>
                Planned checks for tests, complexity, readability, and
                maintainability.
              </p>
              <strong>84.2 / 100</strong>
              <small>Illustrative score</small>
            </article>

            <article className="panel analysis-card">
              <GitBranch size={24} />
              <h3>Contribution Value</h3>
              <p>
                Evaluate bug fixes, useful features, and meaningful
                codebase improvements.
              </p>
              <strong>72%</strong>
              <small>Illustrative value distribution</small>
            </article>

            <article className="panel analysis-card">
              <ShieldCheck size={24} />
              <h3>Review Readiness</h3>
              <p>
                Future checks can identify missing tests, oversized changes,
                and review bottlenecks.
              </p>
              <strong>23 Open PRs</strong>
              <small>Sample metric</small>
            </article>
          </section>
        )}

        {active === "Reports" && (
          <section className="panel page-panel">
            <h3>Repository Health Report</h3>
            <p className="muted-note">
              This report uses sample values until the backend is integrated.
            </p>

            <div className="report-grid">
              <div><span>Total PRs</span><strong>124</strong></div>
              <div><span>Merged</span><strong>89</strong></div>
              <div><span>Open</span><strong>23</strong></div>
              <div><span>Contributors</span><strong>18</strong></div>
            </div>
          </section>
        )}

        {active === "Settings" && (
          <section className="panel page-panel">
            <h3>Settings</h3>

            <div className="setting-row">
              <div>
                <strong>GitHub repositories</strong>
                <p>Configure repository URLs for this demo.</p>
              </div>

              <button
                className="primary-button"
                onClick={() => setRepoModal(true)}
              >
                Manage repositories
              </button>
            </div>

            <div className="setting-row">
              <div>
                <strong>Quality scoring</strong>
                <p>Explainable code-quality metrics are planned.</p>
              </div>
              <span className="value-badge medium">In development</span>
            </div>
          </section>
        )}

        <footer className="footer">
          <span>▲ PRISM · Pull Request Intelligence & Structural Metrics</span>
          <span>Better PRs. Stronger codebases.</span>
        </footer>
      </main>

      {repoModal && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setRepoModal(false);
            }
          }}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <button
              className="modal-close icon-button"
              onClick={() => setRepoModal(false)}
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            <div className="modal-logo"><Github size={28} /></div>

            <h2 id="modal-title">Connect a repository</h2>
            <p>
              Enter a GitHub repository URL. This demo stores it in React
              state only; it does not fetch GitHub data yet.
            </p>

            <form onSubmit={addRepository}>
              <label htmlFor="repo-url">Repository URL</label>

              <input
                id="repo-url"
                type="url"
                required
                value={repoUrl}
                onChange={(event) => setRepoUrl(event.target.value)}
                placeholder="https://github.com/owner/repo"
              />

              <small>
                <ShieldCheck size={14} /> Backend integration is required
                for live PR analysis.
              </small>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setRepoModal(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="primary-button">
                  <Plus size={16} /> Add Repository
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
