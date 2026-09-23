export function buildExportFileName(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  return `people-are-interesting-export-${timestamp}.csv`;
}

export async function saveCsvExport(csvText: string): Promise<string | null> {
  const blobUrl = URL.createObjectURL(new Blob([csvText], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');

  anchor.href = blobUrl;
  anchor.download = buildExportFileName();
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  // Safari cancels the download if the blob URL is revoked before the fetch starts.
  setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);

  return null;
}

export function pickCsvFile(): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');

    input.type = 'file';
    input.accept = '.csv,text/csv,text/plain';

    // Chrome only fires `cancel` when the input is attached to the document.
    input.style.display = 'none';
    document.body.appendChild(input);

    const cleanUp = () => {
      input.remove();
    };

    input.addEventListener('cancel', () => {
      cleanUp();
      resolve(null);
    });

    input.addEventListener('change', () => {
      const file = input.files?.[0];
      cleanUp();

      if (!file) {
        resolve(null);
        return;
      }

      file.text().then(resolve, reject);
    });

    input.click();
  });
}
