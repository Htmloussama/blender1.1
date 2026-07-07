import React, { useState, useEffect } from "react";
import { Box, CreditCard, Lock, ArrowLeft, CheckCircle, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Asset } from "../types";

interface SimulatedCheckoutProps {
  onNavigate: (view: string) => void;
  queryParams: any;
}

export default function SimulatedCheckout({ onNavigate, queryParams }: SimulatedCheckoutProps) {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState("4242 •••• •••• 4242");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("12/29");
  const [cardCvc, setCardCvc] = useState("•••");

  const assetId = queryParams.assetId;
  const price = queryParams.price || "0";
  const buyerEmail = queryParams.buyerEmail || "";
  const sessionId = queryParams.session_id || "";

  useEffect(() => {
    async function fetchAsset() {
      if (!assetId) return;
      try {
        const docRef = doc(db, "assets", assetId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAsset({ id: docSnap.id, ...docSnap.data() } as Asset);
        }
      } catch (err) {
        console.error("Error fetching asset details for checkout:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAsset();
  }, [assetId]);

  const handleAuthorize = () => {
    setProcessing(true);
    setTimeout(() => {
      // Redirect to success page
      const successUrl = `checkout/success?session_id=${sessionId}&assetId=${assetId}&buyerEmail=${encodeURIComponent(buyerEmail)}`;
      onNavigate(successUrl);
    }, 1800);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center font-mono text-xs text-zinc-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-t-2 border-violet-500 animate-spin" />
          <span>Configuring Simulated Gateway...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col md:flex-row text-zinc-100 relative overflow-hidden">
      {/* Background Glow Accents from Elegant Dark theme */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] bg-blue-600/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Left side - Product Details Summary */}
      <div className="flex-1 bg-zinc-900/10 border-r border-white/10 p-8 md:p-16 flex flex-col justify-between relative z-10">
        <div>
          <button
            onClick={() => onNavigate(`product:${assetId}`)}
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-xs font-mono mb-12 focus:outline-none cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to specifications
          </button>

          <div className="flex items-center gap-2 mb-6">
            <span className="px-2.5 py-0.5 text-[9px] font-mono uppercase bg-violet-950/40 border border-violet-500/20 text-violet-300 rounded-md">
              Stripe Simulation
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">Sandbox Mode</span>
          </div>

          <h2 className="text-zinc-500 text-xs uppercase font-mono tracking-widest mb-2">Purchase Order</h2>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight mb-8">
            {asset?.title || "Vertex.3D Asset"}
          </h1>

          <div className="flex items-center gap-4 py-4 border-y border-white/5 my-6">
            <div className="w-16 h-16 rounded-lg border border-dashed border-white/10 bg-zinc-950 flex items-center justify-center text-zinc-600">
              <Box className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-200">{asset?.title || "Blender Model"}</p>
              <p className="text-xs text-zinc-500 mt-0.5 font-mono">.blend format ({asset?.category || "3D Asset"})</p>
            </div>
          </div>

          <div className="flex justify-between items-center py-2 text-sm">
            <span className="text-zinc-400">Subtotal</span>
            <span className="font-mono">${price}</span>
          </div>
          <div className="flex justify-between items-center py-2 text-sm">
            <span className="text-zinc-400">VAT / Taxes</span>
            <span className="font-mono text-zinc-500">$0.00</span>
          </div>
          <div className="flex justify-between items-center py-4 border-t border-white/5 text-lg font-bold mt-4">
            <span className="text-white">Total Due</span>
            <span className="font-mono text-violet-400">${price}</span>
          </div>
        </div>

        <div className="mt-12 text-xs text-zinc-500 font-mono flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>This is an official secure demo checkout simulation.</span>
        </div>
      </div>

      {/* Right side - Card payment input form */}
      <div className="flex-grow flex-1 p-8 md:p-16 max-w-xl mx-auto w-full flex flex-col justify-center relative z-10">
        <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle violet overlay */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 blur-3xl rounded-full" />

          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-violet-400" />
              <h2 className="text-sm font-semibold font-mono uppercase tracking-wider text-zinc-200">
                Card Information
              </h2>
            </div>
            <Lock className="w-4 h-4 text-zinc-600" />
          </div>

          <div className="space-y-4">
            {/* Email prefilled */}
            <div>
              <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">
                Billing Email
              </label>
              <input
                type="email"
                readOnly
                value={buyerEmail}
                className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-mono text-zinc-300 focus:outline-none"
              />
            </div>

            {/* Simulated Card form */}
            <div>
              <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">
                Card Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={cardNumber}
                  className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-mono text-zinc-400 focus:outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono bg-violet-500/10 border border-violet-500/20 text-violet-300 px-2 py-0.5 rounded">
                  TEST CARD
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">
                  Expiry
                </label>
                <input
                  type="text"
                  readOnly
                  value={cardExpiry}
                  className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-mono text-zinc-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">
                  CVC
                </label>
                <input
                  type="text"
                  readOnly
                  value={cardCvc}
                  className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-mono text-zinc-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={handleAuthorize}
                disabled={processing}
                className="w-full py-4 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800/40 text-white font-mono text-sm tracking-wider uppercase font-semibold transition-all duration-200 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-t-transparent border-white animate-spin" />
                    <span>Processing Secure Payment...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Authorize Payment (${price})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate(`product:${assetId}`)}
          className="text-center text-xs font-mono text-zinc-600 hover:text-zinc-400 transition-colors mt-6 cursor-pointer"
        >
          Cancel payment and return to marketplace
        </button>
      </div>
    </div>
  );
}
