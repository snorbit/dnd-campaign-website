'use client';

import { useState } from 'react';
import { Wand2, Download, Loader2 } from 'lucide-react';

export default function AIMapGenerator() {
    const [prompt, setPrompt] = useState('');
    const [generating, setGenerating] = useState(false);
    const [generatedMap, setGeneratedMap] = useState<string | null>(null);
    const [error, setError] = useState('');

    const generateMap = async () => {
        if (!prompt.trim()) {
            setError('Please enter a description');
            return;
        }

        setGenerating(true);
        setError('');

        try {
            const response = await fetch('/api/generate-map-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });

            if (!response.ok) {
                throw new Error('Failed to generate map');
            }

            const data = await response.json();
            setGeneratedMap(data.imageUrl);
        } catch (err) {
            setError('Failed to generate map. Please try again.');
            console.error(err);
        } finally {
            setGenerating(false);
        }
    };

    const examplePrompts = [
        'Medieval tavern interior with fireplace, wooden tables, and bar',
        'Dark forest path with ancient trees and misty atmosphere',
        'Stone dungeon corridor with torches and treasure chest',
        'Desert temple entrance with hieroglyphs and sand dunes',
        'Icy mountain cave with crystals and frozen waterfall',
        'Abandoned castle courtyard overgrown with vines'
    ];

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white mb-2">🎨 AI Map Generator</h1>
                <p className="text-gray-400">
                    Create custom D&D battle maps with AI. Enter a description and generate unique maps instantly!
                </p>
            </div>

            {/* Prompt Input */}
            <div className="bg-gray-800 rounded-lg p-6 mb-4 border border-gray-700">
                <label className="block text-sm font-semibold text-white mb-2">
                    Map Description
                </label>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the map you want to create... e.g., 'Top-down view of a medieval tavern with wooden tables, fireplace, and bar counter'"
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                />

                {error && (
                    <p className="text-red-400 text-sm mt-2">{error}</p>
                )}

                <button
                    onClick={generateMap}
                    disabled={generating || !prompt.trim()}
                    className="mt-4 w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                    {generating ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            <span>Generating Map...</span>
                        </>
                    ) : (
                        <>
                            <Wand2 size={20} />
                            <span>Generate Map</span>
                        </>
                    )}
                </button>
            </div>

            {/* Example Prompts */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-3">✨ Example Prompts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {examplePrompts.map((example, index) => (
                        <button
                            key={index}
                            onClick={() => setPrompt(example)}
                            className="text-left px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded transition-colors"
                        >
                            {example}
                        </button>
                    ))}
                </div>
            </div>

            {/* Generated Map Display */}
            {generatedMap && (
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Generated Map</h3>
                        <a
                            href={generatedMap}
                            download="battle_map.png"
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                            <Download size={16} />
                            <span>Download</span>
                        </a>
                    </div>
                    <div className="rounded-lg overflow-hidden border border-gray-600">
                        <img
                            src={generatedMap}
                            alt="Generated battle map"
                            className="w-full h-auto"
                        />
                    </div>
                    <p className="text-gray-400 text-sm mt-3">
                        Tip: Right-click the image to save or copy it!
                    </p>
                </div>
            )}

            {/* Tips */}
            <div className="mt-6 bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                <h4 className="text-blue-300 font-semibold mb-2">💡 Tips for Better Maps</h4>
                <ul className="text-blue-200 text-sm space-y-1">
                    <li>• Be specific about the setting (tavern, dungeon, forest, etc.)</li>
                    <li>• Mention key features (furniture, terrain, obstacles)</li>
                    <li>• Specify atmosphere (dark, misty, bright, mysterious)</li>
                    <li>• Include "top-down view" for best D&D battle map results</li>
                    <li>• All maps are generated with grid overlays automatically</li>
                </ul>
            </div>
        </div>
    );
}
