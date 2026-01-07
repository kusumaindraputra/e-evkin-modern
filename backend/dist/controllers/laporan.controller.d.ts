import { Request, Response } from 'express';
export declare class LaporanController {
    static findAll(req: Request, res: Response): Promise<void>;
    static findById(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static create(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static bulkCreate(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static bulkUpsert(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static update(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static delete(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static submit(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=laporan.controller.d.ts.map