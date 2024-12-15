// app/api/daos/extensions/messaging/generate/route.ts
import { NextResponse } from 'next/server';

// Type for the request body
type RequestBody = {
  name: string;
  extensionTraitContractId: string;
};

function generateContract(params: RequestBody): string {
  const {
    name,
    extensionTraitContractId,
  } = params;

  return `;; title: ${name}-messaging
;; version: 1.0.0
;; summary: An extension to send messages on-chain to anyone listening to this contract.

;; traits
;;
(impl-trait ${extensionTraitContractId}.extension-trait)

;; constants
;;
(define-constant INPUT_ERROR (err u400))
(define-constant ERR_UNAUTHORIZED (err u2000))

;; public functions
(define-public (callback (sender principal) (memo (buff 34)))
  (ok true)
)

(define-public (send (msg (string-ascii 1048576)))
  (begin
    (asserts! (> (len msg) u0) INPUT_ERROR)
    ;; print the message as the first event
    (print msg)
    ;; print the envelope info for the message
    (print {
      notification: "send",
      payload: {
        caller: contract-caller,
        height: block-height,
        sender: tx-sender,
      }
    })
    (ok true)
  )
)`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as RequestBody;
    const { name, extensionTraitContractId } = body;

    // Validate required fields
    if (!name || !extensionTraitContractId) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate contract ID format (should be Clarity contract principal format)
    const contractIdPattern = /^[A-Z0-9]+\.[A-Za-z0-9-]+$/;
    if (!contractIdPattern.test(extensionTraitContractId)) {
      return NextResponse.json(
        { error: 'Invalid contract ID format' },
        { status: 400 }
      );
    }

    // Generate contract
    const contract = generateContract({
      name,
      extensionTraitContractId,
    });

    // Return generated contract
    return NextResponse.json({
      contract,
      metadata: {
        name,
        traits: {
          extension: extensionTraitContractId,
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
    description: 'Generate a Messaging extension contract with specified parameters',
    usage: {
      method: 'POST',
      body: {
        name: 'string - Name of the DAO (used in contract title)',
        extensionTraitContractId: 'string - Principal of the extension trait contract'
      },
      returns: {
        contract: 'string - Generated Clarity contract code',
        metadata: {
          name: 'string - Name used in generation',
          traits: {
            extension: 'string - Extension trait principal'
          }
        }
      }
    }
  });
}