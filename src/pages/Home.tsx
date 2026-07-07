import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Asset } from "../types";
import { Search, Filter, Grid, HelpCircle, ArrowRight, ShieldCheck, Box, SlidersHorizontal, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import ProductCard from "../components/ProductCard";

interface HomeProps {
  onNavigate: (view: string) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">("all");

  const categories = ["All", "Characters", "Props", "Environments", "Vehicles"];

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const querySnap = await getDocs(collection(db, "assets"));
      const loaded: Asset[] = [];
      querySnap.forEach((docSnap) => {
        loaded.push({ id: docSnap.id, ...docSnap.data() } as Asset);
      });

      // If the database is completely empty on first launch, let's automatically seed
      // 3 beautiful product specs with empty visual slots to make it instantly interactive!
      if (loaded.length === 0) {
        console.log("Seeding premium default catalogs...");
        const seedData: Asset[] = [
          {
            id: "asset_seed_1",
            title: "Cyberpunk Mech Mech-X1",
            category: "Characters",
            price: 29.00,
            description: "High-fidelity futuristic mech warrior rig. Features complex hard-surface panels, fully mapped UVs, and custom armature bones for effortless action sequence poses. Clean viewport-ready file.",
            imageUrls: [], // Strictly empty as required
            fileUrl: "",
            fileName: "mech_rig_v1_0.blend",
            createdAt: Date.now() - 3600000 * 24,
            downloadsCount: 14,
            viewsCount: 142
          },
          {
            id: "asset_seed_2",
            title: "Gothic Cathedral Ruins",
            category: "Environments",
            price: 0.00, // FREE
            description: "A gorgeous historic modular ruins pack for Blender. Includes arches, columns, modular stone fragments, and basic stone shaders. Optimised for dynamic Cycles rendering.",
            imageUrls: [], // Strictly empty as required
            fileUrl: "",
            fileName: "gothic_modular_ruins.blend",
            createdAt: Date.now() - 3600000 * 12,
            downloadsCount: 89,
            viewsCount: 421
          },
          {
            id: "asset_seed_3",
            title: "Vintage Sci-Fi Console",
            category: "Props",
            price: 12.00,
            description: "Retro retro-futuristic mechanical dashboard with realistic toggle buttons, analog display lights, and customizable viewport shaders. Low-poly & game-ready geometry.",
            imageUrls: [], // Strictly empty as required
            fileUrl: "",
            fileName: "scifi_dashboard_console.blend",
            createdAt: Date.now() - 3600000 * 48,
            downloadsCount: 8,
            viewsCount: 65
          }
        ];

        for (const item of seedData) {
          await setDoc(doc(db, "assets", item.id), item);
        }
        setAssets(seedData);
      } else {
        setAssets(loaded);
      }
    } catch (err) {
      console.error("Error reading marketplace catalogs:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter listings based on controls
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          asset.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "All" || asset.category === selectedCategory;

    const matchesPrice = priceFilter === "all" ||
                         (priceFilter === "free" && asset.price === 0) ||
                         (priceFilter === "paid" && asset.price > 0);

    return matchesSearch && matchesCategory && matchesPrice;
  });

  const getCategoryCount = (catName: string) => {
    if (catName === "All") return assets.length;
    return assets.filter((a) => a.category === catName).length;
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 pb-24 relative overflow-hidden">
      {/* Background Glow Accents from Elegant Dark theme */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] bg-blue-600/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Hero Branding Section */}
      <div className="relative pt-36 pb-12 px-6 z-10">
        <div className="max-w-7xl mx-auto flex flex-col items-start">
          {/* Subtle Tag banner */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-950/30 border border-violet-500/15 backdrop-blur-sm text-violet-300 font-mono text-[10px] tracking-widest uppercase mb-4 font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-violet-400" />
            Curated .blend Assets
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="text-4xl md:text-6xl font-black italic tracking-tighter text-white mb-3 leading-none uppercase"
          >
            NEXT-GEN <span className="text-violet-500 underline decoration-white/10">BLENDER</span> ASSETS
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-zinc-500 text-sm md:text-base max-w-xl leading-relaxed"
          >
            Curation of ultra-high quality, render-ready assets for professional digital artists and game developers. Streamlined one-click checkouts directly via Stripe.
          </motion.p>
        </div>
      </div>

      {/* Main Split-Layout Area */}
      <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row gap-10 relative z-10">
        {/* Sidebar / Filters */}
        <aside className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-8 lg:border-r lg:border-white/5 lg:pr-8">
          <div>
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Categories</h3>
            <ul className="space-y-3">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                const count = getCategoryCount(cat);
                return (
                  <li key={cat}>
                    <button
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full flex items-center justify-between text-sm transition-colors cursor-pointer ${
                        isSelected ? "text-violet-400 font-medium" : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      <span>{cat === "All" ? "All Assets" : cat}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        isSelected ? "bg-violet-500/20 text-violet-400" : "bg-white/5 text-zinc-500"
                      }`}>
                        {count}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Price Type</h3>
            <div className="flex flex-col gap-3">
              {[
                { value: "all", label: "Show All" },
                { value: "free", label: "Free Only" },
                { value: "paid", label: "Paid Only" }
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPriceFilter(opt.value as any)}
                  className="flex items-center gap-2.5 text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer py-0.5"
                >
                  <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-all ${
                    priceFilter === opt.value
                      ? "bg-violet-600 border-none"
                      : "border-white/20 bg-transparent"
                  }`}>
                    {priceFilter === opt.value && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span className={priceFilter === opt.value ? "text-violet-400 font-medium" : ""}>
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-violet-600/10 border border-violet-500/20 rounded-xl">
            <p className="text-xs text-violet-300 font-medium leading-relaxed">
              Are you a creator? Open your own studio store today and sell your assets.
            </p>
            <button
              onClick={() => onNavigate("admin")}
              className="mt-3 w-full py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer font-mono tracking-wider uppercase"
            >
              Open Creator Portal
            </button>
          </div>
        </aside>

        {/* Main Content Pane */}
        <div className="flex-1">
          {/* Search container */}
          <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-4 mb-8 flex items-center gap-3">
            <Search className="w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search assets by description or specs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-zinc-100 text-sm w-full placeholder-zinc-600"
            />
          </div>

          {/* Listings Grid */}
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center font-mono text-xs text-zinc-600 gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-t-transparent border-violet-500 animate-spin" />
              <span>Polling listing databases...</span>
            </div>
          ) : filteredAssets.length > 0 ? (
            <motion.div
              initial="hidden"
              animate="show"
              variants={{
                show: {
                  transition: {
                    staggerChildren: 0.1
                  }
                }
              }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredAssets.map((asset) => (
                <ProductCard
                  key={asset.id}
                  asset={asset}
                  onClick={() => onNavigate(`product:${asset.id}`)}
                />
              ))}
            </motion.div>
          ) : (
            <div className="py-20 text-center border border-dashed border-zinc-900 rounded-2xl max-w-sm mx-auto">
              <Box className="w-10 h-10 stroke-[1] text-zinc-700 mx-auto mb-3" />
              <p className="text-xs text-zinc-500">No Blender models match your selected filters.</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                  setPriceFilter("all");
                }}
                className="mt-4 text-xs font-mono text-violet-400 hover:text-violet-300 transition-colors uppercase cursor-pointer"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
