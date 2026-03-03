import { describe, it, expect, vi, beforeEach } from 'vitest';
import { performRequirementAnalysis } from '../services/geminiService';
import { ArchitectureType, AnalysisOrientation, DatabaseType } from '../types';

global.fetch = vi.fn();

describe('geminiService', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should send correct data to the proxy', async () => {
        const mockResponse = { text: 'Analyzed SRS content' };
        (fetch as any).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockResponse),
        });

        const result = await performRequirementAnalysis(
            'Sample requirement text',
            ArchitectureType.BS,
            AnalysisOrientation.REQUIREMENTS,
            DatabaseType.SQL_SERVER
        );

        expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/analyze', expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('Sample requirement text'),
        }));
        expect(result).toBe('Analyzed SRS content');
    });

    it('should pass custom apiKey to the proxy', async () => {
        (fetch as any).mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ text: 'result' }),
        });

        await performRequirementAnalysis(
            'text',
            ArchitectureType.BS,
            AnalysisOrientation.REQUIREMENTS,
            DatabaseType.SQL_SERVER,
            'my-custom-key'
        );

        expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
            body: expect.stringContaining('"apiKey":"my-custom-key"'),
        }));
    });

    it('should handle API errors correctly', async () => {
        (fetch as any).mockResolvedValue({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ error: 'Server internal error' }),
        });

        await expect(performRequirementAnalysis(
            'text',
            ArchitectureType.BS,
            AnalysisOrientation.REQUIREMENTS,
            DatabaseType.SQL_SERVER
        )).rejects.toThrow('Server internal error');
    });

    it('should handle quota errors', async () => {
        (fetch as any).mockResolvedValue({
            ok: false,
            status: 429,
            json: () => Promise.resolve({ error: 'quota exceeded' }),
        });

        await expect(performRequirementAnalysis(
            'text',
            ArchitectureType.BS,
            AnalysisOrientation.REQUIREMENTS,
            DatabaseType.SQL_SERVER
        )).rejects.toThrow('Gemini 配額不足');
    });
});
