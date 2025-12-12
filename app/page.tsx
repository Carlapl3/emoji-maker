"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Download, Heart, Sparkles, Wand2 } from 'lucide-react';

type Emoji = {
  id: string;
  image_url: string;
  prompt: string;
  likes: number;
  created_at: string;
};

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [emojis, setEmojis] = useState<Emoji[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEmojis();
  }, []);

  const fetchEmojis = async () => {
    try {
      const response = await fetch('/api/emojis');
      if (response.ok) {
        const data = await response.json();
        setEmojis(data);
      }
    } catch (err) {
      console.error('Error fetching emojis:', err);
    } finally {
      setIsLoading(false);
    }
  };

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

      await fetchEmojis();
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
      setError('Failed to download image.');
      console.error('Error downloading image:', err);
    }
  };

  const handleLike = async (id: string) => {
    try {
      const response = await fetch('/api/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emojiId: id }),
      });

      if (response.ok) {
        await fetchEmojis();
      }
    } catch (err) {
      console.error('Error liking emoji:', err);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-pink-500">
              Emoji Maker
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600">Create custom emojis with AI</p>
        </div>

        <Card className="max-w-2xl mx-auto mb-12 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Create Your Emoji</CardTitle>
            <CardDescription>
              Describe the emoji you'd like to generate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={generateEmoji} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="prompt" className="text-sm font-medium">
                  Describe your emoji
                </label>
                <div className="relative">
                  <Input
                    id="prompt"
                    type="text"
                    placeholder="e.g., A happy cat"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isGenerating}
                    className="pl-10"
                  />
                  <Wand2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
              <Button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Emoji
                  </>
                )}
              </Button>
              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">
                  {error}
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-2xl font-semibold mb-6">
            {emojis.length > 0 ? 'Your Emojis' : 'No Emojis Yet'}
          </h2>

          {isLoading ? (
            <div className="text-center py-12">Loading...</div>
          ) : emojis.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {emojis.map((emoji) => (
                <Card key={emoji.id} className="group relative overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="aspect-square relative bg-gray-50">
                    {emoji.image_url && emoji.image_url !== '{}' ? (
                      <Image
                        src={emoji.image_url}
                        alt={emoji.prompt}
                        fill
                        className="object-contain p-4"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        No image
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100">
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => handleDownload(emoji.image_url, emoji.prompt)}
                        className="rounded-full"
                        disabled={!emoji.image_url || emoji.image_url === '{}'}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => handleLike(emoji.id)}
                        className="rounded-full"
                      >
                        <Heart className={`h-4 w-4 ${emoji.likes > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </Button>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-700 line-clamp-2 mb-2">{emoji.prompt}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <Heart className={`h-4 w-4 mr-1 ${emoji.likes > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
                      <span>{emoji.likes}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Generate your first emoji above!</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}