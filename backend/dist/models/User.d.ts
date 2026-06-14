export interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user' | 'manager';
    teamId?: string;
    avatar?: string;
    password?: string;
    createdAt: string;
    updatedAt: string;
}
export declare const UserModel: {
    create: (user: User) => User;
    findAll: () => any;
    findById: (id: string) => any;
    findByEmail: (email: string) => any;
    update: (id: string, updates: Partial<User>) => void;
    delete: (id: string) => void;
    verifyPassword: (user: User, password: string) => Promise<boolean>;
};
//# sourceMappingURL=User.d.ts.map