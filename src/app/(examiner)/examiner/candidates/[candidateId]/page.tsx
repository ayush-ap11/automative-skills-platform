interface PageProps {
  params: Promise<{ candidateId: string }>;
}

export default async function CandidateDetailPage({ params }: PageProps) {
  const { candidateId } = await params;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Candidate Evaluation
        </h1>
        <span className="text-xs font-mono text-muted-foreground">
          ID: {candidateId}
        </span>
      </div>
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        Candidate evaluation and assessment review details will be available in
        Step 18.
      </div>
    </div>
  );
}
