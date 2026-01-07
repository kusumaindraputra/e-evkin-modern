import { Request, Response } from 'express';
export declare class LaporanController {
    static findAll(req: Request, res: Response): Promise<void>;
    static findById(req: Request, res: Response): Promise<void>;
    static create(req: Request, res: Response): Promise<void>;
    static bulkCreate(req: Request, res: Response): Promise<void>;
    static bulkUpsert(req: Request, res: Response): Promise<void>;
    static update(req: Request, res: Response): Promise<void>;
    static delete(req: Request, res: Response): Promise<void>;
    static submit(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=laporan.controller.d.ts.map