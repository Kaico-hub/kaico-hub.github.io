const owner = "Kaico-hub";
const ownerSlug = owner.toLowerCase();
const pagesBaseUrl = `https://${ownerSlug}.github.io`;
const portalRepositoryName = `${ownerSlug}.github.io`;

const pagesGrid = document.querySelector("#pagesGrid");
const appsGrid = document.querySelector("#appsGrid");
const pagesResultCount = document.querySelector("#pagesResultCount");
const appsResultCount = document.querySelector("#appsResultCount");
const pagesEmptyState = document.querySelector("#pagesEmptyState");
const appsEmptyState = document.querySelector("#appsEmptyState");

let pageProjects = [];
let appProjects = [];
let pagesSourceLabel = "GitHubから自動取得";
let appsSourceLabel = "GitHub Releasesから自動取得";

const accentColors = ["#1a7f78", "#d2a734", "#d9634d", "#466a5b", "#7b6b3c"];

function renderAll() {
  renderCollection({
    grid: pagesGrid,
    resultCount: pagesResultCount,
    emptyState: pagesEmptyState,
    items: pageProjects,
    sourceLabel: pagesSourceLabel
  });

  renderCollection({
    grid: appsGrid,
    resultCount: appsResultCount,
    emptyState: appsEmptyState,
    items: appProjects,
    sourceLabel: appsSourceLabel
  });
}

function renderCollection({ grid, resultCount, emptyState, items, sourceLabel }) {
  grid.innerHTML = items.map(createProjectCard).join("");
  resultCount.textContent = `${items.length} links / ${sourceLabel}`;
  emptyState.hidden = items.length > 0;
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
          ${escapeHtml(project.actionLabel)}
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
  pagesResultCount.textContent = "GitHubから読み込み中";
  appsResultCount.textContent = "GitHub Releasesから読み込み中";

  try {
    const repos = await fetchRepositories();
    const visibleRepos = repos.filter((repo) => !isPortalRepository(repo));

    pageProjects = visibleRepos
      .filter((repo) => repo.has_pages)
      .sort(sortByUpdatedAt)
      .map((repo, index) => toPageProject(repo, index));

    appProjects = await fetchReleasedProjects(visibleRepos);
  } catch (error) {
    pagesSourceLabel = "GitHub API取得失敗";
    appsSourceLabel = "GitHub API取得失敗";
    console.warn("GitHub repositories could not be loaded.", error);
  }

  renderAll();
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

async function fetchReleasedProjects(repos) {
  const releaseResults = await Promise.allSettled(repos.map(fetchLatestRelease));

  return releaseResults
    .map((result) => result.status === "fulfilled" ? result.value : null)
    .filter(Boolean)
    .sort((a, b) => new Date(b.release.published_at) - new Date(a.release.published_at))
    .map(({ repo, release }, index) => toAppProject(repo, release, index));
}

async function fetchLatestRelease(repo) {
  const response = await fetch(`https://api.github.com/repos/${repo.full_name}/releases/latest`, {
    headers: {
      Accept: "application/vnd.github+json"
    }
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Release request failed for ${repo.full_name}`);

  const release = await response.json();
  return release?.html_url ? { repo, release } : null;
}

function toPageProject(repo, index) {
  return {
    title: repo.name,
    description: repo.description || "GitHub Pagesで公開しているページです。",
    url: `${pagesBaseUrl}/${encodeURIComponent(repo.name)}/`,
    icon: getProjectIcon(repo.name),
    accent: accentColors[index % accentColors.length],
    actionLabel: "Open"
  };
}

function toAppProject(repo, release, index) {
  return {
    title: repo.name,
    description: repo.description || release.name || "Windows向けアプリのリリースページです。",
    url: release.html_url || `${repo.html_url}/releases/latest`,
    icon: getProjectIcon(repo.name),
    accent: accentColors[(index + 2) % accentColors.length],
    actionLabel: "Release"
  };
}

function sortByUpdatedAt(a, b) {
  return new Date(b.updated_at) - new Date(a.updated_at);
}

function isPortalRepository(repo) {
  const repoName = repo.name.toLowerCase();
  const fullName = repo.full_name?.toLowerCase() || "";
  return repoName === portalRepositoryName || fullName === `${ownerSlug}/${portalRepositoryName}`;
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

renderAll();
loadProjects();
