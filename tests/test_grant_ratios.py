import unittest
from tools.grant_ratios import extract_grant_ratios, normalize_ratios

class GrantRatioTest(unittest.TestCase):
    def test_explicit_support_and_cash_denominator(self):
        for text, expected in [
            ('정부지원 70%, 자부담 30%, 민간부담금 중 현금 10% 이상', (0.7,0.1)),
            ('자부담 30%', (0.7,None)),
            ('국비 50%·지방비 50%', (0.5,None)),
            ('자부담 없음', (1,0)),
            ('100% 현물 지원', (1,0)),
            ('국비와 같은 비율의 지방비 매칭 및 현금 50% 이상 매칭이 필수', (0.5,None)),
            ('지방비는 국비 대비 1:1 이상 매칭하며, 이 중 현금 50% 이상 매칭 필수', (0.5,0.5)),
        ]:
            with self.subTest(text=text): self.assertEqual(extract_grant_ratios(text), expected)

    def test_unrelated_and_ambiguous_percentages_stay_unknown(self):
        for text in ['인건비 비중 40%, 간접비 5%, 평가배점 30%', '공급기업이 100% 사용', '현물 지원', '참가비 무료', '정부지원 70% 또는 50%', '정부지원 120%', '총사업비 대비 현금 10% 이상', '전액 지원하지 않음', '자부담 없음은 아님']:
            with self.subTest(text=text): self.assertEqual(extract_grant_ratios(text), (None,None))

    def test_preserve_existing_values(self):
        row={'budget_text':'정부지원 70%, 민간부담금 중 현금 10% 이상','summary_3lines':[], 'max_grant_amount':42,'gov_ratio':0.5,'cash_ratio':1}
        self.assertEqual(normalize_ratios(row),row)
        self.assertEqual(normalize_ratios({**row,'gov_ratio':None})['gov_ratio'],0.7)

    def test_cash_denominator_is_not_support_ratio(self):
        self.assertEqual(extract_grant_ratios('민간부담금의 30% 이상 현금'), (None,0.3))

    def test_published_evidence_cases(self):
        import json
        from pathlib import Path
        rows={r['id']:r for r in json.loads((Path(__file__).resolve().parents[1]/'data/grants.json').read_text(encoding='utf-8'))}
        for identifier,expected in [('k-startup-179682',(1,0)),('khidi-48951946',(0.5,0.5)),('khidi-digital-medical-center',(0.5,1))]:
            with self.subTest(id=identifier):
                row=normalize_ratios(rows[identifier])
                self.assertEqual((row['gov_ratio'],row['cash_ratio']),expected)
        self.assertEqual(extract_grant_ratios('과제당 총 2천만 원 내외, 공급기업이 100% 사용'),(None,None))

    def test_negations_financing_conflicts_and_upper_cash_are_unknown(self):
        for text in ['자부담 없음이 아니라 별도협의','100% 현물지원은 불가','정부지원 70% 적용 안 함','자부담 30%, 지방비 20% 별도','정부지원 70%, 정부지원 120%']:
            with self.subTest(text=text): self.assertEqual(extract_grant_ratios(text),(None,None))
        self.assertEqual(extract_grant_ratios('민간부담금의 10%는 현금으로 납부'),(None,None))
        self.assertEqual(extract_grant_ratios('정부지원 70%, 민간부담금 중 현금 10% 이하'),(0.7,None))

    def test_reviewed_evidence_is_invalidated_by_changed_terms(self):
        import json
        from pathlib import Path
        rows=json.loads((Path(__file__).resolve().parents[1]/'data/grants.json').read_text(encoding='utf-8'))
        row=next(r for r in rows if r['id']=='khidi-48951946')
        changed={**row,'gov_ratio':None,'cash_ratio':None,'summary_3lines':[*row['summary_3lines'],'지방비 중 현금 80% 이상']}
        normalized=normalize_ratios(changed)
        self.assertEqual(normalized['cash_ratio'],0.8)
