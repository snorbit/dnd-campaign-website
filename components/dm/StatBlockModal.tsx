import React from 'react';
import { X } from 'lucide-react';
import styles from './InitiativeTracker.module.css';

interface StatBlockModalProps {
    monster: any;
    onClose: () => void;
}

export const StatBlockModal: React.FC<StatBlockModalProps> = ({ monster, onClose }) => {
    if (!monster) return null;

    const getMod = (score: number) => {
        const mod = Math.floor((score - 10) / 2);
        return mod >= 0 ? `+${mod}` : mod.toString();
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal} style={{ maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                <div className={styles.modalHeader}>
                    <h3>{monster.name}</h3>
                    <button className={styles.btnGhost} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ color: '#d1d5db', fontSize: '0.9rem', padding: '1rem' }}>
                    <p style={{ fontStyle: 'italic', margin: '0 0 1rem 0' }}>{monster.size} {monster.type}, {monster.alignment}</p>

                    <div style={{ borderTop: '2px solid #991b1b', borderBottom: '2px solid #991b1b', padding: '0.5rem 0', marginBottom: '1rem' }}>
                        <div><strong>Armor Class</strong> {monster.armor_class} {monster.armor_desc && `(${monster.armor_desc})`}</div>
                        <div><strong>Hit Points</strong> {monster.hit_points} ({monster.hit_dice})</div>
                        <div>
                            <strong>Speed</strong> {Object.entries(monster.speed || {}).map(([type, val]) => `${type} ${val}ft`).join(', ')}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', textAlign: 'center', marginBottom: '1rem', gap: '0.5rem' }}>
                        <div><strong>STR</strong><br />{monster.strength} ({getMod(monster.strength)})</div>
                        <div><strong>DEX</strong><br />{monster.dexterity} ({getMod(monster.dexterity)})</div>
                        <div><strong>CON</strong><br />{monster.constitution} ({getMod(monster.constitution)})</div>
                        <div><strong>INT</strong><br />{monster.intelligence} ({getMod(monster.intelligence)})</div>
                        <div><strong>WIS</strong><br />{monster.wisdom} ({getMod(monster.wisdom)})</div>
                        <div><strong>CHA</strong><br />{monster.charisma} ({getMod(monster.charisma)})</div>
                    </div>

                    <div style={{ borderTop: '2px solid #991b1b', padding: '0.5rem 0', marginBottom: '1rem' }}>
                        {monster.skills && Object.keys(monster.skills).length > 0 && (
                            <div><strong>Skills</strong> {Object.entries(monster.skills).map(([k, v]) => `${k} +${v}`).join(', ')}</div>
                        )}
                        {monster.senses && <div><strong>Senses</strong> {monster.senses}</div>}
                        {monster.languages && <div><strong>Languages</strong> {monster.languages}</div>}
                        <div><strong>Challenge</strong> {monster.challenge_rating}</div>
                    </div>

                    {monster.special_abilities && monster.special_abilities.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                            <h3 style={{ borderBottom: '1px solid #991b1b', paddingBottom: '0.25rem', color: '#fca5a5' }}>Traits</h3>
                            {monster.special_abilities.map((a: any, i: number) => (
                                <p key={i} style={{ marginBottom: '0.5rem' }}><strong>{a.name}.</strong> {a.desc}</p>
                            ))}
                        </div>
                    )}

                    {monster.actions && monster.actions.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                            <h3 style={{ borderBottom: '1px solid #991b1b', paddingBottom: '0.25rem', color: '#fca5a5' }}>Actions</h3>
                            {monster.actions.map((a: any, i: number) => (
                                <p key={i} style={{ marginBottom: '0.5rem' }}><strong>{a.name}.</strong> {a.desc}</p>
                            ))}
                        </div>
                    )}

                    {monster.legendary_actions && monster.legendary_actions.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                            <h3 style={{ borderBottom: '1px solid #991b1b', paddingBottom: '0.25rem', color: '#fca5a5' }}>Legendary Actions</h3>
                            {monster.legendary_actions.map((a: any, i: number) => (
                                <p key={i} style={{ marginBottom: '0.5rem' }}><strong>{a.name}.</strong> {a.desc}</p>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
