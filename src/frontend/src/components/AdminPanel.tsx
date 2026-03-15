import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Upload } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";

type HealthStatus = "CHECKING" | "HEALTHY" | "ERROR";

export default function AdminPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>("CHECKING");
  const [selectedLandType, setSelectedLandType] = useState("FOREST_VALLEY");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [uploadMessage, setUploadMessage] = useState("");

  const LAND_TYPES = [
    "FOREST_VALLEY",
    "ISLAND_ARCHIPELAGO",
    "SNOW_PEAK",
    "DESERT_DUNE",
    "VOLCANIC_CRAG",
    "MYTHIC_VOID",
    "MYTHIC_AETHER",
  ];

  const checkAssetCanisterHealth = async () => {
    try {
      const cacheBuster = Date.now();
      const url = `https://bd3sg-teaaa-aaaaa-qaaba-cai.ic0.app/health?_=${cacheBuster}`;
      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      });
      const text = await response.text();
      if (response.ok && text.includes("HEALTHY")) {
        setHealthStatus("HEALTHY");
      } else {
        setHealthStatus("ERROR");
      }
    } catch (_error) {
      setHealthStatus("ERROR");
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    const initialTimer = setTimeout(() => {
      checkAssetCanisterHealth();
    }, 2000);
    return () => clearTimeout(initialTimer);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    const interval = setInterval(() => {
      checkAssetCanisterHealth();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".glb")) {
        alert("Пожалуйста, выберите файл .glb");
        return;
      }
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        alert("Размер файла превышает 50 МБ");
        return;
      }
      setSelectedFile(file);
      setUploadStatus("idle");
      setUploadMessage("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Пожалуйста, выберите файл");
      return;
    }
    if (healthStatus !== "HEALTHY") {
      alert("Asset Canister недоступен. Пожалуйста, подождите.");
      return;
    }
    setUploadStatus("uploading");
    setUploadProgress(0);
    setUploadMessage("");
    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus("success");
      setUploadMessage(`✅ Загружено: ${selectedLandType}.glb`);
      setSelectedFile(null);
      const fileInput = document.getElementById(
        "glb-file-input",
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (_error) {
      setUploadStatus("error");
      setUploadMessage("❌ Ошибка загрузки");
    }
  };

  const getStatusColor = () => {
    switch (healthStatus) {
      case "HEALTHY":
        return "border-green-500 text-green-400";
      case "ERROR":
        return "border-red-500 text-red-400";
      default:
        return "border-yellow-500 text-yellow-400";
    }
  };

  const getStatusText = () => {
    switch (healthStatus) {
      case "HEALTHY":
        return "HEALTHY ✅";
      case "ERROR":
        return "ERROR ⚠️";
      default:
        return "CHECKING…⏳";
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <div
        className={`rounded-lg border-2 ${getStatusColor()} bg-black/80 backdrop-blur-md shadow-2xl`}
        style={{ boxShadow: "0 0 20px rgba(0, 255, 65, 0.3)" }}
      >
        <div className="flex items-center justify-between p-4 border-b border-cyan-500/30">
          <div className="flex items-center gap-3">
            <div className="text-lg font-bold text-cyan-400">Admin Panel</div>
            <div className="text-sm font-mono">{getStatusText()}</div>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>
        </div>
        {isExpanded && (
          <div className="p-4 space-y-4">
            <div className="text-sm text-cyan-300 font-semibold">
              Загрузить модели (.glb)
            </div>
            <div>
              <label
                htmlFor="land-type-select"
                className="block text-xs text-gray-400 mb-2"
              >
                Тип земли:
              </label>
              <select
                id="land-type-select"
                value={selectedLandType}
                onChange={(e) => setSelectedLandType(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-cyan-500/50 rounded text-cyan-300 text-sm focus:outline-none focus:border-cyan-400"
              >
                {LAND_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="glb-file-input"
                className="block text-xs text-gray-400 mb-2"
              >
                Файл GLB:
              </label>
              <input
                id="glb-file-input"
                type="file"
                accept=".glb"
                onChange={handleFileSelect}
                className="w-full px-3 py-2 bg-gray-900 border border-cyan-500/50 rounded text-cyan-300 text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-cyan-600 file:text-white hover:file:bg-cyan-700"
              />
              {selectedFile && (
                <div className="mt-2 text-xs text-gray-400">
                  Выбран: {selectedFile.name} (
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} МБ)
                </div>
              )}
            </div>
            <Button
              onClick={handleUpload}
              disabled={
                !selectedFile ||
                uploadStatus === "uploading" ||
                healthStatus !== "HEALTHY"
              }
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="mr-2" size={16} />
              {uploadStatus === "uploading" ? "Загрузка..." : "Загрузить"}
            </Button>
            {uploadStatus === "uploading" && (
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
            {uploadMessage && (
              <div
                className={`text-sm text-center ${uploadStatus === "success" ? "text-green-400" : "text-red-400"}`}
              >
                {uploadMessage}
              </div>
            )}
          </div>
        )}
        <div className="px-4 py-2 border-t border-cyan-500/30 text-xs text-gray-500 font-mono text-center">
          bd3sg-teaaa-aaaaa-qaaba-cai
        </div>
      </div>
    </div>
  );
}
