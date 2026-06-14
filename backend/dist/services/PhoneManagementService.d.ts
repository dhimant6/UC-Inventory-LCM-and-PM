export declare class PhoneManagementService {
    addPhoneNumber(phoneData: any): Promise<any>;
    getAllPhoneNumbers(): Promise<any[]>;
    getPhoneById(phoneId: string): Promise<any>;
    updatePhoneNumber(phoneId: string, updates: any): Promise<any>;
    deletePhoneNumber(phoneId: string): Promise<void>;
    assignPhoneToUser(phoneId: string, userId: string): Promise<any>;
    unassignPhone(phoneId: string): Promise<void>;
    removePhoneNumber(phoneId: string): Promise<void>;
    reassignPhone(phoneId: string, newAssigneeId: string): Promise<any>;
    getPhoneAssignmentHistory(phoneId: string): Promise<any[]>;
    bulkImportPhoneNumbers(phoneDataList: any[]): Promise<any[]>;
}
//# sourceMappingURL=PhoneManagementService.d.ts.map