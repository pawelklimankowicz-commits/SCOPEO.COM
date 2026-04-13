import legal from '@/content/legal-documents.json';

type Variant = 'privacy' | 'dpa' | 'cookies';

export default function LegalSections({ variant }: { variant: Variant }) {
  const sections = legal[variant] as { title: string; body: string }[];
  return (
    <>
      {sections.map((s, i) => (
        <section key={i} className="mkt-legal-block">
          <h2>{s.title}</h2>
          <div className="mkt-legal-body">{s.body}</div>
        </section>
      ))}
    </>
  );
}

export function LegalPackageIntro() {
  const text = legal.packageIntro as string;
  return <div className="mkt-legal-body mkt-legal-body--intro">{text}</div>;
}

export function LegalFormClauses() {
  const text = legal.formClauses as string;
  return <div className="mkt-legal-body">{text}</div>;
}
