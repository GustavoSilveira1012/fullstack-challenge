/**
 * Unit tests for ApplicationModule
 * 
 * Verifies that the ApplicationModule is correctly configured with all use cases
 * and properly imports the InfrastructureModule.
 */

import { describe, it, expect } from 'bun:test';
import { ApplicationModule } from '../../../src/application/application.module';
import { CreateWalletUseCase } from '../../../src/application/create-wallet.use-case';
import { GetWalletUseCase } from '../../../src/application/get-wallet.use-case';
import { ProcessBetPlacedUseCase } from '../../../src/application/process-bet-placed.use-case';
import { ProcessCashoutUseCase } from '../../../src/application/process-cashout.use-case';
import { ProcessBetLostUseCase } from '../../../src/application/process-bet-lost.use-case';
import { InfrastructureModule } from '../../../src/infrastructure/infrastructure.module';

describe('ApplicationModule', () => {
  it('should be defined', () => {
    expect(ApplicationModule).toBeDefined();
  });

  it('should have correct module metadata', () => {
    // Access the module metadata through the decorator
    const metadata = Reflect.getMetadata('imports', ApplicationModule) || [];
    const providers = Reflect.getMetadata('providers', ApplicationModule) || [];
    const exports = Reflect.getMetadata('exports', ApplicationModule) || [];

    // Verify InfrastructureModule is imported
    expect(metadata).toContain(InfrastructureModule);

    // Verify all use cases are registered as providers
    expect(providers).toContain(CreateWalletUseCase);
    expect(providers).toContain(GetWalletUseCase);
    expect(providers).toContain(ProcessBetPlacedUseCase);
    expect(providers).toContain(ProcessCashoutUseCase);
    expect(providers).toContain(ProcessBetLostUseCase);

    // Verify all use cases are exported
    expect(exports).toContain(CreateWalletUseCase);
    expect(exports).toContain(GetWalletUseCase);
    expect(exports).toContain(ProcessBetPlacedUseCase);
    expect(exports).toContain(ProcessCashoutUseCase);
    expect(exports).toContain(ProcessBetLostUseCase);
  });

  it('should export all five use cases', () => {
    const exports = Reflect.getMetadata('exports', ApplicationModule) || [];
    
    // Verify exactly 5 use cases are exported
    expect(exports.length).toBe(5);
  });

  it('should register all five use cases as providers', () => {
    const providers = Reflect.getMetadata('providers', ApplicationModule) || [];
    
    // Verify exactly 5 use cases are registered
    expect(providers.length).toBe(5);
  });

  it('should import exactly one module (InfrastructureModule)', () => {
    const imports = Reflect.getMetadata('imports', ApplicationModule) || [];
    
    // Verify exactly 1 module is imported
    expect(imports.length).toBe(1);
    expect(imports[0]).toBe(InfrastructureModule);
  });
});
