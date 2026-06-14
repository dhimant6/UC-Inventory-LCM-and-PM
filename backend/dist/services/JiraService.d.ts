export declare class JiraService {
    private baseUrl;
    private apiKey;
    constructor(baseUrl: string, apiKey: string);
    createProject(projectData: any): Promise<any>;
    updateProject(projectId: string, updates: any): Promise<any>;
    createIssue(projectId: string, issueData: any): Promise<any>;
    syncDeviceExpiry(deviceId: string): Promise<any>;
}
//# sourceMappingURL=JiraService.d.ts.map