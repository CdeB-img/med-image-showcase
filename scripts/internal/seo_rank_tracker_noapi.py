#!/usr/bin/env python3
"""
No-key SEO rank tracker (Google/Bing HTML parsing).

This script does not require API keys.
It is best-effort and can be rate-limited by search engines.
"""

from __future__ import annotations

import argparse
import csv
import os
import re
import sys
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from typing import Iterable, Optional
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, quote_plus, urlparse
from urllib.request import Request, urlopen


GOOGLE_SEARCH_URL = "https://www.google.com/search"
BING_SEARCH_URL = "https://www.bing.com/search"
VALID_STATUSES = {"found", "not_found", "invalid_no_links", "error"}


@dataclass(frozen=True)
class RankRow:
  run_at_utc: str
  query: str
  rank: Optional[int]
  found: bool
  matched_url: str
  scanned_results: int
  status: str
  hl: str
  gl: str
  max_results: int
  engine: str


def safe_int(value: object, default: int = 0) -> int:
  try:
    text = str(value).strip()
    if not text:
      return default
    return int(text)
  except (TypeError, ValueError):
    return default


class AnchorExtractor(HTMLParser):
  def __init__(self) -> None:
    super().__init__()
    self.hrefs: list[str] = []

  def handle_starttag(self, tag: str, attrs: list[tuple[str, Optional[str]]]) -> None:
    if tag.lower() != "a":
      return
    for key, value in attrs:
      if key == "href" and value:
        self.hrefs.append(value)
        break


def parse_args() -> argparse.Namespace:
  parser = argparse.ArgumentParser(
    description="Track ranking positions without API keys (HTML scraping)."
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
    help="UI language hint (default: fr).",
  )
  parser.add_argument(
    "--gl",
    default="fr",
    help="Country code hint (default: fr).",
  )
  parser.add_argument(
    "--max-results",
    type=int,
    default=50,
    choices=(10, 20, 30, 40, 50),
    help="How many top results to scan (10..50 step 10).",
  )
  parser.add_argument(
    "--engine",
    default="google",
    choices=("google", "bing"),
    help="Search engine backend (default: google).",
  )
  parser.add_argument(
    "--no-chart",
    action="store_true",
    help="Disable PNG chart generation.",
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


def fetch_html(url: str) -> str:
  request = Request(
    url,
    headers={
      "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
      ),
      "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
    },
  )
  try:
    with urlopen(request, timeout=20) as response:
      return response.read().decode("utf-8", errors="ignore")
  except HTTPError as exc:
    detail = exc.read().decode("utf-8", errors="ignore")
    raise RuntimeError(f"HTTP {exc.code}: {detail[:350]}") from exc
  except URLError as exc:
    raise RuntimeError(f"Network error: {exc}") from exc


def extract_google_result_links(html: str) -> list[str]:
  # Basic anti-bot / consent detection
  lower = html.lower()
  if "consent.google.com" in lower or "unusual traffic" in lower:
    return []

  parser = AnchorExtractor()
  parser.feed(html)
  links: list[str] = []
  seen: set[str] = set()

  for href in parser.hrefs:
    if href.startswith("/url?"):
      parsed = urlparse(href)
      target = parse_qs(parsed.query).get("q", [""])[0]
      if not target:
        continue
      link = target
    elif href.startswith("http://") or href.startswith("https://"):
      link = href
    else:
      continue

    host = (urlparse(link).hostname or "").lower()
    if not host:
      continue
    # Keep only potential organic external links.
    if host.endswith("google.com") or host.endswith("google.fr") or host.endswith("gstatic.com"):
      continue
    if link in seen:
      continue
    seen.add(link)
    links.append(link)
  return links


def extract_bing_result_links(html: str) -> list[str]:
  # Extract links from organic result blocks.
  pattern = re.compile(r'<li class="b_algo".*?<h2><a href="(https?://[^"]+)"', re.S | re.I)
  links = pattern.findall(html)
  unique: list[str] = []
  seen: set[str] = set()
  for link in links:
    if link in seen:
      continue
    seen.add(link)
    unique.append(link)
  return unique


def fetch_links_for_page(query: str, start_zero_based: int, hl: str, gl: str, engine: str) -> list[str]:
  if engine == "google":
    url = (
      f"{GOOGLE_SEARCH_URL}?q={quote_plus(query)}"
      f"&hl={quote_plus(hl)}&gl={quote_plus(gl)}&num=10&start={start_zero_based}"
      "&pws=0&safe=off"
    )
    html = fetch_html(url)
    return extract_google_result_links(html)

  first = start_zero_based + 1
  url = (
    f"{BING_SEARCH_URL}?q={quote_plus(query)}"
    f"&setlang={quote_plus(hl)}&cc={quote_plus(gl)}&count=10&first={first}"
  )
  html = fetch_html(url)
  return extract_bing_result_links(html)


def lookup_rank(
  query: str,
  domain: str,
  hl: str,
  gl: str,
  max_results: int,
  engine: str,
) -> tuple[Optional[int], str, int]:
  scanned = 0
  for start_zero_based in range(0, max_results, 10):
    links = fetch_links_for_page(
      query=query,
      start_zero_based=start_zero_based,
      hl=hl,
      gl=gl,
      engine=engine,
    )
    if not links:
      break
    for offset, link in enumerate(links):
      rank = start_zero_based + offset + 1
      if rank > max_results:
        break
      if is_domain_match(link, domain):
        return rank, link, min(max_results, scanned + len(links))
    scanned += len(links)
    if scanned >= max_results:
      break
  return None, "", min(max_results, scanned)


def append_history(history_csv: Path, rows: Iterable[RankRow]) -> None:
  history_csv.parent.mkdir(parents=True, exist_ok=True)
  exists = history_csv.exists()

  # Migrate legacy header (without status column) to v2 format.
  if exists:
    with history_csv.open("r", encoding="utf-8", newline="") as f:
      first_line = f.readline().strip()
    if first_line and "status" not in [part.strip() for part in first_line.split(",")]:
      existing = read_history(history_csv)
      with history_csv.open("w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
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
            "engine",
            "status",
          ]
        )
        for item in existing:
          writer.writerow(
            [
              item.run_at_utc,
              item.query,
              "" if item.rank is None else item.rank,
              1 if item.found else 0,
              item.matched_url,
              item.scanned_results,
              item.hl,
              item.gl,
              item.max_results,
              item.engine,
              item.status,
            ]
          )
      exists = True

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
          "engine",
          "status",
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
          row.engine,
          row.status,
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
      scanned = safe_int(row.get("scanned_results", "0"), 0)
      found = (row.get("found", "0") == "1")

      raw_hl = str(row.get("hl", "") or "")
      raw_gl = str(row.get("gl", "") or "")
      raw_max = str(row.get("max_results", "") or "")
      raw_engine = str(row.get("engine", "") or "")
      extras = row.get(None) or []

      # Compatibility mode for accidentally shifted CSV rows:
      # hl=status, gl=hl, max_results=gl, engine=max_results, extra[0]=engine
      shifted = (
        raw_hl in VALID_STATUSES
        and not raw_max.isdigit()
        and raw_engine.isdigit()
      )
      if shifted:
        status = raw_hl
        hl = raw_gl
        gl = raw_max
        max_results = safe_int(raw_engine, 0)
        engine = str(extras[0]) if extras else "google"
      else:
        hl = raw_hl
        gl = raw_gl
        max_results = safe_int(raw_max, 0)
        engine = raw_engine if raw_engine else (str(extras[0]) if extras else "google")
        status = str(row.get("status", "") or "")
        if not status and extras:
          extra_last = str(extras[-1])
          if extra_last in VALID_STATUSES:
            status = extra_last

      if status not in VALID_STATUSES:
        if found:
          status = "found"
        elif scanned == 0:
          status = "invalid_no_links"
        else:
          status = "not_found"

      rows.append(
        RankRow(
          run_at_utc=row["run_at_utc"],
          query=row["query"],
          rank=safe_int(rank_raw, 0) if rank_raw else None,
          found=found,
          matched_url=row.get("matched_url", ""),
          scanned_results=scanned,
          status=status,
          hl=hl,
          gl=gl,
          max_results=max_results,
          engine=engine or "google",
        )
      )
  return rows


def format_rank(rank: Optional[int], max_results: int) -> str:
  return str(rank) if rank is not None else f">{max_results}"


def rank_value_for_delta(rank: Optional[int], max_results: int) -> int:
  return rank if rank is not None else max_results + 1


def build_markdown_report(
  history: list[RankRow],
  max_results: int,
  domain: str,
  engine: str,
) -> str:
  if not history:
    return "# Rank report\n\nNo data yet.\n"

  # Keep last engine run for report consistency.
  engine_history = [row for row in history if row.engine == engine]
  if not engine_history:
    engine_history = history

  by_query: dict[str, list[RankRow]] = defaultdict(list)
  for row in engine_history:
    by_query[row.query].append(row)
  for query in by_query:
    by_query[query].sort(key=lambda r: r.run_at_utc)

  generated = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%SZ")
  lines = [
    "# Ranking report",
    "",
    f"- Generated (UTC): `{generated}`",
    f"- Domain: `{domain}`",
    f"- Engine: `{engine}`",
    f"- Not found policy: displayed as `>{max_results}`",
    "- Valid run statuses: `found`, `not_found`",
    "- Invalid statuses: `invalid_no_links`, `error`",
    "",
    "| Query | Status | Current rank | Previous rank | Trend | URL |",
    "|---|---|---:|---:|---:|---|",
  ]

  invalid_count = 0

  for query in sorted(by_query):
    runs = by_query[query]
    current = runs[-1]
    previous = runs[-2] if len(runs) > 1 else None

    current_valid = current.status in {"found", "not_found"}
    previous_valid = previous is not None and previous.status in {"found", "not_found"}

    if current_valid and previous_valid:
      current_value = rank_value_for_delta(current.rank, max_results)
      previous_value = rank_value_for_delta(previous.rank, max_results)
      delta = previous_value - current_value
      if delta > 0:
        trend = f"+{delta}"
      elif delta < 0:
        trend = str(delta)
      else:
        trend = "0"
    else:
      trend = "n/a"

    if current.status in {"invalid_no_links", "error"}:
      invalid_count += 1

    current_rank = (
      format_rank(current.rank, max_results) if current_valid else "N/A"
    )
    previous_rank = (
      format_rank(previous.rank, max_results)
      if (previous and previous_valid)
      else "n/a"
    )
    url = current.matched_url if current.matched_url else "-"
    lines.append(
      f"| {query} | {current.status} | {current_rank} | {previous_rank} | {trend} | {url} |"
    )

  lines.append("")
  lines.append("Trend meaning: positive value means better ranking (closer to 1).")
  if invalid_count > 0:
    lines.append(
      f"Warning: {invalid_count} query(ies) are invalid for this run (no parsable results)."
    )
  lines.append("")
  return "\n".join(lines)


def write_text(path: Path, content: str) -> None:
  path.parent.mkdir(parents=True, exist_ok=True)
  path.write_text(content, encoding="utf-8")


def plot_trends(
  history: list[RankRow],
  max_results: int,
  chart_png: Path,
  engine: str,
) -> str:
  try:
    import matplotlib.pyplot as plt
  except Exception:
    return "skipped (matplotlib not installed)"

  engine_history = [row for row in history if row.engine == engine]
  if not engine_history:
    engine_history = history

  by_query: dict[str, list[RankRow]] = defaultdict(list)
  for row in engine_history:
    by_query[row.query].append(row)
  for query in by_query:
    by_query[query].sort(key=lambda r: r.run_at_utc)

  chart_png.parent.mkdir(parents=True, exist_ok=True)
  fig, ax = plt.subplots(figsize=(12, 6))
  y_not_found = max_results + 1

  for query in sorted(by_query):
    series = by_query[query]
    valid_series = [item for item in series if item.status in {"found", "not_found"}]
    if not valid_series:
      continue
    x_values = [datetime.fromisoformat(item.run_at_utc.replace("Z", "+00:00")) for item in valid_series]
    y_values = [item.rank if item.rank is not None else y_not_found for item in valid_series]
    ax.plot(x_values, y_values, marker="o", linewidth=1.8, label=query)

  if not ax.lines:
    plt.close(fig)
    return "skipped (no valid points)"

  ax.invert_yaxis()
  ax.set_title(f"Ranking trend ({engine})")
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
  queries = load_queries(Path(args.queries_file))
  run_at_utc = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
  rows: list[RankRow] = []

  print(
    f"Tracking {len(queries)} queries for domain '{args.domain}' "
    f"(engine={args.engine}, max_results={args.max_results})"
  )

  for index, query in enumerate(queries, start=1):
    status = "not_found"
    try:
      rank, matched_url, scanned = lookup_rank(
        query=query,
        domain=args.domain,
        hl=args.hl,
        gl=args.gl,
        max_results=args.max_results,
        engine=args.engine,
      )
    except Exception as exc:
      print(f"[{index}/{len(queries)}] {query} -> error: {exc}")
      rank, matched_url, scanned = None, "", 0
      status = "error"

    found = rank is not None
    if status != "error":
      if found:
        status = "found"
      elif scanned == 0:
        status = "invalid_no_links"
      else:
        status = "not_found"

    rows.append(
      RankRow(
        run_at_utc=run_at_utc,
        query=query,
        rank=rank,
        found=found,
        matched_url=matched_url,
        scanned_results=scanned,
        status=status,
        hl=args.hl,
        gl=args.gl,
        max_results=args.max_results,
        engine=args.engine,
      )
    )
    if status == "found":
      printable = str(rank)
    elif status == "not_found":
      printable = f">{args.max_results}"
    elif status == "invalid_no_links":
      printable = "N/A (invalid_no_links)"
    else:
      printable = f"N/A ({status})"
    print(f"[{index}/{len(queries)}] {query} -> {printable}")

  history_csv = Path(args.history_csv)
  append_history(history_csv, rows)
  history = read_history(history_csv)

  report_md = Path(args.report_md)
  report = build_markdown_report(history, args.max_results, args.domain, args.engine)
  write_text(report_md, report)

  chart_status = "disabled (--no-chart)"
  chart_png = Path(args.chart_png)
  if not args.no_chart:
    chart_status = plot_trends(history, args.max_results, chart_png, args.engine)

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
