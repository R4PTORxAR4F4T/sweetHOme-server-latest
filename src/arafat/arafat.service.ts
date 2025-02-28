import { Injectable, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, ILike, In, Not, Repository } from 'typeorm';
import { Chat, Product, Property, Sales, Ticket, User } from './arafat.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Twilio } from 'twilio';


@Injectable()
export class ArafatService {

  private otpStorage: Map<string, { otp: string; expiresAt: Date }> = new Map();
  private verified: boolean;
  private twilioClient: Twilio;


  constructor(
    @InjectRepository(Ticket) private ticketRepository: Repository<Ticket>,
    @InjectRepository(Chat) private chatRepository: Repository<Chat>,
    @InjectRepository(Sales) private saleRepository: Repository<Sales>,
    @InjectRepository(Product) private productRepository: Repository<Product>,
    @InjectRepository(Property) private propertyRepository: Repository<Property>,
    @InjectRepository(User) private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {
    this.twilioClient = new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN);
  }

  // ==========================================
  // ============    login    =================
  // ==========================================

  async registerUser(data: any) {

    const user = await this.userRepository.findOne({ where: { email: data.email } });
    if (user) {
      return { message: 'Email already has an account' };
    }
    
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(data.password, salt);
    data.password = hashedPassword;
  
    this.userRepository.save(data);

    return{
      message: "User Created Successfully"
    } 
  }

  async loginUser(email: string, password: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new Error('Invalid email or password');
    }
    let passwordMatch = false;
    if (user.password.startsWith('$2b$')) {
      passwordMatch = await bcrypt.compare(password, user.password);
    } else {
      passwordMatch = user.password === password;
      if (passwordMatch) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        user.password = hashedPassword;
        await this.userRepository.save(user);
      }
    }
    if (!passwordMatch) {
      throw new Error('Invalid email or password');
    }
    const message = "login Successful"
    const payload = { sub: user.userId, email: user.email, userType: user.userType };
    const token = this.jwtService.sign(payload);
  
    return {
      message,
      accessToken: token,
      user: user,
    };
  }

  private tokenBlacklist = [];
  async blacklistToken(token) {
    this.tokenBlacklist.push(token);
    return {
      message: 'Token successfully blacklisted',
    };
  }
  isTokenBlacklisted(token: string): boolean {
    return this.tokenBlacklist.includes(token.trim());
  }
  


  async sendOtpToUser(email: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes

    try {
        const row = await this.userRepository.findOne({ where: { email } });

        if (!row || !row.number) {
            return { message: "Request Declined: Account or phone number not found." };
        }

        await this.userRepository.update({ email }, { otp, expiresAt });

        // Debug: Log the raw phone number from the database
        let phoneNumber = String(row.number).trim();
        console.log("Raw phone number from DB:", phoneNumber);

        // Ensure phone number is in E.164 format for Bangladesh (+880)
        if (!phoneNumber.startsWith("0") && !phoneNumber.startsWith("+880")) {
            phoneNumber = `0${phoneNumber}`; // Add leading zero if missing
        }

        if (phoneNumber.startsWith("0")) {
            phoneNumber = `+880${phoneNumber.slice(1)}`; // Convert "01850477967" -> "+8801850477967"
        }

        // Debug: Log the formatted phone number before sending
        console.log("Formatted phone number:", phoneNumber);

        // Validate number format
        if (!/^\+\d{10,15}$/.test(phoneNumber)) {
            throw new Error(`Invalid phone number format: ${phoneNumber}`);
        }

        // Send OTP via Twilio SMS
        await this.twilioClient.messages.create({
            body: `Your OTP code is: ${otp}. It expires in 5 minutes.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phoneNumber,
        });

        console.log(`OTP sent to ${phoneNumber}: ${otp}`);

        return { message: `OTP sent successfully to ${phoneNumber}` };
    } catch (error) {
        console.error("Failed to send OTP:", error.message);
        throw new Error("Failed to send OTP");
    }
  }

  
  async verifyOtp(email: string, otp: string) {
    try {
        // Fetch OTP data from the database
        const user = await this.userRepository.findOne({ where: { email } });

        if (!user || !user.otp || !user.expiresAt) {
            return { verified: false, message: 'Invalid or expired OTP' };
        }

        // Check if OTP is expired
        const expiresAt = new Date(user.expiresAt);
        if (new Date() > expiresAt) {
            await this.userRepository.update({ email }, { otp: null, expiresAt: new Date(0) }); // Set to past date instead of null
            return { verified: false, message: 'OTP expired' };
        }

        // Check if OTP matches
        if (user.otp !== otp) {
            return { verified: false, message: 'Invalid OTP' };
        }

        // OTP is valid; clear it from the database
        await this.userRepository.update({ email }, { otp: null, expiresAt: new Date(0) }); // Expired timestamp instead of null

        return { verified: true, message: 'OTP verified successfully. You may reset your password now.' };
    } catch (error) {
        console.error("Failed to verify OTP:", error.message);
        throw new Error("Failed to verify OTP");
    }
  }


  async resetPassword(email: string, newPassword: string) {
    try {
        // Fetch user from database
        const user = await this.userRepository.findOne({ where: { email } });

        if (!user) {
            return { success: false, message: 'User not found.' };
        }

        // Ensure OTP was verified (OTP should be null if already used)
        if (user.otp !== null) {
            return { success: false, message: 'Password reset not allowed. Verify OTP first.' };
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user's password and remove OTP details
        await this.userRepository.update(
            { email },
            { password: hashedPassword, otp: null, expiresAt: new Date(0) } // Clear OTP data
        );

        // Cleanup any stored OTP in memory (if used for temporary verification)
        this.otpStorage.delete(email);

        return { success: true, message: 'Password reset successfully.' };
    } catch (error) {
        console.error('Failed to reset password:', error.message);
        throw new Error('Failed to reset password');
    }
  }


  async getUserById(userId: number) {
    try {
      const user = await this.userRepository.findOne({
        where: { userId },
      });
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    } catch (error) {
      throw new Error(`Error fetching user: ${error.message}`);
    }
  }
  

  // ==========================================
  // ============    chat    ==================
  // ==========================================

  async createTicket(userId: number) {
    try{
        
      const openTickets = await this.ticketRepository.find({
        where: { userId: userId, status: 'open' },
      });

      if (openTickets.length >= 3) {
        throw new Error('You cannot create more than 3 open tickets.');
      }

      const newTicket = this.ticketRepository.create({
        userId: userId,
        status: 'open',
        createdAt: new Date(),
      });

        return await this.ticketRepository.save(newTicket);
    } catch (error) {
        throw new Error(`Error creating ticket: ${error.message}`);
    }
  }

  async userTickets(userId: number){
    return await this.ticketRepository.find({where:{status:'open',userId:userId}});
  }

  async getAllOpenticket(){
    const openTickets = await this.ticketRepository.find({ where: { status: 'open' } });

    return openTickets
  }

  getTicketChat(id){
    return this.chatRepository.find({where:{TicketId:id}});
  }

  async updateticket(id,data){
    const row = await this.ticketRepository.findOne({where:{ticketId : id}});

    if(!row)
    {
      return "Ticket not found!";
    }
    
    const new_d = Object.assign(row, data);
    return this.ticketRepository.save(new_d);
  }

  async sendMessage(userId,TicketId,message) {
    try {
      const newMessage = {
        TicketId,
        userId,
        message,
        timestamp: new Date(),
      }
  
      return await this.chatRepository.save(newMessage);
    } catch (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  // ==========================================
  // ============    overview    ==============
  // ==========================================

  async overviewData(){
    const rentalEarnings = await this.saleRepository.find({
      where: { saletype: 'rental' },
      select: ['totalPrice']
    });
    const rentalTotal = rentalEarnings.reduce((sum, sale) => sum + sale.totalPrice, 0);

    const productEarnings = await this.saleRepository.find({
      where: { saletype: 'product' },
      select: ['totalPrice'],
    });
    const productTotal = productEarnings.reduce((sum, sale) => sum + sale.totalPrice, 0);
    
    const saleEarnings = await this.saleRepository.find({
      where: { saletype: 'sale' },
      select: ['totalPrice'],
    });
    const saleTotal = saleEarnings.reduce((sum, sale) => sum + sale.totalPrice, 0);

    const fullEarningsSummary = {rentalTotal,saleTotal,productTotal}

    // for today only
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const todaySales = await this.saleRepository.find({
      where: { updatedAt: Between(startOfDay, endOfDay) },
    });
    const todayEarningsSummary = todaySales.reduce((result, sale) => {
      result[sale.saletype] = (result[sale.saletype] || 0) + sale.totalPrice;
      return result;
    }, {});

    const todayProducts = await this.productRepository.find({
      where: { createdAt: Between(startOfDay, endOfDay) },
    });
    const todayProductlike = todayProducts.reduce((sum, product) => sum + product.likes, 0);
    const todayProductCount = todayProducts.length;
    const todayProduct = { todayProductCount, todayProductlike}

    const todayPropertys = await this.propertyRepository.find({
      where: { createdAt: Between(startOfDay, endOfDay) },
    });
    const todayProperty = todayPropertys.length;

    const todayUsers = await this.userRepository.find({
      where: { createdAt: Between(startOfDay, endOfDay) },
    });
    const todayUserCount = todayUsers.length;

    
    
    
    
    return {fullEarningsSummary,todayEarningsSummary,todayProperty,todayProduct,todayUserCount,}
  }

  // ==========================================
  // ==========   verify property    ==========
  // =================
  // =========================

  getAllproperty(){
    return this.propertyRepository.find({where:{verifyStatus:"pending"}});//
  }

  getproperty(id){
    return this.propertyRepository.findOne({where:{verifyId:id}});
  }

  async updateProperty(id, data){

    console.log(data)
    const row = await this.propertyRepository.findOne({where:{verifyId : id}});

    if(!row)
    {
      return "property not found!";
    }
    
    const new_d = Object.assign(row, data);
    return this.propertyRepository.save(new_d);
  }



  // ==========================================
  // ============    user    ==================
  // ==========================================

  // getAllUser(){
  //   return this.userRepository.find();
  // }

  
  async getUserbyserch(search?: string): Promise<User[]> {
    if (!search) {
      return this.userRepository.find({ where: { userType: Not('admin') } });//
    }

    return this.userRepository.find({
      where: [
        { userId: parseInt(search, 10) || 0 },
        { email: ILike(`%${search}%`) },
        { userName: ILike(`%${search}%`) },
        { number: parseInt(search, 10) || 0 },
      ],
    });
  }

  async adduser(data){

    const user = await this.userRepository.findOne({ where: { email: data.email } });
    if (user) {
      return { message: 'Email already has an account' };
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(data.password, salt);
    data.password = hashedPassword;

    this.userRepository.save(data)
    
    return {
      message: "User Created Successfully"
    };
  }

  getUser(id){
    return this.userRepository.findOne({where:{userId:id}});
  }

  async findUserByEmail(email: string) {
    console.log(email);
    return this.userRepository.findOne({ where: { email } });
  }

  async updateuser(id, data){
    
    const row = await this.userRepository.findOne({where:{userId : id}});
    if(!row){
      return "User not found!";
    }

    const new_d = Object.assign(row, data);
    return this.userRepository.save(new_d);
  }

  deleteuser(id){
    return this.userRepository.delete(id);
  }


  // ==========================================
  // ============    logs    ==================
  // ==========================================
  
  async activitylog(): Promise<string> {
    try {
      const logDirPath = 'C:/Users/ASUS/AppData/Roaming/pgAdmin';
      const files = await fs.readdir(logDirPath);
  
      const logFiles = files
        .filter(file => file.startsWith('pgadmin4.log.'))
        .sort();
  
      if (logFiles.length === 0) {
        throw new Error('No log files found in the directory.');
      }
  
      // Read all log files and concatenate their contents
      const logContents = await Promise.all(
        logFiles.map(file => fs.readFile(path.join(logDirPath, file), 'utf8'))
      );
  
      const allLogs = logContents.join('\n'); // Combine all logs

      // Extract only ERROR messages
      const errorLogs:any = allLogs
        .split('\n')
        .filter(line => line.includes('ERROR')) // Keep only lines with "ERROR"
        .map(line => line.trim()); // Remove unnecessary spaces

      return errorLogs;
    } catch (err) {
      console.error('Error reading log files:', err.message);
      throw new Error('Failed to read the activity logs. Please check the directory path or permissions.');
    }
  }
}
