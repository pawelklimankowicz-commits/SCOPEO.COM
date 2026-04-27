#!/usr/bin/env python3
"""PDF wezwania WZ/2026/APS001 — wygląd dopasowany do wzoru wezwanie_WZ-2026-ANOW001_Nowak.pdf:
bordowe nagłówki tabel (biały tekst), tabelaryczne Zestawienie i Dane do przelewu na str. 2,
obramowanie bloku RYGOR."""

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

# Kolory odczytane z pliku wzorcowego (Nowak) — stół nagłówków ~RGB(148,30,30)
BURGUNDY = HexColor("#941e1e")
ROW_ZEB_A = colors.white
ROW_ZEB_B = HexColor("#f3f3f3")
ZEST_H_BG = HexColor("#cfcfcf")
DLUZ_BG = HexColor("#e1e1e1")
RYG_TLO = HexColor("#fff5f5")
RYG_OBR = HexColor("#c41e3a")
FOOT_GRAY = HexColor("#666666")

ARIAL = "/System/Library/Fonts/Supplemental/Arial.ttf"
ARIAL_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
ARIAL_UNICODE = "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"

# --- dane merytoryczne Pielaszewski ---
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


def _register_fonts() -> tuple[str, str]:
    """Body PL (Unicode) + bold nagłówki tabel (Arial Bold — znaki podstawowe PL w nagłówkach)."""
    if not os.path.isfile(ARIAL_UNICODE):
        raise SystemExit("Wymagany Arial Unicode (PL).")
    pdfmetrics.registerFont(TTFont("U", ARIAL_UNICODE))
    b = "UB"
    if os.path.isfile(ARIAL_BOLD):
        pdfmetrics.registerFont(TTFont("UB", ARIAL_BOLD))
    else:
        b = "U"
    return "U", b


def _styles(body_font: str, bold_font: str):
    base = getSampleStyleSheet()
    h = 10.0
    return {
        "normal": ParagraphStyle(
            "n",
            parent=base["Normal"],
            fontName=body_font,
            fontSize=h,
            leading=h + 2,
            alignment=TA_JUSTIFY,
        ),
        "center": ParagraphStyle(
            "c",
            parent=base["Normal"],
            fontName=body_font,
            fontSize=h,
            leading=h + 2,
            alignment=TA_CENTER,
        ),
        "footer": ParagraphStyle(
            "f",
            parent=base["Normal"],
            fontName=body_font,
            fontSize=8.5,
            textColor=FOOT_GRAY,
            leading=10,
            alignment=TA_CENTER,
        ),
        "title": ParagraphStyle(
            "t",
            parent=base["Normal"],
            fontName=body_font,
            fontSize=11.5,
            leading=14,
            alignment=TA_CENTER,
            spaceAfter=2 * mm,
        ),
        "headerSmall": ParagraphStyle(
            "hs",
            parent=base["Normal"],
            fontName=body_font,
            fontSize=h,
            leading=h + 2,
            alignment=TA_LEFT,
        ),
        "right": ParagraphStyle(
            "hr",
            parent=base["Normal"],
            fontName=body_font,
            fontSize=h,
            leading=h + 2,
            alignment=TA_RIGHT,
        ),
    }


def _tstyle_bordowy_tabeli(
    nrows: int,
    font: str,
    bfont: str,
) -> list:
    st = [
        ("FONT", (0, 0), (-1, 0), bfont, 7.5),
        ("FONT", (0, 1), (-1, -1), font, 7.5),
        ("FONTSIZE", (0, 0), (-1, -1), 7.5),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 3),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("BACKGROUND", (0, 0), (-1, 0), BURGUNDY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("INNER_GRID", (0, 0), (-1, -1), 0.25, HexColor("#cccccc")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.black),
    ]
    for r in range(1, nrows):
        bg = ROW_ZEB_A if r % 2 else ROW_ZEB_B
        st.append(("BACKGROUND", (0, r), (-1, r), bg))
    return st


def build_pdf(out: Path) -> None:
    f_pl, f_b = _register_fonts()
    st = _styles(f_pl, f_b)
    margin = 18 * mm
    doc = SimpleDocTemplate(
        str(out),
        pagesize=A4,
        leftMargin=margin,
        rightMargin=margin,
        topMargin=14 * mm,
        bottomMargin=16 * mm,
    )
    story: list = []

    hrow = Table(
        [
            [Paragraph(f"Lipsko, {DOC_TOP}", st["headerSmall"]), Paragraph("OMEGA SP. Z O.O.", st["right"])]
        ],
        colWidths=[100 * mm, 75 * mm],
    )
    hrow.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story.append(hrow)
    story.append(
        Paragraph(
            f"Dokument wygenerowany elektronicznie w dniu {FOOTER_DATE}. "
            f"Ważny bez podpisu — art. 78 § 2 k.c. | Strona 1/2",
            st["footer"],
        )
    )
    story.append(Spacer(1, 3 * mm))
    for line in [
        "ul. Kilińskiego 11, 27-300 Lipsko",
        "NIP: 7812011724",
        f"Sygn.: {SYGN}",
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
    story.append(Spacer(1, 3 * mm))

    # I. Tabela
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
    t1.setStyle(TableStyle(_tstyle_bordowy_tabeli(len(t1_data), f_pl, f_b)))
    story.append(t1)
    story.append(Spacer(1, 3 * mm))

    # II. Tabela
    story.append(Paragraph("II. FAKTURY ZAPŁACONE Z OPÓŹNIENIEM", st["headerSmall"]))
    story.append(Spacer(1, 2 * mm))
    t2_data = [
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
    for a, k, te, p, dn, o, r in ROWS_LATE:
        t2_data.append(
            [a, f"{k} PLN", te, p, dn, f"{o} PLN", f"{r} PLN"],
        )
    t2 = Table(
        t2_data,
        colWidths=[25 * mm, 28 * mm, 32 * mm, 32 * mm, 18 * mm, 30 * mm, 32 * mm],
        repeatRows=1,
    )
    t2.setStyle(TableStyle(_tstyle_bordowy_tabeli(len(t2_data), f_pl, f_b)))
    story.append(t2)
    story.append(Spacer(1, 3 * mm))

    # DŁUŻNIK — szare tło (jak wzorzec: wyeksponowany blok)
    d_box = [
        [
            Paragraph(
                "DŁUŻNIK:<br/>Adam Pielaszewski<br/>ul. Nowe Łubki 67, 09-454 Nowe Łubki<br/>NIP: 7742802187",
                st["headerSmall"],
            )
        ]
    ]
    t_d = Table(d_box, colWidths=[170 * mm])
    t_d.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), DLUZ_BG),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("BOX", (0, 0), (-1, -1), 0.5, HexColor("#bbbbbb")),
            ]
        )
    )
    story.append(t_d)

    story.append(PageBreak())

    # —— Strona 2 ——
    story.append(Paragraph("ZESTAWIENIE NALEŻNOŚCI", st["headerSmall"]))
    story.append(
        Paragraph(
            f"Dokument wygenerowany elektronicznie w dniu {FOOTER_DATE}. "
            f"Ważny bez podpisu — art. 78 § 2 k.c. | Strona 2/2",
            st["footer"],
        )
    )
    story.append(Spacer(1, 3 * mm))

    zest_data = [
        [Paragraph("Należność główna (1 faktura niezapłacona)", st["headerSmall"]), Paragraph(f"{MAIN_350} PLN", st["right"])],
        [
            Paragraph("Odsetki ustawowe za opóźnienie (15,75% p.a., 1 faktura niezapłacona)", st["headerSmall"]),
            Paragraph(f"{ODS_UNPAID} PLN", st["right"]),
        ],
        [
            Paragraph("Rekompensata za koszty odzyskiwania (art. 10, 1 faktura niezapł., kurs NBP)", st["headerSmall"]),
            Paragraph(f"{REK_1} PLN", st["right"]),
        ],
        [
            Paragraph("Odsetki ustawowe za opóźnienie (16,00%/16,75%/15,75% p.a., 19 faktur spóźn.)", st["headerSmall"]),
            Paragraph(f"{ODS_LATE} PLN", st["right"]),
        ],
        [
            Paragraph("Rekompensata za koszty odzyskiwania (art. 10, 19 faktur spóźn., kurs NBP)", st["headerSmall"]),
            Paragraph(f"{REK_19} PLN", st["right"]),
        ],
    ]
    tz = Table(zest_data, colWidths=[130 * mm, 45 * mm])
    ts: list = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("INNER_GRID", (0, 0), (-1, -1), 0.4, colors.white),
        ("BACKGROUND", (0, 0), (-1, 0), ZEST_H_BG),
    ]
    for r in range(1, 5):
        ts.append(
            (
                "BACKGROUND",
                (0, r),
                (-1, r),
                ROW_ZEB_B if r % 2 else ROW_ZEB_A,
            )
        )
    ts.append(
        (
            "LINEABOVE",
            (0, 0),
            (-1, 0),
            1.0,
            colors.black,
        )
    )  # top border
    tz.setStyle(TableStyle(ts))
    story.append(tz)
    tot_row = Table(
        [
            [
                Paragraph(f"<b>ŁĄCZNA KWOTA DO ZAPŁATY {TOTAL} PLN</b>", st["headerSmall"]),
            ]
        ],
        colWidths=[175 * mm],
    )
    tot_row.setStyle(
        TableStyle(
            [
                ("LEFTPADDING", (0, 0), (-1, -1), 3),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("LINEABOVE", (0, 0), (-1, 0), 1.0, colors.black),
            ]
        )
    )
    story.append(tot_row)

    story.append(Spacer(1, 3 * mm))
    story.append(
        Paragraph(
            f"Wyznaczam termin zapłaty pełnej kwoty {TOTAL} PLN do dnia {TERM_PAY} "
            f"({DNI_PO} dni od daty niniejszego wezwania).",
            st["normal"],
        )
    )
    story.append(Spacer(1, 3 * mm))

    # Dane do przelewu — tabela 2 kolumny
    story.append(Paragraph("DANE DO PRZELEWU", st["headerSmall"]))
    story.append(Spacer(1, 2 * mm))
    przelew = [
        [Paragraph("Nazwa odbiorcy", st["headerSmall"]), Paragraph("Omega Sp. z o.o.", st["headerSmall"])],
        [Paragraph("Bank", st["headerSmall"]), Paragraph("BNP Paribas", st["headerSmall"])],
        [Paragraph("Numer rachunku", st["headerSmall"]), Paragraph("PL 08 1600 1404 1779 0433 4000 0001", st["headerSmall"])],
        [Paragraph("Tytułem", st["headerSmall"]), Paragraph(SYGN, st["headerSmall"])],
        [Paragraph("Kwota", st["headerSmall"]), Paragraph(f"{TOTAL} PLN", st["headerSmall"])],
    ]
    tp = Table(przelew, colWidths=[55 * mm, 120 * mm])
    tp.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), ZEST_H_BG),
                ("INNER_GRID", (0, 0), (-1, -1), 0.3, colors.black),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )
    story.append(tp)

    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("Z poważaniem,", st["normal"]))
    story.append(Spacer(1, 2 * mm))
    story.append(Paragraph("Paweł Klimankowicz — Prezes Zarządu", st["headerSmall"]))
    story.append(Paragraph("OMEGA SP. Z O.O.", st["headerSmall"]))
    story.append(Spacer(1, 3 * mm))

    ryg_tekst = (
        "<b>! RYGOR POSTĘPOWANIA SĄDOWEGO</b><br/><br/>"
        "W przypadku bezskutecznego upływu wyznaczonego terminu, sprawa zostanie niezwłocznie skierowana na drogę postępowania "
        "sądowego bez dodatkowego wezwania, co wiązać się będzie z obciążeniem Dłużnika kosztami procesu, w tym kosztami zastępstwa "
        "procesowego, opłatami sądowymi oraz dalszymi odsetkami."
    )
    t_ryg = Table([[Paragraph(ryg_tekst, st["normal"])]], colWidths=[170 * mm])
    t_ryg.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), RYG_TLO),
                ("BOX", (0, 0), (-1, -1), 1.2, RYG_OBR),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(t_ryg)

    doc.build(story)


def main() -> None:
    out = Path(__file__).resolve().parent.parent / "reports" / "wezwanie_WZ-2026-APS001_Pielaszewski.pdf"
    out.parent.mkdir(parents=True, exist_ok=True)
    build_pdf(out)
    print(out)
    for tmp in out.parent.glob("_*_p1.png"):
        tmp.unlink(missing_ok=True)
    for tmp in out.parent.glob("_*_p2.png"):
        tmp.unlink(missing_ok=True)
    case_dir = Path(
        "/Users/prometheus/Desktop/SPRAWY Z DŁUŻNIKAMI/wezwania do zapłaty wysłane/ADAM PIELASZEWSKI"
    )
    if case_dir.is_dir():
        dest = case_dir / "wezwanie_WZ-2026-APS001_Pielaszewski.pdf"
        try:
            shutil.copy2(out, dest)
            print("Skopiowano:", dest)
        except OSError as e:
            print("Kopia do folderu sprawy pominięta (brak uprawnień do zapisu):", e)


if __name__ == "__main__":
    main()
