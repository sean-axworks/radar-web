"""Backfill missing grant ceilings under the same writer lock as bot sync.

Run from the radar-web root: python -B tools/normalize_grants.py
No Git commit, push, or remote calls are performed.
"""
import json
import sqlite3
from contextlib import closing
from pathlib import Path

from grant_amounts import normalize_grant
from grant_ratios import normalize_ratios
from sync_notices import atomic_write, git, read_rows


def main():
    if git('rev-parse', '--show-prefix'):
        raise ValueError('Run from radar-web root')
    queue = Path(git('rev-parse', '--absolute-git-dir')) / 'radar-notices.sqlite3'
    with closing(sqlite3.connect(queue, timeout=1)) as connection:
        connection.execute('BEGIN IMMEDIATE')
        path = Path('data/grants.json')
        rows = read_rows(path.read_text(encoding='utf-8'))
        normalized = [normalize_ratios(normalize_grant(row)) for row in rows]
        changed = [{'id': b['id'], 'amount': b['max_grant_amount'], 'gov_ratio': b['gov_ratio'], 'cash_ratio': b['cash_ratio']} for a,b in zip(rows,normalized) if a != b]
        if changed:
            atomic_write(path, (json.dumps(normalized,ensure_ascii=False,indent=2)+'\n').encode('utf-8'))
        connection.rollback()
    print(json.dumps({'total':len(rows),'before':sum(r.get('max_grant_amount') is not None for r in rows),
                      'after':sum(r.get('max_grant_amount') is not None for r in normalized),
                      'ratios_before': {k:sum(r.get(k) is not None for r in rows) for k in ('gov_ratio','cash_ratio')},
                      'ratios_after': {k:sum(r.get(k) is not None for r in normalized) for k in ('gov_ratio','cash_ratio')},'changed':changed},ensure_ascii=False))


if __name__ == '__main__':
    main()
