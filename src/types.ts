export interface Asset {
  id: string;
  title: string;
  description: string;
  price: number; // 0 for free
  category: string; // e.g. Characters, Props, Environments, Vehicles
  imageUrls: string[]; // List of uploaded image paths (rendered as empty/dashed border placeholder boxes in list/detail)
  fileUrl: string; // URL path of the actual .blend asset on the server
  fileName: string; // Original filename of the .blend asset
  createdAt: number; // Timestamp
  downloadsCount: number;
  viewsCount: number;
}

export interface Order {
  id: string;
  buyerEmail: string;
  assetId: string;
  assetTitle: string;
  pricePaid: number;
  status: "pending" | "completed" | "failed";
  createdAt: number;
  downloadToken?: string;
}

export interface AppConfig {
  stripeEnabled: boolean;
  appUrl: string;
}
