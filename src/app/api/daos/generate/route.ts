// app/api/daos/generate/route.ts
import { NextResponse } from 'next/server';

// Type for the request body
type RequestBody = {
  extensions: string[];
  includeDeployer: boolean;
};

function generateInitializationBlock(extensions: string[], includeDeployer: boolean): string {
  let initBlock = '\n;; Initialization\n;;\n';
  const enabledExtensions: string[] = [];

  // Add deployer if specified
  if (includeDeployer) {
    enabledExtensions.push('tx-sender');
  }

  // Add provided extensions
  extensions.forEach(ext => {
    if (ext && ext.trim()) {
      enabledExtensions.push(`'${ext.trim()}`);
    }
  });

  // Generate map-set statements for each extension
  if (enabledExtensions.length > 0) {
    initBlock += ';; Initialize extension permissions\n';
    enabledExtensions.forEach(ext => {
      initBlock += `(map-set Extensions ${ext} true)\n`;
    });
  }

  return initBlock;
}

function generateContract(params: { extensions: string[]; includeDeployer: boolean }): string {
  const { extensions = [], includeDeployer = true } = params;

  // Base contract content
  const contract = `;; title: aibtcdev-dao
;; version: 1.0.0
;; summary: An ExecutorDAO implementation for aibtcdev
;; traits
;;
;; (impl-trait .aibtcdev-executor-trait.executor-trait)
;; (use-trait proposal-trait .aibtcdev-proposal-trait.proposal-trait)
;; (use-trait extension-trait .aibtcdev-extension-trait.extension-trait)

;; constants
;;
(define-constant ERR_UNAUTHORIZED (err u900))
(define-constant ERR_ALREADY_EXECUTED (err u901))
(define-constant ERR_INVALID_EXTENSION (err u902))
(define-constant ERR_NO_EMPTY_LISTS (err u903))

;; data vars
;;
;; used for initial construction, set to contract itself after
(define-data-var executive principal tx-sender)

;; data maps
;;
;; tracks block height of executed proposals
(define-map ExecutedProposals principal uint)
;; tracks enabled status of extensions
(define-map Extensions principal bool)

;; public functions
;;
;; initial construction of the DAO
(define-public (construct (proposal <proposal-trait>))
  (let
    ((sender tx-sender))
    (asserts! (is-eq sender (var-get executive)) ERR_UNAUTHORIZED)
    (var-set executive (as-contract tx-sender))
    (as-contract (execute proposal sender))
  )
)

;; execute Clarity code in a proposal
(define-public (execute (proposal <proposal-trait>) (sender principal))
  (begin
    (try! (is-self-or-extension))
    (asserts! (map-insert ExecutedProposals (contract-of proposal) block-height) ERR_ALREADY_EXECUTED)
    (print {
      notification: "execute",
      payload: {
        proposal: proposal,
        sender: sender,
      }
    })
    (as-contract (contract-call? proposal execute sender))
  )
)

;; add an extension or update the status of an existing one
(define-public (set-extension (extension principal) (enabled bool))
  (begin
    (try! (is-self-or-extension))
    (print {
      notification: "extension",
      payload: {
        enabled: enabled,
        extension: extension,
      }
    })
    (ok (map-set Extensions extension enabled))
  )
)

;; add multiple extensions or update the status of existing ones
(define-public (set-extensions (extensionList (list 200 {extension: principal, enabled: bool})))
  (begin
    (try! (is-self-or-extension))
    (asserts! (>= (len extensionList) u0) ERR_NO_EMPTY_LISTS)
    (ok (map set-extensions-iter extensionList))
  )
)

;; request a callback from an extension
(define-public (request-extension-callback (extension <extension-trait>) (memo (buff 34)))
  (let
    ((sender tx-sender))
    (asserts! (is-extension contract-caller) ERR_INVALID_EXTENSION)
    (asserts! (is-eq contract-caller (contract-of extension)) ERR_INVALID_EXTENSION)
    (print {
      notification: "request-extension-callback",
      payload: {
        extension: extension,
        memo: memo,
        sender: sender,
      }
    })
    (as-contract (contract-call? extension callback sender memo))
  )
)

;; read only functions
;;
(define-read-only (is-extension (extension principal))
  (default-to false (map-get? Extensions extension))
)

(define-read-only (executed-at (proposal <proposal-trait>))
  (map-get? ExecutedProposals (contract-of proposal))
)

;; private functions
;;
;; authorization check
(define-private (is-self-or-extension)
  (ok (asserts! (or (is-eq tx-sender (as-contract tx-sender)) (is-extension contract-caller)) ERR_UNAUTHORIZED))
)

;; set-extensions helper function
(define-private (set-extensions-iter (item {extension: principal, enabled: bool}))
  (begin
    (print {
      notification: "extension",
      payload: {
        enabled: (get enabled item),
        extension: (get extension item),
      }
    })
    (map-set Extensions (get extension item) (get enabled item))
  )
)${generateInitializationBlock(extensions, includeDeployer)}`;

  return contract;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as RequestBody;
    const { extensions, includeDeployer } = body;

    // Validate input
    if (!Array.isArray(extensions)) {
      return NextResponse.json(
        { error: 'Extensions must be an array' },
        { status: 400 }
      );
    }

    // Validate extensions format
    const invalidExtensions = extensions.filter(ext => ext && ext.trim() && !ext.trim().startsWith('S'));
    if (invalidExtensions.length > 0) {
      return NextResponse.json(
        { error: 'Invalid extension format. All extensions must start with S' },
        { status: 400 }
      );
    }

    // Generate contract
    const contract = generateContract({
      extensions,
      includeDeployer: includeDeployer !== false
    });

    // Return generated contract
    return NextResponse.json({
      contract,
      metadata: {
        extensionsCount: extensions.filter(e => e && e.trim()).length,
        includesDeployer: includeDeployer !== false
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

// Optional: Add GET method to document the API
export async function GET() {
  return NextResponse.json({
    description: 'Generate a DAO contract with specified extensions',
    usage: {
      method: 'POST',
      body: {
        extensions: 'string[] - Array of extension contract addresses (must start with S)',
        includeDeployer: 'boolean - Whether to include deployer as an extension (default: true)'
      },
      returns: {
        contract: 'string - Generated Clarity contract code',
        metadata: {
          extensionsCount: 'number - Count of valid extensions',
          includesDeployer: 'boolean - Whether deployer was included'
        }
      }
    }
  });
}