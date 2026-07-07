import React, { useState, useEffect } from "react";
import { Box, Download, ShieldAlert, ArrowLeft, Layers, FileCode, CheckCircle, Mail, Sparkles } from "lucide-react";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase";
import { Asset, Order } from "../types";
import ImagePlaceholder from "../components/ImagePlaceholder";

interface ProductDetailProps {
  assetId: string;
  onNavigate: (view: string) => void;
}

export default function ProductDetail({ assetId, onNavigate }: ProductDetailProps) {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buyerEmail, setBuyerEmail] = useState("");
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [purchasedLocally, setPurchasedLocally] = useState(false);

  useEffect(() => {
    async function fetchAsset() {
      try {
        const docRef = doc(db, "assets", assetId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setAsset({ id: docSnap.id, ...docSnap.data() } as Asset);
          
          // Increment view count in firestore
          await updateDoc(docRef, {
            viewsCount: increment(1)
          });
        } else {
          setError("Requested 3D model does not exist or has been removed.");
        }
      } catch (err: any) {
        console.error("Error fetching product:", err);
        setError("Unable to retrieve asset specifications.");
      } finally {
        setLoading(false);
      }
    }

    fetchAsset();

    // Check if purchased locally
    const localPurchases = JSON.parse(localStorage.getItem("vertex_purchases") || "[]");
    if (localPurchases.includes(assetId)) {
      setPurchasedLocally(true);
    }
  }, [assetId]);

  const handleFreeDownload = async () => {
    if (!asset) return;
    setCheckoutLoading(true);

    try {
      // Free download logs as a completed order instantly with user's local marker or prefilled/custom free email
      const transactionId = `free_tx_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const orderRef = doc(db, "orders", transactionId);
      
      const email = buyerEmail.trim() || "guest-downloader@vertex.3d";

      const newOrder: Order = {
        id: transactionId,
        buyerEmail: email,
        assetId: asset.id,
        assetTitle: asset.title,
        pricePaid: 0,
        status: "completed",
        createdAt: Date.now()
      };

      await setDoc(orderRef, newOrder);

      // Increment downloads count
      const assetRef = doc(db, "assets", asset.id);
      await updateDoc(assetRef, {
        downloadsCount: increment(1)
      });

      // Update local storage
      const localPurchases = JSON.parse(localStorage.getItem("vertex_purchases") || "[]");
      if (!localPurchases.includes(asset.id)) {
        localPurchases.push(asset.id);
        localStorage.setItem("vertex_purchases", JSON.stringify(localPurchases));
      }

      setPurchasedLocally(true);

      // Download file binary
      if (asset.fileUrl && asset.fileUrl.startsWith("/uploads/")) {
        const link = document.createElement("a");
        link.href = asset.fileUrl;
        link.download = asset.fileName || `${asset.title.toLowerCase().replace(/\s+/g, "_")}.blend`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Dummy blend download fallback
        const content = `Vertex.3D Blender Asset file payload dummy\nAsset ID: ${asset.id}\nTitle: ${asset.title}\nFormat: Blender 3D Graphics\nLicensed: Free Download`;
        const blob = new Blob([content], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${asset.title.toLowerCase().replace(/\s+/g, "_")}.blend`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Free download tracking error:", err);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handlePaidCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerEmail.trim() || !asset) return;

    setCheckoutLoading(true);
    setEmailModalOpen(false);

    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: asset.id,
          assetTitle: asset.title,
          price: asset.price,
          buyerEmail: buyerEmail.trim()
        })
      });

      const session = await response.json();
      if (session.url) {
        // Redirect to either real Stripe checkout or the simulated sandbox page
        window.location.href = session.url;
      } else {
        alert("Unable to generate purchase checkout session. Please try again.");
      }
    } catch (err) {
      console.error("Stripe session generation error:", err);
      alert("Network error connecting to payment gateway.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center font-mono text-xs text-zinc-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-t-2 border-violet-500 animate-spin" />
          <span>Syncing asset metrics...</span>
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-zinc-900/40 border border-white/10 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-display font-bold text-white mb-2">Asset Not Found</h1>
          <p className="text-zinc-400 text-sm leading-relaxed mb-6">{error || "The selected 3D model does not exist."}</p>
          <button
            onClick={() => onNavigate("marketplace")}
            className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-mono text-xs tracking-wider uppercase font-medium transition-all cursor-pointer"
          >
            Return to Marketplace
          </button>
        </div>
      </div>
    );
  }

  const isFree = asset.price === 0;

  return (
    <div className="min-h-screen bg-[#09090b] pt-32 pb-16 px-6 relative overflow-hidden">
      {/* Background Glow Accents from Elegant Dark theme */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] bg-blue-600/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="max-w-6xl mx-auto">
        {/* Back navigation */}
        <button
          onClick={() => onNavigate("marketplace")}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 text-xs font-mono mb-8 cursor-pointer focus:outline-none"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blender catalog
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
          {/* Left Column: Larger Gallery of Empty Placeholders */}
          <div className="lg:col-span-7 space-y-6">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-zinc-950">
              <ImagePlaceholder aspectRatio="aspect-video" label="Primary Render Slot" />
              {/* Category tag */}
              <span className="absolute top-4 left-4 px-3 py-1 text-[10px] font-mono tracking-wider font-semibold uppercase text-violet-300 bg-violet-950/40 border border-violet-500/20 backdrop-blur-md rounded-full">
                {asset.category}
              </span>
            </div>

            {/* Gallery slots - 3 slots below the primary render */}
            <div className="grid grid-cols-3 gap-4">
              <ImagePlaceholder aspectRatio="aspect-[4/3]" label="Wireframe Details" />
              <ImagePlaceholder aspectRatio="aspect-[4/3]" label="Texturing UV layout" />
              <ImagePlaceholder aspectRatio="aspect-[4/3]" label="Viewport shading" />
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/5 text-zinc-500 text-xs font-mono leading-relaxed flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
              <span>
                To satisfy creative constraints, all visual asset galleries render as genuinely empty. After purchasing, you can edit this product dynamically in the Studio console and upload your custom viewport render images.
              </span>
            </div>
          </div>

          {/* Right Column: Asset metadata & specs */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-widest block mb-2">
                  Premium 3D asset specifications
                </span>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight">
                  {asset.title}
                </h1>
                <p className="text-zinc-400 text-sm mt-3 leading-relaxed whitespace-pre-line">
                  {asset.description}
                </p>
              </div>

              {/* Technical features / Specifications list */}
              <div className="border-y border-white/5 py-6 space-y-3 font-mono text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span className="text-zinc-500">File Type</span>
                  <span className="text-zinc-300">Blender File (.blend)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Category / Tag</span>
                  <span className="text-zinc-300">{asset.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Included files</span>
                  <span className="text-zinc-300 truncate max-w-[200px]">{asset.fileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Analytics</span>
                  <span className="text-zinc-300">
                    {asset.viewsCount} view{asset.viewsCount !== 1 && "s"} &bull; {asset.downloadsCount} download{asset.downloadsCount !== 1 && "s"}
                  </span>
                </div>
              </div>
            </div>

            {/* Price section & Action buttons */}
            <div className="mt-8 bg-zinc-900/40 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 blur-2xl rounded-full" />
              
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                    Value Assessment
                  </span>
                  <span className="text-3xl font-display font-bold text-white">
                    {isFree ? "Free Download" : `$${asset.price}`}
                  </span>
                </div>
                <span className={`px-3 py-1 font-mono text-xs font-bold rounded-lg border uppercase ${
                  isFree 
                    ? "bg-emerald-950/40 border-emerald-500/20 text-emerald-400" 
                    : "bg-violet-950/40 border-violet-500/20 text-violet-300"
                }`}>
                  {isFree ? "Royalty Free" : "Standard License"}
                </span>
              </div>

              {purchasedLocally ? (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-950/20 border border-emerald-500/10 text-emerald-400 rounded-xl text-xs font-mono flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>You own this asset! Direct download is unlocked.</span>
                  </div>
                  <button
                    onClick={handleFreeDownload}
                    className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold tracking-wider uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Trigger Direct Download
                  </button>
                </div>
              ) : isFree ? (
                <div className="space-y-4">
                  <p className="text-[10px] text-zinc-500 font-mono leading-relaxed">
                    This model is provided as standard open-source. Inputting an email to log statistics is optional.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Billing/Contact Email (Optional)..."
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-violet-500/30 rounded-xl px-4 py-3 text-xs text-zinc-300 focus:outline-none font-mono"
                    />
                  </div>
                  <button
                    onClick={handleFreeDownload}
                    disabled={checkoutLoading}
                    className="w-full py-4 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800/50 text-white font-mono text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {checkoutLoading ? "Registering Download..." : "Free Download .blend"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={() => setEmailModalOpen(true)}
                    disabled={checkoutLoading}
                    className="w-full py-4 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800/50 text-white font-mono text-xs font-bold tracking-wider uppercase transition-all shadow-lg shadow-violet-500/10 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {checkoutLoading ? "Redirecting to Stripe..." : "Buy with Stripe Checkout"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stripe Email collection modal */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#09090b]/90 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 blur-3xl rounded-full" />
            
            <div className="flex items-center gap-2.5 text-white mb-6">
              <div className="p-2 rounded-lg bg-violet-950/40 border border-violet-500/20 text-violet-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg">Billing Contact</h3>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Before proceeding to Stripe</p>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed mb-6">
              Enter the email address where your secure download link and purchase records will be delivered. This will pre-fill the Stripe Checkout fields.
            </p>

            <form onSubmit={handlePaidCheckout} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
                  Customer Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-violet-500/30 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEmailModalOpen(false)}
                  className="flex-1 py-3.5 rounded-xl border border-zinc-900 hover:bg-zinc-900/40 text-zinc-500 hover:text-zinc-300 font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-mono text-xs uppercase tracking-wider font-semibold transition-all shadow-[0_4px_15px_rgba(139,92,246,0.3)] cursor-pointer"
                >
                  Proceed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
