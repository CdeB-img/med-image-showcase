#!/usr/bin/env python3
"""
Track Google rankings over time for a target domain.

Data source:
- Google Custom Search JSON API (official API).

Required environment variables:
- GOOGLE_API_KEY
- GOOGLE_CSE_ID

Outputs:
- CSV history (append mode)
- Markdown snapshot report
- PNG trend chart (optional, requires matplotlib)
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import sys
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, Optional
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen


GOOGLE_CSE_ENDPOINT = "https://www.googleapis.com/customsearch/v1"


@dataclass(frozen=True)
class RankRow:
  run_at_utc: str
  query: str
  rank: Optional[int]
  found: bool
  matched_url: str
  scanned_results: int
  hl: str
  gl: str
  max_results: int


def parse_args() -> argparse.Namespace:
  parser = argparse.ArgumentParser(
    description="Track ranking positions for a domain across search queries."
  )
  parser.add_argument(
    "--domain",
    required=True,
    help="Target domain to track (example: noxia-imagerie.fr)",
  )
  parser.add_argument(
    "--queries-file",
    default="scripts/seo_queries.txt",
    help="Text file with one query per line (# comments supported).",
  )
  parser.add_argument(
    "--history-csv",
    default="data/seo/rank_history.csv",
    help="CSV file where measurements are appended.",
  )
  parser.add_argument(
    "--report-md",
    default="data/seo/latest_report.md",
    help="Markdown report path for latest snapshot.",
  )
  parser.add_argument(
    "--chart-png",
    default="data/seo/rank_trend.png",
    help="PNG chart output path (requires matplotlib).",
  )
  parser.add_argument(
    "--hl",
    default="fr",
    help="UI language hint for search results (default: fr).",
  )
  parser.add_argument(
    "--gl",
    default="fr",
    help="Country code hint for search results (default: fr).",
  )
  parser.add_argument(
    "--max-results",
    type=int,
    default=50,
    choices=(10, 20, 30, 40, 50, 60, 70, 80, 90, 100),
    help="How many top results to scan per query (10..100 step 10).",
  )
  return parser.parse_args()


def load_queries(path: Path) -> list[str]:
  if not path.exists():
    raise FileNotFoundError(f"Queries file not found: {path}")
  queries: list[str] = []
  for raw in path.read_text(encoding="utf-8").splitlines():
    line = raw.strip()
    if not line or line.startswith("#"):
      continue
    queries.append(line)
  if not queries:
    raise ValueError(f"No query found in {path}")
  return queries


def is_domain_match(url: str, domain: str) -> bool:
  try:
    hostname = (urlparse(url).hostname or "").lower().strip(".")
  except ValueError:
    return False
  target = domain.lower().strip(".")
  return hostname == target or hostname.endswith(f".{target}")


def google_cse_request(
  api_key: str,
  cse_id: str,
  query: str,
  start: int,
  hl: str,
  gl: str,
) -> dict:
  params = {
    "key": api_key,
    "cx": cse_id,
    "q": query,
    "num": 10,
    "start": start,
    "hl": hl,
    "gl": gl,
  }
  url = f"{GOOGLE_CSE_ENDPOINT}?{urlencode(params)}"
  request = Request(
    url,
    headers={
      "User-Agent": "Mozilla/5.0 (compatible; rank-tracker/1.0)",
      "Accept": "application/json",
    },
  )
  try:
    with urlopen(request, timeout=20) as response:
      body = response.read().decode("utf-8")
      return json.loads(body)
  except HTTPError as exc:
    detail = exc.read().decode("utf-8", errors="ignore")
    raise RuntimeError(f"HTTP {exc.code} from Google API: {detail}") from exc
  except URLError as exc:
    raise RuntimeError(f"Network error while calling Google API: {exc}") from exc


def lookup_rank(
  api_key: str,
  cse_id: str,
  query: str,
  domain: str,
  hl: str,
  gl: str,
  max_results: int,
) -> tuple[Optional[int], str, int]:
  scanned = 0
  for start in range(1, max_results + 1, 10):
    payload = google_cse_request(
      api_key=api_key,
      cse_id=cse_id,
      query=query,
      start=start,
      hl=hl,
      gl=gl,
    )
    items = payload.get("items", [])
    if not items:
      break
    for offset, item in enumerate(items):
      rank = start + offset
      link = item.get("link", "")
      if is_domain_match(link, domain):
        return rank, link, scanned + len(items)
    scanned += len(items)
    queries = payload.get("queries", {})
    if not queries.get("nextPage"):
      break
  return None, "", scanned


def append_history(history_csv: Path, rows: Iterable[RankRow]) -> None:
  history_csv.parent.mkdir(parents=True, exist_ok=True)
  exists = history_csv.exists()
  with history_csv.open("a", encoding="utf-8", newline="") as f:
    writer = csv.writer(f)
    if not exists:
      writer.writerow(
        [
          "run_at_utc",
          "query",
          "rank",
          "found",
          "matched_url",
          "scanned_results",
          "hl",
          "gl",
          "max_results",
        ]
      )
    for row in rows:
      writer.writerow(
        [
          row.run_at_utc,
          row.query,
          "" if row.rank is None else row.rank,
          1 if row.found else 0,
          row.matched_url,
          row.scanned_results,
          row.hl,
          row.gl,
          row.max_results,
        ]
      )


def read_history(history_csv: Path) -> list[RankRow]:
  if not history_csv.exists():
    return []
  rows: list[RankRow] = []
  with history_csv.open("r", encoding="utf-8", newline="") as f:
    reader = csv.DictReader(f)
    for row in reader:
      rank_raw = (row.get("rank") or "").strip()
      rows.append(
        RankRow(
          run_at_utc=row["run_at_utc"],
          query=row["query"],
          rank=int(rank_raw) if rank_raw else None,
          found=(row.get("found", "0") == "1"),
          matched_url=row.get("matched_url", ""),
          scanned_results=int(row.get("scanned_results", "0")),
          hl=row.get("hl", ""),
          gl=row.get("gl", ""),
          max_results=int(row.get("max_results", "0") or "0"),
        )
      )
  return rows


def format_rank(rank: Optional[int], max_results: int) -> str:
  return str(rank) if rank is not None else f">{max_results}"


def rank_value_for_delta(rank: Optional[int], max_results: int) -> int:
  return rank if rank is not None else max_results + 1


def build_markdown_report(history: list[RankRow], max_results: int, domain: str) -> str:
  if not history:
    return "# Rank report\n\nNo data yet.\n"

  by_query: dict[str, list[RankRow]] = defaultdict(list)
  for row in history:
    by_query[row.query].append(row)
  for query in by_query:
    by_query[query].sort(key=lambda r: r.run_at_utc)

  generated = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%SZ")
  lines = [
    "# Google ranking report",
    "",
    f"- Generated (UTC): `{generated}`",
    f"- Domain: `{domain}`",
    f"- Not found policy: displayed as `>{max_results}`",
    "",
    "| Query | Current rank | Previous rank | Trend | URL |",
    "|---|---:|---:|---:|---|",
  ]

  for query in sorted(by_query):
    runs = by_query[query]
    current = runs[-1]
    previous = runs[-2] if len(runs) > 1 else None

    current_value = rank_value_for_delta(current.rank, max_results)
    previous_value = (
      rank_value_for_delta(previous.rank, max_results) if previous else None
    )
    if previous_value is None:
      trend = "n/a"
    else:
      delta = previous_value - current_value
      if delta > 0:
        trend = f"+{delta}"
      elif delta < 0:
        trend = str(delta)
      else:
        trend = "0"

    current_rank = format_rank(current.rank, max_results)
    previous_rank = format_rank(previous.rank, max_results) if previous else "n/a"
    url = current.matched_url if current.matched_url else "-"
    lines.append(f"| {query} | {current_rank} | {previous_rank} | {trend} | {url} |")

  lines.append("")
  lines.append("Trend meaning: positive value means better ranking (closer to 1).")
  lines.append("")
  return "\n".join(lines)


def write_text(path: Path, content: str) -> None:
  path.parent.mkdir(parents=True, exist_ok=True)
  path.write_text(content, encoding="utf-8")


def plot_trends(history: list[RankRow], max_results: int, chart_png: Path) -> str:
  try:
    import matplotlib.pyplot as plt
  except Exception:
    return "skipped (matplotlib not installed)"

  by_query: dict[str, list[RankRow]] = defaultdict(list)
  for row in history:
    by_query[row.query].append(row)
  for query in by_query:
    by_query[query].sort(key=lambda r: r.run_at_utc)

  chart_png.parent.mkdir(parents=True, exist_ok=True)
  fig, ax = plt.subplots(figsize=(12, 6))
  y_not_found = max_results + 1

  for query in sorted(by_query):
    series = by_query[query]
    x_values = [datetime.fromisoformat(item.run_at_utc.replace("Z", "+00:00")) for item in series]
    y_values = [item.rank if item.rank is not None else y_not_found for item in series]
    ax.plot(x_values, y_values, marker="o", linewidth=1.8, label=query)

  ax.invert_yaxis()
  ax.set_title("Google ranking trend (lower is better)")
  ax.set_xlabel("Run date")
  ax.set_ylabel("Rank")
  ticks = [1, 3, 5, 10, 20, 30, 50, y_not_found]
  ticks = sorted({value for value in ticks if value <= y_not_found})
  labels = [str(value) if value != y_not_found else f">{max_results}" for value in ticks]
  ax.set_yticks(ticks)
  ax.set_yticklabels(labels)
  ax.grid(alpha=0.25, linestyle="--")
  ax.legend(loc="best", fontsize=8)
  fig.tight_layout()
  fig.savefig(chart_png, dpi=160)
  plt.close(fig)
  return "ok"


def main() -> int:
  args = parse_args()

  api_key = os.getenv("GOOGLE_API_KEY", "").strip()
  cse_id = os.getenv("GOOGLE_CSE_ID", "").strip()
  if not api_key or not cse_id:
    print(
      "Missing credentials. Set GOOGLE_API_KEY and GOOGLE_CSE_ID before running.",
      file=sys.stderr,
    )
    return 2

  queries = load_queries(Path(args.queries_file))
  run_at_utc = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
  rows: list[RankRow] = []

  print(f"Tracking {len(queries)} queries for domain: {args.domain}")
  for index, query in enumerate(queries, start=1):
    rank, matched_url, scanned = lookup_rank(
      api_key=api_key,
      cse_id=cse_id,
      query=query,
      domain=args.domain,
      hl=args.hl,
      gl=args.gl,
      max_results=args.max_results,
    )
    found = rank is not None
    rows.append(
      RankRow(
        run_at_utc=run_at_utc,
        query=query,
        rank=rank,
        found=found,
        matched_url=matched_url,
        scanned_results=scanned,
        hl=args.hl,
        gl=args.gl,
        max_results=args.max_results,
      )
    )
    printable_rank = rank if rank is not None else f">{args.max_results}"
    print(f"[{index}/{len(queries)}] {query} -> {printable_rank}")

  history_csv = Path(args.history_csv)
  append_history(history_csv, rows)
  history = read_history(history_csv)

  report_md = Path(args.report_md)
  report = build_markdown_report(history, args.max_results, args.domain)
  write_text(report_md, report)

  chart_png = Path(args.chart_png)
  chart_status = plot_trends(history, args.max_results, chart_png)

  print("")
  print(f"History saved: {history_csv}")
  print(f"Report saved:  {report_md}")
  if chart_status == "ok":
    print(f"Chart saved:   {chart_png}")
  else:
    print(f"Chart:         {chart_status}")
  return 0


if __name__ == "__main__":
  raise SystemExit(main())
