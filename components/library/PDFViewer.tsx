'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// Configure PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
    fileUrl: string | null;
    scale: number;
    setScale: (scale: number) => void;
    pageNumber: number;
    setPageNumber: (page: number) => void;
    onNumPagesLoad: (numPages: number) => void;
}

export default function PDFViewer({
    fileUrl,
    scale,
    setScale,
    pageNumber,
    setPageNumber,
    onNumPagesLoad
}: PDFViewerProps) {
    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        onNumPagesLoad(numPages);
    }

    return (
        <div className="flex flex-col items-center">
            {fileUrl ? (
                <Document
                    file={fileUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    className="shadow-2xl"
                    options={{
                        cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
                        cMapPacked: true,
                        disableRange: true, // Often helps with "Access to storage" restricted environments
                    }}
                    loading={
                        <div className="flex bg-white/5 w-[600px] h-[800px] items-center justify-center text-gray-400 animate-pulse">
                            Loading PDF...
                        </div>
                    }
                >
                    <Page
                        pageNumber={pageNumber}
                        scale={scale}
                        renderAnnotationLayer={false}
                        renderTextLayer={true}
                        className="border border-white/5"
                    />
                </Document>
            ) : (
                <div className="w-[600px] h-[800px] bg-white/5 rounded-lg flex flex-col items-center justify-center text-gray-400">
                    <p>No PDF Loaded</p>
                </div>
            )}
        </div>
    );
}
