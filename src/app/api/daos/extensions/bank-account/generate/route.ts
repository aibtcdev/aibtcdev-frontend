// app/api/daos/extensions/bank-account/generate/route.ts
import { NextResponse } from 'next/server';

// Type for the request body
type RequestBody = {
  name: string;
  daoContractId: string;
  extensionTraitContractId: string;
  defaultWithdrawalPeriod?: number; // Optional, defaults to 144
  defaultWithdrawalAmount?: number; // Optional, defaults to 10000000 (10 STX)
  initialAccountHolder?: string; // Optional, defaults to contract itself
};

function generateContract(params: RequestBody): string {
  const {
    name,
    daoContractId,
    extensionTraitContractId,
    defaultWithdrawalPeriod = 144,
    defaultWithdrawalAmount = 10000000,
    initialAccountHolder = 'SELF',
  } = params;

  return `;; title: ${name}-bank-account
;; version: 1.0.0
;; summary: An extension that allows a principal to withdraw STX from the contract with given rules.

;; traits
;;
(impl-trait ${extensionTraitContractId}.extension-trait)

;; constants
;;
(define-constant SELF (as-contract tx-sender))
(define-constant ERR_INVALID (err u1000))
(define-constant ERR_UNAUTHORIZED (err u1001))
(define-constant ERR_TOO_SOON (err u1002))
(define-constant ERR_INVALID_AMOUNT (err u1003))

;; data vars
;;
(define-data-var withdrawalPeriod uint u${defaultWithdrawalPeriod}) ;; Default period in blocks
(define-data-var withdrawalAmount uint u${defaultWithdrawalAmount}) ;; Default amount in microSTX
(define-data-var lastWithdrawalBlock uint u0)
(define-data-var accountHolder principal ${initialAccountHolder})

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

(define-public (set-account-holder (new principal))
  (begin
    (try! (is-dao-or-extension))
    (asserts! (not (is-eq (var-get accountHolder) new)) ERR_INVALID)
    (ok (var-set accountHolder new))
  )
)

(define-public (set-withdrawal-period (period uint))
  (begin
    (try! (is-dao-or-extension))
    (asserts! (> period u0) ERR_INVALID)
    (ok (var-set withdrawalPeriod period))
  )
)

(define-public (set-withdrawal-amount (amount uint))
  (begin
    (try! (is-dao-or-extension))
    (asserts! (> amount u0) ERR_INVALID)
    (ok (var-set withdrawalAmount amount))
  )
)

(define-public (override-last-withdrawal-block (block uint))
  (begin
    (try! (is-dao-or-extension))
    (asserts! (> block u0) ERR_INVALID)
    (ok (var-set lastWithdrawalBlock block))
  )
)

(define-public (deposit-stx (amount uint))
  (begin
    (asserts! (> amount u0) ERR_INVALID_AMOUNT)
    (print {
      notification: "deposit-stx",
      payload: {
        amount: amount,
        caller: contract-caller,
        recipient: SELF
      }
    })
    (stx-transfer? amount contract-caller SELF)
  )
)

(define-public (withdraw-stx)
  (begin
    ;; verify user is enabled in the map
    (try! (is-account-holder))
    ;; verify user is not withdrawing too soon
    (asserts! (>= block-height (+ (var-get lastWithdrawalBlock) (var-get withdrawalPeriod))) ERR_TOO_SOON)
    ;; update last withdrawal block
    (var-set lastWithdrawalBlock block-height)
    ;; print notification and transfer STX
    (print {
      notification: "withdraw-stx",
      payload: {
        amount: (var-get withdrawalAmount),
        caller: contract-caller,
        recipient: (var-get accountHolder)
      }
    })
    (as-contract (stx-transfer? (var-get withdrawalAmount) SELF (var-get accountHolder)))
  )
)

;; read only functions
;;
(define-read-only (get-account-balance)
  (stx-get-balance SELF)
)

(define-read-only (get-account-holder)
  (var-get accountHolder)
)

(define-read-only (get-withdrawal-period)
  (var-get withdrawalPeriod)
)

(define-read-only (get-withdrawal-amount)
  (var-get withdrawalAmount)
)

(define-read-only (get-last-withdrawal-block)
  (var-get lastWithdrawalBlock)
)

(define-read-only (get-all-vars)
  {
    accountHolder: (var-get accountHolder),
    lastWithdrawalBlock: (var-get lastWithdrawalBlock),
    withdrawalAmount: (var-get withdrawalAmount),
    withdrawalPeriod: (var-get withdrawalPeriod),
  }
)

(define-read-only (get-standard-caller)
  (let ((d (unwrap-panic (principal-destruct? contract-caller))))
    (unwrap-panic (principal-construct? (get version d) (get hash-bytes d)))
  )
)

;; private functions
;;
(define-private (is-account-holder)
  (ok (asserts! (is-eq (var-get accountHolder) (get-standard-caller)) ERR_UNAUTHORIZED))
)`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as RequestBody;
    const {
      name,
      daoContractId,
      extensionTraitContractId,
      defaultWithdrawalPeriod,
      defaultWithdrawalAmount,
      initialAccountHolder
    } = body;

    // Validate required fields
    if (!name || !daoContractId || !extensionTraitContractId) {
      return NextResponse.json(
        { error: 'Name, DAO contract ID, and extension trait contract ID are required' },
        { status: 400 }
      );
    }

    // Validate contract ID format
    const contractIdPattern = /^[A-Z0-9]+\.[A-Za-z0-9-]+$/;
    if (
      !contractIdPattern.test(daoContractId) ||
      !contractIdPattern.test(extensionTraitContractId)
    ) {
      return NextResponse.json(
        { error: 'Invalid contract ID format. Must be in format: ADDR.CONTRACT-NAME' },
        { status: 400 }
      );
    }

    // Validate numeric parameters if provided
    if (defaultWithdrawalPeriod !== undefined && defaultWithdrawalPeriod <= 0) {
      return NextResponse.json(
        { error: 'Withdrawal period must be greater than 0' },
        { status: 400 }
      );
    }

    if (defaultWithdrawalAmount !== undefined && defaultWithdrawalAmount <= 0) {
      return NextResponse.json(
        { error: 'Withdrawal amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Generate contract
    const contract = generateContract({
      name,
      daoContractId,
      extensionTraitContractId,
      defaultWithdrawalPeriod,
      defaultWithdrawalAmount,
      initialAccountHolder,
    });

    // Return generated contract
    return NextResponse.json({
      contract,
      metadata: {
        name,
        dao: daoContractId,
        traits: {
          extension: extensionTraitContractId,
        },
        settings: {
          withdrawalPeriod: defaultWithdrawalPeriod ?? 144,
          withdrawalAmount: defaultWithdrawalAmount ?? 10000000,
          initialAccountHolder: initialAccountHolder ?? 'SELF',
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
    description: 'Generate a Bank Account extension contract with specified parameters',
    usage: {
      method: 'POST',
      body: {
        name: 'string - Name of the DAO (used in contract title)',
        daoContractId: 'string - Principal of the DAO contract',
        extensionTraitContractId: 'string - Principal of the extension trait contract',
        defaultWithdrawalPeriod: 'number? - Optional withdrawal period in blocks (default: 144)',
        defaultWithdrawalAmount: 'number? - Optional withdrawal amount in microSTX (default: 10000000)',
        initialAccountHolder: 'string? - Optional initial account holder principal (default: SELF)'
      },
      returns: {
        contract: 'string - Generated Clarity contract code',
        metadata: {
          name: 'string - Name used in generation',
          dao: 'string - DAO contract principal',
          traits: {
            extension: 'string - Extension trait principal',
          },
          settings: {
            withdrawalPeriod: 'number - Configured withdrawal period',
            withdrawalAmount: 'number - Configured withdrawal amount',
            initialAccountHolder: 'string - Configured account holder'
          }
        }
      }
    }
  });
}