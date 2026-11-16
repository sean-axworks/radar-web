import unittest
from tools.grant_amounts import extract_grant_amount, normalize_grant, won_amount

class GrantAmountTest(unittest.TestCase):
    def test_won_units_ranges_and_exactness(self):
        for text, value in [('1.5억 원',150000000),('2천만 원',20000000),('3백만 원',3000000),('5,000만 원',50000000),('1,234원',1234),('1억 5천만 원',150000000),('1.5억에서 2억 원',200000000),('1~2억 원',200000000)]:
            with self.subTest(text=text): self.assertEqual(won_amount(text),value)
        for text in ('0원','0.1원','9007199254740992원'):
            self.assertIsNone(won_amount(text))

    def test_support_and_priority(self):
        cases=[('총 5,000만 원 상당 현물 지원: 게임 제작 3,000만 원, 라이선스·홍보 2,000만 원',50000000),('총 6억 원 이내, 4개 기관에 기관당 1.5억 원 이내',150000000),('연구비 5,000만 원(조정 가능)',50000000),('2개사 내외 모집, 선택형 사업화 자금 최대 500만 원',5000000),('총 25억원, 총 2개소에 개소당 연 최대 12.5억원 지원',1250000000),('과제당 총 2천만 원 내외, 공급기업이 100% 사용',20000000),('1개 교육기관 선정, 사업예산 약 1.5억~2억 원 예상',200000000),('기업당 1.5억에서 2억 원 이내',200000000),('지원금 최대 100만원 내외',1000000)]
        for text,value in cases:
            with self.subTest(text=text): self.assertEqual(extract_grant_amount(text),value)

    def test_rejects_costs_gifts_totals_and_ambiguity(self):
        for text in ['지원내용 없음','수료 시 200만 원 상당 사이트 제작 쿠폰 지급','월 임대료 65,410~174,880원','입주부담금 481,800원; 보증금 200만 원','참석자 상품권 5만원 지원','국비 총 21억 원 내외, 7개 분야별 차등 지원','총 6억원, 4개 기관 선정','총사업비 150억원','기업당 1억원 또는 기관당 2억원','총 지원금 6억 원, 4개 기관 선정','총 연구비 6억 원, 4개 기관 선정','국비 최대 21억 원, 7개 기관 지원','총 6억원 상당 현물 지원, 4개 기관 선정','총 정부지원금 6억 원, 4개 기관 선정','총 연구개발비 6억 원, 4개 기관 선정','총 사업화 자금 6억 원, 4개 기관 선정']:
            with self.subTest(text=text): self.assertIsNone(extract_grant_amount(text))
        self.assertEqual(extract_grant_amount('임대료 20만원; 사업화 자금 최대 500만원'),5000000)

    def test_preserves_existing_amount_and_ratios(self):
        row={'max_grant_amount':75,'gov_ratio':0.5,'cash_ratio':1,'budget_text':'연구비 500만원'}
        self.assertEqual(normalize_grant(row),row)
        empty={**row,'max_grant_amount':None}
        self.assertEqual(normalize_grant(empty),{**empty,'max_grant_amount':5000000})
        self.assertIsNone(empty['max_grant_amount'])

    def test_published_acceptance_cases_and_exclusions(self):
        import json
        from pathlib import Path
        rows = {r["id"]: r for r in json.loads((Path(__file__).resolve().parents[1] / "data/grants.json").read_text(encoding="utf-8"))}
        expected = {"k-startup-179682":50000000,"khidi-48949841":150000000,"iris-024799":50000000,"k-startup-179714":5000000,"khidi-48951946":1250000000}
        for identifier,value in expected.items():
            with self.subTest(id=identifier):
                self.assertEqual(extract_grant_amount(rows[identifier]["budget_text"]),value)
                self.assertEqual(rows[identifier]["max_grant_amount"],value)
        for identifier in ["k-startup-179728","k-startup-179702","k-startup-179696","k-startup-179704","k-startup-179710","k-startup-179740","k-startup-179786","k-startup-179763","iris-024657"]:
            with self.subTest(id=identifier):
                self.assertIsNone(extract_grant_amount(rows[identifier]["budget_text"]))
                self.assertIsNone(rows[identifier]["max_grant_amount"])
