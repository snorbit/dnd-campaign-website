declare module '@3d-dice/dice-box' {
    interface DiceBoxConfig {
        assetPath: string;
        container?: string;
        theme?: string;
        themeColor?: string;
        textColor?: string;
        scale?: number;
        gravity?: number;
        mass?: number;
        friction?: number;
        restitution?: number;
        spinForce?: number;
        throwForce?: number;
        startingHeight?: number;
        settleTimeout?: number;
        offscreen?: boolean;
        delay?: number;
        lightIntensity?: number;
        enableShadows?: boolean;
        shadowTransparency?: number;
    }

    interface RollResult {
        groupId: string;
        qty: number;
        sides: number;
        mods: number[];
        rolls: Array<{
            id: string;
            sides: number;
            groupId: string;
            rollId: string;
            theme: string;
            themeColor: string;
            value: number;
        }>;
        value: number;
    }

    class DiceBox {
        constructor(config: DiceBoxConfig);
        init(): Promise<void>;
        roll(notation: string | string[]): Promise<RollResult[]>;
        clear(): void;
        hide(): void;
        show(): void;
        onRollComplete?: (results: RollResult[]) => void;
        onRemoveComplete?: (results: RollResult[]) => void;
        onThemeConfigLoaded?: (themeConfig: any) => void;
        onThemeLoaded?: (theme: any) => void;
    }

    export default DiceBox;
}
