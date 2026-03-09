'use client';

import React, { useState } from 'react';
import { Search, Loader2, X, Plus } from 'lucide-react';
import styles from './InitiativeTracker.module.css';

interface MonsterSearchModalProps {
    onClose: () => void;
    onAddMonster: (monster: any, initiative: number) => void;
}

export const MonsterSearchModal: React.FC<MonsterSearchModalProps> = ({ onClose, onAddMonster }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedMonster, setSelectedMonster] = useState<any | null>(null);
    const [manualInitiative, setManualInitiative] = useState<string>('');
    const [error, setError] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        setError('');
        setSelectedMonster(null);
        try {
            const res = await fetch(`https://api.open5e.com/monsters/?search=${encodeURIComponent(query)}`);
            if (!res.ok) throw new Error('API Error');
            const data = await res.json();
            setResults(data.results || []);
        } catch (err: any) {
            setError(err.message || 'Failed to search monsters');
        } finally {
            setIsSearching(false);
        }
    };

    const handleAdd = () => {
        if (!selectedMonster) return;
        // roll initiative if not provided manually
        let initValue = parseInt(manualInitiative);
        if (isNaN(initValue)) {
            const dexMod = Math.floor((selectedMonster.dexterity - 10) / 2);
            initValue = Math.floor(Math.random() * 20) + 1 + dexMod;
        }

        onAddMonster(selectedMonster, initValue);
        onClose();
    };

    const getMod = (score: number) => {
        const mod = Math.floor((score - 10) / 2);
        return mod >= 0 ? `+${mod}` : mod.toString();
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal} style={{ maxWidth: '800px', width: '90%' }}>
                <div className={styles.modalHeader}>
                    <h3>SRD Monster Search</h3>
                    <button className={styles.btnGhost} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '1rem', height: '60vh', overflow: 'hidden' }}>
                    {/* Left pane: Search & Results */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #374151', paddingRight: '1rem' }}>
                        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                            <input
                                type="text"
                                placeholder="Search monsters (e.g. Goblin)..."
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                className={styles.btnSecondary}
                                style={{ flex: 1, padding: '0.5rem' }}
                            />
                            <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={isSearching}>
                                {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                            </button>
                        </form>
                        {error && <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>{error}</p>}

                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {results.map((m) => (
                                <div
                                    key={m.slug}
                                    onClick={() => setSelectedMonster(m)}
                                    style={{
                                        padding: '0.75rem',
                                        cursor: 'pointer',
                                        borderBottom: '1px solid #374151',
                                        backgroundColor: selectedMonster?.slug === m.slug ? '#374151' : 'transparent',
                                        borderRadius: '0.25rem'
                                    }}
                                >
                                    <div style={{ fontWeight: 'bold' }}>{m.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>{m.size} {m.type}, CR {m.challenge_rating}</div>
                                </div>
                            ))}
                            {!isSearching && results.length === 0 && query && !error && (
                                <p style={{ color: '#9ca3af', textAlign: 'center', marginTop: '1rem' }}>No monsters found.</p>
                            )}
                        </div>
                    </div>

                    {/* Right pane: Stat Block */}
                    <div style={{ flex: 1.5, overflowY: 'auto', paddingLeft: '1rem' }}>
                        {selectedMonster ? (
                            <div style={{ color: '#d1d5db', fontSize: '0.9rem' }}>
                                <h2 style={{ color: '#fca5a5', margin: '0 0 0.25rem 0', fontSize: '1.5rem' }}>{selectedMonster.name}</h2>
                                <p style={{ fontStyle: 'italic', margin: '0 0 1rem 0' }}>{selectedMonster.size} {selectedMonster.type}, {selectedMonster.alignment}</p>

                                <div style={{ borderTop: '2px solid #991b1b', borderBottom: '2px solid #991b1b', padding: '0.5rem 0', marginBottom: '1rem' }}>
                                    <div><strong>Armor Class</strong> {selectedMonster.armor_class} {selectedMonster.armor_desc && `(${selectedMonster.armor_desc})`}</div>
                                    <div><strong>Hit Points</strong> {selectedMonster.hit_points} ({selectedMonster.hit_dice})</div>
                                    <div>
                                        <strong>Speed</strong> {Object.entries(selectedMonster.speed || {}).map(([type, val]) => `${type} ${val}ft`).join(', ')}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center', marginBottom: '1rem' }}>
                                    <div><strong>STR</strong><br />{selectedMonster.strength} ({getMod(selectedMonster.strength)})</div>
                                    <div><strong>DEX</strong><br />{selectedMonster.dexterity} ({getMod(selectedMonster.dexterity)})</div>
                                    <div><strong>CON</strong><br />{selectedMonster.constitution} ({getMod(selectedMonster.constitution)})</div>
                                    <div><strong>INT</strong><br />{selectedMonster.intelligence} ({getMod(selectedMonster.intelligence)})</div>
                                    <div><strong>WIS</strong><br />{selectedMonster.wisdom} ({getMod(selectedMonster.wisdom)})</div>
                                    <div><strong>CHA</strong><br />{selectedMonster.charisma} ({getMod(selectedMonster.charisma)})</div>
                                </div>

                                <div style={{ borderTop: '2px solid #991b1b', padding: '0.5rem 0', marginBottom: '1rem' }}>
                                    {selectedMonster.skills && Object.keys(selectedMonster.skills).length > 0 && (
                                        <div><strong>Skills</strong> {Object.entries(selectedMonster.skills).map(([k, v]) => `${k} +${v}`).join(', ')}</div>
                                    )}
                                    {selectedMonster.senses && <div><strong>Senses</strong> {selectedMonster.senses}</div>}
                                    {selectedMonster.languages && <div><strong>Languages</strong> {selectedMonster.languages}</div>}
                                    <div><strong>Challenge</strong> {selectedMonster.challenge_rating}</div>
                                </div>

                                {selectedMonster.special_abilities && selectedMonster.special_abilities.length > 0 && (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <h3 style={{ borderBottom: '1px solid #991b1b', paddingBottom: '0.25rem' }}>Traits</h3>
                                        {selectedMonster.special_abilities.map((a: any, i: number) => (
                                            <p key={i} style={{ marginBottom: '0.5rem' }}><strong>{a.name}.</strong> {a.desc}</p>
                                        ))}
                                    </div>
                                )}

                                {selectedMonster.actions && selectedMonster.actions.length > 0 && (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <h3 style={{ borderBottom: '1px solid #991b1b', paddingBottom: '0.25rem' }}>Actions</h3>
                                        {selectedMonster.actions.map((a: any, i: number) => (
                                            <p key={i} style={{ marginBottom: '0.5rem' }}><strong>{a.name}.</strong> {a.desc}</p>
                                        ))}
                                    </div>
                                )}

                                {selectedMonster.legendary_actions && selectedMonster.legendary_actions.length > 0 && (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <h3 style={{ borderBottom: '1px solid #991b1b', paddingBottom: '0.25rem' }}>Legendary Actions</h3>
                                        {selectedMonster.legendary_actions.map((a: any, i: number) => (
                                            <p key={i} style={{ marginBottom: '0.5rem' }}><strong>{a.name}.</strong> {a.desc}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                                Select a monster to view details
                            </div>
                        )}
                    </div>
                </div>

                {selectedMonster && (
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', alignItems: 'center', borderTop: '1px solid #374151', paddingTop: '1rem' }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <label className={styles.type}>Initiative:</label>
                            <input
                                type="number"
                                placeholder={`Auto (1d20${getMod(selectedMonster.dexterity)})`}
                                value={manualInitiative}
                                onChange={e => setManualInitiative(e.target.value)}
                                className={styles.btnSecondary}
                                style={{ width: '150px', padding: '0.5rem' }}
                            />
                        </div>
                        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleAdd}>
                            <Plus size={16} /> Add to Tracker
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
