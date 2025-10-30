export class ContractError extends Error {
  constructor(error: any) {
    super(ContractError.formatError(error));
    this.name = 'ContractError';
  }

  static formatError(error: any): string {
    if (typeof error === 'string') return error;
    
    // Handle ethers contract errors
    if (error.reason) return error.reason;
    if (error.message) return error.message;
    
    return 'Unknown contract error';
  }
}