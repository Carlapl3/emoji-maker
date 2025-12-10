"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Download, Heart, Sparkles, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingState } from '@/components/loading-state';

type Emoji = {
  id: string;
  url: string;
  prompt: string;
  likes: number;
  createdAt: string;
};

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [emojis, setEmojis] = useState<Emoji[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved emojis from localStorage on component mount
  useEffect(() => {
    const savedEmojis = localStorage.getItem('emojis');
    if (savedEmojis) {
      try {
        setEmojis(JSON.parse(savedEmojis));
      } catch (err) {
        console.error('Error parsing saved emojis:', err);
      }
    }
    setIsLoading(false);
  }, []);

  // Save emojis to localStorage whenever they change
  useEffect(() => {
    if (emojis.length > 0) {
      localStorage.setItem('emojis', JSON.stringify(emojis));
    }
  }, [emojis]);

  const generateEmoji = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate emoji');
      }

      const data = await response.json();
      console.log('API Response:', data);
      const newEmoji = {
        ...data,
        id: Date.now().toString(),
        likes: 0,
        createdAt: new Date().toISOString()
      };
      console.log('New emoji data:', newEmoji);
      setEmojis(prev => {
        const updated = [newEmoji, ...prev];
        console.log('Updated emojis:', updated);
        return updated;
      });
      setPrompt('');
    } catch (err) {
      setError('Failed to generate emoji. Please try again.');
      console.error('Error generating emoji:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (url: string, prompt: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `emoji-${prompt.substring(0, 20).replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setError('Failed to download image. Please try again.');
      console.error('Error downloading image:', err);
    }
  };

  const handleLike = (id: string) => {
    try {
      setEmojis(prev =>
        prev.map(emoji =>
          emoji.id === id ? { ...emoji, likes: emoji.likes + 1 } : emoji
        )
      );
    } catch (err) {
      console.error('Error liking emoji:', err);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-pink-500">
              Emoji Maker
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600">Create custom emojis with AI</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="max-w-2xl mx-auto mb-12 shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Create Your Emoji</CardTitle>
              <CardDescription>
                Describe the emoji you'd like to generate and let AI do the magic!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={generateEmoji} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="prompt" className="text-sm font-medium text-gray-700">
                    Describe your emoji
                  </label>
                  <div className="relative">
                    <Input
                      id="prompt"
                      type="text"
                      placeholder="e.g., A happy cat wearing sunglasses"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      disabled={isGenerating}
                      className="w-full pl-10 pr-4 py-6 text-base"
                    />
                    <Wand2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full py-6 text-base font-medium bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-[1.02] relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center justify-center">
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Generate Emoji
                      </>
                    )}
                  </span>
                  {isGenerating && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-pink-600 opacity-0 group-hover:opacity-20"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </Button>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-50 text-red-700 text-sm rounded-md"
                  >
                    {error}
                  </motion.div>
                )}
              </form>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            {emojis.length > 0 ? 'Your Emojis' : 'No Emojis Yet'}
          </h2>

          {isLoading ? (
            <LoadingState />
          ) : emojis.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {emojis.map((emoji) => (
                  <motion.div
                    key={emoji.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    layout
                  >
                    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full flex flex-col">
                      <div className="aspect-square relative bg-gray-50 rounded-t-md">
                        {emoji.url ? (
                          <Image
                            src={emoji.url}
                            alt={emoji.prompt}
                            fill
                            className="object-contain p-2"
                            style={{ background: 'white' }}
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            priority
                            onError={(e) => {
                              console.error('Image failed to load:', emoji.url, e);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-red-500">
                            No image URL provided
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100">
                          <Button
                            variant="secondary"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(emoji.url, emoji.prompt);
                            }}
                            className="rounded-full h-12 w-12 bg-white/90 hover:bg-white shadow-md hover:scale-110 transition-transform"
                            title="Download"
                          >
                            <Download className="h-5 w-5" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLike(emoji.id);
                            }}
                            className="rounded-full h-12 w-12 bg-white/90 hover:bg-white shadow-md hover:scale-110 transition-transform"
                            title="Like"
                          >
                            <Heart className={`h-5 w-5 ${emoji.likes > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
                          </Button>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-gray-700 line-clamp-2 mb-2">{emoji.prompt}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <Heart className={`h-4 w-4 mr-1 ${emoji.likes > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
                          <span>{emoji.likes} {emoji.likes === 1 ? 'like' : 'likes'}</span>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
                <Sparkles className="w-full h-full" />
                <span className="text-5xl">😊</span>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No emojis yet</h3>
              <p className="text-gray-500">Enter a prompt above to generate your first emoji!</p>
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
