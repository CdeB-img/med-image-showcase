#!/usr/bin/env python3
"""Generate the bounded, deterministic RC01 local-PDF section index.

This utility never downloads content and only reads local copies already
declared in the governed RC01 registry. The emitted excerpts are mechanical
normalizations of PDF text, not scientific assertions.
"""

from __future__ import annotations

import hashlib
import json
import re
import sys
import unicodedata
from pathlib import Path

from pypdf import PdfReader, __version__ as pypdf_version


ROOT = Path(__file__).resolve().parents[2]
CORPUS_ROOT = ROOT / "reference-corpus" / "reference-corpus-01"
REGISTRY_PATH = CORPUS_ROOT / "reference-corpus.json"
NEEDS_PATH = ROOT / "reference-corpus" / "owner-knowledge-coverage-01" / "owner-knowledge-needs.json"
COVERAGE_PATH = ROOT / "reference-corpus" / "owner-knowledge-coverage-01" / "owner-knowledge-coverage.json"
OUTPUT_PATH = Path(__file__).resolve().parent / "reference-document-index.json"
MAX_SECTION_CHARACTERS = 600
MAX_SECTIONS_PER_NEED_SOURCE = 3
STOP_WORDS = {
    "and", "the", "with", "from", "into", "owner", "knowledge", "source",
    "external", "study", "information", "support", "needed", "project",
}


def digest(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value.replace("\x00", " ")).strip()


def section_heading(raw_text: str, page_number: int) -> str:
    candidates = [normalize_text(line) for line in raw_text.splitlines()]
    candidates = [
        line
        for line in candidates
        if line
        and len(line) >= 3
        and not line.isdigit()
        and line.lower() != "contains nonbinding recommendations"
    ]
    return (candidates[0] if candidates else f"Page {page_number}")[:240]


def tokens(value: str) -> set[str]:
    normalized = unicodedata.normalize("NFKD", value.lower())
    ascii_text = "".join(character for character in normalized if not unicodedata.combining(character))
    return {
        token
        for token in re.split(r"[^a-z0-9]+", ascii_text)
        if len(token) >= 4 and token not in STOP_WORDS
    }


def main() -> None:
    registry = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    needs = json.loads(NEEDS_PATH.read_text(encoding="utf-8"))
    coverage = json.loads(COVERAGE_PATH.read_text(encoding="utf-8"))
    need_by_id = {need["NEED_ID"]: need for need in needs["NEEDS"]}
    source_by_id = {source["SOURCE_ID"]: source for source in registry["SOURCES"]}
    extracted_pages: dict[str, list[dict[str, object]]] = {}
    page_counts: dict[str, int] = {}
    indexed_sources = []
    for source in sorted(registry["SOURCES"], key=lambda item: item["SOURCE_ID"]):
        relative_path = source["LOCAL_COPY_PATH"]
        if not relative_path:
            continue
        if source["LOCAL_COPY_ALLOWED"] != "YES" or source["REDISTRIBUTION_ALLOWED"] != "YES":
            raise RuntimeError(f"SOURCE_CONTENT_INDEXING_NOT_AUTHORIZED:{source['SOURCE_ID']}")
        pdf_path = CORPUS_ROOT / relative_path
        binary_digest = hashlib.sha256(pdf_path.read_bytes()).hexdigest()
        if binary_digest != source["SHA256"]:
            raise RuntimeError(f"SOURCE_DIGEST_MISMATCH:{source['SOURCE_ID']}")
        reader = PdfReader(str(pdf_path))
        sections = []
        for page_number, page in enumerate(reader.pages, start=1):
            raw_text = page.extract_text() or ""
            normalized = normalize_text(raw_text)
            if not normalized:
                continue
            excerpt = normalized[:MAX_SECTION_CHARACTERS]
            sections.append(
                {
                    "SECTION_ID": f"{source['SOURCE_ID']}:page-{page_number}",
                    "PAGE": page_number,
                    "HEADING": section_heading(raw_text, page_number),
                    "NORMALIZED_TEXT_OFFSET_START": 0,
                    "NORMALIZED_TEXT_OFFSET_END": len(excerpt),
                    "EXACT_TEXT": excerpt,
                    "EXACT_CONTENT_SHA256": digest(excerpt),
                }
            )
        extracted_pages[source["SOURCE_ID"]] = sections
        page_counts[source["SOURCE_ID"]] = len(reader.pages)

    selected_section_ids: dict[str, set[str]] = {source_id: set() for source_id in extracted_pages}
    need_source_sections = []
    for coverage_row in sorted(coverage["COVERAGE"], key=lambda item: item["NEED_ID"]):
        need = need_by_id[coverage_row["NEED_ID"]]
        query_tokens = tokens(" ".join([
            need["NEED_CLASS"],
            need["OWNER_REASONING_MECHANIC"],
            need["EXTERNAL_KNOWLEDGE_NEEDED"],
            *coverage_row["SUPPORT_TYPES"],
        ]))
        mapped_source_ids = coverage_row["PRIMARY_SOURCE_IDS"] + coverage_row["SECONDARY_SOURCE_IDS"]
        for source_id in sorted(set(mapped_source_ids)):
            if source_id not in extracted_pages:
                continue
            scored = []
            for section in extracted_pages[source_id]:
                heading_tokens = tokens(str(section["HEADING"]))
                text_tokens = tokens(str(section["EXACT_TEXT"]))
                score = 5 * len(query_tokens & heading_tokens) + len(query_tokens & text_tokens)
                if score:
                    scored.append((score, int(section["PAGE"]), str(section["SECTION_ID"])))
            chosen = [
                section_id
                for _, _, section_id in sorted(scored, key=lambda item: (-item[0], item[1], item[2]))[:MAX_SECTIONS_PER_NEED_SOURCE]
            ]
            if not chosen:
                continue
            selected_section_ids[source_id].update(chosen)
            need_source_sections.append({
                "NEED_ID": coverage_row["NEED_ID"],
                "SOURCE_ID": source_id,
                "SECTION_IDS": chosen,
            })

    for source_id in sorted(extracted_pages):
        source = source_by_id[source_id]
        sections = [section for section in extracted_pages[source_id] if section["SECTION_ID"] in selected_section_ids[source_id]]
        indexed_sources.append({
            "SOURCE_ID": source_id,
            "DOCUMENT_VERSION": source["DOCUMENT_VERSION"],
            "SOURCE_SHA256": source["SHA256"],
            "PAGE_COUNT": page_counts[source_id],
            "INDEXED_SECTION_COUNT": len(sections),
            "SECTIONS": sections,
        })
    output = {
        "MISSION_ID": "REFERENCE-KNOWLEDGE-BRIDGE-01",
        "STATUS": "DETERMINISTIC_LOCAL_PDF_INDEX_NON_NORMATIVE",
        "SOURCE_REGISTRY_REF": "reference-corpus/reference-corpus-01/reference-corpus.json",
        "EXTRACTION_ENGINE": f"pypdf:{pypdf_version}",
        "NORMALIZATION": "NUL_TO_SPACE_WHITESPACE_COLLAPSE_TRIM",
        "MAX_SECTION_CHARACTERS": MAX_SECTION_CHARACTERS,
        "MAX_SECTIONS_PER_NEED_SOURCE": MAX_SECTIONS_PER_NEED_SOURCE,
        "SOURCES": indexed_sources,
        "NEED_SOURCE_SECTIONS": need_source_sections,
    }
    serialized = json.dumps(output, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    if "--check" in sys.argv:
        if not OUTPUT_PATH.exists() or OUTPUT_PATH.read_text(encoding="utf-8") != serialized:
            raise RuntimeError("REFERENCE_DOCUMENT_INDEX_DRIFT")
        return
    OUTPUT_PATH.write_text(serialized, encoding="utf-8")


if __name__ == "__main__":
    main()
