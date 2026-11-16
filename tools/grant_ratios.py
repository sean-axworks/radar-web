"""Conservative fractions: support / total; cash / matching contribution.

Only explicit financing statements are accepted. Conflicting or conditional
percentages remain unknown. Reviewed public-notice evidence is scoped to its ID.
"""
import re
import hashlib

_PERCENT = r"([0-9]+(?:\.[0-9]+)?)\s*%"

# Exact notice-specific evidence reviewed in RW2-1116-RATIO. General inkind or
# free attendance must never imply that the whole project is fully financed.
REVIEWED = {
    "k-startup-179682": {
        "text_sha256": "355e25c6c7dea8a8cdb93cd536d51a9e1525d723f21b2cdddac7c64b8566dc01",
        "gov_ratio": 1.0, "cash_ratio": 0.0,
        "source_url": "https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do?schM=view&pbancSn=179682",
        "evidence": "총 5,000만 원 상당의 공간 맞춤형 방탈출 게임을 무상으로 제작해 드립니다. (자부담 없음: 사용자 확인)",
    },
    "khidi-48951946": {
        "text_sha256": "e11ae3ad5716917e1c97838a86a32d29981ef949bfabe8ba61077a38881f9f30",
        "gov_ratio": 0.5, "cash_ratio": 0.5,
        "evidence": "지방비는 국비 대비 1:1 이상 매칭하며, 이 중 현금 50% 이상 매칭 필수",
        "source_url": "https://www.khidi.or.kr/board/view?linkId=48951948&menuId=MENU01484",
    },
}


def _unique(values):
    values = {round(v, 10) for v in values if 0 <= v <= 1}
    return values.pop() if len(values) == 1 else None


def extract_grant_ratios(text):
    if not isinstance(text, str):
        return None, None
    if re.search(r"(?:전액\s*(?:현물\s*)?지원|100\s*%\s*현물\s*지원|자부담\s*없음).{0,12}(?:않|아님|아니|불가|안\s*함)", text):
        return None, None
    if re.search(r"(?:정부\s*지원|국비)[^.\n]*(?:적용\s*안\s*함|적용하지\s*않|미적용)", text):
        return None, None
    if re.search(r"자부담[^.\n]*지방비[^.\n]*별도", text):
        return None, None
    financing_rates = re.findall(rf"(?:정부\s*지원|국비|자부담|민간부담금)[^%\n]{{0,20}}?{_PERCENT}", text)
    if any(float(value) > 100 for value in financing_rates):
        return None, None
    # A choice/range/condition needs a recipient-specific decision, not a default.
    if re.search(r"%[^.\n]*(?:또는|~|부터)|(?:기업규모|기업유형|조건에)\s*따라", text):
        return None, None
    gov = [float(m[1])/100 for m in re.finditer(
        rf"(?:정부\s*지원(?:금|비율)?|국비)(?:는|가|의|\s*비율)?\s*(?:총사업비(?:의|\s*대비)\s*)?{_PERCENT}", text)]
    own = [1-float(m[1])/100 for m in re.finditer(
        rf"(?:자부담|자기부담|민간부담)(?:금|비율)?\s*(?:은|이)?\s*{_PERCENT}(?!\s*(?:이상\s*)?현금)", text)]
    cash = [float(m[1])/100 for m in re.finditer(
        rf"(?:민간부담금|자부담금|대응자금|지방비)(?:의|\s*중|\s*대비)\s*(?:최소\s*)?현금\s*{_PERCENT}(?!\s*(?:이하|미만))", text)]
    cash += [float(m[1])/100 for m in re.finditer(
        rf"(?:민간부담금|자부담금|대응자금|지방비)(?:의|\s*중|\s*대비)\s*{_PERCENT}\s*이상\s*(?:을\s*)?현금", text)]
    if re.search(r"지방비.{0,15}국비\s*대비\s*1\s*:\s*1|국비와\s*같은\s*비율의\s*지방비", text):
        gov.append(0.5)
        match = re.search(rf"지방비[^.\n]*국비\s*대비\s*1\s*:\s*1[^.\n]*이\s*중\s*현금\s*{_PERCENT}(?!\s*(?:이하|미만))", text)
        if match:
            cash.append(float(match[1])/100)
    if re.search(r"(?:자부담|자기부담|민간부담금)\s*(?:이\s*)?없(?:음|다)|100\s*%\s*현물\s*지원|전액\s*(?:현물\s*)?지원", text):
        gov.append(1.0)
        cash.append(0.0)
    return _unique(gov + own), _unique(cash)


def normalize_ratios(row):
    text = "\n".join([row.get("budget_text", ""), *row.get("summary_3lines", [])])
    government, cash = extract_grant_ratios(text)
    reviewed = REVIEWED.get(row.get("id"))
    if reviewed and hashlib.sha256(text.encode("utf-8")).hexdigest() == reviewed["text_sha256"]:
        government, cash = reviewed["gov_ratio"], reviewed["cash_ratio"]
    result = dict(row)
    for key, value in (("gov_ratio", government), ("cash_ratio", cash)):
        if result.get(key) is None and value is not None:
            result[key] = value
    return result
