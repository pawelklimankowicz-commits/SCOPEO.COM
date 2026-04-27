#!/usr/bin/env python3
"""Generuje PDF wezwania do zapłaty — układ jak wzorzec WZ/2026 (reportlab).

Dane weryfikowane: faktury ADAM PIELASZEWSKI (linia „1 Obsługa księgowa M/RRRR”)
+ wpływy z wyciągów BNP 3625… (tytuł „Obsługa księgowa m/rrrr, … PIELASZEWSKI”).

Stan na dzień: 27.04.2026 (Lipsko). Odsetki w tabelach: model uproszczony 15,75% r.a.
(średnie przybliżenie); rekompensata art. 10: 40 EUR w PLN wg wzoru WZ/2026 (170,92 PLN
na fakturę 350 PLN) — ostateczna kwota do potwierdzenia kursami NBP na dni
poprzedzające wymagalność.
"""

from __future__ import annotations

import os
import shutil
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
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

# --- Ustalone wyliczenia (synchron: analiza 2025-04) ---
DOC_DATE = "27 kwietnia 2026"
FOOTER_DAY = "27 kwietnia 2026"
DUE_UNPAID = "25.07.2025"  # z FV 16/07/2025
DNI_UNPAID = 275  # od pierwszego dnia po terminie 25.07.2025 (26.07.2025) do 27.04.2026
ODS_UNPAID = "41,53"  # 350 × 15,75% × 275/365
REK_PER_FV = "170,92"  # 40 EUR wg kursu jak w wzorach WZ/2026 dla FV 350 PLN
ODS_LATE_SUM = "10,80"  # suma 19 pozycji (15,75% r.a. × dni/365)
REK_COUNT = 20
REK_SUM = f"{REK_COUNT * 170.92:,.2f}".replace(",", " ").replace(".", ",")  # 3 418,40
MAIN_SUM = "350,00"
TOTAL = "3 820,73"
TERM_PAY = "30 kwietnia 2026"
DNI_OD_WEZWANIA = "3"  # do 30.04 od 27.04

# II. Wiersze: nr FV, kwota brutto, termin, data wpłaty, dni, odsetki (15,75%), rekompens.
ROWS_LATE: list[tuple[str, str, str, str, str, str, str]] = [
    ("8/02/2022", "249,00 PLN", "16.02.2022", "17.02.2022", "1", "0,11", f"{REK_PER_FV}"),
    ("18/09/2022", "249,00 PLN", "19.09.2022", "20.09.2022", "1", "0,11", f"{REK_PER_FV}"),
    ("27/08/2022", "249,00 PLN", "19.08.2022", "25.08.2022", "6", "0,64", f"{REK_PER_FV}"),
    ("17/12/2022", "349,00 PLN", "13.12.2022", "14.12.2022", "1", "0,15", f"{REK_PER_FV}"),
    ("5/03/2023", "450,00 PLN", "13.03.2023", "16.03.2023", "3", "0,58", f"{REK_PER_FV}"),
    ("19/06/2023", "350,00 PLN", "19.06.2023", "21.06.2023", "2", "0,30", f"{REK_PER_FV}"),
    ("17/07/2023", "350,00 PLN", "17.07.2023", "19.07.2023", "2", "0,30", f"{REK_PER_FV}"),
    ("15/08/2023", "350,00 PLN", "15.08.2023", "17.08.2023", "2", "0,30", f"{REK_PER_FV}"),
    ("16/09/2023", "350,00 PLN", "12.09.2023", "18.09.2023", "6", "0,91", f"{REK_PER_FV}"),
    ("8/11/2023", "350,00 PLN", "13.11.2023", "17.11.2023", "4", "0,60", f"{REK_PER_FV}"),
    ("14/03/2024", "350,00 PLN", "13.03.2024", "18.03.2024", "5", "0,76", f"{REK_PER_FV}"),
    ("5/05/2024", "350,00 PLN", "14.05.2024", "15.05.2024", "1", "0,15", f"{REK_PER_FV}"),
    ("7/08/2024", "350,00 PLN", "16.08.2024", "19.08.2024", "3", "0,45", f"{REK_PER_FV}"),
    ("15/09/2024", "350,00 PLN", "13.09.2024", "16.09.2024", "3", "0,45", f"{REK_PER_FV}"),
    ("20/10/2024", "350,00 PLN", "14.10.2024", "21.10.2024", "7", "1,06", f"{REK_PER_FV}"),
    ("19/12/2024", "350,00 PLN", "22.12.2024", "27.12.2024", "5", "0,76", f"{REK_PER_FV}"),
    ("16/02/2025", "350,00 PLN", "13.02.2025", "20.02.2025", "7", "1,06", f"{REK_PER_FV}"),
    ("16/03/2025", "350,00 PLN", "13.03.2025", "24.03.2025", "11", "1,66", f"{REK_PER_FV}"),
    ("20/05/2025", "350,00 PLN", "13.06.2025", "16.06.2025", "3", "0,45", f"{REK_PER_FV}"),
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
            spaceAfter=3 * mm,
        ),
        "headerSmall": ParagraphStyle(
            "hs",
            parent=base["Normal"],
            fontName=font,
            fontSize=h,
            leading=h + 2,
            alignment=TA_LEFT,
        ),
    }


def build_pdf(out: Path) -> None:
    font = _register_font()
    st = _styles(font)
    margin = 16 * mm
    doc = SimpleDocTemplate(
        str(out),
        pagesize=A4,
        leftMargin=margin,
        rightMargin=margin,
        topMargin=14 * mm,
        bottomMargin=14 * mm,
    )
    story: list = []

    for line in [
        "OMEGA SP. Z O.O.",
        "ul. Kilińskiego 11, 27-300 Lipsko",
        "NIP: 7812011724",
        f"Lipsko, {DOC_DATE}",
        "Sygn.: WZ/2026/APS001",
    ]:
        story.append(Paragraph(line, st["headerSmall"]))
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph("OSTATECZNE PRZEDSĄDOWE WEZWANIE DO ZAPŁATY", st["title"]))
    story.append(
        Paragraph(
            "NA PODSTAWIE ART. 455 K.C. W ZW. Z USTAWĄ O PRZECIWDZIAŁANIU NADMIERNYM OPÓŹNIENIOM",
            st["title"],
        )
    )
    story.append(Spacer(1, 3 * mm))

    story.append(Paragraph("DŁUŻNIK:", st["headerSmall"]))
    story.append(Paragraph("TOW-TRUCK Adam Pielaszewski", st["headerSmall"]))
    story.append(Paragraph("ul. Nowe Łubki 67, 09-454 Nowe Łubki", st["headerSmall"]))
    story.append(Paragraph("NIP: 7742802187", st["headerSmall"]))
    story.append(Spacer(1, 3 * mm))

    intro = (
        "Działając w imieniu OMEGA SP. Z O.O. (NIP: 7812011724), niniejszym wzywam do zapłaty należności "
        "wynikających z opóźnień w płatnościach faktur VAT (z jednoczesnym wskazaniem jednej faktury całkowicie "
        "nieuregulowanej). Na podstawie ustawy o przeciwdziałaniu nadmiernym opóźnieniom w transakcjach handlowych, "
        "wierzycielowi przysługują odsetki ustawowe za opóźnienie (m.in. 16,00% / 16,75% / 15,75% r.a. wg "
        "okresów) oraz rekompensata za koszty odzyskiwania należności (art. 10 — 40 EUR per faktura wg kursu NBP z "
        "ostatniego dnia roboczego miesiąca poprzedzającego wymagalność).<br/>"
        "Podstawa prawna: art. 7 ust. 1 oraz art. 10 ust. 1 ustawy z 8 marca 2013 r. (Dz.U. 2023 poz. 711).<br/>"
        "<b>Źródło weryfikacji wpłat:</b> wyciągi z rachunku bankowego 3625 3000 0820 5810 6795 0700 01 (BNP) "
        "w zestawie plików — dopasowanie po tytułach „Obsługa księgowa m/rrrr” dla wpływów od Pana/Pani Adam "
        "Pielaszewski. Brak sparowanego wpływu tyt. okresu 6/2025 wobec faktury 16/07/2025; ostatni zidentyfikowany "
        "wpływ z tej serii: 5/2025, data wpłaty 16.06.2025."
    )
    story.append(Paragraph(intro, st["normal"]))
    story.append(Spacer(1, 3 * mm))

    story.append(Paragraph("I. FAKTURA NIEZAPŁACONA", st["headerSmall"]))
    story.append(Spacer(1, 2 * mm))
    t1_data = [
        [
            "Nr faktury",
            "Kwota brutto",
            "Termin płatności",
            "Dni opóźnienia*",
            "Odsetki PLN**",
            "Rekompensata PLN**",
            "Uwagi",
        ],
        [
            "16/07/2025",
            f"{MAIN_SUM} PLN",
            DUE_UNPAID,
            f"{DNI_UNPAID} dni",
            f"{ODS_UNPAID} PLN",
            f"{REK_PER_FV} PLN",
            "Nieopłacona w całości (okres 6/2025 we FV).",
        ],
    ]
    t1 = Table(t1_data, colWidths=[22 * mm, 26 * mm, 28 * mm, 25 * mm, 28 * mm, 32 * mm, 32 * mm], repeatRows=1)
    t1.setStyle(
        TableStyle(
            [
                ("FONT", (0, 0), (-1, -1), font, 6.8),
                ("FONTSIZE", (0, 0), (-1, -1), 6.8),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.black),
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f0f0f0")),
            ]
        )
    )
    story.append(t1)
    story.append(Spacer(1, 2 * mm))
    story.append(
        Paragraph(
            f"<i>* Dni opóźnienia (stan na {FOOTER_DAY}): liczone od pierwszego dnia po upływie "
            f"terminu płatności wskazanego we fakturze (termin {DUE_UNPAID}).</i><br/>"
            "<i>** Odsetki w tabeli: model uproszczony 15,75% r.a. / 365; ostateczna wysokość zgodnie z "
            "tabelą odsetek ustawowych w podziale na okresy. Rekompensata: 40 EUR w zł, wg kursu NBP; w kolumnach "
            f"przyjęto {REK_PER_FV} PLN jak dla faktur 350 PLN w wzorcach WZ/2026 (do weryfikacji per data "
            "wymagalności).</i>",
            st["normal"],
        )
    )
    story.append(Spacer(1, 3 * mm))

    story.append(Paragraph("II. FAKTURY ZAPŁACONE Z OPÓŹNIENIEM (19)", st["headerSmall"]))
    story.append(Spacer(1, 1.5 * mm))
    t2_header = [
        "Nr faktury",
        "Kwota brutto",
        "Termin płatności",
        "Data wpłaty*",
        "Dni",
        "Odsetki PLN",
        "Rekomp. PLN",
    ]
    t2_data = [t2_header] + [list(r) for r in ROWS_LATE]
    t2 = Table(
        t2_data,
        colWidths=[23 * mm, 26 * mm, 30 * mm, 30 * mm, 12 * mm, 26 * mm, 30 * mm],
        repeatRows=1,
    )
    t2.setStyle(
        TableStyle(
            [
                ("FONT", (0, 0), (-1, -1), font, 6.5),
                ("FONTSIZE", (0, 0), (-1, -1), 6.5),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.black),
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f0f0f0")),
            ]
        )
    )
    story.append(t2)
    story.append(Spacer(1, 2 * mm))
    story.append(
        Paragraph(
            "<i>*Data wpłaty: data uznania rachunku wierzyciela w wyciągu, dla tytułu wskazującego odpowiedni "
            "miesiąc księgowy. Pozostałych 23 faktur z zestawu ADAM PIELASZEWSKI (do okresu 5/2025) uznano za opłacone "
            "w terminie albo w kwotach łączonych; nie wchodzą do niniejszego wezwania — szczegóły w ewidencji księgowej.</i>",
            st["normal"],
        )
    )
    story.append(Spacer(1, 2 * mm))
    story.append(
        Paragraph(
            f"Dokument wygenerowany elektronicznie w dniu {FOOTER_DAY}. Ważny bez podpisu — art. 78 par. 2 k.c. "
            "| Strona 1/2",
            st["center"],
        )
    )
    story.append(PageBreak())

    story.append(Paragraph("ZESTAWIENIE NALEŻNOŚCI", st["headerSmall"]))
    story.append(Spacer(1, 2 * mm))
    ods_razem = f"{float(ODS_UNPAID.replace(',', '.')) + float(ODS_LATE_SUM.replace(',', '.')):.2f}".replace(
        ".", ","
    )
    z_data = [
        ["Należność główna (1 faktura niezapłacona)", f"{MAIN_SUM} PLN"],
        [
            "Odsetki ustawowe za opóźnienie (1 fakt. niezapł. + 19 fakt. spóźn., wg załączników)",
            f"{ods_razem} PLN",
        ],
        [
            f"Rekompensata za koszty odzyskiwania (art. 10, {REK_COUNT} faktur, 40 EUR wg kursu NBP; zaokr. jak wzór)",
            f"{REK_SUM} PLN",
        ],
        ["ŁĄCZNA KWOTA DO ZAPŁATY (po zaokrągleniu 2 miejsca)", f"{TOTAL} PLN"],
    ]
    zt = Table(z_data, colWidths=[120 * mm, 50 * mm])
    zt.setStyle(
        TableStyle(
            [
                ("FONT", (0, 0), (-1, -1), font, 9),
                ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LINEABOVE", (0, 3), (-1, 3), 0.8, colors.black),
            ]
        )
    )
    story.append(zt)
    story.append(Spacer(1, 4 * mm))
    story.append(
        Paragraph(
            f"Wyznaczam termin zapłaty pełnej kwoty {TOTAL} PLN do dnia {TERM_PAY} "
            f"({DNI_OD_WEZWANIA} dni od daty niniejszego wezwania) — łącznie należność główna, odsetki i rekompensaty "
            "w kwotach z tabel, po ewentualnej ostatecznej weryfikacji NBP w rozliczeniu wewnętrznym.",
            st["normal"],
        )
    )
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph("DANE DO PRZELEWU", st["headerSmall"]))
    for a, b in [
        ("Nazwa odbiorcy", "Omega Sp. z o.o."),
        ("Bank", "BNP Paribas"),
        ("Numer rachunku", "PL 08 1600 1404 1779 0433 4000 0001"),
        ("Tytułem", "WZ/2026/APS001"),
        ("Kwota", f"{TOTAL} PLN"),
    ]:
        story.append(Paragraph(f"<b>{a}</b> {b}", st["headerSmall"]))
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph("! RYGOR POSTĘPOWANIA SĄDOWEGO", st["headerSmall"]))
    ryg = (
        "W przypadku bezskutecznego upływu wyznaczonego terminu, sprawa zostanie niezwłocznie skierowana na drogę "
        "postępowania sądowego bez dodatkowego wezwania, co wiązać się będzie z obciążeniem Dłużnika kosztami "
        "procesu, w tym kosztami zastępstwa procesowego, opłatami sądowymi oraz dalszymi odsetkami."
    )
    story.append(Paragraph(ryg, st["normal"]))
    story.append(Spacer(1, 5 * mm))
    story.append(Paragraph("Z poważaniem,", st["normal"]))
    story.append(Paragraph("Paweł Klimankowicz – Prezes Zarządu", st["normal"]))
    story.append(Paragraph("OMEGA SP. Z O.O.", st["normal"]))
    story.append(Spacer(1, 5 * mm))
    story.append(
        Paragraph(
            f"Dokument wygenerowany elektronicznie w dniu {FOOTER_DAY}. Ważny bez podpisu — art. 78 par. 2 k.c. "
            "| Strona 2/2",
            st["center"],
        )
    )
    doc.build(story)


def main() -> None:
    out = Path(__file__).resolve().parent.parent / "reports" / "wezwanie_WZ-2026-APS001_Pielaszewski.pdf"
    out.parent.mkdir(parents=True, exist_ok=True)
    build_pdf(out)
    print(out)
    # opcjonalnie kopia do folderu sprawy
    case_dir = Path(
        "/Users/prometheus/Desktop/SPRAWY Z DŁUŻNIKAMI/wezwania do zapłaty wysłane/ADAM PIELASZEWSKI"
    )
    if case_dir.is_dir():
        dest = case_dir / "wezwanie_WZ-2026-APS001_Pielaszewski.pdf"
        shutil.copy2(out, dest)
        print("Skopiowano:", dest)


if __name__ == "__main__":
    main()
