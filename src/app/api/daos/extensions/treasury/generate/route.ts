// app/api/daos/extensions/treasury/generate/route.ts
import { NextResponse } from 'next/server';

// Type definitions
type RequestBody = {
  name: string;
  daoContractId: string;
  extensionTraitContractId: string;
  sip009TraitContractId: string;
  sip010TraitContractId: string;
};

function generateContract(params: RequestBody): string {
  const {
    name,
    daoContractId,
    extensionTraitContractId,
    sip009TraitContractId,
    sip010TraitContractId,
  } = params;

  return `;; title: ${name}-treasury
;; version: 1.0.0
;; summary: An extension that manages STX, SIP-009 NFTs, and SIP-010 FTs.

;; traits
;;
(impl-trait ${extensionTraitContractId}.extension-trait)
(use-trait ft-trait ${sip010TraitContractId}.sip-010-trait)
(use-trait nft-trait ${sip009TraitContractId}.nft-trait)

;; constants
;;
(define-constant ERR_UNAUTHORIZED (err u2000))
(define-constant ERR_UNKNOWN_ASSSET (err u2001))
(define-constant TREASURY (as-contract tx-sender))

;; data maps
;;
(define-map AllowedAssets principal bool)

;; public functions
;;
(define-public (is-dao-or-extension)
  (ok (asserts! (or (is-eq tx-sender ${daoContractId})
    (contract-call? ${daoContractId} is-extension contract-caller)) ERR_UNAUTHORIZED
  ))
)

(define-public (callback (sender principal) (memo (buff 34)))
  (ok true)
)

;; add or update an asset to the allowed list
(define-public (allow-asset (token principal) (enabled bool))
  (begin
    (try! (is-dao-or-extension))
    (print {
      notification: "allow-asset",
      payload: {
        enabled: enabled,
        token: token
      }
    })
    (ok (map-set AllowedAssets token enabled))
  )
)

;; add or update a list of assets to the allowed list
(define-public (allow-assets (allowList (list 100 {token: principal, enabled: bool})))
  (begin
    (try! (is-dao-or-extension))
    (ok (map allow-assets-iter allowList))
  )
)

;; deposit STX to the treasury
(define-public (deposit-stx (amount uint))
  (begin
    (print {
      notification: "deposit-stx",
      payload: {
        amount: amount,
        caller: contract-caller,
        recipient: TREASURY,
        sender: tx-sender
      }
    })
    (stx-transfer? amount tx-sender TREASURY)
  )
)

;; deposit FT to the treasury
(define-public (deposit-ft (ft <ft-trait>) (amount uint))
  (begin
    (asserts! (is-allowed-asset (contract-of ft)) ERR_UNKNOWN_ASSSET)
    (print {
      notification: "deposit-ft",
      payload: {
        amount: amount,
        assetContract: (contract-of ft),
        caller: contract-caller,
        recipient: TREASURY,
        sender: tx-sender
      }
    })
    (contract-call? ft transfer amount tx-sender TREASURY none)
  )
)

;; deposit NFT to the treasury
(define-public (deposit-nft (nft <nft-trait>) (id uint))
  (begin
    (asserts! (is-allowed-asset (contract-of nft)) ERR_UNKNOWN_ASSSET)
    (print {
      notification: "deposit-nft",
      payload: {
        assetContract: (contract-of nft),
        caller: contract-caller,
        recipient: TREASURY,
        sender: tx-sender,
        tokenId: id
      }
    })
    (contract-call? nft transfer id tx-sender TREASURY)
  )
)

;; withdraw STX from the treasury
(define-public (withdraw-stx (amount uint) (recipient principal))
  (begin
    (try! (is-dao-or-extension))
    (print {
      notification: "withdraw-stx",
      payload: {
        amount: amount,
        caller: contract-caller,
        recipient: recipient,
        sender: tx-sender
      }
    })
    (as-contract (stx-transfer? amount TREASURY recipient))
  )
)

;; withdraw FT from the treasury
(define-public (withdraw-ft (ft <ft-trait>) (amount uint) (recipient principal))
  (begin
    (try! (is-dao-or-extension))
    (asserts! (is-allowed-asset (contract-of ft)) ERR_UNKNOWN_ASSSET)
    (print {
      notification: "withdraw-ft",
      payload: {
        assetContract: (contract-of ft),
        caller: contract-caller,
        recipient: recipient,
        sender: tx-sender
      }
    })
    (as-contract (contract-call? ft transfer amount TREASURY recipient none))
  )
)

;; withdraw NFT from the treasury
(define-public (withdraw-nft (nft <nft-trait>) (id uint) (recipient principal))
  (begin
    (try! (is-dao-or-extension))
    (asserts! (is-allowed-asset (contract-of nft)) ERR_UNKNOWN_ASSSET)
    (print {
      notification: "withdraw-nft",
      payload: {
        assetContract: (contract-of nft),
        caller: contract-caller,
        recipient: recipient,
        sender: tx-sender,
        tokenId: id
      }
    })
    (as-contract (contract-call? nft transfer id TREASURY recipient))
  )
)

;; delegate STX for stacking
(define-public (delegate-stx (maxAmount uint) (to principal))
  (begin
    (try! (is-dao-or-extension))
    (print {
      notification: "delegate-stx",
      payload: {
        amount: maxAmount,
        caller: contract-caller,
        delegate: to,
        sender: tx-sender
      }
    })
    (match (as-contract (contract-call? 'SP000000000000000000002Q6VF78.pox-4 delegate-stx maxAmount to none none))
      success (ok success)
      err (err (to-uint err))
    )
  )
)

;; revoke STX delegation, STX unlocks after cycle ends
(define-public (revoke-delegate-stx)
  (begin
    (try! (is-dao-or-extension))
    (print {
      notification: "revoke-delegate-stx",
      payload: {
        caller: contract-caller,
        sender: tx-sender
      }
    })
    (match (as-contract (contract-call? 'SP000000000000000000002Q6VF78.pox-4 revoke-delegate-stx))
      success (begin (print success) (ok true))
      err (err (to-uint err))
    )
  )
)

;; read only functions
;;
(define-read-only (is-allowed-asset (assetContract principal))
  (default-to false (get-allowed-asset assetContract))
)

(define-read-only (get-allowed-asset (assetContract principal))
  (map-get? AllowedAssets assetContract)
)

;; private functions
;;
;; set-assets helper function
(define-private (allow-assets-iter (item {token: principal, enabled: bool}))
  (begin
    (print {
      notification: "allow-asset",
      payload: {
        enabled: (get enabled item),
        token: (get token item)
      }
    })
    (map-set AllowedAssets (get token item) (get enabled item))
  )
)`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as RequestBody;
    const { name, daoContractId, extensionTraitContractId, sip009TraitContractId, sip010TraitContractId } = body;

    // Validate inputs
    if (!name || !daoContractId || !extensionTraitContractId || !sip009TraitContractId || !sip010TraitContractId) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate contract IDs format (should be Clarity contract principal format)
    const contractIdPattern = /^[A-Z0-9]+\.[A-Za-z0-9-]+$/;
    if (
      !contractIdPattern.test(daoContractId) ||
      !contractIdPattern.test(extensionTraitContractId) ||
      !contractIdPattern.test(sip009TraitContractId) ||
      !contractIdPattern.test(sip010TraitContractId)
    ) {
      return NextResponse.json(
        { error: 'Invalid contract ID format' },
        { status: 400 }
      );
    }

    // Generate contract
    const contract = generateContract({
      name,
      daoContractId,
      extensionTraitContractId,
      sip009TraitContractId,
      sip010TraitContractId,
    });

    // Return generated contract
    return NextResponse.json({
      contract,
      metadata: {
        name,
        daoContractId,
        traits: {
          extension: extensionTraitContractId,
          sip009: sip009TraitContractId,
          sip010: sip010TraitContractId,
        }
      }
    });

  } catch (error) {
    console.error('Contract generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate contract' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    description: 'Generate a Treasury extension contract with specified parameters',
    usage: {
      method: 'POST',
      body: {
        name: 'string - Name of the DAO (used in contract title)',
        daoContractId: 'string - Principal of the DAO contract',
        extensionTraitContractId: 'string - Principal of the extension trait contract',
        sip009TraitContractId: 'string - Principal of the SIP009 NFT trait contract',
        sip010TraitContractId: 'string - Principal of the SIP010 FT trait contract',
      },
      returns: {
        contract: 'string - Generated Clarity contract code',
        metadata: {
          name: 'string - Name used in generation',
          daoContractId: 'string - DAO contract principal',
          traits: {
            extension: 'string - Extension trait principal',
            sip009: 'string - SIP009 trait principal',
            sip010: 'string - SIP010 trait principal',
          }
        }
      }
    }
  });
}