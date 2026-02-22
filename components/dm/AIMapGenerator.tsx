'use client';

import { useState } from 'react';
import { Wand2, Download, Loader2, WifiOff, RefreshCw, Sparkles } from 'lucide-react';

interface GenerationResult {
    success: boolean;
    imageUrl: string | null;
    error?: string;
    prompt?: string;
}

export default function AIMapGenerator() {
    const [prompt, setPrompt] = useState('');
    const [generating, setGenerating] = useState(false);
    const [result, setResult] = useState<GenerationResult | null>(null);
    const [validationError, setValidationError] = useState('');

    const generateMap = async () => {
        if (!prompt.trim()) {
            setValidationError('Please enter a description');
            return;
        }

        setGenerating(true);
        setValidationError('');
        setResult(null);

        try {
            const response = await fetch('/api/generate-map-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });

            const data = await response.json();

            if (response.status === 503 || !data.success) {
                setResult({
                    success: false,
                    imageUrl: null,
                    error: data.error || 'Failed to generate map',
                    prompt: data.prompt
                });
            } else {
                setResult({ success: true, imageUrl: data.imageUrl });
            }
        } catch (err) {
            setResult({
                success: false,
                imageUrl: null,
                error: 'Network error. Please try again.'
            });
            console.error(err);
        } finally {
            setGenerating(false);
        }
    };

    const examplePrompts = [
        'Medieval tavern interior with fireplace, wooden tables, and bar counter',
        'Dark forest clearing with ancient stone altar and misty atmosphere',
        'Stone dungeon corridor with torches, iron portcullis, and treasure chamber',
        'Desert temple entrance with hieroglyphs, sand dunes, and crumbling columns',
        'Icy mountain cave with glowing crystals and frozen underground lake',
        'Abandoned castle courtyard overgrown with vines, central fountain destroyed',
        'Thieves guild basement with rafters, trap doors, and hidden passages',
        'Underground sewer tunnels with water channels and mossy stone walls'
    ];

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="text-purple-400" size={28} />
                    <h1 className="text-3xl font-bold text-white">AI Map Generator</h1>
                </div>
                <p className="text-gray-400">
                    Create top-down D&D battle maps using Local Stable Diffusion.
                    All maps are generated from a bird's eye perspective for tactical play.
                </p>
            </div>

            {/* Prompt Input */}
            <div className="bg-gray-800 rounded-lg p-6 mb-4 border border-gray-700">
                <label className="block text-sm font-semibold text-white mb-2">
                    Map Description
                </label>
                <textarea
                    value={prompt}
                    onChange={(e) => { setPrompt(e.target.value); setValidationError(''); }}
                    placeholder="Describe the location... e.g., 'Medieval tavern with wooden tables, fireplace, and bar counter'"
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none resize-none"
                />

                {validationError && (
                    <p className="text-red-400 text-sm mt-2">{validationError}</p>
                )}

                <div className="mt-3 p-3 bg-purple-900/20 border border-purple-700/50 rounded-lg">
                    <p className="text-purple-300 text-xs">
                        🎯 Top-down perspective is automatically enforced — no need to mention it in your prompt.
                    </p>
                </div>

                <button
                    onClick={generateMap}
                    disabled={generating || !prompt.trim()}
                    className="mt-4 w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                    {generating ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            <span>Generating Map... (may take 30-90s)</span>
                        </>
                    ) : (
                        <>
                            <Wand2 size={20} />
                            <span>Generate Map</span>
                        </>
                    )}
                </button>
            </div>

            {/* Result Display */}
            {result && (
                <div className={`rounded-lg p-6 mb-6 border ${result.success ? 'bg-gray-800 border-gray-700' : 'bg-red-900/20 border-red-700'}`}>
                    {result.success && result.imageUrl ? (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white">Generated Map</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setResult(null); setPrompt(''); }}
                                        className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
                                    >
                                        <RefreshCw size={14} />
                                        New Map
                                    </button>
                                    <a
                                        href={result.imageUrl}
                                        download="battle_map.png"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        <Download size={16} />
                                        Download
                                    </a>
                                </div>
                            </div>
                            <div className="rounded-lg overflow-hidden border border-gray-600">
                                <img
                                    src={result.imageUrl}
                                    alt="Generated battle map"
                                    className="w-full h-auto"
                                />
                            </div>
                            <p className="text-gray-400 text-sm mt-3">
                                Tip: Right-click the image to save or copy it!
                            </p>
                        </>
                    ) : (
                        <div className="flex items-start gap-4">
                            <WifiOff className="text-red-400 mt-1 flex-shrink-0" size={24} />
                            <div>
                                <h3 className="text-red-300 font-bold mb-1">Stable Diffusion Not Running</h3>
                                <p className="text-red-200 text-sm mb-3">{result.error}</p>
                                <div className="bg-black/30 rounded p-3 text-xs text-gray-300 font-mono">
                                    <p className="text-gray-400 mb-1"># How to start SD with the API enabled:</p>
                                    <p>./webui.sh --api --nowebui</p>
                                    <p className="text-gray-400 mt-1"># Windows:</p>
                                    <p>webui-user.bat --api</p>
                                </div>
                                <button
                                    onClick={generateMap}
                                    className="mt-3 px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <RefreshCw size={14} />
                                    Retry
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Example Prompts */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-3">✨ Example Prompts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {examplePrompts.map((example, index) => (
                        <button
                            key={index}
                            onClick={() => { setPrompt(example); setValidationError(''); setResult(null); }}
                            className="text-left px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded transition-colors border border-gray-600 hover:border-purple-500"
                        >
                            {example}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                <h4 className="text-blue-300 font-semibold mb-2">💡 Tips for Better Maps</h4>
                <ul className="text-blue-200 text-sm space-y-1">
                    <li>• Be specific about the setting (tavern, dungeon, forest, etc.)</li>
                    <li>• Mention key features (furniture, terrain, obstacles, traps)</li>
                    <li>• Specify atmosphere (dark, misty, bright, ancient, overgrown)</li>
                    <li>• Include materials (stone, wood, sand, ice) for realistic textures</li>
                    <li>• All maps are generated top-down with grid overlays automatically</li>
                </ul>
            </div>
        </div>
    );
}
