import { env } from "cloudflare:workers";

type ScoreRow = {
  id: number;
  player_name: string;
  score: number;
  fragments: number;
  grade: string;
  created_at: string;
};

export async function GET() {
  const result = await env.DB.prepare(
    `SELECT id, player_name, score, fragments, grade, created_at
     FROM signal_rush_scores
     ORDER BY score DESC, fragments DESC, created_at ASC
     LIMIT 20`,
  ).all<ScoreRow>();

  return Response.json({ entries: result.results ?? [] });
}

export async function POST(request: Request) {
  const body = await request.json() as Record<string, unknown>;
  const playerName = String(body.playerName ?? "").trim().replace(/\s+/g, " ");
  const score = Number(body.score);
  const fragments = Number(body.fragments);
  const grade = String(body.grade ?? "").trim();

  if (playerName.length < 2 || playerName.length > 12) {
    return Response.json({ error: "이름은 2~12자로 입력해 주세요." }, { status: 400 });
  }
  if (!Number.isInteger(score) || score < 0 || score > 100000 || !Number.isInteger(fragments) || fragments < 0 || fragments > 100) {
    return Response.json({ error: "점수 정보가 올바르지 않습니다." }, { status: 400 });
  }

  await env.DB.prepare(
    `INSERT INTO signal_rush_scores (player_name, score, fragments, grade)
     VALUES (?, ?, ?, ?)`,
  ).bind(playerName, score, fragments, grade.slice(0, 30)).run();

  return Response.json({ ok: true }, { status: 201 });
}
