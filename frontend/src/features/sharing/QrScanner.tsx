"use client";

import React, { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import {
  Camera,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface QrScannerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (sessionCode: string) => void;
}

export function QrScannerDialog({
  isOpen,
  onClose,
  onScanSuccess,
}: QrScannerDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const extractSessionCode = (rawText: string): string => {
    try {
      if (rawText.includes("session=")) {
        const url = new URL(rawText);
        const code = url.searchParams.get("session");
        if (code) return code.trim().toUpperCase();
      }
    } catch {

    }

    const match = rawText.match(/(?:NUT-|NUTYNC-)[A-Z0-9_-]+/i);
    if (match) {
      return match[0].toUpperCase();
    }

    return rawText.trim().toUpperCase();
  };

  const handleDetectedCode = (text: string) => {
    const code = extractSessionCode(text);
    if (code) {
      setScannedCode(code);
      setIsScanning(false);

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }

      setTimeout(() => {
        onScanSuccess(code);
        onClose();
        setScannedCode(null);
      }, 700);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    setScannedCode(null);

    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported in this browser.");
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        setIsScanning(true);
      }
    } catch (err: unknown) {
      console.warn("[QR Scanner] Camera start error:", err);
      let msg = "Could not access camera. Please allow camera permissions or upload an image.";
      const errorName = (err as { name?: string })?.name;
      if (errorName === "NotAllowedError" || errorName === "PermissionDeniedError") {
        msg = "Camera permission was denied. Please allow camera access in browser settings.";
      } else if (errorName === "NotFoundError" || errorName === "DevicesNotFoundError") {
        msg = "No camera found on this device. You can upload a QR image instead.";
      }
      setCameraError(msg);
      setIsScanning(false);
    }
  };

  useEffect(() => {
    let animationId: number;

    const scanFrame = () => {
      if (
        isScanning &&
        videoRef.current &&
        videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
        canvasRef.current
      ) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (qrCode && qrCode.data) {
            handleDetectedCode(qrCode.data);
            return;
          }
        }
      }

      if (isScanning) {
        animationId = requestAnimationFrame(scanFrame);
      }
    };

    if (isScanning) {
      animationId = requestAnimationFrame(scanFrame);
    }

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isScanning, stream]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        setStream(null);
      }
      setIsScanning(false);
      setCameraError(null);
      setScannedCode(null);
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isOpen, facingMode]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
          if (qrCode && qrCode.data) {
            handleDetectedCode(qrCode.data);
          } else {
            alert("No valid QR code found in the selected image. Please try another image.");
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl">
        <DialogHeader className="pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Scan Session QR Code
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Point camera at the sender&apos;s QR code to join automatically.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <canvas ref={canvasRef} className="hidden" />
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        <div className="relative mt-3 flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-slate-950 aspect-square w-full max-w-[340px] mx-auto border border-slate-800 shadow-inner">
          <video
            ref={videoRef}
            className={`h-full w-full object-cover ${cameraError ? "hidden" : "block"
              }`}
          />

          {scannedCode && (
            <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4 text-center animate-in fade-in-0 duration-200">
              <CheckCircle2 className="h-12 w-12 text-emerald-400 mb-2 animate-bounce" />
              <p className="text-xs font-semibold text-emerald-200 uppercase tracking-widest">
                QR Code Detected!
              </p>
              <p className="text-base font-mono font-bold text-white mt-1">
                {scannedCode}
              </p>
              <p className="text-xs text-emerald-300 mt-2">Connecting to peer network...</p>
            </div>
          )}

          {isScanning && !scannedCode && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8">
              <div className="relative h-48 w-48 rounded-2xl border-2 border-dashed border-amber-400 shadow-2xl">

                <div className="absolute -top-1 -left-1 h-5 w-5 border-t-3 border-l-3 border-amber-500 rounded-tl-lg" />
                <div className="absolute -top-1 -right-1 h-5 w-5 border-t-3 border-r-3 border-amber-500 rounded-tr-lg" />
                <div className="absolute -bottom-1 -left-1 h-5 w-5 border-b-3 border-l-3 border-amber-500 rounded-bl-lg" />
                <div className="absolute -bottom-1 -right-1 h-5 w-5 border-b-3 border-r-3 border-amber-500 rounded-br-lg" />

                <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse top-1/2 -translate-y-1/2 shadow-[0_0_12px_rgba(217,119,6,0.8)]" />
              </div>
            </div>
          )}

          {cameraError && (
            <div className="flex flex-col items-center justify-center p-6 text-center text-slate-300 space-y-3">
              <AlertCircle className="h-10 w-10 text-amber-400" />
              <p className="text-xs font-medium text-slate-300 leading-relaxed max-w-xs">
                {cameraError}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={startCamera}
                className="h-8 px-3 rounded-lg border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 text-xs gap-1.5 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry Camera
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 h-9 cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5 text-amber-700" />
            <span>Upload QR Image</span>
          </Button>

          {stream && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))
              }
              className="text-xs rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 h-9 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5 text-purple-600" />
              <span>Flip Camera</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs rounded-xl text-slate-500 hover:bg-slate-100 h-9 cursor-pointer"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
