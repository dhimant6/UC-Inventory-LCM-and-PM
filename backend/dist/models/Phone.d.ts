export interface Phone {
    id: string;
    number: string;
    type: 'mobile' | 'landline' | 'voip';
    teamId: string;
    assignedTo?: string;
    status: 'active' | 'inactive' | 'reserved';
    purchaseDate: string;
    expiryDate?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}
export declare const PhoneModel: {
    create: (phone: Phone) => Phone;
    findAll: () => any;
    findById: (id: string) => any;
    update: (id: string, updates: Partial<Phone>) => void;
    delete: (id: string) => void;
    getByTeam: (teamId: string) => any;
};
//# sourceMappingURL=Phone.d.ts.map