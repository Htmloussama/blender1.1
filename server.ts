import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import Stripe from "stripe";
import multer from "multer";

// Initialize express app
const app = express();
const PORT = 3000;

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Ensure the directory for builds exists in production
const DIST_DIR = path.join(process.cwd(), "dist");

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Sanitize filename and append unique timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, "_");
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max file size
  }
});

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded assets statically
app.use("/uploads", express.static(UPLOADS_DIR));

// Lazy-loaded Stripe Client
let stripeClient: Stripe | null = null;
function getStripe(): Stripe | null {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return null;
  }
  if (!stripeClient) {
    stripeClient = new Stripe(stripeKey, {
      apiVersion: "2025-02-24" as any // Use standard stable or modern Stripe API version
    });
  }
  return stripeClient;
}

// --- API Endpoints ---

// Get health / configuration info
app.get("/api/config", (req, res) => {
  res.json({
    stripeEnabled: !!process.env.STRIPE_SECRET_KEY,
    appUrl: process.env.APP_URL || `http://localhost:${PORT}`
  });
});

// Multipart file upload for asset images and .blend files
app.post(
  "/api/upload",
  upload.fields([
    { name: "images", maxCount: 4 },
    { name: "assetFile", maxCount: 1 }
  ]),
  (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const uploadedImages: string[] = [];
      let uploadedAssetFile: { path: string; name: string } | null = null;

      if (files?.images) {
        files.images.forEach((file) => {
          uploadedImages.push(`/uploads/${file.filename}`);
        });
      }

      if (files?.assetFile && files.assetFile.length > 0) {
        const file = files.assetFile[0];
        uploadedAssetFile = {
          path: `/uploads/${file.filename}`,
          name: file.originalname
        };
      }

      res.json({
        success: true,
        images: uploadedImages,
        assetFile: uploadedAssetFile
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Create Stripe Checkout Session
app.post("/api/stripe/create-checkout-session", async (req, res) => {
  try {
    const { assetId, assetTitle, price, buyerEmail } = req.body;

    if (!assetId || !assetTitle || price === undefined || !buyerEmail) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
    const stripe = getStripe();

    if (!stripe) {
      // Return simulated checkout session info so the preview remains 100% functional
      console.log(`[Stripe Sandbox] Creating simulated checkout for: ${assetTitle}`);
      const sessionId = `sim_session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const simulatedUrl = `${appUrl}/checkout/simulated?session_id=${sessionId}&assetId=${assetId}&price=${price}&buyerEmail=${encodeURIComponent(buyerEmail)}`;
      
      return res.json({
        id: sessionId,
        url: simulatedUrl,
        simulated: true
      });
    }

    // Real Stripe Integration
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: buyerEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: assetTitle,
              description: `Blender 3D Asset Purchase: ${assetTitle}`
            },
            unit_amount: Math.round(price * 100) // Stripe expects cents
          },
          quantity: 1
        }
      ],
      mode: "payment",
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&assetId=${assetId}&buyerEmail=${encodeURIComponent(buyerEmail)}`,
      cancel_url: `${appUrl}/assets/${assetId}?canceled=true`,
      metadata: {
        assetId,
        buyerEmail,
        assetTitle
      }
    });

    res.json({ id: session.id, url: session.url });
  } catch (error: any) {
    console.error("Stripe session creation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Verify Stripe checkout session
app.get("/api/stripe/verify-session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const stripe = getStripe();

    if (!stripe || sessionId.startsWith("sim_session_")) {
      // In simulation mode, approve instantly
      return res.json({
        success: true,
        simulated: true,
        metadata: {
          assetId: req.query.assetId,
          buyerEmail: req.query.buyerEmail
        }
      });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === "paid") {
      res.json({
        success: true,
        simulated: false,
        metadata: session.metadata
      });
    } else {
      res.json({
        success: false,
        status: session.payment_status
      });
    }
  } catch (error: any) {
    console.error("Stripe session verification error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(DIST_DIR));
    app.get("*", (req, res) => {
      res.sendFile(path.join(DIST_DIR, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
