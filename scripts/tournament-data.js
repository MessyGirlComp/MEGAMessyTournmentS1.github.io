// JavaScript Document
/* =========================================================
   MEGA MESSY TOURNAMENT
   SEASON 1 FORMAT + RESULTS + STAGE LOGIC

   Load order on every page:

   girls-data.js, tournament-data.js, site.js, (page script)

   WHAT LIVES HERE
   1. The Season 1 format (numbers, stages, rules)
   2. Results you fill in as the tournament happens
        GROUP_RESULTS        final standings for each group
        TOURNAMENT_RESULTS   1v1 matches for every later stage
   3. Helpers that turn those results into each girl's status
      (Qualified / Wildcard / Eliminated / Champion ...), so the
      All Girls page, group pages, status pages and profiles
      all update from ONE place.

   A girl who appears in the results below gets her status
   from them. A girl who does not appear keeps the manual
   "status" text from girls-data.js.
========================================================= */


/* =========================================================
   1. SEASON 1 FORMAT
========================================================= */

const TOURNAMENT = {

    contestants: 1842,
    groups: 307,
    groupSize: 6,

    automaticQualifiers: 614,      // 1st + 2nd in every group
    wildcardEntrants: 307,         // 3rd in every group
    groupEliminated: 921,          // 4th, 5th, 6th in every group
    groupMatchups: 4605,           // 15 round-robin matchups x 307 groups

    wildcardQualifiers: 154,       // 153 winners + 1 bye
    knockoutEntrants: 768,         // 614 + 154
    knockoutEntryByes: 256,
    mainBracket: 512

};

/* Judging: community votes and judges' scores, 50 / 50.
   A knockout match is won by the higher combined score. */

const JUDGING = {
    community: 0.5,
    judges: 0.5
};


/*
   type "groups"  : round-robin group stage
   type "matches" : 1v1 knockout stage (matches come from
                    TOURNAMENT_RESULTS below)
*/

const TOURNAMENT_STAGES = [

    {
        key: "groups",
        title: "Group Stage",
        phase: "Qualifying Stage",
        icon: "🎯",
        type: "groups",
        entrants: 1842,
        matches: 4605,
        byes: 0,
        advancing: 921,
        eliminated: 921,
        format: "Round robin",
        description: "307 groups of 6 contestants. Everyone in a group competes against everyone else in it (15 matchups per group, 4,605 in total).",
        outcomes: [
            "1st and 2nd place: 614 contestants qualify automatically",
            "3rd place: 307 contestants go to the Wildcard Stage",
            "4th, 5th and 6th place: 921 contestants are eliminated"
        ]
    },

    {
        key: "wildcard",
        title: "Wildcard Stage",
        phase: "Qualifying Stage",
        icon: "🃏",
        type: "matches",
        entrants: 307,
        matches: 153,
        byes: 1,
        advancing: 154,
        eliminated: 153,
        format: "1v1 knockout (one round)",
        description: "The 307 third-place contestants get a second chance in a single 1v1 round. One contestant receives a bye.",
        outcomes: [
            "153 matches are played and 1 contestant receives a bye",
            "153 winners + 1 bye = 154 wildcard qualifiers",
            "153 contestants are eliminated"
        ]
    },

    {
        key: "knockout-entry",
        title: "Knockout Entry Round",
        phase: "Tournament Stage",
        icon: "🚪",
        type: "matches",
        entrants: 768,
        matches: 256,
        byes: 256,
        advancing: 512,
        eliminated: 256,
        format: "1v1 knockout",
        description: "The 614 automatic qualifiers and 154 wildcard qualifiers (768 contestants) are drawn into a standard 512-person bracket.",
        outcomes: [
            "The 256 highest-ranked contestants receive a bye",
            "The other 512 contestants play 256 matches",
            "256 winners + 256 byes = 512 contestants in the Round of 512"
        ]
    },

    { key: "round-of-512", title: "Round of 512", phase: "Tournament Stage", icon: "⚔️", type: "matches", entrants: 512, matches: 256, byes: 0, advancing: 256, eliminated: 256, format: "1v1 knockout" },
    { key: "round-of-256", title: "Round of 256", phase: "Tournament Stage", icon: "⚔️", type: "matches", entrants: 256, matches: 128, byes: 0, advancing: 128, eliminated: 128, format: "1v1 knockout" },
    { key: "round-of-128", title: "Round of 128", phase: "Tournament Stage", icon: "⚔️", type: "matches", entrants: 128, matches: 64, byes: 0, advancing: 64, eliminated: 64, format: "1v1 knockout" },
    { key: "round-of-64", title: "Round of 64", phase: "Tournament Stage", icon: "⚔️", type: "matches", entrants: 64, matches: 32, byes: 0, advancing: 32, eliminated: 32, format: "1v1 knockout" },
    { key: "round-of-32", title: "Round of 32", phase: "Tournament Stage", icon: "⚔️", type: "matches", entrants: 32, matches: 16, byes: 0, advancing: 16, eliminated: 16, format: "1v1 knockout" },
    { key: "round-of-16", title: "Round of 16", phase: "Tournament Stage", icon: "⚔️", type: "matches", entrants: 16, matches: 8, byes: 0, advancing: 8, eliminated: 8, format: "1v1 knockout" },
    { key: "quarter-finals", title: "Quarter-finals", phase: "Tournament Stage", icon: "🔥", type: "matches", entrants: 8, matches: 4, byes: 0, advancing: 4, eliminated: 4, format: "1v1 knockout" },

    {
        key: "semi-finals",
        title: "Semi-finals",
        phase: "Tournament Stage",
        icon: "🔥",
        type: "matches",
        entrants: 4,
        matches: 2,
        byes: 0,
        advancing: 2,
        eliminated: 0,
        format: "1v1 knockout",
        description: "The two winners go to the Grand Final. The two losers play the Third Place Playoff."
    },

    {
        key: "third-place",
        title: "Third Place Playoff",
        phase: "Tournament Stage",
        icon: "🥉",
        type: "matches",
        entrants: 2,
        matches: 1,
        byes: 0,
        advancing: 0,
        eliminated: 0,
        format: "1v1 playoff",
        description: "The two losing semi-finalists compete for third place."
    },

    {
        key: "grand-final",
        title: "Grand Final",
        phase: "Tournament Stage",
        icon: "🏆",
        type: "matches",
        entrants: 2,
        matches: 1,
        byes: 0,
        advancing: 1,
        eliminated: 0,
        format: "1v1 final",
        description: "Two contestants compete for the title of MEGA Messy Champion, Season 1."
    }

];

/* The default description / outcomes for the plain knockout rounds */

TOURNAMENT_STAGES.forEach(stage => {

    if (!stage.description) {
        stage.description =
            `${stage.entrants} contestants play ${stage.matches} 1v1 matches. ` +
            `Winners advance and losers are eliminated.`;
    }

    if (!stage.outcomes) {
        stage.outcomes = [
            `${stage.entrants} contestants · ${stage.matches} matches`,
            `${stage.advancing} winners advance`,
            `${stage.eliminated} contestants are eliminated`
        ];
    }

});

/* Stages that make up the main bracket, in order. A winner of one
   goes to the next one in this list. */

const KNOCKOUT_ORDER = [
    "knockout-entry",
    "round-of-512",
    "round-of-256",
    "round-of-128",
    "round-of-64",
    "round-of-32",
    "round-of-16",
    "quarter-finals",
    "semi-finals",
    "grand-final"
];


/* =========================================================
   2. RESULTS  (fill these in as the tournament happens)
========================================================= */

/*
   GROUP RESULTS
   Final standings of a finished group, 1st place first.
   List all 6 girls' IDs (as in girls-data.js):

   1st + 2nd -> qualify      3rd -> wildcard      4th-6th -> eliminated

   Example:
   4: ["009", "001", "010", "017", "021", "024"],
*/

const GROUP_RESULTS = {

};


/*
   1v1 MATCHES
   One list per stage. Each match:

   { a: "005", b: "006", winner: "005" }       winner entered by hand
   { a: "005", b: "006",
     communityA: 61, communityB: 39,           community vote share
     judgesA: 7.5,   judgesB: 8.5 }            judges' scores (same scale
                                               for both girls)
   { a: "015", bye: true }                     a bye
   { a: "005", b: "006" }                      announced, not played yet

   If "winner" is left out, the winner is the girl with the higher
   combined score (community x 50% + judges x 50%). Community and
   judges must be on the same scale (e.g. both out of 100).
*/

const TOURNAMENT_RESULTS = {

    "wildcard": [],
    "knockout-entry": [],
    "round-of-512": [],
    "round-of-256": [],
    "round-of-128": [],
    "round-of-64": [],
    "round-of-32": [],
    "round-of-16": [],
    "quarter-finals": [],
    "semi-finals": [],
    "third-place": [],
    "grand-final": []

};


/* =========================================================
   3. STAGE LOOKUPS
========================================================= */

function getStage(key) {

    return TOURNAMENT_STAGES.find(stage => stage.key === key) || null;

}

function stageURL(key) {

    return siteURL(`tournament/stage.html?stage=${encodeURIComponent(key)}`);

}

function tournamentURL() {

    return siteURL("tournament/index.html");

}

/* { previous, next } stages in tournament order */

function getAdjacentStages(key) {

    const index = TOURNAMENT_STAGES.findIndex(stage => stage.key === key);

    return {
        previous: index > 0 ? TOURNAMENT_STAGES[index - 1] : null,
        next: index >= 0 && index < TOURNAMENT_STAGES.length - 1
            ? TOURNAMENT_STAGES[index + 1]
            : null
    };

}

/* Where a winner of this stage goes next */

function getNextStageKey(key) {

    if (key === "wildcard") {
        return "knockout-entry";
    }

    const index = KNOCKOUT_ORDER.indexOf(key);

    return index >= 0 && index < KNOCKOUT_ORDER.length - 1
        ? KNOCKOUT_ORDER[index + 1]
        : null;

}

function normaliseGirlID(id) {

    return String(id ?? "").trim().padStart(3, "0");

}


/* =========================================================
   MATCH RESULTS + SCORES
========================================================= */

function combinedScore(community, judges) {

    const c = Number(community);
    const j = Number(judges);

    if (
        community === undefined || community === null || community === "" ||
        judges === undefined || judges === null || judges === "" ||
        !Number.isFinite(c) || !Number.isFinite(j)
    ) {
        return null;
    }

    return Math.round(
        (c * JUDGING.community + j * JUDGING.judges) * 100
    ) / 100;

}

/*
   Works out one match:
   { a, b, bye, scoreA, scoreB, winner, loser, complete }
*/

function getMatchResult(match) {

    const a = normaliseGirlID(match.a);
    const b = match.b ? normaliseGirlID(match.b) : null;

    const result = {
        a: a,
        b: b,
        bye: false,
        scoreA: null,
        scoreB: null,
        winner: null,
        loser: null,
        complete: false
    };

    if (match.bye || !b) {

        result.bye = true;
        result.winner = a;
        result.complete = true;

        return result;
    }

    result.scoreA = combinedScore(match.communityA, match.judgesA);
    result.scoreB = combinedScore(match.communityB, match.judgesB);

    let winner = match.winner ? normaliseGirlID(match.winner) : null;

    if (
        !winner &&
        result.scoreA !== null &&
        result.scoreB !== null &&
        result.scoreA !== result.scoreB
    ) {
        winner = result.scoreA > result.scoreB ? a : b;
    }

    if (winner === a || winner === b) {

        result.winner = winner;
        result.loser = winner === a ? b : a;
        result.complete = true;

    }

    return result;

}

function getStageMatches(key) {

    return (TOURNAMENT_RESULTS[key] || []).map(match => ({
        match: match,
        result: getMatchResult(match)
    }));

}

/* Counts for a stage page / progress bar */

function getStageProgress(key) {

    const stage = getStage(key);

    if (!stage) {
        return null;
    }

    if (stage.type === "groups") {

        const finished = Object.keys(GROUP_RESULTS).filter(group =>
            (GROUP_RESULTS[group] || []).length >= TOURNAMENT.groupSize
        ).length;

        return {
            planned: TOURNAMENT.groups,
            completed: finished,
            pending: 0,
            byes: 0,
            unit: "groups"
        };

    }

    const entries = getStageMatches(key);

    const byes = entries.filter(entry => entry.result.bye).length;
    const played = entries.filter(entry => !entry.result.bye);

    return {
        planned: stage.matches,
        completed: played.filter(entry => entry.result.complete).length,
        pending: played.filter(entry => !entry.result.complete).length,
        byes: byes,
        unit: "matches"
    };

}

/* A stage's whole-number status for the overview page */

function getStageState(key) {

    const progress = getStageProgress(key);

    if (!progress || (progress.completed === 0 && progress.pending === 0 && progress.byes === 0)) {
        return "upcoming";
    }

    if (progress.completed >= progress.planned) {
        return "complete";
    }

    return "live";

}


/* =========================================================
   GROUP STANDINGS
========================================================= */

/* [{ place, id, outcome }]  outcome = qualified | wildcard | eliminated */

function getGroupPlacings(group) {

    const list = GROUP_RESULTS[Number(group)] || GROUP_RESULTS[String(group)];

    if (!list) {
        return [];
    }

    return list.map((id, index) => {

        const place = index + 1;

        return {
            place: place,
            id: normaliseGirlID(id),
            outcome: place <= 2
                ? "qualified"
                : place === 3
                    ? "wildcard"
                    : "eliminated"
        };

    });

}


/* =========================================================
   EACH GIRL'S PROGRESS
   ---------------------------------------------------------
   getTournamentProgress(girl) returns null (girl is not in the
   results yet) or:

   {
       key:      "remaining" | "qualified" | "eliminated"
                 (the same keys the status filters already use)
       label:    text for the status badge
       stage:    stage key she is in / went out in
       wildcard: true while she is in the Wildcard Stage
       champion: true for the Season 1 champion
   }
========================================================= */

let tournamentProgressCache = null;

function resetTournamentProgress() {
    tournamentProgressCache = null;
}

function buildTournamentProgress() {

    const progress = new Map();

    function qualify(id, label, stage) {
        progress.set(id, { key: "qualified", label: label, stage: stage, wildcard: false, champion: false });
    }

    function eliminate(id, label, stage) {
        progress.set(id, { key: "eliminated", label: label, stage: stage, wildcard: false, champion: false });
    }

    function goThrough(id, stageKey) {

        if (stageKey === "knockout-entry") {
            qualify(id, "Qualified", stageKey);
        } else if (stageKey === "third-place") {
            qualify(id, "Third Place Playoff", stageKey);
        } else {
            qualify(id, `Through to ${getStage(stageKey).title}`, stageKey);
        }

    }

    function enterWildcard(id) {
        progress.set(id, { key: "remaining", label: "Wildcard", stage: "wildcard", wildcard: true, champion: false });
    }


    /* ---------- group stage ---------- */

    Object.keys(GROUP_RESULTS).forEach(group => {

        getGroupPlacings(group).forEach(entry => {

            if (entry.outcome === "qualified") {
                goThrough(entry.id, "knockout-entry");
            } else if (entry.outcome === "wildcard") {
                enterWildcard(entry.id);
            } else {
                eliminate(entry.id, "Eliminated – Group Stage", "groups");
            }

        });

    });


    /* ---------- 1v1 stages, in order ---------- */

    const order = ["wildcard", ...KNOCKOUT_ORDER.slice(0, -1), "third-place", "grand-final"];

    order.forEach(stageKey => {

        const stage = getStage(stageKey);
        const next = getNextStageKey(stageKey);

        getStageMatches(stageKey).forEach(entry => {

            const result = entry.result;

            /* A girl in a match with no earlier result: place her in this stage */

            [result.a, result.b].filter(Boolean).forEach(id => {

                if (!progress.has(id)) {

                    if (stageKey === "wildcard") {
                        enterWildcard(id);
                    } else {
                        goThrough(id, stageKey);
                    }

                }

            });

            if (result.bye) {

                if (next) {
                    goThrough(result.a, next);
                }

                return;
            }

            if (!result.complete) {
                return;
            }


            /* ----- decided matches ----- */

            if (stageKey === "grand-final") {

                progress.set(result.winner, {
                    key: "qualified",
                    label: "Champion",
                    stage: stageKey,
                    wildcard: false,
                    champion: true
                });

                eliminate(result.loser, "Runner-up", stageKey);

                return;
            }

            if (stageKey === "third-place") {

                qualify(result.winner, "Third Place", stageKey);
                eliminate(result.loser, "Fourth Place", stageKey);

                return;
            }

            if (stageKey === "semi-finals") {

                goThrough(result.winner, "grand-final");
                goThrough(result.loser, "third-place");

                return;
            }

            goThrough(result.winner, next);

            eliminate(result.loser, `Eliminated – ${stage.title}`, stageKey);

        });

    });

    return progress;

}

function getTournamentProgress(girl) {

    if (!girl) {
        return null;
    }

    if (!tournamentProgressCache) {
        tournamentProgressCache = buildTournamentProgress();
    }

    return tournamentProgressCache.get(normaliseGirlID(girl.id)) || null;

}

/* Season 1 champion and third place (girl objects, or null) */

function getTournamentPodium() {

    const podium = { champion: null, runnerUp: null, third: null, fourth: null };

    const final = getStageMatches("grand-final").find(entry => entry.result.complete);
    const third = getStageMatches("third-place").find(entry => entry.result.complete);

    if (final) {
        podium.champion = getGirl(final.result.winner);
        podium.runnerUp = getGirl(final.result.loser);
    }

    if (third) {
        podium.third = getGirl(third.result.winner);
        podium.fourth = getGirl(third.result.loser);
    }

    return podium;

}
