import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';

@Injectable()
export class AppService {

  getHello(): string {
    return 'Hello World! form 4000 port';
  }

  // private userData = [

  //   {
  //     "username": "ontor",
  //     "password": "ontor123"
  //   },
  //   {
  //     "username": "arafat",
  //     "password": "arafat123"
  //   },
  //   {
  //     "username": "rajib",
  //     "password": "rajibt123"
  //   }

  // ];

  // private blogdata=[]

  // getHome(): string {
  //   return 'Home page';
  // }

  // getAbout(): string {
  //   return 'About page';
  // }

  // postContact(): Record<string, string> {
  //   // Example logic for processing contact details
  //   return {
  //     name: 'Arafat',
  //     email: 'example@gmail.com',
  //     message: 'Here is the message',
  //   };
  // }

  // addNewUser(data){
  //   this.userData.push(data);
  //   return data;
  // }  

  // allUser() : any {
  //   return this.userData;
  // }

  // userInfo(name) : any{
  //   return this.userData.find((data)=> data.username == name ) || {message : "not found"};
  // }

  // getpost(){
  //   return this.blogdata;
  // }

  // createblog(data){

  //   return this.blogdata.push(data)
  // }

}
