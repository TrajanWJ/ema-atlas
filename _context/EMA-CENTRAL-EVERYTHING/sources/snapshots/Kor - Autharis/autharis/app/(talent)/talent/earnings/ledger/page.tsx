import { LedgerPacket } from "@/components/talent/ledger/LedgerPacket";
import { getTalentLedgerRecord } from "@/lib/talent/ledger";

export default function TalentLedgerPage() {
  return <LedgerPacket record={getTalentLedgerRecord()} />;
}
