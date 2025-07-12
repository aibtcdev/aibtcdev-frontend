// "use client";

// import { useState, useEffect } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import {
//   Loader2,
//   AlertCircle,
//   CheckCircle2,
//   Info,
//   ArrowRight,
// } from "lucide-react";
// import { TransactionPriority } from "@faktoryfun/styx-sdk";
// import {
//   completeDepositFlow,
//   prepareTransaction,
//   createDeposit,
//   executeTransaction,
//   updateDepositStatus,
//   type WalletProvider,
//   validateBTCAmount,
//   btcToSatoshis,
//   MIN_BTC_AMOUNT,
//   MAX_BTC_AMOUNT,
//   extractErrorMessage,
//   getDepositHistory,
//   formatSatoshis,
// } from "@/helpers/deposit";

// interface DepositModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   stxAddress: string;
// }

// type DepositStep = "input" | "review" | "processing" | "success" | "error";

// export default function DepositModal({
//   isOpen,
//   onClose,
//   stxAddress,
// }: DepositModalProps) {
//   const [step, setStep] = useState<DepositStep>("input");
//   const [btcAmount, setBtcAmount] = useState<string>("0.001"); // Default 0.001 BTC
//   const [btcAddress, setBtcAddress] = useState<string>("");
//   const [walletProvider, setWalletProvider] =
//     useState<WalletProvider>("leather");
//   const [feePriority, setFeePriority] = useState<TransactionPriority>(
//     TransactionPriority.Medium
//   );
//   const [error, setError] = useState<string>("");
//   const [sdkError, setSdkError] = useState<string>("");
//   const [txId, setTxId] = useState<string>("");
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const [amountError, setAmountError] = useState<string>("");
//   const [currentProcessingStep, setCurrentProcessingStep] =
//     useState<string>("");
//   const [depositHistory, setDepositHistory] = useState<any[]>([]);

//   // New state for transaction details
//   const [preparedTransaction, setPreparedTransaction] = useState<any>(null);
//   const [depositId, setDepositId] = useState<string>("");

//   // Add a function to fetch deposit history
//   const fetchDepositHistory = async () => {
//     if (!stxAddress) return;

//     try {
//       const result = await getDepositHistory(stxAddress);
//       if (result.success && result.history) {
//         setDepositHistory(result.history);
//       }
//     } catch (error) {
//       console.error("Error fetching deposit history:", error);
//     }
//   };

//   // Reset state when modal opens
//   useEffect(() => {
//     if (isOpen) {
//       setStep("input");
//       setError("");
//       setSdkError("");
//       setTxId("");
//       setIsLoading(false);
//       setAmountError("");
//       setCurrentProcessingStep("");
//       setPreparedTransaction(null);
//       setDepositId("");

//       // Fetch deposit history when modal opens
//       fetchDepositHistory();
//     }
//   }, [isOpen, stxAddress]);

//   // Validate BTC amount on change
//   const handleAmountChange = (value: string) => {
//     // Allow only numbers and a single decimal point
//     if (!/^(\d*\.?\d*)$/.test(value)) {
//       return;
//     }

//     setBtcAmount(value);
//     setAmountError("");

//     if (!value) {
//       setAmountError("Please enter an amount");
//       return;
//     }

//     const amount = Number.parseFloat(value);
//     const validation = validateBTCAmount(amount);

//     if (!validation.valid) {
//       setAmountError(validation.error || "Invalid amount");
//     }
//   };

//   // Calculate satoshis for display
//   const calculateSatoshis = (btc: string): string => {
//     const amount = Number.parseFloat(btc);
//     if (isNaN(amount)) return "0";
//     return btcToSatoshis(amount).toLocaleString();
//   };

//   // Step 1: Prepare transaction and show details
//   const handlePrepareTransaction = async () => {
//     // Validate inputs before submission
//     if (!btcAmount || amountError) {
//       setAmountError(amountError || "Please enter a valid amount");
//       return;
//     }

//     if (!btcAddress) {
//       setError("Please enter your BTC address");
//       return;
//     }

//     setIsLoading(true);
//     setError("");
//     setSdkError("");
//     setCurrentProcessingStep("Preparing transaction...");

//     try {
//       const amount = Number.parseFloat(btcAmount);

//       // Prepare transaction
//       const prepareResult = await prepareTransaction({
//         amount: amount.toString(),
//         userAddress: stxAddress,
//         btcAddress: btcAddress,
//         feePriority,
//         walletProvider,
//       });

//       if (!prepareResult.success) {
//         if (prepareResult.isInscriptionError) {
//           setError(
//             "Your Bitcoin address contains inscriptions (Ordinals/NFTs) that are being protected. Please use an address without inscriptions or add more regular BTC."
//           );
//         } else {
//           setError(
//             prepareResult.errorMessage || "Failed to prepare transaction"
//           );
//         }

//         if (prepareResult.originalError) {
//           setSdkError(extractErrorMessage(prepareResult.originalError));
//         }

//         setStep("error");
//         setIsLoading(false);
//         return;
//       }

//       // Store prepared transaction data
//       setPreparedTransaction(prepareResult.preparedData);

//       // Move to review step
//       setStep("review");
//     } catch (err: any) {
//       setError("An unexpected error occurred while preparing the transaction");
//       setSdkError(extractErrorMessage(err));
//       setStep("error");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Step 2: Create deposit and execute transaction after user confirmation
//   const handleConfirmTransaction = async () => {
//     if (!preparedTransaction) {
//       setError("Transaction data is missing. Please try again.");
//       setStep("error");
//       return;
//     }

//     setIsLoading(true);
//     setStep("processing");
//     setCurrentProcessingStep("Creating deposit...");

//     try {
//       const amount = Number.parseFloat(btcAmount);

//       // Create deposit
//       const depositResult = await createDeposit({
//         btcAmount: amount,
//         stxReceiver: stxAddress,
//         btcSender: btcAddress,
//       });

//       if (!depositResult.success) {
//         setError(depositResult.errorMessage || "Failed to create deposit");
//         if (depositResult.error) {
//           setSdkError(extractErrorMessage(depositResult.error));
//         }
//         setStep("error");
//         setIsLoading(false);
//         return;
//       }

//       const newDepositId = depositResult.depositId;
//       if (!newDepositId) {
//         setError("Failed to get deposit ID");
//         setStep("error");
//         setIsLoading(false);
//         return;
//       }

//       setDepositId(newDepositId);
//       setCurrentProcessingStep("Executing transaction...");

//       // Execute transaction
//       const executeResult = await executeTransaction({
//         depositId: newDepositId,
//         preparedData: preparedTransaction,
//         walletProvider,
//         btcAddress: btcAddress,
//       });

//       if (!executeResult.success) {
//         setError(executeResult.errorMessage || "Failed to execute transaction");
//         if (executeResult.error) {
//           setSdkError(extractErrorMessage(executeResult.error));
//         }
//         setStep("error");
//         setIsLoading(false);
//         return;
//       }

//       // Extract the transaction ID from the UTXO
//       let transactionId = "";
//       if (
//         executeResult.result &&
//         executeResult.result.utxos &&
//         executeResult.result.utxos.length > 0
//       ) {
//         transactionId = executeResult.result.utxos[0].txid;
//       }

//       setTxId(transactionId);
//       setCurrentProcessingStep("Updating deposit status...");

//       // Update deposit status
//       if (transactionId && newDepositId) {
//         try {
//           await updateDepositStatus(newDepositId, transactionId);
//         } catch (err) {
//           console.warn(
//             "Failed to update deposit status, but transaction was successful:",
//             err
//           );
//         }
//       }

//       // Refresh deposit history
//       fetchDepositHistory();

//       // Show success
//       setStep("success");
//     } catch (err: any) {
//       setError("An unexpected error occurred");
//       setSdkError(extractErrorMessage(err));
//       setStep("error");
//     } finally {
//       setIsLoading(false);
//       setCurrentProcessingStep("");
//     }
//   };

//   const renderStepContent = () => {
//     switch (step) {
//       case "input":
//         return (
//           <>
//             <DialogDescription>
//               Deposit Bitcoin to receive STX tokens. The conversion will be
//               processed automatically.
//             </DialogDescription>
//             <div className="grid gap-4 py-4">
//               <div className="grid gap-2">
//                 <Label htmlFor="btcAmount">Amount (BTC)</Label>
//                 <Input
//                   id="btcAmount"
//                   type="text"
//                   inputMode="decimal"
//                   value={btcAmount}
//                   onChange={(e) => handleAmountChange(e.target.value)}
//                   className={amountError ? "border-red-500" : ""}
//                 />
//                 {!amountError && (
//                   <p className="text-xs text-muted-foreground">
//                     {calculateSatoshis(btcAmount)} satoshis (Min:{" "}
//                     {MIN_BTC_AMOUNT} BTC, Max: {MAX_BTC_AMOUNT} BTC)
//                   </p>
//                 )}
//                 {amountError && (
//                   <p className="text-sm text-red-500 flex items-center gap-1">
//                     <Info className="h-3 w-3" />
//                     {amountError}
//                   </p>
//                 )}
//               </div>
//               <div className="grid gap-2">
//                 <Label htmlFor="btcAddress">Your BTC Address</Label>
//                 <Input
//                   id="btcAddress"
//                   placeholder="bc1..."
//                   value={btcAddress}
//                   onChange={(e) => setBtcAddress(e.target.value)}
//                 />
//                 <p className="text-xs text-muted-foreground">
//                   Make sure this address has enough BTC and no inscriptions
//                 </p>
//               </div>
//               <div className="grid gap-2">
//                 <Label htmlFor="walletProvider">Wallet Provider</Label>
//                 <Select
//                   value={walletProvider}
//                   onValueChange={(value) =>
//                     setWalletProvider(value as WalletProvider)
//                   }
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select wallet provider" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="leather">Leather</SelectItem>
//                     <SelectItem value="xverse">Xverse</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//               <div className="grid gap-2">
//                 <Label htmlFor="feePriority">Transaction Fee Priority</Label>
//                 <Select
//                   value={feePriority}
//                   onValueChange={(value) =>
//                     setFeePriority(value as TransactionPriority)
//                   }
//                 >
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select fee priority" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value={TransactionPriority.Low}>Low</SelectItem>
//                     <SelectItem value={TransactionPriority.Medium}>
//                       Medium
//                     </SelectItem>
//                     <SelectItem value={TransactionPriority.High}>
//                       High
//                     </SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>
//             <DialogFooter>
//               <Button variant="outline" onClick={onClose}>
//                 Cancel
//               </Button>
//               <Button
//                 onClick={handlePrepareTransaction}
//                 disabled={!!amountError || !btcAddress || isLoading}
//               >
//                 {isLoading ? (
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                 ) : null}
//                 Prepare Transaction
//               </Button>
//             </DialogFooter>
//           </>
//         );

//       case "review":
//         return (
//           <>
//             <DialogDescription>
//               Review your transaction details before confirming.
//             </DialogDescription>
//             <div className="grid gap-4 py-4">
//               <div className="space-y-2">
//                 <h3 className="text-sm font-medium">Transaction Details</h3>
//                 <div className="bg-muted p-3 rounded-md space-y-2 text-sm">
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">Amount:</span>
//                     <span className="font-medium">
//                       {btcAmount} BTC ({calculateSatoshis(btcAmount)} sats)
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">From:</span>
//                     <span className="font-mono text-xs truncate max-w-[200px]">
//                       {btcAddress}
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">To:</span>
//                     <span className="font-mono text-xs truncate max-w-[200px]">
//                       {stxAddress}
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">Wallet:</span>
//                     <span className="capitalize">{walletProvider}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">Fee Priority:</span>
//                     <span className="capitalize">{feePriority}</span>
//                   </div>
//                 </div>
//               </div>

//               {preparedTransaction && (
//                 <div className="space-y-2">
//                   <h3 className="text-sm font-medium">Fee Details</h3>
//                   <div className="bg-muted p-3 rounded-md space-y-2 text-sm">
//                     <div className="flex justify-between">
//                       <span className="text-muted-foreground">Fee:</span>
//                       <span className="font-medium">
//                         {formatSatoshis(preparedTransaction.fee)} sats
//                       </span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-muted-foreground">Fee Rate:</span>
//                       <span className="font-medium">
//                         {preparedTransaction.feeRate} sat/vB
//                       </span>
//                     </div>
//                     {preparedTransaction.changeAmount && (
//                       <div className="flex justify-between">
//                         <span className="text-muted-foreground">Change:</span>
//                         <span className="font-medium">
//                           {formatSatoshis(preparedTransaction.changeAmount)}{" "}
//                           sats
//                         </span>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               )}

//               <Alert>
//                 <AlertDescription>
//                   Please review the transaction details carefully. Once
//                   confirmed, the transaction will be submitted to the Bitcoin
//                   network.
//                 </AlertDescription>
//               </Alert>
//             </div>
//             <DialogFooter>
//               <Button variant="outline" onClick={() => setStep("input")}>
//                 Back
//               </Button>
//               <Button onClick={handleConfirmTransaction}>
//                 Confirm Transaction
//               </Button>
//             </DialogFooter>
//           </>
//         );

//       case "processing":
//         return (
//           <div className="flex flex-col items-center justify-center py-8">
//             <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
//             <p className="text-center">Processing your deposit...</p>
//             <p className="text-center text-sm font-medium mt-2">
//               {currentProcessingStep || "Preparing transaction..."}
//             </p>
//             <p className="text-center text-xs text-muted-foreground mt-1">
//               Please wait while we process your transaction. This may take a
//               moment.
//             </p>
//           </div>
//         );

//       case "success":
//         return (
//           <div className="flex flex-col items-center justify-center py-8">
//             <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
//             <h3 className="text-xl font-semibold mb-2">Deposit Successful!</h3>
//             <p className="text-center mb-4">
//               Your transaction has been successfully submitted to the Bitcoin
//               network.
//             </p>
//             {txId && (
//               <div className="w-full bg-muted p-3 rounded-md overflow-hidden mb-4">
//                 <p className="font-mono text-xs break-all">
//                   Transaction ID: {txId}
//                 </p>
//               </div>
//             )}
//             <Button onClick={onClose}>Close</Button>
//           </div>
//         );

//       case "error":
//         return (
//           <div className="flex flex-col items-center justify-center py-8">
//             <AlertCircle className="h-12 w-12 text-destructive mb-4" />
//             <h3 className="text-xl font-semibold mb-2">Error</h3>

//             {/* User-friendly error message */}
//             <Alert variant="destructive" className="mb-4">
//               <AlertDescription>{error}</AlertDescription>
//             </Alert>

//             {/* Original SDK error message */}
//             {sdkError && (
//               <div className="w-full mb-4">
//                 <p className="text-sm font-medium mb-1">SDK Error Details:</p>
//                 <div className="bg-muted p-3 rounded-md overflow-auto max-h-32 text-xs font-mono">
//                   {sdkError}
//                 </div>
//               </div>
//             )}

//             <div className="flex gap-2">
//               <Button variant="outline" onClick={() => setStep("input")}>
//                 Try Again
//               </Button>
//               <Button onClick={onClose}>Close</Button>
//             </div>
//           </div>
//         );
//     }
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="sm:max-w-[425px]">
//         <DialogHeader>
//           <DialogTitle>Deposit BTC</DialogTitle>
//         </DialogHeader>
//         {renderStepContent()}
//       </DialogContent>
//     </Dialog>
//   );
// }
