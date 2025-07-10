declare module 'csv-writer' {
  interface Field {
    id: string;
    title: string;
  }

  interface CsvWriterParams {
    path: string;
    header: Field[];
  }

  interface CsvWriter {
    writeRecords(records: any[]): Promise<void>;
  }

  export function createObjectCsvWriter(params: CsvWriterParams): CsvWriter;
} 