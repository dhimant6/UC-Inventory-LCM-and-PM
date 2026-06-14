export declare class TeamsConnector {
    syncDevices(tenantId: string, apiKey: string): Promise<any[]>;
    private mapTeamsStatus;
}
export declare class WebexConnector {
    syncDevices(tenantId: string, apiKey: string): Promise<any[]>;
    private mapWebexStatus;
}
export declare class PolycomConnector {
    syncDevices(tenantId: string, apiKey: string): Promise<any[]>;
    private mapPolycomStatus;
}
export declare class UnifiedCommunicationService {
    private teamsConnector;
    private webexConnector;
    private polycomConnector;
    syncAllDevices(teamId: string, integrations: any): Promise<{
        teams: null;
        webex: null;
        polycom: null;
        errors: never[];
    }>;
}
//# sourceMappingURL=UnifiedCommunicationService.d.ts.map