#!/usr/bin/env python3
"""WZ/2026/APS001 — typografia i układ zsynchronizowane z pomiarem PDF
`wezwanie_WZ-2026-ANOW001_Nowak.pdf` (get_text: rozmiary, czcionki, kolory)."""

from __future__ import annotations

import os
import shutil
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

# Wypełnienie nagłówków tabel w oryginale: DeviceRGB (0.549, 0, 0) → #8c0000
HEADER_RED = HexColor("#8c0000")
# Szare linie / obramowania komórek: ~#c6c6c6
LINE_GRAY = HexColor("#c6c6c6")
# Stopka, kolor 6710886 = #666666
FOOT_COLOR = HexColor("#666666")
# Przemienne tło wierszy (blisko oryg. Word)
ROW_ALT = HexColor("#ececec")

F_ARIAL = "/System/Library/Fonts/Supplemental/Arial.ttf"
F_ARIAL_B = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
F_TNR = "/System/Library/Fonts/Supplemental/Times New Roman.ttf"
F_TNR_B = "/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf"

DOC_TOP = "27 kwietnia 2026"
FOOTER_DATE = "27 kwietnia 2026"
SYGN = "WZ/2026/APS001"
DUE_UNPAID = "25.07.2025"
DNI_UNPAID = 275
MAIN_350 = "350.00"
ODS_UNPAID = "41.53"
REK_1 = "170.92"
ODS_LATE = "10.80"
REK_19 = "3247.48"
TOTAL = "3820.73"
TERM_PAY = "30 kwietnia 2026"
DNI_PO = "3"

ROWS_LATE: list[tuple[str, str, str, str, str, str, str]] = [
    ("8/02/2022", "249.00", "16.02.2022", "17.02.2022", "1 dzień", "0.11", "170.92"),
    ("18/09/2022", "249.00", "19.09.2022", "20.09.2022", "1 dzień", "0.11", "170.92"),
    ("27/08/2022", "249.00", "19.08.2022", "25.08.2022", "6 dni", "0.64", "170.92"),
    ("17/12/2022", "349.00", "13.12.2022", "14.12.2022", "1 dzień", "0.15", "170.92"),
    ("5/03/2023", "450.00", "13.03.2023", "16.03.2023", "3 dni", "0.58", "170.92"),
    ("19/06/2023", "350.00", "19.06.2023", "21.06.2023", "2 dni", "0.30", "170.92"),
    ("17/07/2023", "350.00", "17.07.2023", "19.07.2023", "2 dni", "0.30", "170.92"),
    ("15/08/2023", "350.00", "15.08.2023", "17.08.2023", "2 dni", "0.30", "170.92"),
    ("16/09/2023", "350.00", "12.09.2023", "18.09.2023", "6 dni", "0.91", "170.92"),
    ("8/11/2023", "350.00", "13.11.2023", "17.11.2023", "4 dni", "0.60", "170.92"),
    ("14/03/2024", "350.00", "13.03.2024", "18.03.2024", "5 dni", "0.76", "170.92"),
    ("5/05/2024", "350.00", "14.05.2024", "15.05.2024", "1 dzień", "0.15", "170.92"),
    ("7/08/2024", "350.00", "16.08.2024", "19.08.2024", "3 dni", "0.45", "170.92"),
    ("15/09/2024", "350.00", "13.09.2024", "16.09.2024", "3 dni", "0.45", "170.92"),
    ("20/10/2024", "350.00", "14.10.2024", "21.10.2024", "7 dni", "1.06", "170.92"),
    ("19/12/2024", "350.00", "22.12.2024", "27.12.2024", "5 dni", "0.76", "170.92"),
    ("16/02/2025", "350.00", "13.02.2025", "20.02.2025", "7 dni", "1.06", "170.92"),
    ("16/03/2025", "350.00", "13.03.2025", "24.03.2025", "11 dni", "1.66", "170.92"),
    ("20/05/2025", "350.00", "13.06.2025", "16.06.2025", "3 dni", "0.45", "170.92"),
]


def _reg() -> tuple[str, str, str, str]:
    for p, name in [
        (F_ARIAL, "ArialDoc"),
        (F_ARIAL_B, "ArialBold"),
        (F_TNR, "TNR"),
        (F_TNR_B, "TNRB"),
    ]:
        if not os.path.isfile(p):
            raise SystemExit(f"Brak czcionki: {p}")
        pdfmetrics.registerFont(TTFont(name, p))
    return "ArialDoc", "ArialBold", "TNR", "TNRB"


def _st(base: str, b: str, tnr: str, tnrb: str) -> dict[str, ParagraphStyle]:
    s = getSampleStyleSheet()
    return {
        "lipsko": ParagraphStyle("l", parent=s["Normal"], fontName=base, fontSize=9.1, leading=11, alignment=TA_LEFT),
        "omega": ParagraphStyle("o", parent=s["Normal"], fontName=b, fontSize=10.1, leading=12, alignment=TA_RIGHT),
        "foot": ParagraphStyle("ft", parent=s["Normal"], fontName=base, fontSize=7, leading=8.4, textColor=FOOT_COLOR, alignment=TA_CENTER),
        "addr": ParagraphStyle("a", parent=s["Normal"], fontName=base, fontSize=9.1, leading=11, alignment=TA_LEFT),
        "sygn": ParagraphStyle("sy", parent=s["Normal"], fontName=base, fontSize=7.9, leading=9.5, alignment=TA_LEFT),
        "h15": ParagraphStyle("h1", parent=s["Normal"], fontName=b, fontSize=13.9, leading=16, alignment=TA_CENTER, spaceAfter=2 * mm),
        "h08": ParagraphStyle("h0", parent=s["Normal"], fontName=base, fontSize=7.9, leading=9.2, alignment=TA_CENTER, spaceAfter=2 * mm),
        "body9": ParagraphStyle("b9", parent=s["Normal"], fontName=base, fontSize=9.1, leading=11, alignment=TA_JUSTIFY),
        "sec": ParagraphStyle("sc", parent=s["Normal"], fontName=b, fontSize=10.1, leading=12, alignment=TA_LEFT, spaceAfter=1 * mm),
        "dlabel": ParagraphStyle("dl", parent=s["Normal"], fontName=b, fontSize=7.9, leading=9.5, alignment=TA_LEFT),
        "dname": ParagraphStyle("dn", parent=s["Normal"], fontName=b, fontSize=9.1, leading=11, alignment=TA_LEFT),
        "drest": ParagraphStyle("dr", parent=s["Normal"], fontName=base, fontSize=7.9, leading=9.5, alignment=TA_LEFT),
        "zest_t": ParagraphStyle("zt", parent=s["Normal"], fontName=b, fontSize=10.1, leading=12, alignment=TA_LEFT, spaceAfter=1 * mm),
        "zest_l": ParagraphStyle("zl", parent=s["Normal"], fontName=tnr, fontSize=9.1, leading=11, alignment=TA_LEFT),
        "zest_r": ParagraphStyle("zr", parent=s["Normal"], fontName=tnr, fontSize=9.1, leading=11, alignment=TA_RIGHT),
        "zest_tot": ParagraphStyle("zz", parent=s["Normal"], fontName=tnrb, fontSize=9.1, leading=11, alignment=TA_LEFT),
        "wyzn": ParagraphStyle("wz", parent=s["Normal"], fontName=base, fontSize=9.1, leading=11, alignment=TA_LEFT),
        "dane_t": ParagraphStyle("dt", parent=s["Normal"], fontName=b, fontSize=10.1, leading=12, alignment=TA_LEFT, spaceAfter=1 * mm),
        "pr9b": ParagraphStyle("p9", parent=s["Normal"], fontName=b, fontSize=9.1, leading=11, alignment=TA_LEFT),
        "zpw": ParagraphStyle("zp", parent=s["Normal"], fontName=base, fontSize=9.1, leading=11, alignment=TA_LEFT),
        "ryg_t": ParagraphStyle("ry", parent=s["Normal"], fontName=b, fontSize=7.9, leading=9.5, alignment=TA_LEFT, spaceAfter=1 * mm),
        "ryg_b": ParagraphStyle("rb", parent=s["Normal"], fontName=base, fontSize=7.9, leading=9.5, alignment=TA_JUSTIFY),
    }


def _table_tstyle(nrows: int) -> list:
    st: list = [
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 2.5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 2.5),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("BACKGROUND", (0, 0), (-1, 0), HEADER_RED),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "ArialBold"),
        ("FONTSIZE", (0, 0), (-1, 0), 7.0),
        ("INNER_GRID", (0, 0), (-1, -1), 0.25, LINE_GRAY),
        ("BOX", (0, 0), (-1, -1), 0.35, colors.black),
    ]
    for r in range(1, nrows):
        st.append(
            (
                "BACKGROUND",
                (0, r),
                (-1, r),
                colors.white if r % 2 else ROW_ALT,
            )
        )
    st.extend(
        [
            ("TEXTCOLOR", (0, 1), (-1, -1), colors.black),
            ("FONTNAME", (0, 1), (5, -1), "ArialDoc"),
            ("FONTSIZE", (0, 1), (5, -1), 7.4),
            ("FONTNAME", (6, 1), (6, -1), "ArialDoc"),
            ("FONTSIZE", (6, 1), (6, -1), 6.5),
        ]
    )
    return st


def build_pdf(out: Path) -> None:
    a, ab, tnr, tnrb = _reg()
    S = _st(a, ab, tnr, tnrb)
    doc = SimpleDocTemplate(
        str(out),
        pagesize=A4,
        leftMargin=50,
        rightMargin=50,
        topMargin=48,
        bottomMargin=48,
    )
    story: list = []

    story.append(
        Table(
            [
                [Paragraph(f"Lipsko, {DOC_TOP}", S["lipsko"]), Paragraph("OMEGA SP. Z O.O.", S["omega"])]
            ],
            colWidths=[(A4[0] - 100) / 2, (A4[0] - 100) / 2],
        )
    )
    story.append(
        Paragraph(
            f"Dokument wygenerowany elektronicznie w dniu {FOOTER_DATE}. "
            f"Ważny bez podpisu — art. 78 § 2 k.c. | Strona 1/2",
            S["foot"],
        )
    )
    story.append(Spacer(1, 2.5 * mm))
    for line in ["ul. Kilińskiego 11, 27-300 Lipsko", "NIP: 7812011724", f"Sygn.: {SYGN}"]:
        stx = S["addr"] if "Sygn" not in line else S["sygn"]
        story.append(Paragraph(line, stx))
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph("OSTATECZNE PRZEDSĄDOWE WEZWANIE DO ZAPŁATY", S["h15"]))
    story.append(
        Paragraph(
            "NA PODSTAWIE ART. 455 K.C. W ZW. Z USTAWĄ O PRZECIWDZIAŁANIU NADMIERNYM OPÓŹNIENIOM",
            S["h08"],
        )
    )
    story.append(Spacer(1, 2.5 * mm))
    story.append(
        Paragraph(
            "Działając w imieniu OMEGA SP. Z O.O. (NIP: 7812011724), niniejszym wzywam do zapłaty należności wynikających z "
            "opóźnień w płatnościach faktur VAT. Na podstawie ustawy o przeciwdziałaniu nadmiernym opóźnieniom w transakcjach "
            "handlowych, wierzycielowi przysługują odsetki ustawowe za opóźnienie (16,00%/16,75%/15,75% p.a.) oraz "
            "rekompensata za koszty odzyskiwania należności (art. 10 — 40 EUR per faktura wg kursu NBP z ostatniego dnia rob. "
            "miesiąca poprzedzającego wymagalność).",
            S["body9"],
        )
    )
    story.append(Paragraph("Podstawa prawna: art. 7 ust. 1 oraz art. 10 ust. 1 ustawy z 8 marca 2013 r. (Dz.U. 2023 poz. 711).", S["body9"]))
    story.append(Spacer(1, 3 * mm))

    story.append(Paragraph("I. FAKTURY NIEZAPŁACONE", S["sec"]))
    t1 = [
        ["Nr faktury", "Kwota brutto", "Termin płatności", "Dni opóźnienia", "Odsetki PLN", "Rekompensata PLN", "Uwagi"],
        [
            "16/07/2025",
            f"{MAIN_350} PLN",
            DUE_UNPAID,
            f"{DNI_UNPAID} dni",
            f"{ODS_UNPAID} PLN",
            f"{REK_1} PLN",
            "Nieopłacona w całości",
        ],
    ]
    t1b = Table(t1, colWidths=[22 * mm, 28 * mm, 28 * mm, 25 * mm, 28 * mm, 32 * mm, 28 * mm], repeatRows=1)
    t1b.setStyle(TableStyle(_table_tstyle(len(t1))))
    story.append(t1b)
    story.append(Spacer(1, 3 * mm))

    story.append(Paragraph("II. FAKTURY ZAPŁACONE Z OPÓŹNIENIEM", S["sec"]))
    t2 = [
        [
            "Nr faktury",
            "Kwota brutto",
            "Termin",
            "Data zapłaty",
            "Dni",
            "Odsetki PLN",
            "Rekompensata PLN",
        ],
    ]
    for x in ROWS_LATE:
        t2.append([x[0], f"{x[1]} PLN", x[2], x[3], x[4], f"{x[5]} PLN", f"{x[6]} PLN"])
    t2b = Table(
        t2,
        colWidths=[25 * mm, 28 * mm, 32 * mm, 32 * mm, 18 * mm, 30 * mm, 32 * mm],
        repeatRows=1,
    )
    t2b.setStyle(TableStyle(_table_tstyle(len(t2))))
    story.append(t2b)
    story.append(Spacer(1, 3 * mm))

    story.append(Paragraph("DŁUŻNIK:", S["dlabel"]))
    story.append(Paragraph("Adam Pielaszewski", S["dname"]))
    story.append(Paragraph("ul. Nowe Łubki 67, 09-454 Nowe Łubki", S["drest"]))
    story.append(Paragraph("NIP: 7742802187", S["drest"]))

    story.append(PageBreak())

    story.append(Paragraph("ZESTAWIENIE NALEŻNOŚCI", S["zest_t"]))
    story.append(
        Paragraph(
            f"Dokument wygenerowany elektronicznie w dniu {FOOTER_DATE}. "
            f"Ważny bez podpisu — art. 78 § 2 k.c. | Strona 2/2",
            S["foot"],
        )
    )
    story.append(Spacer(1, 3 * mm))

    zest = [
        [Paragraph("Należność główna (1 faktura niezapłacona)", S["zest_l"]), Paragraph(f"{MAIN_350} PLN", S["zest_r"])],
        [
            Paragraph("Odsetki ustawowe za opóźnienie (15,75% p.a., 1 faktura niezapłacona)", S["zest_l"]),
            Paragraph(f"{ODS_UNPAID} PLN", S["zest_r"]),
        ],
        [
            Paragraph("Rekompensata za koszty odzyskiwania (art. 10, 1 faktura niezapł., kurs NBP)", S["zest_l"]),
            Paragraph(f"{REK_1} PLN", S["zest_r"]),
        ],
        [
            Paragraph("Odsetki ustawowe za opóźnienie (16,00%/16,75%/15,75% p.a., 19 faktur spóźn.)", S["zest_l"]),
            Paragraph(f"{ODS_LATE} PLN", S["zest_r"]),
        ],
        [
            Paragraph("Rekompensata za koszty odzyskiwania (art. 10, 19 faktur spóźn., kurs NBP)", S["zest_l"]),
            Paragraph(f"{REK_19} PLN", S["zest_r"]),
        ],
    ]
    zt = Table(zest, colWidths=[141 * mm, 44 * mm])
    zt.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]
        )
    )
    story.append(zt)
    story.append(Spacer(1, 2 * mm))
    story.append(Paragraph(f"ŁĄCZNA KWOTA DO ZAPŁATY {TOTAL} PLN", S["zest_tot"]))
    story.append(Spacer(1, 3 * mm))
    story.append(
        Paragraph(
            f"Wyznaczam termin zapłaty pełnej kwoty {TOTAL} PLN do dnia {TERM_PAY} "
            f"({DNI_PO} dni od daty niniejszego wezwania).",
            S["wyzn"],
        )
    )
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph("DANE DO PRZELEWU", S["dane_t"]))
    prow = [
        [Paragraph("Nazwa odbiorcy", S["pr9b"]), Paragraph("Omega Sp. z o.o.", S["pr9b"])],
        [Paragraph("Bank", S["pr9b"]), Paragraph("BNP Paribas", S["pr9b"])],
        [Paragraph("Numer rachunku", S["pr9b"]), Paragraph("PL 08 1600 1404 1779 0433 4000 0001", S["pr9b"])],
        [Paragraph("Tytułem", S["pr9b"]), Paragraph(SYGN, S["pr9b"])],
        [Paragraph("Kwota", S["pr9b"]), Paragraph(f"{TOTAL} PLN", S["pr9b"])],
    ]
    ptab = Table(prow, colWidths=[(A4[0] - 100) * 0.32, (A4[0] - 100) * 0.68])
    ptab.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("INNER_GRID", (0, 0), (-1, -1), 0.2, LINE_GRAY),
                ("BOX", (0, 0), (-1, -1), 0.4, colors.black),
                ("TOPPADDING", (0, 0), (-1, -1), 2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ]
        )
    )
    story.append(ptab)
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("Z poważaniem,", S["zpw"]))
    story.append(Paragraph("Paweł Klimankowicz — Prezes Zarządu", S["dname"]))
    story.append(Paragraph("OMEGA SP. Z O.O.", S["dname"]))
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph("! RYGOR POSTĘPOWANIA SĄDOWEGO", S["ryg_t"]))
    story.append(
        Paragraph(
            "W przypadku bezskutecznego upływu wyznaczonego terminu, sprawa zostanie niezwłocznie skierowana na drogę postępowania "
            "sądowego bez dodatkowego wezwania, co wiązać się będzie z obciążeniem Dłużnika kosztami procesu, w tym kosztami zastępstwa "
            "procesowego, opłatami sądowymi oraz dalszymi odsetkami.",
            S["ryg_b"],
        )
    )
    doc.build(story)


def main() -> None:
    out = Path(__file__).resolve().parent.parent / "reports" / "wezwanie_WZ-2026-APS001_Pielaszewski.pdf"
    out.parent.mkdir(parents=True, exist_ok=True)
    build_pdf(out)
    print(out)
    case = Path(
        "/Users/prometheus/Desktop/SPRAWY Z DŁUŻNIKAMI/wezwania do zapłaty wysłane/ADAM PIELASZEWSKI"
    )
    if case.is_dir():
        d = case / "wezwanie_WZ-2026-APS001_Pielaszewski.pdf"
        try:
            shutil.copy2(out, d)
            print("Skopiowano:", d)
        except OSError as e:
            print("Kopia do sprawy — pominięto:", e)


if __name__ == "__main__":
    main()
