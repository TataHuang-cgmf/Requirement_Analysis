
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
  BorderStyle,
  AlignmentType,
  ShadingType,
  VerticalAlign
} from 'https://cdn.jsdelivr.net/npm/docx@8.5.0/+esm';

export async function downloadAsDocx(markdown: string, filename: string) {
  const lines = markdown.split('\n');
  const children: any[] = [];
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line && !lines[i].startsWith('|')) {
      i++;
      continue;
    }

    // 1. Headers
    if (line.startsWith('# ')) {
      children.push(new Paragraph({
        text: line.replace('# ', '').toUpperCase(),
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      }));
      i++;
    } else if (line.startsWith('## ')) {
      children.push(new Paragraph({
        text: line.replace('## ', ''),
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
      }));
      i++;
    } else if (line.startsWith('### ')) {
      children.push(new Paragraph({
        text: line.replace('### ', ''),
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 },
      }));
      i++;
    } 
    // 2. Tables (Heavily used in Requirements Analyst Output)
    else if (line.startsWith('|')) {
      const tableRows: TableRow[] = [];
      let isHeaderRow = true;

      while (i < lines.length && (lines[i].trim().startsWith('|') || lines[i].trim() === "")) {
        const rowContent = lines[i].trim();
        
        // Skip separators or empty lines inside table block
        if (!rowContent.startsWith('|') || rowContent.includes('---')) {
          i++;
          continue;
        }

        const cells = rowContent
          .split('|')
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
          .map(c => c.trim());

        if (cells.length > 0) {
          tableRows.push(new TableRow({
            children: cells.map(cellText => new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ 
                  text: cellText, 
                  bold: isHeaderRow,
                  size: 20, // 10pt
                  font: "Microsoft JhengHei"
                })],
                alignment: isHeaderRow ? AlignmentType.CENTER : AlignmentType.LEFT,
              })],
              shading: isHeaderRow ? { fill: "4472C4", type: ShadingType.CLEAR, color: "FFFFFF" } : undefined,
              width: { size: 100 / cells.length, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER,
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
            })),
          }));
          isHeaderRow = false;
        }
        i++;
      }

      if (tableRows.length > 0) {
        children.push(new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: "2F5496" },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: "2F5496" },
            left: { style: BorderStyle.SINGLE, size: 4, color: "2F5496" },
            right: { style: BorderStyle.SINGLE, size: 4, color: "2F5496" },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "A6A6A6" },
            insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "A6A6A6" },
          },
        }));
        children.push(new Paragraph({ text: "", spacing: { after: 200 } }));
      }
    } 
    // 3. Lists
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      children.push(new Paragraph({
        text: line.substring(2),
        bullet: { level: 0 },
        spacing: { after: 100 },
      }));
      i++;
    }
    // 4. Bold or emphasis text treatment (Basic)
    else if (line.startsWith('**') && line.endsWith('**')) {
        children.push(new Paragraph({
            children: [new TextRun({ text: line.replace(/\*\*/g, ''), bold: true })],
            spacing: { after: 120 },
        }));
        i++;
    }
    // 5. Default Paragraph
    else {
      children.push(new Paragraph({
        children: [new TextRun({ text: line, font: "Microsoft JhengHei" })],
        spacing: { after: 120 },
      }));
      i++;
    }
  }

  const doc = new Document({
    title: "Requirement Analysis Specification",
    creator: "RAE System",
    description: "Generated SRS Document",
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440, // 1 inch
            right: 1440,
            bottom: 1440,
            left: 1440,
          }
        }
      },
      children: children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.docx`;
  a.click();
  window.URL.revokeObjectURL(url);
}
