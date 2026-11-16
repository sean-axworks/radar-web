"""Conservative won normalization shared by incoming grants and local backfill.

Only budget_text is evidence: do not mine fees or arbitrary summary numbers.
Existing explicit numeric amounts and all contribution ratios are preserved.
"""
import re
from decimal import Decimal

_NUMBER = r"[0-9]+(?:,[0-9]{3})*(?:\.[0-9]+)?"
_UNIT = r"억|천만|백만|십만|만|천|백"
_PART = rf"{_NUMBER}\s*(?:{_UNIT})?"
_AMOUNT = rf"{_PART}(?:\s*{_PART})*\s*원"
# A range may omit 원 and/or the scale on the lower endpoint.
_RANGE = rf"{_NUMBER}\s*(?:{_UNIT})?\s*원?\s*(?:에서|부터|~|～|–|—|-)\s*"
_MONEY = re.compile(rf"(?<![\d.,])(?:{_RANGE})?{_AMOUNT}")
_SCALE = {"억": 100_000_000, "천만": 10_000_000, "백만": 1_000_000,
          "십만": 100_000, "만": 10_000, "천": 1_000, "백": 100, "": 1}
_RECIPIENT = re.compile(r"(?:기업|과제|기관|개소|팀|업체|시설)(?:당|별)\s*(?:연\s*)?(?:지원금?\s*)?(?:최대\s*|약\s*|총\s*)?$")
_SUPPORT = re.compile(r"(?:정부\s*지원금|지원금|국비|연구비|연구개발비|사업화\s*자금|지원\s*자금)\s*(?:최대\s*|약\s*|총\s*|상한\s*[:：]?\s*)?$")
_EXCLUDED = re.compile(r"임대료|입주부담금|보증금|관리비|수강료|참가비|교육비|상품권|쿠폰|경품")


def won_amount(text):
    """Return an exact integer won amount (range upper endpoint), or None."""
    endpoint = re.split(r"에서|부터|~|～|–|—|-", text)[-1].strip()
    if not re.fullmatch(_AMOUNT, endpoint):
        return None
    total = Decimal(0)
    for number, unit in re.findall(rf"({_NUMBER})\s*({_UNIT})?", endpoint[:-1]):
        total += Decimal(number.replace(",", "")) * _SCALE[unit]
    return int(total) if total == total.to_integral_value() and 0 < total < 2**53 else None


def extract_grant_amount(text):
    """Prefer an explicit recipient ceiling; never divide an overall allocation."""
    if not isinstance(text, str) or re.search(r"지원내용\s*없음", text):
        return None
    multiple_recipients = any(int(m.group(1)) > 1 for m in re.finditer(
        r"(\d+)\s*개?\s*(?:교육기관|기관|개소|기업|업체|팀|사)(?!당)", text))
    candidates = []
    for match in _MONEY.finditer(text):
        # Scope negative labels to the same clause, including labels after money.
        start = max(text.rfind(";", 0, match.start()), text.rfind(":", 0, match.start()),
                    text.rfind(", ", 0, match.start())) + 1
        ends = [p for token in (";", ":", ", ") if (p := text.find(token, match.end())) >= 0]
        end = min(ends, default=len(text))
        clause = text[start:end]
        if _EXCLUDED.search(clause):
            continue
        prefix = text[start:match.start()].strip()
        suffix = text[match.end():end]
        value = won_amount(match.group())
        if value is None:
            continue
        if _RECIPIENT.search(prefix):
            candidates.append((3, value))
        elif multiple_recipients and (re.search(r"총(?!괄)", prefix)
                                      or re.search(r"국비", prefix)):
            # Overall funding for multiple recipients is never a per-recipient ceiling.
            continue
        elif _SUPPORT.search(prefix):
            # "국비 총 ..." alone is an allocation, not a recipient ceiling.
            if re.search(r"총\s*$", prefix) and not re.search(r"1\s*개\s*(?:기관|소).*선정", text):
                continue
            candidates.append((2, value))
        elif re.fullmatch(r"(?:총\s*|최대\s*|약\s*)*", prefix) and re.match(r"\s*상당\s*현물\s*지원", suffix):
            candidates.append((2, value))
        elif re.search(r"사업예산\s*(?:약\s*)?$", prefix) and re.search(r"1\s*개\s*(?:교육)?기관\s*선정", text):
            candidates.append((1, value))
    if not candidates:
        return None
    priority = max(p for p, _ in candidates)
    values = {value for p, value in candidates if p == priority}
    return values.pop() if len(values) == 1 else None


def normalize_grant(row):
    if row.get("max_grant_amount") is not None:
        return row
    value = extract_grant_amount(row.get("budget_text"))
    return {**row, "max_grant_amount": value} if value is not None else row
