import React, { useState, useEffect } from "react";
import { collection, query, getDocs, doc, setDoc, deleteDoc, updateDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { Asset, Order } from "../types";
import { Shield, Plus, Edit, Trash2, DollarSign, Download, Eye, FileBox, LayoutList, TrendingUp, Mail, LogIn, Sparkles, Box, Upload, Check, AlertTriangle } from "lucide-react";
import ImagePlaceholder from "../components/ImagePlaceholder";

interface AdminDashboardProps {
  onNavigate: (view: string) => void;
}

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [user, setUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState(true);
  
  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  // Dashboard states
  const [activeTab, setActiveTab] = useState<"analytics" | "listings">("analytics");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Asset creation / editing form state
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formCategory, setFormCategory] = useState("Props");
  const [formUploadError, setFormUploadError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // File states (for multipart server upload)
  const [selectedImages, setSelectedImages] = useState<FileList | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<File | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch metrics and product inventory if authorized
  useEffect(() => {
    if (user && user.email === "bitcoinoussama3@gmail.com") {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setLoadingData(true);
    try {
      // 1. Fetch Assets
      const assetsSnap = await getDocs(collection(db, "assets"));
      const loadedAssets: Asset[] = [];
      assetsSnap.forEach((doc) => {
        loadedAssets.push({ id: doc.id, ...doc.data() } as Asset);
      });
      setAssets(loadedAssets);

      // 2. Fetch Orders
      const ordersSnap = await getDocs(collection(db, "orders"));
      const loadedOrders: Order[] = [];
      ordersSnap.forEach((doc) => {
        loadedOrders.push({ id: doc.id, ...doc.data() } as Order);
      });
      setOrders(loadedOrders);
    } catch (err) {
      console.error("Error loading dashboard metrics:", err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error("Auth error:", err);
      setLoginError(err.message || "Invalid email or master password credentials.");
    }
  };

  const handleAssetDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this Blender asset?")) return;
    try {
      await deleteDoc(doc(db, "assets", id));
      await fetchDashboardData();
    } catch (err) {
      console.error("Error deleting asset:", err);
    }
  };

  const handleEditClick = (asset: Asset) => {
    setIsEditing(true);
    setEditId(asset.id);
    setFormTitle(asset.title);
    setFormDesc(asset.description);
    setFormPrice(asset.price);
    setFormCategory(asset.category);
    // Files are empty during edit unless re-uploaded
    setSelectedImages(null);
    setSelectedAsset(null);
  };

  const handleFormReset = () => {
    setIsEditing(false);
    setEditId(null);
    setFormTitle("");
    setFormDesc("");
    setFormPrice(0);
    setFormCategory("Props");
    setSelectedImages(null);
    setSelectedAsset(null);
    setFormUploadError(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormUploadError(null);
    setFormSubmitting(true);

    try {
      let finalImages: string[] = [];
      let finalFileUrl = "";
      let finalFileName = "model.blend";

      // If we are editing, fetch the existing asset properties first to keep original file routes if not changed
      if (isEditing && editId) {
        const docSnap = await getDoc(doc(db, "assets", editId));
        if (docSnap.exists()) {
          const currentData = docSnap.data();
          finalImages = currentData.imageUrls || [];
          finalFileUrl = currentData.fileUrl || "";
          finalFileName = currentData.fileName || "model.blend";
        }
      }

      // If there are files to upload to the server
      if (selectedImages || selectedAsset) {
        const formData = new FormData();
        
        if (selectedImages) {
          for (let i = 0; i < selectedImages.length; i++) {
            formData.append("images", selectedImages[i]);
          }
        }
        if (selectedAsset) {
          formData.append("assetFile", selectedAsset);
        }

        const uploadResp = await fetch("/api/upload", {
          method: "POST",
          body: formData
        });

        const uploadData = await uploadResp.json();
        if (uploadData.success) {
          if (uploadData.images && uploadData.images.length > 0) {
            finalImages = uploadData.images; // Overwrite or update
          }
          if (uploadData.assetFile) {
            finalFileUrl = uploadData.assetFile.path;
            finalFileName = uploadData.assetFile.name;
          }
        } else {
          throw new Error(uploadData.error || "Files upload rejected by server.");
        }
      }

      // Enforce file existence during creation
      if (!isEditing && !finalFileUrl) {
        throw new Error("You must select a .blend asset file to upload for new listings.");
      }

      const docId = isEditing && editId ? editId : `asset_${Date.now()}`;
      const assetDocRef = doc(db, "assets", docId);

      const assetPayload = {
        title: formTitle,
        description: formDesc,
        price: Number(formPrice),
        category: formCategory,
        imageUrls: finalImages,
        fileUrl: finalFileUrl,
        fileName: finalFileName,
        updatedAt: Date.now()
      };

      if (isEditing) {
        await updateDoc(assetDocRef, assetPayload);
      } else {
        await setDoc(assetDocRef, {
          ...assetPayload,
          id: docId,
          createdAt: Date.now(),
          downloadsCount: 0,
          viewsCount: 0
        });
      }

      handleFormReset();
      await fetchDashboardData();
    } catch (err: any) {
      console.error("Form submit error:", err);
      setFormUploadError(err.message || "An error occurred compiling asset properties.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Check auth and authorized admin status
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center font-mono text-xs text-zinc-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-t-2 border-violet-500 animate-spin" />
          <span>Validating admin certificates...</span>
        </div>
      </div>
    );
  }

  // If not signed in or not the admin account
  if (!user || user.email !== "bitcoinoussama3@gmail.com") {
    return (
      <div className="min-h-screen bg-[#09090b] pt-32 pb-16 px-6 flex items-center justify-center relative overflow-hidden">
        {/* Background Glow Accents */}
        <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-violet-600/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="max-w-md w-full relative z-10">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 blur-3xl rounded-full" />
            
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-violet-950/40 border border-violet-500/20 text-violet-400 rounded-xl">
                <Shield className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h1 className="font-display font-bold text-xl text-white">Vertex.3D Studio</h1>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Seller Control Panel</p>
              </div>
            </div>

            {user && user.email !== "bitcoinoussama3@gmail.com" && (
              <div className="mb-6 p-4 bg-amber-950/20 border border-amber-500/10 rounded-xl text-amber-400 text-xs font-mono flex items-start gap-2.5 leading-relaxed">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  The account <strong className="text-zinc-200">{user.email}</strong> is not authorized as the master seller/admin. Please sign out and sign in using the seller credentials.
                </span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
                  Seller Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="bitcoinoussama3@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-violet-500/30 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
                  Master Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-violet-500/30 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none font-mono"
                />
              </div>

              {loginError && (
                <div className="text-red-400 font-mono text-[11px] leading-normal pt-2">
                  ⚠️ {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-4 mt-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-mono text-xs uppercase tracking-wider font-semibold transition-all shadow-[0_4px_20px_rgba(139,92,246,0.2)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                Authenticate Console
              </button>
            </form>

            <div className="border-t border-white/5 mt-6 pt-4 text-center">
              <button
                onClick={() => onNavigate("marketplace")}
                className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                &larr; Back to Blender Marketplace
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard calculations
  const totalRevenue = orders.reduce((sum, order) => sum + (order.status === "completed" ? order.pricePaid : 0), 0);
  const totalDownloads = orders.filter(o => o.status === "completed").length;
  const totalViews = assets.reduce((sum, a) => sum + (a.viewsCount || 0), 0);
  const totalDownloadsCount = assets.reduce((sum, a) => sum + (a.downloadsCount || 0), 0);

  return (
    <div className="min-h-screen bg-[#09090b] pt-32 pb-16 px-6 relative overflow-hidden">
      {/* Background Glow Accents from Elegant Dark theme */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] bg-blue-600/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-2 text-violet-400">
              <Shield className="w-4 h-4 animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest font-semibold">Studio Admin Center</span>
            </div>
            <h1 className="text-3xl font-display font-bold text-white tracking-tight">
              Vertex Studio Console
            </h1>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-zinc-500">
            <span>Admin ID:</span>
            <span className="text-zinc-300">bitcoinoussama3@gmail.com</span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-white/5 mb-8 gap-6">
          <button
            onClick={() => setActiveTab("analytics")}
            className={`pb-4 text-sm font-semibold tracking-wider font-mono uppercase border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "analytics"
                ? "text-violet-400 border-violet-500"
                : "text-zinc-500 border-transparent hover:text-zinc-300"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Sales & Analytics
          </button>
          <button
            onClick={() => setActiveTab("listings")}
            className={`pb-4 text-sm font-semibold tracking-wider font-mono uppercase border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "listings"
                ? "text-violet-400 border-violet-500"
                : "text-zinc-500 border-transparent hover:text-zinc-300"
            }`}
          >
            <LayoutList className="w-4 h-4" />
            Manage Listings ({assets.length})
          </button>
        </div>

        {/* Tab Content 1: Sales & Analytics */}
        {activeTab === "analytics" && (
          <div className="space-y-10">
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 text-zinc-800">
                  <DollarSign className="w-12 h-12 stroke-[1]" />
                </div>
                <p className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider">Gross Income</p>
                <h3 className="text-2xl font-display font-bold text-white mt-1.5">${totalRevenue.toFixed(2)}</h3>
                <p className="text-[10px] text-zinc-600 font-mono mt-1">Stripe verified earnings</p>
              </div>

              <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 text-zinc-800">
                  <Download className="w-12 h-12 stroke-[1]" />
                </div>
                <p className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider">Total Downloads</p>
                <h3 className="text-2xl font-display font-bold text-white mt-1.5">{totalDownloadsCount}</h3>
                <p className="text-[10px] text-zinc-600 font-mono mt-1">Free & paid acquisitions</p>
              </div>

              <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 text-zinc-800">
                  <Eye className="w-12 h-12 stroke-[1]" />
                </div>
                <p className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider">Total Views</p>
                <h3 className="text-2xl font-display font-bold text-white mt-1.5">{totalViews}</h3>
                <p className="text-[10px] text-zinc-600 font-mono mt-1">Unique details loads</p>
              </div>

              <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 text-zinc-800">
                  <TrendingUp className="w-12 h-12 stroke-[1]" />
                </div>
                <p className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider">Conversions</p>
                <h3 className="text-2xl font-display font-bold text-white mt-1.5">
                  {totalViews > 0 ? ((totalDownloadsCount / totalViews) * 100).toFixed(1) : "0.0"}%
                </h3>
                <p className="text-[10px] text-zinc-600 font-mono mt-1">Acquisitions per views</p>
              </div>
            </div>

            {/* Detailed performance list per asset */}
            <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6">
              <h2 className="text-base font-bold text-zinc-200 mb-6">Listing Conversion breakdown</h2>
              {assets.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-mono text-xs text-zinc-400">
                    <thead>
                      <tr className="border-b border-white/5 pb-3 text-zinc-500 uppercase tracking-wider">
                        <th className="py-3 font-semibold">Blender Model</th>
                        <th className="py-3 font-semibold">License</th>
                        <th className="py-3 font-semibold">Views</th>
                        <th className="py-3 font-semibold">Downloads</th>
                        <th className="py-3 font-semibold">Conversions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {assets.map((asset) => (
                        <tr key={asset.id} className="hover:bg-zinc-900/10">
                          <td className="py-4 font-sans font-medium text-zinc-200">{asset.title}</td>
                          <td className="py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${asset.price === 0 ? "bg-emerald-950/30 text-emerald-400" : "bg-violet-950/30 text-violet-400"}`}>
                              {asset.price === 0 ? "FREE" : `$${asset.price}`}
                            </span>
                          </td>
                          <td className="py-4 text-zinc-300">{asset.viewsCount || 0}</td>
                          <td className="py-4 text-zinc-300">{asset.downloadsCount || 0}</td>
                          <td className="py-4 text-violet-400 font-semibold">
                            {asset.viewsCount > 0 ? (((asset.downloadsCount || 0) / asset.viewsCount) * 100).toFixed(1) : "0.0"}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-zinc-600 py-6 font-mono text-xs">No active models listed yet.</p>
              )}
            </div>

            {/* Email Captures / Completed Orders logs */}
            <div className="bg-zinc-900/40 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-6 text-zinc-200">
                <Mail className="w-4 h-4 text-violet-400" />
                <h2 className="text-base font-bold">Buyer Email Registries & Orders</h2>
              </div>
              
              {orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-mono text-xs text-zinc-400">
                    <thead>
                      <tr className="border-b border-white/5 text-zinc-500 uppercase tracking-wider">
                        <th className="py-3 font-semibold">Order ID</th>
                        <th className="py-3 font-semibold">Buyer Email</th>
                        <th className="py-3 font-semibold">Model Title</th>
                        <th className="py-3 font-semibold">Paid</th>
                        <th className="py-3 font-semibold">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-zinc-900/10">
                          <td className="py-4 text-zinc-500 font-mono text-[10px] truncate max-w-[120px]">{order.id}</td>
                          <td className="py-4 text-zinc-200 font-semibold">{order.buyerEmail}</td>
                          <td className="py-4 font-sans text-zinc-300">{order.assetTitle}</td>
                          <td className="py-4 font-bold text-violet-400">${order.pricePaid}</td>
                          <td className="py-4 text-zinc-500">{new Date(order.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-zinc-600 py-6 font-mono text-xs">No orders completed yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Tab Content 2: Manage Listings */}
        {activeTab === "listings" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left side: Upload Form (Always empty boxes, strictly as requested) */}
            <div className="lg:col-span-5 bg-zinc-900/40 border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden self-start">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 blur-3xl rounded-full" />

              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2 mb-2">
                {isEditing ? <Edit className="w-5 h-5 text-violet-400" /> : <Plus className="w-5 h-5 text-violet-400" />}
                {isEditing ? "Edit 3D Model Spec" : "Add Blender Design"}
              </h2>
              <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
                Add title, description, and upload the source .blend files. All graphic gallery slots remain unpopulated until manual render upload.
              </p>

              <form onSubmit={handleFormSubmit} className="space-y-4 font-mono text-xs text-zinc-400">
                <div>
                  <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">Model Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cyberpunk Hover Bike"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200 font-sans focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200 focus:outline-none font-sans"
                  >
                    <option value="Characters">Characters</option>
                    <option value="Props">Props</option>
                    <option value="Environments">Environments</option>
                    <option value="Vehicles">Vehicles</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">Price ($USD, 0 for free)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-1.5">Model Description</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide polycount, formatting details, texturing types, UV layouts..."
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-200 font-sans focus:outline-none leading-relaxed"
                  />
                </div>

                {/* .blend asset file upload (Displays name once selected, otherwise clean/empty dashed box) */}
                <div>
                  <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
                    Source file (.blend)
                  </label>
                  <label className="relative flex flex-col items-center justify-center border border-dashed border-zinc-800 hover:border-violet-500/40 bg-zinc-950/40 rounded-xl p-6 cursor-pointer text-center group">
                    <input
                      type="file"
                      accept=".blend"
                      onChange={(e) => e.target.files && setSelectedAsset(e.target.files[0])}
                      className="hidden"
                    />
                    {selectedAsset ? (
                      <div className="text-zinc-200 flex flex-col items-center gap-1">
                        <Check className="w-6 h-6 text-emerald-400" />
                        <span className="text-xs font-semibold">{selectedAsset.name}</span>
                        <span className="text-[10px] text-zinc-500 uppercase">Ready for upload ({(selectedAsset.size / (1024 * 1024)).toFixed(2)} MB)</span>
                      </div>
                    ) : (
                      <div className="text-zinc-500 group-hover:text-zinc-400">
                        <Upload className="w-6 h-6 stroke-[1.5] mx-auto mb-2 text-zinc-600 group-hover:text-violet-400 transition-colors" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">Select source .blend file</span>
                        <p className="text-[9px] text-zinc-600 mt-0.5">Mandatory download file for buyers</p>
                      </div>
                    )}
                  </label>
                </div>

                {/* Image Slots (Genuinely empty dashed borders, uploads status updates locally) */}
                <div>
                  <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-wider mb-2">
                    Product Render Uploads (Optional)
                  </label>
                  <label className="relative flex flex-col items-center justify-center border border-dashed border-zinc-800 hover:border-violet-500/40 bg-zinc-950/40 rounded-xl p-6 cursor-pointer text-center group">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => e.target.files && setSelectedImages(e.target.files)}
                      className="hidden"
                    />
                    {selectedImages && selectedImages.length > 0 ? (
                      <div className="text-zinc-200 flex flex-col items-center gap-1">
                        <Check className="w-6 h-6 text-emerald-400" />
                        <span className="text-xs font-semibold">{selectedImages.length} Image{selectedImages.length !== 1 && "s"} Selected</span>
                        <span className="text-[10px] text-zinc-500 uppercase">Will replace preview slot</span>
                      </div>
                    ) : (
                      <div className="text-zinc-500 group-hover:text-zinc-400">
                        <Upload className="w-6 h-6 stroke-[1.5] mx-auto mb-2 text-zinc-600 group-hover:text-violet-400 transition-colors" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">Queue showcase renders</span>
                        <p className="text-[9px] text-zinc-600 mt-0.5">Supports multi-file uploads (png, jpeg)</p>
                      </div>
                    )}
                  </label>
                </div>

                {formUploadError && (
                  <div className="text-red-400 text-[10px] pt-1">
                    ⚠️ {formUploadError}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-4">
                  {isEditing && (
                    <button
                      type="button"
                      onClick={handleFormReset}
                      className="flex-1 py-3 border border-zinc-800 rounded-xl hover:bg-zinc-900 text-zinc-400 font-semibold uppercase tracking-wider transition-colors cursor-pointer text-center"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800/40 text-white font-semibold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-violet-500/10 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {formSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-t-transparent border-white rounded-full animate-spin" />
                        <span>Compiling Assets...</span>
                      </>
                    ) : (
                      <span>{isEditing ? "Update listing" : "Publish Blender Model"}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Right side: Active listings directory */}
            <div className="lg:col-span-7 bg-zinc-900/40 border border-white/10 rounded-3xl p-6">
              <h2 className="text-base font-bold text-zinc-200 mb-6">Active Marketplace Listings</h2>

              {assets.length > 0 ? (
                <div className="space-y-4">
                  {assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="p-4 bg-zinc-900/40 border border-white/5 rounded-xl flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4">
                        {/* Miniature Empty Placeholder box */}
                        <div className="w-10 h-10 rounded border border-dashed border-white/10 bg-zinc-950 flex items-center justify-center text-zinc-700 shrink-0">
                          <Box className="w-4 h-4 stroke-[1.5]" />
                        </div>
                        <div>
                          <span className="text-[9px] font-mono uppercase bg-violet-950/30 text-violet-400 px-1.5 py-0.5 rounded border border-violet-500/10">
                            {asset.category}
                          </span>
                          <h4 className="text-sm font-semibold text-zinc-200 mt-1">{asset.title}</h4>
                          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                            {asset.price === 0 ? "FREE" : `$${asset.price}`} &bull; {asset.fileName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleEditClick(asset)}
                          className="p-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg hover:border-zinc-700 transition-all cursor-pointer"
                          title="Edit Specs"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleAssetDelete(asset.id)}
                          className="p-2 bg-zinc-900 border border-zinc-800 text-red-400 hover:text-red-300 rounded-lg hover:border-red-500/20 transition-all cursor-pointer"
                          title="Delete Listing"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center border border-dashed border-zinc-900 rounded-2xl max-w-sm mx-auto">
                  <FileBox className="w-10 h-10 stroke-[1] text-zinc-700 mx-auto mb-3" />
                  <p className="text-xs text-zinc-500">Your Blender catalog is currently unpopulated.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
