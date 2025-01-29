import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as dotenv from 'dotenv';
import { ArafatService } from 'src/arafat/arafat.service';
dotenv.config();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private arafatService: ArafatService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
      passReqToCallback: true, 
    });
  }

  async validate(req: any, payload: any) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

    if (this.arafatService.isTokenBlacklisted(token)) {
      throw new UnauthorizedException('Token is blacklisted. Please log in again.');
    }

    return { userId: payload.sub, email: payload.email, userType: payload.userType, token };
  }
}
