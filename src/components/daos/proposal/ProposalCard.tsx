"use client";
import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import StatusBadge from "./StatusBadge";
import MessageDisplay from "./MessageDisplay";
import VoteProgress from "./VoteProgress";
import LabeledField from "./LabeledField";
import TimeStatus from "./TimeStatus";
import ProposalMetrics from "./ProposalMetrics";
import BlockVisual from "./BlockVisual";
import {
  ArrowRight,
  Timer,
  Layers,
  Wallet,
  User,
  Activity,
  Hash,
} from "lucide-react";
import { truncateString, formatAction, getExplorerLink } from "./helper";
import { Proposal } from "@/types/supabase";

const ProposalCard: React.FC<{ proposal: Proposal }> = ({ proposal }) => {
  return (
    <Card className="transition-all duration-200 hover:shadow-md overflow-hidden bg-zinc-900">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex flex-col md:flex-row items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold">{proposal.title}</h3>
              <StatusBadge status={proposal.status} />
            </div>
            <p className="text-sm">
              {proposal.description || "No description available"}
            </p>
            <TimeStatus
              createdAt={proposal.created_at}
              concludedBy={proposal.concluded_by}
              status={proposal.status}
              start_block={proposal.start_block}
              end_block={proposal.end_block}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-1">
        {proposal.parameters && (
          <MessageDisplay message={proposal.parameters} />
        )}
        <VoteProgress
          votesFor={proposal.votes_for}
          votesAgainst={proposal.votes_against}
        />
        <ProposalMetrics proposal={proposal} />
        <div className="lg:grid lg:grid-cols-2 lg:gap-8">
          <div className="space-y-1 mb-4 lg:mb-0">
            <h4 className="font-medium text-sm mb-2"> Blocks</h4>
            <LabeledField
              icon={Layers}
              label="Snapshot block"
              value={
                <BlockVisual value={proposal.created_at_block} type="stacks" />
              }
            />
            <LabeledField
              icon={ArrowRight}
              label="Start block"
              value={
                <BlockVisual value={proposal.start_block} type="bitcoin" />
              }
            />
            <LabeledField
              icon={Timer}
              label="End block"
              value={<BlockVisual value={proposal.end_block} type="bitcoin" />}
            />
            <LabeledField
              icon={Wallet}
              label="Liquid Tokens"
              value={
                proposal.liquid_tokens !== null
                  ? (proposal.liquid_tokens / 1e8).toFixed(2)
                  : "No data available"
              }
            />
          </div>
          <div className="space-y-1">
            {/* For mobile, you might wrap blockchain details in an Accordion */}
            <div className="hidden lg:block space-y-1">
              <h4 className="font-medium text-sm mb-2"> Details</h4>
              <LabeledField
                icon={User}
                label="Creator"
                value={truncateString(proposal.creator, 8, 8)}
                link={getExplorerLink("address", proposal.creator)}
              />
              <LabeledField
                icon={Activity}
                label="Action"
                value={formatAction(proposal.action)}
                link={
                  proposal.action
                    ? getExplorerLink("contract", proposal.action)
                    : undefined
                }
              />
              <LabeledField
                icon={Hash}
                label="Transaction ID"
                value={truncateString(proposal.tx_id, 8, 8)}
                link={getExplorerLink("tx", proposal.tx_id)}
              />
              <LabeledField
                icon={Wallet}
                label="Principal"
                value={formatAction(proposal.contract_principal)}
                link={getExplorerLink("contract", proposal.contract_principal)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProposalCard;
