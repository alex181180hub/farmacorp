const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType, PageOrientation } = require('docx');

async function createEbook() {
    console.log("Generando Ebook 'Manual_Farma' en tamaño Media Carta...");

    const readImage = (path) => {
        try {
            return fs.readFileSync(path);
        } catch (e) {
            console.error(`No se pudo leer la imagen: ${path}`);
            return null;
        }
    };

    const imgLogin = readImage('public/manual/login.png');
    const imgDashboard = readImage('public/manual/dashboard.png');
    const imgPos = readImage('public/manual/pos.png');

    // Tamaño Media Carta (Half Letter): 5.5 x 8.5 pulgadas
    // 1 pulgada = 1440 TWIPs
    // Ancho: 5.5 * 1440 = 7920
    // Alto: 8.5 * 1440 = 12240

    // Ajustaremos el tamaño de las imágenes para que quepan en la página más pequeña
    // Ancho útil aprox: 5.5 - 1 (márgenes) = 4.5 pulgadas
    // 4.5 pulgadas * 96 DPI = ~432 px (aprox para referencia, docx usa EMUs o pixels en transformación)
    const imgWidth = 400;
    const imgHeight = 280;

    const doc = new Document({
        styles: {
            paragraphStyles: [
                {
                    id: "Normal",
                    name: "Normal",
                    run: {
                        font: "Calibri",
                        size: 22, // 11pt (size is half-points)
                    },
                    paragraph: {
                        spacing: { line: 276, before: 120, after: 120 }, // 1.2 line spacing
                    },
                },
                {
                    id: "Hosting",
                    name: "Title",
                    basedOn: "Normal",
                    next: "Normal",
                    run: {
                        font: "Calibri Light",
                        size: 48, // 24pt
                        bold: true,
                        color: "2E74B5",
                    },
                }
            ]
        },
        sections: [{
            properties: {
                page: {
                    size: {
                        width: 7920,
                        height: 12240,
                        orientation: PageOrientation.PORTRAIT,
                    },
                    margin: {
                        top: 720,    // 0.5 inch
                        right: 720,  // 0.5 inch
                        bottom: 720, // 0.5 inch
                        left: 720,   // 0.5 inch
                    }
                }
            },
            children: [
                // Portada
                new Paragraph({
                    text: "Manual_Farma",
                    heading: HeadingLevel.TITLE,
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 2000, after: 300 }
                }),
                new Paragraph({
                    text: "Guía Oficial de Usuario",
                    alignment: AlignmentType.CENTER,
                    run: {
                        size: 32, // 16pt
                        color: "555555"
                    },
                    spacing: { after: 2000 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "Sistema de Gestión Farmacorp",
                            bold: true,
                            size: 28
                        }),
                    ],
                    alignment: AlignmentType.CENTER,
                }),

                // Salto de página para empezar contenido
                new Paragraph({
                    text: "",
                    pageBreakBefore: true
                }),

                // SECCION 1
                new Paragraph({
                    text: "1. Ingreso al Sistema",
                    heading: HeadingLevel.HEADING_1,
                    run: { size: 36, color: "2E74B5", bold: true }, // 18pt
                    spacing: { before: 200, after: 200 }
                }),
                new Paragraph({
                    children: [new TextRun("Para acceder, ingrese sus credenciales en la pantalla inicial.")],
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Usuario: admin", bold: true, break: 1 }),
                        new TextRun({ text: "Contraseña: admin123", bold: true, break: 1 }),
                    ],
                    spacing: { after: 200 }
                }),
                imgLogin ? new Paragraph({
                    children: [
                        new ImageRun({
                            data: imgLogin,
                            transformation: { width: imgWidth, height: imgHeight }
                        })
                    ],
                    alignment: AlignmentType.CENTER
                }) : new Paragraph(""),

                // SECCION 2
                new Paragraph({
                    text: "2. Dashboard",
                    heading: HeadingLevel.HEADING_1,
                    run: { size: 36, color: "2E74B5", bold: true },
                    spacing: { before: 400, after: 200 },
                    // pageBreakBefore: true // Opcional
                }),
                new Paragraph({
                    text: "Aquí encontrará un resumen ejecutivo:"
                }),
                new Paragraph({
                    text: "• Ventas del Día y Caja Actual.",
                    bullet: { level: 0 }
                }),
                new Paragraph({
                    text: "• Productos con stock bajo.",
                    bullet: { level: 0 }
                }),
                new Paragraph({
                    text: "• Gráficos de tendencias.",
                    bullet: { level: 0 }
                }),
                new Paragraph({ text: "" }),
                imgDashboard ? new Paragraph({
                    children: [
                        new ImageRun({
                            data: imgDashboard,
                            transformation: { width: imgWidth, height: imgHeight }
                        })
                    ],
                    alignment: AlignmentType.CENTER
                }) : new Paragraph(""),

                // SECCION 3
                new Paragraph({
                    text: "3. Ventas (POS)",
                    heading: HeadingLevel.HEADING_1,
                    run: { size: 36, color: "2E74B5", bold: true },
                    spacing: { before: 400, after: 200 },
                    // pageBreakBefore: true
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Pasos para vender:", bold: true }),
                    ]
                }),
                new Paragraph({ text: "1. Busque el producto.", bullet: { level: 0 } }),
                new Paragraph({ text: "2. Agréguelo al carrito.", bullet: { level: 0 } }),
                new Paragraph({ text: "3. Confirme el pago.", bullet: { level: 0 } }),
                new Paragraph({ text: "" }),
                imgPos ? new Paragraph({
                    children: [
                        new ImageRun({
                            data: imgPos,
                            transformation: { width: imgWidth, height: imgHeight }
                        })
                    ],
                    alignment: AlignmentType.CENTER
                }) : new Paragraph(""),
            ]
        }]
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync("Manual_Farma.docx", buffer);
    console.log("¡Hecho! Ebook guardado como Manual_Farma.docx");
}

createEbook();
