# T4H BAS Lodgement — Q1 & Q2 FY25-26

**Entity**: Tech 4 Humanity Pty Ltd  
**ABN**: 70 666 271 272  
**GST registered**: Yes (quarterly)  
**Generated**: 2026-04-21 07:10 UTC

## Q1 FY25-26 — Jul 1 to Sep 30, 2025 (due 28 Oct 2025 — 6 months overdue)

| Label | Description | Amount |
|---|---|---|
| G1 | Total sales (incl GST) | $0.00 |
| G2 | Export sales | $0.00 |
| G3 | Other GST-free sales | $20,697.11 |
| G10 | Capital purchases | $0.00 |
| G11 | Non-capital purchases (incl GST) | $5,759.43 |
| G13 | Purchases for input-taxed supplies | $418.00 |
| G14 | Purchases without GST in price | $11,724.02 |
| W1 | Total salary, wages and other payments | $0.00 |
| W2 | Amount withheld from W1 | $0.00 |
| **1A** | **GST on sales** | **$0.00** |
| **1B** | **GST on purchases** | **$523.56** |
| **Net** | **Refund from ATO** | **$523.56** |

Transactions: 245 (100% classified, 3.3% locked)

## Q2 FY25-26 — Oct 1 to Dec 31, 2025 (due 28 Feb 2026 — 2 months overdue)

| Label | Description | Amount |
|---|---|---|
| G1 | Total sales (incl GST) | $0.00 |
| G2 | Export sales | $0.00 |
| G3 | Other GST-free sales | $9,667.81 |
| G10 | Capital purchases | $0.00 |
| G11 | Non-capital purchases (incl GST) | $3,403.33 |
| G13 | Purchases for input-taxed supplies | $0.00 |
| G14 | Purchases without GST in price | $19,157.10 |
| W1 | Total salary, wages and other payments | $0.00 |
| W2 | Amount withheld from W1 | $0.00 |
| **1A** | **GST on sales** | **$0.00** |
| **1B** | **GST on purchases** | **$309.39** |
| **Net** | **Refund from ATO** | **$309.39** |

Transactions: 272 (100% classified, 4.0% locked)

## Combined

**Total refund due from ATO across Q1+Q2 FY25-26: $832.95**

## Confirm before lodging

1. **G1 = $0 both quarters**. No GST was collected from sales. This is consistent with T4H being R&D-heavy on grants/refunds, but confirm none of the 263 G3 items (Q1 144 + Q2 119) should actually be G1 sales with GST.
2. **W1 = $0 both quarters** for T4H. Historical T4H W1 = $248,975 across 163 txns, so the company has paid wages before. Confirm no director wages were paid by T4H in Jul–Dec 2025. The $24,049 W1 seen at aggregate Q1 level was actually personal entity.
3. **W2 (PAYGW) = $0 ever** in T4H MAAT data. Either no obligations or data gap.
4. **No PAYGI (5A) figures** available from MAAT. Tax agent may need to provide.
5. Only 19 of 517 txns are locked. Review + lock convention not followed — unlocked does not prevent lodgement but flag for cleanup.

## Known infrastructure defect

`v_maat_api_bas_export` view has the **wrong ABN** hardcoded (`61 605 746 618`) and stops before FY25-26. Figures above come from direct `maat_transactions` query filtered by T4H `entity_id`. Fix the view separately; do not use it for lodgement in its current state.

## Evidence

Full line items in `T4H_BAS_Q1Q2_FY25-26_line_items.csv` (517 rows).