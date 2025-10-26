import { useState } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import html2canvas from "html2canvas";
import { useSuiServices } from "../hooks/useSuiServices";

interface DashboardSnapshotProps {
  profileId: string;
  username: string;
  stats: {
    totalClicks: number;
    totalLinks: number;
  };
  containerId?: string; // Optional container ID, defaults to "dashboard-container"
}

export function DashboardSnapshot({ profileId, username, stats, containerId = "dashboard-container" }: DashboardSnapshotProps) {
  const account = useCurrentAccount();
  const { walrusService, dashboardNFTService, dashboardCollectionId } = useSuiServices();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  const [minting, setMinting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const captureSnapshot = async () => {
    // Container'ın screenshot'ını al
    const containerElement = document.getElementById(containerId);
    if (!containerElement) return null;

    const canvas = await html2canvas(containerElement, {
      backgroundColor: "#0D0D0D",
      scale: 2, // Yüksek kalite
    });

    return canvas.toDataURL("image/png");
  };

  const prepareDashboardData = () => {
    // Container verilerini JSON olarak hazırla
    return {
      profileId,
      username,
      stats,
      timestamp: Date.now(),
      version: "1.0",
      containerType: containerId === "statistics-container" ? "statistics" : "dashboard",
    };
  };

  const handleMintSnapshot = async () => {
    console.log("🔍 Debug info:", {
      account: !!account,
      title,
      dashboardCollectionId,
      walrusService: !!walrusService,
      dashboardNFTService: !!dashboardNFTService
    });

    if (!account) {
      alert("Wallet connection is required");
      return;
    }
    
    if (!title) {
      alert("NFT title is required");
      return;
    }
    
    if (!dashboardCollectionId) {
      alert("Dashboard collection ID not found. Check environment variables.");
      return;
    }

    setMinting(true);

    try {
      // 1. Dashboard screenshot'ını al
      const snapshotDataUrl = await captureSnapshot();
      if (!snapshotDataUrl) throw new Error("Screenshot not found");

      // 2. Screenshot'ı Blob'a çevir
      const snapshotBlob = await (await fetch(snapshotDataUrl)).blob();

      // 3. Walrus'a screenshot yükle
      const snapshotCid = await walrusService.upload(
        new File([snapshotBlob], "dashboard-snapshot.png", { type: "image/png" })
      );

      // 4. Dashboard verilerini hazırla ve Walrus'a yükle
      const dashboardData = prepareDashboardData();
      const dataCid = await walrusService.uploadJson(dashboardData, "dashboard-data.json");

      // 5. NFT mint transaction'ı oluştur
      const tx = dashboardNFTService.mintSnapshot(
        dashboardCollectionId,
        profileId,
        username,
        snapshotCid,
        dataCid,
        stats.totalClicks,
        stats.totalLinks,
        title,
        description || `Dashboard snapshot on ${new Date().toLocaleDateString()}`
      );

      // 6. Transaction'ı execute et
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log("✅ Dashboard NFT minted:", result);
            alert("Dashboard NFT successfully minted!");
            setShowModal(false);
            setMinting(false);
          },
          onError: (error) => {
            console.error("❌ Error minting NFT:", error);
            alert("NFT not minted");
            setMinting(false);
          },
        }
      );
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred");
      setMinting(false);
    }
  };

  return (
    <>
      {/* Mint Button - Only show if collection ID is available */}
      {dashboardCollectionId && (
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:opacity-90 transition-all"
        >
          <span className="material-symbols-outlined">photo_camera</span>
          {containerId === "statistics-container" ? "Analytics NFT Publish" : "Dashboard NFT Publish"}
        </button>
      )}
      
      {/* Development Notice */}
      {!dashboardCollectionId && (
        <div className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-xl">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            🚧 NFT feature requires Move contract deployment
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
          <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl border border-gray-200 dark:border-gray-800 p-8 max-w-lg w-full">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {containerId === "statistics-container" ? "Analytics NFT Mint" : "Dashboard NFT Mint"}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
              {containerId === "statistics-container" 
                ? "Your analytics's current state as an NFT"
                : "Your dashboard's current state as an NFT"
              }
            </p>

            <div className="space-y-4 mb-6">
              {/* Title */}
              <div>
                <label className="text-sm font-semibold text-gray-900 dark:text-white mb-2 block">
                  NFT Title *
                </label>
                <input
                  type="text"
                  placeholder="My Dashboard - Q4 2025"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white outline-none focus:border-purple-500 transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-semibold text-gray-900 dark:text-white mb-2 block">
                  Description
                </label>
                <textarea
                  placeholder="Dashboard description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white outline-none focus:border-purple-500 transition-all resize-none"
                />
              </div>

              {/* Stats Preview */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">SNAPSHOT DETAILS</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total Clicks:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{stats.totalClicks}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total Links:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{stats.totalLinks}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleMintSnapshot}
                disabled={minting || !title || !dashboardCollectionId}
                className={`flex-1 h-12 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all ${
                  minting || !title || !dashboardCollectionId
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90"
                }`}
              >
                {minting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Minting...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">auto_awesome</span>
                    Mint NFT
                  </>
                )}
              </button>
              <button
                onClick={() => setShowModal(false)}
                disabled={minting}
                className="px-6 h-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
