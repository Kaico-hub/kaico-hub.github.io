const owner = "Kaico-hub";
const pagesBaseUrl = `https://${owner.toLowerCase()}.github.io`;
const portalRepositoryName = `${owner.toLowerCase()}.github.io`;

const grid = document.querySelector("#projectGrid");
const resultCount = document.querySelector("#resultCount");
const emptyState = document.querySelector("#emptyState");

let projects = [];
let dataSourceLabel = "GitHubから自動取得";

const accentColors = ["#1a7f78", "#d2a734", "#d9634d", "#466a5b", "#7b6b3c"];

function renderProjects() {
  grid.innerHTML = projects.map(createProjectCard).join("");
  resultCount.textContent = `${projects.length} links / ${dataSourceLabel}`;
  emptyState.hidden = projects.length > 0;
}

function createProjectCard(project) {
  return `
    <a class="project-card" href="${escapeHtml(project.url)}" rel="noreferrer" style="--accent: ${escapeHtml(project.accent)}">
      <div class="tile-thumb" aria-hidden="true">
        <span class="tile-icon">${escapeHtml(project.icon)}</span>
      </div>
      <div class="tile-body">
        <h3>${escapeHtml(project.title)}</h3>
        <p>${escapeHtml(project.description)}</p>
        <span class="tile-footer">
          Open
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 17 17 7"></path>
          <path d="M8 7h9v9"></path>
        </svg>
        </span>
      </div>
    </a>
  `;
}

async function loadProjects() {
  resultCount.textContent = "GitHubから読み込み中";

  try {
    const repos = await fetchRepositories();
    const pagesRepos = repos.filter((repo) => repo.has_pages && !isPortalRepository(repo));

    projects = pagesRepos
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .map((repo, index) => toProject(repo, index));
  } catch (error) {
    dataSourceLabel = "GitHub API取得失敗";
    console.warn("GitHub repositories could not be loaded.", error);
  }

  renderProjects();
}

async function fetchRepositories() {
  const endpoints = [
    `https://api.github.com/users/${owner}/repos?per_page=100&type=owner&sort=updated`,
    `https://api.github.com/orgs/${owner}/repos?per_page=100&type=public&sort=updated`
  ];

  for (const endpoint of endpoints) {
    const response = await fetch(endpoint, {
      headers: {
        Accept: "application/vnd.github+json"
      }
    });

    if (!response.ok) continue;

    const repos = await response.json();
    if (Array.isArray(repos) && repos.length > 0) {
      return repos;
    }
  }

  return [];
}

function toProject(repo, index) {
  return {
    title: repo.name,
    description: repo.description || "GitHub Pagesで公開しているページ。",
    url: `${pagesBaseUrl}/${encodeURIComponent(repo.name)}/`,
    icon: getProjectIcon(repo.name),
    accent: accentColors[index % accentColors.length]
  };
}

function isPortalRepository(repo) {
  return repo.name.toLowerCase() === portalRepositoryName;
}

function getProjectIcon(name) {
  return name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

renderProjects();
loadProjects();
