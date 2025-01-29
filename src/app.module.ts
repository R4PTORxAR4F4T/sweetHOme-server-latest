import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ArafatModule } from './arafat/arafat.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Load .env globally
    ArafatModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
