import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from "docx";
import { saveAs } from "file-saver";
import type { Language } from "@shared/schema";

export type ExportFormat = "pdf" | "docx" | "both";

async function loadIPAFont(): Promise<string | null> {
  try {
    const fontUrl = 'https://fonts.gstatic.com/s/notosans/v42/o-0mIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjcz6L1SoM-jCpoiyD9A99d.ttf';
    const response = await fetch(fontUrl);
    const arrayBuffer = await response.arrayBuffer();
    
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch (error) {
    console.error('Failed to load IPA font:', error);
    return null;
  }
}

function createPhonologyChart(doc: jsPDF, consonants: string[], vowels: string[], startY: number, fontName: string): number {
  let yPos = startY;
  
  doc.setFontSize(13);
  doc.setFont(fontName, 'normal');
  doc.text("Consonant Inventory", 20, yPos);
  yPos += 8;
  
  doc.setFont(fontName, 'normal');
  doc.setFontSize(9);
  
  if (consonants.length > 0) {
    const consonantRows: string[][] = [];
    const itemsPerRow = 10;
    for (let i = 0; i < consonants.length; i += itemsPerRow) {
      consonantRows.push(consonants.slice(i, i + itemsPerRow));
    }
    
    autoTable(doc, {
      startY: yPos,
      body: consonantRows.map(row => row.map(c => c || '')),
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 3,
        halign: 'center',
      },
      columnStyles: Object.fromEntries(
        Array.from({ length: itemsPerRow }, (_, i) => [i, { cellWidth: 16 }])
      ),
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 12;
  }
  
  doc.setFontSize(13);
  doc.setFont(fontName, 'normal');
  doc.text("Vowel Inventory", 20, yPos);
  yPos += 8;
  
  doc.setFont(fontName, 'normal');
  doc.setFontSize(9);
  
  if (vowels.length > 0) {
    const vowelRows: string[][] = [];
    const itemsPerRow = 8;
    for (let i = 0; i < vowels.length; i += itemsPerRow) {
      vowelRows.push(vowels.slice(i, i + itemsPerRow));
    }
    
    autoTable(doc, {
      startY: yPos,
      body: vowelRows.map(row => row.map(v => v || '')),
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 3,
        halign: 'center',
      },
      columnStyles: Object.fromEntries(
        Array.from({ length: itemsPerRow }, (_, i) => [i, { cellWidth: 20 }])
      ),
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 12;
  }
  
  return yPos;
}

function addGrammarTables(doc: jsPDF, language: Language, startY: number, fontName: string): number {
  let yPos = startY;
  
  if (language.grammar?.conjugations && language.grammar.conjugations.length > 0) {
    doc.setFontSize(13);
    doc.setFont(fontName, 'normal');
    doc.text("Verb Conjugations", 20, yPos);
    yPos += 8;
    
    doc.setFont(fontName, 'normal');
    
    for (const conjugation of language.grammar.conjugations.slice(0, 2)) {
      doc.setFontSize(10);
      doc.setFont(fontName, 'normal');
      doc.text(`"${conjugation.verb || ''}" (${conjugation.translation || ''})`, 20, yPos);
      yPos += 6;
      
      const tableData: string[][] = conjugation.forms.map(form => [
        form.tense || '—',
        form.person || '—',
        form.number || '—',
        form.form || '—'
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Tense', 'Person', 'Number', 'Form']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [52, 152, 219], fontSize: 9 },
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 35 },
          2: { cellWidth: 35 },
          3: { cellWidth: 45 },
        },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
  }
  
  if (language.grammar?.declensions && language.grammar.declensions.length > 0) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(13);
    doc.setFont(fontName, 'normal');
    doc.text("Noun Declensions", 20, yPos);
    yPos += 8;
    
    doc.setFont(fontName, 'normal');
    
    for (const declension of language.grammar.declensions.slice(0, 2)) {
      doc.setFontSize(10);
      doc.setFont(fontName, 'normal');
      const genderText = declension.gender ? ` (${declension.gender})` : '';
      doc.text(`"${declension.noun || ''}" (${declension.translation || ''})${genderText}`, 20, yPos);
      yPos += 6;
      
      const tableData: string[][] = declension.forms.map(form => [
        form.case || '—',
        form.number || '—',
        form.form || '—'
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Case', 'Number', 'Form']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [52, 152, 219], fontSize: 9 },
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 45 },
          2: { cellWidth: 55 },
        },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
  }
  
  return yPos;
}

export async function exportLanguageToPDF(language: Language): Promise<void> {
  const doc = new jsPDF();
  
  let fontName = 'helvetica';
  const base64Font = await loadIPAFont();
  if (base64Font) {
    try {
      doc.addFileToVFS('NotoSans-Regular.ttf', base64Font);
      doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
      fontName = 'NotoSans';
    } catch (error) {
      console.error('Failed to add font to PDF, using default font:', error);
    }
  } else {
    console.warn('IPA font could not be loaded, using default font. IPA characters may not render correctly.');
  }
  
  doc.setFont(fontName, 'normal');
  
  let yPos = 20;
  
  doc.setFontSize(26);
  doc.setFont(fontName, 'normal');
  doc.text(language.name, 20, yPos);
  yPos += 12;
  
  doc.setFontSize(11);
  doc.setFont(fontName, 'normal');
  doc.setTextColor(100);
  doc.text("Constructed Language Reference Guide", 20, yPos);
  yPos += 18;
  
  doc.setTextColor(0);
  doc.setFontSize(16);
  doc.setFont(fontName, 'normal');
  doc.text("Overview", 20, yPos);
  yPos += 8;
  
  doc.setFontSize(10);
  doc.setFont(fontName, 'normal');
  const descLines = doc.splitTextToSize(language.description, 170);
  doc.text(descLines, 20, yPos);
  yPos += descLines.length * 5 + 10;
  
  if (language.influences && language.influences.length > 0) {
    doc.setFontSize(13);
    doc.setFont(fontName, 'normal');
    doc.text("Language Influences", 20, yPos);
    yPos += 6;
    doc.setFontSize(10);
    doc.setFont(fontName, 'normal');
    doc.text(language.influences.join(", "), 20, yPos);
    yPos += 12;
  }
  
  if (language.parentId) {
    doc.setFontSize(10);
    doc.setFont(fontName, 'normal');
    doc.text("This language evolved from a parent language", 20, yPos);
    yPos += 10;
  }
  
  doc.addPage();
  yPos = 20;
  
  doc.setFontSize(20);
  doc.setFont(fontName, 'normal');
  doc.text("Phonology", 20, yPos);
  yPos += 12;
  
  if (language.phonology) {
    yPos = createPhonologyChart(
      doc,
      language.phonology.consonants || [],
      language.phonology.vowels || [],
      yPos,
      fontName
    );
    
    doc.setFontSize(13);
    doc.setFont(fontName, 'normal');
    doc.text("Syllable Structure", 20, yPos);
    yPos += 6;
    doc.setFontSize(10);
    doc.setFont(fontName, 'normal');
    doc.text(language.phonology.syllableStructure || "Not specified", 20, yPos);
    yPos += 10;
    
    doc.setFontSize(13);
    doc.setFont(fontName, 'normal');
    doc.text("Stress Pattern", 20, yPos);
    yPos += 6;
    doc.setFontSize(10);
    doc.setFont(fontName, 'normal');
    doc.text(language.phonology.stressPattern || "Not specified", 20, yPos);
    yPos += 10;
    
    if (language.phonology.phoneticNotes) {
      doc.setFontSize(13);
      doc.setFont(fontName, 'normal');
      doc.text("Phonetic Notes", 20, yPos);
      yPos += 6;
      doc.setFontSize(9);
      doc.setFont(fontName, 'normal');
      const notesLines = doc.splitTextToSize(language.phonology.phoneticNotes, 170);
      doc.text(notesLines, 20, yPos);
      yPos += notesLines.length * 5 + 10;
    }
    
    if (language.phonology.evolutionRules && language.phonology.evolutionRules.length > 0) {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(13);
      doc.setFont(fontName, 'normal');
      doc.text("Sound Change Rules (from parent language)", 20, yPos);
      yPos += 8;
      
      doc.setFontSize(9);
      doc.setFont(fontName, 'normal');
      
      language.phonology.evolutionRules.forEach((rule, index) => {
        doc.text(`${index + 1}. ${rule.rule}`, 25, yPos);
        yPos += 5;
        doc.setFont(fontName, 'normal');
        doc.text(`   ${rule.description}`, 25, yPos);
        yPos += 5;
        if (rule.examples && rule.examples.length > 0) {
          doc.setFont(fontName, 'normal');
          const exampleStrs = rule.examples.map(ex => `${ex.parent} → ${ex.child}`);
          doc.text(`   Examples: ${exampleStrs.join(', ')}`, 25, yPos);
          yPos += 6;
        }
        doc.setFont(fontName, 'normal');
      });
      
      yPos += 6;
    }
  }
  
  doc.addPage();
  yPos = 20;
  
  doc.setFontSize(20);
  doc.setFont(fontName, 'normal');
  doc.text("Grammar", 20, yPos);
  yPos += 12;
  
  if (language.grammar) {
    doc.setFontSize(13);
    doc.setFont(fontName, 'normal');
    doc.text("Basic Structure", 20, yPos);
    yPos += 6;
    
    doc.setFontSize(10);
    doc.setFont(fontName, 'normal');
    doc.text(`Word Order: ${language.grammar.wordOrder || "Not specified"}`, 20, yPos);
    yPos += 5;
    doc.text(`Articles: ${language.grammar.articles || "Not specified"}`, 20, yPos);
    yPos += 5;
    doc.text(`Pluralization: ${language.grammar.pluralization || "Not specified"}`, 20, yPos);
    yPos += 12;
    
    yPos = addGrammarTables(doc, language, yPos, fontName);
  }
  
  if (language.syntax) {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(20);
    doc.setFont(fontName, 'normal');
    doc.text("Syntax", 20, yPos);
    yPos += 12;
    
    if (language.syntax.questionFormation) {
      doc.setFontSize(13);
      doc.setFont(fontName, 'normal');
      doc.text("Question Formation", 20, yPos);
      yPos += 6;
      doc.setFontSize(9);
      doc.setFont(fontName, 'normal');
      const qLines = doc.splitTextToSize(language.syntax.questionFormation, 170);
      doc.text(qLines, 20, yPos);
      yPos += qLines.length * 5 + 8;
    }
    
    if (language.syntax.negation) {
      doc.setFontSize(13);
      doc.setFont(fontName, 'normal');
      doc.text("Negation", 20, yPos);
      yPos += 6;
      doc.setFontSize(9);
      doc.setFont(fontName, 'normal');
      const negLines = doc.splitTextToSize(language.syntax.negation, 170);
      doc.text(negLines, 20, yPos);
      yPos += negLines.length * 5 + 8;
    }
    
    if (language.syntax.subordination) {
      doc.setFontSize(13);
      doc.setFont(fontName, 'normal');
      doc.text("Subordination", 20, yPos);
      yPos += 6;
      doc.setFontSize(9);
      doc.setFont(fontName, 'normal');
      const subLines = doc.splitTextToSize(language.syntax.subordination, 170);
      doc.text(subLines, 20, yPos);
      yPos += subLines.length * 5 + 8;
    }
  }
  
  if (language.vocabulary && language.vocabulary.length > 0) {
    doc.addPage();
    doc.setFontSize(20);
    doc.setFont(fontName, 'normal');
    doc.text("Vocabulary", 20, 20);
    yPos = 30;
    
    doc.setFontSize(10);
    doc.setFont(fontName, 'normal');
    doc.text(`Total words: ${language.vocabulary.length}`, 20, yPos);
    yPos += 10;
    
    autoTable(doc, {
      startY: yPos,
      head: [["Word", "Translation", "IPA", "Part of Speech", "Etymology"]],
      body: language.vocabulary.map((v) => [
        v.word,
        v.translation,
        v.pronunciation || "—",
        v.partOfSpeech,
        v.etymology || "—",
      ]),
      theme: "striped",
      headStyles: { 
        fillColor: [52, 152, 219],
        fontSize: 9,
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 35 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25 },
        4: { cellWidth: 'auto' },
      },
    });
  }
  
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  doc.save(`${language.name.replace(/\s+/g, "_")}_Guide.pdf`);
}

export async function exportLanguageToDOCX(language: Language): Promise<void> {
  const sections: (Paragraph | Table)[] = [];
  
  sections.push(
    new Paragraph({
      text: language.name,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Constructed Language Reference Guide",
          italics: true,
          color: "666666",
        }),
      ],
      spacing: { after: 400 },
    }),
    new Paragraph({
      text: "Overview",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
    }),
    new Paragraph({
      text: language.description,
      spacing: { after: 200 },
    })
  );
  
  if (language.influences && language.influences.length > 0) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Language Influences: ",
            bold: true,
          }),
          new TextRun({
            text: language.influences.join(", "),
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }
  
  if (language.parentId) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "This language evolved from a parent language",
            italics: true,
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }
  
  sections.push(
    new Paragraph({
      text: "Phonology",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 100 },
    })
  );
  
  if (language.phonology) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Consonants: ",
            bold: true,
          }),
          new TextRun({
            text: (language.phonology.consonants || []).join(", "),
          }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "Vowels: ",
            bold: true,
          }),
          new TextRun({
            text: (language.phonology.vowels || []).join(", "),
          }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "Syllable Structure: ",
            bold: true,
          }),
          new TextRun({
            text: language.phonology.syllableStructure || "Not specified",
          }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "Stress Pattern: ",
            bold: true,
          }),
          new TextRun({
            text: language.phonology.stressPattern || "Not specified",
          }),
        ],
        spacing: { after: 100 },
      })
    );
    
    if (language.phonology.phoneticNotes) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Phonetic Notes: ",
              bold: true,
            }),
            new TextRun({
              text: language.phonology.phoneticNotes,
            }),
          ],
          spacing: { after: 200 },
        })
      );
    }
    
    if (language.phonology.evolutionRules && language.phonology.evolutionRules.length > 0) {
      sections.push(
        new Paragraph({
          text: "Sound Change Rules (from parent language)",
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        })
      );
      
      language.phonology.evolutionRules.forEach((rule, index) => {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${index + 1}. ${rule.rule}`,
                bold: true,
              }),
            ],
            spacing: { after: 50 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `   ${rule.description}`,
                italics: true,
              }),
            ],
            spacing: { after: 50 },
          })
        );
        
        if (rule.examples && rule.examples.length > 0) {
          const exampleStrs = rule.examples.map(ex => `${ex.parent} → ${ex.child} (${ex.meaning})`);
          sections.push(
            new Paragraph({
              text: `   Examples: ${exampleStrs.join(', ')}`,
              spacing: { after: 100 },
            })
          );
        }
      });
    }
  }
  
  sections.push(
    new Paragraph({
      text: "Grammar",
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 100 },
    })
  );
  
  if (language.grammar) {
    sections.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Word Order: ",
            bold: true,
          }),
          new TextRun({
            text: language.grammar.wordOrder || "Not specified",
          }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "Articles: ",
            bold: true,
          }),
          new TextRun({
            text: language.grammar.articles || "Not specified",
          }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "Pluralization: ",
            bold: true,
          }),
          new TextRun({
            text: language.grammar.pluralization || "Not specified",
          }),
        ],
        spacing: { after: 200 },
      })
    );
    
    if (language.grammar.conjugations && language.grammar.conjugations.length > 0) {
      sections.push(
        new Paragraph({
          text: "Verb Conjugations",
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        })
      );
      
      for (const conjugation of language.grammar.conjugations.slice(0, 2)) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `"${conjugation.verb}" (${conjugation.translation})`,
                italics: true,
              }),
            ],
            spacing: { after: 100 },
          })
        );
        
        const rows: TableRow[] = [
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Tense", bold: true })] })],
                width: { size: 25, type: WidthType.PERCENTAGE },
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Person", bold: true })] })],
                width: { size: 25, type: WidthType.PERCENTAGE },
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Number", bold: true })] })],
                width: { size: 25, type: WidthType.PERCENTAGE },
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Form", bold: true })] })],
                width: { size: 25, type: WidthType.PERCENTAGE },
              }),
            ],
          }),
        ];
        
        conjugation.forms.forEach(form => {
          rows.push(
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph(form.tense || "—")] }),
                new TableCell({ children: [new Paragraph(form.person || "—")] }),
                new TableCell({ children: [new Paragraph(form.number || "—")] }),
                new TableCell({ children: [new Paragraph(form.form || "—")] }),
              ],
            })
          );
        });
        
        sections.push(
          new Table({
            rows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
          new Paragraph({ text: "", spacing: { after: 200 } })
        );
      }
    }
    
    if (language.grammar.declensions && language.grammar.declensions.length > 0) {
      sections.push(
        new Paragraph({
          text: "Noun Declensions",
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        })
      );
      
      for (const declension of language.grammar.declensions.slice(0, 2)) {
        const genderText = declension.gender ? ` (${declension.gender})` : '';
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `"${declension.noun}" (${declension.translation})${genderText}`,
                italics: true,
              }),
            ],
            spacing: { after: 100 },
          })
        );
        
        const rows: TableRow[] = [
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Case", bold: true })] })],
                width: { size: 33, type: WidthType.PERCENTAGE },
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Number", bold: true })] })],
                width: { size: 33, type: WidthType.PERCENTAGE },
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Form", bold: true })] })],
                width: { size: 34, type: WidthType.PERCENTAGE },
              }),
            ],
          }),
        ];
        
        declension.forms.forEach(form => {
          rows.push(
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph(form.case || "—")] }),
                new TableCell({ children: [new Paragraph(form.number || "—")] }),
                new TableCell({ children: [new Paragraph(form.form || "—")] }),
              ],
            })
          );
        });
        
        sections.push(
          new Table({
            rows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          }),
          new Paragraph({ text: "", spacing: { after: 200 } })
        );
      }
    }
  }
  
  if (language.syntax) {
    sections.push(
      new Paragraph({
        text: "Syntax",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 100 },
      })
    );
    
    if (language.syntax.questionFormation) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Question Formation: ",
              bold: true,
            }),
            new TextRun({
              text: language.syntax.questionFormation,
            }),
          ],
          spacing: { after: 100 },
        })
      );
    }
    
    if (language.syntax.negation) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Negation: ",
              bold: true,
            }),
            new TextRun({
              text: language.syntax.negation,
            }),
          ],
          spacing: { after: 100 },
        })
      );
    }
    
    if (language.syntax.subordination) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Subordination: ",
              bold: true,
            }),
            new TextRun({
              text: language.syntax.subordination,
            }),
          ],
          spacing: { after: 200 },
        })
      );
    }
  }
  
  if (language.vocabulary && language.vocabulary.length > 0) {
    sections.push(
      new Paragraph({
        text: "Vocabulary",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 100 },
      }),
      new Paragraph({
        text: `Total words: ${language.vocabulary.length}`,
        spacing: { after: 200 },
      })
    );
    
    const vocabRows: TableRow[] = [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Word", bold: true })] })],
            width: { size: 20, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Translation", bold: true })] })],
            width: { size: 20, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "IPA", bold: true })] })],
            width: { size: 20, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Part of Speech", bold: true })] })],
            width: { size: 20, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Etymology", bold: true })] })],
            width: { size: 20, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
    ];
    
    language.vocabulary.forEach((v) => {
      vocabRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(v.word)] }),
            new TableCell({ children: [new Paragraph(v.translation)] }),
            new TableCell({ children: [new Paragraph(v.pronunciation || "—")] }),
            new TableCell({ children: [new Paragraph(v.partOfSpeech)] }),
            new TableCell({ children: [new Paragraph(v.etymology || "—")] }),
          ],
        })
      );
    });
    
    sections.push(
      new Table({
        rows: vocabRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
      })
    );
  }
  
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: sections,
      },
    ],
  });
  
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${language.name.replace(/\s+/g, "_")}_Guide.docx`);
}

export async function exportLanguage(language: Language, format: ExportFormat): Promise<void> {
  if (format === "pdf" || format === "both") {
    await exportLanguageToPDF(language);
  }
  
  if (format === "docx" || format === "both") {
    await exportLanguageToDOCX(language);
  }
}
