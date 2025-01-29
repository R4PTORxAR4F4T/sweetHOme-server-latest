import { Module } from '@nestjs/common';
import { ArafatController } from './arafat.controller';
import { ArafatService } from './arafat.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket, Chat, User, Property, Sales, Product } from './arafat.entity';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import * as path from 'path';
import { JwtStrategy } from 'src/jwt/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'root',
      database: 'SweetHome',
      entities: [path.join(__dirname, '/../**/*.entity.{js,ts}')],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Ticket, Chat, Sales, Product, User, Property]),

    // PassportModule and JwtModule
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: '0nLzg@D#k$4^zN!p8yT1c7X&bFsJd9vL',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [ArafatController],
  providers: [ArafatService,JwtStrategy],
  exports: [JwtModule],
})
export class ArafatModule {}
