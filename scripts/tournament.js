// JavaScript Document
/* =========================================================
   MEGA MESSY TOURNAMENT
   TOURNAMENT PAGES

   tournament/index.html                    overview of every stage
   tournament/stage.html?stage=round-of-512 one stage (matches, byes,
                                            group standings, progress)

   Each page sets  <body data-tournament-page="overview">  or
   "stage". The stage list, numbers and results all come from
   tournament-data.js.

   Load order: girls-data.js, tournament-data.js, site.js, tournament.js
========================================================= */

const ITEMS_PER_PAGE = 20;


/* =========================================================
   SMALL HELPERS
========================================================= */

function girlName(id) {

    const girl = getGirl(id);

    return girl ? girl.name : `Girl ${id}`;

}

function number(value) {

    return Number(value).toLocaleString("en-US");

}

function statBox(value, label) {

    return `
        <div class="tm-stat">
            <span class="tm-stat-number">${escapeHTML(typeof value === "number" ? number(value) : value)}</span>
            <span class="tm-stat-label">${escapeHTML(label)}</span>
        </div>
    `;

}

/* Thumbnail (T), falling back to the first profile image (A) */

function fillImages(root) {

    root.querySelectorAll("img[data-girl]").forEach(image => {

        const girl = getGirl(image.dataset.girl);

        if (!girl) {
            return;
        }

        setGirlImage(image, girl, "t", function () {
            setGirlImage(image, girl, "a");
        });

    });

}

const STATE_LABELS = {
    upcoming: "Not started",
    live: "In progress",
    complete: "Complete"
};


/* =========================================================
   PAGINATION (same idea as the All Girls page)
========================================================= */

function createPager(options) {

    const info = options.info;
    const nav = options.nav;

    let page = 1;

    function button(label, target, flags) {

        flags = flags || {};

        const element = document.createElement("button");

        element.type = "button";
        element.className = "page-button";
        element.textContent = label;

        if (flags.active) {
            element.classList.add("active");
            element.setAttribute("aria-current", "page");
        }

        if (flags.disabled) {
            element.disabled = true;
        } else {
            element.addEventListener("click", () => {
                page = target;
                render();
                options.scrollTo.scrollIntoView({ behavior: "smooth", block: "start" });
            });
        }

        return element;

    }

    function render() {

        const items = options.getItems();
        const total = items.length;
        const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

        if (page > totalPages) {
            page = totalPages;
        }

        const start = (page - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;

        options.draw(items.slice(start, end), total);

        info.textContent = total > 0
            ? `Showing ${start + 1}–${Math.min(end, total)} of ${number(total)} ${options.noun}`
            : "";

        nav.innerHTML = "";

        if (totalPages <= 1) {
            return;
        }

        nav.appendChild(button("Prev", page - 1, { disabled: page === 1 }));

        let previous = 0;

        for (let p = 1; p <= totalPages; p++) {

            if (p !== 1 && p !== totalPages && Math.abs(p - page) > 1) {
                continue;
            }

            if (p - previous > 1) {

                const dots = document.createElement("span");

                dots.className = "page-dots";
                dots.textContent = "…";

                nav.appendChild(dots);

            }

            nav.appendChild(button(String(p), p, { active: p === page }));

            previous = p;

        }

        nav.appendChild(button("Next", page + 1, { disabled: page === totalPages }));

    }

    return {
        render: render,
        reset: function () {
            page = 1;
            render();
        }
    };

}


/* =========================================================
   OVERVIEW PAGE
========================================================= */

function buildOverview() {

    const root = document.getElementById("tournamentContent");

    /* ----- numbers ----- */

    const stats = [
        statBox(TOURNAMENT.contestants, "Contestants"),
        statBox(TOURNAMENT.groups, "Groups of 6"),
        statBox(TOURNAMENT.automaticQualifiers, "Automatic Qualifiers"),
        statBox(TOURNAMENT.wildcardEntrants, "Wildcard Entrants"),
        statBox(TOURNAMENT.wildcardQualifiers, "Wildcard Qualifiers"),
        statBox(TOURNAMENT.knockoutEntrants, "Knockout Entry"),
        statBox(TOURNAMENT.mainBracket, "Main Bracket"),
        statBox(1, "Champion")
    ].join("");

    /* ----- podium (only once the final / playoff have results) ----- */

    const podium = getTournamentPodium();

    let podiumHTML = "";

    function podiumCard(className, label, girl) {

        if (!girl) {
            return "";
        }

        return `
            <div class="tm-podium-card ${className}">
                <span>${escapeHTML(label)}</span>
                <strong>
                    <a href="${escapeHTML(getGirlProfileURL(girl.id))}">${escapeHTML(girl.name)}</a>
                </strong>
                <img data-girl="${escapeHTML(girl.id)}" alt="${escapeHTML(girl.name)}">
            </div>
        `;

    }

    if (podium.champion || podium.third) {

        podiumHTML = `
            <div class="tm-podium">
                ${podiumCard("champion", "🏆 Season 1 Champion", podium.champion)}
                ${podiumCard("", "Runner-up", podium.runnerUp)}
                ${podiumCard("", "🥉 Third Place", podium.third)}
            </div>
        `;

    }

    /* ----- stage tiles, grouped by phase ----- */

    const phases = [];

    TOURNAMENT_STAGES.forEach((stage, index) => {

        let phase = phases.find(entry => entry.name === stage.phase);

        if (!phase) {
            phase = { name: stage.phase, stages: [] };
            phases.push(phase);
        }

        phase.stages.push({ stage: stage, order: index + 1 });

    });

    const phaseHTML = phases.map(phase => `

        <h2 class="tm-phase-heading">${escapeHTML(phase.name)}</h2>

        <div class="tm-stage-grid">

            ${phase.stages.map(entry => {

                const stage = entry.stage;
                const state = getStageState(stage.key);
                const progress = getStageProgress(stage.key);

                const meta = stage.type === "groups"
                    ? `${number(stage.entrants)} contestants · ${number(TOURNAMENT.groups)} groups`
                    : `${number(stage.entrants)} contestants · ${number(stage.matches)} ${stage.matches === 1 ? "match" : "matches"}`;

                const outcome = stage.key === "grand-final"
                    ? "Winner is the Season 1 champion"
                    : stage.key === "third-place"
                        ? "Winner takes third place"
                        : stage.key === "semi-finals"
                            ? "2 to the final, 2 to the playoff"
                            : `${number(stage.advancing)} advance`;

                return `
                    <a class="tm-stage-tile" href="${escapeHTML(stageURL(stage.key))}">
                        <span class="tm-stage-order">${entry.order}</span>
                        <span class="tm-stage-icon">${stage.icon}</span>
                        <strong>${escapeHTML(stage.title)}</strong>
                        <span class="tm-stage-meta">${escapeHTML(meta)}</span>
                        <span class="tm-stage-meta">${escapeHTML(outcome)}</span>
                        <span class="tm-stage-state tm-state-${state}">
                            ${STATE_LABELS[state]}${state === "live" ? ` · ${number(progress.completed)}/${number(progress.planned)}` : ""}
                        </span>
                    </a>
                `;

            }).join("")}

        </div>

    `).join("");

    /* ----- rules + final statistics ----- */

    const finalStats = [
        ["Total contestants", TOURNAMENT.contestants],
        ["Total groups", TOURNAMENT.groups],
        ["Automatic qualifiers", TOURNAMENT.automaticQualifiers],
        ["Wildcard entrants", TOURNAMENT.wildcardEntrants],
        ["Wildcard qualifiers", TOURNAMENT.wildcardQualifiers],
        ["Knockout entry contestants", TOURNAMENT.knockoutEntrants],
        ["Main tournament entrants", TOURNAMENT.mainBracket],
        ["Grand finalists", 2],
        ["Season 1 champion", 1]
    ].map(row => `<tr><td>${row[0]}</td><td>${number(row[1])}</td></tr>`).join("");

    root.innerHTML = `

        <div class="tm-stats">${stats}</div>

        ${podiumHTML}

        <div class="tm-card">
            <h2>How Season 1 Works</h2>
            <p>
                ${number(TOURNAMENT.groups)} groups of ${TOURNAMENT.groupSize} contestants play a
                round-robin group stage. The top two in every group qualify, third place goes to a
                wildcard round, and everyone else is eliminated. The qualifiers then enter a
                1v1 knockout tournament, all the way to the Grand Final, to crown the
                <strong>MEGA Messy Champion, Season 1</strong>.
            </p>
        </div>

        ${phaseHTML}

        <div class="tm-card" style="margin-top: 40px;">
            <h2>Competition and Judging</h2>
            <div class="tm-table-scroll">
                <table class="tm-table">
                    <thead><tr><th>Stage</th><th>Format</th></tr></thead>
                    <tbody>
                        <tr><td>Group Stage</td><td>Round robin (15 matchups per group)</td></tr>
                        <tr><td>Wildcard Stage</td><td>1v1 knockout, one round</td></tr>
                        <tr><td>Knockout Entry Round</td><td>1v1 knockout</td></tr>
                        <tr><td>Round of 512 onwards</td><td>1v1 knockout</td></tr>
                        <tr><td>Third Place Playoff</td><td>The two losing semi-finalists</td></tr>
                    </tbody>
                </table>
            </div>
            <ul class="tm-list">
                <li>Community votes count for ${JUDGING.community * 100}% and the judges' scores count for ${JUDGING.judges * 100}%.</li>
                <li>In a knockout match the contestant with the higher combined score advances.</li>
                <li>In the group stage, overall performances across the group decide the top three places.</li>
                <li>The wildcard and knockout entry rounds use byes to fit a 512-person bracket. Byes are awarded using transparent, pre-announced seeding rules.</li>
            </ul>
        </div>

        <div class="tm-card">
            <h2>Season 1 Statistics</h2>
            <div class="tm-table-scroll">
                <table class="tm-table">
                    <thead><tr><th>Category</th><th>Number</th></tr></thead>
                    <tbody>${finalStats}</tbody>
                </table>
            </div>
        </div>

    `;

    fillImages(root);

}


/* =========================================================
   STAGE PAGE
========================================================= */

function getStageKey() {

    return new URLSearchParams(window.location.search).get("stage") || "";

}

function buildStagePage() {

    const stage = getStage(getStageKey());
    const root = document.getElementById("tournamentContent");

    if (!stage) {

        document.getElementById("tmTitle").textContent = "Stage Not Found";

        root.innerHTML = `
            <div class="tm-empty">
                <p>We couldn't find that tournament stage.</p>
                <p style="margin-top: 16px;">
                    <a class="button" href="${escapeHTML(tournamentURL())}">View the Tournament</a>
                </p>
            </div>
        `;

        return;
    }

    document.title = `${stage.title} | MEGA Messy Tournament`;

    document.getElementById("tmPhase").textContent = stage.phase;
    document.getElementById("tmTitle").textContent = stage.title;
    document.getElementById("tmSubtitle").textContent = stage.description;

    const progress = getStageProgress(stage.key);

    /* ----- numbers ----- */

    const boxes = [
        statBox(stage.entrants, "Contestants"),
        statBox(stage.matches, stage.type === "groups" ? "Matchups" : (stage.matches === 1 ? "Match" : "Matches"))
    ];

    if (stage.byes > 0) {
        boxes.push(statBox(stage.byes, stage.byes === 1 ? "Bye" : "Byes"));
    }

    boxes.push(
        stage.key === "grand-final"
            ? statBox(1, "Champion")
            : stage.key === "third-place"
                ? statBox(1, "Third Place")
                : statBox(stage.advancing, "Advance")
    );

    /* ----- progress ----- */

    const percent = progress.planned > 0
        ? Math.min(100, Math.round(progress.completed / progress.planned * 100))
        : 0;

    const progressText = stage.type === "groups"
        ? `${number(progress.completed)} of ${number(progress.planned)} groups finished`
        : `${number(progress.completed)} of ${number(progress.planned)} matches decided`;

    /* ----- how it works ----- */

    const outcomes = stage.outcomes.map(text => `<li>${escapeHTML(text)}</li>`).join("");

    const judging = stage.type === "groups"
        ? "Each contestant's overall score across her group matches decides the final standings."
        : `The contestant with the higher combined score (community votes ${JUDGING.community * 100}%, judges ${JUDGING.judges * 100}%) advances.`;

    root.innerHTML = `

        <div class="tm-stats">${boxes.join("")}</div>

        <div class="tm-progress">
            <div class="tm-progress-text">
                <span>${escapeHTML(progressText)}</span>
                <span>${percent}%</span>
            </div>
            <div class="tm-progress-bar">
                <div class="tm-progress-fill" style="width: ${percent}%"></div>
            </div>
        </div>

        <div class="tm-card">
            <h2>${escapeHTML(stage.format)}</h2>
            <ul class="tm-list">${outcomes}</ul>
            <p style="margin-top: 14px;">${escapeHTML(judging)}</p>
        </div>

        <div id="tmBody"></div>

        <div class="tm-stage-nav" id="tmNav"></div>

    `;

    if (stage.type === "groups") {
        buildGroupResults(stage);
    } else {
        buildMatchList(stage);
    }

    /* ----- previous / next stage ----- */

    const adjacent = getAdjacentStages(stage.key);

    document.getElementById("tmNav").innerHTML =
        (adjacent.previous
            ? `<a class="button" href="${escapeHTML(stageURL(adjacent.previous.key))}">← ${escapeHTML(adjacent.previous.title)}</a>`
            : "") +
        (adjacent.next
            ? `<a class="button" href="${escapeHTML(stageURL(adjacent.next.key))}">${escapeHTML(adjacent.next.title)} →</a>`
            : "");

}


/* ---------- group stage: finished groups ---------- */

function buildGroupResults(stage) {

    const body = document.getElementById("tmBody");

    const finished = Object.keys(GROUP_RESULTS)
        .map(Number)
        .filter(group => getGroupPlacings(group).length > 0)
        .sort((a, b) => a - b);

    body.innerHTML = `
        <p style="text-align: center; margin-bottom: 26px;">
            <a class="button" href="${escapeHTML(siteURL("qualifying/groups/index.html"))}">Browse the Groups and Vote</a>
        </p>
        <div id="tmAnchor"></div>
        <div class="tm-card" id="tmGroupCard"></div>
        <div class="pagination-info" id="tmInfo"></div>
        <nav class="pagination" id="tmPages" aria-label="Pagination"></nav>
    `;

    const card = document.getElementById("tmGroupCard");

    if (finished.length === 0) {

        card.innerHTML = `
            <h2>Group Results</h2>
            <p>No group has finished yet. Final standings appear here as each group is decided.</p>
        `;

        document.getElementById("tmInfo").remove();
        document.getElementById("tmPages").remove();

        return;
    }

    const pager = createPager({
        info: document.getElementById("tmInfo"),
        nav: document.getElementById("tmPages"),
        scrollTo: document.getElementById("tmAnchor"),
        noun: "finished groups",
        getItems: () => finished,
        draw: function (groups) {

            const rows = groups.map(group => {

                const placings = getGroupPlacings(group);

                function names(filter) {

                    return placings
                        .filter(filter)
                        .map(entry => `<a href="${escapeHTML(getGirlProfileURL(entry.id))}">${escapeHTML(girlName(entry.id))}</a>`)
                        .join(", ") || "–";

                }

                return `
                    <tr>
                        <td><a href="${escapeHTML(getGroupURL(group))}">Group ${group}</a></td>
                        <td>${names(entry => entry.place === 1)}</td>
                        <td>${names(entry => entry.place === 2)}</td>
                        <td>${names(entry => entry.place === 3)}</td>
                        <td>${names(entry => entry.place > 3)}</td>
                    </tr>
                `;

            }).join("");

            card.innerHTML = `
                <h2>Group Results</h2>
                <div class="tm-table-scroll">
                    <table class="tm-table">
                        <thead>
                            <tr>
                                <th>Group</th>
                                <th>1st (qualifies)</th>
                                <th>2nd (qualifies)</th>
                                <th>3rd (wildcard)</th>
                                <th>4th&ndash;6th (eliminated)</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            `;

        }
    });

    pager.render();

}


/* ---------- 1v1 stages: matches and byes ---------- */

function contestantHTML(id, side, outcome, score, match) {

    const girl = getGirl(id);

    const details = [];

    if (girl && girl.group) {
        details.push(`Group ${girl.group}`);
    }

    if (girl && girl.from) {
        details.push(girl.from);
    }

    let scoreText = "";

    if (score !== null && score !== undefined) {

        scoreText = `Score ${score.toFixed(2)}`;

        const community = side === "a" ? match.communityA : match.communityB;
        const judges = side === "a" ? match.judgesA : match.judgesB;

        if (community !== undefined && judges !== undefined) {
            scoreText += ` (community ${community}, judges ${judges})`;
        }

    }

    return `
        <a class="tm-contestant ${side} ${outcome}" href="${escapeHTML(getGirlProfileURL(id))}">
            <img data-girl="${escapeHTML(id)}" alt="${escapeHTML(girlName(id))}" loading="lazy">
            <span>
                <span class="tm-contestant-name">${escapeHTML(girlName(id))}</span>
                <span class="tm-contestant-sub">Girl ${escapeHTML(id)}${details.length ? " · " + escapeHTML(details.join(" · ")) : ""}</span>
                ${scoreText ? `<span class="tm-contestant-score">${escapeHTML(scoreText)}</span>` : ""}
            </span>
        </a>
    `;

}

function createMatchCard(entry) {

    const result = entry.result;
    const match = entry.match;

    const card = document.createElement("div");

    if (result.bye) {

        card.className = "tm-match tm-bye";

        card.innerHTML = `
            ${contestantHTML(result.a, "a", "", null, match)}
            <span class="tm-bye-tag">Bye – goes straight through</span>
        `;

        return card;
    }

    card.className = "tm-match";

    const outcomeA = result.complete ? (result.winner === result.a ? "winner" : "loser") : "";
    const outcomeB = result.complete ? (result.winner === result.b ? "winner" : "loser") : "";

    card.innerHTML = `
        ${contestantHTML(result.a, "a", outcomeA, result.scoreA, match)}
        <span class="tm-vs">
            VS
            <span class="tm-match-state ${result.complete ? "done" : "todo"}">
                ${result.complete ? "Decided" : "Upcoming"}
            </span>
        </span>
        ${contestantHTML(result.b, "b", outcomeB, result.scoreB, match)}
    `;

    return card;

}

function buildMatchList(stage) {

    const body = document.getElementById("tmBody");

    const entries = getStageMatches(stage.key);

    if (entries.length === 0) {

        body.innerHTML = `
            <div class="tm-empty">
                <p>The ${escapeHTML(stage.title)} ${stage.matches === 1 ? "match has" : "matches have"} not been announced yet.</p>
                <p style="margin-top: 8px;">Matchups and results appear here as soon as they are published.</p>
            </div>
        `;

        return;
    }

    body.innerHTML = `

        <div id="tmAnchor"></div>

        <div class="tm-toolbar">

            <select id="tmFilter" aria-label="Filter matches">
                <option value="all">All matches</option>
                <option value="decided">Decided</option>
                <option value="upcoming">Upcoming</option>
                ${stage.byes > 0 ? '<option value="byes">Byes</option>' : ""}
            </select>

            <input type="text" id="tmSearch" placeholder="Search contestants...">

        </div>

        <div class="tm-match-list" id="tmMatches"></div>

        <div class="pagination-info" id="tmInfo"></div>
        <nav class="pagination" id="tmPages" aria-label="Pagination"></nav>

    `;

    const filter = document.getElementById("tmFilter");
    const search = document.getElementById("tmSearch");
    const list = document.getElementById("tmMatches");

    function getItems() {

        const mode = filter.value;
        const text = search.value.toLowerCase().trim();

        return entries.filter(entry => {

            const result = entry.result;

            if (mode === "decided" && !(result.complete && !result.bye)) { return false; }
            if (mode === "upcoming" && (result.complete || result.bye)) { return false; }
            if (mode === "byes" && !result.bye) { return false; }

            if (!text) {
                return true;
            }

            return [result.a, result.b]
                .filter(Boolean)
                .some(id => `${girlName(id)} ${id}`.toLowerCase().includes(text));

        });

    }

    const pager = createPager({
        info: document.getElementById("tmInfo"),
        nav: document.getElementById("tmPages"),
        scrollTo: document.getElementById("tmAnchor"),
        noun: "matches",
        getItems: getItems,
        draw: function (pageEntries, total) {

            list.innerHTML = "";

            if (total === 0) {
                list.innerHTML = '<div class="tm-empty">No matches fit your filters.</div>';
                return;
            }

            pageEntries.forEach(entry => list.appendChild(createMatchCard(entry)));

            fillImages(list);

        }
    });

    filter.addEventListener("change", pager.reset);
    search.addEventListener("input", pager.reset);

    pager.reset();

}


/* =========================================================
   START
========================================================= */

if (document.body.dataset.tournamentPage === "stage") {
    buildStagePage();
} else {
    buildOverview();
}
