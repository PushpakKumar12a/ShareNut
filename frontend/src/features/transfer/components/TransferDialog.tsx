"use client";

import React, { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2, X, Files } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CreateTransferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFiles?: (files: File[]) => void;
  onSelectFile?: (file: File) => void;
}

export function CreateTransferDialog({
  isOpen,
  onClose,
  onSelectFiles,
  onSelectFile,
}: CreateTransferDialogProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((fileItem, i) => i !== index));
  };

  const handleStart = () => {
    if (selectedFiles.length > 0) {
      if (onSelectFiles) {
        onSelectFiles(selectedFiles);
      } else if (onSelectFile) {
        if (selectedFiles.length === 1) {
          onSelectFile(selectedFiles[0]);
        } else {
          for (const file of selectedFiles) {
            onSelectFile(file);
          }
        }
      }
      setSelectedFiles([]);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedFiles([]);
    onClose();
  };

  const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900">
            Create P2P File Transfer
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Select one or more files to stream across connected peers.
          </DialogDescription>
        </DialogHeader>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="mt-2 flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-slate-100/80 transition-colors cursor-pointer text-center"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            className="hidden"
          />

          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <Upload className="h-6 w-6" />
            </div>
            <div className="text-sm font-bold text-slate-800">
              Drop files here or click to browse
            </div>
            <div className="text-xs text-slate-400">
              Supports multiple files • Any size • Direct P2P transfer
            </div>
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-1.5">
                <Files className="h-3.5 w-3.5 text-amber-600" />
                <span>{selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""} selected</span>
              </div>
              <span className="text-slate-400">{formatSize(totalSize)} total</span>
            </div>

            {selectedFiles.map((file, idx) => (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate max-w-[220px]">
                      {file.name}
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium">
                      {formatSize(file.size)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(idx);
                  }}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 pt-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Ready to stream
            </div>
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={selectedFiles.length === 0}
            onClick={handleStart}
            className="bg-amber-600 hover:bg-amber-700 text-white shadow-xs shadow-amber-600/20"
          >
            {selectedFiles.length > 1
              ? `Start ${selectedFiles.length} Transfers`
              : "Start Transfer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
