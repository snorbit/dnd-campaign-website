'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ChevronRight, ChevronLeft, Shield, Swords, Star, Check } from 'lucide-react';

// ─── Standard 5e Data ────────────────────────────────────────────────────────
const STANDARD_RACES = [
    { name: 'Human', description: 'Versatile and ambitious, humans spread across every corner of the world.', traits: ['Extra Feat', 'Skill Proficiency'], bonus: '+1 to All Abilities', color: 'from-amber-900 to-amber-700' },
    { name: 'Elf', description: 'Graceful and long-lived, with sharp senses and a mastery of ancient magic.', traits: ['Darkvision', 'Keen Senses', 'Trance'], bonus: '+2 DEX, +1 INT', color: 'from-emerald-900 to-emerald-700' },
    { name: 'Dwarf', description: 'Stoic and steadfast, forged in mountain halls with legendary resilience.', traits: ['Darkvision', 'Stonecunning', 'Poison Resistance'], bonus: '+2 CON', color: 'from-stone-900 to-stone-700' },
    { name: 'Halfling', description: 'Small but surprisingly lucky, with a talent for slipping through danger.', traits: ['Lucky', 'Brave', 'Nimble'], bonus: '+2 DEX', color: 'from-yellow-900 to-yellow-700' },
    { name: 'Dragonborn', description: 'Proud descendants of dragons, born with a breath weapon and draconic lineage.', traits: ['Breath Weapon', 'Draconic Ancestry', 'Damage Resistance'], bonus: '+2 STR, +1 CHA', color: 'from-red-900 to-red-700' },
    { name: 'Gnome', description: 'Curious inventors and illusionists, brimming with enthusiasm and creativity.', traits: ['Gnome Cunning', 'Darkvision'], bonus: '+2 INT', color: 'from-violet-900 to-violet-700' },
    { name: 'Half-Elf', description: 'Born between two worlds, they gain the best of both human and elven heritage.', traits: ['Darkvision', 'Fey Ancestry', 'Extra Skills'], bonus: '+2 CHA, +1 to Two Others', color: 'from-teal-900 to-teal-700' },
    { name: 'Half-Orc', description: 'Powerful and tenacious, carrying orcish endurance and primal strength.', traits: ['Darkvision', 'Relentless Endurance', 'Savage Attacks'], bonus: '+2 STR, +1 CON', color: 'from-green-900 to-green-700' },
    { name: 'Tiefling', description: 'Marked by infernal power, they carry hellfire and an iron will in equal measure.', traits: ['Darkvision', 'Hellish Resistance', 'Infernal Legacy'], bonus: '+2 CHA, +1 INT', color: 'from-rose-900 to-rose-700' },
];

const STANDARD_CLASSES = [
    { name: 'Barbarian', description: 'A fierce warrior who channels primal rage into devastating combat power.', hitDie: 'd12', role: 'Melee Damage', primary: 'STR', icon: '🪓' },
    { name: 'Bard', description: 'A magical performer who weaves music and magic to inspire allies and bewilder foes.', hitDie: 'd8', role: 'Support & Magic', primary: 'CHA', icon: '🎵' },
    { name: 'Cleric', description: 'A divine warrior empowered by their deity to heal, protect, and smite.', hitDie: 'd8', role: 'Healer & Support', primary: 'WIS', icon: '⚕️' },
    { name: 'Druid', description: 'A guardian of nature who shapeshifts and wields the power of the wild.', hitDie: 'd8', role: 'Control & Healing', primary: 'WIS', icon: '🌿' },
    { name: 'Fighter', description: 'A master of arms and tactics, the most versatile warrior on the battlefield.', hitDie: 'd10', role: 'Melee & Ranged', primary: 'STR or DEX', icon: '⚔️' },
    { name: 'Monk', description: 'A master of martial arts who channels inner ki into superhuman feats.', hitDie: 'd8', role: 'Melee & Control', primary: 'DEX & WIS', icon: '🥋' },
    { name: 'Paladin', description: 'A holy warrior bound by a sacred oath, combining martial skill with divine magic.', hitDie: 'd10', role: 'Tank & Support', primary: 'STR & CHA', icon: '🛡️', specialNote: 'Can create a Guardian' },
    { name: 'Ranger', description: 'A skilled hunter and tracker who excels at combat in the wilderness.', hitDie: 'd10', role: 'Ranged & Utility', primary: 'DEX & WIS', icon: '🏹' },
    { name: 'Rogue', description: 'A cunning trickster who relies on stealth, skill, and precise strikes.', hitDie: 'd8', role: 'Damage & Utility', primary: 'DEX', icon: '🗡️' },
    { name: 'Sorcerer', description: 'A spellcaster who draws raw magic from their bloodline or a wild source of power.', hitDie: 'd6', role: 'Arcane Magic', primary: 'CHA', icon: '✨' },
    { name: 'Warlock', description: 'A spellcaster who made a pact with a powerful entity for arcane might.', hitDie: 'd8', role: 'Dark Magic', primary: 'CHA', icon: '👁️' },
    { name: 'Wizard', description: 'The ultimate arcane scholar, mastering spells through decades of study.', hitDie: 'd6', role: 'Arcane Magic', primary: 'INT', icon: '📖' },
    { name: 'Artificer', description: 'A magical inventor who infuses items with arcane power.', hitDie: 'd8', role: 'Utility & Support', primary: 'INT', icon: '⚙️' },
];

const PALADIN_SUBCLASSES = [
    { name: 'Oath of Devotion', description: 'The classic paladin, dedicated to justice, truthfulness, and loyalty.' },
    { name: 'Oath of the Ancients', description: 'Protectors of light and life, preserving the beauty of the natural world.' },
    { name: 'Oath of Vengeance', description: 'Relentless hunters who pursue and punish the gravely wicked.' },
    { name: 'Oathbreaker', description: 'A fallen paladin who broke their sacred vows and now serves darker powers.' },
];

type Step = 'race' | 'class' | 'subclass' | 'guardian' | 'appearance' | 'confirm';

interface CharacterDraft {
    race: string;
    class: string;
    subclass: string;
    guardianName: string;
    guardianDeity: string;
    guardianOath: string;
    characterName: string;
    backstory: string;
    appearance: {
        skinTone: string;
        hairColor: string;
        eyeColor: string;
        height: string;
        features: string;
    };
}

export default function CreateCharacterPage() {
    const params = useParams();
    const router = useRouter();
    const campaignId = params.campaignId as string;

    const [step, setStep] = useState<Step>('race');
    const [draft, setDraft] = useState<CharacterDraft>({
        race: '', class: '', subclass: '',
        guardianName: '', guardianDeity: '', guardianOath: '',
        characterName: '', backstory: '',
        appearance: { skinTone: '', hairColor: '', eyeColor: '', height: '', features: '' }
    });
    const [homebrewClasses, setHomebrewClasses] = useState<any[]>([]);
    const [homebrewRaces, setHomebrewRaces] = useState<any[]>([]);
    const [homebrewSubclasses, setHomebrewSubclasses] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);
    const [animating, setAnimating] = useState(false);

    useEffect(() => {
        // Check if character already created
        const checkAndLoad = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/auth/login'); return; }

            const { data: cp } = await supabase
                .from('campaign_players')
                .select('character_created, character_name')
                .eq('campaign_id', campaignId)
                .eq('player_id', user.id)
                .single();

            if (cp?.character_created) {
                router.push(`/player/${campaignId}`);
                return;
            }
            if (cp?.character_name) {
                setDraft(prev => ({ ...prev, characterName: cp.character_name }));
            }

            // Load homebrew content
            const [{ data: hClasses }, { data: hRaces }, { data: hSubs }] = await Promise.all([
                supabase.from('homebrew_classes').select('*').eq('campaign_id', campaignId),
                supabase.from('homebrew_races').select('*').eq('campaign_id', campaignId),
                supabase.from('homebrew_subclasses').select('*').eq('campaign_id', campaignId),
            ]);
            setHomebrewClasses(hClasses || []);
            setHomebrewRaces(hRaces || []);
            setHomebrewSubclasses(hSubs || []);
        };
        checkAndLoad();
    }, [campaignId, router]);

    const goTo = (nextStep: Step) => {
        setAnimating(true);
        setTimeout(() => { setStep(nextStep); setAnimating(false); }, 200);
    };

    const handleClassSelected = (className: string) => {
        setDraft(prev => ({ ...prev, class: className, subclass: '' }));
        if (className === 'Paladin') {
            goTo('subclass');
        } else {
            // Check if homebrew class has subclasses
            const hSubs = homebrewSubclasses.filter(s => s.parent_class === className);
            if (hSubs.length > 0) goTo('subclass');
            else goTo('appearance');
        }
    };

    const handleSubclassSelected = (subclass: string) => {
        setDraft(prev => ({ ...prev, subclass }));
        if (subclass === 'Create Guardian') {
            goTo('guardian');
        } else {
            goTo('appearance');
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('campaign_players')
                .update({
                    character_created: true,
                    character_name: draft.characterName || 'Adventurer',
                    race: draft.race,
                    class: draft.class,
                    subclass: draft.subclass,
                    backstory: draft.backstory,
                    appearance: draft.appearance,
                    guardian_name: draft.guardianName || null,
                    guardian_deity: draft.guardianDeity || null,
                    guardian_oath: draft.guardianOath || null,
                })
                .eq('campaign_id', campaignId)
                .eq('player_id', user.id);

            if (error) throw error;
            router.push(`/player/${campaignId}`);
        } catch (err) {
            console.error('Save error:', err);
            setSaving(false);
        }
    };

    const allRaces = [
        ...STANDARD_RACES,
        ...homebrewRaces.map(r => ({
            name: r.name,
            description: r.description || 'A homebrew race created by your DM.',
            traits: (r.traits || []).map((t: any) => t.name || t),
            bonus: r.ability_bonuses || 'Varies',
            color: 'from-purple-900 to-purple-700',
            homebrew: true,
        }))
    ];

    const allClasses = [
        ...STANDARD_CLASSES,
        ...homebrewClasses.map(c => ({
            name: c.name,
            description: c.description || 'A homebrew class created by your DM.',
            hitDie: c.hit_die || 'd8',
            role: c.role || 'Custom',
            primary: c.primary_ability || 'Varies',
            icon: '🧬',
            homebrew: true,
        }))
    ];

    const currentSubclasses = draft.class === 'Paladin'
        ? [
            ...PALADIN_SUBCLASSES,
            ...homebrewSubclasses.filter(s => s.parent_class === 'Paladin').map(s => ({
                name: s.name, description: s.description, homebrew: true
            })),
            { name: 'Create Guardian', description: 'Forge a unique divine guardian — define their name, deity, and sacred oath.', special: true },
        ]
        : homebrewSubclasses.filter(s => s.parent_class === draft.class).map(s => ({
            name: s.name, description: s.description, homebrew: true
        }));

    const steps: Step[] = ['race', 'class', 'subclass', 'guardian', 'appearance', 'confirm'];
    const visibleSteps = steps.filter(s => {
        if (s === 'subclass' && currentSubclasses.length === 0 && draft.class !== 'Paladin') return false;
        if (s === 'guardian' && draft.subclass !== 'Create Guardian') return false;
        return true;
    });
    const currentIdx = visibleSteps.indexOf(step);

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden">
            {/* Ambient Background */}
            <div className="fixed inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-black" />
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_50%_-20%,rgba(120,80,40,0.3),transparent_70%)]" />
            <div className="fixed inset-0 opacity-5" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d4a853\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

            {/* Top Progress Bar */}
            <div className="fixed top-0 left-0 right-0 z-50">
                <div className="h-1 bg-gray-800">
                    <div
                        className="h-full bg-gradient-to-r from-amber-600 to-yellow-400 transition-all duration-500"
                        style={{ width: `${((currentIdx + 1) / visibleSteps.length) * 100}%` }}
                    />
                </div>
                <div className="bg-black/60 backdrop-blur-sm px-6 py-3 flex items-center justify-between border-b border-gray-800">
                    <div className="flex items-center gap-2">
                        <Shield size={20} className="text-amber-400" />
                        <span className="text-amber-400 font-bold tracking-wider text-sm uppercase">Character Creation</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {visibleSteps.map((s, i) => (
                            <div key={s} className={`w-2 h-2 rounded-full transition-all ${i <= currentIdx ? 'bg-amber-400' : 'bg-gray-700'}`} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className={`relative pt-20 min-h-screen flex flex-col transition-opacity duration-200 ${animating ? 'opacity-0' : 'opacity-100'}`}>

                {/* ── RACE STEP ─────────────────────────────────────────── */}
                {step === 'race' && (
                    <div className="flex flex-col flex-1 px-6 py-8 max-w-7xl mx-auto w-full">
                        <div className="mb-8 text-center">
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2" style={{ fontFamily: 'Georgia, serif' }}>Choose Your Race</h1>
                            <p className="text-amber-400/70 text-lg">Your heritage shapes who you are and what you can become.</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 flex-1">
                            {allRaces.map(race => (
                                <button
                                    key={race.name}
                                    onClick={() => { setDraft(prev => ({ ...prev, race: race.name })); goTo('class'); }}
                                    className={`group relative rounded-xl border-2 transition-all duration-300 overflow-hidden text-left p-5 hover:scale-105 hover:shadow-2xl ${draft.race === race.name
                                            ? 'border-amber-400 shadow-amber-500/30 shadow-xl'
                                            : 'border-gray-700/50 hover:border-amber-600/50'
                                        }`}
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-br ${race.color} opacity-60`} />
                                    {(race as any).homebrew && (
                                        <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-purple-500/80 text-white text-xs rounded font-bold z-10">HOMEBREW</span>
                                    )}
                                    <div className="relative z-10">
                                        <h3 className="text-lg font-bold text-white mb-1">{race.name}</h3>
                                        <p className="text-xs text-gray-300 mb-3 leading-relaxed line-clamp-3">{race.description}</p>
                                        <p className="text-xs text-amber-400 font-medium">{race.bonus}</p>
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {race.traits.slice(0, 2).map((t: string) => (
                                                <span key={t} className="px-1.5 py-0.5 bg-black/30 text-gray-300 text-xs rounded">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                    {draft.race === race.name && (
                                        <div className="absolute top-2 left-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center">
                                            <Check size={14} className="text-black font-bold" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── CLASS STEP ────────────────────────────────────────── */}
                {step === 'class' && (
                    <div className="flex flex-col flex-1 px-6 py-8 max-w-7xl mx-auto w-full">
                        <div className="mb-8 text-center">
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2" style={{ fontFamily: 'Georgia, serif' }}>Choose Your Class</h1>
                            <p className="text-amber-400/70 text-lg">Your class defines your role, skills, and path in the world.</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 flex-1">
                            {allClasses.map(cls => (
                                <button
                                    key={cls.name}
                                    onClick={() => handleClassSelected(cls.name)}
                                    className={`group relative rounded-xl border-2 transition-all duration-300 text-left p-5 hover:scale-105 hover:shadow-2xl bg-gray-900/80 ${draft.class === cls.name
                                            ? 'border-amber-400 shadow-amber-500/20 shadow-xl bg-amber-950/30'
                                            : 'border-gray-700/50 hover:border-amber-600/50'
                                        }`}
                                >
                                    {(cls as any).homebrew && (
                                        <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-purple-500/80 text-white text-xs rounded font-bold">HOMEBREW</span>
                                    )}
                                    <div className="text-3xl mb-3">{cls.icon}</div>
                                    <h3 className="text-lg font-bold text-white mb-1">{cls.name}</h3>
                                    <p className="text-xs text-gray-400 mb-3 leading-relaxed line-clamp-2">{cls.description}</p>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">Hit Die:</span>
                                            <span className="text-xs text-amber-400 font-bold">{cls.hitDie}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">Role:</span>
                                            <span className="text-xs text-gray-300">{cls.role}</span>
                                        </div>
                                    </div>
                                    {(cls as any).specialNote && (
                                        <div className="mt-2 px-2 py-1 bg-amber-500/20 border border-amber-500/40 rounded text-xs text-amber-400 flex items-center gap-1">
                                            <Star size={10} /> {(cls as any).specialNote}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => goTo('race')} className="mt-6 mx-auto flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                            <ChevronLeft size={16} /> Back to Race
                        </button>
                    </div>
                )}

                {/* ── SUBCLASS STEP ─────────────────────────────────────── */}
                {step === 'subclass' && (
                    <div className="flex flex-col flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
                        <div className="mb-8 text-center">
                            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2" style={{ fontFamily: 'Georgia, serif' }}>Choose Your Oath</h1>
                            <p className="text-amber-400/70 text-lg">Every Paladin swears a sacred oath that defines their divine power.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {currentSubclasses.map(sub => (
                                <button
                                    key={sub.name}
                                    onClick={() => handleSubclassSelected(sub.name)}
                                    className={`group relative rounded-xl border-2 text-left p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${(sub as any).special
                                            ? 'border-amber-500/60 bg-gradient-to-br from-amber-950/40 to-yellow-950/40 hover:border-amber-400'
                                            : (sub as any).homebrew
                                                ? 'border-purple-500/40 bg-purple-950/20 hover:border-purple-400'
                                                : 'border-gray-700/50 bg-gray-900/80 hover:border-amber-600/50'
                                        }`}
                                >
                                    {(sub as any).special && (
                                        <div className="flex items-center gap-2 mb-3">
                                            <Star className="text-amber-400" size={18} />
                                            <span className="text-amber-400 text-xs font-bold tracking-widest uppercase">Custom Creation</span>
                                        </div>
                                    )}
                                    {(sub as any).homebrew && (
                                        <span className="absolute top-3 right-3 px-1.5 py-0.5 bg-purple-500/80 text-white text-xs rounded font-bold">HOMEBREW</span>
                                    )}
                                    <h3 className="text-xl font-bold text-white mb-2">{sub.name}</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">{sub.description}</p>
                                    {(sub as any).special && (
                                        <div className="mt-4 flex items-center gap-2 text-amber-400 text-xs font-medium">
                                            <Swords size={14} />
                                            <span>Define your guardian's name, deity & sacred oath →</span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => goTo('class')} className="mt-6 mx-auto flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                            <ChevronLeft size={16} /> Back to Class
                        </button>
                    </div>
                )}

                {/* ── GUARDIAN STEP ─────────────────────────────────────── */}
                {step === 'guardian' && (
                    <div className="flex flex-col flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
                        <div className="mb-8 text-center">
                            <div className="text-6xl mb-4">🛡️</div>
                            <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Georgia, serif' }}>Forge Your Guardian</h1>
                            <p className="text-amber-400/70">Define your divine protector — the spirit that answers your call.</p>
                        </div>
                        <div className="space-y-5 bg-gray-900/80 rounded-xl border border-amber-600/30 p-8">
                            <div>
                                <label className="block text-sm font-medium text-amber-400 mb-2">Guardian Name</label>
                                <input
                                    type="text" placeholder="e.g. Aegis, Solara, Ironvow..."
                                    value={draft.guardianName}
                                    onChange={e => setDraft(prev => ({ ...prev, guardianName: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-amber-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-amber-400 mb-2">Patron Deity</label>
                                <input
                                    type="text" placeholder="e.g. Tyr, Pelor, Bahamut..."
                                    value={draft.guardianDeity}
                                    onChange={e => setDraft(prev => ({ ...prev, guardianDeity: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-amber-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-amber-400 mb-2">Sacred Oath</label>
                                <textarea
                                    placeholder="Write the vow your guardian is bound by..."
                                    value={draft.guardianOath}
                                    onChange={e => setDraft(prev => ({ ...prev, guardianOath: e.target.value }))}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-amber-500 focus:outline-none resize-none"
                                />
                            </div>
                            <button
                                onClick={() => { setDraft(prev => ({ ...prev, subclass: 'Guardian' })); goTo('appearance'); }}
                                disabled={!draft.guardianName}
                                className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:text-gray-500 text-black font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                Bind Your Guardian <ChevronRight size={18} />
                            </button>
                        </div>
                        <button onClick={() => goTo('subclass')} className="mt-6 mx-auto flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                            <ChevronLeft size={16} /> Back
                        </button>
                    </div>
                )}

                {/* ── APPEARANCE STEP ───────────────────────────────────── */}
                {step === 'appearance' && (
                    <div className="flex flex-col flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
                        <div className="mb-8 text-center">
                            <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Georgia, serif' }}>Your Appearance</h1>
                            <p className="text-amber-400/70">How does the world see your {draft.race} {draft.class}?</p>
                        </div>
                        <div className="space-y-4 bg-gray-900/80 rounded-xl border border-gray-700 p-8">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Character Name</label>
                                <input
                                    type="text" placeholder="Your character's name..."
                                    value={draft.characterName}
                                    onChange={e => setDraft(prev => ({ ...prev, characterName: e.target.value }))}
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-amber-500 focus:outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { key: 'skinTone', label: 'Skin Tone', placeholder: 'e.g. Warm tan, Pale ivory...' },
                                    { key: 'hairColor', label: 'Hair Color', placeholder: 'e.g. Raven black, Silver...' },
                                    { key: 'eyeColor', label: 'Eye Color', placeholder: 'e.g. Storm grey, Amber...' },
                                    { key: 'height', label: 'Height & Build', placeholder: 'e.g. Tall and lithe...' },
                                ].map(f => (
                                    <div key={f.key}>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">{f.label}</label>
                                        <input
                                            type="text" placeholder={f.placeholder}
                                            value={(draft.appearance as any)[f.key]}
                                            onChange={e => setDraft(prev => ({ ...prev, appearance: { ...prev.appearance, [f.key]: e.target.value } }))}
                                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:border-amber-500 focus:outline-none"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Distinguishing Features</label>
                                <input
                                    type="text" placeholder="Scars, tattoos, unusual markings..."
                                    value={draft.appearance.features}
                                    onChange={e => setDraft(prev => ({ ...prev, appearance: { ...prev.appearance, features: e.target.value } }))}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:border-amber-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Backstory (Optional)</label>
                                <textarea
                                    placeholder="Where did you come from? What drives you forward?"
                                    value={draft.backstory}
                                    onChange={e => setDraft(prev => ({ ...prev, backstory: e.target.value }))}
                                    rows={3}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:border-amber-500 focus:outline-none resize-none"
                                />
                            </div>
                            <button
                                onClick={() => goTo('confirm')}
                                disabled={!draft.characterName}
                                className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:text-gray-500 text-black font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                Review Character <ChevronRight size={18} />
                            </button>
                        </div>
                        <button onClick={() => goTo(draft.subclass === 'Create Guardian' ? 'guardian' : draft.class === 'Paladin' ? 'subclass' : 'class')} className="mt-6 mx-auto flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                            <ChevronLeft size={16} /> Back
                        </button>
                    </div>
                )}

                {/* ── CONFIRM STEP ──────────────────────────────────────── */}
                {step === 'confirm' && (
                    <div className="flex flex-col flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
                        <div className="mb-8 text-center">
                            <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Georgia, serif' }}>Your Legend Begins</h1>
                            <p className="text-amber-400/70">Confirm your character and enter the campaign.</p>
                        </div>

                        <div className="bg-gray-900/90 rounded-xl border border-amber-600/40 overflow-hidden">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-amber-950 to-gray-900 p-6 border-b border-amber-800/30">
                                <h2 className="text-3xl font-bold text-white">{draft.characterName}</h2>
                                <p className="text-amber-400 text-lg mt-1">{draft.race} {draft.class}{draft.subclass ? ` · ${draft.subclass}` : ''}</p>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* Appearance */}
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Appearance</h3>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        {draft.appearance.skinTone && <div className="text-gray-300"><span className="text-gray-500">Skin: </span>{draft.appearance.skinTone}</div>}
                                        {draft.appearance.hairColor && <div className="text-gray-300"><span className="text-gray-500">Hair: </span>{draft.appearance.hairColor}</div>}
                                        {draft.appearance.eyeColor && <div className="text-gray-300"><span className="text-gray-500">Eyes: </span>{draft.appearance.eyeColor}</div>}
                                        {draft.appearance.height && <div className="text-gray-300"><span className="text-gray-500">Build: </span>{draft.appearance.height}</div>}
                                        {draft.appearance.features && <div className="text-gray-300 col-span-2"><span className="text-gray-500">Features: </span>{draft.appearance.features}</div>}
                                    </div>
                                </div>

                                {/* Guardian */}
                                {draft.guardianName && (
                                    <div>
                                        <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-2">⚔️ Guardian</h3>
                                        <div className="text-sm space-y-1">
                                            <div className="text-gray-300"><span className="text-gray-500">Name: </span>{draft.guardianName}</div>
                                            <div className="text-gray-300"><span className="text-gray-500">Deity: </span>{draft.guardianDeity}</div>
                                            {draft.guardianOath && <div className="text-gray-300"><span className="text-gray-500">Oath: </span><em>"{draft.guardianOath}"</em></div>}
                                        </div>
                                    </div>
                                )}

                                {/* Backstory */}
                                {draft.backstory && (
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Backstory</h3>
                                        <p className="text-gray-300 text-sm italic">"{draft.backstory}"</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-gray-800 space-y-3">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="w-full py-4 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 disabled:from-gray-700 disabled:to-gray-600 text-black font-black text-lg rounded-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                                >
                                    {saving ? 'Entering campaign...' : '⚔️ Begin Your Adventure'}
                                </button>
                                <button onClick={() => goTo('appearance')} className="w-full py-2 text-gray-400 hover:text-white transition-colors text-sm">
                                    ← Edit Appearance
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
