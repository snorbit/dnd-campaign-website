'use client';

import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import {
    Sword,
    RotateCcw,
    Play,
    Square,
    Plus,
    Trash2,
    Shield,
    Heart,
    ChevronRight,
    User,
    Skull,
    X,
    Dices
} from 'lucide-react';
import { useInitiativeTracker, InitiativeCombatant, InitiativeState } from '@/components/shared/hooks/useInitiativeTracker';
import { CONDITIONS, Condition } from '@/lib/initiative-data/conditions';
import styles from './InitiativeTracker.module.css';

interface InitiativeTrackerProps {
    initialState?: Partial<InitiativeState>;
    onSave?: (state: any) => void;
    onClose?: () => void;
}

const ConditionIcon = ({ name, size = 12 }: { name: string, size?: number }) => {
    const IconComponent = (Icons as any)[name];
    if (!IconComponent) return <Icons.HelpCircle size={size} />;
    return <IconComponent size={size} />;
};

export const InitiativeTracker: React.FC<InitiativeTrackerProps> = ({
    initialState,
    onSave,
    onClose
}) => {
    const tracker = useInitiativeTracker(initialState || {}, onSave);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showConditionModal, setShowConditionModal] = useState<string | null>(null);
    const [newCombatant, setNewCombatant] = useState<Partial<InitiativeCombatant>>({
        name: '',
        type: 'enemy',
        initiative: 0,
        hpMax: 10,
        hpCurrent: 10,
        ac: 10,
        dexModifier: 0,
        isVisible: true
    });

    const activeCombatant = tracker.getActiveCombatant();

    const handleAddCombatant = () => {
        if (!newCombatant.name) return;

        const combatant: InitiativeCombatant = {
            id: crypto.randomUUID(),
            name: newCombatant.name || 'Unknown',
            type: newCombatant.type as any || 'enemy',
            initiative: newCombatant.initiative || 0,
            hpMax: newCombatant.hpMax || 10,
            hpCurrent: newCombatant.hpCurrent || newCombatant.hpMax || 10,
            ac: newCombatant.ac || 10,
            dexModifier: newCombatant.dexModifier || 0,
            conditions: [],
            isVisible: newCombatant.isVisible !== undefined ? newCombatant.isVisible : true,
            notes: ''
        };

        tracker.addCombatant(combatant);
        setShowAddModal(false);
        setNewCombatant({
            name: '',
            type: 'enemy',
            initiative: 0,
            hpMax: 10,
            hpCurrent: 10,
            ac: 10,
            dexModifier: 0,
            isVisible: true
        });
    };

    const getHPColor = (current: number, max: number) => {
        const percent = (current / max) * 100;
        if (current <= 0) return '#4b5563';
        if (percent < 25) return '#ef4444';
        if (percent < 50) return '#f59e0b';
        return '#10b981';
    };

    return (
        <div className={styles.trackerContainer}>
            <header className={styles.header}>
                <div className={styles.titleGroup}>
                    <h2>Initiative Tracker</h2>
                    <span className={styles.roundBadge}>Round {tracker.round}</span>
                </div>

                <div className={styles.controls}>
                    {tracker.isActive ? (
                        <button className={`${styles.btn} ${styles.btnDanger}`} onClick={tracker.endCombat}>
                            <Square size={16} /> End Combat
                        </button>
                    ) : (
                        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={tracker.startCombat}>
                            <Play size={16} /> Start Combat
                        </button>
                    )}

                    <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={tracker.rollAllInitiative}>
                        <Dices size={16} /> Roll All
                    </button>

                    <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setShowAddModal(true)}>
                        <Plus size={16} /> Add
                    </button>

                    {onClose && (
                        <button className={`${styles.btn} ${styles.btnGhost}`} onClick={onClose}>
                            <X size={20} />
                        </button>
                    )}
                </div>
            </header>

            <div className={styles.combatList}>
                {tracker.sortedCombatants.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Sword className={styles.emptyIcon} />
                        <p>No combatants added yet.</p>
                        <p className={styles.type}>Click the "Add" button to start an encounter.</p>
                    </div>
                ) : (
                    tracker.sortedCombatants.map((combatant, index) => {
                        const isActive = tracker.isActive && tracker.currentTurn === index;
                        const healthPercent = (combatant.hpCurrent / combatant.hpMax) * 100;
                        const isDead = combatant.hpCurrent <= 0;

                        return (
                            <div
                                key={combatant.id}
                                className={`
                  ${styles.row} 
                  ${isActive ? styles.activeRow : ''} 
                  ${isDead ? styles.deadRow : ''}
                  ${combatant.type === 'player' ? styles.playerRow : combatant.type === 'enemy' ? styles.enemyRow : styles.allyRow}
                `}
                            >
                                <div className={styles.turnIndicator}>
                                    {isActive && <ChevronRight className={styles.pulse} size={24} />}
                                </div>

                                <div className={styles.initiativeBox}>
                                    {combatant.initiative}
                                </div>

                                <div className={styles.info}>
                                    <span className={styles.name}>{combatant.name}</span>
                                    <span className={`${styles.type} ${styles[`${combatant.type}Type`]}`}>
                                        {combatant.type}
                                    </span>
                                </div>

                                <div className={styles.hpContainer}>
                                    <div className={styles.hpText}>
                                        {combatant.hpCurrent} / {combatant.hpMax}
                                    </div>
                                    <div className={styles.hpBar}>
                                        <div
                                            className={styles.hpFill}
                                            style={{
                                                width: `${healthPercent}%`,
                                                backgroundColor: getHPColor(combatant.hpCurrent, combatant.hpMax)
                                            }}
                                        />
                                    </div>
                                    <div className={styles.hpControls}>
                                        <button className={styles.hpBtn} onClick={() => tracker.updateHP(combatant.id, -1)}>-1</button>
                                        <button className={styles.hpBtn} onClick={() => tracker.updateHP(combatant.id, -5)}>-5</button>
                                        <button className={styles.hpBtn} onClick={() => tracker.updateHP(combatant.id, 5)}>+5</button>
                                        <button className={styles.hpBtn} onClick={() => tracker.updateHP(combatant.id, 1)}>+1</button>
                                    </div>
                                </div>

                                <div className={styles.acBox}>
                                    <Shield size={14} /> {combatant.ac}
                                </div>

                                <div className={styles.conditionsList}>
                                    {combatant.conditions.map(c => (
                                        <div
                                            key={c.id}
                                            className={styles.conditionBadge}
                                            title={c.description}
                                            onClick={() => tracker.removeCondition(combatant.id, c.id)}
                                        >
                                            <ConditionIcon name={c.iconName} />
                                            {c.name}
                                        </div>
                                    ))}
                                    <button
                                        className={styles.btnGhost}
                                        onClick={() => setShowConditionModal(combatant.id)}
                                    >
                                        <Plus size={12} />
                                    </button>
                                </div>

                                <div className={styles.actions}>
                                    <button className={styles.btnGhost} onClick={() => tracker.rollInitiative(combatant.id)}>
                                        <Dices size={16} />
                                    </button>
                                    <button className={`${styles.btnGhost} ${styles.btnDanger}`} onClick={() => tracker.removeCombatant(combatant.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {tracker.isActive && (
                <div className={styles.footer}>
                    <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={tracker.previousTurn}>
                        <RotateCcw size={16} /> Previous Turn
                    </button>
                    <div className={styles.info} style={{ textAlign: 'center' }}>
                        <span className={styles.type}>Currently</span>
                        <span className={styles.name}>{activeCombatant?.name}'s Turn</span>
                    </div>
                    <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={tracker.nextTurn}>
                        Next Turn <ChevronRight size={16} />
                    </button>
                </div>
            )}

            {/* Add Combatant Modal */}
            {showAddModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3>Add Combatant</h3>
                            <button className={styles.btnGhost} onClick={() => setShowAddModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label className={styles.type}>Name</label>
                                <input
                                    type="text"
                                    value={newCombatant.name}
                                    onChange={e => setNewCombatant({ ...newCombatant, name: e.target.value })}
                                    className={styles.btnSecondary}
                                    style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label className={styles.type}>Type</label>
                                    <select
                                        value={newCombatant.type}
                                        onChange={e => setNewCombatant({ ...newCombatant, type: e.target.value as any })}
                                        className={styles.btnSecondary}
                                        style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                                    >
                                        <option value="player">Player</option>
                                        <option value="enemy">Enemy</option>
                                        <option value="ally">Ally</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={styles.type}>AC</label>
                                    <input
                                        type="number"
                                        value={newCombatant.ac}
                                        onChange={e => setNewCombatant({ ...newCombatant, ac: parseInt(e.target.value) })}
                                        className={styles.btnSecondary}
                                        style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label className={styles.type}>Initiative</label>
                                    <input
                                        type="number"
                                        value={newCombatant.initiative}
                                        onChange={e => setNewCombatant({ ...newCombatant, initiative: parseInt(e.target.value) })}
                                        className={styles.btnSecondary}
                                        style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                                    />
                                </div>
                                <div>
                                    <label className={styles.type}>Dex Mod</label>
                                    <input
                                        type="number"
                                        value={newCombatant.dexModifier}
                                        onChange={e => setNewCombatant({ ...newCombatant, dexModifier: parseInt(e.target.value) })}
                                        className={styles.btnSecondary}
                                        style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label className={styles.type}>Max HP</label>
                                    <input
                                        type="number"
                                        value={newCombatant.hpMax}
                                        onChange={e => setNewCombatant({ ...newCombatant, hpMax: parseInt(e.target.value) })}
                                        className={styles.btnSecondary}
                                        style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                                    />
                                </div>
                            </div>
                            <button
                                className={`${styles.btn} ${styles.btnPrimary}`}
                                onClick={handleAddCombatant}
                                style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}
                            >
                                Add to Combat
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Condition Modal */}
            {showConditionModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h3>Add Condition</h3>
                            <button className={styles.btnGhost} onClick={() => setShowConditionModal(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className={styles.conditionGrid}>
                            {CONDITIONS.map(c => (
                                <div
                                    key={c.id}
                                    className={styles.conditionOption}
                                    onClick={() => {
                                        tracker.addCondition(showConditionModal, c);
                                        setShowConditionModal(null);
                                    }}
                                >
                                    <ConditionIcon name={c.iconName} size={24} />
                                    <span className={styles.conditionOptionLabel}>{c.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
