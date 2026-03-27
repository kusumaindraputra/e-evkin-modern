export declare const config: {
    env: string;
    port: number;
    corsOrigin: string[];
    database: {
        host: string;
        port: number;
        name: string;
        user: string;
        password: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
    };
    openai: {
        apiKey: string;
        model: string;
    };
};
//# sourceMappingURL=index.d.ts.map