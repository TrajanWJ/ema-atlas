import { notFound } from "next/navigation";

import { OpportunityDossier } from "@/components/talent/opportunity-detail/OpportunityDossier";
import {
  getOpportunityDetail,
  getOpportunityDetailParams,
} from "@/lib/talent/opportunity-detail";

type OpportunityDetailPageProps = {
  params: Promise<{ opportunityId: string }>;
};

export function generateStaticParams() {
  return getOpportunityDetailParams();
}

export default async function OpportunityDetailPage({
  params,
}: OpportunityDetailPageProps) {
  const { opportunityId } = await params;
  const detail = getOpportunityDetail(opportunityId);

  if (!detail) {
    notFound();
  }

  return <OpportunityDossier detail={detail} />;
}
