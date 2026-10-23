"use client";

import React, { useRef, useState } from "react";
import jsQR from "jsqr";
import {
  QrCode,
  Upload,
  AlertCircle,
  CheckCircle2,
  ImageIcon,
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleClose = () => {
    setScannedCode(null);
    setUploadError(null);
    setIsDragging(false);
    onClose();
  };

  const extractSessionCode = (rawText: string): string => {
    try {
      if (rawText.includes("session=")) {
        const url = new URL(rawText);
        const code = url.searchParams.get("session");
        if (code) return code.trim().toUpperCase();
      }
    } catch {}

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
      setUploadError(null);
      setTimeout(() => {
        onScanSuccess(code);
        handleClose();
      }, 600);
    } else {
      setUploadError("Could not extract a valid session code from QR.");
    }
  };

  const processFile = (file: File) => {
    setUploadError(null);
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
            setUploadError("No valid QR code found in the image. Please try another image.");
          }
        }
      };
      img.onerror = () => {
        setUploadError("Failed to parse image file.");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl">
        <DialogHeader className="pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Scan Session QR Code
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Upload or capture a QR code image to join the session.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          capture="environment"
          onChange={handleFileUpload}
          className="hidden"
        />

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative mt-3 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-orange-500 bg-orange-50/60"
              : "border-slate-200 bg-slate-50 hover:bg-slate-100/80 hover:border-orange-300"
          }`}
        >
          {scannedCode ? (
            <div className="flex flex-col items-center justify-center text-center animate-in fade-in-0 duration-200">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-2 animate-bounce" />
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-widest">
                QR Code Detected!
              </p>
              <p className="text-base font-mono font-bold text-slate-900 mt-1">
                {scannedCode}
              </p>
              <p className="text-xs text-slate-500 mt-2">Connecting to peer network...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <ImageIcon className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800">
                  Click to browse or snap photo
                </p>
                <p className="text-xs text-slate-500">
                  or drag and drop a QR code image here
                </p>
              </div>
            </div>
          )}
        </div>

        {uploadError && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{uploadError}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-xs rounded-xl text-slate-500 hover:bg-slate-100 h-9 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs rounded-xl bg-orange-600 hover:bg-orange-700 text-white gap-1.5 h-9 cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Choose Image</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
