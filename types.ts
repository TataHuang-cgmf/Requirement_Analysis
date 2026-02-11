
export enum ArchitectureType {
  CS = 'C/S (Client/Server)',
  BS = 'B/S (Browser/Server)'
}

export enum AnalysisOrientation {
  REQUIREMENTS = 'requirements-analysis',
  PROBLEM_SOLUTION = 'problem-solution'
}

export enum DatabaseType {
  SQL_SERVER = 'Microsoft SQL Server',
  ORACLE = 'Oracle Database',
  POSTGRESQL = 'PostgreSQL'
}

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  content: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

export interface AnalysisResult {
  markdown: string;
  timestamp: string;
  architecture: ArchitectureType;
  orientation: AnalysisOrientation;
  database: DatabaseType;
}
