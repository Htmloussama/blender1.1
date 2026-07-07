import React, { useState, useEffect } from "react";
import { Search, ShoppingBag, Box, Download, HelpCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Asset, Order } from "../types";

interface MyPurchasesProps {
  onNavigate: (view: string) => void;
}

export default function MyPurchases({ onNavigate }: MyPurchasesProps) {
  const [emailQuery, setEmailQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [purchasedAssets, setPurchasedAssets] = useState<Asset[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load local device purchases on first render
  useEffect(() => {
    async function loadLocalPurchases() {
      setLoading(true);
      setError(null);
      try {
        const localAssetIds: string[] = JSON.parse(localStorage.getItem("vertex_purchases") || "[]");
        if (localAssetIds.length > 0) {
          const loaded: Asset[] = [];
          for (const id of localAssetIds) {
            const docRef = doc(db, "assets", id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              loaded.push({ id: docSnap.id, ...docSnap.data() } as Asset);
            }
          }
          setPurchasedAssets(loaded);
        }
      } catch (err) {
        console.error("Error loading local purchases:", err);
      } finally {
        setLoading(false);
      }
    }
    loadLocalPurchases();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailQuery.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      // Query completed orders for this email
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, where("buyerEmail", "==", emailQuery.trim()), where("status", "==", "completed"));
      const querySnap = await getDocs(q);

      const assetIds = new Set<string>();
      querySnap.forEach((doc) => {
        const orderData = doc.data() as Order;
        if (orderData.assetId) {
          assetIds.add(orderData.assetId);
        }
      });

      if (assetIds.size === 0) {
        setPurchasedAssets([]);
        setLoading(false);
        return;
      }

      // Fetch assets for all unique matched IDs
      const loaded: Asset[] = [];
      for (const id of Array.from(assetIds)) {
        const docRef = doc(db, "assets", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          loaded.push({ id: docSnap.id, ...docSnap.data() } as Asset);
        }
      }

      setPurchasedAssets(loaded);
    } catch (err: any) {
      console.error("Error searching orders by email:", err);
      setError("An error occurred searching past orders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (asset: Asset) => {
    if (asset.fileUrl && asset.fileUrl.startsWith("/uploads/")) {
      const link = document.createElement("a");
      link.href = asset.fileUrl;
      link.download = asset.fileName || `${asset.title.toLowerCase().replace(/\s+/g, "_")}.blend`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Sandbox binary download fallback
      const content = `Vertex.3D Blender Asset file payload dummy\nAsset ID: ${asset.id}\nTitle: ${asset.title}\nFormat: Blender 3D Graphics\nFile: ${asset.fileName || "unknown"}`;
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
  };

  return (
    <div className="min-h-screen bg-[#09090b] pt-32 pb-16 px-6 relative overflow-hidden">
      {/* Background Glow Accents from Elegant Dark theme */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] bg-blue-600/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-3">
            <span className="p-1 rounded bg-violet-950/40 border border-violet-500/20 text-violet-400">
              <ShoppingBag className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              Purchased Records
            </span>
          </div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">
            My Downloads
          </h1>
          <p className="text-zinc-400 text-sm mt-1 max-w-lg leading-relaxed">
            Access past acquisitions and trigger direct .blend file downloads associated with your device or billing email address.
          </p>
        </div>

        {/* Email Search Lookup Card */}
        <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6 mb-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 blur-3xl rounded-full" />
          
          <h2 className="text-sm font-semibold text-zinc-200 mb-2">Sync with Billing Email</h2>
          <p className="text-xs text-zinc-500 leading-relaxed mb-6">
            If you purchased models from another computer, input your billing email to retrieve and authorize your download tokens.
          </p>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                required
                placeholder="Enter billing email used during purchase..."
                value={emailQuery}
                onChange={(e) => setEmailQuery(e.target.value)}
                className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-violet-500/50 rounded-xl pl-11 pr-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none font-mono transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white font-mono text-xs tracking-wider uppercase font-semibold transition-colors cursor-pointer shrink-0"
            >
              {loading ? "Searching..." : "Retrieve Downloads"}
            </button>
          </form>
        </div>

        {/* Purchases List */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center font-mono text-xs text-zinc-600 gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent border-violet-500 animate-spin" />
            <span>Resolving transaction catalogs...</span>
          </div>
        ) : error ? (
          <div className="py-8 text-center text-red-400 font-mono text-xs">
            {error}
          </div>
        ) : purchasedAssets.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase text-zinc-500 tracking-wider mb-2">
              Unlocked Assets ({purchasedAssets.length})
            </h3>
            {purchasedAssets.map((asset) => (
              <div
                key={asset.id}
                className="bg-zinc-900/40 border border-white/10 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-violet-500/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Miniature Image Slot (Strictly Empty as per guidelines) */}
                  <div className="w-12 h-12 rounded-lg border border-dashed border-white/10 bg-zinc-950 flex items-center justify-center text-zinc-600 shrink-0">
                    <Box className="w-5 h-5 stroke-[1.5]" />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono uppercase text-violet-400 bg-violet-950/40 border border-violet-500/20 px-2 py-0.5 rounded">
                      {asset.category}
                    </span>
                    <h4 className="text-sm font-semibold text-zinc-200 mt-1">{asset.title}</h4>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      Filename: {asset.fileName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto self-end sm:self-center justify-between sm:justify-start">
                  <button
                    onClick={() => onNavigate(`product:${asset.id}`)}
                    className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    Details <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDownload(asset)}
                    className="px-4 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-violet-500/30 text-violet-400 hover:text-violet-300 font-mono text-xs font-semibold uppercase flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-zinc-900/20 border border-dashed border-white/10 rounded-2xl py-16 px-6 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-600 mx-auto mb-4">
              <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-400">No unlocked models detected</h3>
            <p className="text-xs text-zinc-600 leading-relaxed max-w-xs mx-auto mt-1.5">
              {searched
                ? "No completed orders matching this email were discovered. Check spelling or try a different billing address."
                : "No past checkout downloads found on this browser. Try syncing with your billing email to retrieve order history."}
            </p>
            <button
              onClick={() => onNavigate("marketplace")}
              className="mt-6 text-xs font-mono text-violet-400 hover:text-violet-300 transition-colors cursor-pointer uppercase tracking-wider font-semibold"
            >
              Browse Blender Marketplace
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
