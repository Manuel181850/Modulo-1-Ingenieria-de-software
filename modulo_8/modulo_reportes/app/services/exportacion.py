import io
import json
from datetime import datetime
from fpdf import FPDF
from fpdf.enums import XPos, YPos
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill
from app.database import get_db_connection


def registrar_historial_reporte(
    id_usuario_solicitante: int,
    tipo_reporte: str,
    formato_exportacion: str,
    parametros_filtro: dict,
):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO rep_historial_reportes_generados
            (id_usuario_solicitante, tipo_reporte, formato_exportacion, parametros_filtro)
        VALUES (%s, %s, %s, %s)
        """,
        (
            id_usuario_solicitante,
            tipo_reporte,
            formato_exportacion,
            json.dumps(parametros_filtro),
        ),
    )
    conn.commit()
    conn.close()


def generar_pdf_casos(casos: list, filtros: dict) -> io.BytesIO:
    pdf = FPDF(orientation="L", unit="mm", format="A4")
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(
        0,
        10,
        "UDINT - Reporte Oficial de Casos de Investigacion",
        new_x=XPos.LMARGIN,
        new_y=YPos.NEXT,
        align="C",
    )
    pdf.set_font("Helvetica", "", 9)
    pdf.cell(
        0,
        6,
        f"Fecha de emision: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        new_x=XPos.LMARGIN,
        new_y=YPos.NEXT,
        align="R",
    )
    pdf.ln(4)

    headers = ["Folio", "Titulo", "Categoria", "Prioridad", "Estatus", "Apertura"]
    widths = [35, 85, 45, 30, 40, 40]

    pdf.set_font("Helvetica", "B", 9)
    pdf.set_fill_color(15, 23, 42)
    pdf.set_text_color(255, 255, 255)
    for h, w in zip(headers, widths):
        pdf.cell(w, 8, h, border=1, fill=True)
    pdf.ln()

    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(0, 0, 0)
    for c in casos:
        fila = [
            str(c.get("numero_caso", "")),
            str(c.get("titulo", ""))[:45],
            str(c.get("categoria_delito", ""))[:22],
            str(c.get("prioridad", "")),
            str(c.get("estatus", "")),
            str(c.get("fecha_apertura", ""))[:16],
        ]
        for val, w in zip(fila, widths):
            pdf.cell(w, 7, val, border=1)
        pdf.ln()

    buffer = io.BytesIO()
    pdf.output(buffer)
    buffer.seek(0)
    return buffer


def generar_excel_casos(casos: list) -> io.BytesIO:
    wb = Workbook()
    ws = wb.active
    ws.title = "Casos UDINT"

    headers = [
        "ID",
        "Numero de Caso",
        "Titulo",
        "Categoria",
        "Prioridad",
        "Estatus",
        "ID Capturista",
        "Fecha Apertura",
    ]
    ws.append(headers)

    header_fill = PatternFill(start_color="0F172A", end_color="0F172A", fill_type="solid")
    header_font = Font(color="FFFFFF", bold=True)
    for cell in ws[1]:
        cell.fill = header_fill
        cell.font = header_font

    for c in casos:
        ws.append(
            [
                c.get("id_caso"),
                c.get("numero_caso"),
                c.get("titulo"),
                c.get("categoria_delito"),
                c.get("prioridad"),
                c.get("estatus"),
                c.get("id_capturista"),
                str(c.get("fecha_apertura", ""))[:19],
            ]
        )

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer