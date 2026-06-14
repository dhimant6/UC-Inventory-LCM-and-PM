export declare class TestHelper {
    static setupTestData(): Promise<{
        team: import("../models/Team").Team;
        user: import("../models/User").User;
        device: import("../models/Device").Device;
        phone: import("../models/Phone").Phone;
    }>;
    static cleanupTestData(): Promise<void>;
}
export declare class ValidationHelper {
    static validateDevice(device: any): string[];
    static validateTeam(team: any): string[];
    static validatePhone(phone: any): string[];
    static validateUser(user: any): string[];
}
//# sourceMappingURL=ValidationHelper.d.ts.map