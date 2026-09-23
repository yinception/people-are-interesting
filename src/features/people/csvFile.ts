import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export function buildExportFileName(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  return `people-are-interesting-export-${timestamp}.csv`;
}

// Returns the saved file path when the share sheet is unavailable, otherwise null.
export async function saveCsvExport(csvText: string): Promise<string | null> {
  const documentDirectory = FileSystem.documentDirectory;

  if (!documentDirectory) {
    throw new Error('Document directory is unavailable on this device.');
  }

  const fileUri = `${documentDirectory}${buildExportFileName()}`;

  await FileSystem.writeAsStringAsync(fileUri, csvText, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (!(await Sharing.isAvailableAsync())) {
    return fileUri;
  }

  await Sharing.shareAsync(fileUri, {
    dialogTitle: 'Export all data as CSV',
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
  });

  return null;
}

export async function pickCsvFile(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
    type: ['text/csv', 'text/plain'],
  });

  if (result.canceled || result.assets.length === 0) {
    return null;
  }

  return FileSystem.readAsStringAsync(result.assets[0].uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });
}
