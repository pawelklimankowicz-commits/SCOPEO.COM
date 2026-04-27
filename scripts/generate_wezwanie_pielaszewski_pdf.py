#!/usr/bin/env python3
"""Generuje PDF: ostateczne przedsądowe wezwanie do zapłaty — layout jak
wezwanie_WZ-2026-ANOW001_Nowak.pdf (kolejność bloków, tabele, zestawienie, stopka).

Dane: ADAM PIELASZEWSKI / WZ-2026/APS001. Źródła kalkulacji — jak w wersji roboczej
(faktury + wyciągi BNP)."""

from __future__ import annotations

import os
import shutil
from pathlib import Path

from reportlab.lib import colors
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

FONT_CANDIDATES = [
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    "/Library/Fonts/Arial Unicode.ttf",
]

# --- Pielaszewski (spójne z weryfikacją wyciągów) ---
DOC_TOP = "27 kwietnia 2026"
FOOTER_DATE = "27 kwietnia 2026"
SYGN = "WZ/2026/APS001"
DUE_UNPAID = "25.07.2025"
DNI_UNPAID = 275
# Kwoty w PDF jak w wzorcu Nowak: kropka dziesiętna, spacja przed PLN
MAIN_350 = "350.00"
ODS_UNPAID = "41.53"
REK_1 = "170.92"
ODS_LATE = "10.80"
REK_19 = "3247.48"  # 19 × 170,92
TOTAL = "3820.73"
TERM_PAY = "30 kwietnia 2026"
DNI_PO = "3"  # dni od wezwania

# Tabela II: (nr FV, kwota brutto z kropką, termin dd.mm.rrrr, data zapłaty, dni słownie, odsetki, rekompens.)
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


def _register_font() -> str:
    for p in FONT_CANDIDATES:
        if os.path.isfile(p):
            pdfmetrics.registerFont(TTFont("DocUnicode", p))
            return "DocUnicode"
    raise SystemExit("Brak czcionki z polskimi znakami (Arial Unicode). Zainstaluj czcionkę lub podaj ścieżkę.")


def _styles(font: str):
    base = getSampleStyleSheet()
    h = 10.5
    return {
        "normal": ParagraphStyle(
            "n",
            parent=base["Normal"],
            fontName=font,
            fontSize=h,
            leading=h + 2,
            alignment=TA_JUSTIFY,
        ),
        "center": ParagraphStyle(
            "c",
            parent=base["Normal"],
            fontName=font,
            fontSize=h,
            leading=h + 2,
            alignment=TA_CENTER,
        ),
        "title": ParagraphStyle(
            "t",
            parent=base["Normal"],
            fontName=font,
            fontSize=11.5,
            leading=14,
            alignment=TA_CENTER,
            spaceAfter=2 * mm,
        ),
        "headerSmall": ParagraphStyle(
            "hs",
            parent=base["Normal"],
            fontName=font,
            fontSize=h,
            leading=h + 2,
            alignment=TA_LEFT,
        ),
        "right": ParagraphStyle(
            "hr",
            parent=base["Normal"],
            fontName=font,
            fontSize=h,
            leading=h + 2,
            alignment=TA_RIGHT,
        ),
    }


def build_pdf(out: Path) -> None:
    font = _register_font()
    st = _styles(font)
    margin = 18 * mm
    doc = SimpleDocTemplate(
        str(out),
        pagesize=A4,
        leftMargin=margin,
        rightMargin=margin,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
    )
    story: list = []

    # --- Strona 1: jak wzorzec ANOW001 — wiersz 1: Lipsko + OMEGA, wiersz 2: dokument + Strona 1/2
    hrow = Table(
        [
            [Paragraph(f"Lipsko, {DOC_TOP}", st["headerSmall"]), Paragraph("OMEGA SP. Z O.O.", st["right"])]
        ],
        colWidths=[95 * mm, 75 * mm],
    )
    hrow.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    story.append(hrow)
    story.append(
        Paragraph(
            f"Dokument wygenerowany elektronicznie w dniu {FOOTER_DATE}. Ważny bez podpisu — art. 78 § 2 k.c. | Strona 1/2",
            st["center"],
        )
    )
    story.append(Spacer(1, 4 * mm))
    for line in [
        "ul. Kilińskiego 11, 27-300 Lipsko",
        "NIP: 7812011724",
        f"Sygn.: {SYGN}",
    ]:
        story.append(Paragraph(line, st["headerSmall"]))
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("OSTATECZNE PRZEDSĄDOWE WEZWANIE DO ZAPŁATY", st["title"]))
    story.append(
        Paragraph(
            "NA PODSTAWIE ART. 455 K.C. W ZW. Z USTAWĄ O PRZECIWDZIAŁANIU NADMIERNYM OPÓŹNIENIOM",
            st["title"],
        )
    )
    story.append(Spacer(1, 4 * mm))

    # Wstęp — tekst 1:1 z wzorca Nowak (bez uzupełnień o wyciągi)
    story.append(
        Paragraph(
            "Działając w imieniu OMEGA SP. Z O.O. (NIP: 7812011724), niniejszym wzywam do zapłaty należności wynikających z "
            "opóźnień w płatnościach faktur VAT. Na podstawie ustawy o przeciwdziałaniu nadmiernym opóźnieniom w transakcjach "
            "handlowych, wierzycielowi przysługują odsetki ustawowe za opóźnienie (16,00%/16,75%/15,75% p.a.) oraz "
            "rekompensata za koszty odzyskiwania należności (art. 10 — 40 EUR per faktura wg kursu NBP z ostatniego dnia rob. "
            "miesiąca poprzedzającego wymagalność).",
            st["normal"],
        )
    )
    story.append(Spacer(1, 2 * mm))
    story.append(
        Paragraph(
            "Podstawa prawna: art. 7 ust. 1 oraz art. 10 ust. 1 ustawy z 8 marca 2013 r. (Dz.U. 2023 poz. 711).",
            st["normal"],
        )
    )
    story.append(Spacer(1, 4 * mm))

    # I. tabela (nagłówki jak w PDF Nowak)
    story.append(Paragraph("I. FAKTURY NIEZAPŁACONE", st["headerSmall"]))
    story.append(Spacer(1, 2 * mm))
    t1_data = [
        [
            "Nr faktury",
            "Kwota brutto",
            "Termin płatności",
            "Dni opóźnienia",
            "Odsetki PLN",
            "Rekompensata PLN",
            "Uwagi",
        ],
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
    t1 = Table(
        t1_data,
        colWidths=[22 * mm, 28 * mm, 28 * mm, 25 * mm, 28 * mm, 32 * mm, 28 * mm],
        repeatRows=1,
    )
    t1.setStyle(
        TableStyle(
            [
                ("FONT", (0, 0), (-1, -1), font, 7.5),
                ("FONTSIZE", (0, 0), (-1, -1), 7.5),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.black),
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f0f0f0")),
            ]
        )
    )
    story.append(t1)
    story.append(Spacer(1, 4 * mm))

    # II. tabela
    story.append(Paragraph("II. FAKTURY ZAPŁACONE Z OPÓŹNIENIEM", st["headerSmall"]))
    story.append(Spacer(1, 2 * mm))
    t2_header = [
        "Nr faktury",
        "Kwota brutto",
        "Termin",
        "Data zapłaty",
        "Dni",
        "Odsetki PLN",
        "Rekompensata PLN",
    ]
    t2_data = [t2_header]
    for a, k, te, p, dn, o, r in ROWS_LATE:
        t2_data.append(
            [a, f"{k} PLN", te, p, dn, f"{o} PLN", f"{r} PLN"],
        )
    t2 = Table(
        t2_data,
        colWidths=[25 * mm, 28 * mm, 32 * mm, 32 * mm, 18 * mm, 30 * mm, 32 * mm],
        repeatRows=1,
    )
    t2.setStyle(
        TableStyle(
            [
                ("FONT", (0, 0), (-1, -1), font, 7.5),
                ("FONTSIZE", (0, 0), (-1, -1), 7.5),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.black),
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f0f0f0")),
            ]
        )
    )
    story.append(t2)
    story.append(Spacer(1, 4 * mm))

    # DŁUŻNIK — na końcu str. 1, jak w wzorcu
    story.append(Paragraph("DŁUŻNIK:", st["headerSmall"]))
    story.append(Paragraph("Adam Pielaszewski", st["headerSmall"]))
    story.append(Paragraph("ul. Nowe Łubki 67, 09-454 Nowe Łubki", st["headerSmall"]))
    story.append(Paragraph("NIP: 7742802187", st["headerSmall"]))

    story.append(PageBreak())

    # Strona 2: nagłówek jak wzorzec
    story.append(Paragraph("ZESTAWIENIE NALEŻNOŚCI", st["headerSmall"]))
    story.append(
        Paragraph(
            f"Dokument wygenerowany elektronicznie w dniu {FOOTER_DATE}. Ważny bez podpisu — art. 78 § 2 k.c. | Strona 2/2",
            st["center"],
        )
    )
    story.append(Spacer(1, 4 * mm))

    for line in [
        f"Należność główna (1 faktura niezapłacona) {MAIN_350} PLN",
        f"Odsetki ustawowe za opóźnienie (15,75% p.a., 1 faktura niezapłacona) {ODS_UNPAID} PLN",
        f"Rekompensata za koszty odzyskiwania (art. 10, 1 faktura niezapł., kurs NBP) {REK_1} PLN",
        f"Odsetki ustawowe za opóźnienie (16,00%/16,75%/15,75% p.a., 19 faktur spóźn.) {ODS_LATE} PLN",
        f"Rekompensata za koszty odzyskiwania (art. 10, 19 faktur spóźn., kurs NBP) {REK_19} PLN",
    ]:
        story.append(Paragraph(line, st["headerSmall"]))
    story.append(Spacer(1, 2 * mm))
    story.append(Paragraph(f"<b>ŁĄCZNA KWOTA DO ZAPŁATY {TOTAL} PLN</b>", st["headerSmall"]))

    story.append(Spacer(1, 4 * mm))
    story.append(
        Paragraph(
            f"Wyznaczam termin zapłaty pełnej kwoty {TOTAL} PLN do dnia {TERM_PAY} "
            f"({DNI_PO} dni od daty niniejszego wezwania).",
            st["normal"],
        )
    )
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("DANE DO PRZELEWU", st["headerSmall"]))
    story.append(Spacer(1, 2 * mm))
    for line in [
        "Nazwa odbiorcy Omega Sp. z o.o.",
        "Bank BNP Paribas",
        "Numer rachunku PL 08 1600 1404 1779 0433 4000 0001",
        f"Tytułem {SYGN}",
        f"Kwota {TOTAL} PLN",
    ]:
        story.append(Paragraph(line, st["headerSmall"]))
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("Z poważaniem,", st["normal"]))
    story.append(Spacer(1, 2 * mm))
    story.append(Paragraph("Paweł Klimankowicz — Prezes Zarządu", st["headerSmall"]))
    story.append(Paragraph("OMEGA SP. Z O.O.", st["headerSmall"]))
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("! RYGOR POSTĘPOWANIA SĄDOWEGO", st["headerSmall"]))
    story.append(Spacer(1, 2 * mm))
    story.append(
        Paragraph(
            "W przypadku bezskutecznego upływu wyznaczonego terminu, sprawa zostanie niezwłocznie skierowana na drogę postępowania "
            "sądowego bez dodatkowego wezwania, co wiązać się będzie z obciążeniem Dłużnika kosztami procesu, w tym kosztami zastępstwa "
            "procesowego, opłatami sądowymi oraz dalszymi odsetkami.",
            st["normal"],
        )
    )
    doc.build(story)


def main() -> None:
    out = Path(__file__).resolve().parent.parent / "reports" / "wezwanie_WZ-2026-APS001_Pielaszewski.pdf"
    out.parent.mkdir(parents=True, exist_ok=True)
    build_pdf(out)
    print(out)
    case_dir = Path(
        "/Users/prometheus/Desktop/SPRAWY Z DŁUŻNIKAMI/wezwania do zapłaty wysłane/ADAM PIELASZEWSKI"
    )
    if case_dir.is_dir():
        dest = case_dir / "wezwanie_WZ-2026-APS001_Pielaszewski.pdf"
        shutil.copy2(out, dest)
        print("Skopiowano:", dest)


if __name__ == "__main__":
    main()
