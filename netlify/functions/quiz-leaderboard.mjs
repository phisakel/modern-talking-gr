export function rankPlayers(submissions) {
  const players = new Map();
  for (const { data = {} } of submissions) {
    // Older submissions were explicitly private.
    if (data["public-leaderboard"] !== "yes") continue;
    const name = typeof data["player-name"] === "string"
      ? data["player-name"].normalize("NFKC").trim().replace(/\s+/g, " ")
      : "";
    const rawScore = data["correct-answers"];
    if (!name || name.length > 60 || !/^(?:[0-9]|10)$/.test(String(rawScore))) continue;
    const score = Number(rawScore);
    const key = name.toLocaleLowerCase("en");
    const previous = players.get(key);
    if (!previous || score > previous.score) players.set(key, { name, score });
  }
  return [...players.values()]
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "en"))
    .slice(0, 10);
}

export async function handler(event) {
  const respond = (statusCode, body) => ({
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": statusCode === 200 ? "public, max-age=30" : "no-store",
    },
    body: JSON.stringify(body),
  });
  if (event.httpMethod !== "GET") return respond(405, { error: "Method not allowed" });
  const token = process.env.QUIZ_NETLIFY_API_TOKEN;
  const formId = process.env.QUIZ_NETLIFY_FORM_ID;
  if (!token || !formId) return respond(503, { error: "Leaderboard unavailable" });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const submissions = [];
    for (let page = 1; ; page++) {
      const response = await fetch(
        `https://api.netlify.com/api/v1/forms/${encodeURIComponent(formId)}/submissions?per_page=100&page=${page}`,
        { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }
      );
      if (!response.ok) throw new Error("Could not read scores");
      const batch = await response.json();
      if (!Array.isArray(batch)) throw new Error("Invalid scores response");
      submissions.push(...batch);
      if (batch.length < 100) break;
    }
    return respond(200, { players: rankPlayers(submissions) });
  } catch {
    return respond(503, { error: "Leaderboard unavailable" });
  } finally {
    clearTimeout(timeout);
  }
}
