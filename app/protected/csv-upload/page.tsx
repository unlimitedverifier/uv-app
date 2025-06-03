import { CsvXlsxUpload } from "@/components/csv-xlsx-upload";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";

export default function CsvUploadPage() {
  return (
    <PageContainer>
      <PageHeader
        title="CSV & XLSX File Processor"
        description="Upload CSV or XLSX files and select specific columns to analyze and export."
      />
      
      <div className="space-y-8">
        <CsvXlsxUpload />
        
        {/* Optional: Add some usage instructions */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-muted/50 rounded-lg p-6">
            <h3 className="font-semibold mb-3">How to use:</h3>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li>1. Upload a CSV or XLSX file by dragging it into the upload area or clicking to browse</li>
              <li>2. Once uploaded, you&apos;ll see all available columns with their data types</li>
              <li>3. Click on any column to select it for processing</li>
              <li>4. View the selected column data and export it if needed</li>
            </ol>
          </div>
        </div>
      </div>
    </PageContainer>
  );
} 