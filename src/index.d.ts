type Widget = ListWidget | WidgetStack
export declare namespace String {
    function insert(index: number, string: string)
}

interface SberFoodWallet {
    name: string
    balance: number
    status: string
    logo: string | URL
    bonus: number
    id: string,
}

export declare function labelStyle(element: WidgetText): WidgetText

export function addLabel(element: Widget, text: string, center?: boolean = false, vertical?: boolean = false): WidgetText

export declare function valueStyle(element: WidgetText): WidgetText

export function addValue(element: Widget, text: string, center?: boolean = false, vertical?: boolean = false): WidgetText

export function centerText(element: Widget, text: string, vertical?: boolean = false): WidgetText

export function centerStack<T extends Widget>(element: T, vertical?: boolean = false): T


// export declare function setPadding<T extends Widget>(element: T, top: number, leading: number, bottom: number, trailing: number): T
// export declare function setPadding<T extends Widget>(element: T, top: number, horizontal: number, bottom: number): T
// export declare function setPadding<T extends Widget>(element: T, vertical: number, horizontal: number): T
// export declare function setPadding<T extends Widget>(element: T, padding: number): T
export declare function setPadding<T extends Widget>(element: T, paddings: number[]): T

export declare async function errorAlert(message: string)

export declare async function getSMS(tel: string)

export declare async function checkSMS(tel: string, code: string)

export declare async function createWidget(rootWidget: Widget, api: SberFoodWallet): Widget

async function codeWidget(rootWidget: Widget): Widget

async function loginWidget(): Widget

export declare async function sberFoodWallet(index: string | number): SberFoodWallet

export declare async function loadWallet(): WalletNamespace.RootObject

export declare function getHeaders(withContent: boolean): object

// from http://json2ts.com/
declare module WalletNamespace {
    export interface Network {
        id: string;
        name: string;
    }

    export interface OpeningHour {
        dayOfWeek: number;
        from: string;
        to: string;
        allDay: boolean;
        closed: boolean;
    }

    export interface Currency {
        currencyName: string;
        shortName: string;
        centsCount: number;
    }

    export interface SocialNetwork {
        url: string;
        type: string;
    }

    export interface NearbyOrganization {
        id: string;
        name: string;
        description: string;
        logoImageUrl: string;
        address: string;
        latitude: number;
        longitude: number;
        phone: string;
        website: string;
        averageCheque: number;
        openingHours: OpeningHour[];
        organizationType: number;
        distance: number;
        networkId: string;
        currency: Currency;
        supportedFeatures: string[];
        formattedOpeningHours: string[];
        source: string;
        socialNetworks: SocialNetwork[];
    }

    export interface Rank {
        name: string;
        index: number;
        bonusPercentage: number;
        accumulateToAchieve: number;
    }

    export interface Confirmation {
        sum: number;
        hoursLeft: number;
        reset: string;
    }

    export interface CurrentRank {
        index: number;
        accumulated: number;
        confirmation: Confirmation;
    }

    export interface Wallet {
        name: string;
        logoImageUrl: string;
        currentRankName: string;
        bonusPercentage: number;
        balance: number;
        promoBonusBalance: number;
        ranks: Rank[];
        currentRank: CurrentRank;
    }

    export interface RootObject {
        network: Network;
        nearbyOrganization: NearbyOrganization;
        wallet: Wallet;
    }
}
