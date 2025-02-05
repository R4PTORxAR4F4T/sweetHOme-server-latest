import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';


  // ==========================================
  // ============    chat    ==================
  // ==========================================

  @Entity()
  export class Ticket {
    @PrimaryGeneratedColumn()
    ticketId: number;

    @Column()
    userId: number;

    @Column({ default: 'open' })
    status: string; //open or close

    @CreateDateColumn()
    createdAt: Date;
  }

  @Entity()
  export class Chat {
    @PrimaryGeneratedColumn()
    chatId: number;

    @Column()
    TicketId: number;

    @Column()
    userId: number;

    @Column('text')
    message: string;

    @CreateDateColumn()
    timestamp: Date;
  }

  // ==========================================
  // ============    overview    ==============
  // ==========================================

  @Entity()
  export class Sales {
    @PrimaryGeneratedColumn()
    salesId: number;

    @Column()
    userId: number;

    @Column()
    saletype: string; //product,sale,rental

    @Column()
    totalPrice: number;

    @CreateDateColumn()
    updatedAt: Date;

  }

  @Entity()
  export class Product {
    @PrimaryGeneratedColumn()
    productId: number;

    @Column()
    userId: number;

    @Column({ length: 200 })
    productName: string;

    @Column({ length: 100 })
    productcategory: string;

    @Column()
    discription: string;

    @Column({ default: 0 })
    likes: number;

    @Column({ type: 'int', default: 0 })
    price: number;

    @CreateDateColumn()
    createdAt: Date;
  }



  // ==========================================
  // ============    property    ==============
  // ==========================================

  @Entity()
  export class Property {
    @PrimaryGeneratedColumn()
    verifyId: number;

    @Column()
    propertyId: string;

    @Column()
    userId: number;

    @CreateDateColumn()
    createdAt: Date;

    @Column({nullable: true})
    propertyType: string;

    @Column({ default: 'pending' })
    verifyStatus: string;

    @Column('json')
    images: string[];

    @Column('json')
    documents: string[];

    @Column({ type: 'int' })
    floors: number;

    @Column({ type: 'int' })
    unitsPerFloor: number;

    @Column('text', { nullable: true })
    description: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    feedback: string;
  }

  // ==========================================
  // ==============    user    ================
  // ==========================================

  @Entity()
  export class User {
    @PrimaryGeneratedColumn()
    userId: number;

    @Column({ length: 200 })
    userName: string;

    @Column()
    password: string;

    @Column()
    email: string;

    @Column({ nullable: true })
    number: number;

    @Column({ nullable: true })
    dob: string;

    @Column({ nullable: true })
    gander: string;

    @Column({ nullable: true })
    address: string;

    @Column()
    userType: string;

    @Column({ nullable: true })
    otp: string;

    @CreateDateColumn()
    expiresAt: Date;

    @CreateDateColumn()
    createdAt: Date;
  }

  

