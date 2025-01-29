import { Test, TestingModule } from '@nestjs/testing';
import { ArafatService } from './arafat.service';

describe('ArafatService', () => {
  let service: ArafatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ArafatService],
    }).compile();

    service = module.get<ArafatService>(ArafatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
