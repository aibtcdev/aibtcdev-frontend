import React, { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermsOfServiceProps {
  onScrollComplete?: (isComplete: boolean) => void;
}

export function TermsOfService({ onScrollComplete }: TermsOfServiceProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollAreaRef.current) {
        const scrollElement = scrollAreaRef.current.querySelector(
          "[data-radix-scroll-area-viewport]"
        );
        if (scrollElement) {
          const { scrollTop, scrollHeight, clientHeight } = scrollElement;
          const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px threshold

          if (isAtBottom && !hasScrolledToBottom) {
            setHasScrolledToBottom(true);
            onScrollComplete?.(true);
          }
        }
      }
    };

    const scrollElement = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    );
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll);
      return () => scrollElement.removeEventListener("scroll", handleScroll);
    }
  }, [hasScrolledToBottom, onScrollComplete]);

  return (
    <ScrollArea ref={scrollAreaRef} className="h-full px-6 py-4">
      <div className="max-w-none space-y-6 text-sm leading-relaxed">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-center mb-4">
            AIBTC TERMS OF SERVICE
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400">
            Effective Date: 2025
          </p>
        </div>

        <p className="mb-6">
          By using the AIBTC application (the "App"), you acknowledge that you
          have read, understood, and agree to be bound by the following terms
          and conditions. If you do not agree with these terms, you must
          immediately cease all use of the App.
        </p>

        <div className="space-y-6">
          <section>
            <h2 className="text-lg font-semibold mb-3">
              1. User-Submitted Content
            </h2>
            <p>
              By submitting any photo, video, audio, or other content, you
              confirm you obtained consent from all identifiable individuals and
              hold the rights to share it, and you grant AIBTC a worldwide,
              perpetual license to use, repost, and distribute it and accept
              responsibility for any related claims.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              2. Promotion and Rewards
            </h2>
            <p>
              AIBTC may offer BTC rewards for qualifying submissions.
              Eligibility, judging criteria, timing, and any geographic or age
              limits will be stated in the submission instructions. Not all
              submissions will receive rewards, and all payouts are
              discretionary, subject to verification, and void where prohibited.
              No purchase is necessary.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              3. AIBTC Does Not Control Funds or DAOs
            </h2>
            <p>
              AIBTC provides software to assist users more easily interact with
              blockchain networks. We do not hold user funds, issue tokens, or
              exercise ongoing control or governance over any DAO treasury.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              4. Users Control All Token and DAO Activities
            </h2>
            <p>
              Users initiate and execute all tokens, purchase seats, and launch
              DAOs. AIBTC does not manage or originate such activities.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              5. User Responsibility for Funds and DAO Treasuries
            </h2>
            <p>
              Users are responsible for their own secret keys and control of
              your own funds. DAO treasury funds are controlled via the
              governance mechanism of the specific DAO.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              6. Use of Personal Funds
            </h2>
            <p>
              By using the App, you represent that any funds deployed or tokens
              purchased are done so using your own funds.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              7. AI Agent Responsibility
            </h2>
            <p>
              Users are responsible for all of the action taken by user driven
              script executions or AI agents. AIBTC is not responsible, nor can
              it control, the activities of user driven scripts and AI agents.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              8. Legal Setup and Compliance
            </h2>
            <p>
              AIBTC does not make any sort of representation towards the legal
              status or legal compliance of any DAO launched on the App. DAO
              deployers and DAO members are responsible for coordinating their
              own legal setup and compliance with various laws, including taking
              actions to shield DAO members from liability that stems from any
              DAO's activities.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              9. Professional Advisors
            </h2>
            <p>
              Any documents, examples, or demos provided by AIBTC only serve
              illustrative purposes and should not be construed as financial,
              legal, or tax advice. Users and DAO members are responsible for
              obtaining their own financial, legal, and tax advisors.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              10. Compliance with Applicable Laws
            </h2>
            <p>
              By using the App, users agree to comply with all applicable laws
              and regulations applicable to their use of the App, including the
              activities that DAO members vote for. AIBTC does not guarantee or
              determine that any DAO activity proposed on its platform complies
              with applicable laws.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              11. Sanctions and Restricted Territories
            </h2>
            <p className="mb-3">
              By using this App, you represent and warrant that:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                You are not a resident, national, or agent of Iran, North Korea,
                Syria, Cuba, and the Crimea, Donetsk People's Republic and
                Luhansk People's Republic regions of Ukraine or any other
                country to which the United States or any other country to which
                the United States, the United Kingdom or the European Union
                embargoes goods or imposes similar sanctions ("Restricted
                Territories");
              </li>
              <li>
                You have not been identified as a Specially Designated National
                or placed on any sanctions lists by the U.S. Treasury
                Department's Office of Foreign Assets Control, the U.S. Commerce
                Department, or the U.S. Department of State ("Sanctions Lists
                Persons");
              </li>
              <li>
                You will not use our App to conduct any illegal or illicit
                activity;
              </li>
              <li>
                You do not intend to and will not transact with any person in a
                Restricted Territory or a Sanctions List Person (such
                transaction, a "Sanctioned Transaction").
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              12. VPN and Circumvention Restrictions
            </h2>
            <p>
              You do not, and will not, use VPN software or any other privacy or
              anonymization tools or techniques to circumvent, or attempt to
              circumvent, any restrictions that apply to the App.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              13. Prohibited Activities
            </h2>
            <p>
              The use of the App to launder funds, violate third party rights,
              such as intellectual property infringement, defraud others, or
              engage in Sanctioned Transactions is strictly prohibited
              ("Prohibited Activities"). By using the App, you agree that you
              will not use the App to engage in any Prohibited Activities.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              14. Blockchain Technology Risks
            </h2>
            <p className="mb-3">
              You understand the inherent risks associated with cryptographic
              systems, blockchain-based networks, and digital assets, including
              but not limited to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-3">
              <li>
                The usage and intricacies of native digital assets, like
                bitcoin;
              </li>
              <li>
                Smart contract-based tokens, such as those that follow the
                Stacks Token Standard;
              </li>
              <li>
                The risk of hardware, software, and Internet connection and
                service issues;
              </li>
              <li>The risk of malicious software introduction;</li>
              <li>
                The risk that third parties may obtain unauthorized access to
                information stored within your digital wallet.
              </li>
            </ul>
            <p>
              AIBTC does not own or control any of the underlying software
              through which blockchain networks are formed. In general, the
              software underlying blockchain networks, including the Bitcoin and
              Stacks blockchains, are open source, such that anyone can use,
              copy, modify, and distribute it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              15. Transaction Finality and Risk Acceptance
            </h2>
            <p className="mb-3">
              By using this App, you acknowledge and accept that:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                You bear sole responsibility for evaluating transactions before
                you execute them, and all transactions on blockchains are
                irreversible, final, and without refunds;
              </li>
              <li>
                The App may be disabled, disrupted, or adversely impacted as a
                result of sophisticated cyber-attacks, surges in activity,
                computer viruses, and/or other operational or technical
                challenges, among other things;
              </li>
              <li>
                We disclaim any ongoing obligation to notify you of all the
                potential risks of using and accessing the App;
              </li>
              <li>
                You agree to accept these risks and agree that you will not seek
                to hold us responsible for any consequent losses.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              16. Private Key Responsibility
            </h2>
            <p>
              You alone are responsible for securing any of your private key(s)
              when you interact with funds using self-custodial wallet software.
              We do not have access to your private key(s) for self-custodial
              wallet software. Losing control of your private key(s) will
              permanently and irreversibly deny you access to digital assets on
              blockchain-based networks and the ability to engage in any DAO's
              governance based on tokens controlled by such keys. Neither AIBTC
              nor any other person or entity will be able to retrieve or protect
              your digital assets stored with the assistance of self-custodial
              wallet software. If your private key(s) are lost, then you will
              not be able to transfer your digital assets to any other
              blockchain address or wallet. If this occurs, then you will not be
              able to realize any value or utility from the digital assets that
              you may hold.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              17. Market Volatility and Token Risks
            </h2>
            <p>
              Crypto markets tend to experience heavy price volatility and the
              value of any tokens acquired through the use of the App may be a
              speculative asset and drop considerably. AIBTC makes no guarantee
              or determination concerning the value of any token and you may
              lose the entire value of your tokens.
            </p>
            <p className="mt-3">
              We have no control over, or liability for, the delivery, quality,
              safety, legality, or any other aspect of any digital assets that
              you may transfer to or from a third party, and we are not
              responsible for ensuring that an entity with whom you transact
              completes the transaction or is authorized to do so, and if you
              experience a problem with any transactions in digital assets using
              the App, then you bear the entire risk.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              18. AI Compute Services
            </h2>
            <p>
              AIBTC may, at its sole discretion, provide AI compute services
              through the App. Access is subject to usage caps, throttling, or
              discontinuation at any time without notice. All fees for AI
              compute are collected at proposal creation and automatically
              transferred to the aibtc-dao-run-cost smart contract. AIBTC makes
              no warranties about availability or performance of AI compute and
              is not liable for indirect, incidental, or consequential damages
              arising from its restriction or termination.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              19. Third-Party Bridging Services
            </h2>
            <p>
              All bridging activities accessible via the App is carried out by a
              third party service provider. AIBTC does not manage or control any
              of the bridging activities accessible via the App. AIBTC is not
              responsible for any disruption of service or loss of funds that
              may occur due to such bridging service. We suggest that you
              evaluate our third party service providers to evaluate the risks
              in engaging in any bridging activity.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              20. Limitation of Liability
            </h2>
            <p>
              Under no circumstances shall AIBTC be liable for indirect,
              incidental, or consequential damages, including lost profits, even
              if advised of such possibilities.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              21. Agreement Acknowledgment
            </h2>
            <p>
              By continuing to use AIBTC, you confirm that you have read,
              understood, and agree to be legally bound by all terms and
              conditions outlined above. These terms constitute a binding legal
              agreement between you and AIBTC.
            </p>
          </section>
        </div>
      </div>
    </ScrollArea>
  );
}
