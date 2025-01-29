import { Test, TestingModule } from '@nestjs/testing';
import { ArafatController } from './arafat.controller';

describe('ArafatController', () => {
  let controller: ArafatController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArafatController],
    }).compile();

    controller = module.get<ArafatController>(ArafatController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
