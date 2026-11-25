import difflib
import re
from typing import Any, Sequence
from sqlalchemy import and_, func, or_


def tokenize_query(q: str) -> list[str]:
    return [w for w in re.split(r"\s+", q.strip()) if len(w) >= 1]


def build_trgm_filter(column: Any, q: str):
    cleaned = q.strip()
    words = tokenize_query(cleaned)
    if not words:
        return None

    token_clauses = [
        or_(
            column.ilike(f"%{w}%"),
            func.word_similarity(w, column) > 0.35,
        )
        for w in words
    ]

    all_tokens_match = and_(*token_clauses)
    whole_sim_match = func.similarity(column, cleaned) > 0.25

    return or_(all_tokens_match, whole_sim_match)


def python_difflib_rank(
    query: str,
    items: Sequence[Any],
    get_text: Any,
    limit: int = 10,
    cutoff: float = 0.25,
) -> list[Any]:
    q_norm = query.strip().lower()
    q_words = tokenize_query(q_norm)
    scored = []

    for item in items:
        text = get_text(item) or ""
        t_norm = text.lower()

        token_matches = 0
        for w in q_words:
            if w in t_norm:
                token_matches += 1
            else:
                t_words = tokenize_query(t_norm)
                close = difflib.get_close_matches(w, t_words, n=1, cutoff=0.55)
                if close:
                    token_matches += 1

        overall_ratio = difflib.SequenceMatcher(None, q_norm, t_norm).ratio()
        token_ratio = token_matches / len(q_words) if q_words else 0
        final_score = (token_ratio * 0.7) + (overall_ratio * 0.3)

        if token_matches == len(q_words) or final_score >= cutoff:
            scored.append((final_score, item))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [item for _, item in scored[:limit]]
