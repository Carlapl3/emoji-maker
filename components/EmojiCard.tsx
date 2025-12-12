"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, Heart, ImageOff } from "lucide-react";
import { motion } from "framer-motion";

type EmojiCardProps = {
    emoji: {
        id: string;
        url: string | null;
        prompt: string;
        likes: number;
        liked?: boolean;
        createdAt: string;
    };
    onDownload: (url: string | null, prompt: string) => void;
    onLike: (id: string) => void;
};

export function EmojiCard({ emoji, onDownload, onLike }: EmojiCardProps) {
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const handleImageError = useCallback(() => {
        console.error('Image failed to load:', emoji.url);
        setImageError(true);
        setIsLoading(false);
    }, [emoji.url]);

    const handleImageLoad = useCallback(() => {
        setImageError(false);
        setIsLoading(false);
    }, []);

    const handleRetry = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setImageError(false);
        setIsLoading(true);
    }, []);

    const handleDownloadClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onDownload(emoji.url, emoji.prompt);
    }, [emoji.url, emoji.prompt, onDownload]);

    const handleLikeClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onLike(emoji.id);
    }, [emoji.id, onLike]);

    // If there's no URL or there was an error, show the error state
    if (!emoji.url || imageError) {
        return (
            <motion.div
                key={emoji.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="h-full"
            >
                <Card className="h-full flex flex-col items-center justify-center p-6 bg-gray-50">
                    <div className="text-center">
                        <ImageOff className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <h3 className="text-sm font-medium text-gray-900 mb-2">
                            {emoji.url ? "Couldn't load image" : "No image available"}
                        </h3>
                        <p className="text-xs text-gray-500 mb-3">
                            {emoji.url
                                ? "The emoji couldn't be loaded."
                                : "This emoji doesn't have an image."}
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRetry}
                            disabled={!emoji.url}
                        >
                            Try again
                        </Button>
                    </div>
                </Card>
            </motion.div>
        );
    }

    return (
        <motion.div
            key={emoji.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="h-full"
        >
            <Card className="group relative h-full flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-200">
                {/* Image container */}
                <div className="aspect-square relative bg-gray-100">
                    {/* Loading overlay */}
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600" />
                        </div>
                    )}

                    {/* Image */}
                    <div className={`relative w-full h-full transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                        <Image
                            src={emoji.url}
                            alt={emoji.prompt || "Generated emoji"}
                            fill
                            className="object-cover"
                            onError={handleImageError}
                            onLoad={handleImageLoad}
                            unoptimized
                            priority
                        />
                    </div>

                    {/* Hover overlay with actions */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100">
                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={handleDownloadClick}
                            className="rounded-full h-12 w-12 bg-white/90 hover:bg-white shadow-md hover:scale-110 transition-transform"
                            title="Download"
                        >
                            <Download className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={handleLikeClick}
                            className="rounded-full h-12 w-12 bg-white/90 hover:bg-white shadow-md hover:scale-110 transition-transform"
                            title="Like"
                        >
                            <Heart
                                className={`h-5 w-5 ${emoji.liked ? "fill-red-500 text-red-500" : ""
                                    }`}
                            />
                        </Button>
                    </div>
                </div>

                {/* Card footer */}
                <div className="p-4 border-t flex-1 flex flex-col">
                    <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                        {emoji.prompt}
                    </p>
                    <div className="mt-auto flex items-center justify-between text-xs text-gray-500">
                        <span>
                            {new Date(emoji.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                            <Heart
                                className={`h-3 w-3 ${emoji.likes > 0 ? "fill-red-500 text-red-500" : ""
                                    }`}
                            />
                            {emoji.likes}
                        </span>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
