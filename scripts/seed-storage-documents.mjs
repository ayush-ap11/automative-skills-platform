import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

function createSamplePdf(title, subtitle) {
  const cleanTitle = (title || "Candidate Document").replace(/[^a-zA-Z0-9 -]/g, "");
  const cleanSub = (subtitle || "Automotive Skills Verification").replace(/[^a-zA-Z0-9 -]/g, "");
  
  const streamContent = `BT\n/F1 20 Tf\n50 720 Td\n(${cleanTitle}) Tj\n/F1 12 Tf\n0 -30 Td\n(${cleanSub}) Tj\n0 -20 Td\n(Automotive Skills Platform - Australia Compliance Record) Tj\nET`;
  const streamLength = Buffer.byteLength(streamContent);

  const content = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length ${streamLength} >> stream
${streamContent}
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000234 00000 n 
0000000350 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
430
%%EOF`;

  return Buffer.from(content);
}

async function run() {
  console.log("=== ENSURING ALL CANDIDATE DOCUMENTS EXIST IN STORAGE BUCKET ===");
  const { data: docs, error } = await supabase.from("documents").select("id, file_name, category, storage_path");
  if (error) {
    console.error("Error fetching documents:", error);
    process.exit(1);
  }

  console.log(`Found ${docs.length} documents in database.`);
  let uploaded = 0;

  for (const doc of docs) {
    const { data: existing, error: checkError } = await supabase.storage
      .from("candidate-documents")
      .download(doc.storage_path);

    if (existing && !checkError) {
      console.log(`✓ Already exists in storage: ${doc.file_name} (${doc.storage_path})`);
      continue;
    }

    console.log(`Uploading missing document: ${doc.file_name} -> ${doc.storage_path}...`);
    const pdfBuffer = createSamplePdf(doc.file_name, `Category: ${doc.category}`);
    
    const { error: uploadError } = await supabase.storage
      .from("candidate-documents")
      .upload(doc.storage_path, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error(`Failed to upload ${doc.file_name}:`, uploadError);
    } else {
      console.log(`✓ Uploaded successfully: ${doc.file_name}`);
      uploaded++;
    }
  }

  console.log(`\nCompleted! Uploaded ${uploaded} missing files.`);
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
