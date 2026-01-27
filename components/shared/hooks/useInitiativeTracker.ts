import { useState, useCallback, useMemo, useEffect } from 'react';
import { Condition } from '@/lib/initiative-data/conditions';
import { toast } from 'sonner';

export interface InitiativeCombatant {
    id: string;
    name: string;
    type: 'player' | 'enemy' | 'ally';
    initiative: number;
    dexModifier?: number; // For tie-breaking
    hpCurrent: number;
    hpMax: number;
    ac: number;
    conditions: Condition[];
    notes?: string;
    isVisible?: boolean; // For hidden enemies
}

export interface InitiativeState {
    combatants: InitiativeCombatant[];
    currentTurn: number; // Index in sorted array
    round: number;
    isActive: boolean;
    encounterId?: string; // Link to parent encounter
}

export const useInitiativeTracker = (initialState?: Partial<InitiativeState>, onChange?: (state: InitiativeState) => void) => {
    const [combatants, setCombatants] = useState<InitiativeCombatant[]>(initialState?.combatants || []);
    const [currentTurn, setCurrentTurn] = useState(initialState?.currentTurn || 0);
    const [round, setRound] = useState(initialState?.round || 1);
    const [isActive, setIsActive] = useState(initialState?.isActive || false);
    const [encounterId, setEncounterId] = useState(initialState?.encounterId);

    // Trigger onChange whenever state changes
    useEffect(() => {
        if (onChange) {
            onChange({
                combatants,
                currentTurn,
                round,
                isActive,
                encounterId
            });
        }
    }, [combatants, currentTurn, round, isActive, encounterId, onChange]);

    const getSortedCombatants = useCallback(() => {
        return [...combatants].sort((a, b) => {
            if (b.initiative !== a.initiative) {
                return b.initiative - a.initiative;
            }
            return (b.dexModifier || 0) - (a.dexModifier || 0);
        });
    }, [combatants]);

    const sortedCombatants = useMemo(() => getSortedCombatants(), [getSortedCombatants]);

    const addCombatant = useCallback((combatant: InitiativeCombatant) => {
        setCombatants((prev) => [...prev, combatant]);
    }, []);

    const removeCombatant = useCallback((id: string) => {
        setCombatants((prev) => prev.filter((c) => c.id !== id));
    }, []);

    const updateCombatant = useCallback((id: string, updates: Partial<InitiativeCombatant>) => {
        setCombatants((prev) =>
            prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
        );
    }, []);

    const setInitiative = useCallback((id: string, value: number) => {
        updateCombatant(id, { initiative: value });
    }, [updateCombatant]);

    const rollInitiative = useCallback((id: string) => {
        const combatant = combatants.find((c) => c.id === id);
        if (!combatant) return;
        const roll = Math.floor(Math.random() * 20) + 1;
        const total = roll + (combatant.dexModifier || 0);
        setInitiative(id, total);
        toast.success(`${combatant.name} rolled ${total} (${roll} + ${combatant.dexModifier || 0})`);
    }, [combatants, setInitiative]);

    const rollAllInitiative = useCallback(() => {
        setCombatants((prev) =>
            prev.map((c) => {
                if (c.type === 'enemy' || c.initiative === 0) {
                    const roll = Math.floor(Math.random() * 20) + 1;
                    return { ...c, initiative: roll + (c.dexModifier || 0) };
                }
                return c;
            })
        );
        toast.success('Rolled initiative for all enemies');
    }, []);

    const updateHP = useCallback((id: string, delta: number) => {
        setCombatants((prev) =>
            prev.map((c) => {
                if (c.id === id) {
                    const newHP = Math.min(Math.max(0, c.hpCurrent + delta), c.hpMax);
                    return { ...c, hpCurrent: newHP };
                }
                return c;
            })
        );
    }, []);

    const addCondition = useCallback((id: string, condition: Condition) => {
        setCombatants((prev) =>
            prev.map((c) => {
                if (c.id === id) {
                    if (c.conditions.some((con) => con.id === condition.id)) return c;
                    return { ...c, conditions: [...c.conditions, { ...condition }] };
                }
                return c;
            })
        );
    }, []);

    const removeCondition = useCallback((id: string, conditionId: string) => {
        setCombatants((prev) =>
            prev.map((c) => {
                if (c.id === id) {
                    return { ...c, conditions: c.conditions.filter((con) => con.id !== conditionId) };
                }
                return c;
            })
        );
    }, []);

    const tickConditions = useCallback((combatantId: string, trigger: 'start_of_turn' | 'end_of_turn') => {
        setCombatants((prev) =>
            prev.map((c) => {
                if (c.id === combatantId) {
                    const updatedConditions = c.conditions
                        .map((con) => {
                            if (con.endTrigger === trigger && con.duration > 0) {
                                return { ...con, duration: con.duration - 1 };
                            }
                            return con;
                        })
                        .filter((con) => con.duration !== 0);
                    return { ...c, conditions: updatedConditions };
                }
                return c;
            })
        );
    }, []);

    const nextTurn = useCallback(() => {
        const nextIndex = (currentTurn + 1) % sortedCombatants.length;
        if (nextIndex === 0) {
            setRound((prev) => prev + 1);
        }

        // Tick conditions for the combatant ending their turn
        const endingCombatant = sortedCombatants[currentTurn];
        if (endingCombatant) {
            tickConditions(endingCombatant.id, 'end_of_turn');
        }

        setCurrentTurn(nextIndex);

        // Tick conditions for the combatant starting their turn
        const startingCombatant = sortedCombatants[nextIndex];
        if (startingCombatant) {
            tickConditions(startingCombatant.id, 'start_of_turn');
        }
    }, [currentTurn, sortedCombatants, tickConditions]);

    const previousTurn = useCallback(() => {
        let nextIndex = currentTurn - 1;
        if (nextIndex < 0) {
            nextIndex = sortedCombatants.length - 1;
            setRound((prev) => Math.max(1, prev - 1));
        }
        setCurrentTurn(nextIndex);
    }, [currentTurn, sortedCombatants.length]);

    const startCombat = useCallback(() => {
        setIsActive(true);
        setRound(1);
        setCurrentTurn(0);
        toast.success('Combat started!');
    }, []);

    const endCombat = useCallback(() => {
        setIsActive(false);
        toast.info('Combat ended');
    }, []);

    const getActiveCombatant = useCallback(() => {
        return sortedCombatants[currentTurn];
    }, [sortedCombatants, currentTurn]);

    const getHealthPercentage = useCallback((id: string) => {
        const combatant = combatants.find((c) => c.id === id);
        if (!combatant) return 0;
        return (combatant.hpCurrent / combatant.hpMax) * 100;
    }, [combatants]);

    const isBloodied = useCallback((id: string) => {
        const combatant = combatants.find((c) => c.id === id);
        if (!combatant) return false;
        return combatant.hpCurrent <= combatant.hpMax * 0.5;
    }, [combatants]);

    const isDead = useCallback((id: string) => {
        const combatant = combatants.find((c) => c.id === id);
        if (!combatant) return false;
        return combatant.hpCurrent <= 0;
    }, [combatants]);

    return {
        combatants,
        sortedCombatants,
        currentTurn,
        round,
        isActive,
        encounterId,
        addCombatant,
        removeCombatant,
        updateCombatant,
        setInitiative,
        rollInitiative,
        rollAllInitiative,
        updateHP,
        addCondition,
        removeCondition,
        nextTurn,
        previousTurn,
        startCombat,
        endCombat,
        getActiveCombatant,
        getHealthPercentage,
        isBloodied,
        isDead,
        setEncounterId,
    };
};
