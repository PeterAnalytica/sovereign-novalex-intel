/**
 * SNI - PiRC2 Subscription Trigger
 * RC 9394642 Compliance Logic
 */
export const initiateSubscription = async () => {
  const payment = await Pi.createPayment({
    amount: 10,
    memo: "Monthly Forensic Audit Subscription - SIL Ltd",
    metadata: { 
      type: "recurring_pirc2", // This triggers the new Protocol 20 subscription flow
      plan: "institutional_vault" 
    },
  }, {
    onReadyForServerApproval: (paymentId) => {
      // Send paymentId to SNI-Sovereign-Kernel (Supabase)
      return fetch(`${process.env.BACKEND_URL}/approve-pi-subscription`, {
        method: 'POST',
        body: JSON.stringify({ paymentId })
      });
    },
    onReadyForServerCompletion: (paymentId, txid) => {
       // Finalize the 'Sovereign Handshake'
       console.log("Vault Access Granted via TX:", txid);
    },
    onCancel: (paymentId) => { /* Handle User Exit */ },
    onError: (error, payment) => { /* Log SDK Error */ },
  });
};
