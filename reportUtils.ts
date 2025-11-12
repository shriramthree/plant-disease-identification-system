export interface ParsedReportData {
    plantType: string;
    detectedDisease: string;
    confidenceScore: string;
    estimatedCO2e: string;
    estimatedInputTokens: string;
    estimatedOutputTokens: string;
}

const parseField = (markdown: string, fieldName: string): string => {
    const regex = new RegExp(`\\*\\*${fieldName}:\\*\\*\\s*(.*)`);
    const match = markdown.match(regex);
    return match ? match[1].trim() : "N/A";
};

export function parseReportMarkdown(markdown: string): ParsedReportData {
    return {
        plantType: parseField(markdown, "Plant Type"),
        detectedDisease: parseField(markdown, "Detected Disease"),
        confidenceScore: parseField(markdown, "Confidence Score"),
        estimatedCO2e: parseField(markdown, "Estimated CO2e"),
        estimatedInputTokens: parseField(markdown, "Estimated Input Tokens"),
        estimatedOutputTokens: parseField(markdown, "Estimated Output Tokens"),
    };
}

export function generateReportCsv(markdown: string) {
    const data = parseReportMarkdown(markdown);
    
    const headers = [
        "Analysis Date",
        "Plant Type",
        "Detected Disease",
        "Confidence Score",
        "Estimated CO2e (g)",
        "Estimated Input Tokens",
        "Estimated Output Tokens"
    ];

    const cleanedCO2e = data.estimatedCO2e.replace(/g CO2e/i, '').replace(/less than/i, '<').trim();

    const rows = [
        new Date().toISOString(),
        data.plantType,
        data.detectedDisease,
        data.confidenceScore,
        cleanedCO2e,
        data.estimatedInputTokens,
        data.estimatedOutputTokens
    ];

    const escapeCsvField = (field: string) => {
        if (/[",\n\r]/.test(field)) {
            return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
    };

    const csvContent = [
        headers.map(escapeCsvField).join(','),
        rows.map(escapeCsvField).join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const filename = `plant-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function renderReportContent(markdown: string): string {
    const escapeHtml = (unsafe: string) => 
        unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");

    const processInlineFormatting = (text: string) => {
        const links: string[] = [];
        const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
        let textWithPlaceholders = text.replace(linkRegex, (match, linkText, url) => {
            const anchor = `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-green-600 hover:underline font-semibold">${escapeHtml(linkText)}</a>`;
            links.push(anchor);
            return `__LINK_${links.length - 1}__`;
        });

        let safeText = escapeHtml(textWithPlaceholders);
        safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        links.forEach((link, index) => {
            safeText = safeText.replace(escapeHtml(`__LINK_${index}__`), link);
        });
        return safeText;
    };

    const blocks = markdown.trim().split(/\n/g);
    const processedHtml = [];
    let listItems = [];

    for (const block of blocks) {
        const trimmedBlock = block.trim();
        if (trimmedBlock.startsWith('- ')) {
            listItems.push(trimmedBlock.substring(2).trim());
            continue;
        }

        if (listItems.length > 0) {
            let listHtml = '<ul class="list-disc pl-6 space-y-2">';
            for (const item of listItems) {
                listHtml += `<li>${processInlineFormatting(item)}</li>`;
            }
            listHtml += '</ul>';
            processedHtml.push(listHtml);
            listItems = []; 
        }

        if (trimmedBlock === '') {
            continue;
        }
        
        if (trimmedBlock.match(/^\*\*(.*?)\*\*$/)) {
            const headerText = trimmedBlock.substring(2, trimmedBlock.length - 2);
            processedHtml.push(`<h2 class="font-bold text-gray-800 mt-8 mb-4">${escapeHtml(headerText)}</h2>`);
        } 
        else if (trimmedBlock === '---') {
            processedHtml.push('<hr class="my-6 border-gray-200">');
        }
        else {
            processedHtml.push(`<p>${processInlineFormatting(trimmedBlock)}</p>`);
        }
    }

    if (listItems.length > 0) {
        let listHtml = '<ul class="list-disc pl-6 space-y-2">';
        for (const item of listItems) {
            listHtml += `<li>${processInlineFormatting(item)}</li>`;
        }
        listHtml += '</ul>';
        processedHtml.push(listHtml);
    }

    return processedHtml.join('');
}


export function generateReportHtml(reportMarkdown: string, imageUrl: string | null): string {
  const reportContent = renderReportContent(reportMarkdown);

  const imageElement = imageUrl 
    ? `<div class="w-32 h-32 sm:w-40 sm:h-40 ml-auto sm:ml-0 flex-shrink-0 order-first sm:order-last">
         <img src="${imageUrl}" alt="Uploaded Leaf Image" class="w-full h-full object-cover rounded-md border-2 border-gray-300" title="Uploaded Leaf">
       </div>`
    : '';

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Plant Disease Diagnostic Report</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" integrity="sha512-GsLlZN/3F2ErC5ifS5QtgpiJtWd43JWSuIgh7mbzZ8zBps+dvLusV+eNQATqgA/HdeKFVgA5v3S/cIrLF7QnIg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
      body {
        font-family: 'Inter', sans-serif;
        background-color: #f3f4f6;
        color: #1f2937;
      }
      main p, main ul {
        margin-bottom: 1rem;
      }
      .no-print {
        display: block;
      }
      @media print {
        .no-print {
          display: none !important;
        }
        body {
          background-color: #fff;
          padding: 0;
        }
        .printable-area {
          box-shadow: none !import ant;
          margin: 0;
          max-width: 100%;
          border-radius: 0;
        }
      }
    </style>
  </head>
  <body class="p-4 sm:p-8">
    <div class="max-w-5xl mx-auto">
        <div class="flex justify-end mb-4 no-print">
            <button id="download-btn" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors inline-flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Report (PDF)
            </button>
        </div>
        <div id="report-container" class="bg-white rounded-lg shadow-xl overflow-hidden printable-area">
          <div class="p-8">
            <header class="flex flex-col sm:flex-row justify-between items-start gap-6 mb-6 pb-6 border-b border-gray-200">
              <div>
                <h1 class="text-3xl font-bold text-green-600">Plant Disease Diagnostic Report</h1>
              </div>
              ${imageElement}
            </header>
            <main class="text-lg leading-relaxed font-sans">
              ${reportContent}
            </main>
          </div>
        </div>
    </div>
    <script>
      document.getElementById('download-btn').addEventListener('click', function() {
        const button = this;
        const reportContainer = document.getElementById('report-container');
        
        const opt = {
          margin:       [0.5, 0.5, 0.5, 0.5], // top, left, bottom, right in inches
          filename:     'plant-disease-diagnostic-report.pdf',
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
          jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        // Temporarily hide the button to prevent it from being in the PDF
        button.style.display = 'none';

        html2pdf().from(reportContainer).set(opt).save().then(() => {
          // Show the button again after the PDF is generated and saved
          button.style.display = 'inline-flex';
        }).catch(err => {
            console.error('PDF generation failed:', err);
            // Ensure button is shown even if there is an error
            button.style.display = 'inline-flex';
        });
      });
    </script>
  </body>
  </html>
  `;
}
