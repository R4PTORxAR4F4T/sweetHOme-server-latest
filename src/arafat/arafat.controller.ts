import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, Patch, Post, Query, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ArafatService } from './arafat.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from 'src/jwt/jwt-auth.guard';
import { Request, Response } from 'express';


@Controller('/control')
export class ArafatController {
    constructor(private readonly arafatService: ArafatService) {}

    @Post('/register')
    async register(@Body() data) {
        try {
            if (data.userType === "admin") {
                throw new Error('Access Denied : Admin access required to user this end point');;
            }
            return await this.arafatService.registerUser(data);
        } catch (error) {
            return { message: error.message };
        }
    }

    @Post('/login')
    async login(@Body() body, @Res() res: Response) {
        try {
            const result = await this.arafatService.loginUser(body.email, body.password);

            res.cookie('accessToken', result.accessToken, {
                httpOnly: true,
                secure: false,
                sameSite: 'strict',
                maxAge: 24 * 60 * 60 * 1000,
            });

            res.cookie('userInfo', JSON.stringify({
                userId: result.user.userId,
                userName: result.user.userName,
                email: result.user.email,
                userType: result.user.userType
            }), {
                httpOnly: false,  // Allow frontend access
                secure: false,
                sameSite: 'strict',
                maxAge: 24 * 60 * 60 * 1000, 
            });

            return res.json({
                message: result.message,
                user: result.user,
                accessToken: result.accessToken
            });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    }

    @Post('/sendotp')
    async sendOtp(@Body() data: { email: string }) {
        try {
            return this.arafatService.sendOtpToUser(data.email);
        } catch (error) {
            return { message: error.message };
        }
    }

    @Post('/verifyotp')
    async verifyOtp(@Body() body: { email: string; otp: string }) {
        try {
            return this.arafatService.verifyOtp(body.email, body.otp);
        }catch (error) {
            return { message: error.message };
        }
    }

    @Post('/resetpassword')
    async resetPassword(@Body() body: { email: string; newPassword: string }) {
        try {
            return this.arafatService.resetPassword(body.email, body.newPassword);
        } catch (error) {
            return { message: error.message };
        }
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('logout')
    async logout(@Req() req, @Res() res: Response) {
        try {
            const token = req.cookies.accessToken; 
            if (!token) {
                return res.status(400).json({ message: "No token found" });
            } 

            await this.arafatService.blacklistToken(token);

            // Clear the cookie
            res.clearCookie('accessToken', {
                httpOnly: true,
                secure: false,
                sameSite: 'strict'
            });

            res.clearCookie('userInfo', {
                httpOnly: false,
                secure: false,
                sameSite: 'strict'
            });

            return res.json({ message: "Logout successful" });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
  
    // @Get('/protected')
    // @UseGuards(AuthGuard('jwt'))
    // async getProtectedData(@Request() req) {
    //     try {
    //         const user = await this.arafatService.getUserById(req.user.userId);
    //         return {
    //         message: 'This is protected',
    //         user: {
    //             userId: user.userId,
    //             email: user.email,
    //             userType: user.userType,
    //         },
    //         };
    //     } catch (error) {
    //         return { message: error.message };
    //     }
    // }
  
    // // ==========================================
    // // ============    chat    ==================
    // // ==========================================
  
    // @Post('/createticket')
    // @UseGuards(AuthGuard('jwt'))
    // async createTicket(@Request() req) {
    //     try {
    //         return await this.arafatService.createTicket(req.user.userId);
    //     } catch (error) {
    //         return { message: error.message };
    //     }
    // }
  
    // @Get('/usertickets')
    // @UseGuards(AuthGuard('jwt'))
    // async userTickets(@Request() req) {
    //     try {
    //         return await this.arafatService.userTickets(req.user.userId);

    //     } catch (error) {
    //         return { message: error.message };
    //     }
    // }
  
    // @Get('/activeticket')
    // @UseGuards(AuthGuard('jwt'))
    // async getAllOpenticket(@Request() req) {
    //     try {
    //         if (req.user.userType !== 'admin') {
    //             throw new Error('Access Denied : Admin access required to user this end point');
    //         }
    //         return await this.arafatService.getAllOpenticket();
    //     } catch (error) {
    //         return { message: error.message };
    //     }
    // }
  
    // @Get('/ticketchat/:id')
    // @UseGuards(AuthGuard('jwt'))
    // async getTicketChat(@Param('id') id) {
    //     try {
    //         return await this.arafatService.getTicketChat(id);
    //     } catch (error) {
    //         return { message: error.message };
    //     }
    // }
  
    // @Patch('/updateticket/:id')
    // @UseGuards(AuthGuard('jwt'))
    // async updateticket(@Param('id') id) {
    //     try {
    //         const data = { status: 'close' };
    //         return await this.arafatService.updateticket(id, data);
    //     } catch (error) {
    //         return { message: error.message };
    //     }
    // }

    // @Post('/sendmessage')
    // @UseGuards(AuthGuard('jwt'))
    // async sendMessage(@Request() req, @Body() data) {
    //     try {
    //         return await this.arafatService.sendMessage(req.user.userId,data.ticketId,data.message);
    //     } catch (error) {
    //         return { message: error.message };
    //     }
    // }
  
    // // ==========================================
    // // ============    overview    ==============
    // // ==========================================
  
    // @Get('/overviewdata')
    // // @UseGuards(AuthGuard('jwt'))
    // async overviewData(@Request() req) {
    //     return await this.arafatService.overviewData();
    //     // try {
    //     //     if (req.user.userType !== 'admin') {
    //     //         throw new Error('Access Denied : Admin access required to user this end point');
    //     //     }
    //     //     return await this.arafatService.overviewData();
    //     // } catch (error) {
    //     //     return { message: error.message };
    //     // }
    // }
  
    // // ==========================================
    // // ============    property    ==============
    // // ==========================================
  
    // @Get('/allproperty')
    // @UseGuards(AuthGuard('jwt'))
    // async getAllproperty(@Request() req) {
    //     try {
    //         if (req.user.userType !== 'admin') {
    //             throw new Error('Access Denied : Admin access required to user this end point');
    //         }
    //         return await this.arafatService.getAllproperty();
    //     } catch (error) {
    //         return { message: error.message };
    //     }
    // }
  
    // @Get('/allproperty/:id')
    // @UseGuards(AuthGuard('jwt'))
    // async getproperty(@Request() req,@Param('id') id) {
    //     try {
    //         if (req.user.userType !== 'admin') {
    //             throw new Error('Access Denied : Admin access required to user this end point');
    //         }
    //         return await this.arafatService.getproperty(id);
    //     } catch (error) {
    //         return { message: error.message };
    //     }
    // }
  
    // @Patch('/allproperty/:id')
    // @UseGuards(AuthGuard('jwt'))
    // async updateProperty(@Request() req,@Param('id') id, @Body() data) {
    //     try {
    //         if (req.user.userType !== 'admin') {
    //             throw new Error('Access Denied : Admin access required to user this end point');
    //         }
    //         return await this.arafatService.updateProperty(id, data);
    //     } catch (error) {
    //         return { message: error.message };
    //     }
    // }
  
    // // ==========================================
    // // ============    user    ==================
    // // ==========================================
  
    // // @Get('/alluser')
    // // async getAllUser() {
    // //   try {
    // //     return await this.arafatService.getAllUser();
    // //   } catch (error) {
    // //     return { message: error.message };
    // //   }
    // // }
  
    @Get('/alluser')
    @UseGuards(AuthGuard('jwt'))
    async getUserbyserch(@Req() req: Request, @Query('search') search: string) {
        try {
            const userInfo = JSON.parse(req.cookies.userInfo);
            
            if (userInfo.userType !== 'admin') {
                throw new HttpException('Access Denied: Admin access required to use this endpoint.', HttpStatus.FORBIDDEN);
            }
            
            return await this.arafatService.getUserbyserch(search);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            return { message: error.message };
        }
    }
  
    @Post('/adminadduser')
    @UseGuards(AuthGuard('jwt'))
    async addUser(@Req() req:Request ,@Body() data) {
        try {
            const userInfo = JSON.parse(req.cookies.userInfo);
            
            if (userInfo.userType !== 'admin') {
                throw new HttpException('Access Denied: Admin access required to use this endpoint.', HttpStatus.FORBIDDEN);
            }
            return await this.arafatService.adduser(data);
        } catch (error) {
            return { message: error.message };
        }
    }
  
    @Get('/alluser/:id')
    @UseGuards(AuthGuard('jwt'))
    async getUser(@Req() req:Request,@Param('id') id) {
        try {
            const userInfo = JSON.parse(req.cookies.userInfo);
            
            if (userInfo.userType !== 'admin') {
                throw new HttpException('Access Denied: Admin access required to use this endpoint.', HttpStatus.FORBIDDEN);
            }
            return await this.arafatService.getUser(id);
        } catch (error) {
            return { message: error.message };
        }
    }
  
    @Patch('/alluser/:id')
    @UseGuards(AuthGuard('jwt'))
    async updateuser(@Req() req:Request, @Param('id') id, @Body() data) {
        try {
            const userInfo = JSON.parse(req.cookies.userInfo);
            
            if (userInfo.userType !== 'admin') {
                throw new HttpException('Access Denied: Admin access required to use this endpoint.', HttpStatus.FORBIDDEN);
            }

            if (data.userId) {
                throw new Error('Request Declined: User ID cannot be changed for unique identity.');
            }
            // Validate email
            if (data.email) {
                const user = await this.arafatService.getUser(id);
                if(user.email !== data.email){
                    const existingUser = await this.arafatService.findUserByEmail(data.email);
                    if (existingUser) {
                        throw new Error('Request Declined: Email is already in use.');
                    }
                }
            }

            return await this.arafatService.updateuser(id, data);
        } catch (error) {
            return { message: error.message };
        }
    }

  
    @Delete('/alluser/:id')
    @UseGuards(AuthGuard('jwt'))
    async deleteuser(@Req() req:Request,@Param('id') id) {
      try {
        const userInfo = JSON.parse(req.cookies.userInfo);
            
        if (userInfo.userType !== 'admin') {
            throw new HttpException('Access Denied: Admin access required to use this endpoint.', HttpStatus.FORBIDDEN);
        }
        const user = await this.arafatService.getUser(id);
        if(user.userType === "admin"){
            throw new Error('Request Declined: User cannot Delete.');
        }

        return await this.arafatService.deleteuser(id);
      } catch (error) {
        return { message: error.message };
      }
    }


    // ==========================================
    // ============    logs    ==================
    // ==========================================

    
    @Get('/logs')
    @UseGuards(AuthGuard('jwt'))
    async activitylog(@Req() req: Request) {
        try {
            const userInfo = JSON.parse(req.cookies.userInfo);
            
            if (userInfo.userType !== 'admin') {
                throw new HttpException('Access Denied: Admin access required to use this endpoint.', HttpStatus.FORBIDDEN);
            }

            return await this.arafatService.activitylog();
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            return { message: error.message };
        }
    }

}












