// src/lib/utils/generarPdfChecklist.ts

import type { TipoTrabajo } from '@/lib/types/database'
import { TIPOS_TRABAJO_LABELS } from '@/lib/constants/estados'

export interface DatosChecklist {
  idObra: string
  numeroCotizacion?: string
  tipoTrabajo: TipoTrabajo
  clienteNombre: string
  tecnicoNombre: string
  tecnicoINombre?: string
  items: {
    orden: number
    nombre_item: string
    tipo_respuesta: string
    obligatorio: boolean
    respondido: boolean
    respuesta_checkbox: boolean | null
    respuesta_numero: number | null
    respuesta_texto: string | null
    respuesta_dropdown: string | null
    foto_url: string | null
  }[]
  completado_at: string
}

// Carga una imagen desde URL y la devuelve en base64
async function cargarImagenBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    return await new Promise(resolve => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror  = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export async function generarPdfChecklist(datos: DatosChecklist): Promise<Blob> {
  const { jsPDF } = await import('jspdf')
  const autoTable  = (await import('jspdf-autotable')).default

  const doc    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW  = doc.internal.pageSize.getWidth()
  const pageH  = doc.internal.pageSize.getHeight()
  const margin = 15

  // ── ENCABEZADO ──────────────────────────────────────────────────────────────
  doc.setFillColor(30, 90, 160)
  doc.rect(0, 0, pageW, 28, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('PROSOLEMCA', margin, 12)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Informe de Ejecución — Lista de Verificación', margin, 20)

  doc.setFontSize(10)
  doc.text(datos.idObra, pageW - margin, 12, { align: 'right' })
  doc.text(
    new Date(datos.completado_at).toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' }),
    pageW - margin, 20, { align: 'right' }
  )

  // ── DATOS GENERALES ─────────────────────────────────────────────────────────
  doc.setTextColor(40, 40, 40)
  let y = 38

  const filasDatos: [string, string][] = [
    ['Tipo de trabajo', TIPOS_TRABAJO_LABELS[datos.tipoTrabajo] ?? datos.tipoTrabajo],
    ['Cliente',         datos.clienteNombre],
    ['Técnico II',      datos.tecnicoNombre || 'N/A'],
  ]
  if (datos.tecnicoINombre) filasDatos.push(['Técnico I', datos.tecnicoINombre])
  if (datos.numeroCotizacion) filasDatos.push(['N° Cotización', datos.numeroCotizacion])

  const altoDatos = 8 + filasDatos.length * 7
  doc.setFillColor(245, 247, 250)
  doc.roundedRect(margin, y, pageW - margin * 2, altoDatos, 2, 2, 'F')

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 90, 160)
  doc.text('DATOS DE LA ACTIVIDAD', margin + 4, y + 6)

  doc.setTextColor(60, 60, 60)
  filasDatos.forEach(([label, value], i) => {
    const fy = y + 13 + i * 7
    doc.setFont('helvetica', 'bold')
    doc.text(`${label}:`, margin + 4, fy)
    doc.setFont('helvetica', 'normal')
    doc.text(value, margin + 38, fy)
  })

  y += altoDatos + 8

  // ── TABLA DE ÍTEMS (sin fotos) ───────────────────────────────────────────────
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 90, 160)
  doc.text('VERIFICACIONES REALIZADAS', margin, y)
  y += 4

  // Separar ítems con y sin foto
  const itemsSinFoto = datos.items.filter(i => i.tipo_respuesta !== 'FOTO')
  const itemsConFoto = datos.items.filter(i => i.tipo_respuesta === 'FOTO' && i.foto_url)

  const filas = itemsSinFoto.map(item => {
    let respuesta = '—'
    if (item.tipo_respuesta === 'CHECKBOX') {
      respuesta = item.respuesta_checkbox === true ? '✓ SÍ' : item.respuesta_checkbox === false ? '✗ NO' : '—'
    } else if (item.tipo_respuesta === 'NUMERO' && item.respuesta_numero !== null) {
      respuesta = String(item.respuesta_numero)
    } else if (item.tipo_respuesta === 'TEXTO' && item.respuesta_texto) {
      respuesta = item.respuesta_texto.length > 65 ? item.respuesta_texto.slice(0, 62) + '...' : item.respuesta_texto
    } else if (item.tipo_respuesta === 'DROPDOWN' && item.respuesta_dropdown) {
      respuesta = item.respuesta_dropdown
    } else if (item.tipo_respuesta === 'MULTISELECT' && item.respuesta_texto) {
      try {
        const arr: string[] = JSON.parse(item.respuesta_texto)
        respuesta = arr.join(', ')
        if (respuesta.length > 65) respuesta = respuesta.slice(0, 62) + '...'
      } catch { respuesta = item.respuesta_texto }
    }
    return [String(item.orden), item.nombre_item, item.obligatorio ? 'Sí' : 'No', respuesta, item.respondido ? '✓' : '—']
  })

  autoTable(doc, {
    startY: y,
    head: [['#', 'Ítem de verificación', 'Oblig.', 'Respuesta', 'OK']],
    body: filas,
    margin: { left: margin, right: margin },
    styles: { fontSize: 8, cellPadding: 2.5, overflow: 'linebreak' },
    headStyles: { fillColor: [30, 90, 160], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 8,  halign: 'center' },
      1: { cellWidth: 92 },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 53 },
      4: { cellWidth: 10, halign: 'center' },
    },
    alternateRowStyles: { fillColor: [245, 248, 255] },
    didParseCell: (data) => {
      if (data.column.index === 4 && data.cell.raw === '✓') {
        data.cell.styles.textColor = [22, 163, 74]
        data.cell.styles.fontStyle = 'bold'
      }
      if (data.column.index === 3) {
        if (String(data.cell.raw).startsWith('✓')) data.cell.styles.textColor = [22, 163, 74]
        if (String(data.cell.raw).startsWith('✗')) data.cell.styles.textColor = [220, 38, 38]
      }
    },
  })

  // ── SECCIÓN DE FOTOS ─────────────────────────────────────────────────────────
  if (itemsConFoto.length > 0) {
    // Nueva página para las fotos
    doc.addPage()

    // Mini encabezado en página de fotos
    doc.setFillColor(30, 90, 160)
    doc.rect(0, 0, pageW, 16, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(`REGISTRO FOTOGRÁFICO — ${datos.idObra}`, margin, 11)

    let fy = 24
    const fotoW  = 80   // ancho de cada foto en mm
    const fotoH  = 55   // alto de cada foto en mm
    const gapX   = 10   // espacio horizontal entre fotos
    const gapY   = 18   // espacio vertical (para label)
    let col = 0         // columna actual (0 o 1)

    for (const item of itemsConFoto) {
      if (!item.foto_url) continue

      const fx = margin + col * (fotoW + gapX)

      // Label del ítem
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 90, 160)
      const label = `#${item.orden} ${item.nombre_item}`
      doc.text(label.length > 45 ? label.slice(0, 42) + '...' : label, fx, fy)

      // Cargar y dibujar la imagen
      const b64 = await cargarImagenBase64(item.foto_url)
      if (b64) {
        const ext = item.foto_url.split('.').pop()?.toLowerCase() ?? 'jpeg'
        const imgType = ext === 'png' ? 'PNG' : 'JPEG'
        try {
          doc.addImage(b64, imgType, fx, fy + 2, fotoW, fotoH)
          // Borde alrededor de la foto
          doc.setDrawColor(200, 200, 200)
          doc.rect(fx, fy + 2, fotoW, fotoH)
        } catch {
          // Si falla la imagen, dibujar recuadro vacío
          doc.setFillColor(240, 240, 240)
          doc.rect(fx, fy + 2, fotoW, fotoH, 'F')
          doc.setFontSize(7)
          doc.setTextColor(150, 150, 150)
          doc.text('Imagen no disponible', fx + fotoW / 2, fy + 2 + fotoH / 2, { align: 'center' })
        }
      } else {
        doc.setFillColor(240, 240, 240)
        doc.rect(fx, fy + 2, fotoW, fotoH, 'F')
      }

      col++
      if (col >= 2) {
        col = 0
        fy += fotoH + gapY
        // Si no queda espacio para otra fila → nueva página
        if (fy + fotoH + gapY > pageH - 20) {
          doc.addPage()
          doc.setFillColor(30, 90, 160)
          doc.rect(0, 0, pageW, 16, 'F')
          doc.setTextColor(255, 255, 255)
          doc.setFontSize(10)
          doc.setFont('helvetica', 'bold')
          doc.text(`REGISTRO FOTOGRÁFICO — ${datos.idObra} (cont.)`, margin, 11)
          fy = 24
        }
      }
    }
  }

  // ── PIE DE PÁGINA en todas las hojas ────────────────────────────────────────
  const pageCount = (doc.internal as any).getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)

    // Línea separadora
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, pageH - 16, pageW - margin, pageH - 16)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(40, 40, 40)
    doc.text('Departamento de operaciones', pageW / 2, pageH - 11, { align: 'center' })

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text('@ingenieriaenbombeo', pageW / 2, pageH - 6, { align: 'center' })
  }

  return doc.output('blob')
}
