import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudyDetail } from "@/components/marketing/case-studies/CaseStudyDetail";
import {
  caseStudies,
  getCaseStudyBySlug,
} from "@/lib/marketing/case-studies";

type CaseStudyPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return caseStudies.map((study) => ({
    slug: study.slug,
  }));
}

export async function generateMetadata({
  params,
}: CaseStudyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const study = getCaseStudyBySlug(slug);

  if (!study) {
    return {
      title: "Autharis | Case Study",
    };
  }

  return {
    title: `Autharis | ${study.client}`,
    description: study.summary,
  };
}

export default async function CaseStudyPage({ params }: CaseStudyPageProps) {
  const { slug } = await params;
  const study = getCaseStudyBySlug(slug);

  if (!study) {
    notFound();
  }

  const relatedStudies = caseStudies.filter((entry) => entry.slug !== slug);

  return <CaseStudyDetail study={study} relatedStudies={relatedStudies} />;
}
