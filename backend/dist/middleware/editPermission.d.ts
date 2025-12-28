import { Request, Response, NextFunction } from 'express';
export declare const checkEditPermission: (scope: string) => (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
//# sourceMappingURL=editPermission.d.ts.map