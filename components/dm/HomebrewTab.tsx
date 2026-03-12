'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Edit3, Check, X, FlaskConical } from 'lucide-react';
import { toast } from 'sonner';

interface HomebrewTabProps {
    campaignId: string;
}

const HIT_DICE = ['d6', 'd8', 'd10', 'd12'];
const ROLES = ['Melee Damage', 'Ranged Damage', 'Tank', 'Healer', 'Support', 'Control', 'Arcane Magic', 'Divine Magic', 'Utility', 'Versatile'];
const SIZES = ['Tiny', 'Small', 'Medium', 'Large'];

export default function HomebrewTab({ campaignId }: HomebrewTabProps) {
    const [mode, setMode] = useState<'classes' | 'races' | 'subclasses'>('classes');
    const [classes, setClasses] = useState<any[]>([]);
    const [races, setRaces] = useState<any[]>([]);
    const [subclasses, setSubclasses] = useState<any[]>([]);
    const [editing, setEditing] = useState<any | null>(null);
    const [isNew, setIsNew] = useState(false);

    useEffect(() => { loadAll(); }, [campaignId]);

    const loadAll = async () => {
        const [{ data: cls }, { data: rac }, { data: sub }] = await Promise.all([
            supabase.from('homebrew_classes').select('*').eq('campaign_id', campaignId).order('name'),
            supabase.from('homebrew_races').select('*').eq('campaign_id', campaignId).order('name'),
            supabase.from('homebrew_subclasses').select('*').eq('campaign_id', campaignId).order('name'),
        ]);
        setClasses(cls || []);
        setRaces(rac || []);
        setSubclasses(sub || []);
    };

    const startNew = () => {
        if (mode === 'classes') setEditing({ name: '', description: '', hit_die: 'd8', primary_ability: '', role: 'Versatile', features: [] });
        if (mode === 'races') setEditing({ name: '', description: '', speed: 30, size: 'Medium', ability_bonuses: '', traits: [] });
        if (mode === 'subclasses') setEditing({ name: '', description: '', parent_class: '', features: [] });
        setIsNew(true);
    };

    const saveEditing = async () => {
        if (!editing?.name) return;
        try {
            const table = mode === 'classes' ? 'homebrew_classes' : mode === 'races' ? 'homebrew_races' : 'homebrew_subclasses';
            const { data: { user } } = await supabase.auth.getUser();
            const payload = { ...editing, campaign_id: campaignId, created_by: user?.id };

            if (isNew) {
                const { error } = await supabase.from(table).insert(payload);
                if (error) throw error;
                toast.success(`${editing.name} created!`);
            } else {
                const { error } = await supabase.from(table).update(payload).eq('id', editing.id);
                if (error) throw error;
                toast.success(`${editing.name} updated!`);
            }
            setEditing(null);
            setIsNew(false);
            loadAll();
        } catch (err: any) {
            toast.error('Save failed', { description: err.message });
        }
    };

    const deleteItem = async (id: string) => {
        const table = mode === 'classes' ? 'homebrew_classes' : mode === 'races' ? 'homebrew_races' : 'homebrew_subclasses';
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) { toast.error('Delete failed'); return; }
        toast.success('Deleted');
        loadAll();
    };

    const addFeature = () => {
        setEditing((prev: any) => ({ ...prev, features: [...(prev.features || []), { name: '', description: '' }] }));
    };
    const updateFeature = (i: number, field: string, val: string) => {
        setEditing((prev: any) => {
            const f = [...prev.features];
            f[i] = { ...f[i], [field]: val };
            return { ...prev, features: f };
        });
    };
    const removeFeature = (i: number) => {
        setEditing((prev: any) => ({ ...prev, features: prev.features.filter((_: any, idx: number) => idx !== i) }));
    };

    const currentItems = mode === 'classes' ? classes : mode === 'races' ? races : subclasses;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <FlaskConical className="text-purple-400" /> Homebrew Manager
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">Create custom classes, races, and subclasses for your campaign.</p>
                </div>
                <button
                    onClick={startNew}
                    disabled={!!editing}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold rounded-lg transition-colors"
                >
                    <Plus size={18} /> New {mode === 'classes' ? 'Class' : mode === 'races' ? 'Race' : 'Subclass'}
                </button>
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-1 bg-gray-800 rounded-lg p-1 w-fit">
                {(['classes', 'races', 'subclasses'] as const).map(m => (
                    <button
                        key={m}
                        onClick={() => { setMode(m); setEditing(null); }}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${mode === m ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        {m}
                    </button>
                ))}
            </div>

            {/* Editor */}
            {editing && (
                <div className="bg-gray-800 rounded-xl border border-purple-600/40 p-6 space-y-4">
                    <h3 className="text-lg font-bold text-purple-300">{isNew ? 'Create New' : 'Edit'} {mode === 'classes' ? 'Class' : mode === 'races' ? 'Race' : 'Subclass'}</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="text-xs font-medium text-gray-400 mb-1 block">Name *</label>
                            <input type="text" value={editing.name} onChange={e => setEditing((p: any) => ({ ...p, name: e.target.value }))}
                                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none" placeholder="e.g. Shadowblade, Starborn, Oath of the Void..." />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs font-medium text-gray-400 mb-1 block">Description</label>
                            <textarea value={editing.description || ''} onChange={e => setEditing((p: any) => ({ ...p, description: e.target.value }))}
                                rows={2} className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none resize-none" placeholder="Describe this..." />
                        </div>

                        {mode === 'classes' && (<>
                            <div>
                                <label className="text-xs font-medium text-gray-400 mb-1 block">Hit Die</label>
                                <select value={editing.hit_die} onChange={e => setEditing((p: any) => ({ ...p, hit_die: e.target.value }))}
                                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none">
                                    {HIT_DICE.map(d => <option key={d}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-400 mb-1 block">Role</label>
                                <select value={editing.role} onChange={e => setEditing((p: any) => ({ ...p, role: e.target.value }))}
                                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none">
                                    {ROLES.map(r => <option key={r}>{r}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs font-medium text-gray-400 mb-1 block">Primary Ability</label>
                                <input type="text" value={editing.primary_ability || ''} onChange={e => setEditing((p: any) => ({ ...p, primary_ability: e.target.value }))}
                                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none" placeholder="e.g. STR, CHA, INT..." />
                            </div>
                        </>)}

                        {mode === 'races' && (<>
                            <div>
                                <label className="text-xs font-medium text-gray-400 mb-1 block">Speed (ft)</label>
                                <input type="number" value={editing.speed || 30} onChange={e => setEditing((p: any) => ({ ...p, speed: Number(e.target.value) }))}
                                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-400 mb-1 block">Size</label>
                                <select value={editing.size || 'Medium'} onChange={e => setEditing((p: any) => ({ ...p, size: e.target.value }))}
                                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none">
                                    {SIZES.map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs font-medium text-gray-400 mb-1 block">Ability Score Bonuses</label>
                                <input type="text" value={editing.ability_bonuses || ''} onChange={e => setEditing((p: any) => ({ ...p, ability_bonuses: e.target.value }))}
                                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none" placeholder="+2 STR, +1 CHA" />
                            </div>
                        </>)}

                        {mode === 'subclasses' && (
                            <div className="md:col-span-2">
                                <label className="text-xs font-medium text-gray-400 mb-1 block">Parent Class *</label>
                                <input type="text" value={editing.parent_class || ''} onChange={e => setEditing((p: any) => ({ ...p, parent_class: e.target.value }))}
                                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none" placeholder="e.g. Paladin, Wizard, Ranger..." />
                            </div>
                        )}
                    </div>

                    {/* Features */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">Features</label>
                            <button onClick={addFeature} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition-colors flex items-center gap-1">
                                <Plus size={12} /> Add Feature
                            </button>
                        </div>
                        <div className="space-y-2">
                            {(editing.features || []).map((f: any, i: number) => (
                                <div key={i} className="flex gap-2">
                                    <input type="text" value={f.name} onChange={e => updateFeature(i, 'name', e.target.value)}
                                        className="w-40 px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:border-purple-500 focus:outline-none" placeholder="Feature name" />
                                    <input type="text" value={f.description} onChange={e => updateFeature(i, 'description', e.target.value)}
                                        className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm focus:border-purple-500 focus:outline-none" placeholder="Description..." />
                                    <button onClick={() => removeFeature(i)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors">
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Save/Cancel */}
                    <div className="flex gap-3 pt-2 border-t border-gray-700">
                        <button onClick={saveEditing} disabled={!editing.name}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold rounded-lg transition-colors">
                            <Check size={16} /> Save
                        </button>
                        <button onClick={() => { setEditing(null); setIsNew(false); }} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="space-y-3">
                {currentItems.length === 0 && !editing && (
                    <div className="text-center py-12 text-gray-500">
                        <FlaskConical size={40} className="mx-auto mb-3 opacity-30" />
                        <p>No homebrew {mode} yet. Create the first one!</p>
                    </div>
                )}
                {currentItems.map(item => (
                    <div key={item.id} className="bg-gray-800 rounded-lg border border-gray-700 p-4 flex items-start justify-between group hover:border-purple-600/40 transition-colors">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-white font-bold">{item.name}</h4>
                                {mode === 'classes' && <span className="text-xs text-amber-400 bg-amber-900/30 px-2 py-0.5 rounded">{item.hit_die} · {item.role}</span>}
                                {mode === 'races' && <span className="text-xs text-blue-400 bg-blue-900/30 px-2 py-0.5 rounded">{item.size} · {item.speed}ft</span>}
                                {mode === 'subclasses' && <span className="text-xs text-green-400 bg-green-900/30 px-2 py-0.5 rounded">{item.parent_class}</span>}
                            </div>
                            <p className="text-gray-400 text-sm">{item.description}</p>
                            {mode === 'races' && item.ability_bonuses && <p className="text-amber-400 text-xs mt-1">{item.ability_bonuses}</p>}
                            {(item.features || []).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {(item.features || []).map((f: any) => (
                                        <span key={f.name} className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300 rounded">{f.name || f}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                            <button onClick={() => { setEditing({ ...item }); setIsNew(false); }} className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                                <Edit3 size={14} />
                            </button>
                            <button onClick={() => deleteItem(item.id)} className="p-2 bg-red-900/30 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-colors">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
