import { Controller, Get, INestApplication } from '@nestjs/common';
import { afterAll, beforeAll, describe, it } from '@jest/globals';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { Server } from 'node:http';

import { UnmaskIdParam } from '../../masker/decorators/unmask-id-param.decorator';
import { CoreModule } from '../../core.module';
import { MaskerService } from '../../masker';

@Controller('items')
class TestController {
  @Get(':id')
  public getById(@UnmaskIdParam() id: number): { id: number } {
    return { id };
  }
}

describe('UnmaskIdParam', () => {
  let app: INestApplication;
  let maskerService: MaskerService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        CoreModule.forRootAsync({
          useFactory: () => ({
            salt: 'test-salt-for-unmask-param',
          }),
        }),
      ],
      controllers: [TestController],
    }).compile();

    app = moduleRef.createNestApplication();

    await app.init();

    maskerService = moduleRef.get(MaskerService);
  });

  afterAll(async () => {
    await app.close();
  });

  const getHttpServer = (): Server => {
    return app.getHttpServer() as Server;
  };

  describe('valid route parameters', () => {
    it('should unmask the route parameter and return the numeric ID', async () => {
      const maskedId = maskerService.mask(123);

      await request(getHttpServer())
        .get(`/items/${maskedId}`)
        .expect(200)
        .expect({ id: 123 });
    });

    it('should support zero as a route parameter', async () => {
      const maskedId = maskerService.mask(0);

      await request(getHttpServer())
        .get(`/items/${maskedId}`)
        .expect(200)
        .expect({ id: 0 });
    });
  });

  describe('invalid route parameters', () => {
    it('should return HTTP 400 for an invalid masked ID', async () => {
      await request(getHttpServer()).get('/items/invalid!').expect(400);
    });

    it('should return HTTP 404 when the route parameter is empty', async () => {
      await request(getHttpServer()).get('/items/').expect(404);
    });
  });
});
